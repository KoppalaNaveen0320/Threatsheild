from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from uuid import UUID

from app.database import get_db
from app.models.domain import CTIRecord, Organization, Feedback, SecurityAlert, User, RoleEnum, Incident, LedgerBlock
from app.api.deps import get_current_active_user
from app.cti.knowledge_graph import TemporalKnowledgeGraphEngine
from app.relevance.engine_v2 import ThreatShieldScoreV2Engine
from app.trust.adaptive_engine import AdaptiveTrustAndRiskEngine
from app.ledger.engine import verify_ledger

router = APIRouter()

# 1. Temporal Knowledge Graph Endpoints
@router.get("/graph", response_model=Dict[str, Any])
def get_temporal_knowledge_graph(
    min_severity: Optional[float] = None,
    node_types: Optional[str] = None,
    org_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns authentic ThreatShield v1.2 Temporal Cyber Threat Knowledge Graph and graph analytics.
    """
    types_list = [t.strip() for t in node_types.split(",")] if node_types else None
    return TemporalKnowledgeGraphEngine.build_full_graph(
        db=db,
        node_types=types_list,
        min_severity=min_severity,
        org_id=org_id
    )

@router.get("/graph/path", response_model=Dict[str, Any])
def get_graph_path(
    source_id: str = Query(..., description="Source entity ID"),
    target_id: str = Query(..., description="Target entity ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return TemporalKnowledgeGraphEngine.find_shortest_threat_path(db, source_id, target_id)

# 2. ThreatShield Score v2 Explainability
@router.get("/score/explain/{cti_id}", response_model=Dict[str, Any])
def explain_threatshield_score_v2(
    cti_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Computes explainable ThreatShield Decision Score v2 with 6-factor mathematical breakdown.
    """
    cti = db.query(CTIRecord).filter(CTIRecord.id == cti_id).first()
    if not cti:
        raise HTTPException(status_code=404, detail="CTI record not found")

    source_org = db.query(Organization).filter(Organization.id == cti.organization_id).first()
    recipient_org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    feedbacks = db.query(Feedback).filter(Feedback.cti_id == cti.id).all()

    # Get graph centrality for indicator
    full_g = TemporalKnowledgeGraphEngine.build_full_graph(db)
    cent_map = full_g.get("analytics", {}).get("degree_centrality", {})
    g_cent = cent_map.get(str(cti.id), 0.35)

    return ThreatShieldScoreV2Engine.calculate_threatshield_score_v2(
        cti_record=cti,
        source_org=source_org,
        recipient_org=recipient_org,
        feedback_list=feedbacks,
        graph_centrality=g_cent
    )

# 3. Organization Risk & Adaptive Trust Endpoints
@router.get("/organizations/{org_id}/risk", response_model=Dict[str, Any])
def get_organization_risk(
    org_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Computes explainable Organization Risk Score v2 in [0, 100].
    """
    if current_user.role != RoleEnum.ADMIN and org_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Forbidden: Tenant isolation guard")

    return AdaptiveTrustAndRiskEngine.calculate_organization_risk_score(db, org_id)

@router.get("/security-alerts", response_model=List[Dict[str, Any]])
def get_security_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns high-confidence correlated security alerts.
    """
    correlated = AdaptiveTrustAndRiskEngine.correlate_security_events(
        db,
        org_id=None if current_user.role == RoleEnum.ADMIN else current_user.organization_id
    )

    db_alerts = db.query(SecurityAlert).order_by(SecurityAlert.created_at.desc()).limit(20).all()
    out = []
    for a in db_alerts:
        out.append({
            "id": str(a.id),
            "title": a.title,
            "severity": a.severity,
            "trigger_type": a.trigger_type,
            "description": a.description,
            "organization_id": str(a.organization_id) if a.organization_id else None,
            "recommended_action": a.recommended_action,
            "is_resolved": a.is_resolved,
            "created_at": a.created_at.isoformat() if a.created_at else ""
        })

    for c in correlated:
        out.append({
            "id": c["correlation_id"],
            "title": f"Correlated Alert: {c['correlation_type']}",
            "severity": c["severity"],
            "trigger_type": c["correlation_type"],
            "description": " • ".join(c["sequence"]),
            "organization_id": c["organization_id"],
            "recommended_action": c["recommended_action"],
            "is_resolved": False,
            "created_at": ""
        })

    return out

@router.patch("/security-alerts/{alert_id}/resolve", response_model=Dict[str, Any])
def resolve_security_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Acknowledge and mark a security alert as resolved.
    """
    try:
        a_uuid = UUID(alert_id)
        alert = db.query(SecurityAlert).filter(SecurityAlert.id == a_uuid).first()
        if alert:
            alert.is_resolved = True
            db.commit()
            return {"status": "ALERT_RESOLVED", "alert_id": alert_id}
    except Exception:
        pass
    return {"status": "ACKNOWLEDGED", "alert_id": alert_id}


@router.get("/soc-overview", response_model=Dict[str, Any])
def get_soc_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns unified SOC Command Center operational intelligence metrics across alliance.
    """
    total_orgs = db.query(Organization).count()
    active_users = db.query(User).count()
    critical_threats = db.query(CTIRecord).filter(CTIRecord.severity >= 8.5).count()
    high_priority_threats = db.query(CTIRecord).filter(CTIRecord.severity >= 7.0, CTIRecord.severity < 8.5).count()
    active_incidents = db.query(Incident).filter(Incident.status != "CLOSED").count()
    high_risk_orgs = db.query(Organization).filter(Organization.trust_score < 0.40).count()
    suspicious_fl_clients = db.query(Organization).filter(Organization.trust_score < 0.30).count()
    privacy_budget_alerts = db.query(Organization).filter(Organization.privacy_budget < 2.0).count()
    
    # Ledger verification
    blocks_count = db.query(LedgerBlock).count()
    is_ledger_valid = verify_ledger(db)
    
    # Top Active IOCs
    top_iocs_db = db.query(CTIRecord).order_by(CTIRecord.severity.desc(), CTIRecord.created_at.desc()).limit(5).all()
    top_active_iocs = [
        {
            "id": str(i.id),
            "type": i.type,
            "value": i.value,
            "severity": i.severity,
            "status": i.status,
            "created_at": i.created_at.isoformat() if i.created_at else ""
        } for i in top_iocs_db
    ]

    # Threat Actors extracted from CTI
    threat_actor_counts: Dict[str, int] = {}
    for cti in db.query(CTIRecord).all():
        desc = (cti.description or "")
        for actor in ["APT29", "APT28", "Lazarus Group", "Volt Typhoon", "LockBit", "FIN7", "Sandworm"]:
            if actor.lower() in desc.lower():
                threat_actor_counts[actor] = threat_actor_counts.get(actor, 0) + 1
    
    top_threat_actors = [
        {"actor": a, "sightings": cnt}
        for a, cnt in sorted(threat_actor_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    ]

    # Recent Incidents
    recent_incidents_db = db.query(Incident).order_by(Incident.created_at.desc()).limit(5).all()
    recent_incidents = [
        {
            "id": str(inc.id),
            "title": inc.title,
            "severity": inc.severity,
            "status": inc.status,
            "created_at": inc.created_at.isoformat() if inc.created_at else ""
        } for inc in recent_incidents_db
    ]

    # Severity & Risk Distributions
    sev_counts = {
        "CRITICAL": critical_threats,
        "HIGH": high_priority_threats,
        "MEDIUM": db.query(CTIRecord).filter(CTIRecord.severity >= 4.0, CTIRecord.severity < 7.0).count(),
        "LOW": db.query(CTIRecord).filter(CTIRecord.severity < 4.0).count()
    }

    risk_counts = {
        "CRITICAL": high_risk_orgs,
        "HIGH": db.query(Organization).filter(Organization.trust_score >= 0.40, Organization.trust_score < 0.60).count(),
        "MEDIUM": db.query(Organization).filter(Organization.trust_score >= 0.60, Organization.trust_score < 0.80).count(),
        "LOW": db.query(Organization).filter(Organization.trust_score >= 0.80).count()
    }

    # Threat Activity Timeline
    timeline = []
    for c in top_iocs_db[:3]:
        timeline.append({
            "timestamp": c.created_at.isoformat() if c.created_at else "",
            "event_type": "CTI_INGESTION",
            "title": f"Indicator Ingested: {c.value} ({c.type})",
            "severity": "CRITICAL" if c.severity >= 8.5 else "HIGH"
        })
    for inc in recent_incidents_db[:3]:
        timeline.append({
            "timestamp": inc.created_at.isoformat() if inc.created_at else "",
            "event_type": "INCIDENT_CREATED",
            "title": f"Incident Raised: {inc.title}",
            "severity": inc.severity
        })
    timeline.sort(key=lambda x: x["timestamp"], reverse=True)

    return {
        "kpis": {
            "total_organizations": total_orgs,
            "active_users": active_users,
            "critical_threats_count": critical_threats,
            "high_priority_threats_count": high_priority_threats,
            "active_incidents_count": active_incidents,
            "high_risk_organizations_count": high_risk_orgs,
            "suspicious_fl_clients_count": suspicious_fl_clients,
            "privacy_budget_alerts_count": privacy_budget_alerts,
            "ledger_blocks_count": blocks_count,
            "ledger_integrity": "INTACT" if is_ledger_valid else "INTEGRITY_FAILURE"
        },
        "top_active_iocs": top_active_iocs,
        "top_threat_actors": top_threat_actors,
        "recent_incidents": recent_incidents,
        "severity_distribution": sev_counts,
        "risk_distribution": risk_counts,
        "threat_activity_timeline": timeline
    }


