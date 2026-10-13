# ThreatShield — Experimental Methodology & Reproducibility Framework

---

## 1. Experimental Design & Seed Rigor

All ThreatShield evaluations follow strict reproducibility protocols:

```python
SEEDS = [42, 123, 456, 789, 2024]
NUM_CLIENTS = 5
DIRICHLET_ALPHA = 0.3
POISONING_RATES = [0.10, 0.20, 0.30, 0.40]
N_FEATURES = 78 # Standard Network Flow Feature Vector (CIC-IDS2017)
N_SAMPLES_TOTAL = 2500 # 2000 Training Partition, 500 Strictly Held-Out Global Test Set
```

### Reproducibility Command:
```powershell
.\venv\Scripts\python.exe scripts/run_research_experiments.py
.\venv\Scripts\python.exe scripts/benchmark_performance.py
```

---

## 2. Experimental Comparisons Summary

### 2.1 Baseline Performance (Mean over 5 Frozen Seeds, $N_{test} = 500$)
- **Centralized ML — Empirical**: `94.12% ± 1.94%` Accuracy | `0.9409` Macro F1
- **Local Isolated Model (Mean across 5 Orgs)**: `66.68% ± 1.05%` Accuracy | `0.6139` Macro F1
- **Standard FedAvg (Clean 5-Client Federation)**: `63.68% ± 12.35%` Accuracy | `0.5848` Macro F1
- **Trust-Weighted FedAvg (Clean Federation)**: `63.96% ± 12.44%` Accuracy | `0.5880` Macro F1

### 2.2 Poisoning Attack Resilience ($\Delta\text{Accuracy} = \text{Accuracy}_{clean} - \text{Accuracy}_{poisoned}$)
- **Standard FedAvg**: Performance degrades severely under Gaussian parameter poisoning with $\Delta\text{Accuracy} = +10.72\% \text{ to } +14.72\%$.
- **Trust-Weighted FedAvg**: Successfully isolates the compromised node ($W_{mal} \le 0.0001$, reducing malicious influence by $\ge 99.9\%$), maintaining predictive performance close to or above the clean federated baseline ($\Delta\text{Accuracy} = -1.28\% \text{ to } -1.40\%$).

### 2.3 Local Prototype Operational Benchmark (Measured Live)
- **CTI Normalization & Validation**: `0.0088 ms` ($114,026$ ops/sec)
- **STIX 2.1 Bundle Serialization**: `11.6634 ms` ($85.7$ ops/sec)
- **Cryptographic Ledger Append**: `6.5062 ms` ($153.7$ ops/sec)
- **Cryptographic Ledger Full Verification**: `4.9965 ms` ($200.1$ ops/sec)
- **Laplace Differential Privacy Noise**: `0.0094 ms` ($106,422$ ops/sec)
- **Secure Aggregation Prototype (4 Clients)**: `8.3205 ms` ($120.2$ ops/sec)

---

## 3. Persistent Machine-Readable Artifacts

All experimental runs save raw structured outputs to `results/`:
- `results/baseline_comparison.csv`
- `results/poisoning_experiments.csv`
- `results/privacy_utility.csv`
- `results/benchmark_performance.csv`
