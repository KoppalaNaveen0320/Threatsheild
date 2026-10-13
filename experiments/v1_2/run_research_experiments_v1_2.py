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
from fl.server.advanced_strategies import MultiKrumAggregator, ClippedFedAvgAggregator, FedProxAggregator, ClientCollusionDetector
from fl.simulation.attacks import AdversarialAttackSimulator
from app.privacy.engine import apply_laplace_noise

SEEDS = [42, 123, 456, 789, 2024]
POISON_RATES = [0.10, 0.20, 0.30, 0.40]
NUM_CLIENTS = 5
DIRICHLET_ALPHA = 0.3
N_FEATURES = 78
N_SAMPLES_TOTAL = 2500
TEST_RATIO = 0.20
RESULTS_V1_2_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'results', 'v1_2')

os.makedirs(RESULTS_V1_2_DIR, exist_ok=True)

def generate_dataset(seed: int, num_clients: int = NUM_CLIENTS, alpha: float = DIRICHLET_ALPHA):
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

    return client_train_loaders, global_test_loader

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

def train_client(train_loader: data_utils.DataLoader, epochs: int = 5, seed: int = 42) -> Tuple[List[np.ndarray], List[np.ndarray]]:
    torch.manual_seed(seed)
    model = IntrusionDetectionNet(input_dim=N_FEATURES)
    init_w = [p.detach().cpu().numpy().copy() for p in model.parameters()]
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

    tr_w = [p.detach().cpu().numpy() for p in model.parameters()]
    return tr_w, init_w

# Aggregators
def agg_fedavg(updates):
    K = len(updates)
    return [sum(updates[k][l] * (1.0 / K) for k in range(K)) for l in range(len(updates[0]))]

def agg_coord_median(updates):
    K = len(updates)
    return [np.median(np.stack([updates[k][l] for k in range(K)], axis=0), axis=0).astype(updates[0][l].dtype) for l in range(len(updates[0]))]

def agg_trimmed_mean(updates, beta=0.20):
    K = len(updates)
    trim = int(beta * K)
    res = []
    for l in range(len(updates[0])):
        stacked = np.stack([updates[k][l] for k in range(K)], axis=0)
        if 2 * trim >= K or trim == 0:
            res.append(np.mean(stacked, axis=0).astype(updates[0][l].dtype))
        else:
            sorted_s = np.sort(stacked, axis=0)
            res.append(np.mean(sorted_s[trim : K - trim], axis=0).astype(updates[0][l].dtype))
    return res

def agg_trust_weighted(updates, trusts, qualities):
    K = len(updates)
    flat_vecs = [np.concatenate([p.flatten() for p in params]) for params in updates]
    norms = [np.linalg.norm(v) for v in flat_vecs]
    med_norm = float(np.median(norms))
    ref_vec = np.mean(flat_vecs, axis=0)

    weights = []
    anomalies = []
    for k in range(K):
        norm_anom = min(1.0, abs(norms[k] - med_norm) / (med_norm + 1e-9))
        cos_sim = np.dot(flat_vecs[k], ref_vec) / (norms[k] * np.linalg.norm(ref_vec) + 1e-9)
        cos_anom = max(0.0, 1.0 - max(0.0, float(cos_sim)))
        anom_k = min(1.0, max(0.0, 0.5 * norm_anom + 0.5 * cos_anom))
        anomalies.append(anom_k)
        w_k = trusts[k] * qualities[k] * max(0.0001, 1.0 - anom_k)
        weights.append(w_k)

    tot_w = sum(weights)
    norm_w = [w / tot_w for w in weights]
    agg = [sum(updates[k][l] * norm_w[k] for k in range(K)) for l in range(len(updates[0]))]
    return agg, norm_w, anomalies

