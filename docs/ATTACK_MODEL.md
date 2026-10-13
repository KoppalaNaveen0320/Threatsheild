# ThreatShield — Adversarial Attack Simulations & Threat Taxonomy

---

## 1. Attack Matrix & Threat Taxonomy

ThreatShield implements controlled, measurable benchmark simulations for eight distinct attack vectors across collaborative cyber defense:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                ADVERSARIAL ATTACK TAXONOMY                              │
├──────────────────┬──────────────────────┬────────────────────────┬───────────────────────┤
│ Attack Vector    │ Target Component     │ Adversarial Mechanism  │ Defense Mechanism     │
├──────────────────┼──────────────────────┼────────────────────────┼───────────────────────┤
│ 1. Parameter     │ Federated Learning   │ Gaussian Noise         │ L2 Norm Divergence +  │
│    Poisoning     │ Global Model         │ Perturbation           │ Trust Weight Discount │
├──────────────────┼──────────────────────┼────────────────────────┼───────────────────────┤
│ 2. Gradient Sign │ Federated Learning   │ Inverts gradient       │ Cosine Similarity     │
│    Flip Attack   │ Optimization Path    │ direction (-1.5 Delta) │ Check (Cos < 0)       │
├──────────────────┼──────────────────────┼────────────────────────┼───────────────────────┤
│ 3. Parameter     │ Federated Learning   │ Multiplies gradient by │ Magnitude Check +     │
│    Scaling       │ Aggregation Mean     │ scale (x10.0)          │ L2 Norm Discard       │
├──────────────────┼──────────────────────┼────────────────────────┼───────────────────────┤
│ 4. Label         │ Local Training Set   │ Flips Malicious (1)    │ Trust-Weighted Loss   │
│    Flipping      │ Classification Loss  │ to Benign (0)          │ Validation            │
├──────────────────┼──────────────────────┼────────────────────────┼───────────────────────┤
│ 5. Replay        │ API & Ledger Events  │ Resends stale signed   │ Nonce Cache + +/-300s │
│    Attack        │ CTI Telemetry        │ event payloads         │ Drift Verification    │
├──────────────────┼──────────────────────┼────────────────────────┼───────────────────────┤
│ 6. Fake / Spam   │ Intelligence Hub     │ Injects syntactically  │ Peer Sighting Quality │
│    CTI Injection │ CTI Quality Feed     │ random IOC entries     │ Decay + Low Trust     │
├──────────────────┼──────────────────────┼────────────────────────┼───────────────────────┤
│ 7. Duplicate CTI │ Storage & Ingestion  │ Floods duplicate       │ Ingestion Hash Check  │
│    Flooding      │ Pipeline             │ indicator values       │ (Status: DUPLICATE)   │
├──────────────────┼──────────────────────┼────────────────────────┼───────────────────────┤
│ 8. Sybil /       │ Federated Strategy   │ Multiple colluding     │ Peer Clustering +     │
│    Collusion     │ Aggregation Weights  │ accounts with jitter   │ Reputation History    │
└──────────────────┴──────────────────────┴────────────────────────┴───────────────────────┘
```

---

## 2. Attack Descriptions & Evaluation Criteria

### 2.1 Parameter Poisoning Attack
- **Configuration**: Zero-mean Gaussian perturbation $\mathcal{N}(0, \sigma^2)$ injected into parameter tensors, where $\sigma = 3.5 \times \text{PoisoningRate}$.
- **Measured Result**: Trust-Weighted FedAvg reduces malicious client weight from $50\%$ down to $0.2\%$, achieving **99.8% malicious influence reduction**.

### 2.2 Gradient Sign Flip Attack
- **Configuration**: Malicious client calculates clean gradient $\Delta W = W_{clean} - W_{init}$ and transmits flipped gradient $\Delta W_{mal} = -1.5 \Delta W$.
- **Detection**: Cosine similarity $\cos(\Delta W_{mal}, \Delta W_{ref}) < 0$ flags a critical directional anomaly ($A_i \ge 0.85$), reducing client weight to near-zero.

### 2.3 Replay Attack
- **Configuration**: Adversary captures a valid past CTI submission payload and resends it after timestamp expiration or duplicates the event signature.
- **Detection**: `ReplayProtectionEngine` checks timestamp window drift ($\pm 300$s) and cached SHA-256 digests. Replayed requests return HTTP 409 Conflict.

### 2.4 Cryptographic Ledger Tampering
- **Configuration**: Adversary alters a historical block's payload hash, previous hash, timestamp, or event type directly in persistent storage.
- **Detection**: `verify_ledger()` traverses the SHA-256 chain $H_i = \text{SHA256}(H_{i-1} \parallel \dots)$ and immediately flags chain breakage at the tampered block index.
