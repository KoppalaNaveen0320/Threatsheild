# THREATSHIELD — RESEARCH REPRODUCIBILITY GUIDE

**Classification**: Empirical Validation Specification  
**Version**: `v1.0 — Research Prototype`  
**Date**: August 2026

---

## 1. Environment & Prerequisites

To ensure independent academic verification, ThreatShield experiments are fully deterministic and parameterized through a single centralized configuration file (`fl/config.py`).

### Runtime Specifications
- **Operating System**: Windows / Linux / macOS
- **Python Version**: `3.10.x` or `3.11.x`
- **Node.js**: `>= 18.x` (Frontend development/testing)
- **Key Python Packages**:
  - `torch >= 2.0.0`
  - `flwr >= 1.15.0`
  - `scikit-learn >= 1.3.0`
  - `numpy >= 1.24.0`
  - `fastapi >= 0.100.0`
  - `stix2 >= 3.0.0`
  - `cryptography >= 41.0.0`
  - `pytest >= 7.4.0`

---

## 2. Centralized Experiment Parameters (`fl/config.py`)

All multi-seed validation runs utilize the following frozen hyperparameters:

```python
SEEDS = [42, 123, 456, 789, 2024]
DIRICHLET_ALPHA = 0.3
NUM_CLIENTS = 2
CLIENT_FEATURE_SHIFT = 0.5

NUM_SAMPLES = 1000
NUM_FEATURES = 78
NUM_INFORMATIVE = 20
NUM_CLASSES = 2
TRAIN_TEST_SPLIT_RATIO = 0.8

INPUT_DIM = 78
HIDDEN_DIM_1 = 64
HIDDEN_DIM_2 = 32
OUTPUT_DIM = 2
LOCAL_EPOCHS = 5
BATCH_SIZE = 32
LEARNING_RATE = 0.001

POISONING_RATES = [0.10, 0.20, 0.30, 0.40]
```

---

## 3. Step-by-Step Reproduction Instructions

### Step 1: Clone Repository & Set Environment
```bash
git clone <repository_url>
cd ThreatShield
```

### Step 2: Install Python Dependencies
```bash
pip install -r backend/requirements.txt
pip install flwr torch scikit-learn numpy pytest stix2
```

### Step 3: Run Research Validation Suite
Execute the dedicated reproducibility script:
```powershell
python scripts/run_research_experiments.py
```
Or execute the multi-seed validation harness:
```powershell
python run_rigorous_validation.py
```

### Expected Output Summary
The script will output exact deterministic metrics matching `docs/RESEARCH_RESULTS.md`:
- **Clean Local Model (Org A)**: $0.7660 \pm 0.1904$ Accuracy | $0.6974 \pm 0.2722$ Macro F1
- **Clean Standard FedAvg**: $0.6410 \pm 0.1694$ Accuracy | $0.5446 \pm 0.2440$ Macro F1
- **Clean Trust-Weighted FedAvg**: $0.6410 \pm 0.1590$ Accuracy | $0.5492 \pm 0.2309$ Macro F1
- **Poisoning Benchmarks (10% to 40%)**: Trust-Weighted accuracy maintains $\approx 0.7670$, while adversarial contribution weight is suppressed by $99.38\%$ to $99.91\%$.

### Step 4: Run Automated Regression Test Suite
```powershell
$env:PYTHONPATH='d:\ThreatShield\backend;d:\ThreatShield'
python -m pytest backend/tests/ -v
```
**Expected Result**: `20 passed in ~8s (100% PASS)`
