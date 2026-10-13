# ThreatShield v1.2 Dashboard Data Provenance & Metric Lineage

This document establishes the exact data lineage and mathematical provenance for every KPI, chart, and table rendered on ThreatShield v1.2 dashboards.

---

## 1. SOC Command Center (Admin / Overview)

| UI Metric / Field | API Endpoint | Backend Subsystem | Database Entity / Source | Transformation / Calculation |
| :--- | :--- | :--- | :--- | :--- |
| **Critical Threats** | `GET /api/analytics/soc-overview` | `v1_2_analytics.py` | `CTIRecord` table | `db.query(CTIRecord).filter(CTIRecord.severity >= 8.5).count()` |
| **High Priority Threats** | `GET /api/analytics/soc-overview` | `v1_2_analytics.py` | `CTIRecord` table | `db.query(CTIRecord).filter(severity >= 7.0, severity < 8.5).count()` |
| **Active Incidents** | `GET /api/analytics/soc-overview` | `v1_2_analytics.py` | `Incident` table | `db.query(Incident).filter(Incident.status != 'CLOSED').count()` |
| **High-Risk Organizations** | `GET /api/analytics/soc-overview` | `v1_2_analytics.py` | `Organization` table | `db.query(Organization).filter(Organization.trust_score < 0.40).count()` |
| **Suspicious FL Clients** | `GET /api/analytics/soc-overview` | `v1_2_analytics.py` | `fl_strategy.py` / Anomaly detection | Byzantine detection flags (L2 norm clipping & cosine similarity anomalies) |
| **Privacy Alerts** | `GET /api/analytics/soc-overview` | `v1_2_analytics.py` | `Organization` table | `db.query(Organization).filter(Organization.privacy_budget < 2.0).count()` |
| **Ledger Blocks Count** | `GET /api/analytics/soc-overview` | `v1_2_analytics.py` | `LedgerBlock` table | `db.query(LedgerBlock).count()` |
| **Ledger Integrity** | `GET /api/analytics/soc-overview` | `v1_2_analytics.py` | `ledger.py` verification | Recomputes SHA-256 hash-chain sequentially: `SHA256(prev || payload || ts)` |
| **Threat Activity Timeline** | `GET /api/analytics/soc-overview` | `v1_2_analytics.py` | `CTIRecord` + `Incident` tables | Chronological merge of recent CTI records and incident lifecycle events |
| **Severity Distribution** | `GET /api/analytics/soc-overview` | `v1_2_analytics.py` | `CTIRecord` table | Grouping into `CRITICAL (≥8.5)`, `HIGH (7.0-8.4)`, `MEDIUM (4.0-6.9)`, `LOW (<4.0)` |
| **Organization Risk Posture** | `GET /api/analytics/soc-overview` | `v1_2_analytics.py` | `Organization` table | Categorization by trust score: `LOW (≥0.80)`, `MEDIUM (0.60-0.79)`, `CRITICAL (<0.60)` |
| **Top Priority IOCs** | `GET /api/analytics/soc-overview` | `v1_2_analytics.py` | `CTIRecord` table | `order_by(CTIRecord.severity.desc(), CTIRecord.created_at.desc()).limit(5)` |
| **Top Threat Actors** | `GET /api/analytics/soc-overview` | `v1_2_analytics.py` | `CTIRecord` descriptions & tags | Frequency aggregation of extracted MITRE threat actor identities |
| **Recent Incidents** | `GET /api/analytics/soc-overview` | `v1_2_analytics.py` | `Incident` table | `order_by(Incident.created_at.desc()).limit(5)` |

---

## 2. 360° IOC Investigation Workspace

| UI Field / Tab | API Endpoint | Backend Subsystem | Database Entity / Source | Transformation / Calculation |
| :--- | :--- | :--- | :--- | :--- |
| **ThreatShield Score v2 ($TS_{v2}$)** | `GET /api/cti/{id}/investigate` | `v1_2_analytics.py` | Composite Decision Model | $TS_{v2} = 0.25 Q_{v2} + 0.20 T_{source} + 0.15 R_{graph} + 0.15 F_{decay} + 0.15 G_{attack} + 0.10 S_{sightings}$ |
| **Quality Sub-Score ($Q_{v2}$)** | `GET /api/cti/{id}/investigate` | `scoring.py` | `CTIRecord` attributes | Standardized syntax, STIX compliance, confidence, and source attribution completeness |
| **Trust Sub-Score ($T_{source}$)** | `GET /api/cti/{id}/investigate` | `trust.py` | `Organization.trust_score` | Organization trust rating bounded in $[0.05, 1.00]$ |
| **Graph Relevance ($R_{graph}$)** | `GET /api/cti/{id}/investigate` | `v1_2_analytics.py` | `TemporalKnowledgeGraph` | PageRank & degree centrality score of the indicator node in the graph |
| **Temporal Freshness ($F_{decay}$)** | `GET /api/cti/{id}/investigate` | `v1_2_analytics.py` | `CTIRecord.created_at` | Exponential half-life decay: $F(t) = \exp(-\lambda \cdot \Delta t)$ ($\lambda = \ln(2)/30$) |
| **Severity & ATT&CK ($G_{attack}$)** | `GET /api/cti/{id}/investigate` | `v1_2_analytics.py` | `CTIRecord.severity` + MITRE mapping | Normalized severity score scaled by associated tactic impact |
| **Sightings Consensus ($S_{sightings}$)** | `GET /api/cti/{id}/investigate` | `v1_2_analytics.py` | Peer sightings count | Bounded corroboration bonus: $\min(1.0, \ln(1 + N_{sightings}) / \ln(10))$ |
| **Explainability Reasons** | `GET /api/cti/{id}/investigate` | `v1_2_analytics.py` | Rule Engine | Deterministic natural language sentences explaining top contributing factors |
| **Peer Feedback Submission** | `POST /api/cti/{id}/feedback` | `trust.py` + `ledger.py` | `OrganizationTrustHistory` + `LedgerBlock` | Adjusts source trust (positive $+0.02/+0.05$, false positive penalty $\alpha=0.30$) and seals on ledger |

