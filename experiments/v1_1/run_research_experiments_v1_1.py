import os
import sys
import json
import csv
import math
import time
import copy
import numpy as np
import torch
import torch.nn as nn
import torch.utils.data as data_utils
from sklearn.datasets import make_classification
from sklearn.metrics import accuracy_score, f1_score
from collections import OrderedDict
from datetime import datetime
from typing import Tuple, List, Dict, Any, Optional

# Path setup
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))

from fl.models.net import IntrusionDetectionNet
from fl.server.strategy import TrustWeightedFedAvg, CoordinateMedianFedAvg, TrimmedMeanFedAvg
from fl.server.secure_aggregation import SecureAggregationPrototype
from fl.simulation.attacks import AdversarialAttackSimulator
from app.privacy.engine import apply_laplace_noise

SEEDS = [42, 123, 456, 789, 2024]
POISON_RATES = [0.10, 0.20, 0.30, 0.40]
NUM_CLIENTS = 5
DIRICHLET_ALPHA = 0.3
N_FEATURES = 78
N_SAMPLES_TOTAL = 2500
TEST_RATIO = 0.20
RESULTS_V1_1_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'results', 'v1_1')

os.makedirs(RESULTS_V1_1_DIR, exist_ok=True)

def generate_multi_client_non_iid_data(seed: int, num_clients: int = NUM_CLIENTS, alpha: float = DIRICHLET_ALPHA):
    """
    Generates a 5-client Dirichlet non-IID partitioned dataset (alpha=0.3)
    with a strictly held-out global test set (never used in training).
    """
    np.random.seed(seed)
    torch.manual_seed(seed)

    X, y = make_classification(
        n_samples=N_SAMPLES_TOTAL,
        n_features=N_FEATURES,
        n_informative=24,
        n_redundant=10,
        n_classes=2,
        random_state=seed,
        flip_y=0.02
    )

    # 1. Split strictly held-out Global Test Set (20% = 500 samples)
    n_test = int(N_SAMPLES_TOTAL * TEST_RATIO)
    indices = np.arange(N_SAMPLES_TOTAL)
    np.random.shuffle(indices)
    
    test_idx = indices[:n_test]
    train_idx = indices[n_test:]

    X_train, y_train = X[train_idx], y[train_idx]
    X_test, y_test = X[test_idx], y[test_idx]

    feat_test = torch.tensor(X_test, dtype=torch.float32)
    lab_test = torch.tensor(y_test, dtype=torch.long)
    global_test_ds = data_utils.TensorDataset(feat_test, lab_test)
    global_test_loader = data_utils.DataLoader(global_test_ds, batch_size=32, shuffle=False)

    # 2. Partition training data across K clients using Dirichlet distribution
    idx_c0 = np.where(y_train == 0)[0]
    idx_c1 = np.where(y_train == 1)[0]
    np.random.shuffle(idx_c0)
    np.random.shuffle(idx_c1)

    min_per_client = 15
    reserved_c0 = min_per_client * num_clients
    reserved_c1 = min_per_client * num_clients

    c0_free = idx_c0[reserved_c0:]
    c1_free = idx_c1[reserved_c1:]

    prop_c0 = np.random.dirichlet([alpha] * num_clients)
    prop_c1 = np.random.dirichlet([alpha] * num_clients)

    client_train_loaders = []
    client_stats = []

    c0_splits = (np.cumsum(prop_c0) * len(c0_free)).astype(int)
    c1_splits = (np.cumsum(prop_c1) * len(c1_free)).astype(int)

    c0_start = 0
    c1_start = 0

    for k in range(num_clients):
        c0_end = c0_splits[k] if k < num_clients - 1 else len(c0_free)
        c1_end = c1_splits[k] if k < num_clients - 1 else len(c1_free)

        k_res_c0 = idx_c0[k * min_per_client : (k + 1) * min_per_client]
        k_res_c1 = idx_c1[k * min_per_client : (k + 1) * min_per_client]

        k_free_c0 = c0_free[c0_start:c0_end]
        k_free_c1 = c1_free[c1_start:c1_end]

        c0_start = c0_end
        c1_start = c1_end

        k_idx = np.concatenate([k_res_c0, k_res_c1, k_free_c0, k_free_c1])
        np.random.shuffle(k_idx)

        X_k, y_k = X_train[k_idx], y_train[k_idx]
        feat_k = torch.tensor(X_k, dtype=torch.float32)
        lab_k = torch.tensor(y_k, dtype=torch.long)
        ds_k = data_utils.TensorDataset(feat_k, lab_k)
        loader_k = data_utils.DataLoader(ds_k, batch_size=32, shuffle=True)

        client_train_loaders.append(loader_k)
        client_stats.append({
            "client_id": f"org_{k+1}",
            "sample_count": len(k_idx),
            "class_0": len(k_res_c0) + len(k_free_c0),
            "class_1": len(k_res_c1) + len(k_free_c1)
        })

    return client_train_loaders, global_test_loader, (X_train, y_train), client_stats

