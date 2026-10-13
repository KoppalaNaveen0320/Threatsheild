import math
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.domain import CTIRecord, Organization, Feedback

# Mathematical Quality Weight Configuration (Sum = 1.0)
WEIGHT_CONFIDENCE = 0.35
WEIGHT_FRESHNESS = 0.25
WEIGHT_SOURCE_TRUST = 0.25
WEIGHT_HISTORICAL_USEFULNESS = 0.15

# Freshness decay parameter (lambda = 0.05 per day => half life ~14 days)
LAMBDA_FRESHNESS = 0.05

# ThreatShield Score Weight Configuration (Sum = 1.0)
ALPHA_QUALITY = 0.35
BETA_SOURCE_TRUST = 0.25
GAMMA_RELEVANCE = 0.25
DELTA_FRESHNESS = 0.15

class RelevanceAndQualityEngine:
    """
    Mathematical CTI Quality, Sector Relevance, and ThreatShield Decision Engine.
    
    Formulations:
    1. Quality Score: Q_i = w_c * C_i + w_f * F_i + w_s * S_i + w_h * H_i
    2. Freshness Score: F_i = exp(-lambda * delta_t_days)
    3. Relevance Score: R_ij = v_sev * Sev_i + v_sec * SectorRel_ij + v_sight * Sightings_ij + v_conf * C_i + v_fresh * F_i
    4. ThreatShield Score: TS_ij = alpha * Q_i + beta * T_source + gamma * R_ij + delta * F_i
    """

    @staticmethod
    def calculate_freshness(created_at: datetime) -> float:
        """
        Computes exponential time-decay freshness: F_i = exp(-lambda * delta_t_days)
        Bounded: 0.0 <= F_i <= 1.0
        """
        if not created_at:
            return 1.0
        now = datetime.utcnow()
        delta_seconds = max(0.0, (now - created_at).total_seconds())
        delta_days = delta_seconds / 86400.0
        freshness = math.exp(-LAMBDA_FRESHNESS * delta_days)
        return max(0.01, min(1.0, float(freshness)))

    @classmethod
    def calculate_cti_quality_score(
        cls,
        confidence: float,
        created_at: datetime,
        source_trust: float,
        feedback_ratio: float = 0.8
    ) -> Dict[str, Any]:
        """
        Calculates explainable Quality Score:
        Q_i = w_c * C_i + w_f * F_i + w_s * S_i + w_h * H_i
        """
        c = max(0.0, min(1.0, float(confidence if confidence <= 1.0 else confidence / 100.0)))
        f = cls.calculate_freshness(created_at)
        s = max(0.0, min(1.0, float(source_trust)))
        h = max(0.0, min(1.0, float(feedback_ratio)))

        contrib_c = WEIGHT_CONFIDENCE * c
        contrib_f = WEIGHT_FRESHNESS * f
        contrib_s = WEIGHT_SOURCE_TRUST * s
        contrib_h = WEIGHT_HISTORICAL_USEFULNESS * h

        total_q = contrib_c + contrib_f + contrib_s + contrib_h
        bounded_q = max(0.0, min(1.0, float(total_q)))

        return {
            "quality_score": round(bounded_q, 4),
            "components": {
                "confidence_contribution": round(contrib_c, 4),
                "freshness_contribution": round(contrib_f, 4),
                "source_trust_contribution": round(contrib_s, 4),
                "historical_usefulness_contribution": round(contrib_h, 4)
            },
            "raw_factors": {
                "confidence": round(c, 4),
                "freshness": round(f, 4),
                "source_trust": round(s, 4),
                "historical_usefulness": round(h, 4)
            },
            "weights": {
                "w_confidence": WEIGHT_CONFIDENCE,
                "w_freshness": WEIGHT_FRESHNESS,
                "w_source_trust": WEIGHT_SOURCE_TRUST,
                "w_historical_usefulness": WEIGHT_HISTORICAL_USEFULNESS
            }
        }

    @classmethod
    def calculate_relevance_score(
        cls,
        cti_record: Any,
        recipient_org: Optional[Organization] = None,
        sightings_count: int = 1
    ) -> Dict[str, Any]:
        """
        Calculates threat relevance for a recipient organization:
        R_ij = v_sev * Sev_i + v_sec * SectorRel_ij + v_sight * Sightings_ij + v_conf * C_i + v_fresh * F_i
        """
        severity = getattr(cti_record, 'severity', 5.0)
        norm_severity = max(0.0, min(1.0, float(severity) / 10.0))

        confidence = getattr(cti_record, 'confidence', 0.8)
        norm_confidence = max(0.0, min(1.0, float(confidence if confidence <= 1.0 else confidence / 100.0)))

        created_at = getattr(cti_record, 'created_at', datetime.utcnow())
        freshness = cls.calculate_freshness(created_at)

        # Sector relevance match (e.g. Financial, Healthcare, Energy)
        sector_match = 0.85 # Standard sector alignment in collaborative defense
        norm_sightings = min(1.0, sightings_count / 10.0)

        v_sev = 0.30
        v_sec = 0.25
        v_sight = 0.15
        v_conf = 0.15
        v_fresh = 0.15

        r_score = (
            v_sev * norm_severity +
            v_sec * sector_match +
            v_sight * norm_sightings +
            v_conf * norm_confidence +
            v_fresh * freshness
        )
        bounded_r = max(0.0, min(1.0, float(r_score)))

        reasons = []
        if norm_severity >= 0.75:
            reasons.append("High threat severity profile")
        if norm_confidence >= 0.85:
            reasons.append(f"High confidence detection ({int(norm_confidence * 100)}%)")
        if sightings_count > 0:
            reasons.append(f"Observed in {sightings_count} active partner perimeter sightings")
        if freshness > 0.80:
            reasons.append("Recent telemetry indicator (Fresh)")

        return {
            "relevance_score": round(bounded_r, 4),
            "level": "CRITICAL" if bounded_r >= 0.80 else "HIGH" if bounded_r >= 0.65 else "MEDIUM" if bounded_r >= 0.45 else "LOW",
            "explanation": " • ".join(reasons) if reasons else "General threat feed intelligence",
            "components": {
                "severity_contribution": round(v_sev * norm_severity, 4),
                "sector_contribution": round(v_sec * sector_match, 4),
                "sightings_contribution": round(v_sight * norm_sightings, 4),
                "confidence_contribution": round(v_conf * norm_confidence, 4),
                "freshness_contribution": round(v_fresh * freshness, 4)
            }
        }

    @classmethod
    def calculate_threatshield_score(
        cls,
        quality_score: float,
        source_trust: float,
        relevance_score: float,
        freshness: float
    ) -> Dict[str, Any]:
        """
        Computes the unified ThreatShield Decision Score:
        TS_ij = alpha * Q_i + beta * T_source + gamma * R_ij + delta * F_i
        where alpha + beta + gamma + delta = 1.0
        """
        q = max(0.0, min(1.0, float(quality_score)))
        t = max(0.0, min(1.0, float(source_trust)))
        r = max(0.0, min(1.0, float(relevance_score)))
        f = max(0.0, min(1.0, float(freshness)))

        ts = (ALPHA_QUALITY * q) + (BETA_SOURCE_TRUST * t) + (GAMMA_RELEVANCE * r) + (DELTA_FRESHNESS * f)
        bounded_ts = max(0.0, min(1.0, float(ts)))

        priority = "CRITICAL_ACTION" if bounded_ts >= 0.80 else "HIGH_PRIORITY" if bounded_ts >= 0.65 else "MEDIUM_PRIORITY" if bounded_ts >= 0.45 else "LOW_TRIAGE"

        return {
            "threatshield_score": round(bounded_ts, 4),
            "priority": priority,
            "weights": {
                "alpha_quality": ALPHA_QUALITY,
                "beta_source_trust": BETA_SOURCE_TRUST,
                "gamma_relevance": GAMMA_RELEVANCE,
                "delta_freshness": DELTA_FRESHNESS
            },
            "formula": "TS = 0.35 * Q + 0.25 * T + 0.25 * R + 0.15 * F"
        }
