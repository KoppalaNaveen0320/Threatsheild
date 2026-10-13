# Phase 0: Security & Threat Model

## 1. Threat Model

The ThreatShield threat model considers various adversarial entities attempting to undermine the confidentiality, integrity, and availability of the CTI network.

### 1.1 External Attacker
- **Attack Vector:** Network interception, API exploitation, credential stuffing.
- **Impact:** Data breach, denial of service.
- **Defense:** TLS for transit, JWT authentication, RBAC, Rate Limiting.
- **Detection:** High failure rates in authentication, volumetric spikes.
- **Metric:** Blocked unauthorized requests per minute.

### 1.2 Malicious Organization / Fake CTI Contributor
- **Attack Vector:** Submitting false intelligence (Fake CTI).
- **Impact:** Wasted analyst time, false positives, degradation of trust.
- **Defense:** CTI Quality Scoring, dynamic Organization Trust Scoring, Feedback loops.
- **Detection:** High rate of "FALSE_POSITIVE" or "NOT_USEFUL" feedback.
- **Metric:** Fake CTI detection rate, False Positive Rate (FPR).

### 1.3 Curious Aggregator
- **Attack Vector:** Inspecting central logs to infer organizational telemetry.
- **Impact:** Privacy violation, leakage of sensitive logs.
- **Defense:** Federated Learning (FL), Secure Aggregation, Differential Privacy (DP).
- **Detection:** Auditing of data exposure metrics.
- **Metric:** Epsilon ($\epsilon$) consumed, raw data exposure (0 MB).

### 1.4 Compromised User
- **Attack Vector:** Insider accessing unauthorized intelligence.
- **Impact:** Confidentiality breach.
- **Defense:** Organization Isolation, RBAC (Role-Based Access Control).
- **Detection:** Access logs, abnormal access patterns.
- **Metric:** Unauthorized access attempts detected.

### 1.5 Replay Attacker
- **Attack Vector:** Resubmitting old or expired intelligence/model updates.
- **Impact:** Skewing global models or creating stale alerts.
- **Defense:** Timestamps, Nonces, CTI Hash verification.
- **Detection:** Replay detection logic (Hash duplicate + timestamp check).
- **Metric:** Replay detection rate.

### 1.6 Model-Poisoning Client
- **Attack Vector:** Submitting malicious ML model updates during FL rounds.
- **Impact:** Global model accuracy degradation, targeted evasion.
- **Defense:** Trust-Weighted FedAvg, Model Update Anomaly Detection.
- **Detection:** Abnormal parameter deviation ($D_i = ||w_i - w_{global}||_2$).
- **Metric:** Poisoning detection rate / Attack success rate.

### 1.7 Sybil-like Participant
- **Attack Vector:** Creating multiple malicious identities to outvote honest nodes.
- **Impact:** Complete compromise of Trust/Quality metrics and FL global model.
- **Defense:** Correlated-behavior detection, strict Organization vetting.
- **Detection:** High correlation in CTI submissions and model updates across nodes.
- **Metric:** Sybil detection rate, Trust degradation of correlated nodes.

### 1.8 Database/Ledger Attacker
- **Attack Vector:** Direct tampering of stored data.
- **Impact:** Loss of integrity, inability to audit.
- **Defense:** Cryptographic Hash-Chain Ledger, SHA-256 block hashing.
- **Detection:** Discrepancy between current block hash and re-calculated hash.
- **Metric:** Tamper detection rate.

## 2. Security Requirements

| Requirement | ThreatShield Mechanism |
| :--- | :--- |
| **Confidentiality** | AES-256-GCM |
| **Integrity** | SHA-256 + Cryptographic Hash Chain |
| **Authentication** | JWT + secure password hashing (Argon2id/bcrypt) |
| **Authorization** | RBAC + Organization Isolation |
| **Privacy** | Federated Learning + Differential Privacy |
| **Model Update Privacy** | Secure Aggregation |
| **Non-Repudiation** | Digital Signatures |
| **Auditability** | Cryptographic Ledger |

## 3. STRIDE Mapping

| Threat | Protection |
| :--- | :--- |
| **Spoofing** | Digital Signatures, JWT, Cryptographic Identity |
| **Tampering** | SHA-256 Hashing, Permissioned Hash-Chain Ledger |
| **Repudiation** | Audit Logs, Ledger Blocks, Feedback Tracking |
| **Information Disclosure** | DP, Secure Aggregation, AES-256-GCM, FL |
| **Denial of Service** | Rate Limiting, RBAC |
| **Elevation of Privilege** | RBAC, Organization Isolation |
