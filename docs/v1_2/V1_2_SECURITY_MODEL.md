# ThreatShield v1.2 — Security Architecture & Threat Model

## 1. Trust Boundaries & Threat Model

ThreatShield coordinates cybersecurity telemetry and federated learning across potentially untrusted, competing, or compromised organizations.

```
+-----------------------------------------------------------------------------------------------+
|                                    TRUST BOUNDARIES & THREAT MODEL                            |
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|   UNTRUSTED NETWORK / EXTERNAL ORGANIZATIONS                                                  |
|   +--------------------------+   +--------------------------+   +-------------------------+   |
|   | Organization A (Honest)  |   | Org B (Noisy Contributor)|   | Org C (Malicious Sybil) |   |
|   +--------------------------+   +--------------------------+   +-------------------------+   |
|               |                              |                               |                |
|               +------------------------------+-------------------------------+                |
|                                              |                                                |
|                                     TLS / JWT Boundary                                        |
|                                              v                                                |
|   +---------------------------------------------------------------------------------------+   |
|   | INGESTION & DEFENSE LAYER                                                             |   |
|   | • Multi-Tenant RBAC Guard (ADMIN, ANALYST, VALIDATOR, THREAT_CONSUMER)                |   |
|   | • STIX 2.1 Deduplication & Replay Guard (SHA-256 / 300s Timestamp Window)             |   |
|   | • Laplace Differential Privacy Accounting (Dynamic Budget ε Tracking)                |   |
|   +---------------------------------------------------------------------------------------+   |
|                                              |                                                |
|   +---------------------------------------------------------------------------------------+   |
|   | CORE DEFENSE ENGINES                                                                  |   |
|   | • Adaptive Trust Engine (Asymmetric penalty α=0.30)                                   |   |
|   | • ThreatShield Decision Score v2 Engine (6-Factor Explainability)                     |   |
|   | • Byzantine FL Aggregation Suite (Trust-Weighted, Multi-Krum, Clipped, Collusion)     |   |
|   | • Cryptographic Audit Ledger (SHA-256 Chain + Merkle Roots)                           |   |
|   +---------------------------------------------------------------------------------------+   |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
```

---

## 2. Adversarial Threat Vectors & Mitigations

### 1. False CTI Flooding & Indicator Pollution
- **Adversary Goal**: Degrade defender alert precision by submitting benign IP/domain indicators as high-severity threats.
- **Defense**:
  - Peer Validation Feedback Loop: False positive reports trigger immediate trust penalties ($T_i$).
  - Decision Score v2: $Q_{v2}$ incorporates negative feedback penalties, lowering composite priority from active monitoring feeds.

### 2. Federated Learning Model Poisoning (Gaussian & Sign-Flip)
- **Adversary Goal**: Force the collaborative IDS model to misclassify malicious network flows.
- **Defense**:
  - Trust-Weighted Anomaly Discounting: Updates deviating in L2 norm or cosine similarity from peer consensus receive weight $< 1\%$.
  - Multi-Krum Selection: Discards parameter updates situated in distant Byzantine clusters.
  - Norm-Clipping: Bounds gradient perturbation magnitudes to $\tau=10.0$.

### 3. Coordinated Sybil & Collusion Attacks
- **Adversary Goal**: Multiple compromised accounts submit coordinated parameter updates to circumvent outlier detection.
- **Defense**:
  - Multi-Client Collusion Detector computes pairwise cosine similarity matrices across participating clients. Updates with alignment $> 0.98$ and collective deviation from global median receive elevated Collusion Scores ($C_i$), triggering immediate quarantine.

### 4. Telemetry Replay & Ingestion Tampering
- **Adversary Goal**: Re-broadcast expired or stolen threat indicators to skew temporal freshness scores.
- **Defense**:
  - Replay Shield verifies SHA-256 payload hashes against an in-memory sliding window ($300\text{s}$).
  - Cryptographic Audit Ledger commits block hashes in sequential hash chains, making historical modification mathematically detectable.

### 5. Private Telemetry Reconstruction
- **Adversary Goal**: Query aggregate statistical feeds to deduce whether a target organization observed a specific attack.
- **Defense**:
  - Laplace Differential Privacy adds calibrated noise $X \sim \text{Laplace}(0, \Delta f / \epsilon)$ to statistical frequency queries.
  - Dynamic budget tracking halts queries once an organization's cumulative privacy budget ($\epsilon$) is depleted.
