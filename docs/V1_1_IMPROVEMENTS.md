# ThreatShield v1.1 — Advanced System Improvements Specification

---

## 1. Executive Summary & Scope

ThreatShield v1.1 builds upon the frozen v1.0 research baseline, transitioning the framework from a research prototype into a robust, observable collaborative cybersecurity intelligence platform.

> **Research Integrity Invariant**:  
> ThreatShield v1.0 empirical results and frozen baseline are completely preserved in `results/v1_0/` and `experiments/v1_0/`. All v1.1 enhancements are versioned independently in `results/v1_1/` and `experiments/v1_1/`.

---

## 2. Detailed v1.1 Subsystem Enhancements

### 2.1 Multi-Entity CTI Correlation Graph Engine v1.1
- **Entity Support**: Connects `Organization` (Identity), `Indicator` (IOC), `Malware`, `ThreatActor`, `AttackPattern` (MITRE ATT&CK), `Vulnerability` (CVE), and `Sighting`.
- **Relational Inferences**: Automatically parses CVE identifiers (`CVE-YYYY-NNNN`), MITRE techniques (`T1059.001`), and co-located IP subnets (`/24`) from ingested telemetry.
- **API Endpoint**: `GET /api/cti/correlation/graph` supporting dynamic filtering by `min_severity`, `node_types`, and `org_id`.
- **Summary Analytics**: Reports shared indicators, shared sightings, correlated malware clusters, and active threat actor associations.

### 2.2 Strict Separation of Confidence, Quality, and Trust
ThreatShield v1.1 formally decouples three often-conflated security dimensions:

| Dimension | Conceptual Definition | Mathematical Representation | Operational Impact |
| :--- | :--- | :--- | :--- |
| **Confidence ($C_i$)** | How confident is the submitter in the indicator detection? | $C_i \in [0.0, 1.0]$ | Ingestion metadata weighting |
| **Quality ($Q_i$)** | How reliable and useful has the CTI historically been across peers? | $Q_i = 0.35 C_i + 0.25 F_i + 0.25 S_i + 0.15 H_i \in [0.0, 1.0]$ | Dissemination ranking |
| **Trust ($T_k(t)$)** | How reputable is the contributing organization overall? | $T_k(t) = 0.85 T_k(t-1) + 0.15 E_k(t) \in [0.05, 1.00]$ | Federated Learning contribution weight |

### 2.3 Threat Relevance Engine v1.1 & ThreatShield Score
- **Relevance Formula**:
  $$R_{ij} = 0.30 \text{Sev}_i + 0.25 \text{SecRel}_{ij} + 0.15 \text{Sight}_{ij} + 0.15 C_i + 0.15 F_i$$
  with structured explainability ("Observed in N active partner sightings • High severity • Recent telemetry").
- **ThreatShield Decision Score**:
  $$\text{TS}_{ij} = 0.35 Q_i + 0.25 T_i + 0.25 R_{ij} + 0.15 F_i$$
  categorizing intelligence into `CRITICAL_ACTION` ($\ge 0.80$), `HIGH_PRIORITY` ($\ge 0.65$), `MEDIUM_PRIORITY` ($\ge 0.45$), and `LOW_TRIAGE` ($< 0.45$).

### 2.4 Multi-Aggregator Federated Learning v1.1
Implements and benchmarks four distinct aggregation strategies:
1. **Standard FedAvg**: Uniform weighted parameter averaging ($1/K$).
2. **Trust-Weighted FedAvg**: Anomaly-aware weighting $W_i = T_i \cdot Q_i \cdot (1 - A_i)$.
3. **Coordinate-wise Median**: Evaluates coordinate-by-coordinate median across client update tensors.
4. **Trimmed Mean ($\beta = 0.20$)**: Trims lowest and highest parameter coordinates before computing the mean.

### 2.5 Security Event Telemetry Stream
- **API Endpoint**: `GET /api/security-events/`
- Streams real-time telemetry from the Cryptographic Hash-Chain Ledger, Privacy Budget Monitor, and Trust Engine.
- Captures failed logins, replay attempts, duplicate CTI submissions, ledger verification checks, and budget exhaustion events.
