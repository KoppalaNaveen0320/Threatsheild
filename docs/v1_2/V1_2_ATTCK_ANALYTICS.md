# ThreatShield v1.2 — MITRE ATT&CK® Enterprise Analytics Guide

## Overview

ThreatShield v1.2 integrates MITRE ATT&CK Enterprise Matrix mapping directly into threat intelligence analysis, distinguishing between directly observed sensor telemetry and graph-inferred adversary techniques.

---

## 1. Enterprise Tactic Coverage Matrix

The platform models all 14 core enterprise tactics:
1. **Initial Access** (e.g., `T1190` Exploit Public-Facing Application, `T1566` Phishing)
2. **Execution** (e.g., `T1059` Command and Scripting Interpreter)
3. **Persistence** (e.g., `T1547` Boot or Logon Autostart Execution)
4. **Privilege Escalation** (e.g., `T1068` Exploitation for Privilege Escalation)
5. **Defense Evasion** (e.g., `T1027` Obfuscated/Encrypted Files, `T1070` Indicator Removal)
6. **Credential Access** (e.g., `T1003` OS Credential Dumping, `T1110` Brute Force)
7. **Discovery** (e.g., `T1082` System Information Discovery)
8. **Lateral Movement** (e.g., `T1021` Remote Services)
9. **Collection** (e.g., `T1114` Email Collection)
10. **Command and Control** (e.g., `T1071` Application Layer Protocol, `T1573` Encrypted Channel)
11. **Exfiltration** (e.g., `T1041` Exfiltration Over C2 Channel)
12. **Impact** (e.g., `T1486` Data Encrypted for Impact)

---

## 2. Observed vs. Inferred Analytics

- **Directly Observed Techniques:** Explicitly extracted from corroborated STIX indicator objects, malware samples, or incident forensics.
- **Graph-Inferred Techniques:** Derived from 2-hop threat actor attribution patterns and campaign behavioral profiles in the Knowledge Graph.

Analysts can filter the matrix by tactic, adversary actor, and confidence threshold to prioritize detection engineering efforts.
