# ThreatShield — Differential Privacy & Cryptographic Privacy Model

---

## 1. Separation of Privacy Disciplines

ThreatShield maintains a strict, mathematically sound distinction between three complementary privacy technologies:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              THREE PRIVACY DISCIPLINES                                 │
├────────────────────────────┬────────────────────────────┬──────────────────────────────┤
│ 1. AES-256-GCM Encryption  │ 2. Laplace Differential    │ 3. Federated Learning        │
│                            │    Privacy (DP)            │                              │
├────────────────────────────┼────────────────────────────┼──────────────────────────────┤
│ • Protects data-at-rest    │ • Protects analytical      │ • Eliminates centralized     │
│   and sensitive payloads   │   queries & aggregations   │   raw telemetry storage      │
│ • Authenticated cipher     │ • Bounded privacy budget   │ • Shares parameter gradients │
│   with unique 96-bit nonce │   (epsilon parameter)      │   instead of private data    │
│ • Perfect confidentiality  │ • Formal noise addition:   │ • Combined with Secure       │
│   (no statistical leakage) │   Lap(Delta f / epsilon)   │   Aggregation Prototype      │
└────────────────────────────┴────────────────────────────┴──────────────────────────────┘
```

---

## 2. Laplace Mechanism & Budget Accounting

### Formulation
For any numerical analytical query $f: \mathcal{D} \to \mathbb{R}$ with global $L_1$ sensitivity $\Delta f$:
$$M(D) = f(D) + \text{Laplace}\left(0, \frac{\Delta f}{\epsilon}\right)$$
where $\Delta f = \max \|f(D_1) - f(D_2)\|_1$ for neighboring datasets differing by one record.

### Per-Organization Privacy Accounting
- **Initial Budget**: $\epsilon_{total} = 10.0$ per organization.
- **Consumption**: Each statistical query deducts $\epsilon_{cost}$ (e.g. $0.5 \epsilon$).
- **Strict Enforcement**: If $\epsilon_{remaining} < \epsilon_{cost}$, the query is blocked with HTTP 403 Forbidden.

---

## 3. Empirical Privacy vs. Utility Tradeoff

Using empirical results from `results/privacy_utility.csv` on 500 query evaluations ($\Delta f = 1.0$, ground truth = 142.0):

| Epsilon ($\epsilon$) | Theoretical Scale ($b$) | Theoretical Std ($\sigma$) | Empirical MAE | Empirical RMSE | Privacy Guarantee |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`0.1`** | `10.0000` | `14.1421` | `10.4281` | `14.8210` | **VERY STRONG** (High Noise) |
| **`0.5`** | `2.0000` | `2.8284` | `2.0612` | `2.8794` | **STRONG** |
| **`1.0`** | `1.0000` | `1.4142` | `0.9841` | `1.3820` | **BALANCED** (Standard Research Baseline) |
| **`2.0`** | `0.5000` | `0.7071` | `0.5120` | `0.7218` | **MODERATE** |
| **`5.0`** | `0.2000` | `0.2828` | `0.1984` | `0.2791` | **RELAXED** |
| **`10.0`** | `0.1000` | `0.1414` | `0.0991` | `0.1398` | **MINIMAL NOISE** (High Utility) |

### Key Takeaways:
- As $\epsilon \to 0.1$, privacy guarantees are maximal ($MAE \approx 10.4$), obscuring exact sighting counts from adversarial inference.
- At $\epsilon = 1.0$, the empirical error ($MAE \approx 0.98$) provides actionable collaborative intelligence while provably bounding single-record differential privacy leakage.
