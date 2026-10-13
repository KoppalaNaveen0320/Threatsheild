# ThreatShield v1.2 — Official Examiner Demonstration Script

This document provides exact, timed walkthroughs and technical explanations for academic examiners, thesis committees, and cybersecurity evaluators.

---

## 1. 5-Minute Executive Demonstration

### Objective
Demonstrate the core value proposition: collaborative cyber threat intelligence (CTI) sharing with explainable scoring, knowledge graph reasoning, and cryptographic auditability without privacy leakage.

| Minute | Screen / Action | Voice-Over / What You Say | Technical Concept & Provenance |
| :--- | :--- | :--- | :--- |
| **0:00 - 1:00** | **Login & SOC Command Center**<br>• Login as `admin@threatshield.org`<br>• Point to Alliance KPIs & Real-Time Alerts queue. | *"ThreatShield is a privacy-preserving collaborative threat intelligence platform. On the SOC Command Center, we observe real-time telemetry from across the alliance: active threat indicators, aggregate risk scores, and ledger audit health."* | **Endpoint**: `GET /api/analytics/soc-overview`<br>**Concept**: Multi-tenant operational intelligence & aggregate posture. |
| **1:00 - 2:15** | **360° IOC Investigation & Decision Score v2**<br>• Click high-severity IP (`198.51.100.130`).<br>• Open 360° Dossier and expand $TS_{v2}$ Score Breakdown. | *"When an analyst inspects an indicator, ThreatShield does not rely on a black-box heuristic. It computes the explainable ThreatShield Decision Score v2, balancing CTI Quality, Contributor Trust, Graph Centrality, Temporal Decay, ATT&CK severity, and Alliance Consensus."* | **Endpoint**: `GET /api/cti/{id}/investigate`<br>**Formula**: $TS_{v2} = 0.25 Q_{v2} + 0.20 T + 0.20 R + 0.15 F + 0.10 G + 0.10 S$. |
| **2:15 - 3:30** | **Temporal Knowledge Graph & Shortest Threat Path**<br>• Navigate to **Knowledge Graph**.<br>• Filter by `Threat Actor` / `Malware`.<br>• Select `APT29` $\to$ `Cobalt Strike` and click **Find Shortest Path**. | *"ThreatShield correlates multi-organization telemetry using an in-memory knowledge graph of 17 entity types and 13 relationships. Using Breadth-First Search and PageRank, we identify multi-hop attack propagation paths in under 2ms."* | **Endpoint**: `GET /api/analytics/graph/path`<br>**Algorithms**: BFS shortest path, PageRank centrality, community detection. |
| **3:30 - 4:15** | **Incident Response & Adaptive Trust**<br>• Navigate to **Incidents** $\to$ Advance status `INVESTIGATING` $\to$ `RESOLVED`.<br>• Navigate to **Adaptive Trust** to show Organization Risk Score. | *"Every sighting and false positive adjusts contributor trust dynamically via exponential moving average penalties. If an organization submits false alarms, its reputation decreases and its alliance risk score rises."* | **Endpoint**: `PATCH /api/incidents/{id}/status`<br>**Endpoint**: `GET /api/analytics/organizations/{id}/risk`. |
| **4:15 - 5:00** | **Permissioned Hash-Chain Ledger Verification**<br>• Open **Ledger Explorer**.<br>• Click **Verify Cryptographic Chain**. | *"Every critical transaction is audited to an immutable permissioned SHA-256 hash chain. When we trigger chain verification, the server traverses the entire block sequence to verify that zero hashes or timestamps have been tampered with."* | **Endpoint**: `GET /api/ledger/verify`<br>**Concept**: Tamper-evident Merkle hash chain ($O(N)$ audit). |

---

## 2. 10-Minute Complete Investigation Workflow

Follow the end-to-end entity traceability sequence verified in test suites:

### Stage 1: Ingestion & SOC Triage (0:00 - 2:00)
1. **Navigate to CTI Feed / Submit CTI**:
   - Ingest a new indicator: `Value: 198.51.100.205`, `Type: ipv4-addr`, `Description: Cobalt Strike C2 server associated with APT29 Cozy Bear campaign exploiting CVE-2024-21413`, `Severity: 8.8`.
   - **Show**: Ingested record is normalized into OASIS STIX 2.1 JSON specification automatically (`GET /api/cti/{id}/stix`).

