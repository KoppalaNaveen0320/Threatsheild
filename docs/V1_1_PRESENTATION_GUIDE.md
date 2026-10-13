# ThreatShield v1.1 — Academic Presentation & Research Defense Slide Guide

This document structures a slide-by-slide academic presentation for conference presentations, thesis defenses, and examiner evaluations.

---

## Slide 1: Title & Core Problem Statement
- **Title**: ThreatShield: A Trust-Weighted Federated Learning and Cryptographically Audited Threat Intelligence Architecture
- **Research Question**: *"How can mutually untrusted organizations collaboratively train intrusion detection models and share CTI without exposing sensitive internal data or succumbing to malicious model poisoning?"*
- **Key Trilemma Solved**: Collaboration $\leftrightarrow$ Privacy $\leftrightarrow$ Adversarial Robustness.

---

## Slide 2: Multi-Tenant Architecture & Governance
- Multi-organization defense alliance with strict Role-Based Access Control (RBAC): `ADMIN`, `ANALYST`, `VALIDATOR`, `THREAT_CONSUMER`.
- Ingestion pipeline: Syntactic Normalization $\to$ STIX 2.1 mapping $\to$ Graph Analytics $\to$ Sector Relevance Engine.
- Cryptographic accountability: Permissioned SHA-256 Hash-Chain Audit Ledger.

---

## Slide 3: Decoupling Confidence, Quality, Trust, and Relevance
- **Confidence ($C_i$)**: How confident is the submitter in the indicator?
- **Quality ($Q_i$)**: Historical reliability across peer confirmations ($Q_i = 0.35 C_i + 0.25 F_i + 0.25 S_i + 0.15 H_i$).
- **Trust ($T_k$)**: Bounded reputation moving average ($T_k(t) = 0.85 T_k(t-1) + 0.15 E_k(t)$).
- **ThreatShield Decision Score ($\text{TS}_{ij}$)**:
  $$\text{TS}_{ij} = 0.35 Q_i + 0.25 T_i + 0.25 R_{ij} + 0.15 F_i$$

---

## Slide 4: Federated Learning Robustness & Anomaly Detection
- **Multi-Signal Anomaly Metric ($A_i$)**:
  $$D_{L2} = \frac{|\Vert \Delta W_i \Vert_2 - \text{median}(\Vert \Delta W \Vert_2)|}{\text{median}(\Vert \Delta W \Vert_2) + \epsilon}$$
  $$\text{Cos}_i = \frac{\Delta W_i \cdot \Delta W_{ref}}{\Vert \Delta W_i \Vert_2 \Vert \Delta W_{ref} \Vert_2}$$
  $$A_i = \text{clip}(0.5 D_{L2} + 0.5 \max(0, 1 - \text{Cos}_i), 0.0, 1.0)$$
- **Trust-Weighted Aggregation**:
  $$W_i = T_i \cdot Q_i \cdot (1 - A_i), \quad \hat{W}_i = \frac{W_i}{\sum_j W_j}, \quad W_{global} = \sum_i \hat{W}_i W_i$$

---

## Slide 5: Empirical Results & Comparative Benchmark
- **Multi-Aggregator Comparison (Clean Federation, 5 Seeds, Dirichlet $\alpha = 0.3$)**:
  - Trust-Weighted FedAvg: `63.96% ± 12.44%` Accuracy | `0.5880` Macro F1
  - Standard FedAvg: `63.68% ± 12.35%` Accuracy | `0.5848` Macro F1
  - Trimmed Mean ($\beta=0.20$): `59.52% ± 13.62%` Accuracy | `0.5377` Macro F1
  - Coordinate-wise Median: `57.24% ± 14.10%` Accuracy | `0.5098` Macro F1
- **Poisoning Suppression**:
  - Malicious update weight suppressed to $W_{mal} \le 0.0001$ ($99.9\% - 100.0\%$ reduction).
  - Accuracy degradation avoided under Gaussian parameter noise ($\Delta\text{Accuracy} = -1.28\% \text{ to } -1.40\%$, Improved vs. clean baseline).

---

## Slide 6: Privacy Guarantees & Cryptographic Ledger
- **Differential Privacy**: Calibrated Laplace perturbation with per-organization budget tracking ($\epsilon_{remaining} \ge 0$).
- **Secure Aggregation Prototype**: Zero-sum pairwise additive masking ($\sum_{i=1}^N \Delta W_{masked, i} = \sum_{i=1}^N \Delta W_i$).
- **Cryptographic Hash-Chain Ledger**: Continuous SHA-256 block linking with tamper verification.

---

## Slide 7: Research Limitations & Future Directions
- Explicitly documented prototype boundaries:
  - Secure Aggregation: Zero-sum prototype (asynchronous dropout tolerance with threshold secret sharing is future work).
  - Production DB/Deployment: Evaluated in local simulated research environment.
