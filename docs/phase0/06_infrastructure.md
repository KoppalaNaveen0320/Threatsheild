# Phase 0: Infrastructure & Project Structure

## 1. Project Directory Structure

```text
ThreatShield/
├── frontend/             # React.js application
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── api/          # Route handlers
│   │   ├── auth/         # JWT and RBAC logic
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic validation schemas
│   │   ├── services/     # Core business logic
│   │   ├── security/     # Hashing and Cryptography
│   │   ├── cti/          # STIX and CTI manipulation
│   │   ├── privacy/      # DP noise generation
│   │   ├── trust/        # Feedback and Trust scoring
│   │   ├── relevance/    # Threat context relevance
│   │   ├── ledger/       # Hash-chain operations
│   │   └── main.py       # App entry point
│   └── tests/            # Pytest suites
├── fl/                   # Federated Learning Module
│   ├── server/           # Flower Server
│   ├── clients/          # Organization Simulation Clients
│   ├── models/           # PyTorch/Sklearn architectures
│   └── datasets/         # IID / Non-IID partitions
├── database/             # Postgres init scripts & migrations
├── docs/                 # Project documentation and Phase deliverables
└── docker-compose.yml    # Main orchestrator
```

## 2. Docker Compose Architecture

The system utilizes `docker-compose.yml` to orchestrate isolated services:

- `postgres`: Relational database mapping entities and the cryptographic ledger.
- `backend`: Exposes the FastAPI gateway on port 8000.
- `frontend`: Exposes the React UI on port 3000.
- `flower-server`: Independent gRPC server for Federated Learning rounds.
- `fl-client-a`, `fl-client-b`, `fl-client-c`: Simulated participant organizations.

## 3. Configuration Strategy

- **Environment Variables:** All secrets (JWT Secret Key, Database credentials) will be passed via `.env` files.
- **Dependency Management:** Python dependencies will be managed via `requirements.txt` or `Pipfile`. Frontend dependencies via `package.json`.
