# ThreatShield — Multi-Factor Reputation & Trust Explainability Model

---

## 1. Multi-Factor Trust Architecture

ThreatShield replaces static binary authorization with an adaptive, multi-factor reputation system:

$$T_i(t) = \lambda T_i(t-1) + (1-\lambda) E_i(t)$$
- **Memory Factor ($\lambda$)**: $0.85$ (provides temporal stability and resistance to sudden oscillatory poisoning).
- **Bounds**: $0.05 \le T_i(t) \le 1.00$.

```
┌────────────────────────────────────────────────────────────────────────┐
│                       MULTI-FACTOR REPUTATION MODEL                    │
├────────────────────────────────────────────────────────────────────────┤
│ Positive Contribution Factors (+):                                     │
│ • Verified High-Quality CTI Submissions (Quality Q_i > 0.85)          │
│ • Validated Threat Sightings (USEFUL / CONFIRMED_MALICIOUS)            │
│ • Consistent Parameter Convergence in Federated Learning Rounds        │
│ • High Validation Acceptance Rate (>90%)                              │
│                                                                        │
│ Negative Penalty Factors (-):                                          │
│ • High False-Positive Rate Flagged by Defense Alliance Peers           │
│ • Model Parameter Gradient Divergence (L2 Anomaly A_i > 0.40)          │
│ • Attempted Replay Attacks or Duplicate Ingestion Flooding             │
│ • Cryptographic Hash Chain Mismatch or Tampering Attempts              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Granular Audit Trail & Explainability API

ThreatShield maintains an auditable database table `TrustHistory` recording every score transition:
- `timestamp`: UTC ISO 8601 string
- `previous_score`: Prior floating point reputation
- `new_score`: Updated reputation score
- `delta`: Numerical increment/decrement
- `reason`: Structured human-readable rationale
- `event_type`: Categorized system trigger (`CTI_SIGHTING_FEEDBACK`, `FL_UPDATE_ACCEPTED`, `REPLAY_ATTACK_DETECTED`, `VALIDATION_SUCCESS`).

### API Endpoint: `/api/trust/explain/{org_id}`
```json
{
  "organization_id": "a968bfc7-d199-4535-a6ac-c84b3f7c5055",
  "organization_name": "CyberDefense Alpha",
  "trust_score": 0.8850,
  "tier": "VERY_HIGH",
  "positive_factors": [
    "12 verified CTI contributions submitted",
    "14 useful / confirmed malicious sightings reported",
    "Consistent parameter convergence in Federated Learning rounds",
    "High historical validation acceptance rate (>90%)"
  ],
  "negative_factors": [
    "No security anomalies recorded"
  ],
  "recent_audit_trail": [
    {
      "timestamp": "2026-08-25T04:05:00Z",
      "previous_score": 0.8500,
      "new_score": 0.8850,
      "delta": 0.0350,
      "reason": "[CTI_SIGHTING_FEEDBACK] Peer confirmed malicious CTI 198.51.100.45"
    }
  ]
}
```
