# ThreatShield v1.1 — Experimental Evaluation & Comparative Benchmark Report

---

## 1. Experimental Setup & Reproducibility Protocol

- **Dataset**: $N = 2500$ samples, 78 network flow features (CIC-IDS2017 feature representation), binary classification (Normal vs Malicious).
- **Evaluation Split**: $20\%$ ($N_{test} = 500$) strictly held out as an independent Global Test Set.
- **Federation Size**: $K = 5$ organizations partitioned via **Dirichlet distribution ($\alpha = 0.3$)**.
- **Seeds**: `[42, 123, 456, 789, 2024]`.
- **Command to Reproduce**:
  ```powershell
  python experiments/v1_1/run_research_experiments_v1_1.py
  python experiments/v1_1/benchmark_performance_v1_1.py
  ```

---

## 2. Multi-Aggregator Baseline Comparison (Clean Federation, 5 Seeds)

| Aggregation Strategy | Accuracy (Mean ± Std) | Macro F1 | Aggregation Latency (ms) | Operational Characteristics |
| :--- | :--- | :--- | :--- | :--- |
| **Standard FedAvg** | `63.68% ± 12.35%` | `0.5848` | `0.6430 ms` | Linear aggregation, minimal compute overhead |
| **Coordinate-wise Median** | `57.24% ± 14.10%` | `0.5098` | `5.0930 ms` | Robust to outliers; higher coordinate variance on non-IID data |
| **Trimmed Mean ($\beta=0.20$)** | `59.52% ± 13.62%` | `0.5377` | `3.8943 ms` | Balanced coordinate trimming |
| **Trust-Weighted FedAvg** | `63.96% ± 12.44%` | `0.5880` | `1.2981 ms` | **Maintains optimal clean convergence + lowest non-IID degradation** |

---

## 3. Multi-Attack Poisoning Stress Testing v1.1

$$\Delta\text{Accuracy} = \text{Accuracy}_{clean} - \text{Accuracy}_{poisoned}$$
$$\text{Malicious Influence Reduction} = \frac{W_{FedAvg} - W_{TrustWeighted}}{W_{FedAvg}}$$

| Attack Vector | Intensity | Standard FedAvg Acc | FedAvg $\Delta\text{Acc}$ | Trust-Weighted Acc | Trust-Weighted $\Delta\text{Acc}$ | Malicious Weight ($W_{mal}$) | Influence Reduction |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Gaussian Parameter Noise** | `10%` | `49.24%` | `+14.44%` (Degraded) | **`65.36%`** | `-1.40%` (Improved vs. clean baseline) | `0.0001` | **`99.9%`** |
| **Gaussian Parameter Noise** | `20%` | `52.96%` | `+10.72%` (Degraded) | **`65.24%`** | `-1.28%` (Improved vs. clean baseline) | `0.0001` | **`99.9%`** |
| **Gaussian Parameter Noise** | `30%` | `48.96%` | `+14.72%` (Degraded) | **`65.32%`** | `-1.36%` (Improved vs. clean baseline) | `0.0000` | **`100.0%`** |
| **Gaussian Parameter Noise** | `40%` | `49.28%` | `+14.40%` (Degraded) | **`65.32%`** | `-1.36%` (Improved vs. clean baseline) | `0.0000` | **`100.0%`** |
| **Gradient Sign Flip Attack** | `-1.5x` | `51.20%` | `+12.48%` (Degraded) | **`65.28%`** | `-1.32%` (Improved vs. clean baseline) | `0.0002` | **`99.9%`** |
| **Parameter Scaling Attack** | `10.0x` | `48.80%` | `+14.88%` (Degraded) | **`65.30%`** | `-1.34%` (Improved vs. clean baseline) | `0.0001` | **`99.9%`** |

---

## 4. Differential Privacy vs. Utility Empirical Results v1.1

Evaluated across 500 noise queries ($\text{Ground Truth} = 150.0, \Delta f = 1.0$):

| Epsilon ($\epsilon$) | Laplace Scale ($b = \Delta f / \epsilon$) | Theoretical Std ($\sigma$) | Empirical MAE | Empirical RMSE | Relative Error |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`0.1`** | `10.00` | `14.14` | `10.08` | `14.14` | `6.72%` |
| **`0.5`** | `2.00` | `2.83` | `2.03` | `2.87` | `1.35%` |
| **`1.0`** | `1.00` | `1.41` | `0.99` | `1.41` | `0.66%` |
| **`2.0`** | `0.50` | `0.71` | `0.49` | `0.68` | `0.33%` |
| **`5.0`** | `0.20` | `0.28` | `0.19` | `0.27` | `0.13%` |
| **`10.0`** | `0.10` | `0.14` | `0.09` | `0.14` | `0.06%` |

---

## 5. Local Prototype Subsystem Performance Benchmark v1.1

| Subsystem Component | Tested Operation | Mean Latency | Throughput | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **CTI Normalizer** | Multi-type validation & syntactic normalization | `0.0091 ms` | $110,463$ ops/s | **VERIFIED** |
| **STIX 2.1 Engine** | SDO + SRO bundle JSON serialization (10 items) | `8.6158 ms` | $116.1$ ops/s | **VERIFIED** |
| **Correlation Engine** | Multi-entity graph construction & relational analytics | `0.8903 ms` | $1,123.2$ ops/s | **VERIFIED** |
| **Trust Engine** | Bounded EMA update & audit history logging | `0.4637 ms` | $2,156.7$ ops/s | **VERIFIED** |
| **Relevance & Decision Engine** | Multi-factor Quality, Relevance, and ThreatShield scoring | `0.0141 ms` | $71,081.3$ ops/s | **VERIFIED** |
| **Differential Privacy** | Laplace noise generation & epsilon deduction | `0.0117 ms` | $85,481.0$ ops/s | **VERIFIED** |
| **Audit Ledger Append** | SHA-256 canonical hashing & persistent chain append | `5.0056 ms` | $199.8$ ops/s | **VERIFIED** |
| **Audit Ledger Verify** | Full cryptographic hash-chain integrity verification | `11.6458 ms` | $85.9$ ops/s | **VERIFIED** |
| **Secure Aggregation** | 4-Client pairwise mask generation & zero-sum aggregation | `2.7902 ms` | $358.4$ ops/s | **VERIFIED** |
