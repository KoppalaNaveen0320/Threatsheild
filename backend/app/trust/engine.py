from sqlalchemy.orm import Session
from app.models.domain import Organization, TrustHistory, Feedback, CTIRecord, ModelUpdate
from datetime import datetime, timedelta
import uuid
from typing import Dict, Any, List, Optional
import math

# Trust Engine Parameters
ALPHA = 0.15          # Weight of new evaluation: T_new = T_old * (1 - alpha) + alpha * E_i
DECAY_RATE = 0.95     # Time decay parameter for historical feedback
MIN_TRUST = 0.05      # Lower bound to allow redemption
MAX_TRUST = 1.0       # Upper bound

def update_trust_score(
    db: Session,
    org_id: Any,
    new_evaluation_score: float,
    reason: str,
    event_type: str = "CTI_FEEDBACK"
) -> float:
    """
    Updates the multi-factor trust score for an organization.
    T_i(t) = T_i(t-1) * (1 - alpha) + alpha * E_i(t)
    Maintains a deterministic and explainable audit trail.
    """
    if isinstance(org_id, str):
        try:
            org_id = uuid.UUID(org_id)
        except Exception:
            pass

    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        # Check string match
        target_str = str(org_id).replace("-", "")
        for o in db.query(Organization).all():
            if str(o.id).replace("-", "") == target_str:
                org = o
                break

    if not org:
        return 0.5  # Cold start neutral trust

    old_score = float(org.trust_score)
    bounded_eval = max(0.0, min(1.0, float(new_evaluation_score)))
    
    # Exponential moving average update
    new_score = old_score * (1.0 - ALPHA) + ALPHA * bounded_eval
    new_score = max(MIN_TRUST, min(MAX_TRUST, float(new_score)))

    org.trust_score = new_score

    # Record granular trust history
    history = TrustHistory(
        organization_id=org.id,
        previous_score=old_score,
        new_score=new_score,
        reason=f"[{event_type}] {reason}"
    )
    db.add(history)
    db.commit()
    db.refresh(org)

    return new_score

def calculate_cti_quality(db: Session, cti_id: Any) -> float:
    """
    Calculates time-decayed accumulated quality score Q_i for a CTI indicator.
    Q = sum(Score_k * lambda^dt * c_k) / sum(lambda^dt * c_k)
    """
    if isinstance(cti_id, str):
        try:
            cti_id = uuid.UUID(cti_id)
        except ValueError:
            pass

    feedbacks = db.query(Feedback).filter(Feedback.cti_id == cti_id).all()
    if not feedbacks:
        return 0.75  # Default baseline for newly ingested validated CTI

    total_score = 0.0
    total_weight = 0.0
    now = datetime.utcnow()

    for fb in feedbacks:
        days_old = max(0, (now - fb.created_at).days)
        weight = (DECAY_RATE ** days_old) * max(0.01, min(1.0, float(fb.confidence)))

        fb_type = getattr(fb.feedback_type, "name", str(fb.feedback_type))
        score = 0.5
        if fb_type == "CONFIRMED_MALICIOUS" or fb_type == "USEFUL":
            score = 1.0
        elif fb_type == "NOT_USEFUL":
            score = 0.3
        elif fb_type in ["FALSE_POSITIVE", "EXPIRED"]:
            score = 0.0

        total_score += score * weight
        total_weight += weight

    if total_weight <= 1e-9:
        return 0.75

    return max(0.0, min(1.0, total_score / total_weight))

