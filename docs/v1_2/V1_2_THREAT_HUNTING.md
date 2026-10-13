# ThreatShield v1.2 — Threat Hunting & Knowledge Graph Manual

## Overview

The ThreatShield v1.2 Threat Hunting Workspace enables proactive adversary tracking across 17 graph entity types, MITRE ATT&CK enterprise techniques, and cross-organization telemetry sightings.

---

## 1. Supported Entity Types & Schema

| Entity Category | STIX / Domain Type | Node Visual Token |
|---|---|---|
| Adversary | `threat-actor` | Red Hexagon / Shield |
| Malware | `malware`, `tool` | Orange Octagon / Bug |
| Indicator | `ipv4-addr`, `domain-name`, `file-hash` | Blue Circle / Crosshair |
| Vulnerability | `cve` | Purple Diamond / Alert |
| Infrastructure | `attack-pattern`, `course-of-action` | Indigo Square / Terminal |
| Asset & Identity | `identity`, `organization` | Green Circle / Building |
| Operational | `incident`, `security-alert` | Rose Octagon / Warning |

---

## 2. Graph Algorithms & Analysis

### Power-Iteration PageRank
Computes global influence across the threat web:
$$PR(u) = \frac{1 - d}{N} + d \sum_{v \in \mathcal{N}_{in}(u)} \frac{PR(v)}{|\mathcal{N}_{out}(v)|}$$
with damping factor $d = 0.85$ and convergence tolerance $\epsilon = 10^{-6}$. Nodes with high PageRank represent central threat hubs (e.g. widely reused C2 infrastructure or common CVE exploitation pivots).

### Shortest Threat Path Traversal (BFS)
Computes the minimal multi-hop adversary attack path between any two graph entities:
- **Example Query:** From Threat Actor `APT29` to Defended Asset `Core Financial Database`.
- **Generated Traversal:**
  $$\text{APT29} \xrightarrow{\text{USES}} \text{Cobalt Strike} \xrightarrow{\text{INDICATES}} \text{198.51.100.188} \xrightarrow{\text{EXPLOITS}} \text{CVE-2024-3400} \xrightarrow{\text{TARGETS}} \text{Core Assets}$$

---

## 3. Multi-Pivot Search Workflow

1. Navigate to the **Threat Hunting** view (`Ctrl + K` $\to$ `Threat Hunting Workspace`).
2. Enter search query (e.g., `APT29`, `CVE-2024-3400`, `Cobalt Strike`).
3. Examine correlated indicators, active incidents, and ATT&CK mappings.
4. Click **Pivot to Graph** to visualize 2-hop neighborhood expansion.
5. Identify unmitigated adversary persistence techniques.
