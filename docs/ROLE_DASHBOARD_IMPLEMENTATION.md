# ThreatShield — Role Dashboard Implementation & High-Density UX Architecture

---

## 1. Admin Superuser Model

In ThreatShield's enterprise architecture, the **ADMIN** role functions as an unrestricted **Superuser** with complete platform visibility and governance control across all operational modules.

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ADMIN SUPERUSER CONSOLE                                   │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ • OVERVIEW:          Dashboard (/admin)  •  Security Operations (/analyst)                │
│ • INTELLIGENCE:      CTI Feed  •  Submit CTI  •  Investigation  •  Threat Map  •  Trust   │
│ • PRIVACY & ML:      Privacy Center (ε-Budget)  •  Federated Learning (Flower / PyTorch) │
│ • AUDIT & SECURITY:  Security Events  •  Cryptographic Audit Ledger (SHA-256 Chain)       │
│ • SYSTEM:            System Health (6 Engines)  •  User Management (RBAC)  •  Settings   │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Unrestricted View Routing**: `isViewAllowedForRole(role, view)` for `ADMIN` returns `true` for all system views.
- **Dedicated Administration Overview (`/admin`)**:
  - **KPIs Row (6 Cards)**: Organizations, Users, CTI Records, Pending Validations, System Health (100%), Audit Integrity (SHA-256 Chain).
  - **Platform Control Center**: Fast navigation shortcuts to User Management, Organizations, Security Events, Audit Ledger, System Health, Privacy Center, and Federated Learning.
  - **Organization Health Registry & Subsystems**: Tenant peer node metrics, trust scores, and real-time status of all 6 micro-engines.
  - **Security Events Stream & CTI Ingestion**: Real-time telemetry, replay attack protection, and artifact category spectrum.
  - **Privacy & Federated Learning Governance**: Laplace differential privacy accounting and decentralized model convergence.

---

## 2. Dedicated Role Experiences & Dashboards

ThreatShield provides four purpose-built, high-density dashboard layouts rather than generic clone templates:

### 2.1 Analyst SOC Operations Dashboard (`/analyst`)
Designed for tier-1/tier-2 SOC analysts and cyber threat hunters.
- **Information Hierarchy**:
  1. **Horizontal KPI Row (6 compact cards, height 115–135px)**:
     - `Active Threats`, `Critical/High Alerts`, `New CTIs`, `Average Confidence`, `Under Investigation`, `Suspicious Indicators`.
  2. **Main 2-Column Grid**:
     - **LEFT**: *Threat Activity Timeline* with 24-hour histogram and chronological telemetry event feed.
     - **RIGHT**: *Security Posture Panel* with granular rows for Threat Level, Critical Alerts, High Alerts, Suspicious Indicators, Trust Score, and System Integrity.
  3. **2/3 vs 1/3 Grid**:
     - **LEFT (2/3)**: *Recent Threat Intelligence Table* featuring monospace indicators, colored severity badges, confidence meters, source attribution, and `View` / `Investigate` actions.
     - **RIGHT (1/3)**: *Quick Actions Panel* (`Submit Indicator`, `Open CTI Feed`, `Investigate Threat`, `View Threat Map`) and *Subsystem Engine Health*.
  4. **Threat Correlation Graph**: Multi-tenant graph connecting identities, indicators, and sightings.

---

### 2.2 Validator Dashboard & 3-Column Workspace (`/validator`)
Designed for CTI quality assessment specialists.
- **Information Hierarchy**:
  1. **Horizontal KPI Row (6 cards)**:
     - `Pending Validation`, `Validated Today`, `Rejected Today`, `Average CTI Quality`, `High-Risk Submissions`, `Contributors Under Review`.
  2. **2/3 vs 1/3 Grid**:
     - **LEFT (2/3)**: *Validation Queue Table* with instant `Review` trigger launching the dedicated 3-column Validation Workspace.
     - **RIGHT (1/3)**: *Quick Actions* and *Mathematical Weighting Formulation Card* ($\hat{W}_i = \frac{T_i \cdot Q_i \cdot (1 - A_i)}{\sum W_j}$).
  3. **Contributor Trust Registry**: Table showing peer reputation ($T_i$), time-decayed quality ($Q_i$), anomaly factor ($A_i$), and contribution weights ($\hat{W}_i$).
  4. **Dedicated 3-Column Validation Workspace**:
     - *Column 1*: CTI Details & Raw Telemetry.
     - *Column 2*: OASIS STIX 2.1 JSON Specification & Pattern.
     - *Column 3*: Validation Decision Triggers (`Approve`, `Reject`, `Flag`, `Require Evidence`).

---

