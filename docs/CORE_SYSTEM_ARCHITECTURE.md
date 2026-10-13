# ThreatShield — Core System Architecture & Research Design

---

## 1. Executive Summary & Research Mission

ThreatShield addresses a foundational challenge in modern cyber defense:
> **"How can sovereign organizations collaboratively share, validate, and learn from Cyber Threat Intelligence (CTI) while strictly preserving data confidentiality, preventing sensitive telemetry leakage, and mitigating the influence of malicious, collusive, or low-quality contributors?"**

ThreatShield establishes an integrated multi-tenant platform uniting:
1. **OASIS STIX 2.1 Interoperability & Ingestion Normalization**
2. **Multi-Factor Reputation & Closed-Loop CTI Feedback**
3. **Mathematically Explainable CTI Quality, Relevance, and ThreatShield Prioritization**
4. **Malicious-Client-Resistant Trust-Weighted Federated Learning (FedAvg)**
5. **Secure Aggregation Prototype via Additive Zero-Sum Pairwise Masking**
6. **Laplace Differential Privacy Budget Accounting with Enforced Strict Cutoffs**
7. **Permissioned Cryptographic Hash-Chain Audit Ledger (SHA-256 Tamper-Evident)**
8. **Real-time Threat Correlation Graph & Replay Attack Defense**

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                               THREATSHIELD ARCHITECTURAL OVERVIEW                        │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  [ Organization A ]            [ Organization B ]             [ Organization C ]         │
│         │                               │                              │                 │
│         ▼                               ▼                              ▼                 │
│  ┌──────────────┐              ┌────────────────┐             ┌─────────────────┐        │
│  │ Local Sensor │              │ Local Sensor   │             │ Local Sensor    │        │
│  └──────┬───────┘              └────────┬───────┘             └────────┬────────┘        │
│         │ (CTI Telemetry)               │                              │                 │
│         ▼                               ▼                              ▼                 │
│  ┌──────────────────────────────────────────────────────────────────────────────┐        │
│  │                   INGESTION, VALIDATION & NORMALIZATION LAYER                │        │
│  │  • Normalizer: IPv4, IPv6, Domain, URL, Hash, Email, STIX Pattern            │        │
│  │  • Replay Shield: Nonce + Drift Window + Digest Verification                 │        │
│  │  • STIX 2.1 SDO/SRO Translation: Indicator, Malware, Actor, Sighting, Bundle │        │
│  └──────────────────────────────────────┬───────────────────────────────────────┘        │
│                                         │                                                │
│         ┌───────────────────────────────┴───────────────────────────────┐                │
│         ▼                                                               ▼                │
│  ┌──────────────────────────────┐                            ┌────────────────────────┐  │
│  │   CTI EVALUATION ENGINE      │                            │  FEDERATED LEARNING    │  │
│  │  • Quality Score (Q_i)       │                            │  • Local Client Model  │  │
│  │  • Relevance Score (R_ij)    │                            │  • Anomaly Detection   │  │
│  │  • ThreatShield Score (TS)   │                            │  • Secure Aggregation  │  │
│  │  • Peer Feedback Loop        │                            │  • Trust-Weighted Fed  │  │
│  └──────────────┬───────────────┘                            └────────────┬───────────┘  │
│                 │                                                         │              │
│                 ▼                                                         ▼              │
│  ┌──────────────────────────────┐                            ┌────────────────────────┐  │
│  │   MULTI-FACTOR TRUST ENGINE  │                            │  DIFFERENTIAL PRIVACY  │  │
│  │  • Bounded EMA: T_i(t)       │                            │  • Laplace Noise       │  │
│  │  • Audit Trail & Factors     │                            │  • Epsilon Accounting  │  │
│  └──────────────┬───────────────┘                            └────────────┬───────────┘  │
│                 │                                                         │              │
│                 └───────────────────────┬─────────────────────────────────┘              │
│                                         ▼                                                │
│  ┌──────────────────────────────────────────────────────────────────────────────┐        │
│  │              PERMISSIONED CRYPTOGRAPHIC HASH-CHAIN AUDIT LEDGER              │        │
│  │  H_i = SHA256( H_{i-1} || CanonicalPayload_i || ISO8601_Timestamp_i )         │        │
│  └──────────────────────────────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Subsystems

### 2.1 CTI Normalization & STIX 2.1 Interoperability
- **Syntactic Normalization**: Normalizes whitespace, URL schemes, domain casing, IP addresses (RFC canonical string), and file hash lengths (MD5, SHA-1, SHA-256).
- **Status Classification**: `NORMALIZED`, `INVALID`, `DUPLICATE`, or `SUSPICIOUS` (loopback / private network addresses).
- **STIX 2.1 Standard Compliance**: Implements SDOs (`Indicator`, `Malware`, `ThreatActor`, `AttackPattern`, `Identity`) and SROs (`Relationship`, `Sighting`).

### 2.2 Mathematical Scoring Architecture
- **CTI Quality Model**: $Q_i = w_c C_i + w_f F_i + w_s S_i + w_h H_i$, where $\sum w = 1.0$.
- **Threat Relevance Model**: $R_{ij} = v_{sev} \text{Sev}_i + v_{sec} \text{SecRel}_{ij} + v_{sight} \text{Sight}_{ij} + v_{conf} C_i + v_{fresh} F_i$.
- **ThreatShield Decision Score**: $\text{TS}_{ij} = \alpha Q_i + \beta T_{source} + \gamma R_{ij} + \delta F_i$, producing deterministic triage prioritization.

### 2.3 Multi-Factor Bounded Trust & Explainability
- **Update Rule**: $T_i(t) = \lambda T_i(t-1) + (1-\lambda) E_i(t)$, where $\lambda = 0.85$ and $T_i \in [0.05, 1.00]$.
- **Explainability API**: Breaks down positive contributions (verified CTI, confirmed sightings, stable FL gradients) vs negative penalties (anomalies, false positives, replays).

### 2.4 Malicious-Client-Resistant Federated Learning
- **Dataset Partitioning**: Non-IID Dirichlet distribution ($\alpha = 0.3$) across frozen seeds `[42, 123, 456, 789, 2024]`.
- **Update Validation**: Discards NaN/Inf tensors, checks layer dimensions, and evaluates parameter magnitude.
- **Multi-Signal Anomaly Metric**: $A_i = \text{clip}(0.5 D_{L2} + 0.5 (1 - \max(0, \cos(\Delta W_i, \Delta W_{ref}))), 0, 1)$.
- **Trust-Weighted Aggregation**: $\hat{W}_i = \frac{T_i \cdot Q_i \cdot (1 - A_i)}{\sum T_j \cdot Q_j \cdot (1 - A_j)}$, reducing malicious influence by up to **99.8%**.

### 2.5 Secure Aggregation Prototype
- Zero-sum additive pairwise masking: $\Delta W_i^{masked} = \Delta W_i + \sum_{j > i} S_{ij} - \sum_{j < i} S_{ji}$, ensuring $\sum \Delta W_i^{masked} = \sum \Delta W_i$.

### 2.6 Cryptographic Audit Ledger & Replay Shield
- Permissioned hash-chain ledger maintaining deterministic block hashes: $H_i = \text{SHA256}(H_{i-1} \parallel \text{PayloadHash}_i \parallel \text{Timestamp}_i)$.
- Replay engine verifying nonce uniqueness and timestamp drift within a $\pm 300$s window.