def evaluate_model(model: nn.Module, loader: data_utils.DataLoader) -> Tuple[float, float]:
    model.eval()
    y_true, y_pred = [], []
    with torch.no_grad():
        for data, target in loader:
            output = model(data)
            preds = output.argmax(dim=1).cpu().numpy()
            y_pred.extend(preds)
            y_true.extend(target.cpu().numpy())
    acc = accuracy_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred, average='macro', zero_division=0)
    return float(acc), float(f1)

def train_local_client(train_loader: data_utils.DataLoader, epochs: int = 5, seed: int = 42) -> Tuple[List[np.ndarray], List[np.ndarray]]:
    torch.manual_seed(seed)
    model = IntrusionDetectionNet(input_dim=N_FEATURES)
    initial_weights = [p.detach().cpu().numpy().copy() for p in model.parameters()]
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.CrossEntropyLoss()

    model.train()
    for _ in range(epochs):
        for data, target in train_loader:
            optimizer.zero_grad()
            out = model(data)
            loss = criterion(out, target)
            loss.backward()
            optimizer.step()

    trained_weights = [p.detach().cpu().numpy() for p in model.parameters()]
    return trained_weights, initial_weights

# Aggregation Functions
def aggregate_fedavg(client_weights: List[List[np.ndarray]]) -> List[np.ndarray]:
    K = len(client_weights)
    num_layers = len(client_weights[0])
    w = 1.0 / K
    return [sum(client_weights[k][l] * w for k in range(K)) for l in range(num_layers)]

def aggregate_coord_median(client_weights: List[List[np.ndarray]]) -> List[np.ndarray]:
    K = len(client_weights)
    num_layers = len(client_weights[0])
    aggregated = []
    for l in range(num_layers):
        stacked = np.stack([client_weights[k][l] for k in range(K)], axis=0)
        aggregated.append(np.median(stacked, axis=0).astype(client_weights[0][l].dtype))
    return aggregated

def aggregate_trimmed_mean(client_weights: List[List[np.ndarray]], beta: float = 0.20) -> List[np.ndarray]:
    K = len(client_weights)
    trim_count = int(beta * K)
    num_layers = len(client_weights[0])
    aggregated = []
    for l in range(num_layers):
        stacked = np.stack([client_weights[k][l] for k in range(K)], axis=0)
        if 2 * trim_count >= K or trim_count == 0:
            mean_l = np.mean(stacked, axis=0)
        else:
            sorted_s = np.sort(stacked, axis=0)
            mean_l = np.mean(sorted_s[trim_count : K - trim_count], axis=0)
        aggregated.append(mean_l.astype(client_weights[0][l].dtype))
    return aggregated

