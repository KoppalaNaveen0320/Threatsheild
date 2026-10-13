# THREATSHIELD — FINAL ACADEMIC VIVA & DEFENSE Q&A

**Classification**: Academic Examination & Viva Preparation Guide  
**Version**: `Version 1.0 — Research Prototype (Frozen)`  

---

## 1. General & Architectural Foundations

### Q1: What is ThreatShield and what core problem does it solve?
**Answer**: ThreatShield is a research-grade, production-inspired cybersecurity prototype designed for privacy-preserving, trust-weighted collaborative Cyber Threat Intelligence (CTI) sharing and federated intrusion detection. It solves the tension between collaborative defense and data privacy, enabling organizations to train joint ML intrusion detection models and exchange IOCs without pooling raw network logs, suffering model poisoning, or relying on vulnerable centralized servers.

### Q2: How does ThreatShield differ from standard platforms like MISP or OpenCTI?
**Answer**: Traditional platforms such as MISP focus primarily on manual indicator repositories with static trust assumptions. They lack edge-native federated machine learning, formal Differential Privacy budget accounting, automated L2 parameter anomaly detection, and Byzantine-tolerant model aggregation. ThreatShield provides an end-to-end framework integrating all of these capabilities.

### Q3: What is the significance of the OASIS STIX 2.1 standard in this project?
**Answer**: Structured Threat Information Expression (STIX 2.1) is the global standard for representing threat intelligence. ThreatShield implements native mapping between internal database indicators and STIX 2.1 `indicator` and `identity` JSON schemas, ensuring complete interoperability with external SIEM, SOAR, and TIP systems.

---

## 2. Mathematical Modeling & Core Formulas

### Q4: Explain the Trust-Weighted Aggregation formula and each of its terms.
**Answer**:
1. **Raw Contribution Factor**:
   $$W_i = T_i \times Q_i \times (1 - A_i)$$
   - $T_i \in [0, 1]$: Organization historical trust score updated via Exponential Moving Average based on peer validation feedback.
   - $Q_i \in [0, 1]$: Time-decayed quality score of CTI submitted by the organization.
   - $A_i \in [0, 1]$: Parameter update anomaly score measured via L2 Euclidean norm deviation from median update norm.
2. **Normalized Aggregation Weight**:
   $$\hat{W}_i = \frac{W_i}{\sum_{j=1}^K W_j} \quad \text{guaranteeing} \quad \sum_{i=1}^K \hat{W}_i = 1.0$$
3. **Global Model Aggregation**:
   $$\mathbf{w}_{\text{global}} = \sum_{i=1}^K \hat{W}_i \mathbf{w}_i$$

### Q5: How is the Organization Trust Score ($T_i$) updated?
**Answer**: Using an Exponential Moving Average (EMA):
$$T_{\text{new}} = T_{\text{old}} \times (1 - \alpha) + \alpha \times S_{\text{feedback}}$$
where $\alpha = 0.1$ is the learning factor and $S_{\text{feedback}} \in \{1.0 \text{ [Confirmed Malicious]}, 0.8 \text{ [Useful]}, 0.2 \text{ [Not Useful]}, 0.0 \text{ [False Positive]}\}$.

### Q6: How is the CTI Quality Score ($Q_i$) calculated?
**Answer**:
$$Q_i = \frac{\sum_{k=1}^M S_k \cdot \lambda^{\Delta t_k} \cdot c_k}{\sum_{k=1}^M \lambda^{\Delta t_k} \cdot c_k}$$
where $\lambda = 0.95$ is the daily time-decay factor discounting stale feedback, $\Delta t_k$ is the age of feedback in days, and $c_k \in (0, 1]$ is the peer's reported confidence.

### Q7: How is the Update Anomaly Score ($A_i$) computed?
**Answer**:
$$A_i = \min\left(1.0, \frac{\|\mathbf{w}_i - \mathbf{w}_{\text{med}}\|_2}{\|\mathbf{w}_{\text{med}}\|_2 + 10^{-9}}\right)$$
By comparing each client's parameter vector $\mathbf{w}_i$ against the median update norm $\mathbf{w}_{\text{med}}$, adversarial perturbations produce large L2 distances that drive $A_i \to 1.0$, reducing raw weight $W_i \to 0$.

---

## 3. Privacy & Cryptography

