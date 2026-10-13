# Phase 0: Research & Literature Review

## 1. Literature Review

Cyber Threat Intelligence (CTI) sharing is critical for enabling organizations to anticipate and defend against cyberattacks. However, current platforms and research reveal a fundamental tension between the utility of shared intelligence and the privacy risks associated with exposing raw telemetry.

### 1.1 Centralized CTI Sharing & Standards
Traditional approaches (e.g., TAXII, MISP) rely on centralized platforms where participants upload indicators of compromise (IoCs) and threat reports.
- **STIX/TAXII:** Provides a standardized format (STIX) and transport mechanism (TAXII) for CTI.
- **MISP:** A widely used platform for structured CTI storage, correlation, and collaboration.
*Limitations:* Centralized systems create a single point of failure and require implicit trust in the central server. They often demand raw data exposure, making participants hesitant to share sensitive internal logs.

### 1.2 Privacy-Preserving and Federated Learning Approaches
Recent research has turned to distributed computation to protect privacy:
- **Federated Learning (FL):** Allows organizations to collaboratively train threat detection models (e.g., intrusion detection systems) without exchanging raw data.
- **Differential Privacy (DP):** Adds calibrated statistical noise (e.g., Laplace mechanism) to queries or gradients, providing formal privacy guarantees against information extraction.
- **Secure Aggregation / Secure MPC:** Ensures that the central aggregator only sees the aggregated sum of model updates, preventing the inference of individual participant updates.
*Limitations:* FL alone does not guarantee privacy; model updates can still leak information through gradient inversion attacks.

### 1.3 Blockchain and Trust Mechanisms
Blockchain technology is increasingly proposed to provide decentralization, auditability, and tamper evidence in CTI sharing.
*Limitations:* Public blockchains suffer from latency, scalability issues, and exposure of potentially sensitive metadata. Furthermore, while blockchain provides integrity, it does not evaluate the *quality* or *trustworthiness* of the intelligence being shared.

## 2. Existing System Analysis & Comparison

| Feature | Centralized CTI (MISP) | STIX/TAXII | FL CTI Systems | Blockchain + FL | ThreatShield |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Architecture** | Centralized | Standard/Protocol | Decentralized | Decentralized | Hybrid (Decentralized ML, Local CTI, Central Agg) |
| **Privacy** | Low (Raw data exposure) | None (Format only) | Medium | Medium | High (FL + Secure Agg + DP) |
| **Data Exposure** | High | High | Low (Model updates) | Low | Minimized |
| **Trust Management**| Basic/Manual | None | None | Basic | Dynamic, Feedback-driven |
| **Quality Scoring** | Basic (Sightings) | None | None | None | Comprehensive Multi-factor |
| **Poisoning Detect**| N/A | N/A | Low | Low | High (Trust-weighted, Anomaly) |
| **Auditability** | Internal logs | None | None | High | High (Cryptographic Ledger) |

## 3. Research Gap & ThreatShield Differentiation

The critical research gaps identified are:
1. **Privacy vs. Utility Trade-off:** Existing systems either expose too much data (high utility, low privacy) or limit collaboration entirely.
2. **Dynamic Trust & CTI Quality:** Current systems lack a robust mechanism for scoring the trustworthiness of organizations and the quality of their submissions dynamically based on empirical feedback.
3. **Malicious Participant Resilience:** Standard FL systems are highly vulnerable to model poisoning and non-IID data skews.
4. **Relevant Intelligence Distribution:** Not all CTI is relevant to every participant. Existing systems broadcast broadly without environmental relevance scoring.

**ThreatShield Differentiation:**
ThreatShield does not claim that DP, FL, or Blockchain are novel individually. The primary contribution is the **integrated architecture** that synthesizes these technologies. ThreatShield dynamically calculates a *Trust-Weighted* Federated Average, shielding the system from poisoned updates while utilizing Differential Privacy for aggregates and a cryptographic hash-chain ledger for auditable integrity, creating a robust, privacy-utility optimized CTI network.
