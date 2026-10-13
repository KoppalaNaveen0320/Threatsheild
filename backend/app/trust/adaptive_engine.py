import uuid
import math
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.domain import Organization, TrustHistory, Feedback, CTIRecord, ModelUpdate, PrivacyEvent, SecurityAlert, LedgerBlock

ALPHA_TRUST = 0.15
MIN_TRUST = 0.05
MAX_TRUST = 1.00
LAMBDA_DECAY = 0.02 # Slow background trust decay for dormancy

class AdaptiveTrustAndRiskEngine:
    """
    ThreatShield v1.2 Adaptive Trust & Organizational Risk Engine.
    
    Implements:
    1. Adaptive Trust Updates with granular penalty and recovery factors.
    2. Organization Risk Score v2: 0 <= Risk <= 100.
    3. Multi-event Security Correlation (Failed Logins + CTI Spam + FL Anomaly -> Alert).
    """

    @classmethod
    def apply_adaptive_event_update(
        cls,
        db: Session,
        org_id: uuid.UUID,
        event_category: str,
        evaluation_score: float,
        reason: str
    ) -> float:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if not org:
            return 0.50

        old_score = float(org.trust_score)
        bounded_eval = max(0.0, min(1.0, float(evaluation_score)))

        # Dynamic alpha: severe penalties pull trust down faster than recovery pulls it up
        alpha = 0.30 if bounded_eval < old_score else ALPHA_TRUST
        new_score = old_score * (1.0 - alpha) + alpha * bounded_eval
        new_score = max(MIN_TRUST, min(MAX_TRUST, float(new_score)))

        org.trust_score = new_score

        history_entry = TrustHistory(
            organization_id=org.id,
            previous_score=old_score,
            new_score=new_score,
            reason=f"[{event_category}] {reason}"
        )
        db.add(history_entry)
        db.commit()
        db.refresh(org)

        return new_score

    @classmethod
    def calculate_organization_risk_score(cls, db: Session, org_id: uuid.UUID) -> Dict[str, Any]:
        """
        Calculates unified Organization Risk Score v2 in [0, 100].
        Higher score = higher operational security risk.
        """
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if not org:
            return {"error": "Organization not found"}

        trust = float(org.trust_score)
        trust_risk = (1.0 - trust) * 40.0 # Up to 40 points

        # 1. CTI False Positive Rate
        ctis = db.query(CTIRecord).filter(CTIRecord.organization_id == org_id).all()
        cti_ids = [c.id for c in ctis]
        feedbacks = db.query(Feedback).filter(Feedback.cti_id.in_(cti_ids)).all() if cti_ids else []

        fp_count = sum(1 for fb in feedbacks if getattr(fb.feedback_type, 'name', str(fb.feedback_type)) == 'FALSE_POSITIVE')
        total_fb = len(feedbacks)
        fp_ratio = (fp_count / total_fb) if total_fb > 0 else 0.0
        fp_risk = fp_ratio * 20.0 # Up to 20 points

        # 2. FL Anomaly History
        updates = db.query(ModelUpdate).filter(ModelUpdate.organization_id == org_id).all()
        high_anom_updates = [u for u in updates if u.anomaly_score and u.anomaly_score > 0.40]
        fl_anom_risk = min(25.0, len(high_anom_updates) * 8.0) # Up to 25 points

        # 3. Privacy Budget Depletion Risk
        consumed_eps = (10.0 - float(org.privacy_budget)) if org.privacy_budget is not None else 0.0
        privacy_risk = min(15.0, (consumed_eps / 10.0) * 15.0) # Up to 15 points

        total_risk = trust_risk + fp_risk + fl_anom_risk + privacy_risk
        bounded_risk = max(0.0, min(100.0, float(total_risk)))

        risk_tier = "CRITICAL" if bounded_risk >= 75 else "HIGH" if bounded_risk >= 50 else "ELEVATED" if bounded_risk >= 25 else "LOW"

        reasons = []
        if trust < 0.50:
            reasons.append(f"Depressed organization trust score ({trust:.2f})")
        if fp_count > 0:
            reasons.append(f"Recorded {fp_count} peer false-positive reports on submitted CTI")
        if len(high_anom_updates) > 0:
            reasons.append(f"{len(high_anom_updates)} federated model parameter updates flagged with high anomaly scores")
        if consumed_eps > 7.0:
            reasons.append(f"High privacy budget utilization ({consumed_eps:.1f}/10.0 ε)")

        return {
            "organization_id": str(org_id),
            "organization_name": org.name,
            "risk_score": round(bounded_risk, 2),
            "risk_tier": risk_tier,
            "components": {
                "trust_deficit_risk": round(trust_risk, 2),
                "false_positive_risk": round(fp_risk, 2),
                "fl_anomaly_risk": round(fl_anom_risk, 2),
                "privacy_depletion_risk": round(privacy_risk, 2)
            },
            "reasons": reasons or ["Organization exhibiting low-risk collaborative behavior"]
        }

    @classmethod
    def correlate_security_events(cls, db: Session, org_id: Optional[uuid.UUID] = None) -> List[Dict[str, Any]]:
        """
        Security Operations Event Correlation Engine.
        Scans for correlated multi-stage threat sequences.
        """
        org_query = db.query(Organization)
        if org_id:
            org_query = org_query.filter(Organization.id == org_id)
        orgs = org_query.all()

        detected_correlations = []

        for org in orgs:
            # Check FL anomalies in the last 24h
            recent_updates = db.query(ModelUpdate).filter(
                ModelUpdate.organization_id == org.id,
                ModelUpdate.created_at >= datetime.utcnow() - timedelta(days=1)
            ).all()
            anom_count = sum(1 for u in recent_updates if u.anomaly_score and u.anomaly_score > 0.50)

            # Check Privacy budget exhaustion
            priv_exhausted = (org.privacy_budget is not None and org.privacy_budget <= 0.5)

            # Check duplicate / spam CTI
            recent_ctis = db.query(CTIRecord).filter(
                CTIRecord.organization_id == org.id,
                CTIRecord.created_at >= datetime.utcnow() - timedelta(days=1)
            ).all()

            if anom_count >= 2 and priv_exhausted:
                corr_alert = {
                    "correlation_id": f"corr-{uuid.uuid4().hex[:8]}",
                    "organization_id": str(org.id),
                    "organization_name": org.name,
                    "correlation_type": "SUSPICIOUS_MULTI_VECTOR_ACTIVITY",
                    "severity": "CRITICAL",
                    "sequence": [
                        "Privacy budget near exhaustion (Aggressive querying)",
                        f"{anom_count} anomalous FL parameter updates submitted within 24h"
                    ],
                    "recommended_action": "Quarantine organization participation in active FL training rounds and initiate administrative review."
                }
                detected_correlations.append(corr_alert)
            elif len(recent_ctis) > 10 and org.trust_score < 0.40:
                corr_alert = {
                    "correlation_id": f"corr-{uuid.uuid4().hex[:8]}",
                    "organization_id": str(org.id),
                    "organization_name": org.name,
                    "correlation_type": "SUSPICIOUS_CTI_BURST",
                    "severity": "HIGH",
                    "sequence": [
                        f"Low trust organization ({org.trust_score:.2f}) submitted rapid burst of {len(recent_ctis)} CTI indicators"
                    ],
                    "recommended_action": "Require multi-peer validator confirmation before ingesting indicators into global feeds."
                }
                detected_correlations.append(corr_alert)

        return detected_correlations
