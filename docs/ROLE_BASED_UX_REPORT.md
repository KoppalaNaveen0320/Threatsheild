# ThreatShield — Role-Based Dashboard & UX Architecture Report

---

## 1. Executive Summary & Role Architecture

ThreatShield has been updated with a **Role-Based Experience Architecture**. The previous generic interface and insecure client-side role dropdowns have been replaced by four distinct, purpose-built product consoles designed specifically for each stakeholder's operational responsibilities:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATED USER (JWT)                          │
│                                      │                                      │
│                           Role Detection (user.role)                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
       ┌──────────────────┬────────────┴───────┬──────────────────┐
       │                  │                    │                  │
       ▼                  ▼                    ▼                  ▼
┌──────────────┐   ┌──────────────┐    ┌──────────────┐   ┌──────────────┐
│    ADMIN     │   │   ANALYST    │    │  VALIDATOR   │   │THREAT_CONSUMER
│  Dashboard   │   │     SOC      │    │ Validation   │   │ Intelligence │
│  Governance  │   │  Operations  │    │    Center    │   │    Center    │
└──────────────┘   └──────────────┘    └──────────────┘   └──────────────┘
```

Each authenticated role receives a tailored workflow, specialized KPIs, distinct information hierarchy, role-specific navigation, and permission-aware actions.

---

## 2. Authentication & Authorization Security Model

### Strict Backend Role Authority
- **Zero Client-Side Privilege Escalation**: The authenticated user's role (`user.role`) is derived strictly from backend authentication and JSON Web Token (JWT) verification.
- **Removed Role-Switcher**: The former insecure quick-role selector buttons that granted arbitrary roles on the client have been removed.
- **Safe Demo Access**: Demo buttons on the login screen now act as **credential population shortcuts** that authenticate against the real FastAPI `/api/auth/login` endpoint.
- **Backend Authorization Enforcement**: FastAPI dependency injection (`get_current_admin`, `get_current_active_user`) enforces strict RBAC at the API boundary, returning `HTTP 403 Forbidden` for unauthorized requests (such as non-admin roles accessing organization directory administration).

---

## 3. Post-Login Routing Matrix

Following successful token exchange, the frontend application dynamically routes users to their respective home dashboards:

| Role | Landing Route | Landing View Name | Purpose & Primary Focus | Accent Color |
| :--- | :--- | :--- | :--- | :--- |
| **`ADMIN`** | `/admin` | `AdminDashboardView` | Organization security governance, user directory, platform health, cryptographic audit | Blue (`#2563EB`) |
| **`ANALYST`** | `/analyst` | `AnalystDashboardView` | Daily SOC triage, threat investigation, indicator ingestion, real-time correlation graph | Sky/Cyan (`#0284C7`) |
| **`VALIDATOR`** | `/validator` | `ValidatorDashboardView` | CTI validation queue, STIX schema checking, time-decay quality rating, multi-factor trust weighting | Teal/Green (`#0D9488`) |
| **`THREAT_CONSUMER`** | `/intelligence` | `ConsumerDashboardView` | Curated threat discovery, threat landscape analytics, global sightings, custom watchlists | Indigo (`#4F46E5`) |

---

## 4. Deep-Dive: The Four Dedicated Role Experiences

### 4.1 Admin Dashboard (`/admin`)
Designed for CISO, SOC leads, and security platform administrators.
- **Landing Subtitle**: *"Organization security governance and platform health"*
- **Dedicated KPIs**:
  1. *Total Users*: Directory accounts across federated tenant organizations.
  2. *Active Organizations*: Active tenant peer nodes in the alliance.
  3. *CTI Contributions*: Total raw and deduplicated telemetry indicators.
  4. *Pending Validations*: Submissions pending peer review.
  5. *System Health*: Operational status across all 6 platform micro-engines.
  6. *Audit Integrity*: Cryptographic SHA-256 hash-chain verification status.
- **Key Modules & Panels**:
  - **Organization Health Registry**: Trust scores ($T_i$), privacy budget consumption ($\epsilon$), and tenant status.
  - **User & Access Governance**: Account directory, role tier inspection, status activation/deactivation.
  - **Security Governance**: Anomaly monitors, authentication telemetry, and replay attack protection.
  - **Platform Subsystem Health**: Real-time status cards for FastAPI Core, Database, STIX Parser, Differential Privacy, Federated Learning, and Cryptographic Ledger.
  - **Cryptographic Audit & Privacy**: Live hash chain block inspection and budget tracking.

---

### 4.2 Analyst SOC Dashboard (`/analyst`)
Designed for tier-1/tier-2 SOC analysts and cyber threat hunters.
- **Landing Subtitle**: *"Investigate threats, analyze intelligence, and monitor active indicators"*
- **Dedicated KPIs**:
  1. *Active Threats*: Active indicators observed across peer feeds.
  2. *Critical / High Alerts*: Indicators with severity $\ge 7.0$.
  3. *New CTIs*: Unprocessed submissions in the last 24h.
  4. *Average Confidence*: Correlated multi-source certainty ($\bar{c}$).
  5. *Under Investigation*: Active SOC triage cases.
  6. *Suspicious Indicators*: High-anomaly zero-day and beaconing signatures.
