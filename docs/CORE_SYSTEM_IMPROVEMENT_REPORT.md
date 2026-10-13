# ThreatShield — Core System Improvement & Research Enhancement Final Report

---

## 1. Executive Summary & Research Scope

ThreatShield provides a privacy-preserving Cyber Threat Intelligence (CTI) sharing and collaborative defense platform. This upgrade improves the **actual core system** across backend intelligence pipelines, mathematical models, federated learning defenses, cryptographic ledgers, differential privacy engines, and empirical evaluation suites.

---

## 2. Comprehensive System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                               THREATSHIELD SYSTEM ARCHITECTURE                           │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  [ Organization A ]            [ Organization B ]             [ Organization C ]         │
│         │                               │                              │                 │
│         ▼                               ▼                              ▼                 │
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
│  │   CTI EVALUATION ENGINE      │                            │  FEDERATED LEARNING    │  │
│  │  • Quality Score (Q_i)       │                            │  • Local Client Model  │  │
│  │  • Relevance Score (R_ij)    │                            │  • Anomaly Detection   │  │
│  │  • ThreatShield Score (TS)   │                            │  • Secure Aggregation  │  │
│  │  • Closed Feedback Loop      │                            │  • Trust-Weighted Fed  │  │
│  └──────────────┬───────────────┘                            └────────────┬───────────┘  │
│                 │                                                         │              │
│                 ▼                                                         ▼              │
│  ┌──────────────────────────────┐                            ┌────────────────────────┐  │
│  │   MULTI-FACTOR TRUST ENGINE  │                            │  DIFFERENTIAL PRIVACY  │  │
│  │  • Bounded EMA: T_i(t)       │                            │  • Laplace Mechanism   │  │
│  │  • Factor Explainability     │                            │  • Epsilon Accounting  │  │
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

## 3. Subsystem Enhancements & Mathematical Formulations

### 3.1 STIX 2.1 Interoperability & Normalization
- **SDOs & SROs Supported**: `Indicator`, `Malware`, `ThreatActor`, `AttackPattern`, `Identity`, `Relationship`, `Sighting`, and `Bundle`.
- **Normalization**: Handles IPv4/IPv6 canonical formats, domain casing, URL schemes/paths, file hashes (MD5, SHA-1, SHA-256), and STIX patterns.
- **Statuses**: `NORMALIZED`, `INVALID`, `DUPLICATE`, and `SUSPICIOUS` (loopback / private network IPs).

### 3.2 CTI Quality Model ($Q_i$)
$$Q_i = 0.35 C_i + 0.25 F_i + 0.25 S_i + 0.15 H_i, \quad 0 \le Q_i \le 1.0$$
- Freshness: $F_i = \exp(-0.05 \cdot \Delta t_{days})$.
- Source Reliability: $S_i = T_{source}$.
- Historical Usefulness: $H_i = \text{UsefulSightingRatio}$.

### 3.3 Threat Relevance Model ($R_{ij}$)
$$R_{ij} = 0.30 \text{Sev}_i + 0.25 \text{SecRel}_{ij} + 0.15 \text{Sight}_{ij} + 0.15 C_i + 0.15 F_i, \quad 0 \le R_{ij} \le 1.0$$

### 3.4 ThreatShield Decision Score ($\text{TS}_{ij}$)
$$\text{TS}_{ij} = 0.35 Q_i + 0.25 T_{source} + 0.25 R_{ij} + 0.15 F_i, \quad 0 \le \text{TS}_{ij} \le 1.0$$
- Prioritizes CTI into `CRITICAL_ACTION` ($\ge 0.80$), `HIGH_PRIORITY` ($\ge 0.65$), `MEDIUM_PRIORITY` ($\ge 0.45$), and `LOW_TRIAGE` ($< 0.45$).

### 3.5 Multi-Factor Bounded Trust Engine ($T_i(t)$)
$$T_i(t) = 0.85 T_i(t-1) + 0.15 E_i(t), \quad 0.05 \le T_i(t) \le 1.00$$
- Provides complete factor explainability via `/api/trust/explain/{org_id}`.

### 3.6 Malicious-Client-Resistant Federated Learning
- **Multi-Signal Anomaly**: $A_i = \text{clip}(0.5 D_{L2} + 0.5 (1 - \max(0, \cos(\Delta W_i, \Delta W_{ref}))), 0, 1)$.
- **Trust-Weighted Aggregation**: $\hat{W}_i = \frac{T_i \cdot Q_i \cdot (1 - A_i)}{\sum T_j \cdot Q_j \cdot (1 - A_j)}$.
- **Global Parameter Update**: $W_{global} = \sum \hat{W}_i W_i$.

### 3.7 Secure Aggregation Prototype
- Additive zero-sum pairwise masking: $\Delta W_i^{masked} = \Delta W_i + \sum_{j > i} S_{ij} - \sum_{j < i} S_{ji}$, ensuring $\sum \Delta W_i^{masked} = \sum \Delta W_i$.

### 3.8 Differential Privacy Engine & Epsilon Accounting
- Laplace mechanism: $M(D) = f(D) + \text{Laplace}(\Delta f / \epsilon)$.
- Strict budget decrementing preventing operations when $\epsilon_{remaining} \le 0$.

