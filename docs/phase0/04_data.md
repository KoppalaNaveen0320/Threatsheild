# Phase 0: Database & Data Model

## 1. Database ER Diagram & Entities

The database utilizes PostgreSQL with SQLAlchemy ORM. The schema is designed to be fully normalized to accommodate future STIX 2.1 representation and all project phases.

### Entities

1. **Organization**
   - `id` (UUID, PK)
   - `name` (String)
   - `trust_score` (Float, Default: 0.5)
   - `privacy_budget` (Float)
   - `public_key` (String)
   - `status` (String)
   - `created_at` (DateTime)

2. **User**
   - `id` (UUID, PK)
   - `organization_id` (UUID, FK)
   - `email` (String)
   - `password_hash` (String, Argon2id/bcrypt)
   - `role` (Enum: ADMIN, ANALYST, VALIDATOR, THREAT_CONSUMER)
   - `created_at` (DateTime)

3. **CTIRecord**
   - `id` (UUID, PK)
   - `organization_id` (UUID, FK)
   - `type` (String - e.g., ipv4-addr, domain-name, file-hash)
   - `value` (String)
   - `description` (Text)
   - `severity` (Float)
   - `confidence` (Float)
   - `source` (String)
   - `status` (String)
   - `created_at` (DateTime)

4. **Feedback**
   - `id` (UUID, PK)
   - `cti_id` (UUID, FK)
   - `organization_id` (UUID, FK)
   - `user_id` (UUID, FK)
   - `feedback_type` (Enum: USEFUL, NOT_USEFUL, FALSE_POSITIVE, CONFIRMED_MALICIOUS, EXPIRED)
   - `comment` (Text)
   - `confidence` (Float)
   - `created_at` (DateTime)

5. **FederatedRound**
   - `id` (UUID, PK)
   - `round_number` (Integer)
   - `global_model_hash` (String)
   - `participating_clients` (Integer)
   - `aggregation_method` (String)
   - `accuracy` (Float)
   - `loss` (Float)
   - `started_at` (DateTime)
   - `completed_at` (DateTime)

6. **ModelUpdate**
   - `id` (UUID, PK)
   - `federated_round_id` (UUID, FK)
   - `organization_id` (UUID, FK)
   - `model_hash` (String)
   - `update_norm` (Float)
   - `anomaly_score` (Float)
   - `trust_score` (Float)
   - `quality_score` (Float)
   - `contribution_weight` (Float)
   - `accepted` (Boolean)
   - `created_at` (DateTime)

7. **PrivacyEvent**
   - `id` (UUID, PK)
   - `organization_id` (UUID, FK)
   - `operation` (String)
   - `epsilon_consumed` (Float)
   - `epsilon_remaining` (Float)
   - `mechanism` (String)
   - `created_at` (DateTime)

8. **TrustHistory**
   - `id` (UUID, PK)
   - `organization_id` (UUID, FK)
   - `previous_score` (Float)
   - `new_score` (Float)
   - `reason` (String)
   - `timestamp` (DateTime)

9. **LedgerBlock / AuditRecord**
   - `index` (Integer, PK)
   - `timestamp` (DateTime)
   - `previous_hash` (String)
   - `payload_hash` (String)
   - `organization_id` (UUID, FK)
   - `event_type` (String)
   - `event_id` (String)
   - `current_hash` (String)

## 2. STIX 2.1 Mapping Strategy
Phase 1 relies on the normalized `CTIRecord`. Phase 2 will implement serialization/deserialization classes mapping `CTIRecord` onto `stix2` Python library objects.

- **Indicator:** Mapped from `CTIRecord` type (e.g., ipv4-addr) and value.
- **Sighting:** Mapped from `Feedback` entity.
- **Identity:** Mapped from `Organization` entity.
