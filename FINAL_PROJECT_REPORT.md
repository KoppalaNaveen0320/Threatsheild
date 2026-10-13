# THREATSHIELD: PRIVACY-PRESERVING, TRUST-WEIGHTED COLLABORATIVE THREAT INTELLIGENCE & FEDERATED INTRUSION DETECTION FRAMEWORK

## Final Academic Project Report

**Project Classification**: Research-Grade, Production-Inspired Cybersecurity Prototype  
**Version**: `VERSION 1.0 — RESEARCH PROTOTYPE (FROZEN)`  
**Date**: August 2026  

---

## Executive Summary

As modern cyber adversaries orchestrate sophisticated, multi-stage, distributed attack campaigns, siloed enterprise defense mechanisms prove insufficient. Collaborative Cyber Threat Intelligence (CTI) sharing is widely recognized as a vital paradigm for collective cyber defense; however, conventional sharing frameworks suffer from three severe limitations:
1. **The Privacy Dilemma**: Strict regulatory frameworks (GDPR, HIPAA, GLBA) and corporate risk concerns prohibit organizations from pooling raw network telemetry, PCAPs, and internal log data.
2. **The Trust & Poisoning Deficit**: Open and centralized intelligence networks lack dynamic reliability quantification, leaving collective defense models highly vulnerable to noisy indicators, malicious spam, and adversarial model poisoning attacks.
3. **The Centralized Single Point of Failure**: Traditional centralized threat repositories create concentrated targets for espionage, single-point compromise, and repudiation.

**ThreatShield** addresses these challenges through a unified, privacy-preserving, trust-weighted architecture. By combining **Edge-Native Federated Learning (Flower / PyTorch)** with a **Multi-Factor Byzantine-Tolerant Aggregation Strategy**, ThreatShield enables cross-organizational intrusion detection model training with zero raw data transmission. The platform integrates **Laplace Differential Privacy ($\epsilon$-budget accounting)** for macro threat analytics, **OASIS STIX 2.1** standardized threat representation, and a **Canonical SHA-256 Cryptographic Hash-Chain Audit Ledger** for tamper-evident provenance.

Rigorous empirical validation across **5 random seeds (`[42, 123, 456, 789, 2024]`)** on strongly imbalanced **Dirichlet Non-IID partitions ($\alpha = 0.3$)** demonstrates that ThreatShield's Trust-Weighted Federated Aggregation maintains comparable predictive performance to baseline FedAvg under clean conditions ($0.6410$ vs $0.6410$) while systematically suppressing the contribution weights of suspicious clients by **99.38% to 99.91%** under 10%–40% parameter poisoning attacks.

---

## 1. Problem Definition & Research Gap

### 1.1 The Cybersecurity Landscape
Modern Advanced Persistent Threats (APTs) and automated botnets leverage distributed infrastructure to attack multiple enterprises in parallel. Defending against these threats in isolation forces every organization to absorb the full impact of an attack before formulating detection rules.

### 1.2 Limitations of Existing Frameworks
- **Centralized Threat Intelligence Platforms (e.g., MISP, OpenCTI)**: While enabling manual indicator sharing, centralized platforms cannot perform privacy-preserving machine learning across distributed edge networks without aggregating raw telemetry.
- **Naive Federated Averaging (Standard FedAvg)**: Standard FedAvg weights client contributions strictly by sample volume ($n_k / n$). In adversarial settings, a single malicious client injecting perturbed parameter weights can degrade global intrusion detection accuracy by over 30%.
- **Lack of Verifiable Provenance**: Most CTI sharing ecosystems lack tamper-evident, non-repudiable audit trails, making it impossible to attribute historical threat submissions or verify whether shared models have been modified in transit.

### 1.3 Research Gap & Objectives
The core research gap lies in constructing an integrated architecture that simultaneously satisfies:
- **Zero Raw Data Transfer**: Keeping sensitive network packet captures and log data local.
- **Byzantine Resilience**: Automatically penalizing malicious or anomalous model parameters without suppressing legitimate non-IID data skew.
- **Provable Privacy Guarantees**: Enforcing Differential Privacy on shared statistical queries.
- **Immutable Auditability**: Providing verifiable cryptographic guarantees against event and payload tampering.

