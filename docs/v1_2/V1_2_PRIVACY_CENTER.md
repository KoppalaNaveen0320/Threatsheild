# ThreatShield v1.2 — Differential Privacy Accounting & Utility Guide

## Overview

ThreatShield v1.2 enforces $(\epsilon, 0)$-Differential Privacy for statistical queries and threat intelligence aggregation across federated organizations using the classical calibrated Laplace Mechanism.

---

## 1. Laplace Mechanism Formulation

For a statistical query $f: \mathcal{D} \to \mathbb{R}^d$ with global $\ell_1$-sensitivity $\Delta f = \max \|f(D) - f(D')\|_1$, the mechanism releases:

$$\mathcal{M}(D) = f(D) + \text{Lap}\left(0, \frac{\Delta f}{\epsilon}\right)$$

where $\text{Lap}(0, b)$ has probability density function $p(x) = \frac{1}{2b} \exp\left(-\frac{|x|}{b}\right)$ with scale parameter $b = \frac{\Delta f}{\epsilon}$.

---

## 2. Empirical Privacy-Utility Frontier

Recorded from benchmark experiments on statistical alliance frequency queries ($N = 1000$, $\Delta f = 1.0$):

| Privacy Budget ($\epsilon$) | Noise Scale ($b = 1/\epsilon$) | Empirical MAE | Relative Error (%) | Privacy Regime |
|---|---|---|---|---|
| 0.1 | 10.000 | 9.842 | 6.56% | Strict Anonymity |
| 0.2 | 5.000 | 5.120 | 3.41% | High Privacy |
| 0.5 | 2.000 | 1.985 | 1.32% | Balanced Protection |
| 1.0 | 1.000 | 0.998 | 0.67% | Standard Enterprise |
| 2.0 | 0.500 | 0.495 | 0.33% | Low Noise Utility |
| 5.0 | 0.200 | 0.201 | 0.13% | High Utility |
| 10.0 | 0.100 | 0.098 | 0.07% | Minimal Distortion |

---

## 3. Dynamic Budget Allocation & Depletion

- Each organization is initialized with an administrator-configured privacy budget $\mathcal{B}_{total}$ (default: $\epsilon = 10.0$).
- When executing statistical analytics queries with cost $\epsilon_q$, the available budget is decremented: $\mathcal{B}_{avail} \gets \mathcal{B}_{avail} - \epsilon_q$.
- If $\mathcal{B}_{avail} < \epsilon_q$, query execution is rejected with HTTP 403 (*Privacy budget exhausted*).
- All budget consumption events are immutably recorded to the Cryptographic Audit Hash-Chain.
