# THREATSHIELD — PRIVACY ARCHITECTURE & DATA FLOW SPECIFICATION

---

## 1. Privacy Framework Overview

ThreatShield implements a multi-tier, defense-in-depth privacy architecture designed to enable collaborative cyber threat intelligence (CTI) sharing and federated intrusion detection without exposing raw, sensitive enterprise telemetry or violating organizational data boundaries.

The architecture comprises three core privacy pillars:
1. **Federated Model Learning (Zero-Raw-Data Exposure)**
2. **Differential Privacy (Laplace Mechanism for Aggregates)**
3. **Authenticated Symmetric Encryption (AES-256-GCM at Rest and in Transit)**

---

## 2. Privacy Mechanisms & Mathematical Foundation

### 2.1 Differential Privacy: Laplace Mechanism

Differential Privacy provides mathematical guarantees that the output of an aggregate query does not disclose whether a specific individual record or organization participated in the dataset.

#### Mathematical Definition
For an aggregate query function $f: \mathcal{D} \to \mathbb{R}^k$ with global sensitivity $\Delta f$:

$$\Delta f = \max_{D_1, D_2 : \|D_1 - D_2\|_1 = 1} \|f(D_1) - f(D_2)\|_1$$

The Laplace Mechanism $\mathcal{M}_{\text{Lap}}$ adds zero-mean noise drawn from a Laplace distribution:

$$\mathcal{M}_{\text{Lap}}(D) = f(D) + \text{Lap}\left(0, \frac{\Delta f}{\epsilon}\right)$$

where:
- $\epsilon$ is the **privacy budget parameter** (smaller $\epsilon \implies$ stronger privacy, higher noise; larger $\epsilon \implies$ higher utility).
- $\text{Lap}(0, b)$ has probability density function $p(x) = \frac{1}{2b} \exp\left(-\frac{|x|}{b}\right)$ with scale $b = \frac{\Delta f}{\epsilon}$.

#### Privacy Budget ($\epsilon$) Accounting
- Each organization is initialized with a default privacy budget: $\mathcal{B}_{\text{org}} = 10.0\,\epsilon$.
- When an organization executes an aggregate query (e.g., global threat statistics, collective IOC volume), a predetermined cost $\epsilon_i$ (e.g., $0.5\,\epsilon$) is deducted:
  $$\mathcal{B}_{\text{remaining}} = \mathcal{B}_{\text{previous}} - \epsilon_i$$
- When $\mathcal{B}_{\text{remaining}} < \epsilon_i$, further DP queries are rejected (`HTTP 403 Insufficient Privacy Budget`) until budget renewal.
- Every DP transaction is immutably recorded in the `privacy_events` table and hashed into the cryptographic audit ledger.

---

### 2.2 Authenticated Encryption: AES-256-GCM

Sensitive CTI indicator properties (such as internal network mappings or proprietary threat descriptions) are protected using AES in Galois/Counter Mode (AES-256-GCM):

- **Key Size**: 256 bits (32 bytes), loaded via `AES_SECRET_KEY` environment variable.
- **Nonce/IV**: 96 bits (12 bytes) cryptographically random nonce generated per encryption event via `os.urandom(12)`.
- **Authenticated Tag**: 128-bit authentication tag providing both **confidentiality** and **ciphertext integrity** (AEAD).
- **Structure**: `Output = Nonce (12 bytes) || Ciphertext (N bytes) || Auth Tag (16 bytes)`.

---

## 3. Privacy Boundary & Data Flow

```
+-------------------------------------------------------------------------+
|                         ORGANIZATION PERIMETER                          |
|                                                                         |
|  +--------------------------------+   +------------------------------+  |
|  |     Private Raw IDS Telemetry   |   |   Raw Enterprise Network     |  |
|  |    (CIC-IDS2017 / PCAP / Logs)  |   |           Traffic            |  |
|  +--------------------------------+   +------------------------------+  |
|                 |                                     |                 |
|                 v                                     v                 |
|  +--------------------------------+   +------------------------------+  |
|  |   Local PyTorch IDS Model      |   |   Local CTI Ingestion Engine |  |
|  |    (IntrusionDetectionNet)     |   |   (STIX 2.1 Extraction)      |  |
|  +--------------------------------+   +------------------------------+  |
|                 |                                     |                 |
|       Local Training Only                             |                 |
|  (Raw data NEVER leaves boundary)                     |                 |
|                 |                                     |                 |
|                 v                                     v                 |
|      Extracted Model Weights                 AES-256 Encrypted CTI      |
|           (ΔW Parameters)                       Structured Object       |
+-------------------------------------------------------------------------+
                  |                                     |
                  | Encrypted RPC / TLS                 | HTTPS / JWT
                  v                                     v
+-------------------------------------------------------------------------+
|                       THREATSHIELD CENTRAL COORDINATOR                  |
|                                                                         |
|  +--------------------------------+   +------------------------------+  |
|  |  Trust-Weighted Aggregation    |   | Differential Privacy Engine  |  |
|  |  (L2 Anomaly Detection &       |   | (Laplace Noise on Queries,   |  |
|  |   Reputation Weighting)        |   |  Epsilon Budget Tracker)     |  |
|  +--------------------------------+   +------------------------------+  |
|                 |                                     |                 |
|                 v                                     v                 |
|  +--------------------------------+   +------------------------------+  |
|  |   Updated Global FL Model      |   |  Cryptographic Audit Ledger  |  |
|  |   (Distributed to Peers)       |   |  (SHA-256 Hash Chain)        |  |
|  +--------------------------------+   +------------------------------+  |
+-------------------------------------------------------------------------+
```

---

## 4. Privacy Rules and Guarantees

1. **Zero Raw Training Data Transmission**:
   - Raw packet captures, IP flow records, and network logs remain strictly confined to the participating organization's local compute environment.
   - Only numerical model parameter tensors ($\mathbf{w} \in \mathbb{R}^d$) are shared with the central federated coordinator.

2. **Selective Differential Privacy Application**:
   - Differential Privacy is applied specifically to **macro aggregate statistical queries** (e.g., total active threats, global IOC category distributions, cross-organization incident counts).
   - Exact CTI indicator values (e.g., malicious IP addresses or file hashes submitted to the threat feed) are **not** perturbed with numerical noise, preserving operational cyber defense utility while utilizing role-based access control and tenant isolation.

3. **Key and Secret Isolation**:
   - Cryptographic keys are never hardcoded in source files.
   - Secret keys (`SECRET_KEY`, `AES_SECRET_KEY`) are dynamically injected via environment variables and secured container runtime configurations.