---

## 3. Incident Response Console

| UI Field / Tab | API Endpoint | Backend Subsystem | Database Entity / Source | Transformation / Calculation |
| :--- | :--- | :--- | :--- | :--- |
| **Incident List** | `GET /api/incidents/` | `v1_2_analytics.py` | `Incident` table | Filterable by `status_filter` (`NEW`, `TRIAGED`, `INVESTIGATING`, `CONTAINED`, `RESOLVED`, `CLOSED`) |
| **Incident Dossier** | `GET /api/incidents/{id}` | `v1_2_analytics.py` | `Incident` + linked CTI + techniques | Aggregates incident timeline, linked indicators, and MITRE techniques |
| **Status Advance** | `PATCH /api/incidents/{id}/status` | `v1_2_analytics.py` + `ledger.py` | `Incident` + `LedgerBlock` | Updates lifecycle state, adds containment notes, and commits an immutable block to ledger |

---

## 4. Adaptive Trust & Organization Risk Center

| UI Field / Tab | API Endpoint | Backend Subsystem | Database Entity / Source | Transformation / Calculation |
| :--- | :--- | :--- | :--- | :--- |
| **Trust Score** | `GET /api/organizations/` | `trust.py` | `Organization.trust_score` | Exponentially updated with asymmetric penalty $\alpha=0.30$ |
| **Organization Risk (0–100)** | `GET /api/analytics/organizations/{id}/risk` | `v1_2_analytics.py` | Multi-Factor Risk Model | $Risk = (1 - Trust) \times 40 + FP_{penalty} (25) + Dup_{penalty} (15) + FL_{penalty} (20)$ |
| **Trust Change Timeline** | `GET /api/trust/history/{id}` | `trust.py` | `OrganizationTrustHistory` | Chronological list of trust changes, reasons, previous scores, and new scores |

---

## 5. Federated Learning Security Lab

| UI Field / Tab | API Endpoint | Backend Subsystem | Database Entity / Source | Transformation / Calculation |
| :--- | :--- | :--- | :--- | :--- |
| **Aggregator Benchmarks** | `GET /api/fl/research/aggregators` | `v1_2_analytics.py` | `results/v1_2/aggregator_benchmarks.csv` | Direct parse of verified empirical results (Mean Acc, Macro F1, Latency across 5 seeds) |
| **Adversarial Poisoning Table** | `GET /api/fl/research/experiments` | `v1_2_analytics.py` | `results/v1_2/experiments_v1_2.csv` | Verified experimental results for Gaussian, Sign Flip, Parameter Scaling, and Sybil attacks |

---

## 6. Differential Privacy Accounting

| UI Field / Tab | API Endpoint | Backend Subsystem | Database Entity / Source | Transformation / Calculation |
| :--- | :--- | :--- | :--- | :--- |
| **Privacy Budget ($\epsilon$)** | `GET /api/privacy/budget` | `privacy.py` | `Organization.privacy_budget` | Deducts query cost $\epsilon_{spent}$ until $0.0$; rejects queries when budget is depleted |
| **Utility Frontier Table** | `GET /api/privacy/utility-frontier` | `v1_2_analytics.py` | `results/v1_2/privacy_utility_frontier.csv` | Empirical MAE and relative error measurements across 1,000 queries per epsilon |

---

## 7. Permissioned Cryptographic Hash-Chain Audit Ledger

| UI Field / Tab | API Endpoint | Backend Subsystem | Database Entity / Source | Transformation / Calculation |
| :--- | :--- | :--- | :--- | :--- |
| **Block Explorer** | `GET /api/ledger/blocks` | `ledger.py` | `LedgerBlock` table | Returns ordered blocks: `index`, `timestamp`, `event_type`, `payload_hash`, `previous_hash`, `current_hash` |
| **Verify Ledger Integrity** | `GET /api/ledger/verify` | `ledger.py` | `LedgerBlock` table | Validates $H_i = \text{SHA256}(H_{i-1} \parallel \text{hash}(\text{payload}_i) \parallel t_i)$ for all $i=1 \dots N$ |
