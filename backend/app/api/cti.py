import hashlib
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.domain import CTIRecord, User, Organization, Feedback, FeedbackEnum
from app.schemas.domain import CTICreate, CTIResponse
from app.api.deps import get_current_active_user
from app.cti.normalizer import CTINormalizer
from app.cti.stix_mapper import STIX21Engine
from app.cti.correlation import ThreatCorrelationEngine
from app.relevance.engine import RelevanceAndQualityEngine
from app.trust.engine import update_trust_score
from app.ledger.engine import append_to_ledger
from app.security.replay import replay_engine

router = APIRouter()

class FeedbackCreate(BaseModel):
    feedback_type: str # USEFUL, NOT_USEFUL, FALSE_POSITIVE, CONFIRMED_MALICIOUS, EXPIRED
    comment: Optional[str] = None
    confidence: Optional[float] = 1.0

@router.post("/", response_model=CTIResponse)
def submit_cti(
    cti_in: CTICreate,
    nonce: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # 1. Normalization & Input Validation
    norm_res = CTINormalizer.normalize_indicator(cti_in.type, cti_in.value)
    if not norm_res.is_valid:
        raise HTTPException(
            status_code=422,
            detail=f"CTI Validation Failed: {'; '.join(norm_res.validation_errors)}"
        )

    normalized_type = norm_res.indicator_type
    normalized_value = norm_res.normalized_value

    # 2. Replay & Duplicate Protection
    canonical_payload = f"{normalized_type}:{normalized_value}:{cti_in.description or ''}:{current_user.organization_id}"
    event_sub_id = f"cti-sub-{nonce or uuid.uuid4().hex[:12]}"
    is_fresh, replay_reason = replay_engine.verify_and_record_event(
        organization_id=str(current_user.organization_id),
        event_id=event_sub_id,
        event_timestamp=datetime.utcnow(),
        payload_canonical_str=canonical_payload,
        nonce=nonce
    )
    if not is_fresh and "Replay attack" in replay_reason:
        raise HTTPException(status_code=409, detail=replay_reason)

    existing_duplicate = db.query(CTIRecord).filter(
        CTIRecord.organization_id == current_user.organization_id,
        CTIRecord.type == normalized_type,
        CTIRecord.value == normalized_value
    ).first()

    initial_status = "DUPLICATE" if existing_duplicate else ("SUSPICIOUS" if norm_res.status == "SUSPICIOUS" else "NEW")

    db_cti = CTIRecord(
        type=normalized_type,
        value=normalized_value,
        description=cti_in.description.strip() if cti_in.description else "",
        severity=max(0.0, min(10.0, float(cti_in.severity))),
        confidence=max(0.0, min(1.0, float(cti_in.confidence))),
        source=cti_in.source.strip() if cti_in.source else "Local Sensor",
        status=initial_status,
        organization_id=current_user.organization_id
    )
    db.add(db_cti)
    db.commit()
    db.refresh(db_cti)

    # 3. Cryptographic Audit Ledger Entry
    event_type = "CTI_DUPLICATE_SUBMISSION" if existing_duplicate else "CTI_SUBMISSION"
    payload = {
        "cti_id": str(db_cti.id),
        "type": db_cti.type,
        "value_hash": hashlib.sha256(db_cti.value.encode('utf-8')).hexdigest(),
        "status": db_cti.status,
        "confidence": db_cti.confidence,
        "severity": db_cti.severity
    }
    append_to_ledger(db, str(current_user.organization_id), event_type, str(db_cti.id), payload)

    return db_cti

@router.get("/", response_model=List[CTIResponse])
def search_cti(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    records = db.query(CTIRecord).offset(skip).limit(limit).all()
    return records

@router.get("/correlation/graph", response_model=Dict[str, Any])
def get_cti_correlation_graph(
    min_severity: Optional[float] = None,
    node_types: Optional[str] = None,
    org_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns authentic STIX 2.1 Threat Relationship Correlation Graph with filtering.
    """
    types_list = [t.strip().lower() for t in node_types.split(",")] if node_types else None
    return ThreatCorrelationEngine.build_correlation_graph(
        db=db,
        node_types=types_list,
        min_severity=min_severity,
        org_filter_id=org_id
    )

@router.get("/{cti_id}", response_model=CTIResponse)
def get_cti(
    cti_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    cti = db.query(CTIRecord).filter(CTIRecord.id == cti_id).first()
    if not cti:
        raise HTTPException(status_code=404, detail="CTI record not found")
    return cti

@router.get("/{cti_id}/scores", response_model=Dict[str, Any])
def get_cti_decision_scores(
    cti_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Computes explainable Quality, Relevance, and ThreatShield Decision Scores for a CTI record.
    """
    cti = db.query(CTIRecord).filter(CTIRecord.id == cti_id).first()
    if not cti:
        raise HTTPException(status_code=404, detail="CTI record not found")

    source_org = db.query(Organization).filter(Organization.id == cti.organization_id).first()
    source_trust = float(source_org.trust_score) if source_org else 0.75
    recipient_org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()

    feedbacks = db.query(Feedback).filter(Feedback.cti_id == cti.id).all()
    useful_count = len([f for f in feedbacks if getattr(f.feedback_type, 'name', str(f.feedback_type)) in ['USEFUL', 'CONFIRMED_MALICIOUS']])
    feedback_ratio = (useful_count / len(feedbacks)) if feedbacks else 0.85

    quality_data = RelevanceAndQualityEngine.calculate_cti_quality_score(
        confidence=cti.confidence,
        created_at=cti.created_at,
        source_trust=source_trust,
        feedback_ratio=feedback_ratio
    )

    relevance_data = RelevanceAndQualityEngine.calculate_relevance_score(
        cti_record=cti,
        recipient_org=recipient_org,
        sightings_count=len(feedbacks)
    )

    freshness = RelevanceAndQualityEngine.calculate_freshness(cti.created_at)

    ts_data = RelevanceAndQualityEngine.calculate_threatshield_score(
        quality_score=quality_data["quality_score"],
        source_trust=source_trust,
        relevance_score=relevance_data["relevance_score"],
        freshness=freshness
    )

    return {
        "cti_id": str(cti.id),
        "quality": quality_data,
        "relevance": relevance_data,
        "threatshield_score": ts_data,
        "freshness": round(freshness, 4)
    }

@router.post("/{cti_id}/feedback")
def submit_cti_feedback(
    cti_id: UUID,
    fb_in: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Submits peer feedback / sighting on a CTI record.
    Closes the CTI feedback loop by updating CTI quality, source organization trust,
    and auditing to the Cryptographic Hash-Chain Ledger.
    """
    cti = db.query(CTIRecord).filter(CTIRecord.id == cti_id).first()
    if not cti:
        raise HTTPException(status_code=404, detail="CTI record not found")

    try:
        fb_enum = FeedbackEnum[fb_in.feedback_type]
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid feedback type: {fb_in.feedback_type}")

    feedback_record = Feedback(
        cti_id=cti.id,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        feedback_type=fb_enum,
        comment=fb_in.comment or "",
        confidence=fb_in.confidence or 1.0
    )
    db.add(feedback_record)
    db.commit()

    # Closed Feedback Loop: Update source organization reputation
    source_eval_score = 1.0 if fb_enum in [FeedbackEnum.CONFIRMED_MALICIOUS, FeedbackEnum.USEFUL] else 0.2 if fb_enum == FeedbackEnum.NOT_USEFUL else 0.0
    updated_trust = update_trust_score(
        db=db,
        org_id=cti.organization_id,
        new_evaluation_score=source_eval_score,
        reason=f"Peer sighting feedback ({fb_enum.name}) on CTI {cti.value}",
        event_type="CTI_SIGHTING_FEEDBACK"
    )

    # Append to Ledger
    payload = {
        "cti_id": str(cti.id),
        "feedback_type": fb_enum.name,
        "source_org_id": str(cti.organization_id),
        "updated_source_trust": updated_trust
    }
    append_to_ledger(db, str(current_user.organization_id), "CTI_FEEDBACK_PROCESSED", str(feedback_record.id), payload)

    return {
        "status": "FEEDBACK_RECORDED",
        "feedback_id": str(feedback_record.id),
        "source_organization_trust": round(updated_trust, 4)
    }

@router.get("/export/stix-bundle")
def export_stix_bundle(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    records = db.query(CTIRecord).filter(CTIRecord.organization_id == org.id).all()
    bundle = STIX21Engine.create_stix_bundle(records, org.name, str(org.id))
    return json.loads(bundle.serialize())

@router.post("/import/stix-bundle")
def import_stix_bundle(
    bundle_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Imports and validates an OASIS STIX 2.1 JSON bundle.
    """
    is_valid, parsed_records, errors = STIX21Engine.parse_and_validate_stix_bundle(bundle_data)
    if not is_valid and not parsed_records:
        raise HTTPException(status_code=422, detail={"errors": errors})

    imported_count = 0
    for r in parsed_records:
        norm = CTINormalizer.normalize_indicator(r["type"], r["value"])
        if norm.is_valid:
            db_cti = CTIRecord(
                type=norm.indicator_type,
                value=norm.normalized_value,
                description=r.get("description", "Imported from STIX 2.1 Bundle"),
                severity=r.get("severity", 6.0),
                confidence=r.get("confidence", 0.8),
                source="STIX 2.1 Bundle Import",
                status=norm.status,
                organization_id=current_user.organization_id
            )
            db.add(db_cti)
            imported_count += 1

    db.commit()
    return {
        "status": "STIX_BUNDLE_PROCESSED",
        "imported_records": imported_count,
        "warnings": errors
    }

@router.get("/{cti_id}/investigate", response_model=Dict[str, Any])
def get_ioc_investigation(
    cti_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns 360-degree IOC intelligence dossier with 6-factor score explainability and relationships.
    """
    cti = db.query(CTIRecord).filter(CTIRecord.id == cti_id).first()
    if not cti:
        raise HTTPException(status_code=404, detail="CTI Record not found")

    source_org = db.query(Organization).filter(Organization.id == cti.organization_id).first()
    recipient_org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    feedbacks = db.query(Feedback).filter(Feedback.cti_id == cti.id).all()

    from app.relevance.engine_v2 import ThreatShieldScoreV2Engine
    from app.cti.knowledge_graph import TemporalKnowledgeGraphEngine

    # Compute graph centrality
    g = TemporalKnowledgeGraphEngine.build_full_graph(db)
    cent_map = g.get("analytics", {}).get("degree_centrality", {})
    g_cent = cent_map.get(str(cti.id), 0.35)

    score_data = ThreatShieldScoreV2Engine.calculate_threatshield_score_v2(
        cti_record=cti,
        source_org=source_org,
        recipient_org=recipient_org,
        feedback_list=feedbacks,
        graph_centrality=g_cent
    )

    # Extract ATT&CK and CVE entities from description
    import re
    desc = cti.description or ""
    cves = re.findall(r"CVE-\d{4}-\d{4,7}", desc, re.IGNORECASE)
    techniques = re.findall(r"T\d{4}(?:\.\d{3})?", desc, re.IGNORECASE)
    actors = []
    malwares = []
    if "apt29" in desc.lower() or "cozy bear" in desc.lower():
        actors.append("APT29 (Cozy Bear)")
    if "cobalt strike" in desc.lower():
        malwares.append("Cobalt Strike Beacon")
    if "lockbit" in desc.lower():
        malwares.append("LockBit Ransomware")

    return {
        "identity": {
            "id": str(cti.id),
            "type": cti.type,
            "value": cti.value,
            "status": cti.status,
            "source_organization_id": str(cti.organization_id),
            "source_organization_name": source_org.name if source_org else "Unknown Organization",
            "source_reputation": float(source_org.trust_score) if source_org else 0.50,
            "created_at": cti.created_at.isoformat() if cti.created_at else "",
            "sightings_count": 1 + len(feedbacks)
        },
        "intelligence": score_data,
        "relationships": {
            "threat_actors": actors or ["Unattributed Threat Entity"],
            "malware_families": malwares or ["Generic Malicious Payload"],
            "cves_exploited": list(set(cves)),
            "mitre_techniques": list(set(t.upper() for t in techniques)),
            "related_graph_nodes": g.get("analytics", {}).get("top_central_threat_hubs", [])[:4]
        },
        "feedback_summary": {
            "total_feedbacks": len(feedbacks),
            "positive_validations": sum(1 for f in feedbacks if getattr(f.feedback_type, 'name', str(f.feedback_type)) in ['USEFUL', 'CONFIRMED_MALICIOUS']),
            "false_positives": sum(1 for f in feedbacks if getattr(f.feedback_type, 'name', str(f.feedback_type)) == 'FALSE_POSITIVE')
        }
    }

