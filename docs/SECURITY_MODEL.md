# THREATSHIELD — COMPREHENSIVE SECURITY & THREAT MODEL

**Classification**: System Threat & Security Specification  
**Version**: `v1.0 — Research Prototype`  
**Date**: August 2026

---

## 1. Threat Landscape & Adversarial Assumptions

ThreatShield assumes a collaborative multi-tenant environment comprising $K$ participating organizations. While most participants are semi-honest or honest, the environment may contain Byzantine adversaries seeking to:
1. Pollute global intrusion detection models via parameter poisoning.
2. Ingest fake, duplicate, or poisoned Cyber Threat Intelligence (CTI) indicators.
3. Infer private network membership via statistical reconstruction.
4. Tamper with historical audit logs to conceal operational compromise.
5. Replay stale or stolen credentials/tokens across tenant boundaries.

---

## 2. Threat & Defense Matrix

| Threat Category | Attack Vector | ThreatShield Defense Mechanism | Detection & Telemetry | Security Evidence / Test | Residual Limitation |
|:---|:---|:---|:---|:---|:---|
| **Model Poisoning** | Malicious client injects Gaussian noise or targeted weight perturbations into $\mathbf{w}_i$ | L2 Euclidean norm anomaly calculation: $A_i = \min(1, \frac{\|\mathbf{w}_i - \mathbf{w}_{\text{med}}\|_2}{\|\mathbf{w}_{\text{med}}\|_2})$. Weight scaling $W_i = T_i Q_i (1-A_i)$. | Server logs anomalous gradient variance ($A_i \to 1.0$) | Tested across 10%–40% noise injection; malicious weight reduced by $99.38\%$–$99.91\%$ | Does not claim resistance against stealthy backdoor attacks with micro-deviations. |
| **Dirty / Duplicate CTI** | Adversary submits duplicate or malformed IOCs to flood SOC feeds | Input normalization (trim, lowercase domains/hashes, IP format validation); duplicate detection sets explicit `DUPLICATE` status | Ledger records `CTI_DUPLICATE_SUBMISSION` | `test_cti_normalization_and_duplicate` passes | Requires analyst review to resolve complex semantic duplicates. |
| **Membership Inference** | Adversary repeatedly queries aggregate stats to infer internal IP participation | Laplace Differential Privacy: $\mathcal{M}(D) = f(D) + \text{Lap}(0, \Delta f / \epsilon)$. Hard budget exhaustion ($\mathcal{B}_{\text{org}} = 10.0\,\epsilon$, $0.5\,\epsilon$ per query). | Privacy engine logs remaining budget per organization; blocks queries exceeding budget with HTTP 403 | `test_differential_privacy_scale` validates budget depletion to $0.0\,\epsilon$ | DP applies to macro aggregate stats, not exact IOC strings. |
| **History Rewriting** | Rogue administrator alters past database entries to conceal malicious actions | Cryptographic SHA-256 hash-chain audit ledger: $\text{hash}_k = \text{SHA-256}(\text{hash}_{k-1} \,\|\, \text{payload\_hash} \,\|\, \text{timestamp})$ with sorted JSON keys | `verify_ledger` traverses block sequence; flags hash mismatch on any single-byte alteration | Tested against 10 corruption test vectors (tampered timestamp, previous hash, payload) | Single-node ledger implementation; not a decentralized blockchain. |
| **Privilege Escalation / IDOR** | Unauthenticated user attempts to access peer tenant records | Stateless JWT Bearer authentication with bcrypt hashing, strict RBAC role bindings, and tenant foreign-key scoping | FastAPI dependency injection (`get_current_active_user`) rejects unverified tokens | `test_api.py` and `test_e2e_lifecycle.py` pass | Role definitions are static in prototype. |
| **Replay & Sybil Attacks** | Adversary replays identical updates across multiple simulated identities | Unique event UUIDs, timestamp freshness checks, and L2 update similarity clustering | Multi-factor trust scoring penalizes redundant updates | `run_sybil_simulation.py` and `test_improvements_regression.py` | Validated under simulated laboratory conditions. |

---

## 3. Honest Disclosures & Non-Claims

- **No Absolute Immunity**: ThreatShield is a research-grade prototype designed to explore multi-factor trust aggregation and differential privacy; it does **not** claim complete immunity against all theoretical adversarial machine learning attacks.
- **Deployment Status**: PostgreSQL and Docker Compose are explicitly marked **NOT VERIFIED / BLOCKED** locally due to lack of local `psql` and inactive Docker daemon. SQLite fallback is certified for local research execution.
