import math
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.domain import CTIRecord, Organization, Feedback

# ThreatShield Score v2 Weights (Sum = 1.0)
W_QUALITY = 0.25
W_TRUST = 0.20
W_RELEVANCE = 0.20
W_FRESHNESS = 0.15
W_GRAPH = 0.10
W_SIGHTINGS = 0.10

LAMBDA_TEMPORAL = 0.05 # Half life ~14 days

class ThreatShieldScoreV2Engine:
    """
    ThreatShield v1.2 Advanced Threat Intelligence Decision & Temporal Relevance Engine.
    
    Mathematical Formulation:
        TS_v2 = w_q * Q_v2 + w_t * T_source + w_r * R_ij + w_f * F_i + w_g * G_i + w_s * S_i
        where sum(w_i) = 1.0, and TS_v2 in [0.0, 1.0]
    """

    @staticmethod
    def calculate_temporal_decay(created_at: Optional[datetime], lambda_param: float = LAMBDA_TEMPORAL) -> float:
        if not created_at:
            return 1.0
        now = datetime.utcnow()
        delta_days = max(0.0, (now - created_at).total_seconds()) / 86400.0
        decay = math.exp(-lambda_param * delta_days)
        return max(0.01, min(1.0, float(decay)))

    @classmethod
    def calculate_cti_quality_v2(
        cls,
        confidence: float,
        created_at: datetime,
        source_trust: float,
        sightings_count: int,
        feedback_list: list
    ) -> Dict[str, Any]:
        """
        Feedback-driven Quality Estimator (Q_v2).
        Accounts for confirmations, false positive penalties, and temporal decay.
        """
        c = max(0.0, min(1.0, float(confidence if confidence <= 1.0 else confidence / 100.0)))
        f = cls.calculate_temporal_decay(created_at)
        t = max(0.0, min(1.0, float(source_trust)))

        useful_count = sum(1 for fb in feedback_list if getattr(fb.feedback_type, 'name', str(fb.feedback_type)) in ['USEFUL', 'CONFIRMED_MALICIOUS'])
        fp_count = sum(1 for fb in feedback_list if getattr(fb.feedback_type, 'name', str(fb.feedback_type)) == 'FALSE_POSITIVE')
        total_fb = len(feedback_list)

        fb_ratio = (useful_count / total_fb) if total_fb > 0 else 0.85
        fp_penalty = min(0.50, (fp_count / total_fb) * 0.50) if total_fb > 0 else 0.0

        raw_q = (0.30 * c) + (0.25 * f) + (0.25 * t) + (0.20 * fb_ratio) - fp_penalty
        bounded_q = max(0.01, min(1.0, float(raw_q)))

        return {
            "quality_v2": round(bounded_q, 4),
            "factors": {
                "confidence": round(c, 4),
                "freshness": round(f, 4),
                "source_trust": round(t, 4),
                "peer_confirmation_ratio": round(fb_ratio, 4),
                "false_positive_penalty": round(fp_penalty, 4)
            }
        }

    @classmethod
    def calculate_threatshield_score_v2(
        cls,
        cti_record: CTIRecord,
        source_org: Optional[Organization],
        recipient_org: Optional[Organization],
        feedback_list: list,
        graph_centrality: float = 0.50
    ) -> Dict[str, Any]:
        """
        Computes the complete, explainable ThreatShield Decision Score v2.
        """
        conf = getattr(cti_record, 'confidence', 0.85)
        sev = getattr(cti_record, 'severity', 6.0)
        norm_sev = max(0.0, min(1.0, float(sev) / 10.0))
        created_at = getattr(cti_record, 'created_at', datetime.utcnow())

        source_trust = float(source_org.trust_score) if source_org else 0.75
        sightings_count = len(feedback_list)
        norm_sightings = min(1.0, sightings_count / 10.0)

        # 1. Quality v2
        q_data = cls.calculate_cti_quality_v2(conf, created_at, source_trust, sightings_count, feedback_list)
        q_score = q_data["quality_v2"]

        # 2. Relevance v2
        freshness = cls.calculate_temporal_decay(created_at)
        sector_match = 0.85 # Standard sector alignment
        r_score = (0.35 * norm_sev) + (0.25 * sector_match) + (0.20 * norm_sightings) + (0.20 * freshness)
        bounded_r = max(0.0, min(1.0, float(r_score)))

        # 3. ThreatShield Score v2 Calculation
        contrib_q = W_QUALITY * q_score
        contrib_t = W_TRUST * source_trust
        contrib_r = W_RELEVANCE * bounded_r
        contrib_f = W_FRESHNESS * freshness
        contrib_g = W_GRAPH * graph_centrality
        contrib_s = W_SIGHTINGS * norm_sightings

        ts_v2 = contrib_q + contrib_t + contrib_r + contrib_f + contrib_g + contrib_s
        bounded_ts = max(0.0, min(1.0, float(ts_v2)))

        classification = (
            "CRITICAL_ALERT" if bounded_ts >= 0.80
            else "HIGH_PRIORITY" if bounded_ts >= 0.65
            else "ELEVATED_MONITORING" if bounded_ts >= 0.45
            else "INFORMATIONAL_FEED"
        )

        reasons = []
        if norm_sev >= 0.80:
            reasons.append("High severity threat vector")
        if source_trust >= 0.80:
            reasons.append("High-reputation verified contributing organization")
        if sightings_count > 2:
            reasons.append(f"Confirmed in {sightings_count} peer sightings across alliance")
        if graph_centrality >= 0.60:
            reasons.append("Central node connecting multiple threat campaigns in Knowledge Graph")
        if freshness >= 0.85:
            reasons.append("Fresh active telemetry indicator")

        return {
            "threatshield_score_v2": round(bounded_ts, 4),
            "classification": classification,
            "formula": "TS_v2 = 0.25*Q + 0.20*T + 0.20*R + 0.15*F + 0.10*G + 0.10*S",
            "component_breakdown": {
                "quality_contribution": round(contrib_q, 4),
                "trust_contribution": round(contrib_t, 4),
                "relevance_contribution": round(contrib_r, 4),
                "freshness_contribution": round(contrib_f, 4),
                "graph_centrality_contribution": round(contrib_g, 4),
                "sightings_contribution": round(contrib_s, 4)
            },
            "raw_metrics": {
                "quality_v2": q_score,
                "source_trust": source_trust,
                "relevance": round(bounded_r, 4),
                "freshness": round(freshness, 4),
                "graph_centrality": round(graph_centrality, 4),
                "sightings_count": sightings_count
            },
            "explainability_reasons": reasons or ["Standard collaborative intelligence feed item"]
        }