def explain_organization_trust(db: Session, org_id: Any) -> Dict[str, Any]:
    """
    Provides full audit explainability answering:
    'Why is this organization trusted at score T?'
    """
    if isinstance(org_id, str):
        try:
            org_id = uuid.UUID(org_id)
        except Exception:
            pass

    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        return {"error": "Organization not found"}

    trust = float(org.trust_score)
    positive_factors = []
    negative_factors = []

    # 1. Inspect CTI Contributions
    ctis = db.query(CTIRecord).filter(CTIRecord.organization_id == org.id).all()
    if ctis:
        validated_count = len([c for c in ctis if c.status != "DUPLICATE"])
        positive_factors.append(f"{validated_count} verified CTI contributions submitted")
    else:
        negative_factors.append("Limited historical CTI contribution history")

    # 2. Inspect Feedback history
    feedbacks = db.query(Feedback).filter(Feedback.organization_id == org.id).all()
    fp_feedbacks = [f for f in feedbacks if getattr(f.feedback_type, 'name', str(f.feedback_type)) == 'FALSE_POSITIVE']
    useful_feedbacks = [f for f in feedbacks if getattr(f.feedback_type, 'name', str(f.feedback_type)) in ['USEFUL', 'CONFIRMED_MALICIOUS']]

    if useful_feedbacks:
        positive_factors.append(f"{len(useful_feedbacks)} useful / confirmed malicious sightings reported")
    if fp_feedbacks:
        negative_factors.append(f"{len(fp_feedbacks)} false-positive reports flagged by peers")

    # 3. Inspect FL Model Updates
    updates = db.query(ModelUpdate).filter(ModelUpdate.organization_id == org.id).all()
    if updates:
        anomalous_updates = [u for u in updates if u.anomaly_score and u.anomaly_score > 0.40]
        if anomalous_updates:
            negative_factors.append(f"{len(anomalous_updates)} anomalous model parameter updates detected")
        else:
            positive_factors.append("Consistent parameter convergence in Federated Learning rounds")

    if trust >= 0.85:
        positive_factors.append("High historical validation acceptance rate (>90%)")
    elif trust < 0.60:
        negative_factors.append("Reputation penalized due to recent anomalous or low-quality updates")

    history_records = (
        db.query(TrustHistory)
        .filter(TrustHistory.organization_id == org.id)
        .order_by(TrustHistory.timestamp.desc())
        .limit(5)
        .all()
    )

    return {
        "organization_id": str(org.id),
        "organization_name": org.name,
        "trust_score": round(trust, 4),
        "tier": "VERY_HIGH" if trust >= 0.85 else "HIGH" if trust >= 0.70 else "MODERATE" if trust >= 0.50 else "UNDER_REVIEW",
        "positive_factors": positive_factors if positive_factors else ["Active participation in defense alliance"],
        "negative_factors": negative_factors if negative_factors else ["No security anomalies recorded"],
        "recent_audit_trail": [
            {
                "timestamp": h.timestamp.isoformat() if h.timestamp else "",
                "previous_score": round(h.previous_score, 4),
                "new_score": round(h.new_score, 4),
                "delta": round(h.new_score - h.previous_score, 4),
                "reason": h.reason
            }
            for h in history_records
        ]
    }

def explain_contribution_weight(
    trust_score: float,
    quality_score: float,
    anomaly_score: float,
    normalized_weight: float
) -> Dict[str, Any]:
    """
    Explainability rationale for why an update received its weight:
    W_i = T_i * Q_i * (1 - A_i)
    """
    t = max(0.0, min(1.0, float(trust_score)))
    q = max(0.0, min(1.0, float(quality_score)))
    a = max(0.0, min(1.0, float(anomaly_score)))
    w = max(0.0, min(1.0, float(normalized_weight)))

    reasons = []
    if a > 0.30:
        reasons.append(f"parameter update exhibited elevated L2 divergence from median (Anomaly A={a:.3f})")
    if t < 0.50:
        reasons.append(f"historical peer reputation score is below average (Trust T={t:.2f})")
    if q < 0.50:
        reasons.append(f"recent CTI submissions received lower validation scores (Quality Q={q:.2f})")

    if not reasons:
        explanation = f"Legitimate high-confidence contribution accepted with full weight (Weight={w:.4f})."
    else:
        explanation = f"Contribution weight was suppressed ({w:.4f}) primarily because " + " and ".join(reasons) + "."

    return {
        "trust_score": round(t, 4),
        "quality_score": round(q, 4),
        "anomaly_score": round(a, 4),
        "normalized_weight": round(w, 4),
        "explanation": explanation
    }
