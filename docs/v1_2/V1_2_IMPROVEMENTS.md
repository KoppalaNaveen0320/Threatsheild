# ThreatShield v1.2 — System Improvements & Functional Enhancements

## Summary of Completed Enhancements

| Subsystem | v1.1 Baseline | v1.2 Enhancement | Solved Cybersecurity Problem |
| :--- | :--- | :--- | :--- |
| **CTI Graph & Correlation** | 2-entity indicator-CVE correlation graph | 17-entity Temporal Cyber Threat Knowledge Graph with PageRank & BFS shortest attack paths | Enables analysts to map multi-stage attacker campaigns from initial threat actors to target organizational assets. |
| **CTI Decision Scoring** | Static quality and sector relevance score | Explainable 6-Factor ThreatShield Score v2 with temporal exponential decay $D(t) = \exp(-\lambda t)$ | Eliminates reliance on stale threat indicators and prioritizes high-impact, fresh, corroborated telemetry. |
| **Organizational Trust** | Periodic feedback-driven trust adjustment | Adaptive Trust Engine with asymmetric penalty/recovery $\alpha$ and 0-100 Organization Risk Score | Prevents adversarial trust gaming, penalizes Sybil activity, and provides SOCs with real-time org posture scoring. |
| **FL Robustness** | FedAvg, Trust-Weighted, Median, Trimmed Mean | Added FedProx ($\mu$), Multi-Krum ($m$), Clipped FedAvg ($\tau$), and Pairwise Collusion Detector ($C_i$) | Defends against sophisticated Byzantine adversaries executing coordinated Sybil parameter poisoning and gradient sign flips. |
| **Privacy Engineering** | Fixed Laplace mechanism ($\epsilon=1.0$) | Extended Privacy-Utility Frontier ($\epsilon \in [0.1, 10.0]$) with dynamic budget depletion tracking | Quantifies trade-offs between mathematical differential privacy guarantees and analytical query utility for SOC analysts. |
| **Incident Response** | Ad-hoc threat hunting queries | Full Incident Lifecycle (`NEW` -> `TRIAGED` -> `INVESTIGATING` -> `CONTAINED` -> `RESOLVED` -> `CLOSED`) | Streamlines enterprise SOC triage, links CTI indicators directly to incidents, and maintains an immutable resolution audit log. |
| **Threat Hunting** | Basic text search on IOC table | Unified multi-entity search workspace with interactive MITRE ATT&CK enterprise tactic matrix | Enables proactive threat hunters to identify organizational attack surface coverage gaps across enterprise techniques. |
| **Security Operations** | Disconnected logging events | Correlated multi-stage security alerts (e.g. Failed logins + CTI bursts + FL anomalies) | Detects coordinated lateral movement and insider threat behavior across multiple collaborative vectors. |

---

## Technical Implementations

### 1. Temporal Cyber Threat Knowledge Graph Engine (`backend/app/cti/knowledge_graph.py`)
- Supported Entity Types: `Organization`, `Indicator`, `IP`, `Domain`, `URL`, `Hash`, `Malware`, `Threat Actor`, `Attack Pattern`, `MITRE ATT&CK Technique`, `CVE`, `Vulnerability`, `Sighting`, `Campaign`, `Incident`, `Asset`, `Sector`.
- Algorithms: Degree Centrality, Power Iteration PageRank, Connected Components, Label Propagation Community Detection, BFS Shortest Path Traversal with Natural Language Explanations.

### 2. ThreatShield Decision Score v2 Engine (`backend/app/relevance/engine_v2.py`)
- Formula: $\text{TS}_{v2} = 0.25 Q_{v2} + 0.20 T + 0.20 R + 0.15 F + 0.10 G + 0.10 S$.
- Classification Tiers: `CRITICAL_ALERT` ($\ge 0.80$), `HIGH_PRIORITY` ($\ge 0.65$), `ELEVATED_MONITORING` ($\ge 0.45$), `INFORMATIONAL_FEED` ($< 0.45$).

### 3. Adaptive Trust & Organization Risk Engine (`backend/app/trust/adaptive_engine.py`)
- Dynamic Trust Update: $T_i(t) = T_i(t-1) \cdot (1 - \alpha) + \alpha \cdot E_i(t)$ with penalty factor $\alpha=0.30$.
- Organization Risk Score v2: Unified $[0, 100]$ score evaluated across trust deficit, false positive rate, FL parameter anomalies, and privacy budget depletion.

### 4. Advanced Byzantine-Tolerant FL Suite (`fl/server/advanced_strategies.py`)
- Multi-Krum Selection: Evaluates Euclidean distance matrices to filter Byzantine poisoners.
- FedProx Regularizer: Stabilizes non-IID client convergence with proximal coefficient $\mu=0.01$.
- Clipped FedAvg: Bounds update magnitudes to $\tau=10.0$.
- Sybil & Collusion Detector: Computes pairwise cosine similarity matrices and identifies coordinated adversarial updates.
