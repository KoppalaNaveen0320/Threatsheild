# ThreatShield — Experimental Research Results & Verified Metrics

---

## 1. Baseline Performance Comparison

Measured across **5 frozen seeds** `[42, 123, 456, 789, 2024]` on a held-out test set ($N_{test} = 500$, Dirichlet non-IID $\alpha = 0.3$ across $K = 5$ organizations):

| Baseline Model | Evaluation Type | Accuracy (Mean ± Std) | Macro F1 | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Centralized ML — Empirical** | Pooled dataset benchmark ($N_{test}=500$) | **`94.12% ± 1.94%`** | **`0.9409`** | **VERIFIED** |
| **Local Isolated Model** | Single organization average | **`66.68% ± 1.05%`** | **`0.6139`** | **VERIFIED** |
| **Standard FedAvg (Clean Federation)** | Collaborative uniform weighting ($1/K=0.20$) | **`63.68% ± 12.35%`** | **`0.5848`** | **VERIFIED** |
| **Trust-Weighted FedAvg (Clean Federation)** | Multi-factor anomaly-weighted aggregation | **`63.96% ± 12.44%`** | **`0.5880`** | **VERIFIED** |

---

## 2. Adversarial Poisoning Attack Results

$$\Delta\text{Accuracy} = \text{Accuracy}_{clean} - \text{Accuracy}_{poisoned}$$
$$\text{Malicious Influence Reduction} = \frac{W_{FedAvg} - W_{TrustWeighted}}{W_{FedAvg}}$$

| Poisoning Rate | Standard FedAvg Acc | FedAvg $\Delta\text{Accuracy}$ | Trust-Weighted Acc | Trust-Weighted $\Delta\text{Accuracy}$ | Malicious Weight ($W_{mal}$) | Influence Reduction |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`10%`** | `49.24%` | `+14.44%` (Degraded) | **`65.36%`** | `-1.40%` (Improved vs. clean baseline) | `0.0001` | **`99.9%`** |
| **`20%`** | `52.96%` | `+10.72%` (Degraded) | **`65.24%`** | `-1.28%` (Improved vs. clean baseline) | `0.0001` | **`99.9%`** |
| **`30%`** | `48.96%` | `+14.72%` (Degraded) | **`65.32%`** | `-1.36%` (Improved vs. clean baseline) | `0.0000` | **`100.0%`** |
| **`40%`** | `49.28%` | `+14.40%` (Degraded) | **`65.32%`** | `-1.36%` (Improved vs. clean baseline) | `0.0000` | **`100.0%`** |

---

## 3. Differential Privacy vs. Utility Tradeoff

Measured across 500 query evaluations with ground truth count = 150.0 and sensitivity $\Delta f = 1.0$:

| Epsilon ($\epsilon$) | Laplace Scale ($b = \Delta f / \epsilon$) | Theoretical Std ($\sigma$) | Empirical MAE | Empirical RMSE | Relative Error |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`0.1`** | `10.00` | `14.14` | `10.08` | `14.14` | `6.72%` |
| **`0.5`** | `2.00` | `2.83` | `2.03` | `2.87` | `1.35%` |
| **`1.0`** | `1.00` | `1.41` | `0.99` | `1.41` | `0.66%` |
| **`2.0`** | `0.50` | `0.71` | `0.49` | `0.68` | `0.33%` |
| **`5.0`** | `0.20` | `0.28` | `0.19` | `0.27` | `0.13%` |
| **`10.0`** | `0.10` | `0.14` | `0.09` | `0.14` | `0.06%` |

---

## 4. Local Prototype Subsystem Performance Benchmark

| Subsystem Component | Tested Operation | Mean Latency | Throughput | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **CTI Normalizer** | Syntax validation & normalization | `0.0088 ms` | $114,026$ ops/s | **VERIFIED** |
| **STIX 2.1 Engine** | Bundle 10 SDOs + SROs JSON serialization | `11.6634 ms` | $85.7$ ops/s | **VERIFIED** |
| **Ledger Block Append** | SHA-256 block creation & SQLite persist | `6.5062 ms` | $153.7$ ops/s | **VERIFIED** |
| **Ledger Verification** | Full chain SHA-256 check (10 blocks) | `4.9965 ms` | $200.1$ ops/s | **VERIFIED** |
| **Differential Privacy** | Laplace noise evaluation | `0.0094 ms` | $106,422$ ops/s | **VERIFIED** |
| **Secure Aggregation** | 4-Client Pairwise Mask & Aggregate | `8.3205 ms` | $120.2$ ops/s | **VERIFIED** |
