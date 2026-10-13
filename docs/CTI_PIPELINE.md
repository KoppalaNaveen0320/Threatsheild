# ThreatShield — End-to-End CTI Ingestion & Intelligence Pipeline

---

## 1. End-to-End Pipeline Workflow

```
[ Local Security Sensor / SIEM ]
                 │
                 ▼ (Raw Telemetry)
┌─────────────────────────────────────────────────────────┐
│ 1. INGESTION & NORMALIZATION                            │
│    • Validate IPv4, IPv6, Domain, URL, Hash, Email      │
│    • Strip extraneous schemes, whitespace & casing      │
│    • Classification: NORMALIZED, INVALID, SUSPICIOUS    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ 2. REPLAY & NONCE VERIFICATION                          │
│    • Check timestamp drift within +/- 300s window       │
│    • Verify payload SHA-256 digest & unique nonce       │
│    • Reject replayed submissions (HTTP 409 Conflict)    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ 3. OASIS STIX 2.1 MAPPING                               │
│    • Construct Indicator SDO (spec_version 2.1)         │
│    • Link to Submitting Identity (Organization)         │
│    • Generate SROs (submits, indicates, sighted-by)     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ 4. MATHEMATICAL CTI QUALITY COMPUTATION                 │
│    • Q_i = 0.35 C_i + 0.25 F_i + 0.25 S_i + 0.15 H_i    │
│    • Exponential Freshness Decay: F_i = exp(-0.05 dt)   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ 5. RELEVANCE & THREATSHIELD DECISION SCORING            │
│    • R_ij: Target sector alignment & active sightings   │
│    • TS_ij: Combined triage score (Priority Tiers)      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ 6. CRYPTOGRAPHIC AUDIT LEDGER BLOCK APPEND              │
│    • Block m: SHA256( H_{m-1} || CanonicalPayload )     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ 7. COLLABORATIVE SHARING & CLOSED FEEDBACK LOOP         │
│    • Peer sighting feedback: USEFUL / FALSE_POSITIVE    │
│    • Update CTI quality & Submitter Reputation T_i      │
│    • Update Future FL Aggregation Weights \hat{W}_i     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Ingestion Normalization Rules

| Indicator Type | Input Example | Normalized Output | Applied Rule |
| :--- | :--- | :--- | :--- |
| **`ipv4-addr`** | `  198.51.100.45  ` | `198.51.100.45` | `ipaddress.IPv4Address` validation & canonical string |
| **`ipv6-addr`** | `2001:0db8:0000:0000:0000:ff00:0042:8329` | `2001:db8::ff00:42:8329` | RFC 5952 zero-compression & lowercase |
| **`domain-name`** | `  HTTPS://Evil-C2-Domain.COM/path  ` | `evil-c2-domain.com` | Scheme/path stripping, lowercase & TLD check |
| **`file-hash`** | `SHA256:E3B0C44298...` | `e3b0c44298...` | Prefix stripping, lowercase & 64/40/32 hex validation |
| **`url`** | `HTTP://Malicious.RU:8080/drop.exe` | `http://malicious.ru:8080/drop.exe` | URL parsing, lowercase host & standardized path |
| **`email-addr`** | `Phisher@Malware-Domain.NET` | `phisher@malware-domain.net` | RFC 5322 regex validation & lowercase |

---

## 3. Closed-Loop CTI Feedback Cycle

1. **Submission**: Submitting Organization ($Org_A$) ingests CTI $i$. Initial status is `NEW` and Quality $Q_i$ is computed.
2. **Dissemination**: Peer Organization ($Org_B$) queries the intelligence hub and receives $i$ ranked by $\text{TS}_{iB}$.
3. **Observation & Sighting**: $Org_B$ encounters $i$ in active telemetry and submits feedback (`CONFIRMED_MALICIOUS` / `USEFUL`).
4. **Reputation Update**: Feedback updates $Q_i$ and triggers trust engine update:
   $$T_A(t) = 0.85 T_A(t-1) + 0.15 \cdot 1.0$$
5. **Federated Learning Weight Update**: In the subsequent FL round, $Org_A$'s contribution weight increases:
   $$W_{client\_trust, A} = T_A \cdot Q_A \cdot (1 - A_A)$$
