# THREATSHIELD — FINAL ARCHITECTURE SPECIFICATION

**System Status**: Frozen (`Version 1.0 — Research Prototype`)  
**Architecture Classification**: Multi-Tier Collaborative Cyber Defense Architecture  

---

## 1. Architectural Overview & System Components

ThreatShield comprises six core architectural components operating in concert:

```
+-------------------------------------------------------------------------------+
|                            THREATSHIELD ECOSYSTEM                             |
|                                                                               |
|  +--------------------+   +-----------------------+   +--------------------+  |
|  | Organization A     |   | Organization B        |   | Malicious Node     |  |
|  | - PyTorch IDS Net  |   | - PyTorch IDS Net     |   | - Perturbed Noise  |  |
|  | - Private Dataset  |   | - Private Dataset     |   | - Sign-Flip Attack |  |
|  +--------------------+   +-----------------------+   +--------------------+  |
|            |                          |                          |            |
|       Tensor Update              Tensor Update              Tensor Update     |
|            \                          |                          /            |
|             v                         v                         v             |
|  +-------------------------------------------------------------------------+  |
|  |             FEDERATED COORDINATOR (FLOWER / PYTORCH)                    |  |
|  |  - Anomaly Detector: L2 Median Norm Deviation (A_i)                     |  |
|  |  - Trust-Weighted FedAvg Strategy (W_i = T_i * Q_i * (1 - A_i))         |  |
|  |  - Normalized Contributor Weights (W_hat_i = W_i / Σ W_j)               |  |
|  +-------------------------------------------------------------------------+  |
|                                       |                                       |
|                                       v                                       |
|  +-------------------------------------------------------------------------+  |
|  |                    FASTAPI CORE SERVICE GATEWAY                         |  |
|  |  - OAuth2 / JWT Auth & Role-Based Access Control (RBAC)                 |  |
|  |  - Tenant Data Boundary Isolation & CTI Management                      |  |
|  |  - OASIS STIX 2.1 Graph Mapping & Export Engine                         |  |
|  |  - Laplace Differential Privacy Engine (Epsilon Accounting)             |  |
|  |  - Cryptographic Hash-Chain Ledger Engine (SHA-256 Canonical Chain)     |  |
|  +-------------------------------------------------------------------------+  |
|                                       |                                       |
|                                       v                                       |
|  +-------------------------------------------------------------------------+  |
|  |                    PERSISTENCE & STORAGE TIER                           |  |
|  |  - PostgreSQL 15 (Target Production Schema)                             |  |
|  |  - SQLite (Certified Automated Testbed Fallback)                        |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

---

## 2. Mathematical Formulations & Component Logic

### 2.1 Exponential Moving Average Trust Engine ($T_i$)
Tracks organizational reputation dynamically based on peer feedback:

$$T_{\text{new}} = T_{\text{old}} \times (1 - \alpha) + \alpha \times S_{\text{feedback}}$$

- **$T_i \in [0.0, 1.0]$**: Normalized trust score (initial baseline: $0.50$).
- **$\alpha = 0.1$**: Learning rate governing the weight of newly submitted peer feedback.
- **$S_{\text{feedback}}$**: Feedback score mapped from peer validation reports:
  - `CONFIRMED_MALICIOUS`: $1.0$
  - `USEFUL`: $0.8$
  - `NOT_USEFUL`: $0.2$
  - `FALSE_POSITIVE` / `EXPIRED`: $0.0$

### 2.2 Time-Decayed CTI Quality Score ($Q_i$)
Evaluates threat intelligence validity with daily exponential decay:

$$Q_i = \frac{\sum_{k=1}^M S_k \cdot \lambda^{\Delta t_k} \cdot c_k}{\sum_{k=1}^M \lambda^{\Delta t_k} \cdot c_k}$$

- **$\lambda = 0.95$**: Daily decay factor prioritizing recent telemetry.
- **$\Delta t_k$**: Elapsed time in days since feedback submission.
- **$c_k \in (0, 1]$**: Peer confidence rating.

### 2.3 Contextual Threat Relevance ($R_{ij}$)
Matches incoming threat indicators against recipient organizational profiles:

$$R_{ij} = \begin{cases} 1.0 & \text{if } \text{Sector}(i) = \text{Sector}(j) \\ 0.5 & \text{otherwise} \end{cases}$$

### 2.4 L2 Parameter Norm Anomaly Detection ($A_i$)
Quantifies the divergence of client update parameter tensor $\mathbf{w}_i$ from the median update norm $\mathbf{w}_{\text{med}}$:

$$A_i = \min\left(1.0, \frac{\|\mathbf{w}_i - \mathbf{w}_{\text{med}}\|_2}{\|\mathbf{w}_{\text{med}}\|_2 + 10^{-9}}\right)$$

### 2.5 Trust-Weighted Contribution & Model Aggregation
The unnormalized weight $W_i$ and normalized aggregation weight $\hat{W}_i$ are defined as:

$$W_i = T_i \times Q_i \times (1 - A_i)$$

$$\hat{W}_i = \frac{W_i}{\sum_{j=1}^K W_j} \quad \text{such that} \quad \sum_{i=1}^K \hat{W}_i = 1.0$$

The global model parameters are aggregated via:

$$\mathbf{w}_{\text{global}} = \sum_{i=1}^K \hat{W}_i \mathbf{w}_i$$

---

## 3. Privacy Architecture (Differential Privacy & AES-256)

### 3.1 Laplace Differential Privacy
Provides provable privacy bounds on macro statistical analytics:

$$\mathcal{M}_{\text{Lap}}(D) = f(D) + \text{Lap}\left(0, \frac{\Delta f}{\epsilon}\right)$$

- **$\Delta f$**: Global sensitivity of the query function $f$.
- **$\epsilon$**: Privacy loss budget.
- **Budget Tracking**: Initial budget $\mathcal{B}_{\text{org}} = 10.0\,\epsilon$. Each macro query deducts $\epsilon_{\text{cost}} = 0.5\,\epsilon$. Further queries are rejected upon budget exhaustion.

### 3.2 Authenticated Symmetric Encryption (AES-256-GCM)
- 256-bit symmetric encryption key loaded via environment variables (`AES_SECRET_KEY`).
- 96-bit cryptographically random nonces (`os.urandom(12)`) per encryption event.
- 128-bit authentication tag ensuring confidentiality and ciphertext integrity (AEAD).

---

## 4. Cryptographic Audit Ledger

### 4.1 Block Hashing Specification
Each block is linked to the previous block via SHA-256 hash chaining:

$$\text{current\_hash} = \text{SHA-256}(\text{previous\_hash} \,\|\, \text{payload\_hash} \,\|\, \text{canonical\_timestamp})$$

### 4.2 Canonical Serialization Rules
To guarantee deterministic hashing across diverse OS platforms and database engines:
1. **JSON Payloads**: `json.dumps(payload, sort_keys=True, separators=(',', ':'))`.
2. **Timestamps**: Formatted strictly as ISO 8601 UTC with zeroed microseconds (`%Y-%m-%dT%H:%M:%SZ`).
3. **Genesis Block**: Root block initialized with `previous_hash = '0'*64`.

---

## 5. Deployment & Runtime Limitations

1. **PostgreSQL**: Production schema designed for PostgreSQL 15+; marked **NOT VERIFIED / BLOCKED** locally due to lack of local `psql` utility. Certified via SQLite fallback.
2. **Docker Compose**: Container definitions provided in `docker-compose.yml`; marked **NOT VERIFIED / BLOCKED** locally due to inactive Docker daemon.
3. **Network Mode**: In-process synchronous FL simulation across 5 random seeds rather than WAN distributed cluster.
