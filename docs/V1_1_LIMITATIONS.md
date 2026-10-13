# ThreatShield v1.1 — Known Limitations & Research Boundaries

---

## 1. Explicit Research Disclosures

In accordance with research integrity standards, this document clearly delineates verified capabilities from prototype features and known architectural limitations.

---

## 2. Subsystem Limitations

### 2.1 Secure Aggregation Prototype
- **Classification**: `Secure Aggregation Prototype — Zero-Sum Pairwise Masking`
- **Known Limitations**:
  - **Dropout Sensitivity**: The implemented zero-sum pairwise masking assumes all participating clients submit updates in each round. If a client drops offline after exchanging pairwise seeds, the masks will not sum to zero.
  - **Threshold Secret Sharing**: Full production-grade asynchronous dropout tolerance (e.g. Bonawitz et al. 2017 with $t$-out-of-$n$ Shamir secret sharing) is **NOT IMPLEMENTED** in the current prototype.
  - **Collusion Boundary**: If $N-1$ clients collude against a single victim client, pairwise secrets can be reconstructed.

### 2.2 Federated Learning & Non-IID Skew
- **Model Topology**: Fully-connected Multilayer Perceptron (`IntrusionDetectionNet`, 78 $\to$ 64 $\to$ 32 $\to$ 2) optimized for tabular network telemetry classification. Deep sequence models (LSTM / Transformer) are out of scope for the current IDS baseline.
- **Client Partitions**: Evaluated on 5 clients under Dirichlet $\alpha = 0.3$. Extreme non-IID partitions ($\alpha < 0.1$) may increase baseline variance across local client updates.

### 2.3 Cryptographic Audit Ledger
- **Classification**: `Permissioned Cryptographic Hash-Chain Audit Ledger`
- **Architecture**: Append-only linear SHA-256 hash-chain stored in persistent relational database.
- **Consensus**: Operates within a permissioned federation. Does not utilize distributed Byzantine Fault Tolerant (BFT) consensus or proof-of-work/stake mechanisms.

### 2.4 Differential Privacy Accounting
- **Mechanism**: Local Laplace perturbation with per-organization linear budget accumulation ($\sum \epsilon_i$).
- **Advanced Composition**: Renyi Differential Privacy (RDP) and Gaussian Moment Accountant are reserved for future work.