### 2.3 Threat Consumer Intelligence Dashboard (`/intelligence`)
Designed for IT directors and threat intelligence consumers.
- **Information Hierarchy**:
  1. **Horizontal KPI Row (5 cards)**:
     - `Relevant Threats`, `High-Risk Threats`, `New Intelligence`, `Trusted Sources`, `Recent Sightings`.
  2. **2/3 vs 1/3 Grid**:
     - **LEFT (2/3)**: *Recommended Threat Intelligence Table* with confidence meters, relevance rating (e.g. 94% High), and Watchlist bookmarking.
     - **RIGHT (1/3)**: *Quick Actions* (`Search CTI`, `Threat Landscape`, `Trusted Sources`, `Recent Sightings`) and *Threat Landscape Summary*.
  3. **Recent Sightings & Perimeter Mitigations**: Sensor hit counters and firewall blocking guidelines.
  4. **Saved Intelligence Watchlist**: Bookmarking and JSON watchlist export.

---

## 3. Role-Specific Navigation Architecture

The sidebar navigation dynamically adapts per authenticated role:

```
ADMIN (Superuser):
├─ OVERVIEW:           Dashboard, Security Operations
├─ INTELLIGENCE:       CTI Feed, Submit Indicator, Threat Investigation, Threat Map, Organizations, Trust & Reputation
├─ PRIVACY & ML:       Privacy Center, Federated Learning
├─ AUDIT & SECURITY:   Security Events, Audit Ledger
└─ SYSTEM:             System Health, Users & Roles, Settings

ANALYST (SOC Operations):
├─ SOC Operations:     Security Operations, CTI Feed & Search, Threat Investigation, Threat Map
├─ Intelligence:       Submit Indicator, Organizations, Trust & Reputation, Security Events
└─ System:             Settings

VALIDATOR (CTI Validation):
├─ Validation:         Validation Center, Validation Queue, CTI Feed, Threat Investigation
├─ Trust & Quality:    Contributor Trust, Quality Analytics
├─ Audit:              Validation History, Audit History
└─ System:             Settings

THREAT CONSUMER (Intelligence Discovery):
├─ Threat Intelligence: Intelligence Overview, CTI Search, Threat Landscape, Threat Map, Trusted Sources, Recent Sightings, Saved Intelligence
└─ System:             Settings
```

---

## 4. Post-Login Role Routing

| Authenticated Role | Default Landing Route | Default View | Access Scope |
| :--- | :--- | :--- | :--- |
| **`ADMIN`** | `/admin` | `admin-overview` | **SUPERUSER** (All 15+ modules accessible) |
| **`ANALYST`** | `/analyst` | `analyst-soc` | SOC Operations, Triage & CTI Feeds |
| **`VALIDATOR`** | `/validator` | `validator-center` | Validation Queue, STIX Review, Contributor Trust |
| **`THREAT_CONSUMER`** | `/intelligence` | `consumer-hub` | Intelligence Feed, Sightings & Saved Watchlist |

---

## 5. Visual Design & Enterprise Density System

- **Color Palette (Light Enterprise Theme)**:
  - App Background: `#F8FAFC`
  - Card Containers: `#FFFFFF` with `1px solid #E2E8F0`
  - Primary Blue: `#2563EB`
  - Semantic Status: Success (`#16A34A`), Warning (`#D97706`), Critical (`#EF4444`), Info (`#2563EB`), Crypto (`#7C3AED`)
- **Density & Grid Specifications**:
  - Container width: `max-width: 1600px`, `padding: 20px 24px 36px 24px`.
  - KPI Cards: Horizontal 6-column row on desktop (`height: 115–135px`, `min-width: 160px`).
  - Tables: Enterprise compact rows with subtle `#F8FAFC` hover state, uppercase headers, and monospace indicator values.
  - Quick Action Panels: Compact grid with uniform button heights and semantic hover transitions.

---

## 6. Verification & Test Results

### 6.1 Linter & Production Build
- `npm run lint` (`oxlint`): **PASSED** (0 warnings, 0 errors across 53 files).
- `npm run build` (`tsc -b && vite build`): **PASSED** (Production bundle built in 3.90s).

### 6.2 Multi-Role End-to-End Authentication & Authorization
- **ADMIN**: Authenticated, received JWT, granted full access to `/organizations/` (HTTP 200).
- **ANALYST**: Authenticated, received JWT, granted access to CTI feeds, restricted from admin routes (HTTP 403).
- **VALIDATOR**: Authenticated, received JWT, granted access to validation center, restricted from admin routes (HTTP 403).
- **THREAT_CONSUMER**: Authenticated, received JWT, granted access to intelligence feed, restricted from admin routes (HTTP 403).

---

## 7. Summary

ThreatShield is now a high-density, production-grade cybersecurity platform featuring an **unrestricted Admin Superuser model** alongside **three highly specialized operational consoles** (Analyst, Validator, Threat Consumer).
