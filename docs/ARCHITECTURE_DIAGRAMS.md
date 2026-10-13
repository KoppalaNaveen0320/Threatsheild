# THREATSHIELD — SYSTEM ARCHITECTURE DIAGRAMS

---

## 1. Overall System Architecture

```mermaid
graph TB
    subgraph Client_Layer ["Client & Enterprise Tier"]
        UI["React 18 / Vite SPA Dashboard"]
        OrgSensors["Enterprise SOC / Sensor Nodes"]
        FLClients["Flower / PyTorch FL Clients"]
    end

    subgraph API_Gateway ["FastAPI Core Services"]
        Router["FastAPI Gateway / CORS / RBAC"]
        AuthService["JWT Authentication & Org Boundary Guard"]
        CTIService["CTI Management & STIX 2.1 Engine"]
        PrivacyService["Differential Privacy & Budget Accounting"]
        LedgerService["Cryptographic Hash-Chain Ledger Engine"]
        TrustService["Multi-Factor Trust & Quality Engine"]
    end

    subgraph FL_Coordinator ["Federated Learning Tier"]
        FlowerServer["Flower Aggregation Coordinator"]
        TrustStrategy["Trust-Weighted FedAvg Strategy"]
        L2Anomaly["L2 Parameter Norm Anomaly Detector"]
    end

    subgraph Persistence_Layer ["Storage Tier"]
        SQLDB["PostgreSQL / SQLite Database Engine"]
        LedgerStorage["Canonical Ledger Blocks Table"]
        STIXStorage["Encrypted STIX Bundles & CTI Store"]
    end

    UI -->|HTTPS / REST / JWT| Router
    OrgSensors -->|REST API / STIX| Router
    FLClients -->|gRPC / Tensor Exchange| FlowerServer

    Router --> AuthService
    Router --> CTIService
    Router --> PrivacyService
    Router --> LedgerService
    Router --> TrustService

    FlowerServer --> TrustStrategy
    TrustStrategy --> L2Anomaly
    TrustStrategy --> TrustService

    AuthService --> SQLDB
    CTIService --> STIXStorage
    PrivacyService --> SQLDB
    LedgerService --> LedgerStorage
    TrustService --> SQLDB
```

---

## 2. Data Flow Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Analyst as SOC Analyst (Org A)
    participant API as FastAPI Backend
    participant DP as Privacy Engine
    participant Ledger as Ledger Engine
    participant DB as PostgreSQL / SQLite
    actor Consumer as Peer Org Analyst (Org B)

    Analyst->>API: 1. POST /api/cti (Indicator, Severity, Confidence)
    API->>DB: 2. Store CTI Record (Encrypted Attributes)
    API->>Ledger: 3. Append CTI Submission Block (SHA-256 Hash Chain)
    Ledger->>DB: 4. Commit Canonical Ledger Block
    API-->>Analyst: 5. 200 OK (CTI Record + UUID)

    Consumer->>API: 6. GET /api/privacy/stats (Platform Stats)
    API->>DP: 7. Check Budget & Apply Laplace Noise Lap(Δf/ε)
    DP->>DB: 8. Deduct Privacy Budget (e.g., -0.5 ε)
    API-->>Consumer: 9. Return Differentially Private Statistics
```

---

## 3. CTI Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Ingestion: Local Sensor Detection
    Ingestion --> Validation: STIX 2.1 Pattern Extraction
    Validation --> ActiveSharing: Signed & Logged to Ledger
    ActiveSharing --> PeerReview: Consumed by Peer Organizations
    PeerReview --> Useful: Peer Confirms Malicious Telemetry
    PeerReview --> FalsePositive: Peer Flags False Positive
    Useful --> TrustIncrease: EMA Trust Score Boost (+ΔT)
    FalsePositive --> TrustDecay: Trust Penalty Applied (-ΔT)
    TrustIncrease --> Archival: IOC Expiration / Time-Decay
    TrustDecay --> Archival: IOC Revocation / Quarantine
    Archival --> [*]
```

---

## 4. Federated Learning Workflow

