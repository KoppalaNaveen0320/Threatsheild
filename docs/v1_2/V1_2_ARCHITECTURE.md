# ThreatShield v1.2 — System Architecture & Extension Layer

## Executive Overview
ThreatShield v1.2 extends the frozen ThreatShield v1.1 platform with advanced Cyber Threat Intelligence (CTI) correlation, temporal knowledge graph analytics, explainable 6-factor threat scoring, adaptive trust modeling, multi-strategy federated learning (FL) with Byzantine-tolerant aggregation and collusion detection, incident investigation lifecycles, and cross-subsystem security operations correlation.

```
+--------------------------------------------------------------------------------------------------+
|                                    THREATSHIELD v1.2 PLATFORM                                    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   +--------------------------+  +--------------------------+  +------------------------------+   |
|   | Temporal Knowledge Graph |  | ThreatShield Score v2    |  | Adaptive Trust & Risk v2     |   |
|   | • 17 Entity Types        |  | • 6-Factor Mathematical  |  | • Bounded EMA Trust Updates  |   |
|   | • 13 Relationship Types  |  |   Scoring Formulation    |  | • 0-100 Org Risk Score       |   |
|   | • PageRank & Centrality  |  | • Temporal Decay D(t)    |  | • Multi-Stage Attack Corr.   |   |
|   | • Shortest Threat Paths  |  | • Quality Feedback Loop  |  | • Automated Alerts           |   |
|   +--------------------------+  +--------------------------+  +------------------------------+   |
|                                                                                                  |
|   +------------------------------------------------------------------------------------------+   |
|   |                       Advanced Byzantine-Tolerant Federated Learning                     |   |
|   |   • Standard FedAvg             • FedProx (μ Proximal Regularizer)                       |   |
|   |   • Trust-Weighted FedAvg       • Multi-Krum (Distance Matrix Selection)                 |   |
|   |   • Coordinate-wise Median      • Norm-Clipped FedAvg (τ-Threshold)                      |   |
|   |   • Trimmed Mean (β-Cutoff)     • Multi-Client Sybil & Collusion Detector (C_i ∈ [0, 1]) |   |
|   +------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|   +--------------------------+  +--------------------------+  +------------------------------+   |
|   | Incident Investigation   |  | Threat Hunting Workspace |  | Extended Privacy Frontier    |   |
|   | • 6-Stage Incident State |  | • Unified Multi-Entity   |  | • ε ∈ [0.1, 10.0] Tracking   |   |
|   | • CTI & Technique Links  |  |   Search Engine          |  | • Laplace DP Accounting      |   |
|   | • Resolution Audit Trail |  | • MITRE ATT&CK Matrix    |  | • Zero-Sum Masking Protocol  |   |
|   +--------------------------+  +--------------------------+  +------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## 1. Temporal Cyber Threat Knowledge Graph & Analytics
The v1.2 Temporal Knowledge Graph (`backend/app/cti/knowledge_graph.py`) models heterogeneous cyber threat intelligence across 17 distinct entity types and 13 bidirectional relationship types:

### Entity Schema
- **Actors & Infrastructure**: `Organization`, `Threat Actor`, `Campaign`, `IP`, `Domain`, `URL`, `Hash`.
- **Malware & Exploits**: `Malware`, `Vulnerability`, `CVE`, `Attack Pattern`, `MITRE ATT&CK Technique`.
- **Telemetry & Assets**: `Indicator`, `Sighting`, `Incident`, `Asset`, `Sector`.

### Graph Analytics
1. **Degree Centrality**: $C_D(v) = \frac{\text{deg}(v)}{|V| - 1}$ identifies primary nexus points of malicious infrastructure.
2. **PageRank Power Iteration**: $PR(u) = \frac{1-d}{|V|} + d \sum_{v \in B(u)} \frac{PR(v)}{L(v)}$ ranks high-impact adversarial nodes.
3. **Connected Components & Community Detection**: Partitions the graph into distinct threat clusters using synchronous label propagation.
4. **Shortest Threat Path Traversal (BFS)**: Computes optimal multi-hop attack paths from adversarial actors through intermediate malware and CVEs to defended organizational assets, with human-readable natural language explanations.

---

## 2. ThreatShield Decision Score v2 Engine
The v1.2 CTI scoring engine (`backend/app/relevance/engine_v2.py`) implements a 6-factor composite decision formulation:

$$\text{TS}_{v2} = w_1 \cdot Q_{v2} + w_2 \cdot T + w_3 \cdot R + w_4 \cdot F + w_5 \cdot G + w_6 \cdot S$$

$$\sum_{i=1}^6 w_i = 1.00 \quad (w_1=0.25, w_2=0.20, w_3=0.20, w_4=0.15, w_5=0.10, w_6=0.10)$$

Where:
- **$Q_{v2}$ (Quality Score)**: Combines structured IOC completeness, severity weighting, confidence scores, and peer validation feedback ratios.
- **$T$ (Source Trust Score)**: The submitting organization's dynamically maintained trust score $T_i \in [0.05, 1.00]$.
- **$R$ (Contextual Relevance)**: Sector, asset, and threat vector alignment between publisher and consumer.
- **$F$ (Freshness & Temporal Decay)**: $F = \exp(-\lambda \cdot \Delta t)$, decaying relevance over time ($\lambda = 0.05/\text{day}$).
- **$G$ (Graph Centrality)**: Degree centrality of the indicator within the global threat knowledge graph.
- **$S$ (Sighting & Verification)**: Weighted verification frequency from corroborating sensors.

---

## 3. Adaptive Trust & Organization Risk Engine
The v1.2 trust engine (`backend/app/trust/adaptive_engine.py`) provides bounded exponential moving average trust updates and unified organizational risk scoring:

### Adaptive Trust Updates
$$T_i(t) = T_i(t-1) \cdot (1 - \alpha) + \alpha \cdot E_i(t)$$
Where $\alpha = 0.30$ for penalty events (false CTI, duplicate spam, FL poisoning) and $\alpha = 0.15$ for steady positive contributions.

### Organization Risk Score v2 ($0 \le \text{Risk} \le 100$)
$$\text{Risk}_i = \text{Risk}_{\text{Trust Deficit}} + \text{Risk}_{\text{False Positive}} + \text{Risk}_{\text{FL Anomaly}} + \text{Risk}_{\text{Privacy Depletion}}$$

---

## 4. Advanced Federated Learning Aggregation Suite
ThreatShield v1.2 expands beyond FedAvg and Trust-Weighted aggregation with robust Byzantine-tolerant strategies (`fl/server/advanced_strategies.py`):

1. **FedProx**: Incorporates proximal penalty $\frac{\mu}{2} \Vert w - w_t \Vert_2^2$ to stabilize non-IID client convergence.
2. **Multi-Krum**: Selects $m$ client update vectors that minimize sum of Euclidean distances to the $n - f - 2$ nearest peers, effectively discarding Byzantine poisoners.
3. **Clipped FedAvg**: Bounds maximum gradient update perturbation by clipping parameter updates to threshold $\tau$.
4. **Multi-Client Collusion Detector**: Computes pairwise cosine similarity matrices across participating gradient vectors. Pairs exhibiting cosine similarity $> 0.98$ and excessive global mean deviation are flagged with Collusion Scores $C_i \in [0, 1]$.