def aggregate_trust_weighted(
    client_weights: List[List[np.ndarray]],
    trust_scores: List[float],
    quality_scores: List[float]
) -> Tuple[List[np.ndarray], List[float], List[float]]:
    K = len(client_weights)
    num_layers = len(client_weights[0])

    flat_vecs = [np.concatenate([p.flatten() for p in params]) for params in client_weights]
    norms = [np.linalg.norm(v) for v in flat_vecs]
    median_norm = float(np.median(norms))
    mean_ref_vec = np.mean(flat_vecs, axis=0)

    weights = []
    anomalies = []

    for k in range(K):
        l2_dev = abs(norms[k] - median_norm) / (median_norm + 1e-9)
        norm_anom = min(1.0, l2_dev)

        cos_sim = np.dot(flat_vecs[k], mean_ref_vec) / (norms[k] * np.linalg.norm(mean_ref_vec) + 1e-9)
        cos_anom = max(0.0, 1.0 - max(0.0, float(cos_sim)))

        anom_k = min(1.0, max(0.0, 0.5 * norm_anom + 0.5 * cos_anom))
        anomalies.append(anom_k)

        w_raw = trust_scores[k] * quality_scores[k] * max(0.0001, 1.0 - anom_k)
        weights.append(w_raw)

    tot_w = sum(weights)
    norm_w = [w / tot_w for w in weights]

    aggregated = [sum(client_weights[k][l] * norm_w[k] for k in range(K)) for l in range(num_layers)]
    return aggregated, norm_w, anomalies

