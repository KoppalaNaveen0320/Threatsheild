# ThreatShield v1.2 — Research Scope, Threat Boundaries & Limitations

To maintain academic rigor and experimental integrity, this document explicitly details the operational boundaries, evaluated threat assumptions, and architectural limitations of ThreatShield v1.2.

---

## 1. Verified vs. Unverified Subsystem Components

| Component | Status in ThreatShield v1.2 | Explicit Operational Boundary |
| :--- | :--- | :--- |
| **Federated Learning Runtime** | **Simulated Research Environment** | Executed in a single-host in-memory PyTorch/Flower simulation framework across 5 non-IID client partitions. |
| **Secure Aggregation Protocol** | **Cryptographic Prototype** | Implements Diffie-Hellman pairwise secret sharing and additive zero-sum masking ($\sum p_{i,j} = 0$). Distributed network dropouts and threshold Shamir recovery are not implemented. |
| **Differential Privacy** | **Verified (Laplace Mechanism)** | Strict local $\epsilon$-differential privacy accounting implemented on frequency queries. Advanced composition (RDP/CDP) and gradient DP-SGD are reserved for future work. |
| **Storage Subsystem** | **Verified (SQLite Backend)** | Fully verified and automated in the local prototype environment using SQLite. Distributed PostgreSQL production deployment is **NOT verified locally**. |
| **Containerization** | **NOT Verified Locally** | Docker Compose specifications exist in repository but are **NOT verified in the local prototype test environment**. |
| **Subsystem Latencies** | **Local Prototype Benchmarks** | Latency and throughput figures represent single-node prototype execution on local workstation hardware. |

---

## 2. Threat Vector Evaluation Boundaries

1. **Poisoning Defense Scope**:
   - Byzantine and poisoning defenses are verified under the specific evaluated threat vectors: Gaussian Parameter Poisoning ($10\%-40\%$), Gradient Sign-Flip Attacks ($-1.5\times$), and Multi-Client Sybil Collusion.
   - Defenses are **not evaluated** against arbitrary state-of-the-art targeted neural backdoors, constrained clean-label triggers, or GAN-synthesized model evasion.

2. **Network Adversary Scope**:
   - The platform assumes TLS-encrypted transport for all API interactions. Network-layer man-in-the-middle (MitM) attacks on unencrypted transport layers are outside the threat model.

3. **Multi-Tenant Isolation**:
   - Tenant isolation is enforced at the FastAPI application layer via SQLAlchemy query scoping and role-based access control (RBAC). Hardware-level multi-tenant enclaves (e.g. Intel SGX / AMD SEV) are not utilized.
