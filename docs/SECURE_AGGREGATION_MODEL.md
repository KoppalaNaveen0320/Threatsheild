# THREATSHIELD — SECURE AGGREGATION & DATA VISIBILITY MODEL

**Classification**: Architecture & Privacy Specification  
**Version**: `v1.0 — Research Prototype`  
**Date**: August 2026

---

## 1. Introduction & Security Demarcation

In collaborative cyber defense and federated machine learning, cryptographic and privacy techniques are frequently conflated. ThreatShield enforces a strict mathematical and operational distinction between **Federated Learning**, **Differential Privacy**, **Secure Aggregation**, and **Authenticated Encryption at Rest**.

```
+--------------------------------------------------------------------------------------------------+
|                                    THREATSHIELD DEFENSE TIERS                                    |
+------------------------------------+------------------------------------+------------------------+
| Tier                               | Mechanism                          | Threat Mitigated       |
+------------------------------------+------------------------------------+------------------------+
| 1. Data Locality Boundary          | Edge-native Local Training         | Raw PCAP / Log Leakage |
| 2. Parameter Confidentiality       | Secure Tensor Aggregation          | Intermediary Sniffing  |
| 3. Statistical Privacy             | Laplace Differential Privacy (ε)   | Membership Inference   |
| 4. Sensitive Property Security     | AES-256-GCM AEAD (96-bit Nonce)    | Storage Tampering      |
| 5. Event Non-Repudiation           | SHA-256 Hash-Chain Audit Ledger    | History Rewriting      |
+------------------------------------+------------------------------------+------------------------+
```

---

## 2. Definitional Boundaries & Scope

### Tier 1: Federated Learning (FL)
- **What it is**: Distributed machine learning training protocol where edge nodes compute parameter updates $\mathbf{w}_i$ on local data and transmit only gradients/weights to the aggregation server.
- **What it does NOT do**: FL alone does **not** protect against membership inference (reconstructing whether a specific internal IP participated in the dataset) or model inversion attacks.

### Tier 2: Differential Privacy (DP)
- **What it is**: Formal mathematical framework that bounds the maximum information gain an adversary can achieve regarding any individual record $x \in D$:
  $$\mathcal{M}_{\text{Lap}}(D) = f(D) + \text{Lap}\left(0, \frac{\Delta f}{\epsilon}\right)$$
- **Application in ThreatShield**: Applied exclusively to **macro aggregate statistical queries** (e.g. global threat volume, active incident counts). Exact indicators (such as malicious IP addresses) are **not** perturbed because adding numerical noise to an IP or hash destroys operational security utility.
- **What it does NOT do**: DP does not encrypt parameter channels during transit.

### Tier 3: Secure Aggregation (SecAgg)
- **What it is**: Cryptographic multi-party protocol allowing the central server to compute the sum/weighted average $\sum \hat{W}_i \mathbf{w}_i$ without observing any individual client update $\mathbf{w}_i$ in plaintext.
- **ThreatShield Prototype Implementation**: In ThreatShield v1.0, secure aggregation is modeled via L2 anomaly-weighted parameter normalization with simulated masked tensor channels. ThreatShield does **not** claim production multi-party homomorphic encryption or threshold Shamir secret-sharing in the current prototype.

### Tier 4: Authenticated Encryption (AES-256-GCM AEAD)
- **What it is**: Symmetric Galois/Counter Mode encryption providing both confidentiality and cryptographic integrity verification via a 128-bit authentication tag and a unique 96-bit random nonce per record.
- **Application in ThreatShield**: Applied to sensitive internal threat descriptions and tenant properties stored in the relational database.

---

## 3. Data Visibility Matrix

The following matrix documents what each system participant is permitted to observe across the ThreatShield lifecycle:

| Data Asset | Local Client (Org A) | Peer Client (Org B) | FL Aggregator | External Auditor / SIEM |
|:---|:---:|:---:|:---:|:---:|
| **Raw Network PCAPs / Logs** | **Full Access** | *Zero Access* | *Zero Access* | *Zero Access* |
| **Local Model Parameters ($\mathbf{w}_A$)** | **Full Access** | *Zero Access* | Aggregated Only | *Zero Access* |
| **Global Aggregated Model ($\mathbf{w}_{\text{global}}$)** | Read-Only | Read-Only | Generated | *Zero Access* |
| **Submitted CTI Indicators (IOCs)** | Own Ingestion | Scoped Access | Scoped Access | Exported STIX 2.1 |
| **Macro Platform Statistics** | Noisy ($\epsilon$-DP) | Noisy ($\epsilon$-DP) | Noisy ($\epsilon$-DP) | Noisy ($\epsilon$-DP) |
| **Audit Ledger Hashes** | Verifiable | Verifiable | Verifiable | Cryptographically Auditable |

---

## 4. Academic & Engineering Limitations

1. **Simulated Multi-Party SecAgg**: ThreatShield v1.0 implements trust-weighted anomaly aggregation on local in-process client tensors. Real-world WAN cryptographic masking (e.g., Bonawitz et al. Secure Aggregation protocol) is noted as future work.
2. **Distinct Privacy Guarantees**: Differential privacy ($\epsilon$-DP) applies strictly to global statistical aggregations and must never be conflated with the parameter weight reduction provided by the Byzantine-tolerant trust engine.
