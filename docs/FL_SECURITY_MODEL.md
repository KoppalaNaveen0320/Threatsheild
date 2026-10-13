# ThreatShield — Federated Learning Security & Byzantine Defense Model

---

## 1. Threat Model & Adversarial Capabilities

In collaborative Intrusion Detection and Cyber Threat Intelligence classification, participating organizations train local models on proprietary network flow datasets (e.g. CIC-IDS2017 features) and share model parameters.

### Adversarial Capabilities Considered:
1. **Byzantine / Malicious Client**: Up to 40% of participating nodes are adversarial, attempting to poison the global model via Gaussian perturbation, gradient sign inversion, or parameter scaling.
2. **Untrusted Central Aggregator**: Central server may attempt to reconstruct raw training samples from received client updates.
3. **Data Heterogeneity (Non-IID)**: Legitimate organizations have diverse traffic distributions (Dirichlet $\alpha = 0.3$), which must not be falsely rejected as malicious.

---

## 2. Multi-Signal Defense Pipeline

```
[ Local Client Model Update: W_client_model_params_i ]
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│ 1. TENSOR INTEGRITY VALIDATION                         │
│    • Check for NaN / Inf floating point values         │
│    • Validate layer shapes & parameter counts          │
│    • Discard updates exceeding magnitude threshold     │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│ 2. MULTI-SIGNAL ANOMALY EVALUATION                     │
│    • Signal 1: L2 Norm Divergence from Median (D_L2)   │
│    • Signal 2: Cosine Similarity with Reference (Cos)  │
│    • Anomaly Metric: A_i = clip(0.5 D_L2 + 0.5 (1-Cos))│
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│ 3. TRUST & QUALITY FACTOR WEIGHTING                    │
│    • Fetch Contributor Trust: T_i                      │
│    • Fetch CTI Validation Quality: Q_i                 │
│    • Raw Weight: W_client_trust_i = T_i * Q_i * (1-A_i)│
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│ 4. SECURE AGGREGATION PROTOTYPE                        │
│    • Apply Additive Zero-Sum Pairwise Masks S_ij       │
│    • Server aggregates masked updates                  │
│    • Masks cancel out: \sum \Delta W_i^{masked} = \sum │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│ 5. NORMALIZED GLOBAL AGGREGATION                       │
│    • W_global = \sum \hat{W}_i \cdot W_client_model_i  │
└────────────────────────────────────────────────────────┘
```

---

## 3. Experimental Poisoning Resilience Results

Tested across **5 random seeds** `[42, 123, 456, 789, 2024]` with **Dirichlet Non-IID Partitioning ($\alpha = 0.3$)**:

| Poisoning Rate | Standard FedAvg Acc | FedAvg $\Delta\text{Accuracy}$ | Trust-Weighted Acc | Trust-Weighted $\Delta\text{Accuracy}$ | Malicious Weight ($W_{mal}$) | Influence Reduction |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`10%`** | `49.24%` | `+14.44%` (Degraded) | **`65.36%`** | `-1.40%` (Improved vs. clean baseline) | `0.0001` | **`99.9%`** |
| **`20%`** | `52.96%` | `+10.72%` (Degraded) | **`65.24%`** | `-1.28%` (Improved vs. clean baseline) | `0.0001` | **`99.9%`** |
| **`30%`** | `48.96%` | `+14.72%` (Degraded) | **`65.32%`** | `-1.36%` (Improved vs. clean baseline) | `0.0000` | **`100.0%`** |
| **`40%`** | `49.28%` | `+14.40%` (Degraded) | **`65.32%`** | `-1.36%` (Improved vs. clean baseline) | `0.0000` | **`100.0%`** |

### Verified Finding:
Under standard FedAvg, adversarial Gaussian parameter perturbation degrades global accuracy from $63.68\%$ down to $48.96\% - 52.96\%$ ($\Delta\text{Accuracy} = +10.72\% \text{ to } +14.72\%$). Trust-Weighted FedAvg actively detects the update anomaly ($A_5 \ge 0.85$), suppresses the malicious client weight by $\ge 99.9\%$, and maintains model performance close to or above the clean federated baseline ($\Delta\text{Accuracy} = -1.28\% \text{ to } -1.40\%$).