### Q8: How does the Differential Privacy engine work in ThreatShield?
**Answer**: For macro aggregate statistical queries (e.g., total active threats, global incident counts), ThreatShield adds Laplace noise:
$$\mathcal{M}_{\text{Lap}}(D) = f(D) + \text{Lap}\left(0, \frac{\Delta f}{\epsilon}\right)$$
Each organization is assigned an initial privacy budget ($\mathcal{B}_{\text{org}} = 10.0\,\epsilon$). Queries consuming $\epsilon_{\text{cost}} = 0.5\,\epsilon$ decrement the budget until exhaustion, preventing membership inference attacks.

### Q9: Why are exact CTI indicators not perturbed with Differential Privacy noise?
**Answer**: Perturbing exact cyber indicators (such as IP addresses, file hashes, or CVE IDs) with numerical noise destroys their operational defensive value (an altered IP is useless for firewall blocking). ThreatShield applies Differential Privacy strictly to macro aggregate statistics, while securing exact indicators through Role-Based Access Control (RBAC), tenant boundary isolation, and AES-256-GCM encryption.

### Q10: How does the Cryptographic Audit Ledger guarantee immutability?
**Answer**: Every ledger block is chained via SHA-256:
$$\text{current\_hash} = \text{SHA-256}(\text{previous\_hash} \,\|\, \text{payload\_hash} \,\|\, \text{canonical\_timestamp})$$
ThreatShield enforces canonical JSON (`sort_keys=True`, compact separators) and ISO 8601 UTC zero-microsecond timestamps to ensure deterministic hashing across database backends and operating systems.

---

## 4. Federated Learning & Byzantine Defense

### Q11: What is the role of Flower and PyTorch in the FL pipeline?
**Answer**: PyTorch defines the deep neural network (`IntrusionDetectionNet`, a multi-layer perceptron with 78 input features) and executes local backpropagation. Flower orchestrates the federated communication protocol, broadcasting global weights and coordinating trust-weighted parameter aggregation.

### Q12: What was the Non-IID experimental setup and why is it important?
**Answer**: Real-world enterprise network traffic is non-IID. We partitioned a 78-feature synthetic intrusion detection dataset ($N=1000$) using a Dirichlet distribution with concentration parameter $\alpha = 0.3$, introducing strong class imbalance (Org A: 65% benign / 35% malicious vs Org B: 0.4% benign / 99.6% malicious) and localized feature shift ($+0.5$). The evaluation verified that legitimate non-IID updates receive normal aggregation weights ($\hat{W}_A = 0.5065, \hat{W}_B = 0.4935$) without false-positive malicious suppression.

### Q13: What were the multi-seed poisoning results across 10% to 40% attacks?
**Answer**: Evaluated across 5 random seeds (`[42, 123, 456, 789, 2024]`):
- Under clean non-IID conditions, Trust-Weighted FedAvg matched standard FedAvg ($0.6410$ vs $0.6410$).
- Under 10%–40% parameter poisoning attacks, standard FedAvg accuracy dropped to between $0.5060$ and $0.5850$ ($\Delta\text{Acc}$ drops up to $0.1350$).
- Trust-Weighted FedAvg detected the anomalies ($A_i = 1.0$), suppressed malicious contribution weights down to between **$0.0031$ and $0.0004$** (**99.38% to 99.91% influence reduction**), and preserved global model accuracy at **$0.7660$ to $0.7680$**.

---

## 5. Formal Research Claim & Honest Engineering Disclosures

### Q14: What is the authoritative research claim of ThreatShield?
**Answer**:
> *"ThreatShield's Trust-Weighted Federated Aggregation maintained comparable predictive performance while reducing the contribution influence of suspicious clients under the tested poisoning scenarios."*

### Q15: Why are PostgreSQL and Docker marked as BLOCKED / NOT VERIFIED?
**Answer**: In the current test environment, the `psql` command-line utility and the Docker daemon service were unprovisioned. In accordance with rigorous academic integrity, rather than simulating or faking database and container outputs, they are transparently disclosed as **NOT VERIFIED / BLOCKED** locally, with SQLite certified as the automated testbed fallback.

### Q16: Is ThreatShield considered production-ready?
**Answer**: No. ThreatShield is classified as a **research-grade, production-inspired cybersecurity prototype**. It successfully proves the mathematical and architectural feasibility of trust-weighted federated threat intelligence sharing, but requires staging deployment on distributed cloud infrastructure before enterprise production use.
