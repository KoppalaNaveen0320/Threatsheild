# Phase 0: API Specifications

The FastAPI Gateway serves as the interface for React UI and FL Clients. It uses OpenAPI/Swagger for documentation.

## 1. Authentication & Users
- `POST /api/auth/login` - Authenticate user, return JWT.
- `POST /api/auth/register` - Register a new user (requires Admin approval).
- `GET /api/users/me` - Get current user profile and RBAC permissions.

## 2. Organizations
- `POST /api/organizations/` - Register organization.
- `GET /api/organizations/` - List organizations (Admin only).
- `GET /api/organizations/{org_id}` - Get organization details, trust score, and privacy budget.

## 3. CTI Management
- `POST /api/cti/` - Submit new CTI record (Analyzes freshness and assigns initial quality).
- `GET /api/cti/` - Search CTI (Filters: type, confidence, severity). DP applied to aggregates.
- `GET /api/cti/{cti_id}` - Get specific CTI record details.
- `POST /api/cti/stix-bundle` - Upload/Download STIX 2.1 bundles.

## 4. Trust & Feedback
- `POST /api/feedback/` - Submit feedback for a CTI record (Triggers Trust Engine update).
- `GET /api/trust/scores` - Get trust history and scores for organizations.
- `GET /api/relevance/{cti_id}` - Calculate relevance of a CTI record for the requesting organization.

## 5. Privacy Engine
- `GET /api/privacy/budget` - Get current organization's privacy budget ($\epsilon$).
- `GET /api/privacy/stats` - Fetch aggregate platform stats with Laplace noise applied.

## 6. Federated Learning
- `GET /api/fl/rounds` - List federated training rounds and global metrics.
- `POST /api/fl/updates` - (Internal/Client API) Submit secure masked model update.
- `GET /api/fl/model/latest` - Retrieve latest global model weights.

## 7. Cryptographic Ledger
- `GET /api/ledger/blocks` - Retrieve blocks.
- `GET /api/ledger/verify` - Trigger cryptographic verification of the hash-chain.
