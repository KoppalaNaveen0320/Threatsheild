# ThreatShield v1.2 — Viva Voce & Technical Defense Guide

This document contains authoritative, scientifically rigorous, and honest answers to all 28 critical viva defense questions.

---

### Q1: Why Federated Learning for Threat Intelligence?
**Answer**: Cyber threat intelligence is siloed because organizations fear disclosing network architecture, breach details, and customer PII. Centralizing raw network logs creates massive compliance and security risks. Federated Learning enables multiple organizations to collaboratively train an intrusion/malware detection model by sharing only local model gradient updates rather than raw network traffic or proprietary telemetry.

---

### Q2: Why Trust-Weighted FedAvg instead of standard FedAvg?
**Answer**: Standard FedAvg assigns weights proportional solely to dataset size: $w_k = n_k / \sum n_i$. A malicious or compromised participant with a large synthetic dataset can easily overwhelm the global model through model poisoning or backdoors. Trust-Weighted FedAvg incorporates a peer-validated trust reputation $T_k \in [0, 1]$ into the aggregation weight:
$$w_k' = \frac{T_k \cdot n_k}{\sum_{j} T_j \cdot n_j}$$
This dampens updates from low-reputation or newly joined nodes, mitigating poisoning attempts.

---

### Q3: What happens when the malicious client is trusted (high historical reputation)?
**Answer**: If a high-reputation node becomes compromised (e.g., account takeover or insider threat), trust weighting alone is insufficient. ThreatShield combines trust weighting with **anomaly-based gradient filtering and geometric aggregators** (such as Multi-Krum, Clipped FedAvg, and Coordinate-wise Median). Updates whose gradient vectors deviate significantly in Euclidean distance or cosine similarity from the consensus distribution are flagged, clipped, or rejected regardless of historical trust.

---

### Q4: How does poisoning detection work in ThreatShield?
**Answer**: We employ multi-layer defenses:
1. **Cosine & Euclidean Anomaly Scoring**: Compares client weight update $\Delta W_k$ against the cluster median.
2. **Gradient Norm Clipping**: Limits the maximum $L_2$ norm of any single update: $\Delta W_k \leftarrow \Delta W_k \cdot \min(1, C / \|\Delta W_k\|_2)$.
3. **Multi-Krum Selection**: Selects candidate updates that have the minimum sum of squared Euclidean distances to their $n - f - 2$ nearest neighbors.
4. **Collusion / Sybil Detection**: Computes pairwise cosine similarity matrices across all submitted gradients; clients submitting near-identical gradient directions ($>0.98$ similarity) across multiple rounds are flagged for collusion.

---

### Q5: What is the exact difference between Trust, Quality, and Confidence?
**Answer**:
- **Trust ($T \in [0, 1]$)**: An organization-level, historical attribute reflecting the reliability of the submitting tenant based on cumulative peer feedback and validation history.
- **Quality ($Q \in [0, 1]$)**: An indicator-level, structural attribute reflecting completeness of STIX 2.1 fields, presence of technical context (hashes, CVEs, ATT&CK mapping), and syntactic validity.
- **Confidence ($C \in [0, 1]$)**: A subjective, source-asserted certainty metric provided by the original analyst or automated ingestion sensor.

---

### Q6: How is ThreatShield Decision Score v2 ($TS_{v2}$) calculated?
**Answer**: $TS_{v2}$ is an explainable linear combination of 6 bounded sub-metrics:
$$TS_{v2} = w_q Q_{v2} + w_t T + w_r R + w_f F + w_g G + w_s S$$
Where:
- $Q_{v2} \in [0, 1]$: Quality score incorporating metadata completeness ($w_q = 0.25$).
- $T \in [0, 1]$: Source contributor trust reputation ($w_t = 0.20$).
- $R \in [0, 1]$: Graph centrality / node degree in knowledge graph ($w_r = 0.20$).
- $F \in [0, 1]$: Temporal decay factor: $F(t) = \exp(-\lambda \cdot \Delta t)$ ($w_f = 0.15$).
- $G \in [0, 1]$: MITRE ATT&CK technique impact severity ($w_g = 0.10$).
- $S \in [0, 1]$: Cross-organization sighting consensus ($w_s = 0.10$).
- Normalized bounds: $\sum w_i = 1.0 \implies TS_{v2} \in [0, 1]$.

---