---

## 2. ThreatShield Proposed Architecture

```
+-----------------------------------------------------------------------------------+
|                            THREATSHIELD ARCHITECTURE                              |
|                                                                                   |
|  [ Enterprise Node A ]       [ Enterprise Node B ]       [ Adversary / Rogue M ]  |
|  - Private IDS Telemetry     - Private IDS Telemetry     - Perturbed Parameters   |
|  - Local PyTorch Model       - Local PyTorch Model       - Noise Injection        |
|          |                           |                           |                |
|      Update Δw_A                 Update Δw_B                 Update Δw_M          |
|          \                           |                           /                |
|           v                          v                          v                 |
|  +-----------------------------------------------------------------------------+  |
|  |                 FLOWER SERVER: TRUST-WEIGHTED FEDAVG STRATEGY               |  |
|  |                                                                             |  |
|  |  Step 1: L2 Norm Anomaly Score:  A_i = min(1.0, ||Δw_i - w_med|| / ||w_med||) |  |
|  |  Step 2: Multi-Factor Weight:    W_i = T_i * Q_i * (1 - A_i)                |  |
|  |  Step 3: Normalized Scaling:     W_hat_i = W_i / Σ W_j                       |  |
|  |  Step 4: Aggregation:            w_global = Σ W_hat_i * w_i                 |  |
|  +-----------------------------------------------------------------------------+  |
|                                      |                                            |
|                                      v                                            |
|  +-----------------------------------------------------------------------------+  |
|  |                 FASTAPI CORE PLATFORM & PRIVACY SERVICES                    |  |
|  |  - Differential Privacy Engine: Laplace Mechanism M(D) = f(D) + Lap(Δf/ε)    |  |
|  |  - STIX 2.1 Serialization: Graph-based Indicator & Identity Mapping         |  |
|  |  - Cryptographic Audit Ledger: Canonical SHA-256 Hash Chain                 |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Mathematical Framework

### 3.1 Organization Trust Score ($T_i$)
Organizational reputation is updated using an Exponential Moving Average (EMA) based on peer validation feedback:

$$T_{\text{new}} = T_{\text{old}} \cdot (1 - \alpha) + \alpha \cdot S_{\text{feedback}}$$

- $T_i \in [0.0, 1.0]$: Initialized to neutral baseline $0.50$.
- $\alpha = 0.1$: Learning rate governing sensitivity to recent feedback.
- $S_{\text{feedback}} \in \{1.0 \text{ [Confirmed Malicious]}, 0.8 \text{ [Useful]}, 0.2 \text{ [Not Useful]}, 0.0 \text{ [False Positive]}\}$.

### 3.2 CTI Quality Score ($Q_i$)
Evaluates indicator accuracy with time-decayed peer evaluation:

$$Q_i = \frac{\sum_{k} S_k \cdot \lambda^{\Delta t_k} \cdot c_k}{\sum_{k} \lambda^{\Delta t_k} \cdot c_k}$$

- $\lambda = 0.95$: Daily time-decay factor discounting stale feedback.
- $c_k \in (0, 1]$: Confidence level of the evaluating peer.

### 3.3 Context Relevance ($R_{ij}$)
Quantifies the relevance of threat indicator $i$ to consumer organization $j$ based on sector matching (e.g., matching financial malware signatures against banking network profiles):

$$R_{ij} = \begin{cases} 1.0 & \text{if } \text{Sector}(i) = \text{Sector}(j) \\ 0.5 & \text{otherwise} \end{cases}$$

### 3.4 L2 Norm Parameter Anomaly Score ($A_i$)
Detects parameter poisoning by measuring the Euclidean deviation of client update tensor $\mathbf{w}_i$ from the median update norm:

$$A_i = \min\left(1.0, \frac{\|\mathbf{w}_i - \mathbf{w}_{\text{med}}\|_2}{\|\mathbf{w}_{\text{med}}\|_2 + 10^{-9}}\right)$$

### 3.5 Trust-Weighted Contribution & Aggregation
The raw contribution factor $W_i$ and normalized contribution weight $\hat{W}_i$ are computed as:

$$W_i = T_i \times Q_i \times (1 - A_i)$$

$$\hat{W}_i = \frac{W_i}{\sum_{j=1}^K W_j} \quad \text{such that} \quad \sum_{i=1}^K \hat{W}_i = 1.0$$

The global model parameters are aggregated via:

$$\mathbf{w}_{\text{global}} = \sum_{i=1}^K \hat{W}_i \mathbf{w}_i$$

---

## 4. Privacy & Cryptographic Subsystems

### 4.1 Differential Privacy: Laplace Mechanism
For macro statistical queries (e.g., active threat volume, collective IOC counts), noise drawn from a zero-mean Laplace distribution is added:

$$\mathcal{M}_{\text{Lap}}(D) = f(D) + \text{Lap}\left(0, \frac{\Delta f}{\epsilon}\right)$$

Each organization maintains an active privacy budget ($\mathcal{B}_{\text{org}} = 10.0\,\epsilon$). Queries consuming $\epsilon_{\text{cost}} = 0.5\,\epsilon$ decrement the budget until exhaustion, preventing membership reconstruction.

### 4.2 Authenticated Symmetric Encryption
Sensitive indicator properties are encrypted at rest and during transit using AES-256-GCM (AEAD) with 96-bit cryptographically random nonces (`os.urandom(12)`).

### 4.3 Canonical SHA-256 Cryptographic Audit Ledger
To guarantee non-repudiation and prevent false-positive tamper alarms across different execution environments:
- **Payload Canonicalization**: `json.dumps(payload, sort_keys=True, separators=(',', ':'))`.
- **Timestamp Canonicalization**: ISO 8601 UTC with zeroed microseconds (`%Y-%m-%dT%H:%M:%SZ`).
- **Chained Block Hash**:
  $$\text{current\_hash} = \text{SHA-256}(\text{previous\_hash} \,\|\, \text{payload\_hash} \,\|\, \text{canonical\_timestamp})$$

---

## 5. Experimental Methodology & Verified Results

### 5.1 Experimental Setup
- **Dataset**: Synthetic Intrusion Detection Benchmark (78 features based on CIC-IDS2017 schema, 20 informative features, $N=1000$).
- **Partitioning**: Strongly imbalanced Dirichlet Non-IID ($\alpha = 0.3$) with feature domain shift ($+0.5$ on Org B).
- **Validation**: 5 distinct random seeds (`[42, 123, 456, 789, 2024]`).
- **Evaluation Set**: 200 held-out global test samples.

### 5.2 Clean Baseline Performance (5 Seeds)
| Model / Strategy | Mean Accuracy | Accuracy Std Dev ($\pm \sigma$) | Mean F1-Score (Macro) | F1 Std Dev ($\pm \sigma$) |
|:---|:---|:---|:---|:---|
| **Local Model (Org A Baseline)** | **0.7660** | $\pm 0.1904$ | **0.6974** | $\pm 0.2722$ |
| **Standard FedAvg (Clean Baseline)** | **0.6410** | $\pm 0.1694$ | **0.5446** | $\pm 0.2440$ |
| **Trust-Weighted FedAvg (Clean Baseline)** | **0.6410** | $\pm 0.1590$ | **0.5492** | $\pm 0.2309$ |

### 5.3 Non-IID Distribution & Legitimate Client Safety
- **Org A Distribution**: 499 Benign / 269 Malicious (768 total; 65.0% : 35.0%)
- **Org B Distribution**: 1 Benign / 231 Malicious (232 total; 0.4% : 99.6%)
- **Safety Metric**: Legitimate non-IID clients received weights $\hat{W}_A = 0.5065$ and $\hat{W}_B = 0.4935$ ($A_i \le 0.026$), confirming that statistical heterogeneity does not trigger false malicious classification.

### 5.4 Adversarial Parameter Poisoning Benchmarks (10% to 40%)
$$\Delta\text{Accuracy} = \text{Accuracy}_{\text{clean}} - \text{Accuracy}_{\text{poisoned}} \qquad \text{Reduction} = \frac{\text{Weight}_{\text{FedAvg}} - \text{Weight}_{\text{TrustWeighted}}}{\text{Weight}_{\text{FedAvg}}}$$

| Poison Rate | Aggregation Method | Mean Accuracy | Acc Std | Mean $\Delta\text{Acc}$ | Mean F1 (Macro) | Malicious Weight | Anomaly Score | Trust Score | Malicious Influence Reduction | Defense Status |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| **10%** | Standard FedAvg | 0.5850 | $\pm 0.0446$ | 0.0560 | 0.5172 | 0.5000 | 0.0000 | 1.0000 | Baseline (0.00%) | **FAILED** |
| **10%** | Trust-Weighted | **0.7670** | $\pm 0.1890$ | -0.1260 | **0.6994** | **0.0031** | 1.0000 | 0.4000 | **99.38%** | **PASSED** |
| **20%** | Standard FedAvg | 0.5060 | $\pm 0.0781$ | 0.1350 | 0.4473 | 0.5000 | 0.0000 | 1.0000 | Baseline (0.00%) | **FAILED** |
| **20%** | Trust-Weighted | **0.7660** | $\pm 0.1904$ | -0.1250 | **0.6974** | **0.0020** | 1.0000 | 0.3000 | **99.60%** | **PASSED** |
| **30%** | Standard FedAvg | 0.5100 | $\pm 0.0568$ | 0.1310 | 0.4272 | 0.5000 | 0.0000 | 1.0000 | Baseline (0.00%) | **FAILED** |
| **30%** | Trust-Weighted | **0.7680** | $\pm 0.1900$ | -0.1270 | **0.7004** | **0.0011** | 1.0000 | 0.2000 | **99.78%** | **PASSED** |
| **40%** | Standard FedAvg | 0.5470 | $\pm 0.0738$ | 0.0940 | 0.4926 | 0.5000 | 0.0000 | 1.0000 | Baseline (0.00%) | **FAILED** |
| **40%** | Trust-Weighted | **0.7670** | $\pm 0.1890$ | -0.1260 | **0.6994** | **0.0004** | 1.0000 | 0.1000 | **99.91%** | **PASSED** |

---

## 6. Authoritative Research Claim

> **"ThreatShield's Trust-Weighted Federated Aggregation maintained comparable predictive performance while reducing the contribution influence of suspicious clients under the tested poisoning scenarios."**

---

## 7. Limitations & Honest Engineering Disclosures

1. **PostgreSQL Compatibility**: **NOT VERIFIED / BLOCKED** locally due to lack of local `psql` command utility. SQLite was certified as an automated testbed fallback. Compatibility with PostgreSQL must be validated in staging.
2. **Container Orchestration**: **NOT VERIFIED / BLOCKED** locally due to inactive Docker daemon.
3. **WAN Network Latency**: Federated learning rounds were evaluated via synchronous in-process simulations rather than across a geographically distributed WAN testbed.
4. **Scope of Claim**: The system does NOT claim guaranteed poisoning prevention under all theoretical Byzantine attack topologies, nor complete production readiness.

---

## 8. Final Verification Status

```text
Backend:             VERIFIED
Frontend:            VERIFIED
PostgreSQL:          BLOCKED
Docker:              BLOCKED
STIX:                VERIFIED
Privacy:             VERIFIED
Federated Learning:  VERIFIED
Trust Engine:        VERIFIED
Poisoning Defense:   VERIFIED UNDER TESTED CONDITIONS
Replay Protection:   VERIFIED
Sybil Simulation:    VERIFIED
Ledger:              VERIFIED
Security Hardening:  PASS
Documentation:       COMPLETE
End-to-End Demo:     PASS
```

**Final Classification**: *Research-grade, production-inspired cybersecurity prototype.*
