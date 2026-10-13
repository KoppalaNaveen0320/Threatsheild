"""
ThreatShield Federated Learning Experiment Configuration
Centralized configuration parameters for reproducible empirical validation.
"""

# Random seeds for multi-seed validation
SEEDS = [42, 123, 456, 789, 2024]

# Dirichlet Non-IID Partitioning
DIRICHLET_ALPHA = 0.3
NUM_CLIENTS = 2
CLIENT_FEATURE_SHIFT = 0.5  # Domain feature shift on Org B

# Synthetic Intrusion Detection Dataset Parameters (CIC-IDS2017 Schema)
NUM_SAMPLES = 1000
NUM_FEATURES = 78
NUM_INFORMATIVE = 20
NUM_CLASSES = 2
TRAIN_TEST_SPLIT_RATIO = 0.8

# Edge Neural Network & Local Training
INPUT_DIM = 78
HIDDEN_DIM_1 = 64
HIDDEN_DIM_2 = 32
OUTPUT_DIM = 2
LOCAL_EPOCHS = 5
BATCH_SIZE = 32
LEARNING_RATE = 0.001

# Poisoning Benchmark Perturbation Rates
POISONING_RATES = [0.10, 0.20, 0.30, 0.40]

# Strategy Constants
DEFAULT_TRUST_SCORE = 0.50
DEFAULT_QUALITY_SCORE = 1.00
EPSILON_DENOMINATOR = 1e-9
