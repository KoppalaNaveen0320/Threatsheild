# THREATSHIELD — LIVE DEMONSTRATION SCRIPT & WALKTHROUGH

**Demonstration Duration**: 5–10 Minutes  
**Demonstrator**: Research Presenter  
**Audience**: Evaluation Committee / Academic Examiners  
**Classification**: `Version 1.0 — Research Prototype`  

---

## Complete Demonstration Sequence

```
  [1. Login & JWT] ────────► [2. Organization Profile] ────────► [3. CTI Submission]
         │
         ▼
  [4. STIX 2.1 Export] ────► [5. CTI Search & Feeds] ────────► [6. Trust & Quality Update]
         │
         ▼
  [7. Privacy Budget] ─────► [8. Clean FL Training] ─────────► [9. Poisoning Attack Sim]
         │
         ▼
  [10. Trust Defense] ─────► [11. Ledger Verification]
```

---

### Step 1: Authentication & Zero-Trust Session Initiation (1 Minute)
- **Presenter Narration**: *"We begin by authenticating an analyst from a participating organization. ThreatShield uses stateless JWT authentication with bcrypt password hashing to enforce zero-trust access control."*
- **Action**: Navigate to `http://localhost:3000/`. Enter `user@orga.com` and `Password123!`. Click **Login**.
- **Backend API**: `POST /api/auth/login`
- **Output**: Returns signed JWT bearer access token (`{"access_token": "...", "token_type": "bearer"}`). UI transitions to the active ThreatShield dashboard.
- **Takeaway**: Demonstrates secure, stateless session initiation with RBAC role binding.

---

### Step 2: Organization Profile & Multi-Tenancy (30 Seconds)
- **Presenter Narration**: *"Upon login, the analyst is scoped strictly to their organization's tenant boundary. We see the organization's initial trust score of 0.50 and starting privacy budget of 10.0 epsilon."*
- **Action**: View Organization Profile Card on the Dashboard.
- **Backend API**: `GET /api/organizations/{org_id}`
- **Output**: Displays Organization Name, Status (`ACTIVE`), Trust Score (`0.50`), and Privacy Budget (`10.0`).
- **Takeaway**: Demonstrates multi-tenant boundary isolation and independent resource tracking.

---

### Step 3: CTI Ingestion & Indicator Submission (1 Minute)
- **Presenter Narration**: *"When the local SOC identifies an active indicator of compromise, it is submitted through the CTI ingestion engine with severity and confidence scores."*
- **Action**: In the CTI Submission form, enter:
  - **Type**: `ipv4-addr`
  - **Value**: `198.51.100.25`
  - **Severity**: `8.0`
  - **Confidence**: `0.90`
  - **Description**: `CobaltStrike C2 Beacon detected in SOC DMZ`
  - Click **Submit CTI**.
- **Backend API**: `POST /api/cti/`
- **Output**: 200 OK; returns created CTI record with unique UUID; payload hash is immediately committed to the cryptographic ledger.
- **Takeaway**: Illustrates structured IOC ingestion paired with immutable audit trails.

---

### Step 4: STIX 2.1 Graph Mapping & Interoperability (1 Minute)
- **Presenter Narration**: *"To ensure seamless integration with global threat sharing ecosystems like MISP and OpenCTI, ThreatShield natively serializes internal CTI into OASIS STIX 2.1 JSON bundles."*
- **Action**: Click **Export STIX 2.1 Bundle** or execute `GET /api/cti/export/stix-bundle`.
- **Backend API**: `GET /api/cti/export/stix-bundle`
- **Output**: Returns a complete STIX 2.1 JSON bundle containing `identity--<org_uuid>` and `indicator--<cti_uuid>` objects with STIX pattern `[ipv4-addr:value = '198.51.100.25']`.
- **Takeaway**: Confirms standard compliance with international cyber threat sharing specifications.

---

### Step 5: CTI Discovery & Tenant Isolation (30 Seconds)
- **Presenter Narration**: *"Analysts can search and correlate shared threat indicators across partner organizations without exposing raw internal telemetry."*
- **Action**: View the CTI Feed list or filter indicators by type.
- **Backend API**: `GET /api/cti/`
- **Output**: Filtered JSON array of active threat records.
- **Takeaway**: Cross-organizational intelligence sharing without internal sensor exposure.

---

