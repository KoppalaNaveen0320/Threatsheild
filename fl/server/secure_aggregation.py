import numpy as np
from typing import List, Dict, Tuple, Optional
import hashlib
import logging

logger = logging.getLogger("ThreatShield.FL.SecureAggregation")

class SecureAggregationPrototype:
    """
    Secure Aggregation Prototype (Zero-Sum Additive Pairwise Masking).
    
    Mathematical Formulation:
    For N participating organizations, each client i generates pairwise zero-sum masks
    with peer j using shared secrets: S_ij = -S_ji.
    
    Masked Client Update:
        Delta_W_i_masked = Delta_W_i + sum_{j > i} S_ij - sum_{j < i} S_ji
        
    Server Aggregation:
        sum_{i=1}^N Delta_W_i_masked = sum_{i=1}^N Delta_W_i + sum_{i=1}^N (sum_{j > i} S_ij - sum_{j < i} S_ji)
                                     = sum_{i=1}^N Delta_W_i  (All pairwise masks cancel out exactly)
                                     
    Research & Implementation Scope:
    This module implements a functional zero-sum additive pairwise masking prototype
    to demonstrate privacy-preserving gradient aggregation where the central server
    never observes individual unmasked client gradients Delta_W_i.
    Note: Production deployment across adversarial networks requires threshold Shamir secret
    sharing (e.g. Bonawitz et al., CCS 2017) to handle asynchronous client dropouts.
    """

    @staticmethod
    def generate_pairwise_seed(client_id_a: str, client_id_b: str, round_num: int) -> int:
        """
        Derives a deterministic pseudorandom seed for the pair (a, b) at round r.
        Order-independent: seed(a, b) == seed(b, a)
        """
        sorted_pair = sorted([str(client_id_a), str(client_id_b)])
        seed_str = f"{sorted_pair[0]}:{sorted_pair[1]}:round_{round_num}"
        digest = hashlib.sha256(seed_str.encode('utf-8')).hexdigest()
        return int(digest[:8], 16)

    @classmethod
    def mask_client_update(
        cls,
        client_id: str,
        client_indices: List[str],
        unmasked_weights: List[np.ndarray],
        round_num: int
    ) -> List[np.ndarray]:
        """
        Applies additive zero-sum pairwise masks to client's parameter update.
        """
        masked_weights = [np.copy(layer) for layer in unmasked_weights]
        my_idx = client_indices.index(client_id)

        for other_idx, other_id in enumerate(client_indices):
            if other_id == client_id:
                continue

            pair_seed = cls.generate_pairwise_seed(client_id, other_id, round_num)
            rng = np.random.RandomState(pair_seed)

            # Generate pseudo-random mask tensor with identical layer shapes
            for layer_idx, layer in enumerate(masked_weights):
                mask = rng.normal(loc=0.0, scale=0.1, size=layer.shape).astype(layer.dtype)
                if my_idx < other_idx:
                    masked_weights[layer_idx] += mask
                else:
                    masked_weights[layer_idx] -= mask

        return masked_weights

    @classmethod
    def aggregate_masked_updates(
        cls,
        masked_client_updates: List[List[np.ndarray]],
        client_weights: List[float]
    ) -> List[np.ndarray]:
        """
        Aggregates masked updates from all participating clients.
        When all client masks are summed, pairwise noise vectors cancel out.
        """
        if not masked_client_updates:
            raise ValueError("No masked client updates provided for secure aggregation")

        num_layers = len(masked_client_updates[0])
        total_weight = sum(client_weights)
        if total_weight <= 1e-9:
            total_weight = float(len(masked_client_updates))
            client_weights = [1.0] * len(masked_client_updates)

        normalized_weights = [w / total_weight for w in client_weights]

        aggregated_tensors = [
            np.zeros_like(masked_client_updates[0][l], dtype=np.float64)
            for l in range(num_layers)
        ]

        for client_idx, update in enumerate(masked_client_updates):
            w = normalized_weights[client_idx]
            for l in range(num_layers):
                aggregated_tensors[l] += update[l] * w

        return [layer.astype(masked_client_updates[0][l].dtype) for l, layer in enumerate(aggregated_tensors)]