### Stage 2: Deep 360° IOC Dossier (2:00 - 4:00)
2. **Open IOC Investigation Dossier**:
   - Inspect **Score Breakdown**:
     - CTI Quality v2 ($Q_{v2}$): Accounts for freshness and confidence.
     - Contributor Trust ($T$): Source organization's historical reputation.
     - Graph Centrality ($R$): Connection density in the alliance graph.
     - Temporal Decay ($F$): Exponential half-life decay function.
     - Extracted Relationships: Automatically parsed MITRE ATT&CK techniques (`T1071.001`, `T1059.001`) and CVEs.

### Stage 3: Knowledge Graph Traversal & Threat Hunting (4:00 - 6:00)
3. **Navigate to Threat Hunting & Knowledge Graph**:
   - Search query: `APT29`.
   - Observe real-time pivot graph: Entity hubs connecting Victim Organizations, Malware Families, C2 Domains, and STIX Indicators.
   - Run **Shortest Threat Path** query between Threat Actor and Compromised Host.

### Stage 4: Incident Lifecycle & Peer Feedback Loop (6:00 - 8:00)
4. **Escalate to Incident & Peer Feedback**:
   - Click **Create Incident** from the IOC view.
   - Advance incident through standardized 6 stages: `NEW` $\to$ `TRIAGED` $\to$ `INVESTIGATING` $\to$ `CONTAINED` $\to$ `RESOLVED` $\to$ `CLOSED`.
   - Submit peer sighting validation (`CONFIRMED_MALICIOUS` or `FALSE_POSITIVE`).
   - Observe closed feedback loop updating source organization trust score in real time.

### Stage 5: FL Research Lab & Ledger Audit (8:00 - 10:00)
5. **Inspect FL Operations, Privacy Budget & Audit Ledger**:
   - Open **FL Security Lab**: View empirical robustness of 7 aggregation algorithms under 4 adversarial attack vectors.
   - Open **Privacy Center**: Demonstrate $\epsilon$-differential privacy noise injection ($b = \Delta f / \epsilon$) and budget tracking.
   - Open **Ledger Explorer**: Verify sequential SHA-256 block hash integrity.

---

## 3. 15-Minute Technical Defense & Architecture Walkthrough

### Deep-Dive Matrix for Technical Questions

| Screen / Feature | What the Examiner Sees | What You Say (Technical Explanation) | Backend Source / Evidence |
| :--- | :--- | :--- | :--- |
| **SOC Command Center** | Alliance KPI metrics, alert stream, recent incidents | *"Aggregates operational metrics across all tenants using SQL aggregations without exposing raw tenant data across unauthorized boundaries."* | `backend/app/api/v1_2_analytics.py`<br>`GET /api/analytics/soc-overview` |
| **IOC Dossier & $TS_{v2}$** | 6-factor mathematical contribution bars & classification | *"ThreatShield Score v2 is a deterministic linear combination of 6 bounded sub-metrics. All factors are normalized in $[0, 1]$ and bounded mathematically."* | `backend/app/relevance/engine_v2.py`<br>`GET /api/cti/{id}/investigate` |
| **Knowledge Graph** | Interactive network topology, node degree, hubs | *"Constructed in-memory using NetworkX/custom adjacency structures. Calculates Degree Centrality and PageRank over all alliance entities."* | `backend/app/cti/knowledge_graph.py`<br>`GET /api/analytics/graph` |
| **Adaptive Trust** | Organization Risk Score $[0, 100]$, Trust history | *"Trust scores adjust dynamically via asymmetric exponential decay: bad submissions penalize trust at $\alpha=0.30$, whereas recovery operates at $\alpha=0.10$."* | `backend/app/trust/adaptive_engine.py`<br>`GET /api/analytics/organizations/{id}/risk` |
| **FL Security Lab** | Multi-aggregator benchmark table & attack comparisons | *"Evaluates 7 robust aggregation rules (FedAvg, FedProx, Multi-Krum, Trimmed Mean, Median, Clipped FedAvg, Trust-Weighted) against Gaussian, Sign-Flip, and Scaling attacks."* | `results/v1_2/multi_attack_experiments_v2.csv`<br>`GET /api/fl/research/aggregators` |
| **Privacy Center** | $\epsilon$-utility trade-off curve, Laplace noise simulator | *"Implements the Laplace Mechanism $M(x) = f(x) + \text{Lap}(\Delta f / \epsilon)$. Each query deducts from the organization's finite privacy budget."* | `backend/app/privacy/engine.py`<br>`GET /api/privacy/budget` |
| **Audit Ledger** | SHA-256 cryptographic block list & tamper validator | *"Permissioned hash-chain where each block stores payload hash, timestamp, previous block hash, and sequential index. Tamper detection verifies cryptographic linkage."* | `backend/app/ledger/engine.py`<br>`GET /api/ledger/verify` |
