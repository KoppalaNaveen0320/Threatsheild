# ThreatShield v1.1 — Comprehensive Viva & Oral Defense Q&A

This document contains technically rigorous, defensible questions and answers with complete mathematical derivations for viva examinations, academic defenses, and technical interviews.

---

## 1. Cyber Threat Intelligence (CTI) & STIX 2.1

### Q1: Why is STIX 2.1 used instead of unstructured JSON or MISP format?
**Answer**:
OASIS STIX 2.1 provides a graph-based standard for Cyber Threat Intelligence consisting of STIX Domain Objects (SDOs, e.g. `indicator`, `malware`, `threat-actor`) and STIX Relationship Objects (SROs, e.g. `relationship`, `sighting`). In ThreatShield, mapping raw indicators into STIX 2.1 ensures semantic interoperability across defense alliance partners, eliminates proprietary schema lock-in, and provides first-class support for sightings and confidence modeling.

### Q2: How does ThreatShield handle CTI normalization and deduplication?
**Answer**:
CTI indicators arrive with heterogeneous casing, schemes, and whitespace (e.g. `  HTTPS://Example-C2.COM/path  `). `CTINormalizer` applies deterministic syntax trees:
- IP addresses: Strips whitespace, parses IPv4/IPv6, rejects invalid octets.
- Domain names: Strips protocol prefixes (`https://`), trailing paths (`/path`), converts to lowercase ASCII.
- Hashes: Validates hex characters and exact length (MD5: 32, SHA-1: 40, SHA-256: 64).
Deduplication calculates an exact hash of the canonical normalized value to prevent duplicate CTI flooding.

---

## 2. Privacy & Cryptography

### Q3: What is Differential Privacy, and how does the Laplace mechanism work?
**Answer**:
A randomized mechanism $\mathcal{M}$ provides $\epsilon$-Differential Privacy if for any two neighboring datasets $D_1, D_2$ differing by at most one individual sample, and any subset of query outputs $S \subseteq \text{Range}(\mathcal{M})$:
$$\mathbb{P}[\mathcal{M}(D_1) \in S] \le e^\epsilon \cdot \mathbb{P}[\mathcal{M}(D_2) \in S]$$

ThreatShield implements the Laplace mechanism for numeric CTI aggregate queries:
$$\mathcal{M}(x) = f(x) + \text{Laplace}\left(0, \frac{\Delta f}{\epsilon}\right)$$
where $\Delta f = \max \Vert f(D_1) - f(D_2) \Vert_1 = 1.0$ is the $L_1$-sensitivity (e.g., counting sightings), and $\epsilon > 0$ is the privacy loss parameter. The noise probability density is:
$$p(z) = \frac{1}{2b} \exp\left(-\frac{|z|}{b}\right), \quad b = \frac{\Delta f}{\epsilon}$$
Variance is $\sigma^2 = 2b^2 = \frac{2 (\Delta f)^2}{\epsilon^2}$.

### Q4: How does the Zero-Sum Secure Aggregation Prototype work?
**Answer**:
For $N$ clients, each client $i$ agrees on a shared pairwise pseudo-random seed with client $j$ ($j \ne i$) using a symmetric hash function $H(i, j) = H(j, i)$. The pairwise noise vector is $S_{ij} = -S_{ji}$.
Each client masks its parameter update:
$$\Delta W_{masked, i} = \Delta W_i + \sum_{j > i} S_{ij} - \sum_{j < i} S_{ji}$$
When the central server computes the sum of all masked updates:
$$\sum_{i=1}^N \Delta W_{masked, i} = \sum_{i=1}^N \Delta W_i + \sum_{i=1}^N \left( \sum_{j > i} S_{ij} - \sum_{j < i} S_{ji} \right) = \sum_{i=1}^N \Delta W_i$$
All pairwise masks cancel out to zero, revealing the aggregate update while keeping individual gradients $\Delta W_i$ confidential from the server.
**Limitation**: If any client drops out asynchronously, cancellation fails; full production deployment requires threshold secret sharing (e.g. Bonawitz et al. 2017).

---

## 3. Federated Learning & Poisoning Defense

### Q5: What is the non-IID data challenge, and how is it simulated with Dirichlet distribution?
**Answer**:
In real-world collaborative cybersecurity, organizations experience non-identical attack profiles (non-IID data). Dirichlet distribution $\text{Dir}(\alpha)$ partitions class distributions across $K$ clients:
$$p_k \sim \text{Dir}(\alpha \cdot \mathbf{1})$$
Small $\alpha$ (e.g. $\alpha = 0.3$) produces high statistical heterogeneity (one client observes mostly port scans, another observes web attacks). This challenges standard FedAvg, which assumes IID client parameter convergence.

### Q6: How does ThreatShield detect and neutralize model poisoning?
**Answer**:
ThreatShield computes a multi-signal anomaly metric $A_i \in [0, 1]$ combining:
1. **L2 Norm Divergence**:
   $$D_{L2, i} = \frac{|\Vert \Delta W_i \Vert_2 - \text{median}(\Vert \Delta W \Vert_2)|}{\text{median}(\Vert \Delta W \Vert_2) + \epsilon}$$
2. **Cosine Similarity**:
   $$\text{Cos}_i = \frac{\Delta W_i \cdot \Delta W_{ref}}{\Vert \Delta W_i \Vert_2 \Vert \Delta W_{ref} \Vert_2}$$
3. **Combined Anomaly**:
   $$A_i = \text{clip}(0.5 D_{L2, i} + 0.5 \max(0, 1 - \text{Cos}_i), 0.0, 1.0)$$

The client aggregation weight is discounted:
$$W_i = T_i \cdot Q_i \cdot (1 - A_i)$$
where $T_i$ is organization trust and $Q_i$ is historical CTI quality. Malicious updates with anomalous norms or inverted gradients are suppressed ($W_{mal} \le 0.0001$).

### Q7: Why is clean accuracy between Trust-Weighted FedAvg and FedAvg very close ($+0.28\%$)?
**Answer**:
In a clean federation where all clients are benign and trusted ($T_i \approx 0.90, A_i \approx 0.0$), Trust-Weighted weights $W_i$ are approximately uniform, behaving similarly to FedAvg. The mathematical design intentionally avoids distorting clean federated convergence while providing catastrophic failure prevention under adversarial poisoning.

---

## 4. Cryptographic Audit Ledger & Governance

### Q8: How is the Cryptographic Audit Ledger constructed? Is it a blockchain?
**Answer**:
It is a **Permissioned Cryptographic Hash-Chain Audit Ledger**, not a decentralized blockchain. Each block $B_k$ is linked to the previous block via SHA-256:
$$\text{Hash}_k = \text{SHA256}\left(\text{Hash}_{k-1} \,\|\, \text{SHA256}(\text{CanonicalJSON}(\text{Payload}_k)) \,\|\, \text{Timestamp}_k\right)$$
It provides tamper-evidence without the computational overhead or token economics of proof-of-work consensus.