```mermaid
sequenceDiagram
    autonumber
    participant Server as Central Flower Server
    participant ClientA as Org A (Honest FL Client)
    participant ClientB as Org B (Honest FL Client)
    participant MalClient as Org M (Malicious Client)

    Server->>ClientA: 1. Broadcast Global Weights W_global
    Server->>ClientB: 1. Broadcast Global Weights W_global
    Server->>MalClient: 1. Broadcast Global Weights W_global

    Note over ClientA,ClientB: Local Training on Private Data
    Note over MalClient: Generates Perturbed Parameters (Poisoning)

    ClientA->>Server: 2. Return Update ΔW_A
    ClientB->>Server: 2. Return Update ΔW_B
    MalClient->>Server: 2. Return Poisoned Update ΔW_M

    Note over Server: Compute L2 Norms & Medians<br/>Calculate Anomaly Scores A_i<br/>Lookup Trust T_i & Quality Q_i<br/>Compute Normalized Weights W_hat_i
    Server->>Server: 3. Aggregate: W_new = Σ (W_hat_i * W_i)
    Server-->>ClientA: 4. Broadcast Next Round Weights
```

---

## 5. Trust-Weighted Aggregation Mechanism

```mermaid
flowchart LR
    subgraph Inputs ["Client Update Inputs"]
        Param["Parameter Update Δw_i"]
        Trust["Trust Score T_i"]
        Quality["CTI Quality Q_i"]
    end

    subgraph Defense ["Anomaly Detection & Weighting"]
        L2["L2 Norm Deviation ||Δw_i - w_med||_2"]
        Anomaly["Anomaly Score A_i ∈ [0, 1]"]
        RawWeight["Raw Weight: W_i = T_i × Q_i × (1 - A_i)"]
        Normalize["Normalize: W_hat_i = W_i / Σ W_j"]
    end

    subgraph Output ["Global Aggregation"]
        Agg["Global Model: w_global = Σ W_hat_i w_i"]
    end

    Param --> L2
    L2 --> Anomaly
    Trust --> RawWeight
    Quality --> RawWeight
    Anomaly --> RawWeight
    RawWeight --> Normalize
    Normalize --> Agg
    Param --> Agg
```

---

## 6. Privacy Workflow (Differential Privacy & Budgeting)

```mermaid
flowchart TD
    Request["Incoming Macro Statistical Query (e.g. GET /api/privacy/stats)"] --> CheckAuth["Authenticate User & Extract Organization ID"]
    CheckAuth --> CheckBudget{"Privacy Budget ε_rem ≥ ε_req?"}

    CheckBudget -- No --> Reject["HTTP 403 Forbidden (Insufficient Privacy Budget)"]
    CheckBudget -- Yes --> Compute["Compute Raw Aggregate Statistic f(D)"]

    Compute --> Laplace["Sample Laplace Noise: Lap(0, Δf / ε)"]
    Laplace --> AddNoise["Perturbed Output: M(D) = f(D) + Lap(0, Δf / ε)"]

    AddNoise --> DeductBudget["Update Budget: ε_rem = ε_rem - ε_req"]
    DeductBudget --> LogEvent["Record in privacy_events Table"]
    LogEvent --> Response["Return Noisy Statistic + ε_consumed to Client"]
```

---

## 7. Cryptographic Audit Ledger Workflow

```mermaid
flowchart LR
    subgraph Block_Creation ["Block Creation"]
        Payload["Event Data Dict"] --> CanonJSON["Canonical JSON: sort_keys=True, compact separators"]
        CanonJSON --> HashPayload["SHA-256(Payload_JSON)"]
        PrevHash["Previous Block Current_Hash"] --> Concat["Concat: PrevHash | PayloadHash | Canonical_UTC_Timestamp"]
        HashPayload --> Concat
        Timestamp["UTC Timestamp (0 μs)"] --> Concat
        Concat --> CurrentHash["SHA-256(Concat) -> current_hash"]
    end

    subgraph Verification ["Chain Verification"]
        BlockN_1["Block N-1: current_hash"] --> CheckLink{"Block N.prev_hash == Block N-1.current_hash?"}
        BlockN["Block N: current_hash"] --> CheckHash{"Recomputed Hash == Stored current_hash?"}
        CheckLink -- Yes --> CheckHash
        CheckHash -- Yes --> Valid["Chain Integrity: VALID"]
        CheckLink -- No --> Invalid["Tamper Detected: INVALID"]
        CheckHash -- No --> Invalid
    end

    CurrentHash --> BlockN
```

---

## 8. Adversarial Attack & Defense Workflow

