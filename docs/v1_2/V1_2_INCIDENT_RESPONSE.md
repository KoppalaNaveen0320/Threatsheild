# ThreatShield v1.2 — Incident Response & Lifecycle Guide

## Overview

ThreatShield v1.2 standardizes cross-organization security incident response into a 6-stage operational lifecycle, providing end-to-end provenance, linked indicator evidence, and tamper-proof ledger logging.

---

## 1. Standardized 6-Stage Lifecycle

```
[ NEW ] ──▶ [ TRIAGED ] ──▶ [ INVESTIGATING ] ──▶ [ CONTAINED ] ──▶ [ RESOLVED ] ──▶ [ CLOSED ]
```

| Stage | Definition | Required Analyst Action |
|---|---|---|
| `NEW` | Automatically generated from Critical Alert ($TS_{v2} \ge 0.85$) or manually reported. | Initial alert triage and priority validation. |
| `TRIAGED` | Assigned to a response team; scope defined. | Confirm affected assets and target perimeter. |
| `INVESTIGATING` | Deep forensics; graph traversal; MITRE technique attribution. | Correlate network egress and endpoint telemetry. |
| `CONTAINED` | Active threat vectors blocked (firewall rules, host quarantine). | Deploy defensive course-of-action across alliance. |
| `RESOLVED` | Root cause eradicated; remediation verified. | Submit post-incident remediation summary. |
| `CLOSED` | Post-incident review completed; signed on audit chain. | Archive telemetry for long-term threat modeling. |

---

## 2. API Contracts & Automation

- `GET /api/incidents/`: List all alliance incidents with severity filtering.
- `POST /api/incidents/`: Create a new structured security incident with linked CTI indicator IDs and ATT&CK techniques.
- `PATCH /api/incidents/{incident_id}/status`: Advance incident lifecycle stage, update containment notes, and record state transitions to the cryptographic hash chain.
