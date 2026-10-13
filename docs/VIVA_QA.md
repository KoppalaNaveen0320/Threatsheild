# THREATSHIELD — COMPREHENSIVE VIVA & DEFENSE QUESTIONS & ANSWERS

---

## 1. General Cyber Threat Intelligence (CTI)

### Q1.1: What is Cyber Threat Intelligence (CTI)?
**Answer**: CTI is evidence-based cybersecurity knowledge—including context, mechanisms, indicators, implications, and actionable advice—about existing or emerging hazards to digital assets. It spans Indicators of Compromise (IOCs like IP addresses, hashes, domains), Tactics, Techniques, and Procedures (TTPs), and threat actor profiles.

### Q1.2: Why is cross-organizational CTI sharing essential?
**Answer**: Cyber adversaries execute synchronized campaigns across entire industry sectors, attacking multiple targets in parallel. If organizations defend in isolation, each entity must discover and suffer every attack individually. Collaborative CTI sharing transforms private defense into collective immune defense: an attack detected by organization A immediately informs the automated defenses of organizations B, C, and D.

### Q1.3: Why is privacy the main barrier to CTI sharing?
**Answer**: Sharing raw internal telemetry, IP traffic, and network logs risks disclosing intellectual property, proprietary network architecture, customer identities, and compliance violations (e.g., GDPR, HIPAA). Without mathematical and cryptographic privacy guarantees, organizations refrain from sharing.

### Q1.4: Why ThreatShield? What makes it distinct?
**Answer**: Existing platforms (like MISP or centralized TIPs) require central trust and either share raw data or risk poisoning from untrusted peers. ThreatShield unites three synergistic pillars:
1. **Privacy-Preserving Federated Learning**: Trains ML detection models across organizations without moving raw telemetry.
2. **Multi-Factor Dynamic Trust**: Dynamically evaluates peer reliability to prevent poisoning and spam.
3. **Cryptographic Audit Ledger**: Guarantees immutable attribution and tamper-evident event recording.

---

## 2. Existing Systems & Standards

### Q2.1: What is MISP?
**Answer**: Malware Information Sharing Platform (MISP) is an open-source threat intelligence platform for sharing, storing, and correlating IOCs. While effective for manual sharing, standard MISP instances lack decentralized federated model training, formal differential privacy budget accounting, and automated reputation-weighted model aggregation.

### Q2.2: What is OASIS STIX?
**Answer**: Structured Threat Information Expression (STIX 2.1) is a standardized, graph-based JSON serialization format developed by OASIS for representing cyber threat intelligence. ThreatShield implements native mapping from internal threat indicators to STIX 2.1 `Indicator` and `Identity` objects for seamless ecosystem interoperability.

### Q2.3: What are the fundamental limitations of centralized CTI systems?
**Answer**:
- **Single Point of Failure / Compromise**: Central databases can be breached or subverted.
- **Privacy Leakage**: Raw submissions stored centrally can leak internal IP structures and victim identities.
- **Vulnerability to False / Poisoned Data**: Without Byzantine-tolerant weighting, malicious or noisy participants can poison collective threat models.

---

## 3. Privacy Architecture

### Q3.1: What is Differential Privacy (DP)?
**Answer**: Differential Privacy is a rigorous mathematical framework ensuring that an algorithm's output distribution does not significantly depend on the presence or absence of any single record in the input dataset:
$$P[\mathcal{M}(D_1) \in S] \le e^\epsilon \cdot P[\mathcal{M}(D_2) \in S]$$

### Q3.2: What does the parameter $\epsilon$ (epsilon) represent?
**Answer**: $\epsilon$ is the privacy loss budget. Smaller $\epsilon$ values impose stronger privacy guarantees by injecting higher-magnitude noise, whereas larger $\epsilon$ values offer higher utility and precision at the cost of lower privacy protection.

### Q3.3: Why use the Laplace Mechanism?
**Answer**: For real-valued numerical queries with global sensitivity $\Delta f$, adding noise drawn from $\text{Lap}(0, \Delta f / \epsilon)$ is the canonical and optimal mechanism for achieving $\epsilon$-pure differential privacy.

### Q3.4: What role does AES-256-GCM play in ThreatShield?
**Answer**: AES-256-GCM provides authenticated symmetric encryption (AEAD) with 96-bit unique nonces, protecting sensitive indicator payloads at rest and ensuring ciphertext confidentiality and integrity.

### Q3.5: Why isn't encryption alone sufficient for privacy-preserving analytics?
**Answer**: Encryption protects data in transit and at rest, but plaintext must be decrypted to perform analytics or train models in standard architectures. Differential Privacy and Federated Learning allow collaborative computation and statistical analysis *without ever exposing raw plaintext data*.

---

## 4. Federated Learning & Machine Learning

### Q4.1: What is FedAvg?
**Answer**: Federated Averaging (FedAvg) is the standard baseline aggregation algorithm where a central coordinator averages client model parameters weighted proportionally to each client's sample count:
$$\mathbf{w}_{t+1} = \sum_{k=1}^K \frac{n_k}{n} \mathbf{w}_{t+1}^k$$

