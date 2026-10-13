# ThreatShield — Formal Mathematical Modeling & Formulations

---

## 1. Notation & Variable Glossary

| Symbol | Definition | Domain |
| :--- | :--- | :--- |
| $Q_i$ | CTI Quality Score for indicator $i$ | $[0.0, 1.0]$ |
| $C_i$ | Confidence level assigned to indicator $i$ | $[0.0, 1.0]$ |
| $F_i$ | Freshness score (exponential time decay) | $(0.0, 1.0]$ |
| $S_i$ | Source reliability (Reputation / Trust of submitter) | $[0.0, 1.0]$ |
| $H_i$ | Historical usefulness / peer feedback ratio | $[0.0, 1.0]$ |
| $R_{ij}$ | Threat Relevance of CTI $i$ to recipient organization $j$ | $[0.0, 1.0]$ |
| $\text{TS}_{ij}$ | Unified ThreatShield Prioritization Score | $[0.0, 1.0]$ |
| $T_k(t)$ | Multi-Factor Reputation / Trust of organization $k$ at time $t$ | $[0.05, 1.00]$ |
| $E_k(t)$ | Current evaluation score of organization $k$'s latest action | $[0.0, 1.0]$ |
| $A_k$ | Anomaly score of client $k$'s model parameter update | $[0.0, 1.0]$ |
| $D_{L2, k}$ | L2 parameter norm deviation from peer median | $[0.0, \infty)$ |
| $\text{Cos}_k$ | Cosine similarity between client gradient and reference direction | $[-1.0, 1.0]$ |
| $W_{client\_trust, k}$ | Raw trust-weighted factor for client $k$ | $[0.0, 1.0]$ |
| $\hat{W}_{client\_trust, k}$ | Normalized aggregation weight for client $k$ | $[0.0, 1.0], \sum \hat{W} = 1.0$ |
| $W_{model\_params, k}$ | Neural network parameter tensor for client $k$ | $\mathbb{R}^D$ |
| $\epsilon$ | Differential privacy budget parameter | $\epsilon > 0$ |
| $\Delta f$ | Global sensitivity of query function $f$ | $\Delta f > 0$ |
| $H_m$ | Cryptographic SHA-256 block hash for ledger block $m$ | $\{0, 1\}^{256}$ |

---

## 2. CTI Quality Formulation

$$Q_i = w_c C_i + w_f F_i + w_s S_i + w_h H_i$$

### Constraints:
$$\sum w = w_c + w_f + w_s + w_h = 1.0, \quad 0 \le Q_i \le 1.0$$
- **Confidence Weight** $w_c = 0.35$
- **Freshness Weight** $w_f = 0.25$
- **Source Trust Weight** $w_s = 0.25$
- **Historical Usefulness Weight** $w_h = 0.15$

### Exponential Time-Decay Freshness:
$$F_i = \exp(-\lambda \cdot \Delta t_{days}), \quad \lambda = 0.05 \implies t_{1/2} \approx 13.86 \text{ days}$$

---

## 3. Threat Relevance Formulation

$$R_{ij} = v_{sev} \text{Sev}_i + v_{sec} \text{SectorRel}_{ij} + v_{sight} \text{Sightings}_{ij} + v_{conf} C_i + v_{fresh} F_i$$

$$\sum v = v_{sev} + v_{sec} + v_{sight} + v_{conf} + v_{fresh} = 1.0$$
- $v_{sev} = 0.30$ (Normalized severity $\text{Sev}_i / 10.0$)
- $v_{sec} = 0.25$ (Sector profile alignment)
- $v_{sight} = 0.15$ (Observed sightings $\min(1.0, \text{Sightings} / 10)$)
- $v_{conf} = 0.15$ (Confidence level $C_i$)
- $v_{fresh} = 0.15$ (Freshness $F_i$)

---

## 4. ThreatShield Combined Decision Score

$$\text{TS}_{ij} = \alpha Q_i + \beta T_{source} + \gamma R_{ij} + \delta F_i$$

