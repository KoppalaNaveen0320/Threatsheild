# ThreatShield v1.2 — Final UI Integration Matrix & Architecture Audit

## Overview
This document specifies the end-to-end mapping between frontend enterprise workspaces, backend API endpoints, database persistence layers, and role-based access control policies.

---

## 1. Subsystem Integration Mapping

| Feature / Workspace | Frontend Component | Backend API Endpoint | Data Source / Engine | Role Access | Status | Test Coverage |
|---|---|---|---|---|---|---|
| **Admin SOC Command Center** | `AdminDashboardView.tsx` | `GET /api/analytics/soc-overview`, `GET /api/cti/`, `GET /api/incidents/`, `GET /api/ledger/` | SQLite DB, CTI Engine, Ledger | `ADMIN` | Functional & Live Connected | `test_v1_2_suite.py`, `test_live_validation_v1_2.py` |
| **Analyst Operations Dashboard** | `AnalystDashboardView.tsx` | `GET /api/analytics/security-alerts`, `GET /api/incidents/`, `GET /api/cti/` | Security Alert Aggregator, Incident Engine | `ADMIN`, `ANALYST` | Functional & Live Connected | `test_v1_2_suite.py`, `test_live_validation_v1_2.py` |
| **Validator Quality Dashboard** | `ValidatorDashboardView.tsx`, `ValidatorQueueView.tsx` | `GET /api/cti/`, `POST /api/cti/{id}/feedback` | CTI Validation Queue, Trust Engine | `ADMIN`, `VALIDATOR` | Functional & Live Connected | `test_core_systems.py`, `test_live_validation_v1_2.py` |
| **Threat Consumer Intelligence Hub** | `ConsumerDashboardView.tsx`, `ConsumerSearchView.tsx` | `GET /api/cti/`, `GET /api/cti/export/stix-bundle` | STIX 2.1 Serializer, Filtered Indicators | `ALL ROLES` | Functional & Live Connected | `test_api.py`, `test_live_validation_v1_2.py` |
| **360° Full-Screen IOC Investigation** | `InvestigateWorkspaceView.tsx`, `IocInvestigateModal.tsx` | `GET /api/cti/{id}/investigate`, `GET /api/analytics/score/explain/{id}` | STIX Normalizer, ThreatShield Score v2 Engine | `ADMIN`, `ANALYST`, `VALIDATOR` | Functional & Live Connected | `test_v1_2_deep_integration.py` |
| **Temporal Threat Knowledge Graph** | `KnowledgeGraphView.tsx` | `GET /api/analytics/graph`, `GET /api/analytics/graph/path` | 17-Entity NetworkX Temporal Graph | `ADMIN`, `ANALYST` | Functional & Live Connected | `test_v1_2_suite.py`, `test_live_validation_v1_2.py` |
| **Threat Hunting & ATT&CK Explorer** | `ThreatHuntingView.tsx` | `GET /api/threat-hunting/search`, `GET /api/threat-hunting/attack-matrix` | MITRE ATT&CK Registry, Ingestion Store | `ADMIN`, `ANALYST` | Functional & Live Connected | `test_v1_2_suite.py`, `test_live_validation_v1_2.py` |
| **Security Incident Response Lifecycle** | `IncidentsView.tsx` | `GET /api/incidents/`, `POST /api/incidents/`, `PATCH /api/incidents/{id}/status` | 6-Stage Incident State Engine | `ADMIN`, `ANALYST` | Functional & Live Connected | `test_v1_2_suite.py`, `test_live_validation_v1_2.py` |
| **Security Alert Intelligence Queue** | `AlertsCenterView.tsx` | `GET /api/analytics/security-alerts`, `PATCH /api/analytics/security-alerts/{id}/resolve` | Correlated Alert Pipeline | `ADMIN`, `ANALYST` | Functional & Live Connected | `test_v1_2_deep_integration.py` |
| **Adaptive Trust & Org Risk Center** | `AdaptiveTrustView.tsx` | `GET /api/analytics/organizations/{id}/risk`, `GET /api/trust/history/{id}` | Adaptive Trust Engine ($\alpha=0.30$), Risk Engine | `ADMIN`, `ANALYST`, `VALIDATOR` | Functional & Live Connected | `test_v1_2_suite.py`, `test_live_validation_v1_2.py` |
| **FL Adversarial Defense Lab** | `FlSecurityLabView.tsx` | `GET /api/fl/research/experiments`, `GET /api/fl/research/aggregators` | `results/v1_2/` Verified CSV Datasets | `ADMIN` | Functional & Live Connected | `test_v1_2_deep_integration.py` |
| **Differential Privacy Budget Accounting** | `PrivacyCenterView.tsx` | `GET /api/privacy/budget`, `GET /api/privacy/utility-frontier` | Laplace Mechanism Engine, `results/v1_2/` | `ADMIN`, `ANALYST` | Functional & Live Connected | `test_v1_2_deep_integration.py` |
| **Permissioned Hash-Chain Ledger** | `LedgerView.tsx` | `GET /api/ledger/`, `POST /api/ledger/verify` | SQLite Ledger Table, SHA-256 Chain | `ADMIN`, `VALIDATOR` | Functional & Live Connected | `test_ledger.py`, `test_core_systems.py` |
| **System Health & Telemetry** | `SystemHealthView.tsx` | `GET /api/health/` | Subsystem Health Evaluator | `ADMIN` | Functional & Live Connected | `test_improvements_regression.py` |
| **Global Command Center (Ctrl+K)** | `CommandPalette.tsx` | `GET /api/threat-hunting/search` | Multi-Entity Indexer | `ALL ROLES` | Functional & Live Connected | `test_live_validation_v1_2.py` |
| **Interactive Guided Demo Tour** | `DemoModeModal.tsx` | Client Orchestration (`DEMO / SYNTHETIC DATA`) | Client Tour Orchestrator | `ALL ROLES` | Functional & Live Connected | Manual & E2E Validation |

---

## 2. Verification Protocol

- All API responses are typed with Pydantic schemas in `backend/app/schemas/`.
- No mock data or hardcoded numbers are utilized in production views without explicit API backing.
- Fallback states (`LoadingState`, `EmptyState`, `ErrorState`) are rendered whenever data is loading, empty, or an API error occurs.