### 3.9 Cryptographic Hash-Chain Audit Ledger
- Immutable block hashing: $H_m = \text{SHA256}(H_{m-1} \parallel \text{CanonicalPayload}_m \parallel \text{ISO8601}(\text{Timestamp}_m))$.
- Replay engine with nonce caching and $\pm 300$s drift window.

---

## 4. Empirical Evaluation Results

### 4.1 Federated Learning Baselines (5 Frozen Seeds, Dirichlet $\alpha = 0.3$, $N_{test} = 500$)
- **Centralized ML — Empirical**: `94.12% ± 1.94%` Accuracy | `0.9409` Macro F1
- **Local Isolated Model (5 Orgs)**: `66.68% ± 1.05%` Accuracy | `0.6139` Macro F1
- **Standard FedAvg (Clean 5-Client)**: `63.68% ± 12.35%` Accuracy | `0.5848` Macro F1
- **Trust-Weighted FedAvg (Clean)**: `63.96% ± 12.44%` Accuracy | `0.5880` Macro F1

### 4.2 Adversarial Poisoning Resilience ($\Delta\text{Accuracy} = \text{Accuracy}_{clean} - \text{Accuracy}_{poisoned}$)
- **Poisoning 10%**: FedAvg = $49.24\%$ ($\Delta\text{Acc} = +14.44\%$, Degraded) | Trust-Weighted = **`65.36%`** ($\Delta\text{Acc} = -1.40\%$, Improved vs. clean baseline | $99.9\%$ influence reduction).
- **Poisoning 20%**: FedAvg = $52.96\%$ ($\Delta\text{Acc} = +10.72\%$, Degraded) | Trust-Weighted = **`65.24%`** ($\Delta\text{Acc} = -1.28\%$, Improved vs. clean baseline | $99.9\%$ influence reduction).
- **Poisoning 30%**: FedAvg = $48.96\%$ ($\Delta\text{Acc} = +14.72\%$, Degraded) | Trust-Weighted = **`65.32%`** ($\Delta\text{Acc} = -1.36\%$, Improved vs. clean baseline | $100.0\%$ influence reduction).
- **Poisoning 40%**: FedAvg = $49.28\%$ ($\Delta\text{Acc} = +14.40\%$, Degraded) | Trust-Weighted = **`65.32%`** ($\Delta\text{Acc} = -1.36\%$, Improved vs. clean baseline | $100.0\%$ influence reduction).

### 4.3 Differential Privacy vs. Utility Results
- $\epsilon = 0.1 \implies \text{MAE} = 10.08$ (Theoretical $\sigma = 14.14$, Relative Error = $6.72\%$)
- $\epsilon = 0.5 \implies \text{MAE} = 2.03$ (Theoretical $\sigma = 2.83$, Relative Error = $1.35\%$)
- $\epsilon = 1.0 \implies \text{MAE} = 0.99$ (Theoretical $\sigma = 1.41$, Relative Error = $0.66\%$)
- $\epsilon = 2.0 \implies \text{MAE} = 0.49$ (Theoretical $\sigma = 0.71$, Relative Error = $0.33\%$)
- $\epsilon = 5.0 \implies \text{MAE} = 0.19$ (Theoretical $\sigma = 0.28$, Relative Error = $0.13\%$)
- $\epsilon = 10.0 \implies \text{MAE} = 0.09$ (Theoretical $\sigma = 0.14$, Relative Error = $0.06\%$)

### 4.4 Operational Performance Benchmark (Local Prototype Measurements)
- **CTI Normalization & Validation**: `0.0088 ms` ($114,026$ ops/sec)
- **STIX 2.1 Bundle Serialization**: `11.6634 ms` ($85.7$ ops/sec)
- **Cryptographic Ledger Append**: `6.5062 ms` ($153.7$ ops/sec)
- **Cryptographic Ledger Verification**: `4.9965 ms` ($200.1$ ops/sec)
- **Differential Privacy Laplace Noise**: `0.0094 ms` ($106,422$ ops/sec)
- **Secure Aggregation Prototype (4 Clients)**: `8.3205 ms` ($120.2$ ops/sec)

---

## 5. Automated Test Suite Validation

- **Backend Pytest Suite**: **28 / 28 Tests PASSED** (`100%` pass rate).
- **Frontend Linter (`oxlint`)**: **0 Errors, 0 Warnings** across 53 files.
- **Frontend Production Bundle (`tsc -b && vite build`)**: **Built cleanly in 457ms**.

---

## 6. Limitations & Future Work

### 6.1 Current Prototype Limitations:
1. **Secure Aggregation Protocol**: The current prototype implements additive zero-sum pairwise masking assuming all clients participate in aggregation. True production adversarial deployment requires threshold secret sharing (e.g. Shamir secret sharing) to handle dynamic client dropout.
2. **Centralized Hub Architecture**: The current ledger and FL coordinator run as permissioned server services. Future work will investigate fully decentralized Byzantine fault-tolerant consensus across peer nodes.
3. **Differential Privacy Composition**: Basic sequential composition is implemented; advanced Renyi Differential Privacy (RDP) accounting can provide tighter privacy loss bounds over multiple rounds.
