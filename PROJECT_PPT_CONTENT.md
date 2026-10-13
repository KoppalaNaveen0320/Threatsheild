# THREATSHIELD — ACADEMIC DEFENSE PRESENTATION (SLIDE DECK)

---

### Slide 1: Title Slide
- **Title**: **ThreatShield: Privacy-Preserving, Trust-Weighted Collaborative Cyber Threat Intelligence and Federated Intrusion Detection**
- **Subtitle**: A Research-Grade, Production-Inspired Cybersecurity Prototype
- **Domain**: Cyber Threat Intelligence (CTI), Federated Learning, Differential Privacy, Cryptographic Ledgers
- **Classification**: Version 1.0 — Research Prototype (Frozen)

---

### Slide 2: The Problem
- Modern cyberattacks (APTs, automated botnets, ransomware) execute synchronized multi-target campaigns.
- Defending in isolation forces each organization to suffer damages before creating detection signatures.
- **Collaborative Cyber Threat Intelligence (CTI)** creates collective immunity, but organizations cannot freely share data.

---

### Slide 3: Existing Systems
- **Centralized Threat Platforms (e.g., MISP, OpenCTI)**: Focus on manual IOC sharing and indicator curation.
- **Centralized Machine Learning**: Requires pooling raw network logs and packet captures into a central database.
- **Naive Federated Learning (Standard FedAvg)**: Allows distributed training but treats all client contributions equally.

---

### Slide 4: Existing Limitations
- **Privacy Violation**: Centralized repositories expose raw PCAPs and internal IPs to regulatory (GDPR/HIPAA) and competitive risks.
- **Poisoning Vulnerability**: Standard FedAvg is highly vulnerable to Byzantine poisoning; a single malicious client degrades accuracy by $>30\%$.
- **No Verifiable Provenance**: Lack of cryptographic non-repudiation makes it impossible to detect tampering or attribute historical indicators.

---

### Slide 5: Research Gap
- **Absence of Unified Defense**: Existing works isolate privacy, federated learning, and threat intelligence standards.
- **The Core Challenge**: How to enable cross-organizational intrusion detection model training with **Zero Raw Data Transfer**, **Byzantine Adversarial Resilience**, **Provable Differential Privacy**, and **Cryptographic Immutability**?

---

### Slide 6: Project Objectives
1. Build an Edge-Native Federated Learning pipeline using Flower and PyTorch.
2. Develop a Multi-Factor Byzantine-Tolerant Aggregation Strategy (`TrustWeightedFedAvg`).
3. Enforce Laplace Differential Privacy ($\epsilon$-budgeting) and AES-256-GCM authenticated encryption.
4. Integrate OASIS STIX 2.1 JSON standardization and a SHA-256 canonical cryptographic audit ledger.
5. Empirically validate under Non-IID Dirichlet partitioning ($\alpha = 0.3$) across 5 random seeds.

---

### Slide 7: Proposed ThreatShield Framework
- **Collaborative Edge Architecture**: Private intrusion detection datasets remain exclusively on local client nodes.
- **Dynamic Reputation & Quality**: Multi-factor trust scoring penalizes malicious and noisy participants.
- **Tamper-Evident Ledger**: Cryptographic hash chaining prevents history rewriting.
- **Standardized Interoperability**: Full compatibility with the global OASIS STIX 2.1 ecosystem.

---

### Slide 8: System Architecture Overview
```
[ Org A Client ]          [ Org B Client ]          [ Adversary M ]
   (Local IDS)               (Local IDS)           (Noise Generator)
        |                         |                         |
    Update Δw_A               Update Δw_B               Update Δw_M
        \                         |                         /
         v                        v                        v
+---------------------------------------------------------------+
|             FLOWER SERVER: TRUST-WEIGHTED FEDAVG              |
|  1. L2 Norm Check: A_i = min(1.0, ||Δw_i - w_med|| / ||w_med||)|
|  2. Multi-Factor Weight: W_i = T_i * Q_i * (1 - A_i)          |
|  3. Normalized Contribution: W_hat_i = W_i / Σ W_j            |
|  4. Byzantine-Suppressed Model: w_global = Σ W_hat_i * w_i    |
+---------------------------------------------------------------+
                                  |
                                  v
+---------------------------------------------------------------+
|                 FASTAPI CORE & AUDIT SERVICES                 |
|  - Differential Privacy: Laplace Noise M(D) = f(D) + Lap(Δf/ε)|
|  - STIX 2.1 Interoperability & SHA-256 Canonical Ledger       |
+---------------------------------------------------------------+
```

---

### Slide 9: CTI & STIX 2.1 Workflow
- Ingestion of Indicator of Compromise (IPv4, Domain, Hash).
- Native mapping to OASIS STIX 2.1 graph format (`indicator--<uuid>` and `identity--<uuid>`).
- Exportable STIX JSON bundles for SIEM/SOAR and peer sharing.
- Automated payload hashing for immutable ledger recording.

---

### Slide 10: Privacy Engine (Differential Privacy & AES-256)
- **Laplace Differential Privacy**: $\mathcal{M}_{\text{Lap}}(D) = f(D) + \text{Lap}\left(0, \frac{\Delta f}{\epsilon}\right)$.
- **Privacy Budget ($\epsilon$) Accounting**: Tracks cumulative privacy loss per organization ($\mathcal{B}_{\text{org}} = 10.0\,\epsilon$; $-0.5\,\epsilon$ per aggregate query).
- **Authenticated Encryption**: AES-256-GCM with 96-bit random nonces for sensitive threat properties at rest.