- **Main Workflow Layout**:
  - **LEFT**: *Threat Activity Timeline* showing chronologically ordered observed artifacts.
  - **RIGHT**: *Security Posture Breakdown* detailing the severity spectrum and artifact type distribution.
  - **Recent Threat Intelligence Table**: Interactive table with direct `View` and `Investigate` triggers.
  - **Threat Investigation Queue**: Analyst assignment tracking, triage status (`TRIAGED`, `IN_PROGRESS`, `OPEN`).
  - **Threat Relationship Graph**: Live multi-tenant graph pulling from `/api/cti/correlation/graph` mapping `Identity -> Indicator -> Sighting`.

---

### 4.3 Validator Dashboard & Workspace (`/validator`)
Designed for intelligence validation specialists and QA assessors.
- **Landing Subtitle**: *"Review, validate, and assess shared threat intelligence"*
- **Dedicated KPIs**:
  1. *Pending Validation*: Candidate indicators awaiting quality review.
  2. *Validated Today*: Approved items committed to alliance consensus.
  3. *Rejected Today*: False positives and noise filtered out.
  4. *Average CTI Quality*: Time-decayed accuracy score ($\bar{Q}$).
  5. *High-Risk Submissions*: Submissions requiring priority escalation.
  6. *Contributors Under Review*: Organizations undergoing reputation penalty.
- **Dedicated 3-Column Validation Workspace**:
  - **Column 1 (CTI Details)**: Ingested indicator value, type, severity score, confidence, context description, sensor source, and timestamp.
  - **Column 2 (STIX 2.1 Specification)**: Standardized OASIS STIX ID (`indicator--<uuid>`), pattern expression (`[ipv4-addr:value = '...']`), graph relationships, and syntax-highlighted STIX 2.1 JSON bundle.
  - **Column 3 (Validation Decision & Formula)**: Multi-factor quality metrics ($Q_i$, $T_i$, Freshness $\lambda^{\Delta t}$, Anomaly $A_i$, and Contribution Weight $\hat{W}_i$). Decision action triggers: `Approve CTI`, `Reject`, `Flag for Review`, and `Require Evidence`.
- **Contributor Trust & Explainability View**:
  - Full transparency panel explaining the formula: $\hat{W}_i = \frac{T_i \cdot Q_i \cdot (1 - A_i)}{\sum T_j \cdot Q_j \cdot (1 - A_j)}$.

---

### 4.4 Threat Consumer Dashboard (`/intelligence`)
Designed for IT directors, threat consumers, and external partners consuming vetted intelligence.
- **Landing Subtitle**: *"Access relevant, validated cyber threat intelligence"*
- **Dedicated KPIs**:
  1. *Relevant Threats*: Curated threat volume matched to user profile.
  2. *High-Risk Threats*: Priority indicators requiring firewall egress rules.
  3. *New Intelligence*: Fresh validated feeds.
  4. *Trusted Sources*: Verified high-reputation peer contributors.
  5. *Recent Sightings*: Real-world hit counters across partner perimeters.
- **Clean Consumer Experience**:
  - Strictly **removes** internal FL weight vectors, user administration, internal validation triage, and cryptographic ledger debugging.
  - Features **Recommended Intelligence** table with relevance ratings and source attribution.
  - Features **Threat Landscape** charts by industry sector and malicious artifact type.
  - Features **Recent Sightings** feed with mitigation action recommendations.
  - Features **Saved Intelligence Watchlist** allowing consumers to bookmark critical indicators and export custom JSON watchlists.

---

## 5. Role-Specific Navigation & Headers

### Dynamic Sidebar Navigation
The sidebar navigation is generated dynamically from `ROLE_CONFIGS[currentUser.role]`:

```
ADMIN SIDEBAR:
├─ Governance: Overview, Organizations, Users & Roles
├─ Security & Audit: Security Governance, Audit Ledger, Privacy Governance, System Health
└─ System: Settings

ANALYST SIDEBAR:
├─ SOC Operations: Security Operations, CTI Feed, Threat Investigation, Threat Map
├─ Intelligence & Trust: Submit Indicator, Organizations, Trust & Reputation, Security Events
└─ System: Settings

VALIDATOR SIDEBAR:
├─ Validation Center: Validation Center, Validation Queue
├─ Threat Intelligence: CTI Feed, CTI Investigation
├─ Trust & Evidence: Contributor Trust, Quality Analytics, Audit History
└─ System: Settings

THREAT CONSUMER SIDEBAR:
├─ Intelligence Center: Threat Intelligence, CTI Search, Threat Landscape
├─ Threat Discovery: Threat Map, Trusted Sources, Recent Sightings, Saved Watchlist
└─ System: Settings
```

