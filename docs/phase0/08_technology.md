# Phase 0: Technology Justification

## 1. Web & Backend Infrastructure
- **React.js:** Provides a highly dynamic, component-based frontend for rendering complex cyber dashboards (Threat Map, Trust Visualizations).
- **FastAPI:** Python's leading async framework; allows seamless integration with data science libraries (PyTorch, Sklearn) while providing automatic OpenAPI schema generation for CTI endpoints.
- **PostgreSQL:** Reliable relational database suited for normalized CTI data and immutable hash-chain structures.

## 2. Intelligence Standards
- **STIX 2.1:** The industry standard for representing cyber threat intelligence. Ensures ThreatShield can export/import data interoperable with existing SOC tools.

## 3. Machine Learning & Privacy
- **Flower (flwr):** An agnostic Federated Learning framework. Chosen because it separates the aggregation logic from the model architecture, making it easy to implement custom trust-weighted FedAvg.
- **PyTorch / Scikit-Learn:** Industry standards for implementing deep learning and baseline ML models.
- **Differential Privacy (Laplace Mechanism):** Provides a mathematical, formal guarantee against information leakage when releasing platform aggregates.

## 4. Security & Cryptography
- **AES-256-GCM:** Authenticated symmetric encryption for data at rest. Ensures confidentiality and integrity.
- **SHA-256:** Cryptographic hashing standard used for CTI verification, model update integrity, and the cryptographic ledger.
- **Cryptographic Hash-Chain Ledger:** Chosen as a lightweight, prototype alternative to Hyperledger Fabric, simulating the exact tamper-evident properties required for Phase 7 without the extreme operational overhead.
- **JWT (JSON Web Tokens) & Argon2id/bcrypt:** Secure stateless authentication and industry-standard password hashing.
- **RBAC:** Essential for isolating organizations in a multi-tenant threat intelligence environment.

## 5. Deployment
- **Docker Compose:** Ensures isolated, reproducible environments across frontend, backend, database, and federated learning simulated nodes, crucial for experimental evaluation.
