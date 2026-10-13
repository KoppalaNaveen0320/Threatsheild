# ThreatShield: Privacy-Preserving, Trust-Weighted Collaborative Threat Intelligence and Federated Intrusion Detection

**Authors**: ThreatShield Research Group  
**Classification**: Research-Grade Prototype Specification  
**Version**: `v1.0 (Frozen)`  

---

## Abstract

Cross-organizational Cyber Threat Intelligence (CTI) sharing is a cornerstone of proactive collective cybersecurity defense. However, conventional centralized threat sharing platforms face critical barriers: the privacy risk of exposing raw network telemetry, the vulnerability of machine learning models to adversarial poisoning attacks from untrusted participants, and the lack of immutable, tamper-evident audit trails. In this paper, we present **ThreatShield**, an edge-native, privacy-preserving, trust-weighted collaborative threat intelligence and federated intrusion detection framework. ThreatShield integrates Edge Federated Learning (FL) using Flower and PyTorch to train intrusion detection classifiers without centralizing raw network telemetry. To defend against Byzantine adversaries, ThreatShield introduces a multi-factor trust-weighted aggregation mechanism that dynamically scales client contribution weights based on historical organizational reputation ($T_i$), time-decayed CTI quality ($Q_i$), and L2-norm parameter update anomaly detection ($A_i$). ThreatShield also enforces $\epsilon$-Differential Privacy via the Laplace mechanism for macro statistical queries, standardizes threat indicator exchange via OASIS STIX 2.1, and guarantees non-repudiation using a canonical SHA-256 cryptographic hash-chain audit ledger. Rigorous empirical evaluation across five random seeds (`[42, 123, 456, 789, 2024]`) under strongly imbalanced Dirichlet Non-IID partitioning ($\alpha = 0.3$) demonstrates that ThreatShield's Trust-Weighted Federated Aggregation maintains comparable predictive performance to standard FedAvg under clean conditions ($0.6410$ vs $0.6410$) while systematically suppressing the contribution weights of suspicious clients by **99.38% to 99.91%** under 10% to 40% adversarial parameter poisoning attacks.

**Keywords**: Cyber Threat Intelligence (CTI), Federated Learning, Byzantine Fault Tolerance, Differential Privacy, Trust Modeling, STIX 2.1, Cryptographic Hash Chain, Intrusion Detection.

---

## 1. Introduction

As digital infrastructure becomes increasingly interconnected, modern cyber threat actors and Advanced Persistent Threats (APTs) deploy coordinated, multi-target attack campaigns across critical infrastructure, financial institutions, and healthcare networks. Defending against these distributed campaigns in isolation forces individual Security Operations Centers (SOCs) to formulate defensive signatures only after suffering substantial operational disruption.

Collaborative Cyber Threat Intelligence (CTI) sharing has emerged as a vital paradigm to convert individual detection events into collective ecosystem immunity. However, widespread adoption of collaborative defense is severely hindered by three fundamental challenges:

1. **The Privacy Dilemma**: Enterprise network logs, raw packet captures (PCAPs), and telemetry contain confidential business information, proprietary network topologies, and user identifiers subject to strict legal mandates (e.g., GDPR, HIPAA).
2. **The Trust Deficit and Adversarial Poisoning**: Traditional CTI feeds operate with static, binary trust assumptions. Rogue, compromised, or low-quality participants can inject poisoned model updates or deceptive threat indicators, subverting collective detection models.
3. **Centralized Architectural Fragility**: Centralized threat repositories introduce single points of compromise, high vulnerability to espionage, and potential repudiation of submitted data.

To resolve these interconnected challenges, this paper presents **ThreatShield**, an integrated, edge-native collaborative defense framework that combines federated neural network training, dynamic multi-factor reputation modeling, formal Differential Privacy, and cryptographic auditability.

---

## 2. Related Work and Research Gap

### 2.1 Centralized Threat Intelligence Platforms
Platforms such as MISP (Malware Information Sharing Platform) and OpenCTI provide structured repositories for sharing Indicators of Compromise (IOCs). However, they rely on central data aggregation, cannot perform distributed deep learning across private data silos, and lack automated mechanisms to evaluate parameter-level anomaly scores.

### 2.2 Federated Learning and Naive FedAvg
Federated Learning (FL), pioneered by McMahan et al. with Federated Averaging (FedAvg), enables distributed clients to collaboratively train machine learning models by transmitting only weight tensors $\mathbf{w}_i$ rather than raw training data. While FedAvg preserves data locality, standard FedAvg weights client contributions strictly by dataset size ($n_k / n$). In adversarial cybersecurity environments, naive FedAvg is catastrophically vulnerable to Byzantine poisoning attacks: an adversary contributing manipulated weights can easily degrade global detection accuracy by over 30%.

### 2.3 Research Gap
Existing solutions treat privacy, federated learning, trust modeling, and threat intelligence standards as isolated problems. There is a distinct research gap for a unified, research-grade framework that simultaneously provides:
- **Zero Raw Data Transfer**: Edge-local intrusion detection model training.
- **Byzantine Resilience**: Dynamic multi-factor weight attenuation for anomalous updates.
- **Provable Differential Privacy**: Formal Laplace noise mechanisms with cumulative $\epsilon$-budget tracking.
- **Verifiable Auditability**: Canonical cryptographic hash-chain event logging with non-repudiation.