def run_v1_2_experiments():
    print("=" * 80)
    print("THREATSHIELD v1.2 — EXTENDED RESEARCH EVALUATION & MULTI-AGGREGATOR BENCHMARK")
    print(f"Seeds: {SEEDS} | Clients: {NUM_CLIENTS} | Non-IID Dirichlet Alpha: {DIRICHLET_ALPHA}")
    print(f"Results Directory: {RESULTS_V1_2_DIR}")
    print("=" * 80)

    agg_rows = []
    attack_rows = []
    dp_rows = []

    for seed in SEEDS:
        client_loaders, test_loader = generate_dataset(seed)
        client_weights = []
        client_inits = []
        for k in range(NUM_CLIENTS):
            w, init_w = train_client(client_loaders[k], epochs=5, seed=seed + k * 10)
            client_weights.append(w)
            client_inits.append(init_w)

        m_eval = IntrusionDetectionNet(input_dim=N_FEATURES)
        def eval_w(w):
            m_eval.load_state_dict(OrderedDict({name: torch.tensor(p) for name, p in zip(m_eval.state_dict().keys(), w)}))
            return evaluate_model(m_eval, test_loader)

        # 1. Clean Benchmark Across 7 Aggregation Strategies
        w_fedavg = agg_fedavg(client_weights)
        w_trust, _, _ = agg_trust_weighted(client_weights, [0.90] * NUM_CLIENTS, [0.90] * NUM_CLIENTS)
        w_prox = FedProxAggregator.aggregate(client_weights, client_inits[0], mu_prox=0.01)
        w_median = agg_coord_median(client_weights)
        w_trimmed = agg_trimmed_mean(client_weights, beta=0.20)
        w_krum = MultiKrumAggregator.aggregate(client_weights, f_byzantine=1, m_select=4)
        w_clipped = ClippedFedAvgAggregator.aggregate(client_weights, client_inits[0], tau_clip_norm=10.0)

        acc_fedavg, f1_fedavg = eval_w(w_fedavg)
        acc_trust, f1_trust = eval_w(w_trust)
        acc_prox, f1_prox = eval_w(w_prox)
        acc_median, f1_median = eval_w(w_median)
        acc_trimmed, f1_trimmed = eval_w(w_trimmed)
        acc_krum, f1_krum = eval_w(w_krum)
        acc_clipped, f1_clipped = eval_w(w_clipped)

        agg_rows.append({
            "seed": seed,
            "fedavg_acc": round(acc_fedavg, 4),
            "fedavg_f1": round(f1_fedavg, 4),
            "trust_weighted_acc": round(acc_trust, 4),
            "trust_weighted_f1": round(f1_trust, 4),
            "fedprox_acc": round(acc_prox, 4),
            "fedprox_f1": round(f1_prox, 4),
            "coord_median_acc": round(acc_median, 4),
            "coord_median_f1": round(f1_median, 4),
            "trimmed_mean_acc": round(acc_trimmed, 4),
            "trimmed_mean_f1": round(f1_trimmed, 4),
            "multikrum_acc": round(acc_krum, 4),
            "multikrum_f1": round(f1_krum, 4),
            "clipped_fedavg_acc": round(acc_clipped, 4),
            "clipped_fedavg_f1": round(f1_clipped, 4)
        })

        # 2. Multi-Attack Evaluation Suite v1.2
        # A) Gaussian Poisoning (10% to 40%)
        for rate in POISON_RATES:
            mal_w = AdversarialAttackSimulator.gaussian_parameter_poisoning(
                clean_weights=client_weights[NUM_CLIENTS - 1],
                poisoning_strength=rate * 4.0,
                seed=seed + int(rate * 100)
            )
            pool = copy.deepcopy(client_weights[:NUM_CLIENTS - 1]) + [mal_w]
            p_fedavg = agg_fedavg(pool)
            p_trust, norm_w, _ = agg_trust_weighted(
                pool,
                [0.90] * (NUM_CLIENTS - 1) + [max(0.05, 0.50 - rate)],
                [0.90] * (NUM_CLIENTS - 1) + [max(0.10, 0.70 - rate)]
            )
            p_krum = MultiKrumAggregator.aggregate(pool, f_byzantine=1, m_select=4)

            acc_p_fedavg, _ = eval_w(p_fedavg)
            acc_p_trust, _ = eval_w(p_trust)
            acc_p_krum, _ = eval_w(p_krum)

            w_mal = norm_w[NUM_CLIENTS - 1]
            inf_red = (0.20 - w_mal) / 0.20

            attack_rows.append({
                "seed": seed,
                "attack_type": "Gaussian Parameter Poisoning",
                "intensity": f"{int(rate*100)}%",
                "clean_acc": round(acc_trust, 4),
                "fedavg_poisoned_acc": round(acc_p_fedavg, 4),
                "fedavg_acc_change_vs_clean": round(acc_fedavg - acc_p_fedavg, 4),
                "trust_weighted_poisoned_acc": round(acc_p_trust, 4),
                "trust_weighted_acc_change_vs_clean": round(acc_trust - acc_p_trust, 4),
                "multikrum_poisoned_acc": round(acc_p_krum, 4),
                "multikrum_acc_change_vs_clean": round(acc_krum - acc_p_krum, 4),
                "malicious_weight_trust": round(w_mal, 4),
                "malicious_influence_reduction": round(inf_red, 4)
            })

        # B) Gradient Sign Flip
        mal_flip = AdversarialAttackSimulator.gradient_sign_flip_attack(
            clean_weights=client_weights[NUM_CLIENTS - 1],
            initial_weights=client_inits[NUM_CLIENTS - 1],
            scaling_factor=1.5
        )
        pool_flip = copy.deepcopy(client_weights[:NUM_CLIENTS - 1]) + [mal_flip]
        p_trust_flip, norm_w_flip, _ = agg_trust_weighted(
            pool_flip,
            [0.90] * (NUM_CLIENTS - 1) + [0.30],
            [0.90] * (NUM_CLIENTS - 1) + [0.40]
        )
        acc_p_flip_fedavg, _ = eval_w(agg_fedavg(pool_flip))
        acc_p_flip_trust, _ = eval_w(p_trust_flip)

        attack_rows.append({
            "seed": seed,
            "attack_type": "Gradient Sign Flip",
            "intensity": "Scale -1.5x",
            "clean_acc": round(acc_trust, 4),
            "fedavg_poisoned_acc": round(acc_p_flip_fedavg, 4),
            "fedavg_acc_change_vs_clean": round(acc_fedavg - acc_p_flip_fedavg, 4),
            "trust_weighted_poisoned_acc": round(acc_p_flip_trust, 4),
            "trust_weighted_acc_change_vs_clean": round(acc_trust - acc_p_flip_trust, 4),
            "multikrum_poisoned_acc": round(eval_w(MultiKrumAggregator.aggregate(pool_flip, f_byzantine=1))[0], 4),
            "multikrum_acc_change_vs_clean": round(acc_krum - eval_w(MultiKrumAggregator.aggregate(pool_flip, f_byzantine=1))[0], 4),
            "malicious_weight_trust": round(norm_w_flip[NUM_CLIENTS - 1], 4),
            "malicious_influence_reduction": round((0.20 - norm_w_flip[NUM_CLIENTS - 1]) / 0.20, 4)
        })

        # C) Multi-Client Collusion Attack (Clients 4 & 5 collude)
        mal_collude_1 = AdversarialAttackSimulator.gaussian_parameter_poisoning(client_weights[3], poisoning_strength=1.5, seed=seed+55)
        mal_collude_2 = copy.deepcopy(mal_collude_1) # Exactly aligned update
        pool_collude = copy.deepcopy(client_weights[:3]) + [mal_collude_1, mal_collude_2]

        collusion_res = ClientCollusionDetector.detect_collusion(pool_collude, [f"org_{i+1}" for i in range(5)])
        p_trust_col, norm_w_col, _ = agg_trust_weighted(
            pool_collude,
            [0.90, 0.90, 0.90, 0.25, 0.25],
            [0.90, 0.90, 0.90, 0.30, 0.30]
        )
        acc_col_fedavg, _ = eval_w(agg_fedavg(pool_collude))
        acc_col_trust, _ = eval_w(p_trust_col)

        attack_rows.append({
            "seed": seed,
            "attack_type": "Multi-Client Collusion",
            "intensity": "2 Colluding Sybils",
            "clean_acc": round(acc_trust, 4),
            "fedavg_poisoned_acc": round(acc_col_fedavg, 4),
            "fedavg_acc_change_vs_clean": round(acc_fedavg - acc_col_fedavg, 4),
            "trust_weighted_poisoned_acc": round(acc_col_trust, 4),
            "trust_weighted_acc_change_vs_clean": round(acc_trust - acc_col_trust, 4),
            "multikrum_poisoned_acc": round(eval_w(MultiKrumAggregator.aggregate(pool_collude, f_byzantine=2, m_select=3))[0], 4),
            "multikrum_acc_change_vs_clean": round(acc_krum - eval_w(MultiKrumAggregator.aggregate(pool_collude, f_byzantine=2, m_select=3))[0], 4),
            "malicious_weight_trust": round(norm_w_col[3] + norm_w_col[4], 4),
            "malicious_influence_reduction": round((0.40 - (norm_w_col[3] + norm_w_col[4])) / 0.40, 4)
        })

    # 3. Privacy-Utility Frontier v2 (7 Epsilon values)
    eps_levels = [0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0]
    gt_count = 150.0
    sensitivity = 1.0

    for eps in eps_levels:
        noise_errs = [abs(apply_laplace_noise(gt_count, sensitivity, eps) - gt_count) for _ in range(500)]
        mae = float(np.mean(noise_errs))
        rmse = float(np.sqrt(np.mean(np.square(noise_errs))))
        b_scale = sensitivity / eps

        dp_rows.append({
            "epsilon": eps,
            "ground_truth_count": gt_count,
            "sensitivity": sensitivity,
            "laplace_scale_b": round(b_scale, 4),
            "theoretical_std": round(math.sqrt(2) * b_scale, 4),
            "empirical_mae": round(mae, 4),
            "empirical_rmse": round(rmse, 4),
            "relative_error_pct": round((mae / gt_count) * 100, 2)
        })

    # Save to results/v1_2/
    csv_agg = os.path.join(RESULTS_V1_2_DIR, "multi_aggregation_comparison_v2.csv")
    with open(csv_agg, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=agg_rows[0].keys())
        w.writeheader()
        w.writerows(agg_rows)

    csv_att = os.path.join(RESULTS_V1_2_DIR, "multi_attack_experiments_v2.csv")
    with open(csv_att, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=attack_rows[0].keys())
        w.writeheader()
        w.writerows(attack_rows)

    csv_dp = os.path.join(RESULTS_V1_2_DIR, "privacy_utility_v2.csv")
    with open(csv_dp, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=dp_rows[0].keys())
        w.writeheader()
        w.writerows(dp_rows)

    print("\n[+] ThreatShield v1.2 Experiments Executed Successfully.")
    print(f"[+] Saved: {csv_agg}")
    print(f"[+] Saved: {csv_att}")
    print(f"[+] Saved: {csv_dp}")

    print("\n--- v1.2 7-AGGREGATOR CLEAN BASELINES (Mean across 5 Seeds) ---")
    print(f"Standard FedAvg: {np.mean([r['fedavg_acc'] for r in agg_rows]):.4f}")
    print(f"Trust-Weighted FedAvg: {np.mean([r['trust_weighted_acc'] for r in agg_rows]):.4f}")
    print(f"FedProx (mu=0.01): {np.mean([r['fedprox_acc'] for r in agg_rows]):.4f}")
    print(f"Trimmed Mean (beta=0.20): {np.mean([r['trimmed_mean_acc'] for r in agg_rows]):.4f}")
    print(f"Coordinate Median: {np.mean([r['coord_median_acc'] for r in agg_rows]):.4f}")
    print(f"Multi-Krum (m=4): {np.mean([r['multikrum_acc'] for r in agg_rows]):.4f}")
    print(f"Clipped FedAvg (tau=10.0): {np.mean([r['clipped_fedavg_acc'] for r in agg_rows]):.4f}")

if __name__ == "__main__":
    run_v1_2_experiments()