### Q4.2: What is Non-IID data and why is it critical in cybersecurity?
**Answer**: In real-world enterprise deployments, network traffic is **Non-Identically and Independently Distributed (Non-IID)**. A financial bank sees high volumes of banking trojans and web attacks, whereas an industrial plant sees SCADA/ICS anomalies. ThreatShield explicitly validates against Dirichlet non-IID partitions ($\alpha = 0.3$).

### Q4.3: Why choose Flower (flwr) and PyTorch?
**Answer**: Flower provides a lightweight, modular, and framework-agnostic federated learning orchestration engine capable of scaling from local research simulations to distributed network deployments. PyTorch enables dynamic neural network computation and seamless gradient/parameter tensor manipulation.

### Q4.4: What is model parameter poisoning?
**Answer**: An adversarial attack where compromised or rogue clients send intentionally manipulated gradient or weight updates (e.g., Gaussian noise perturbation, sign-flip attacks) designed to degrade global model accuracy or install malicious backdoors.

---

## 5. Trust Engine & Mathematical Formulations

### Q5.1: How is the raw contribution factor $W_i$ computed?
**Answer**:
$$W_i = T_i \times Q_i \times (1 - A_i)$$
where $T_i$ is historical reputation, $Q_i$ is CTI quality, and $A_i$ is the L2 parameter anomaly score.

### Q5.2: How are normalized weights $\hat{W}_i$ calculated?
**Answer**:
$$\hat{W}_i = \frac{W_i}{\sum_{j=1}^K W_j} \quad \text{guaranteeing} \quad \sum_{i=1}^K \hat{W}_i = 1.0$$

### Q5.3: How does the Trust Score $T_i$ update over time?
**Answer**: Via an Exponential Moving Average (EMA):
$$T_{\text{new}} = T_{\text{old}} \times (1 - \alpha) + \alpha \times S_{\text{feedback}}$$
with learning factor $\alpha = 0.1$, bound strictly within $[0.0, 1.0]$.

### Q5.4: How is CTI Quality $Q_i$ evaluated?
**Answer**: Aggregates peer feedback ($S \in \{1.0 \text{ [Confirmed]}, 0.8 \text{ [Useful]}, 0.2 \text{ [Not Useful]}, 0.0 \text{ [False Positive]}\}$) weighted by feedback confidence and exponential time-decay $\lambda^t$ ($\lambda = 0.95$).

### Q5.5: How is the Update Anomaly Score $A_i$ computed?
**Answer**: By measuring the L2 Euclidean deviation of client parameters $\mathbf{w}_i$ from the median update norm:
$$A_i = \min\left(1.0, \frac{\|\mathbf{w}_i - \mathbf{w}_{\text{med}}\|_2}{\|\mathbf{w}_{\text{med}}\|_2 + 10^{-9}}\right)$$

---

## 6. Security & Ledger Integrity

### Q6.1: How does ThreatShield defend against model poisoning?
**Answer**: When a malicious client injects perturbed weights, its L2 norm deviates sharply from benign updates, driving $A_i \to 1.0$. The trust engine attenuates $W_i \to 0$, reducing malicious aggregation weight by **99.38% to 99.91%** and preserving global model accuracy.

### Q6.2: How does the Cryptographic Ledger detect tampering?
**Answer**: Every block contains:
$$\text{current\_hash} = \text{SHA-256}(\text{previous\_hash} \,\|\, \text{payload\_hash} \,\|\, \text{canonical\_timestamp})$$
If an adversary modifies any historical payload, timestamp, or previous hash, all subsequent block hashes fail verification during chain audit.

### Q6.3: Why is canonical serialization mandatory for the ledger?
**Answer**: Different JSON encoders order dictionary keys arbitrarily and databases format timestamps with varying microsecond precision. ThreatShield enforces strict deterministic JSON (`sort_keys=True`, compact separators) and ISO 8601 UTC zero-microsecond timestamps to guarantee zero false-positive tampering alarms.

---

## 7. Limitations & Honest Engineering Disclosures

### Q7.1: Why was SQLite used during local validation?
**Answer**: SQLite provides a zero-dependency, local file-based testing engine allowing reproducible automated test suite execution without external daemon dependencies.

### Q7.2: Why do PostgreSQL and Docker remain unverified?
**Answer**: In the current test environment, the `psql` command-line utility and the Docker daemon service were unprovisioned. To maintain research integrity, PostgreSQL and Docker are explicitly reported as **NOT VERIFIED / BLOCKED** rather than falsely claiming compatibility.

### Q7.3: Why is simulated FL different from WAN deployment?
**Answer**: Local FL simulations evaluate convergence and mathematical robustness under zero network packet drop and synchronous thread execution. True enterprise WAN deployments encounter asymmetric network latency, dropped TCP connections, and asynchronous client dropouts, which require dedicated production orchestration.