```mermaid
flowchart TD
    Attacker["Malicious / Compromised Client"] --> AttackType{"Attack Vector"}

    AttackType -- Parameter Poisoning --> InjectNoise["Inject Perturbed Weights (Gaussian Noise / Sign Flip)"]
    InjectNoise -- Upload --> ServerDefense["Server L2 Norm Anomaly Check"]
    ServerDefense --> FlagAnomaly["Anomaly Score A_i → 1.0, Trust T_i Degrades"]
    FlagAnomaly --> SuppressWeight["Contribution Weight Suppressed by 99.38% - 99.91%"]
    SuppressWeight --> GlobalSafe["Global Model Retains > 76% Accuracy"]

    AttackType -- CTI Replay / Tamper --> ReplayCTI["Re-submit Stale / Tampered CTI Payload"]
    ReplayCTI --> LedgerCheck["Ledger Hash Check & Duplicate Detection"]
    LedgerCheck --> ChainFail["Hash Mismatch / Duplicate Detected"]
    ChainFail --> Penalty["Attacker Trust Score Penalized via EMA Decay"]
```

---

## 9. Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USERS : "employs"
    ORGANIZATIONS ||--o{ CTI_RECORDS : "submits"
    ORGANIZATIONS ||--o{ FEEDBACK : "evaluates"
    ORGANIZATIONS ||--o{ PRIVACY_EVENTS : "incurs"
    ORGANIZATIONS ||--o{ TRUST_HISTORY : "tracks"
    ORGANIZATIONS ||--o{ MODEL_UPDATES : "provides"
    ORGANIZATIONS ||--o{ LEDGER_BLOCKS : "authors"

    CTI_RECORDS ||--o{ FEEDBACK : "receives"
    FEDERATED_ROUNDS ||--o{ MODEL_UPDATES : "aggregates"

    ORGANIZATIONS {
        uuid id PK
        string name UK
        float trust_score
        float privacy_budget
        string status
        datetime created_at
    }

    USERS {
        uuid id PK
        uuid organization_id FK
        string email UK
        string password_hash
        enum role
        datetime created_at
    }

    CTI_RECORDS {
        uuid id PK
        uuid organization_id FK
        string type
        string value
        text description
        float severity
        float confidence
        string status
        datetime created_at
    }

    FEEDBACK {
        uuid id PK
        uuid cti_id FK
        uuid organization_id FK
        uuid user_id FK
        enum feedback_type
        float confidence
        datetime created_at
    }

    FEDERATED_ROUNDS {
        uuid id PK
        int round_number UK
        string global_model_hash
        int participating_clients
        float accuracy
        float loss
        datetime started_at
    }

    MODEL_UPDATES {
        uuid id PK
        uuid federated_round_id FK
        uuid organization_id FK
        float update_norm
        float anomaly_score
        float trust_score
        float contribution_weight
        boolean accepted
    }

    PRIVACY_EVENTS {
        uuid id PK
        uuid organization_id FK
        string operation
        float epsilon_consumed
        float epsilon_remaining
        string mechanism
        datetime created_at
    }

    TRUST_HISTORY {
        uuid id PK
        uuid organization_id FK
        float previous_score
        float new_score
        string reason
        datetime timestamp
    }

    LEDGER_BLOCKS {
        int index PK
        datetime timestamp
        string previous_hash
        string payload_hash
        uuid organization_id FK
        string event_type
        string current_hash
    }
```

---

## 10. Deployment Architecture

```mermaid
graph TB
    subgraph Docker_Compose_Stack ["ThreatShield Containerized Deployment"]
        direction TB
        
        subgraph Frontend_Service ["frontend:3000"]
            Nginx["Vite / Nginx Static Server"]
            ReactApp["ThreatShield React Dashboard"]
        end

        subgraph Backend_Service ["backend:8000"]
            Uvicorn["Uvicorn ASGI Server"]
            FastAPIEngine["ThreatShield FastAPI Application"]
        end

        subgraph Database_Service ["db:5432"]
            Postgres["PostgreSQL 15 Enterprise DB"]
            PGData[("Named Volume: pgdata")]
        end
    end

    UserBrowser["SOC Analyst Web Browser"] -->|Port 3000| Frontend_Service
    Frontend_Service -->|Port 8000 REST Calls| Backend_Service
    Backend_Service -->|Port 5432 Internal TCP| Database_Service
    Database_Service --- PGData
```
