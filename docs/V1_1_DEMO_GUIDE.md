# ThreatShield v1.1 — Live Demonstration & Evaluator Script

This guide outlines a seamless **5 to 10 minute live demonstration workflow** showcasing the ThreatShield v1.1 platform to academic evaluators, defense analysts, or conference audiences.

---

## Pre-Flight Checklist

1. **Backend Server**: Ensure FastAPI is running on `http://127.0.0.1:8000` (`python run_backend.py`).
2. **Frontend App**: Ensure Vite is running on `http://localhost:5173` (`npm run dev`).
3. **Database State**: Pre-seeded with authentic demonstration records.

---

## 5–10 Minute Demonstration Sequence

### Step 1: Authentication & Role-Based Dashboard Experience (1 min)
- **Action**: Open `http://localhost:5173` in browser.
- **Demo Points**:
  - Log in as **Administrator** (`admin@threatshield.org` / `admin123`).
  - Point out the high-density light enterprise SOC layout: active organizations, server telemetry, cryptographic ledger status, and FL health.
  - Switch to **Analyst** or **Validator** role: show how the layout transforms dynamically around the user's operational responsibilities without allowing untrusted client-side privilege escalation.

### Step 2: CTI Ingestion & STIX 2.1 Normalization (1.5 min)
- **Action**: Navigate to **CTI Management** $\to$ **Submit Indicator**.
- **Input**:
  - Indicator Type: `Domain Name`
  - Value: `  HTTPS://Apt29-CozyBear-C2.COM/login  ` (Intentionally poorly formatted).
  - Severity: `8.5` | Confidence: `95%`
- **Demo Points**:
  - Click **Submit Indicator**.
  - Show instantaneous syntactic normalization to lowercase canonical format `apt29-cozybear-c2.com`.
  - Click **View STIX 2.1 JSON**: Demonstrate automated generation of OASIS STIX 2.1 SDO (`indicator`) and SRO (`relationship`) compliant structures.

### Step 3: Threat Relevance, Quality & ThreatShield Score (1.5 min)
- **Action**: Click on the newly submitted CTI record in the CTI Intelligence Feed.
- **Demo Points**:
  - Explain the 3 distinct mathematical factors:
    - **Confidence ($C_i = 0.95$)**: Submitter self-reported certainty.
    - **Quality ($Q_i = 0.835$)**: Multi-factor reliability score.
    - **Relevance ($R_{ij} = 0.760$)**: Sector-specific risk match.
  - Point out the unified **ThreatShield Decision Score ($\text{TS}_{ij} = 0.757$)** with natural language explainability.

### Step 4: Sighting Feedback Loop & Trust Temporal Decay (1.5 min)
- **Action**: Log in as **Validator** $\to$ Submit Sighting Feedback (`CONFIRMED_MALICIOUS`).
- **Demo Points**:
  - Show how peer confirmation immediately triggers a closed-loop update to the source organization's reputation ($T_i$).
  - Navigate to **Trust Management**: Show the transparent Trust History audit trail and explain the exponential temporal decay formulation $\text{Decay}(t) = e^{-\lambda t}$.

### Step 5: Federated Learning Poisoning Defense Demo (2 min)
- **Action**: Navigate to **Federated Learning Defense Dashboard**.
- **Demo Points**:
  - Show the 4-way aggregation comparison: **Trust-Weighted FedAvg** vs **Standard FedAvg** vs **Trimmed Mean** vs **Coordinate Median**.
  - Highlight the multi-signal anomaly metric ($A_i$) combining L2 norm divergence and cosine similarity.
  - Point out the **99.9% malicious influence reduction** under Gaussian parameter noise ($W_{mal} \le 0.0001$).
  - Stress the honest scientific finding: clean baseline accuracy difference is small ($+0.28\%$), but Trust-Weighted FedAvg provides robust poisoning suppression.

### Step 6: Differential Privacy Budget & Ledger Verification (1.5 min)
- **Action**: Navigate to **Privacy & Cryptographic Audit Ledger**.
- **Demo Points**:
  - Demonstrate Laplace differential privacy budget tracking ($\epsilon_{remaining} \ge 0$).
  - Click **Verify Cryptographic Chain**: Demonstrate SHA-256 block traversal verifying that all records, trust shifts, and model rounds are mathematically tamper-free.
