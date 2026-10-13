import numpy as np
import flwr as fl
from typing import List, Tuple, Optional, Dict, Union, Any
from flwr.common import Parameters, Scalar, FitRes
from flwr.server.client_proxy import ClientProxy
import logging

logger = logging.getLogger("ThreatShield.FL.AdvancedStrategies")

def flatten_tensors(tensors: List[np.ndarray]) -> np.ndarray:
    return np.concatenate([t.flatten() for t in tensors])

class MultiKrumAggregator:
    """
    Multi-Krum Robust Byzantine-Tolerant Federated Aggregation.
    Selects m best candidate updates minimizing sum of Euclidean distances to nearest peers.
    """
    @staticmethod
    def aggregate(
        client_updates: List[List[np.ndarray]],
        f_byzantine: int = 1,
        m_select: Optional[int] = None
    ) -> List[np.ndarray]:
        n = len(client_updates)
        if n <= 2:
            # Fallback to mean for small pools
            return [np.mean([client_updates[i][l] for i in range(n)], axis=0) for l in range(len(client_updates[0]))]

        flat_vectors = [flatten_tensors(params) for params in client_updates]
        dist_matrix = np.zeros((n, n))

        for i in range(n):
            for j in range(i + 1, n):
                d = float(np.linalg.norm(flat_vectors[i] - flat_vectors[j]))
                dist_matrix[i][j] = d
                dist_matrix[j][i] = d

        # For each client, sum distances to closest peers (minimum 2 peers to prevent Sybil collusion spoofing)
        k_closest = max(2, n - f_byzantine - 2) if n >= 4 else 1
        scores = []
        for i in range(n):
            sorted_dists = np.sort(dist_matrix[i])
            # Exclude self distance (index 0)
            score_i = float(np.sum(sorted_dists[1 : k_closest + 1]))
            scores.append(score_i)

        if m_select is None:
            m_select = max(1, n - f_byzantine)

        selected_indices = np.argsort(scores)[:m_select]
        num_layers = len(client_updates[0])

        aggregated = [
            np.mean([client_updates[idx][l] for idx in selected_indices], axis=0).astype(client_updates[0][l].dtype)
            for l in range(num_layers)
        ]
        return aggregated

class ClippedFedAvgAggregator:
    """
    Norm-Clipped Federated Aggregation.
    Clips individual client parameter updates to max L2 norm threshold tau.
    """
    @staticmethod
    def aggregate(
        client_updates: List[List[np.ndarray]],
        initial_weights: List[np.ndarray],
        tau_clip_norm: float = 10.0
    ) -> List[np.ndarray]:
        n = len(client_updates)
        clipped_deltas = []

        for params in client_updates:
            delta_layers = [params[l] - initial_weights[l] for l in range(len(params))]
            flat_delta = flatten_tensors(delta_layers)
            l2_norm = float(np.linalg.norm(flat_delta))

            clip_factor = min(1.0, tau_clip_norm / (l2_norm + 1e-9))
            clipped = [delta_layers[l] * clip_factor for l in range(len(delta_layers))]
            clipped_deltas.append(clipped)

        num_layers = len(initial_weights)
        mean_deltas = [
            np.mean([clipped_deltas[i][l] for i in range(n)], axis=0)
            for l in range(num_layers)
        ]

        return [initial_weights[l] + mean_deltas[l].astype(initial_weights[l].dtype) for l in range(num_layers)]

class FedProxAggregator:
    """
    FedProx Aggregation with proximal regularizer term.
    """
    @staticmethod
    def aggregate(
        client_updates: List[List[np.ndarray]],
        initial_weights: List[np.ndarray],
        mu_prox: float = 0.01
    ) -> List[np.ndarray]:
        n = len(client_updates)
        num_layers = len(initial_weights)
        
        # Proximal parameter decay
        weight_decay_factor = 1.0 / (1.0 + mu_prox)
        mean_params = [
            np.mean([client_updates[i][l] for i in range(n)], axis=0)
            for l in range(num_layers)
        ]
        
        return [
            (mean_params[l] * weight_decay_factor + initial_weights[l] * (1.0 - weight_decay_factor)).astype(initial_weights[l].dtype)
            for l in range(num_layers)
        ]

class ClientCollusionDetector:
    """
    Multi-Client Sybil and Coordinated Collusion Detection Engine.
    Evaluates pairwise gradient alignment and cluster deviation.
    """
    @staticmethod
    def detect_collusion(
        client_updates: List[List[np.ndarray]],
        client_ids: List[str]
    ) -> Dict[str, Any]:
        n = len(client_updates)
        if n < 3:
            return {"collusion_detected": False, "collusion_scores": {cid: 0.0 for cid in client_ids}}

        flat_vectors = [flatten_tensors(params) for params in client_updates]
        norms = [float(np.linalg.norm(v)) for v in flat_vectors]
        mean_global = np.mean(flat_vectors, axis=0)

        # Pairwise cosine similarities
        cosine_matrix = np.zeros((n, n))
        for i in range(n):
            for j in range(i + 1, n):
                if norms[i] > 1e-9 and norms[j] > 1e-9:
                    sim = float(np.dot(flat_vectors[i], flat_vectors[j]) / (norms[i] * norms[j]))
                else:
                    sim = 1.0
                cosine_matrix[i][j] = sim
                cosine_matrix[j][i] = sim

        collusion_scores = {}
        suspicious_clusters = []

        for i in range(n):
            # Find peers with extremely high cosine alignment (> 0.98)
            aligned_peers = [j for j in range(n) if i != j and cosine_matrix[i][j] > 0.98]
            dev_from_mean = float(np.linalg.norm(flat_vectors[i] - mean_global))

            if len(aligned_peers) >= 1 and dev_from_mean > np.median(norms) * 1.5:
                score = min(1.0, 0.5 + 0.25 * len(aligned_peers) + 0.25 * (dev_from_mean / (np.median(norms) + 1e-9)))
                collusion_scores[client_ids[i]] = round(score, 4)
                suspicious_clusters.append({
                    "primary_client": client_ids[i],
                    "correlated_peers": [client_ids[j] for j in aligned_peers],
                    "mean_pairwise_similarity": round(float(np.mean([cosine_matrix[i][j] for j in aligned_peers])), 4)
                })
            else:
                collusion_scores[client_ids[i]] = 0.0

        is_collusion = len(suspicious_clusters) > 0

        return {
            "collusion_detected": is_collusion,
            "collusion_scores": collusion_scores,
            "suspicious_clusters": suspicious_clusters
        }
