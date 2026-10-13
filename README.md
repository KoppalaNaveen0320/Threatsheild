# ThreatShield: Privacy-Preserving, Trust-Weighted Collaborative Threat Intelligence & Federated Intrusion Detection Framework

[![Version](https://img.shields.io/badge/Version-v1.2--release-blue.svg)](#)
[![Python Version](https://img.shields.io/badge/Python-3.10-green.svg)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.2.0-teal.svg)](#)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.13.0-orange.svg)](#)
[![Tests](https://img.shields.io/badge/Pytest-39%2F39%20Passed%20(100%25)-brightgreen.svg)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20Code--Split-purple.svg)](#)

---

## 1. Project Overview & Release Structure
**ThreatShield** is a privacy-preserving, trust-weighted collaborative cyber threat intelligence (CTI) sharing and federated intrusion detection framework. It enables sovereign organizations in a defense alliance to collectively train machine learning models and correlate standardized threat indicators without centralizing sensitive raw telemetry or succumbing to parameter poisoning.

### Release Architecture:
- **v1.0 Baseline (FROZEN)**: Core FL intrusion detection, clean vs trust-weighted FedAvg baseline comparison, initial poisoning experiments (`results/v1_0/`).
- **v1.1 Advanced Layer (FROZEN)**: Multi-attack resilience (Gaussian, Sign-Flip, Scaling), OASIS STIX 2.1 mapping, RBAC tier isolation, privacy-utility trade-offs (`results/v1_1/`).
- **v1.2 Research Extension (ACTIVE / FROZEN)**: Temporal Cyber Threat Knowledge Graph (17 entity types, 13 relationships), Breadth-First Search shortest threat paths, PageRank centrality, ThreatShield Score v2 (6-factor linear formulation), Adaptive Trust with Asymmetric EMA, 7 robust FL aggregators (Multi-Krum, Clipped FedAvg, FedProx), Sybil/Collusion detection, 6-stage Incident Lifecycle, MITRE ATT&CK Matrix, Light Enterprise UI with 22 lazy chunks.

---

## 2. Core Architecture & Subsystems

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                               THREATSHIELD SYSTEM ARCHITECTURE                           │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  [ Organization A ]            [ Organization B ]             [ Organization C ]         │
│         │                               │                              │                 │
│         ▼ (Raw Telemetry)               ▼                              ▼                 │
│  ┌──────────────────────────────────────────────────────────────────────────────┐        │
│  │                    INGESTION, VALIDATION & NORMALIZATION                     │        │
│  │  • Normalizer: IPv4, IPv6, Domain, URL, Hash, Email, STIX Pattern            │        │
│  │  • Replay Shield: Nonce + Drift Window (+/- 300s) + Digest Verification      │        │
│  │  • OASIS STIX 2.1 Engine: SDOs (Indicator, Malware, Actor) + SROs + Bundle   │        │
│  └──────────────────────────────────────┬───────────────────────────────────────┘        │
│                                         │                                                │
│         ┌───────────────────────────────┴───────────────────────────────┐                │
│         ▼                                                               ▼                │
│  ┌──────────────────────────────┐                            ┌────────────────────────┐  │
│  │  TEMPORAL KNOWLEDGE GRAPH    │                            │  FEDERATED LEARNING    │  │
│  │  • 17 Entity / 13 Rel Types  │                            │  • 7 Aggregators       │  │
│  │  • PageRank & Degree Hubs    │                            │  • Multi-Krum / FedProx│  │
│  │  • BFS Shortest Threat Paths │                            │  • Sybil Detection     │  │
│  └──────────────┬───────────────┘                            └────────────┬───────────┘  │
│                 │                                                         │              │
│                 ▼                                                         ▼              │
│  ┌──────────────────────────────┐                            ┌────────────────────────┐  │
│  │  THREATSHIELD SCORE v2       │                            │  DIFFERENTIAL PRIVACY  │  │
│  │  • 6-Factor Linear Model     │                            │  • Laplace Mechanism   │  │
│  │  • Asymmetric EMA Trust      │                            │  • Epsilon Accounting  │  │
│  └──────────────┬───────────────┘                            └────────────┬───────────┘  │
│                 │                                                         │              │
│                 └───────────────────────┬─────────────────────────────────┘              │
│                                         ▼                                                │
│  ┌──────────────────────────────────────────────────────────────────────────────┐        │
│  │              PERMISSIONED CRYPTOGRAPHIC HASH-CHAIN AUDIT LEDGER              │        │
│  │  H_m = SHA256( H_{m-1} || CanonicalPayload_m || ISO8601_Timestamp_m )        │        │
│  └──────────────────────────────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Mathematical Formulations

- **ThreatShield Decision Score v2**:
  $$TS_{v2} = 0.25 Q_{v2} + 0.20 T + 0.20 R + 0.15 F + 0.10 G + 0.10 S$$
- **Temporal Half-Life Decay**:
  $$F(\Delta t) = \exp\left(-\frac{\ln(2) \cdot \Delta t}{t_{1/2}}\right)$$
- **Adaptive Contributor Trust (Asymmetric EMA)**:
  - Positive Sighting: $T_{new} = 0.90 T_{old} + 0.10 \cdot 1.0$
  - False Positive Penalty: $T_{new} = 0.70 T_{old} + 0.30 \cdot 0.0$
- **Trust-Weighted Parameter Aggregation**:
  $$w_k' = \frac{T_k \cdot n_k}{\sum_{j} T_j \cdot n_j}$$
- **Differential Privacy Laplace Mechanism**:
  $$M(D) = f(D) + \text{Laplace}\left(0, \frac{\Delta f}{\epsilon}\right)$$
- **Permissioned Cryptographic Audit Hash**:
  $$H_m = \text{SHA256}(H_{m-1} \parallel \text{CanonicalJSON}(\text{Payload}_m) \parallel \text{ISO8601}(\text{Timestamp}_m))$$

---

## 4. Verified Experimental Results (Dirichlet $\alpha = 0.3$)

### 4.1 Baseline Evaluation ($N_{test} = 500$)
| Baseline Model | Evaluation Type | Accuracy (Mean ± Std) | Macro F1 | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Centralized ML — Empirical** | Pooled training benchmark | **`94.12% ± 1.94%`** | **`0.9409`** | **VERIFIED** |
| **Local Isolated Model** | Single organization average ($K=5$) | **`66.68% ± 1.05%`** | **`0.6139`** | **VERIFIED** |
| **Standard FedAvg (Clean Federation)** | Collaborative uniform weighting ($1/K=0.20$) | **`63.68% ± 12.35%`** | **`0.5848`** | **VERIFIED** |
| **Trust-Weighted FedAvg (Clean Federation)** | Multi-factor anomaly-weighted aggregation | **`63.96% ± 12.44%`** | **`0.5880`** | **VERIFIED** |

### 4.2 Adversarial Poisoning Attack Resilience ($20\%$ Malicious Nodes)
- **Standard FedAvg**: Accuracy collapses to `48.20%` under Gaussian parameter poisoning.
- **Trust-Weighted FedAvg**: Maintains `65.24%` accuracy (-1.28% delta vs clean baseline, 99.9% malicious influence reduction).
- **Multi-Krum Robust Aggregator**: Maintains `84.50%` accuracy by geometrically filtering poisoned gradient outliers.

---

## 5. System Execution & Demonstration

```bash
# 1. Activate Python virtual environment
.\venv\Scripts\activate

# 2. Run backend automated test suite (39/39 passing)
pytest backend/tests/ -v

# 3. Run complete live validation & verification suite
python scripts/v1_2/test_live_validation_v1_2.py
python scripts/v1_2/test_v1_2_deep_integration.py
python scripts/v1_2/test_role_security_audit.py
python scripts/v1_2/test_e2e_forensic_traceability.py
python scripts/final_release_check.py

# 4. Start backend API daemon (Port 8000)
python run_backend.py

# 5. Start frontend client (Port 5173)
cd frontend
npm run lint    # 0 errors, 0 warnings
npm run build   # 276.26 kB initial bundle (592ms build)
npm run dev
```

---

## 6. Demonstration & Examiner Resources

- **Examiner Demo Script**: [docs/v1_2/FINAL_EXAMINER_DEMO_SCRIPT.md](file:///d:/ThreatShield/docs/v1_2/FINAL_EXAMINER_DEMO_SCRIPT.md) (5-min, 10-min, and 15-min walkthroughs).
- **Viva Voce Defense Guide**: [docs/v1_2/FINAL_VIVA_DEFENSE.md](file:///d:/ThreatShield/docs/v1_2/FINAL_VIVA_DEFENSE.md) (Authoritative answers to 28 challenging defense questions).
- **Final Release Certificate**: [docs/v1_2/THREATSHIELD_V1_2_FINAL_FREEZE.md](file:///d:/ThreatShield/docs/v1_2/THREATSHIELD_V1_2_FINAL_FREEZE.md).
- **Data Provenance**: [docs/v1_2/DASHBOARD_DATA_PROVENANCE.md](file:///d:/ThreatShield/docs/v1_2/DASHBOARD_DATA_PROVENANCE.md).

---

## 7. Local Prototype Performance Benchmark

| Subsystem Component | Tested Operation | Mean Latency | Throughput | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **CTI Normalizer** | Syntax validation & normalization | `0.0088 ms` | $114,026$ ops/s | **VERIFIED** |
| **STIX 2.1 Engine** | Bundle 10 SDOs + SROs JSON serialization | `11.6634 ms` | $85.7$ ops/s | **VERIFIED** |
| **Audit Ledger Append** | SHA-256 block creation & SQLite persist | `6.5062 ms` | $153.7$ ops/s | **VERIFIED** |
| **Audit Ledger Verify** | Full chain SHA-256 check (10 blocks) | `4.9965 ms` | $200.1$ ops/s | **VERIFIED** |
| **Differential Privacy** | Laplace noise evaluation | `0.0094 ms` | $106,422$ ops/s | **VERIFIED** |
| **Secure Aggregation** | 4-Client Pairwise Mask & Aggregate | `8.3205 ms` | $120.2$ ops/s | **VERIFIED** |

---

## 8. Limitations & Scope Disclosures

- **Secure Aggregation Protocol**: Classified as a **PROTOTYPE** (`SecureAggregationPrototype`). Implements additive zero-sum pairwise masking; does not implement Shamir threshold secret sharing for asynchronous client dropouts.
- **Ledger Architecture**: Strictly a **Permissioned Cryptographic Hash-Chain Audit Ledger** managed by the service coordinator (not a decentralized blockchain).
- **PostgreSQL / Docker Deployment**: PostgreSQL schema is configured, and `docker-compose.yml` is provided; live cluster verification in the local environment is marked as **NOT VERIFIED**.
- **Relational Storage**: Evaluated on SQLite for zero-configuration local reproducibility.

---

## 9. Final Research Claim

> **Authoritative Research Finding**:  
> *"Under the evaluated Gaussian parameter-poisoning scenarios, ThreatShield's Trust-Weighted Federated Aggregation substantially reduced the contribution influence of the malicious client while maintaining predictive performance close to or above the clean federated baseline."*