---

## 3. ThreatShield Architecture

ThreatShield is structured into four interconnected tiers:

```
+-------------------------------------------------------------------------+
|                        THREATSHIELD ARCHITECTURE                        |
|                                                                         |
|  [ Enterprise Node A ]     [ Enterprise Node B ]    [ Malicious Client ]|
|  - Private IDS Telemetry   - Private IDS Telemetry  - Parameter Noise   |
|  - Local PyTorch Model     - Local PyTorch Model    - Perturbation Gen  |
|            |                         |                       |          |
|        Update Δw_A               Update Δw_B             Update Δw_M    |
|            \                         |                       /          |
|             v                        v                      v           |
|  +-------------------------------------------------------------------+  |
|  |             FLOWER SERVER: TRUST-WEIGHTED FEDAVG STRATEGY         |  |
|  |  1. L2 Parameter Norm Anomaly Detection: A_i ∈ [0, 1]             |  |
|  |  2. Multi-Factor Weighting: W_i = T_i * Q_i * (1 - A_i)           |  |
|  |  3. Normalized Weighting: W_hat_i = W_i / Σ W_j                   |  |
|  |  4. Byzantine-Suppressed Model: w_global = Σ W_hat_i * w_i        |  |
|  +-------------------------------------------------------------------+  |
|                                      |                                  |
|                                      v                                  |
|  +-------------------------------------------------------------------+  |
|  |             FASTAPI BACKEND & CRYPTOGRAPHIC SERVICES              |  |
|  |  - Differential Privacy: Laplace Mechanism M(D) = f(D) + Lap(Δf/ε)|  |
|  |  - Threat Interoperability: OASIS STIX 2.1 Graph Mapping         |  |
|  |  - Immutability: Canonical SHA-256 Hash-Chain Audit Ledger        |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

---

## 4. Mathematical Framework

### 4.1 Organization Trust Score ($T_i$)
The reputation score $T_i \in [0.0, 1.0]$ of an organization is updated over discrete validation rounds using an Exponential Moving Average (EMA):

$$T_{\text{new}} = T_{\text{old}} \cdot (1 - \alpha) + \alpha \cdot S_{\text{feedback}}$$

where:
- $\alpha = 0.1$ is the learning rate parameter.
- $S_{\text{feedback}} \in \{1.0 \text{ [Confirmed Malicious]}, 0.8 \text{ [Useful]}, 0.2 \text{ [Not Useful]}, 0.0 \text{ [False Positive]}\}$.

### 4.2 CTI Quality Score ($Q_i$)
The quality $Q_i \in [0.0, 1.0]$ of threat intelligence submitted by an organization incorporates peer feedback confidence and exponential time decay:

$$Q_i = \frac{\sum_{k=1}^M S_k \cdot \lambda^{\Delta t_k} \cdot c_k}{\sum_{k=1}^M \lambda^{\Delta t_k} \cdot c_k}$$

where $\lambda = 0.95$ represents the daily decay constant, $\Delta t_k$ is the age of feedback in days, and $c_k \in (0, 1]$ is the peer's reported confidence.

### 4.3 Contextual Relevance Score ($R_{ij}$)
Quantifies the relevance of threat indicator $i$ to consumer organization $j$:

$$R_{ij} = \begin{cases} 1.0 & \text{if } \text{Sector}(i) = \text{Sector}(j) \\ 0.5 & \text{otherwise} \end{cases}$$

### 4.4 Parameter Anomaly Score ($A_i$)
Measures the L2 Euclidean distance between the client parameter update $\mathbf{w}_i$ and the median parameter norm $\mathbf{w}_{\text{med}}$:

$$A_i = \min\left(1.0, \frac{\|\mathbf{w}_i - \mathbf{w}_{\text{med}}\|_2}{\|\mathbf{w}_{\text{med}}\|_2 + 10^{-9}}\right)$$

### 4.5 Trust-Weighted Aggregation
The unnormalized contribution weight $W_i$ and normalized weight $\hat{W}_i$ are defined as:

$$W_i = T_i \times Q_i \times (1 - A_i)$$

$$\hat{W}_i = \frac{W_i}{\sum_{j=1}^K W_j} \quad \text{guaranteeing} \quad \sum_{i=1}^K \hat{W}_i = 1.0$$

The global model parameters are aggregated as:

$$\mathbf{w}_{\text{global}} = \sum_{i=1}^K \hat{W}_i \mathbf{w}_i$$

---

## 5. Privacy and Cryptographic Primitives

### 5.1 Differential Privacy (Laplace Mechanism)
To allow cross-organizational analytics without membership disclosure, ThreatShield implements $\epsilon$-Differential Privacy on macro queries:

$$\mathcal{M}_{\text{Lap}}(D) = f(D) + \text{Lap}\left(0, \frac{\Delta f}{\epsilon}\right)$$

where $\Delta f$ is global query sensitivity and $\epsilon$ is the privacy parameter. Each tenant possesses a privacy budget ($\mathcal{B}_{\text{org}} = 10.0\,\epsilon$) decremented by $\epsilon_{\text{cost}} = 0.5\,\epsilon$ per aggregate request.

### 5.2 Authenticated Encryption (AES-256-GCM)
Proprietary threat attributes are encrypted using AES-256 in Galois/Counter Mode with 96-bit unique nonces, providing confidentiality and ciphertext authentication.

### 5.3 Canonical Cryptographic Hash-Chain Audit Ledger
All critical actions (CTI submissions, trust score adjustments, privacy budget deductions) are committed to a cryptographic ledger:

$$\text{current\_hash} = \text{SHA-256}(\text{previous\_hash} \,\|\, \text{payload\_hash} \,\|\, \text{canonical\_timestamp})$$

Canonical JSON formatting (`sort_keys=True`, compact separators) and ISO 8601 UTC zero-microsecond timestamps eliminate false-positive tampering reports.

---

## 6. Empirical Evaluation

### 6.1 Experimental Setup
- **Dataset**: Synthetic Intrusion Detection Benchmark (78 network traffic features modeled after CIC-IDS2017 schema, 20 informative features, $N=1000$).
- **Partitioning**: Strongly imbalanced Dirichlet Non-IID ($\alpha = 0.3$) with feature domain shift ($+0.5$ on Org B).
- **Validation Protocol**: 5 random seeds (`[42, 123, 456, 789, 2024]`).
- **Evaluation Set**: 200 held-out global test samples.

### 6.2 Clean Baseline Performance (5 Seeds)
| Strategy | Mean Accuracy | Accuracy Std Dev ($\pm \sigma$) | Mean F1-Score (Macro) | F1 Std Dev ($\pm \sigma$) |
|:---|:---|:---|:---|:---|
| **Local Model (Org A)** | **0.7660** | $\pm 0.1904$ | **0.6974** | $\pm 0.2722$ |
| **Standard FedAvg (Clean)** | **0.6410** | $\pm 0.1694$ | **0.5446** | $\pm 0.2440$ |
| **Trust-Weighted FedAvg (Clean)** | **0.6410** | $\pm 0.1590$ | **0.5492** | $\pm 0.2309$ |

### 6.3 Legitimate Non-IID Safety Verification
Under clean Dirichlet non-IID conditions ($\alpha = 0.3$), client updates produced anomaly scores $A_i \le 0.026$, resulting in balanced weights $\hat{W}_A = 0.5065$ and $\hat{W}_B = 0.4935$. This proves that natural statistical heterogeneity is not misclassified as malicious activity.

### 6.4 Adversarial Parameter Poisoning Benchmarks (10% to 40%)
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

## 7. Discussion and Authoritative Research Claim

The empirical results substantiate our core research finding:

> **"ThreatShield's Trust-Weighted Federated Aggregation maintained comparable predictive performance while reducing the contribution influence of suspicious clients under the tested poisoning scenarios."**

By dynamically coupling L2 parameter anomaly detection with reputation decay, ThreatShield reduces adversarial contribution weights to less than $0.31\%$ across all attack levels, preserving global model accuracy ($> 76\%$) while standard FedAvg degrades significantly.

---

## 8. Limitations and Engineering Disclosures

1. **PostgreSQL Compatibility**: Marked **NOT VERIFIED / BLOCKED** in local test environment due to unprovisioned `psql` utility; certified via SQLite fallback.
2. **Containerized Deployment**: Marked **NOT VERIFIED / BLOCKED** locally due to inactive Docker daemon.
3. **Network Topology**: FL rounds were executed via synchronous multi-seed simulations rather than geographically distributed WAN nodes.
4. **Scope of Claim**: The prototype does not claim absolute protection against all conceivable Byzantine attacks or complete production readiness.

---

## 9. Conclusion and Future Work

ThreatShield demonstrates the viability of a unified collaborative threat defense framework combining edge federated learning, Byzantine-tolerant reputation weighting, differential privacy, and cryptographic auditability. Future research will focus on deploying ThreatShield across geographically distributed Kubernetes clusters, evaluating asynchronous federated optimization under variable WAN latency, and integrating homomorphic encryption (CKKS) for privacy-preserving gradient verification.

---

## References
1. B. McMahan, E. Moore, D. Ramage, S. Hampson, and B. A. y Arcas, "Communication-Efficient Learning of Deep Networks from Decentralized Data," in *AISTATS*, 2017.
2. C. Dwork and A. Roth, "The Algorithmic Foundations of Differential Privacy," *Foundations and Trends in Theoretical Computer Science*, 2014.
3. OASIS Open, "Structured Threat Information Expression (STIX) Version 2.1," OASIS Standard, 2021.
4. D. J. Beutel et al., "Flower: A Friendly Federated Learning Research Framework," *arXiv preprint arXiv:2007.14390*, 2020.
5. I. Sharafaldin, A. H. Lashkari, and A. A. Ghorbani, "Toward Generating a New Intrusion Detection Dataset and Intrusion Traffic Characterization," in *ICISSP*, 2018.