---

### Slide 11: Federated Learning Pipeline
- **Framework**: Flower (flwr) + PyTorch (`IntrusionDetectionNet`).
- **Input Dimension**: 78 features (CIC-IDS2017 schema), 2-class classification.
- **Edge Training**: 5 local epochs per round; parameter weights exchanged via serialized tensors.
- **Zero Raw Data Exposure**: Raw PCAPs/logs never leave the enterprise boundary.

---

### Slide 12: Trust-Weighted Aggregation Mathematics
- **Organization Trust Score ($T_i$)**: $T_{\text{new}} = T_{\text{old}} (1 - \alpha) + \alpha S_{\text{feedback}} \quad (\alpha = 0.1)$.
- **CTI Quality Score ($Q_i$)**: $Q_i = \frac{\sum S_k \cdot \lambda^{\Delta t_k} \cdot c_k}{\sum \lambda^{\Delta t_k} \cdot c_k} \quad (\lambda = 0.95)$.
- **Parameter Anomaly ($A_i$)**: $A_i = \min\left(1.0, \frac{\|\mathbf{w}_i - \mathbf{w}_{\text{med}}\|_2}{\|\mathbf{w}_{\text{med}}\|_2 + 10^{-9}}\right)$.
- **Normalized Weight ($\hat{W}_i$)**: $\hat{W}_i = \frac{T_i Q_i (1 - A_i)}{\sum T_j Q_j (1 - A_j)} \quad \implies \quad \sum \hat{W}_i = 1.0$.

---

### Slide 13: Adversarial Attack & Defense
- **Poisoning Attack Vector**: Adversary injects Gaussian parameter noise scaled proportionally to attack intensity (10% to 40%).
- **Standard FedAvg Vulnerability**: Malicious client maintains fixed 50% weight; accuracy drops significantly.
- **ThreatShield Defense**: Anomaly score triggers ($A_i \to 1.0$); reputation degrades; malicious contribution weight drops to $\le 0.0031$ (**99.38% to 99.91% influence reduction**).

---

### Slide 14: Cryptographic Audit Ledger
- **SHA-256 Hash Chain**: $\text{current\_hash} = \text{SHA-256}(\text{previous\_hash} \,\|\, \text{payload\_hash} \,\|\, \text{canonical\_timestamp})$.
- **Deterministic Serialization**: Sorted JSON keys, compact separators, zero-microsecond UTC ISO 8601 formatting.
- **Tamper Detection**: Tested against 10 rigorous unit test vectors; immediate detection of altered historical payloads or timestamps.

---

### Slide 15: Experimental Methodology
- **Benchmark Dataset**: Synthetic Intrusion Detection dataset ($N=1000, D=78$, 20 informative features).
- **Partitioning**: Strongly imbalanced Dirichlet Non-IID ($\alpha = 0.3$) with feature domain shift ($+0.5$ on Org B).
- **Validation Scope**: 5 distinct random seeds (`[42, 123, 456, 789, 2024]`).
- **Baseline Comparison**: Local Model vs Standard FedAvg vs Trust-Weighted FedAvg under 10%, 20%, 30%, 40% poisoning.

---

### Slide 16: Experimental Results Summary

#### Clean Baseline (5 Seeds)
- **Local Model**: $0.7660 \pm 0.1904$ Acc | $0.6974 \pm 0.2722$ F1
- **Standard FedAvg**: $0.6410 \pm 0.1694$ Acc | $0.5446 \pm 0.2440$ F1
- **Trust-Weighted FedAvg**: $0.6410 \pm 0.1590$ Acc | $0.5492 \pm 0.2309$ F1

#### Poisoning Resilience Benchmarks
| Poisoning Rate | Standard FedAvg Acc | Trust-Weighted Acc | Malicious Weight | Malicious Influence Reduction | Defense Status |
|:---|:---|:---|:---|:---|:---|
| **10%** | 0.5850 | **0.7670** | **0.0031** | **99.38%** | **PASSED** |
| **20%** | 0.5060 | **0.7660** | **0.0020** | **99.60%** | **PASSED** |
| **30%** | 0.5100 | **0.7680** | **0.0011** | **99.78%** | **PASSED** |
| **40%** | 0.5470 | **0.7670** | **0.0004** | **99.91%** | **PASSED** |

---

### Slide 17: Limitations & Honest Engineering Disclosures
- **PostgreSQL Database**: Marked **NOT VERIFIED / BLOCKED** locally due to lack of local `psql` utility; certified using SQLite fallback.
- **Docker Compose**: Marked **NOT VERIFIED / BLOCKED** locally due to inactive Docker daemon.
- **Network Deployment**: Simulated in-process federated execution rather than multi-node WAN deployment.
- **Research Scope**: Validated as a prototype; does not claim absolute protection against all theoretical attack vectors.

---

### Slide 18: Conclusion & Final Research Claim
- **Final Research Claim**:
  > *"ThreatShield's Trust-Weighted Federated Aggregation maintained comparable predictive performance while reducing the contribution influence of suspicious clients under the tested poisoning scenarios."*
- **Final Status**: All core backend, frontend, privacy, trust, STIX, FL, and ledger components are **VERIFIED**.
- **Classification**: **Research-Grade, Production-Inspired Cybersecurity Prototype**.