$$\alpha + \beta + \gamma + \delta = 1.0, \quad \alpha = 0.35, \; \beta = 0.25, \; \gamma = 0.25, \; \delta = 0.15$$

### Operational Triage Tiers:
- **`CRITICAL_ACTION`**: $\text{TS}_{ij} \ge 0.80$ (Immediate perimeter blocklist push)
- **`HIGH_PRIORITY`**: $0.65 \le \text{TS}_{ij} < 0.80$ (Automated SIEM rule alert)
- **`MEDIUM_PRIORITY`**: $0.45 \le \text{TS}_{ij} < 0.65$ (SOC hunting queue)
- **`LOW_TRIAGE`**: $\text{TS}_{ij} < 0.45$ (Stored for historical correlation)

---

## 5. Multi-Factor Reputation / Trust Model

$$T_k(t) = \lambda T_k(t-1) + (1-\lambda) E_k(t)$$
- Memory parameter $\lambda = 0.85$
- Bounded constraint: $T_k(t) \in [0.05, 1.00]$

### Action Evaluation $E_k(t)$:
$$E_k(t) = \begin{cases} 
1.0 & \text{Validated CTI, True-Positive Sighting, Legitimate FL Update} \\
0.3 & \text{Unconfirmed Telemetry, Sub-optimal Convergence} \\
0.0 & \text{False-Positive Sighting, Gradient Poisoning Anomaly, Replay Attempt}
\end{cases}$$

---

## 6. Trust-Weighted Federated Learning Formulation

### 6.1 Multi-Signal Anomaly Metric
$$D_{L2, k} = \frac{| ||\Delta W_{model, k}||_2 - \text{median}(||\Delta W_{model}||_2) |}{\text{median}(||\Delta W_{model}||_2) + \epsilon}$$

$$\text{Cos}_k = \frac{\Delta W_{model, k} \cdot \Delta W_{ref}}{||\Delta W_{model, k}||_2 ||\Delta W_{ref}||_2}$$

$$A_k = \text{clip}\left( 0.5 \min(1.0, D_{L2, k}) + 0.5 \max(0.0, 1.0 - \max(0.0, \text{Cos}_k)), \; 0.0, \; 1.0 \right)$$

### 6.2 Client Trust Weight Computation
$$W_{client\_trust, k} = T_k \cdot Q_k \cdot (1 - A_k)$$

$$\hat{W}_{client\_trust, k} = \frac{W_{client\_trust, k}}{\sum_{j=1}^K W_{client\_trust, j}}, \quad \sum_{k=1}^K \hat{W}_{client\_trust, k} = 1.0$$

### 6.3 Global Model Aggregation
$$W_{global\_model\_params} = \sum_{k=1}^K \hat{W}_{client\_trust, k} \cdot W_{client\_model\_params, k}$$

---

## 7. Differential Privacy Laplace Mechanism

$$M(D) = f(D) + \text{Laplace}\left(0, \frac{\Delta f}{\epsilon}\right)$$
- Probability Density Function: $p(x) = \frac{1}{2b} \exp\left(-\frac{|x|}{b}\right)$ where $b = \frac{\Delta f}{\epsilon}$
- Variance: $\sigma^2 = 2b^2 = 2\left(\frac{\Delta f}{\epsilon}\right)^2$
- Strict budget condition: $\epsilon_{remaining} \ge \epsilon_{query}$, blocked with HTTP 403 when $\epsilon_{remaining} \le 0$.

---

## 8. Cryptographic Hash-Chain Verification

$$H_m = \text{SHA256}\left( H_{m-1} \parallel \text{CanonicalJSON}(\text{Payload}_m) \parallel \text{ISO8601}(\text{Timestamp}_m) \right)$$
- Genesis Block: $H_0 = 0^{64}$
- Deterministic integrity invariant: For all $m \in [1, M]$, $H_m == \text{SHA256}(H_{m-1} \parallel \dots)$. Any modification to block $k < M$ invalidates all subsequent block hashes $H_k, \dots, H_M$.
