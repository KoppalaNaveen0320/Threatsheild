# THREATSHIELD — LIVE DEMONSTRATION & EVALUATION GUIDE

**Estimated Duration**: 5 to 10 Minutes  
**Target Audience**: Evaluators, Cybersecurity Researchers, Viva Examiners  
**System Classification**: Research-Grade, Production-Inspired Cybersecurity Prototype  

---

## Demonstration Script & Step-by-Step Walkthrough

| Step # | Flow Phase | UI Action / CLI Operation | Backend API Endpoint | Expected System Result | Research & Academic Concept Demonstrated |
|:---|:---|:---|:---|:---|:---|
| **1** | **Authentication** | Navigate to `http://localhost:3000/`. Enter credentials (`user@orga.com` / `Password123!`) and click **Login**. | `POST /api/auth/login` | JWT access token received, stored in session state; UI redirects to Main Dashboard. | **Zero-Trust Access & JWT Auth**: Demonstrates stateless identity propagation with cryptographic expiration. |
| **2** | **Organization Dashboard** | View organization profile badge, active trust score ($0.50$), and initial privacy budget ($10.0\,\epsilon$). | `GET /api/organizations/{org_id}` | Organization status display showing verified active status and tenant boundary. | **Multi-Tenancy & Resource Bounds**: Illustrates per-tenant trust and differential privacy tracking. |
| **3** | **CTI Submission** | In "Submit CTI", enter `type: ipv4-addr`, `value: 198.51.100.25`, `description: CobaltStrike C2 Node`, click **Submit CTI**. | `POST /api/cti/` | 200 OK; CTI entry appears in the threat feed; hash automatically queued to ledger. | **Structured Threat Ingestion**: Standardized IOC collection paired with immutable audit trails. |
| **4** | **STIX 2.1 Serialization** | Click **Export STIX 2.1 Bundle** or execute GET request. | `GET /api/cti/export/stix-bundle` | Returns valid OASIS STIX 2.1 JSON bundle containing `identity` and `indicator` objects. | **Cyber Threat Interoperability**: Adherence to global threat sharing standards (OASIS STIX/TAXII). |
| **5** | **CTI Search & Sharing** | Enter search filter (e.g. IP or keyword) or view shared collective feed. | `GET /api/cti/` | Returns filtered indicator array with severity, confidence, and submitting organization metadata. | **Collaborative Defense**: Cross-organization threat discovery without exposing raw sensor topologies. |
| **6** | **Peer Feedback & Trust Update** | Submit peer feedback confirming CTI maliciousness (`CONFIRMED_MALICIOUS`). | Internal DB / Trust Engine (`update_trust_score`) | Trust score increases from $0.50$ to $0.55$ ($T_{\text{new}} = T_{\text{old}}(1-\alpha) + \alpha S$). | **Dynamic Reputation Scoring**: Exponential moving average reputation based on peer-validated intelligence. |
| **7** | **Differential Privacy Query** | Request macro platform threat statistics (`/api/privacy/stats`). | `GET /api/privacy/stats` | Returns Laplace-perturbed threat counts; privacy budget decrements by $0.5\,\epsilon$ (to $9.5\,\epsilon$). | **Differential Privacy (Laplace)**: Provable privacy bounds ($M(D) = f(D) + \text{Lap}(\Delta f/\epsilon)$) preventing membership inference. |
| **8** | **Federated Learning Training** | Run simulated FL round across Org A and Org B with Dirichlet Non-IID data ($\alpha=0.3$). | `python run_rigorous_validation.py` | Local models train on private datasets; model weights exchange without moving raw data ($Acc \approx 0.641$). | **Federated Learning (Flower)**: Distributed intrusion detection with zero raw data transmission. |
| **9** | **Adversarial Attack Simulation** | Simulate 30% parameter perturbation attack on standard FedAvg. | `python run_rigorous_validation.py` | Standard FedAvg weights malicious update at 50%, accuracy collapses to $0.510$ ($\Delta\text{Acc} = 0.131$). | **Vulnerability of Naive FedAvg**: Proves standard aggregation's extreme vulnerability to Byzantine poison. |
| **10** | **Trust-Weighted Defense** | Execute Trust-Weighted FedAvg on identical 30% poisoned round. | Trust-Weighted FedAvg (`W_i = T_i Q_i (1-A_i)`) | Anomaly detected ($A_i = 1.0$); malicious weight crushed to $0.0011$ (**99.78% reduction**); global accuracy retained at $0.768$. | **Byzantine-Tolerant Aggregation**: Mathematical proof of malicious influence suppression under attack. |
| **11** | **Cryptographic Ledger Verification** | Click **Verify Ledger** on dashboard or execute ledger audit test. | `GET /api/ledger/verify` | Returns `{"valid": true}`; 10/10 tamper tests confirm modified payloads/timestamps are immediately detected. | **Immutable Auditability**: SHA-256 hash chaining ensuring accountability without centralized trust. |
