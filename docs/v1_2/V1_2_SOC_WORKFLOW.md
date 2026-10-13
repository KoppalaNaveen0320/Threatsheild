# ThreatShield v1.2 — Unified SOC Operations Workflow Guide

## Executive Overview

ThreatShield v1.2 unifies multi-organization collaborative threat intelligence with automated scoring, graph correlation, incident orchestration, and cryptographic auditing. This document details the standard operating procedures (SOP) for SOC Operations Analysts and Security Engineers.

---

## 1. Unified Intelligence & Alert Pipeline

The platform ingests, normalizes, scores, correlates, and audits threat telemetry through a 10-stage sequential pipeline:

```
[CTI Ingestion]
       │
       ▼
[Normalization & Canonical Deduplication]
       │
       ▼
[STIX 2.1 Object Conversion & Relationships]
       │
       ▼
[STIX Quality Assessment (Completeness, Timeliness, Actionability)]
       │
       ▼
[Temporal Decay Engine: Freshness F(t) = exp(-λ * Δt)]
       │
       ▼
[Temporal Knowledge Graph Ingestion & Degree/PageRank Updates]
       │
       ▼
[Contextual Sector & Threat Alignment Calculation (Relevance)]
       │
       ▼
[ThreatShield Decision Score v2 (6-Factor Composite Scoring)]
       │
       ▼
[Organization Risk Score & Adaptive Trust Evaluation]
       │
       ▼
[Security Alert Stream & Incident Correlation Orchestration]
```

---

## 2. ThreatShield Decision Score v2 Evaluation

Every indicator is assigned an explainable composite decision score $TS_{v2} \in [0.0, 1.0]$:

$$TS_{v2} = w_1 \cdot Q_{v2} + w_2 \cdot T + w_3 \cdot R + w_4 \cdot F(\Delta t) + w_5 \cdot G + w_6 \cdot S$$

### Component Weights & Parameter Definitions:
- **$w_1 = 0.25$ (Quality Score $Q_{v2}$):** Evaluates syntactic validity, schema completeness, and actionable IOC attributes.
- **$w_2 = 0.20$ (Source Organization Trust $T$):** Dynamic trust rating of the submitting member organization.
- **$w_3 = 0.20$ (Sector Relevance $R$):** Industry sector matching coefficient and targeting overlap.
- **$w_4 = 0.15$ (Temporal Freshness $F(\Delta t)$):** Half-life exponential decay factor ($\lambda = 0.05 \text{ day}^{-1}$, half-life $t_{1/2} = 13.86 \text{ days}$).
- **$w_5 = 0.10$ (Graph Centrality $G$):** Combined normalized Degree Centrality and Power-Iteration PageRank ($d = 0.85$).
- **$w_6 = 0.10$ (Alliance Sighting Frequency $S$):** Normalized corroboration frequency across distinct alliance telemetry sensors.

### Triage Classifications:
1. **Critical Alert ($TS_{v2} \ge 0.85$):** Immediate high-severity escalation; automated incident creation and defensive blocking recommendations.
2. **High Priority ($0.70 \le TS_{v2} < 0.85$):** Analyst investigation required; correlation with SIEM egress logs.
3. **Elevated Monitoring ($0.50 \le TS_{v2} < 0.70$):** Add to perimeter telemetry monitoring watchlist.
4. **Informational Feed ($TS_{v2} < 0.50$):** Retained for retrospective threat hunting and graph background correlation.

---

## 3. Peer Validation Feedback Loop

Validators and analysts submit peer assessments that adaptively refine the source organization's reputation:
- **`CONFIRMED_MALICIOUS`:** Increases source trust by $+0.05$ (positive peer corroboration).
- **`USEFUL`:** Increases source trust by $+0.02$.
- **`FALSE_POSITIVE`:** Deducts trust with asymmetric penalty factor $\alpha = 0.30$ ($T_{new} = T_{old} - 0.15$).
- **`EXPIRED`:** Updates temporal status without reputation penalty.

All feedback records are immutably signed and committed to the Permissioned Cryptographic Hash-Chain Ledger.