### Step 6: Peer Validation Feedback & Trust Score Update (1 Minute)
- **Presenter Narration**: *"When peer organizations validate an indicator, their feedback updates the submitting organization's trust score using an Exponential Moving Average (EMA)."*
- **Action**: Submit peer feedback confirming CTI maliciousness (`CONFIRMED_MALICIOUS`, score = 1.0).
- **Backend Logic**: `update_trust_score(db, org_id, quality=1.0, reason="Peer validated")`
- **Output**: Trust score increases from $0.50$ to $0.55$:
  $$T_{\text{new}} = 0.50 \times (1 - 0.1) + 0.1 \times 1.0 = 0.55$$
- **Takeaway**: Proves dynamic reputation adaptation based on empirical intelligence quality.

---

### Step 7: Differential Privacy & Privacy Budget Tracking (1 Minute)
- **Presenter Narration**: *"To prevent membership inference attacks when querying macro platform statistics, ThreatShield injects Laplace noise and deducts from the organization's privacy budget."*
- **Action**: Request macro platform threat statistics (`GET /api/privacy/stats`).
- **Backend API**: `GET /api/privacy/stats`
- **Output**: Returns perturbed active threat counts ($M(D) = f(D) + \text{Lap}(\Delta f / \epsilon)$). Privacy budget decrements by $0.5\,\epsilon$ (from $10.0$ to $9.5$).
- **Takeaway**: Demonstrates provable differential privacy guarantees with automated budget accounting.

---

### Step 8: Clean Federated Learning Training (1.5 Minutes)
- **Presenter Narration**: *"Now we demonstrate collaborative intrusion detection model training using Flower and PyTorch across strongly imbalanced Dirichlet Non-IID partitions (alpha = 0.3)."*
- **Action**: Execute baseline FL simulation (`python run_rigorous_validation.py`).
- **Output**:
  - Baseline Local Model Acc: **0.7660 ± 0.1904**
  - Clean Standard FedAvg Acc: **0.6410 ± 0.1694**
  - Clean Trust-Weighted FedAvg Acc: **0.6410 ± 0.1590**
- **Takeaway**: Proves zero performance penalty under clean non-IID conditions ($0.6410$ vs $0.6410$).

---

### Step 9: Adversarial Parameter Poisoning Attack Simulation (1 Minute)
- **Presenter Narration**: *"We now simulate a Byzantine attack where a malicious client injects 30% Gaussian parameter noise into standard FedAvg."*
- **Action**: Review standard FedAvg performance under 30% poisoning.
- **Output**: Standard FedAvg assigns an invariant 50% weight to the attacker; global model accuracy degrades sharply from $0.6410$ down to **0.5100** ($\Delta\text{Acc} = 0.1310$).
- **Takeaway**: Highlights the extreme vulnerability of naive FedAvg to adversarial manipulation.

---

### Step 10: Byzantine-Tolerant Trust-Weighted Defense (1.5 Minutes)
- **Presenter Narration**: *"We execute ThreatShield's Trust-Weighted FedAvg on the identical 30% poisoned round."*
- **Action**: Review Trust-Weighted FedAvg metrics under 30% poisoning.
- **Output**:
  - Anomaly Score triggers: $A_i = 1.0000$
  - Malicious Contribution Weight suppressed from $0.5000$ down to **0.0011** (**99.78% reduction**)
  - Global Model Accuracy preserved at **0.7680** (Macro F1: **0.7004**)
- **Takeaway**: Validates our core research finding: ThreatShield effectively suppresses suspicious client influence under attack.

---

### Step 11: Cryptographic Ledger Audit & Tamper Detection (1 Minute)
- **Presenter Narration**: *"Finally, we audit the cryptographic hash-chain ledger to verify end-to-end immutability."*
- **Action**: Execute `GET /api/ledger/verify` and review automated tamper unit tests.
- **Output**: Returns `{"valid": true}`. 10/10 tamper test cases prove that any modified historical payload, timestamp, or previous hash immediately breaks the chain and triggers detection.
- **Takeaway**: Confirms non-repudiation and immutable event history.

---

### Conclusion of Demo
- **Presenter Narration**: *"In summary, ThreatShield delivers a complete, research-grade, production-inspired framework for collaborative threat sharing and intrusion detection with mathematical privacy, Byzantine resilience, and cryptographic auditability."*