### Q7: Why use a Knowledge Graph instead of relational SQL queries?
**Answer**: Multi-stage cyber attacks involve complex relational paths across heterogeneous entities (Actor $\to$ Malware $\to$ Vulnerability $\to$ Infrastructure $\to$ Asset). In relational schemas, finding arbitrary multi-hop relationships requires costly recursive self-joins with unknown depth ($O(N^k)$). A graph abstraction represents relationships as first-class citizens, enabling $O(V + E)$ shortest-path traversal and topological centrality metrics (PageRank, Community Detection) in sub-millisecond execution times.

---

### Q8: Why PageRank and Degree Centrality on Threat Graphs?
**Answer**:
- **Degree Centrality**: Measures immediate threat connectivity (e.g., an IP communicating with 50 internal endpoints).
- **PageRank**: Identifies structural threat hubs (e.g., a C2 domain referenced by multiple prominent malware campaigns that themselves have high connectivity). It prevents low-degree bridge entities from being overlooked.

---

### Q9: Why Breadth-First Search (BFS) for threat paths?
**Answer**: Threat analysts investigating incident blast radius require the shortest explanation path between a compromised asset and an attributed threat actor. In an unweighted or unit-hop knowledge graph, BFS guarantees finding the minimum-length sequence of hops in $O(V + E)$ time without heuristic overestimation.

---

### Q10: What is observed vs. inferred MITRE ATT&CK evidence?
**Answer**:
- **Observed Evidence**: Explicitly recorded in telemetry (e.g., process execution logs showing `powershell.exe -enc ...` mapping directly to `T1059.001`).
- **Inferred Evidence**: Derived via graph adjacency and campaign attribution (e.g., if an IP is attributed to APT29, and APT29 is known in the threat library to employ `T1071.001` Web Protocols, the relationship is classified as inferred with an explicit graph confidence discount factor).

---

### Q11: How does temporal decay work?
**Answer**: Threat indicators exhibit rapid obsolescence as adversaries rotate infrastructure. ThreatShield applies half-life decay:
$$F(\Delta t) = \exp\left(-\frac{\ln(2) \cdot \Delta t}{t_{1/2}}\right)$$
Where $t_{1/2}$ is configured based on indicator type (e.g., 7 days for IPv4 addresses, 30 days for domains, 180 days for file hashes).

---

### Q12: How does Adaptive Trust work?
**Answer**: Contributor trust updates dynamically using asymmetric Exponential Moving Average (EMA):
- **Positive Sighting**: $T_{new} = (1 - \alpha_{up}) T_{old} + \alpha_{up} \cdot 1.0$, where $\alpha_{up} = 0.10$ (gradual trust building).
- **False Positive Penalty**: $T_{new} = (1 - \alpha_{down}) T_{old} + \alpha_{down} \cdot 0.0$, where $\alpha_{down} = 0.30$ (rapid trust penalization).
This prevents Sybil nodes from building quick reputation to launch delayed attacks.

---

### Q13: What is the Organization Risk Score?
**Answer**: Computed in $[0, 100]$ as:
$$\text{Risk} = \min\left(100, \sum_{i \in \text{Incidents}} \text{Sev}_i \cdot W(\text{Status}_i) + \sum_{j \in \text{Assets}} \text{Crit}_j \cdot \text{VulnCount}_j\right)$$
Where unresolved active incidents carry heavier risk weight than contained/closed incidents.

---

### Q14: How does Differential Privacy work in ThreatShield?
**Answer**: To prevent membership inference and gradient inversion attacks when sharing threat intelligence statistics, ThreatShield injects calibrated noise drawn from the Laplace distribution:
$$M(x) = f(x) + \text{Lap}\left(\frac{\Delta f}{\epsilon}\right)$$
Where $\Delta f$ is the global $L_1$ sensitivity of the query and $\epsilon$ is the privacy budget parameter.

---

### Q15: What does $\epsilon$ (Epsilon) mean?
**Answer**: $\epsilon$ is the privacy loss budget. Smaller $\epsilon$ (e.g., $0.1 - 0.5$) provides strong mathematical privacy guarantees by adding more noise, at the expense of utility. Larger $\epsilon$ (e.g., $2.0 - 5.0$) provides higher data fidelity but weaker indistinguishability guarantees. ThreatShield tracks cumulative $\epsilon$ consumption per tenant.

---

### Q16: What are the limitations of Laplace DP?
**Answer**:
1. It applies primarily to numeric/count queries and continuous gradient updates; it cannot directly sanitize unstructured text strings without token-level embedding noise.
2. Under repeated queries on small datasets, privacy guarantees degrade unless bounded by privacy budget caps.

---