### Role-Specific Header
- ThreatShield brand logo and console badge.
- Semantic breadcrumb reflecting the role's current section (`Governance / Overview`, `SOC Operations / Security Operations`, etc.).
- Global search input with instant matching indicator dropdown.
- Subsystem health status pill.
- Notification modal.
- Active tenant organization name, user email, and **subtle semantic role badge** (`ADMIN`, `ANALYST`, `VALIDATOR`, `THREAT CONSUMER`).
- Zero role-switching dropdowns.

---

## 6. Shared Component Design System

All views share a cohesive, lightweight enterprise design system maintaining product uniformity:

| Component | File Path | Usage & Purpose |
| :--- | :--- | :--- |
| `MetricCard` | `src/components/common/MetricCard.tsx` | Standardized KPI display with trend indicators, icons, and accent tones |
| `StatusBadge` | `src/components/common/StatusBadge.tsx` | Semantic status badges (`ACTIVE`, `PENDING`, `APPROVED`, `REJECTED`, etc.) |
| `SeverityBadge` | `src/components/common/SeverityBadge.tsx` | Color-coded severity badge with numerical score (`Critical`, `High`, `Medium`, `Low`) |
| `TrustScore` | `src/components/common/TrustScore.tsx` | Visual meter and tier rating for organization reputation ($T_i \in [0, 1]$) |
| `QualityScore` | `src/components/common/QualityScore.tsx` | CTI quality score with exponential time-decay indication ($Q_i$) |
| `ValidationWorkspace` | `src/components/common/ValidationWorkspace.tsx` | 3-column dedicated validation interface with STIX 2.1 & quality decision |
| `PageHeader` | `src/components/common/PageHeader.tsx` | Standardized page title, subtitle, breadcrumb, and action slot |
| `ChartCard` | `src/components/common/ChartCard.tsx` | Clean container card for charts and analytical tables |
| `FilterBar` | `src/components/common/FilterBar.tsx` | Filter bar with search, type dropdown, severity dropdown, and reset |
| `ActivityTimeline` | `src/components/common/ActivityTimeline.tsx` | Chronological event stream with iconography and metadata |
| `AccessRestricted` | `src/components/common/AccessRestricted.tsx` | Security fallback component for unauthorized route requests |
| `EmptyState` | `src/components/common/EmptyState.tsx` | Polished empty state with icon, message, and call-to-action |
| `LoadingSkeleton` | `src/components/common/LoadingSkeleton.tsx` | Pulsing skeleton placeholder for cards and tables |
| `ErrorState` | `src/components/common/ErrorState.tsx` | Alert box with retry triggers for failed API queries |

---

## 7. Responsive Behavior

- **Desktop (1920x1080, 1440x900, 1366x768)**: Full multi-column grid layouts, expanded sidebars, and multi-panel charts.
- **Tablet (1024x768, 768x1024)**: Responsive 2-column KPI grids, responsive tables with horizontal scroll containers.
- **Mobile (390x844)**: Responsive mobile navigation drawer toggled via header menu button with smooth slide animation and backdrop overlay.

---

## 8. Verification & Test Results

### 8.1 Automated Linter & Build Results
- `npm run lint` (`oxlint`): **PASSED** (0 warnings, 0 errors across 52 files).
- `npm run build` (`tsc -b && vite build`): **PASSED** (Production bundle generated cleanly in `dist/`).

### 8.2 End-to-End Multi-Role Authentication & Access Verification
Executed automated test runner `node test_role_auth_flow.js`:

```
=== ThreatShield Multi-Role Authentication & Access Verification ===

[*] Testing Role: ADMIN
    [+] Login Success: Received JWT Bearer Token (eyJhbGciOiJIUzI1Ni...)
    [+] CTI Telemetry Stream: HTTP 200 (Authorized)
    [+] Admin Endpoint Protection (/organizations/): HTTP 200 (ADMIN Access Granted)

[*] Testing Role: ANALYST
    [+] Login Success: Received JWT Bearer Token (eyJhbGciOiJIUzI1Ni...)
    [+] CTI Telemetry Stream: HTTP 200 (Authorized)
    [+] Admin Endpoint Protection (/organizations/): HTTP 403 (Correctly Restricted via Backend RBAC)

[*] Testing Role: VALIDATOR
    [+] Login Success: Received JWT Bearer Token (eyJhbGciOiJIUzI1Ni...)
    [+] CTI Telemetry Stream: HTTP 200 (Authorized)
    [+] Admin Endpoint Protection (/organizations/): HTTP 403 (Correctly Restricted via Backend RBAC)

[*] Testing Role: THREAT_CONSUMER
    [+] Login Success: Received JWT Bearer Token (eyJhbGciOiJIUzI1Ni...)
    [+] CTI Telemetry Stream: HTTP 200 (Authorized)
    [+] Admin Endpoint Protection (/organizations/): HTTP 403 (Correctly Restricted via Backend RBAC)

=== Role Verification Complete ===
```

---

## 9. Conclusion

ThreatShield now offers **four genuinely distinct product experiences** while maintaining research integrity, mathematical formula accuracy, and strict backend authorization. Each role immediately perceives and operates within its specialized security domain.
