from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from uuid import UUID

from app.database import get_db
from app.models.domain import Organization, TrustHistory, User
from app.api.deps import get_current_active_user
from app.trust.engine import explain_organization_trust, update_trust_score

router = APIRouter()

@router.get("/explain/{org_id}", response_model=Dict[str, Any])
def get_trust_explainability(
    org_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns full explainability breakdown answering why an organization is trusted at score T.
    """
    explanation = explain_organization_trust(db, org_id)
    if "error" in explanation:
        raise HTTPException(status_code=404, detail=explanation["error"])
    return explanation

@router.get("/history/{org_id}", response_model=List[Dict[str, Any]])
def get_trust_history(
    org_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    records = (
        db.query(TrustHistory)
        .filter(TrustHistory.organization_id == org_id)
        .order_by(TrustHistory.timestamp.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": str(r.id),
            "timestamp": r.timestamp.isoformat() if r.timestamp else "",
            "previous_score": r.previous_score,
            "new_score": r.new_score,
            "delta": round(r.new_score - r.previous_score, 4),
            "reason": r.reason
        }
        for r in records
    ]