### Q17: What exactly does Secure Aggregation protect?
**Answer**: Secure Aggregation ensures the central FL coordinator learns **only the aggregate global sum** of all client model updates, and never observes any individual client's private local gradient update. ThreatShield models this mathematically via zero-sum pairwise random masking cancellation:
$$\sum_{i=1}^N \left(W_i + \sum_{j > i} s_{ij} - \sum_{j < i} s_{ji}\right) = \sum_{i=1}^N W_i$$

---

### Q18: Why is the audit ledger called a "Permissioned Cryptographic Hash-Chain" and NOT "Blockchain"?
**Answer**: A public blockchain involves distributed consensus protocols (Proof-of-Work / Proof-of-Stake), token economics, and peer-to-peer gossip overhead. ThreatShield operates in a permissioned federated alliance where identity is pre-authenticated. Using a cryptographic SHA-256 hash chain provides identical tamper-evidence and non-repudiation guarantees without mining latency, gas fees, or massive energy waste.

---

### Q19: How does hash-chain tamper detection work?
**Answer**: Each block stores $H_k = \text{SHA256}(k \| \text{timestamp} \| \text{payload} \| H_{k-1})$. Tamper verification recomputes hashes from Block 0 to Block $N$: if any historical payload, timestamp, or previous hash pointer is altered, the recomputed hash diverges immediately ($H_k' \neq H_k$), pinpointing the exact modified block index in $O(N)$ time.

---

### Q20: Why SQLite for local evaluation instead of PostgreSQL?
**Answer**: SQLite enables completely self-contained, zero-configuration local reproducibility for academic review and automated CI test execution without requiring background database services. The backend utilizes SQLAlchemy ORM and schema migrations that support PostgreSQL in production environments.

---

### Q21: What is actually production-ready in ThreatShield v1.2?
**Answer**:
- Full REST API with FastAPI, OpenAPI schemas, and Pydantic validation.
- Role-Based Access Control (4 roles with strict 401/403 guards).
- OASIS STIX 2.1 serialization and parsing.
- Mathematical scoring engines ($TS_{v2}$, quality, adaptive trust).
- In-memory Knowledge Graph with shortest-path & PageRank analytics.
- Cryptographic hash-chain ledger with SHA-256 tamper verification.
- Production React 19 frontend with 22 code-split lazy chunks.

---

### Q22: What is still a research prototype?
**Answer**:
- Federated Learning simulation runs in-memory / local worker processes rather than over live geographically distributed edge networks.
- Differential privacy is applied to query aggregations and vector telemetry, not full homomorphic encryption.
- Secure aggregation demonstrates algebraic pairwise mask cancellation without full Diffie-Hellman key exchange rounds.

---

### Q23: Which results are empirical experimental data?
**Answer**:
- All CSVs in `results/v1_0/`, `results/v1_1/`, and `results/v1_2/` were generated by running actual ML training scripts (`experiments/` pipeline) on the benchmark network intrusion dataset (UNSW-NB15 / NSL-KDD feature partitions).

---

### Q24: Which results are local prototype benchmarks?
**Answer**:
- API latency benchmarks (1-3ms roundtrip on local loopback) and in-memory graph traversal benchmarks.

---

### Q25: What are the main limitations of this research?
**Answer**:
1. Non-IID data distribution across organizations was simulated using Dirichlet distribution splits rather than live enterprise feeds.
2. In-memory graph scale was tested up to tens of thousands of entities; hyper-scale graphs ($>10^7$ nodes) would require a distributed graph database like Neo4j.
3. Attack models evaluated are focused on data/model poisoning and gradient inversion rather than evasive zero-day adversarial perturbations.

---

### Q26: Why is the clean baseline accuracy improvement in Trust-Weighted FedAvg modest (+0.28%)?
**Answer**: In an entirely benign environment with non-malicious clients, all updates are well-formed and legitimate. Trust weighting's primary function is **robustness against adversarial contamination**, not boosting clean accuracy. Under poisoning attacks (Gaussian noise, sign-flip, scaling), Trust-Weighted FedAvg maintains $>85\%$ accuracy while standard FedAvg collapses to $<50\%$.

---

### Q27: What is the primary research contribution of ThreatShield?
**Answer**: ThreatShield demonstrates an integrated, end-to-end architecture that resolves the triple tension in collaborative threat intelligence: **Collaboration vs. Privacy vs. Trust**. It proves that robust federated aggregation, explainable multi-factor threat scoring, and cryptographic auditability can coexist in a cohesive, production-ready platform.

---

### Q28: How is non-repudiation achieved without digital signatures on every message?
**Answer**: Every ingested indicator and incident status transition is immutably appended to the permissioned cryptographic ledger with the submitting tenant's authenticated identity and a timestamp. Because the hash chain is cryptographically linked, past entries cannot be modified or denied after publication.
