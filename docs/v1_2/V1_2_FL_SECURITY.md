# ThreatShield v1.2 — Federated Learning Security & Adversarial Defense Guide

## Overview

ThreatShield v1.2 provides an enterprise Adversarial Defense Lab for evaluating 7 robust federated aggregation algorithms under non-IID client distributions and active Byzantine poisoning attacks.

---

## 1. Supported Aggregation Algorithms

1. **Trust-Weighted FedAvg:** Combines client dataset volume $n_k$ with dynamic organization trust score $T_k$:
   $$w_{global} = \sum_{k=1}^K \frac{n_k T_k}{\sum_j n_j T_j} w_k$$
2. **Standard FedAvg (McMahan et al.):** Baseline volume-weighted aggregation ($w_{global} = \sum \frac{n_k}{N} w_k$).
3. **FedProx (Li et al.):** Adds proximal regularization term $\frac{\mu}{2} \|w - w^t\|^2$ ($\mu = 0.01$) to stabilize heterogeneous local objectives.
4. **Multi-Krum (Blanchard et al.):** Selects $m = K - f - 2$ gradient updates that minimize pairwise Euclidean distances to peers, filtering Byzantine outliers.
5. **Clipped FedAvg:** Clips update norms to radius $C = 1.0$ before averaging: $w_k \gets w_k \cdot \min(1, C / \|w_k\|_2)$.
6. **Coordinate-wise Trimmed Mean:** Trims the upper and lower $\beta = 0.20$ fraction of parameters along each dimension.
7. **Coordinate-wise Median:** Aggregates coordinate-wise medians across all participating clients.

---

## 2. Adversarial Threat Models & Mitigations

| Attack Type | Mathematical Formulation | Best Defense Aggregator |
|---|---|---|
| **Gaussian Parameter Poisoning** | $w_k \sim \mathcal{N}(0, \sigma^2 \mathbf{I})$ with $\sigma \in [1.0, 5.0]$ | Multi-Krum / Clipped FedAvg |
| **Gradient Sign-Flip** | $w_k \gets -s \cdot w_k$ with scaling $s = 2.0$ | Trust-Weighted / Coordinate Median |
| **Sybil Collusion Attack** | Colluding subset $C \subset [K]$ submits identical malicious updates | Multi-Krum + Pairwise Cosine Similarity Filtering |

### Research Terminology Standard:
- **$\Delta\text{Accuracy} = \text{Accuracy}_{\text{clean}} - \text{Accuracy}_{\text{poisoned}}$**
- **Positive $\Delta\text{Accuracy}$:** Performance degraded under poisoning.
- **Negative $\Delta\text{Accuracy}$:** Performance improved relative to clean baseline (labeled as *Improved vs. clean baseline*).
