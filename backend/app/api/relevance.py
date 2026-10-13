from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.domain import User, Organization
from app.api.deps import get_current_active_user
from app.relevance.engine import RelevanceAndQualityEngine

router = APIRouter()

class RelevanceRequest(BaseModel):
    severity: float
    confidence: float
    source_trust: float
    created_at: Optional[str] = None
    sightings_count: int = 1

@router.post("/calculate", response_model=Dict[str, Any])
def calculate_threat_scores(
    req: RelevanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    dt = datetime.fromisoformat(req.created_at) if req.created_at else datetime.utcnow()
    quality = RelevanceAndQualityEngine.calculate_cti_quality_score(
        confidence=req.confidence,
        created_at=dt,
        source_trust=req.source_trust
    )
    
    # Mock simple record for relevance computation
    class TempRecord:
        severity = req.severity
        confidence = req.confidence
        created_at = dt

    recipient_org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    relevance = RelevanceAndQualityEngine.calculate_relevance_score(
        cti_record=TempRecord(),
        recipient_org=recipient_org,
        sightings_count=req.sightings_count
    )

    freshness = RelevanceAndQualityEngine.calculate_freshness(dt)

    ts_score = RelevanceAndQualityEngine.calculate_threatshield_score(
        quality_score=quality["quality_score"],
        source_trust=req.source_trust,
        relevance_score=relevance["relevance_score"],
        freshness=freshness
    )

    return {
        "quality": quality,
        "relevance": relevance,
        "threatshield_score": ts_score,
        "freshness": round(freshness, 4)
    }
