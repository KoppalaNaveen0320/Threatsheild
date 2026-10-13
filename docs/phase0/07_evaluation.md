# Phase 0: Research Evaluation & Methodology

## 1. Experiment Methodology & Dataset Strategy

The evaluation phase (Phase 9) will use reproducible datasets containing network telemetry and mapped CTI.

- **Datasets:** Cyber-security standard datasets (e.g., CIC-IDS2017, UNSW-NB15) to simulate local ML training for intrusion detection. Public STIX feeds will be used for CTI relevance and trust scoring evaluation.
- **Partitioning Strategy:**
  - **IID (Independent and Identically Distributed):** All clients receive a balanced slice of the dataset.
  - **Non-IID:** Realistic skewed distribution. For example, Client A sees mostly DoS traffic, Client B sees mostly brute force, Client C sees mixed. Missing classes will be simulated.

## 2. Baseline Models (Phase 4)

Before introducing Trust-Weighted mechanisms, standard ML baselines will be established:
1. **Local ML:** Each client trains independently on its partition (lower accuracy, high privacy).
2. **Centralized ML:** All data is pooled to a central server (highest accuracy, zero privacy).
3. **Standard FedAvg:** Standard Federated Learning without anomaly or trust detection.

## 3. Metrics

- **ML Performance:** Global Accuracy, Precision, Recall, F1-Score, ROC-AUC.
- **Privacy vs Utility:** Measure the drop in model utility (Accuracy/F1) as the Differential Privacy budget ($\epsilon$) is restricted ($\epsilon = 0.1, 0.5, 1, 2, 5$).
- **System Overhead:** Database latency, API latency, Cryptographic Ledger processing overhead (transaction time, throughput).
- **Security Metrics:** Poisoning detection rate, Sybil detection rate, Replay detection rate, Trust degradation of malicious entities.

## 4. Attack Simulation Strategy (Phase 8)

Four distinct attack simulations will validate the ThreatShield defenses:
1. **Model Poisoning:** A client injects skewed gradients (10%, 20%, 30%, 40% poison ratios).
2. **Fake CTI:** A client continuously submits false CTI to test if feedback loops degrade its Trust Score effectively.
3. **Replay Attack:** Submitting duplicate historical CTI bundles to bypass quality freshness.
4. **Sybil-like Participants:** Simulating 4+ coordinated malicious nodes attempting to outvote the global model, evaluated through update correlation.
