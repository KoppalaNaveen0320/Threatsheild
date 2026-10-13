from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from pydantic import BaseModel

from app.database import get_db
from app.models.domain import User, FederatedRound, ModelUpdate
from app.api.deps import get_current_active_user

router = APIRouter()

@router.get("/rounds", response_model=List[Dict[str, Any]])
def get_fl_rounds(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    rounds = db.query(FederatedRound).order_by(FederatedRound.round_number.desc()).limit(20).all()
    return [
        {
            "id": str(r.id),
            "round_number": r.round_number,
            "global_model_hash": r.global_model_hash,
            "participating_clients": r.participating_clients,
            "aggregation_method": r.aggregation_method,
            "accuracy": r.accuracy,
            "loss": r.loss,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None
        }
        for r in rounds
    ]

@router.get("/updates", response_model=List[Dict[str, Any]])
def get_model_updates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    updates = db.query(ModelUpdate).order_by(ModelUpdate.created_at.desc()).limit(50).all()
    return [
        {
            "id": str(u.id),
            "organization_id": str(u.organization_id),
            "model_hash": u.model_hash,
            "update_norm": u.update_norm,
            "anomaly_score": u.anomaly_score,
            "trust_score": u.trust_score,
            "quality_score": u.quality_score,
            "contribution_weight": u.contribution_weight,
            "accepted": u.accepted,
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in updates
    ]

@router.get("/research/experiments", response_model=List[Dict[str, Any]])
def get_fl_research_experiments(
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns authentic v1.2 multi-attack research experiment results.
    """
    import os, csv
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "results", "v1_2", "multi_attack_experiments_v2.csv"))
    if not os.path.exists(csv_path):
        return []
    rows = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)
    return rows

@router.get("/research/aggregators", response_model=List[Dict[str, Any]])
def get_fl_research_aggregators(
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns authentic v1.2 7-strategy aggregation comparison results.
    """
    import os, csv
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "results", "v1_2", "multi_aggregation_comparison_v2.csv"))
    if not os.path.exists(csv_path):
        return []
    rows = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)
    return rows