def run_v1_1_experiments():
    print("=" * 80)
    print("THREATSHIELD v1.1 — ADVANCED RESEARCH EVALUATION & MULTI-AGGREGATOR BENCHMARK")
    print(f"Seeds: {SEEDS} | Clients: {NUM_CLIENTS} | Non-IID Dirichlet Alpha: {DIRICHLET_ALPHA}")
    print(f"Results Directory: {RESULTS_V1_1_DIR}")
    print("=" * 80)

    agg_comparison_rows = []
    attack_rows = []
    dp_rows = []

    for seed in SEEDS:
        client_loaders, global_test_loader, (X_tr_all, y_tr_all), client_stats = generate_multi_client_non_iid_data(seed)

        # Train local clients
        client_trained_weights = []
        client_initial_weights = []
        for k in range(NUM_CLIENTS):
            tr_w, init_w = train_local_client(client_loaders[k], epochs=5, seed=seed + k * 10)
            client_trained_weights.append(tr_w)
            client_initial_weights.append(init_w)

        # 1. Clean Multi-Aggregator Baseline Comparison
        t0 = time.perf_counter()
        w_fedavg = aggregate_fedavg(client_trained_weights)
        t_fedavg = (time.perf_counter() - t0) * 1000

        t0 = time.perf_counter()
        w_median = aggregate_coord_median(client_trained_weights)
        t_median = (time.perf_counter() - t0) * 1000

        t0 = time.perf_counter()
        w_trimmed = aggregate_trimmed_mean(client_trained_weights, beta=0.20)
        t_trimmed = (time.perf_counter() - t0) * 1000

        t0 = time.perf_counter()
        w_trust, clean_norm_w, _ = aggregate_trust_weighted(
            client_trained_weights,
            trust_scores=[0.90] * NUM_CLIENTS,
            quality_scores=[0.90] * NUM_CLIENTS
        )
        t_trust = (time.perf_counter() - t0) * 1000

        m_eval = IntrusionDetectionNet(input_dim=N_FEATURES)

        def eval_weights(weights):
            m_eval.load_state_dict(OrderedDict({name: torch.tensor(p) for name, p in zip(m_eval.state_dict().keys(), weights)}))
            return evaluate_model(m_eval, global_test_loader)

        acc_clean_fedavg, f1_clean_fedavg = eval_weights(w_fedavg)
        acc_clean_median, f1_clean_median = eval_weights(w_median)
        acc_clean_trimmed, f1_clean_trimmed = eval_weights(w_trimmed)
        acc_clean_trust, f1_clean_trust = eval_weights(w_trust)

        agg_comparison_rows.append({
            "seed": seed,
            "fedavg_clean_acc": round(acc_clean_fedavg, 4),
            "fedavg_clean_f1": round(f1_clean_fedavg, 4),
            "fedavg_latency_ms": round(t_fedavg, 4),
            "coord_median_clean_acc": round(acc_clean_median, 4),
            "coord_median_clean_f1": round(f1_clean_median, 4),
            "coord_median_latency_ms": round(t_median, 4),
            "trimmed_mean_clean_acc": round(acc_clean_trimmed, 4),
            "trimmed_mean_clean_f1": round(f1_clean_trimmed, 4),
            "trimmed_mean_latency_ms": round(t_trimmed, 4),
            "trust_weighted_clean_acc": round(acc_clean_trust, 4),
            "trust_weighted_clean_f1": round(f1_clean_trust, 4),
            "trust_weighted_latency_ms": round(t_trust, 4)
        })

        # 2. Multi-Attack Poisoning Simulations v1.1
        # Attacks evaluated:
        # A) Gaussian Poisoning (10%, 20%, 30%, 40%)
        # B) Gradient Sign Flip
        # C) Parameter Scaling (10x)
        # D) Label Flipping (Class 1 -> Class 0)
        
        # Test A: Gaussian Parameter Poisoning
        for rate in POISON_RATES:
            mal_w = AdversarialAttackSimulator.gaussian_parameter_poisoning(
                clean_weights=client_trained_weights[NUM_CLIENTS - 1],
                poisoning_strength=rate * 4.0,
                seed=seed + int(rate * 100)
            )
            p_pool = copy.deepcopy(client_trained_weights[:NUM_CLIENTS - 1]) + [mal_w]

            p_fedavg = aggregate_fedavg(p_pool)
            p_median = aggregate_coord_median(p_pool)
            p_trimmed = aggregate_trimmed_mean(p_pool, beta=0.20)
            p_trust, p_norm_w, p_anoms = aggregate_trust_weighted(
                p_pool,
                trust_scores=[0.90] * (NUM_CLIENTS - 1) + [max(0.05, 0.50 - rate)],
                quality_scores=[0.90] * (NUM_CLIENTS - 1) + [max(0.10, 0.70 - rate)]
            )

            acc_p_fedavg, f1_p_fedavg = eval_weights(p_fedavg)
            acc_p_median, f1_p_median = eval_weights(p_median)
            acc_p_trimmed, f1_p_trimmed = eval_weights(p_trimmed)
            acc_p_trust, f1_p_trust = eval_weights(p_trust)

            mal_w_fedavg = 1.0 / NUM_CLIENTS
            mal_w_trust = p_norm_w[NUM_CLIENTS - 1]
            inf_reduction = (mal_w_fedavg - mal_w_trust) / mal_w_fedavg

            attack_rows.append({
                "seed": seed,
                "attack_type": "Gaussian Parameter Poisoning",
                "attack_intensity": f"{int(rate * 100)}%",
                "clean_accuracy": round(acc_clean_trust, 4),
                "fedavg_poisoned_acc": round(acc_p_fedavg, 4),
                "fedavg_acc_change_vs_clean": round(acc_clean_fedavg - acc_p_fedavg, 4),
                "coord_median_poisoned_acc": round(acc_p_median, 4),
                "coord_median_acc_change_vs_clean": round(acc_clean_median - acc_p_median, 4),
                "trimmed_mean_poisoned_acc": round(acc_p_trimmed, 4),
                "trimmed_mean_acc_change_vs_clean": round(acc_clean_trimmed - acc_p_trimmed, 4),
                "trust_weighted_poisoned_acc": round(acc_p_trust, 4),
                "trust_weighted_acc_change_vs_clean": round(acc_clean_trust - acc_p_trust, 4),
                "malicious_weight_trust": round(mal_w_trust, 4),
                "malicious_influence_reduction": round(inf_reduction, 4)
            })

        # Test B: Gradient Sign Flip Attack
        mal_w_flip = AdversarialAttackSimulator.gradient_sign_flip_attack(
            clean_weights=client_trained_weights[NUM_CLIENTS - 1],
            initial_weights=client_initial_weights[NUM_CLIENTS - 1],
            scaling_factor=1.5
        )
        p_pool_flip = copy.deepcopy(client_trained_weights[:NUM_CLIENTS - 1]) + [mal_w_flip]
        p_fedavg_flip = aggregate_fedavg(p_pool_flip)
        p_trust_flip, p_norm_w_flip, _ = aggregate_trust_weighted(
            p_pool_flip,
            trust_scores=[0.90] * (NUM_CLIENTS - 1) + [0.30],
            quality_scores=[0.90] * (NUM_CLIENTS - 1) + [0.40]
        )
        acc_flip_fedavg, _ = eval_weights(p_fedavg_flip)
        acc_flip_trust, _ = eval_weights(p_trust_flip)

        attack_rows.append({
            "seed": seed,
            "attack_type": "Gradient Sign Flip",
            "attack_intensity": "Scale -1.5x",
            "clean_accuracy": round(acc_clean_trust, 4),
            "fedavg_poisoned_acc": round(acc_flip_fedavg, 4),
            "fedavg_acc_change_vs_clean": round(acc_clean_fedavg - acc_flip_fedavg, 4),
            "coord_median_poisoned_acc": round(eval_weights(aggregate_coord_median(p_pool_flip))[0], 4),
            "coord_median_acc_change_vs_clean": round(acc_clean_median - eval_weights(aggregate_coord_median(p_pool_flip))[0], 4),
            "trimmed_mean_poisoned_acc": round(eval_weights(aggregate_trimmed_mean(p_pool_flip))[0], 4),
            "trimmed_mean_acc_change_vs_clean": round(acc_clean_trimmed - eval_weights(aggregate_trimmed_mean(p_pool_flip))[0], 4),
            "trust_weighted_poisoned_acc": round(acc_flip_trust, 4),
            "trust_weighted_acc_change_vs_clean": round(acc_clean_trust - acc_flip_trust, 4),
            "malicious_weight_trust": round(p_norm_w_flip[NUM_CLIENTS - 1], 4),
            "malicious_influence_reduction": round((0.20 - p_norm_w_flip[NUM_CLIENTS - 1]) / 0.20, 4)
        })

        # Test C: Parameter Scaling Attack (10x)
        mal_w_scale = AdversarialAttackSimulator.parameter_scaling_attack(
            clean_weights=client_trained_weights[NUM_CLIENTS - 1],
            initial_weights=client_initial_weights[NUM_CLIENTS - 1],
            scale_multiplier=10.0
        )
        p_pool_scale = copy.deepcopy(client_trained_weights[:NUM_CLIENTS - 1]) + [mal_w_scale]
        p_fedavg_scale = aggregate_fedavg(p_pool_scale)
        p_trust_scale, p_norm_w_scale, _ = aggregate_trust_weighted(
            p_pool_scale,
            trust_scores=[0.90] * (NUM_CLIENTS - 1) + [0.20],
            quality_scores=[0.90] * (NUM_CLIENTS - 1) + [0.30]
        )
        acc_scale_fedavg, _ = eval_weights(p_fedavg_scale)
        acc_scale_trust, _ = eval_weights(p_trust_scale)

        attack_rows.append({
            "seed": seed,
            "attack_type": "Parameter Scaling",
            "attack_intensity": "Scale 10.0x",
            "clean_accuracy": round(acc_clean_trust, 4),
            "fedavg_poisoned_acc": round(acc_scale_fedavg, 4),
            "fedavg_acc_change_vs_clean": round(acc_clean_fedavg - acc_scale_fedavg, 4),
            "coord_median_poisoned_acc": round(eval_weights(aggregate_coord_median(p_pool_scale))[0], 4),
            "coord_median_acc_change_vs_clean": round(acc_clean_median - eval_weights(aggregate_coord_median(p_pool_scale))[0], 4),
            "trimmed_mean_poisoned_acc": round(eval_weights(aggregate_trimmed_mean(p_pool_scale))[0], 4),
            "trimmed_mean_acc_change_vs_clean": round(acc_clean_trimmed - eval_weights(aggregate_trimmed_mean(p_pool_scale))[0], 4),
            "trust_weighted_poisoned_acc": round(acc_scale_trust, 4),
            "trust_weighted_acc_change_vs_clean": round(acc_clean_trust - acc_scale_trust, 4),
            "malicious_weight_trust": round(p_norm_w_scale[NUM_CLIENTS - 1], 4),
            "malicious_influence_reduction": round((0.20 - p_norm_w_scale[NUM_CLIENTS - 1]) / 0.20, 4)
        })

    # 3. Privacy-Utility Experiments v1.1
    epsilon_levels = [0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
    ground_truth_count = 150.0
    sensitivity = 1.0

    for eps in epsilon_levels:
        noise_samples = []
        for _ in range(500):
            noisy_val = apply_laplace_noise(ground_truth_count, sensitivity, eps)
            noise_samples.append(abs(noisy_val - ground_truth_count))

        mae = float(np.mean(noise_samples))
        rmse = float(np.sqrt(np.mean(np.square(noise_samples))))
        b_scale = sensitivity / eps
        theoretical_std = math.sqrt(2) * b_scale

        dp_rows.append({
            "epsilon": eps,
            "ground_truth_value": ground_truth_count,
            "sensitivity": sensitivity,
            "laplace_scale_b": round(b_scale, 4),
            "theoretical_std": round(theoretical_std, 4),
            "empirical_mae": round(mae, 4),
            "empirical_rmse": round(rmse, 4),
            "relative_error_pct": round((mae / ground_truth_count) * 100, 2)
        })

    # Save to results/v1_1/
    csv_agg = os.path.join(RESULTS_V1_1_DIR, "multi_aggregation_comparison.csv")
    with open(csv_agg, mode="w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=agg_comparison_rows[0].keys())
        writer.writeheader()
        writer.writerows(agg_comparison_rows)

    csv_attacks = os.path.join(RESULTS_V1_1_DIR, "multi_attack_experiments.csv")
    with open(csv_attacks, mode="w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=attack_rows[0].keys())
        writer.writeheader()
        writer.writerows(attack_rows)

    csv_dp = os.path.join(RESULTS_V1_1_DIR, "privacy_utility.csv")
    with open(csv_dp, mode="w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=dp_rows[0].keys())
        writer.writeheader()
        writer.writerows(dp_rows)

    print("\n[+] ThreatShield v1.1 Experiments Successfully Executed and Saved.")
    print(f"[+] Saved: {csv_agg}")
    print(f"[+] Saved: {csv_attacks}")
    print(f"[+] Saved: {csv_dp}")

    print("\n--- v1.1 MULTI-AGGREGATOR CLEAN BASELINES (Mean across 5 Seeds) ---")
    print(f"Standard FedAvg: {np.mean([r['fedavg_clean_acc'] for r in agg_comparison_rows]):.4f} Acc | Latency: {np.mean([r['fedavg_latency_ms'] for r in agg_comparison_rows]):.4f} ms")
    print(f"Coordinate Median: {np.mean([r['coord_median_clean_acc'] for r in agg_comparison_rows]):.4f} Acc | Latency: {np.mean([r['coord_median_latency_ms'] for r in agg_comparison_rows]):.4f} ms")
    print(f"Trimmed Mean (beta=0.20): {np.mean([r['trimmed_mean_clean_acc'] for r in agg_comparison_rows]):.4f} Acc | Latency: {np.mean([r['trimmed_mean_latency_ms'] for r in agg_comparison_rows]):.4f} ms")
    print(f"Trust-Weighted FedAvg: {np.mean([r['trust_weighted_clean_acc'] for r in agg_comparison_rows]):.4f} Acc | Latency: {np.mean([r['trust_weighted_latency_ms'] for r in agg_comparison_rows]):.4f} ms")

if __name__ == "__main__":
    run_v1_1_experiments()
