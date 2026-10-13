from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import User, Organization
from app.api.deps import get_current_active_user
from app.privacy.engine import apply_laplace_noise, consume_privacy_budget

router = APIRouter()

@router.get("/budget")
def get_privacy_budget(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    org = current_user.organization
    return {
        "organization_id": org.id,
        "privacy_budget": org.privacy_budget
    }

@router.get("/stats")
def get_platform_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Consumes budget to get aggregate stats with noise
    epsilon_cost = 0.5
    consume_privacy_budget(db, current_user.organization_id, "get_stats", epsilon_cost)
    
    # Real stats would be queried from DB, using mock for prototype architecture setup
    raw_active_threats = 150
    raw_verified_iocs = 2100
    
    # Sensitivity depends on the query. Let's assume sensitivity = 1 for simple counts
    noisy_active_threats = apply_laplace_noise(raw_active_threats, 1.0, epsilon_cost/2)
    noisy_verified_iocs = apply_laplace_noise(raw_verified_iocs, 1.0, epsilon_cost/2)
    
    return {
        "active_threats": max(0, int(noisy_active_threats)),
        "verified_iocs": max(0, int(noisy_verified_iocs)),
        "epsilon_consumed": epsilon_cost,
        "mechanism": "laplace"
    }

@router.get("/utility-frontier")
def get_privacy_utility_frontier(current_user: User = Depends(get_current_active_user)):
    """
    Returns authentic empirical privacy-utility frontier data across epsilon values.
    """
    import os, csv
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "results", "v1_2", "privacy_utility_v2.csv"))
    if not os.path.exists(csv_path):
        return []
    rows = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)
    return rows

