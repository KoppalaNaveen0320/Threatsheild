# Phase 0: System Architecture

## 1. System Architecture Diagram

```text
                         THREATSHIELD
                              │
                ┌─────────────┴─────────────┐
                │                           │
            React UI                    FastAPI
                                            │
        ┌───────────────────────────────────┼──────────────────────┐
        │                                   │                      │
 Authentication/RBAC                  CTI Engine             Privacy Engine
        │                              STIX 2.1                AES / DP
        │                                   │                      │
        └───────────────────────────────────┼──────────────────────┘
                                            │
                                  Trust / Quality /
                                    Relevance Engine
                                            │
                         ┌──────────────────┴─────────────────┐
                         │                                    │
                   Flower Server                        Audit Engine
                         │                                    │
                  ┌──────┼──────┐                    Cryptographic
                  │      │      │                    Hash Ledger
                FL-A   FL-B   FL-C                         │
                  │      │      │                           │
                  └──────┼──────┘                           │
                         ↓                                  │
                  Secure Aggregation                        │
                         ↓                                  │
                Trust-Weighted FedAvg                       │
                         ↓                                  │
                    Global Model                            │
                         │                                  │
                         └──────────┬───────────────────────┘
                                    ↓
                               PostgreSQL
```

## 2. Component Diagram

- **React UI:** Professional dashboard for CTI search, submission, trust monitoring, and privacy budget visualization.
- **FastAPI API Gateway:** REST API for managing users, organizations, CTI, and handling authentication.
- **CTI Engine:** Manages parsing, storage, and retrieval of STIX 2.1 compatible objects.
- **Privacy Engine:** Applies Differential Privacy (Laplace noise) to released aggregate stats, manages organization privacy budgets ($\epsilon$), and handles AES-256-GCM encryption for stored data.
- **Trust / Quality / Relevance Engine:** Calculates scores dynamically based on feedback and historical behavior. Provides contribution weights to the FL Engine.
- **Flower Server:** An independent Federated Learning aggregator orchestrating training rounds.
- **Secure Aggregation:** Masks individual model updates so the aggregator only sees the global sum.
- **Audit Engine:** Calculates SHA-256 hashes and appends blocks to the cryptographic hash-chain ledger.

## 3. Data-Flow Diagram

**CTI Sharing Flow:**
1. Local Security Data $\rightarrow$ CTI Extraction
2. STIX Representation $\rightarrow$ API Gateway
3. Privacy Engine (Sanitization) $\rightarrow$ Trust Engine (Initial Quality Score)
4. PostgreSQL (Storage) + Ledger (Hash logging)
5. Distribution to relevant organizations.

**Federated Learning Flow:**
1. Local ML Training (Organizations) $\rightarrow$ Model Updates
2. Secure Masking $\rightarrow$ Flower Server
3. Anomaly Detection (Trust Engine input) $\rightarrow$ Weight Calculation
4. Trust-Weighted FedAvg $\rightarrow$ Global Model
5. Ledger (Model Hash logging)

## 4. Trust/FL Interaction Diagram

```text
Local Model Updates 
        ↓ 
Secure Masking 
        ↓ 
Model Update Anomaly Detection ($A_i$) 
        ↓ 
Trust/Quality/Anomaly Weight Calculation ($W_i = T_i \times Q_i \times A_i^{trust}$) 
        ↓ 
Weight Normalization ($\hat W_i$) 
        ↓ 
Secure Aggregation 
        ↓ 
Trust-Weighted Global Model
```

## 5. Privacy Architecture
- **Raw Data:** Remains strictly on-premises at each organization.
- **In Transit / At Rest:** TLS 1.2+ for transit, AES-256-GCM for storage.
- **Aggregates:** Differential Privacy applied via Laplace mechanism before returning data in dashboard endpoints.

## 6. Ledger Architecture
- **Technology:** PostgreSQL-backed cryptographic hash chain (prototype for Hyperledger Fabric).
- **Block Structure:** Index, Timestamp, PreviousHash, PayloadHash, OrganizationID, EventType, EventID, CurrentHash.
- **Storage:** Only metadata and hashes are stored in the ledger; sensitive CTI remains off-chain.
