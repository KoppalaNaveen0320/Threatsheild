import flwr as fl
from typing import List, Tuple, Optional, Dict, Union, Any
from flwr.common import Metrics, EvaluateRes, FitRes, Parameters, Scalar
from flwr.server.client_proxy import ClientProxy
import numpy as np
import logging

logger = logging.getLogger("ThreatShield.FL.Strategy")

class TrustWeightedFedAvg(fl.server.strategy.FedAvg):
    """
    Trust-Weighted Federated Averaging Strategy with Multi-Signal Anomaly Detection.
    
    Mathematical Formulation:
        For client i:
        1. Anomaly Metric A_i:
           - L2 Divergence: D_L2 = | ||Delta_W_i||_2 - median(||Delta_W||_2) | / (median(||Delta_W||_2) + epsilon)
           - Cosine Similarity: Cos_i = (Delta_W_i . Delta_W_ref) / (||Delta_W_i||_2 * ||Delta_W_ref||_2)
           - Combined Anomaly: A_i = clip(0.5 * D_L2 + 0.5 * max(0, 1 - Cos_i), 0.0, 1.0)
        
        2. Client Trust Weight:
           W_client_trust_i = T_i * Q_i * (1 - A_i)
           
        3. Normalized Client Weight:
           W_hat_client_trust_i = W_client_trust_i / sum_j W_client_trust_j
           
        4. Global Model Parameter Update:
           W_global_model_params = sum_i ( W_hat_client_trust_i * W_client_model_params_i )
    """

    def __init__(
        self,
        *args,
        client_trust_scores: Optional[Dict[str, float]] = None,
        client_quality_scores: Optional[Dict[str, float]] = None,
        reference_update: Optional[List[np.ndarray]] = None,
        **kwargs
    ):
        super().__init__(*args, **kwargs)
        self.client_trust_scores = client_trust_scores or {}
        self.client_quality_scores = client_quality_scores or {}
        self.reference_update = reference_update
        self.round_history: List[Dict[str, Any]] = []

    def validate_client_parameters(self, ndarrays: List[np.ndarray]) -> bool:
        """
        Validates model update tensors for numerical and structural integrity.
        Rejects updates containing NaN, Inf, or empty tensor lists.
        """
        if not ndarrays or len(ndarrays) == 0:
            return False

        for layer in ndarrays:
            if not isinstance(layer, np.ndarray):
                return False
            if np.isnan(layer).any() or np.isinf(layer).any():
                logger.warning("[!] Client update contains NaN or Inf values. Numerical check failed.")
                return False
            # Check for extreme unbounded magnitude explosions
            if np.max(np.abs(layer)) > 1e5:
                logger.warning("[!] Client update tensor magnitude exceeds safety threshold (1e5). Rejected.")
                return False

        return True

    @staticmethod
    def flatten_weights(weights: List[np.ndarray]) -> np.ndarray:
        return np.concatenate([w.flatten() for w in weights])

    def calculate_cosine_similarity(self, u: np.ndarray, v: np.ndarray) -> float:
        norm_u = np.linalg.norm(u)
        norm_v = np.linalg.norm(v)
        if norm_u <= 1e-9 or norm_v <= 1e-9:
            return 1.0
        dot_product = float(np.dot(u, v))
        cosine_sim = dot_product / (norm_u * norm_v)
        return max(-1.0, min(1.0, float(cosine_sim)))

    def aggregate_fit(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, FitRes]],
        failures: List[Union[Tuple[ClientProxy, FitRes], BaseException]],
    ) -> Tuple[Optional[Parameters], Dict[str, Scalar]]:
        
        if not results:
            return None, {}

        # 1. Numerical verification and extraction
        valid_clients = []
        flat_vectors = []
        l2_norms = []

        for client, fit_res in results:
            try:
                model_params = fl.common.parameters_to_ndarrays(fit_res.parameters)
                if not self.validate_client_parameters(model_params):
                    continue
                flat_vec = self.flatten_weights(model_params)
                norm = float(np.linalg.norm(flat_vec))
                
                valid_clients.append((client.cid, model_params, flat_vec, norm))
                flat_vectors.append(flat_vec)
                l2_norms.append(norm)
            except Exception as e:
                logger.warning(f"[!] Error processing parameters from client {client.cid}: {e}")
                continue

        if not valid_clients:
            logger.warning("[!] No valid client updates remained after numerical verification.")
            return None, {}

        median_norm = float(np.median(l2_norms))
        # Compute mean reference vector across participating clients if no pre-set reference
        mean_ref_vector = np.mean(flat_vectors, axis=0)

        # 2. Multi-Signal Anomaly Calculation & Trust Weighting
        weighted_client_updates = []
        total_trust_weight = 0.0
        client_eval_summaries = []

        for cid, model_params, flat_vec, norm in valid_clients:
            # Signal 1: L2 Norm Divergence from Median
            l2_dev = abs(norm - median_norm) / (median_norm + 1e-9)
            norm_anomaly = min(1.0, l2_dev)

            # Signal 2: Cosine Similarity with Reference
            cos_sim = self.calculate_cosine_similarity(flat_vec, mean_ref_vector)
            cos_anomaly = max(0.0, 1.0 - max(0.0, cos_sim))

            # Combined Anomaly Score A_i
            combined_anomaly = min(1.0, max(0.0, 0.5 * norm_anomaly + 0.5 * cos_anomaly))
            anomaly_discount = max(0.01, 1.0 - combined_anomaly)

            # Fetch T_i and Q_i
            trust_score = float(self.client_trust_scores.get(cid, 0.75))
            quality_score = float(self.client_quality_scores.get(cid, 0.85))

            # Client Trust Weight: W_client_trust = T_i * Q_i * (1 - A_i)
            client_trust_weight = trust_score * quality_score * anomaly_discount
            weighted_client_updates.append((model_params, client_trust_weight, cid))
            total_trust_weight += client_trust_weight

            client_eval_summaries.append({
                "client_id": cid,
                "l2_norm": norm,
                "cosine_sim": round(cos_sim, 4),
                "anomaly_score": round(combined_anomaly, 4),
                "trust_score": round(trust_score, 4),
                "quality_score": round(quality_score, 4),
                "raw_weight": round(client_trust_weight, 4)
            })

        # 3. Parameter Aggregation: W_global = sum( W_hat_i * W_model_i )
        if total_trust_weight <= 1e-9:
            logger.warning("[!] Total aggregation weight is zero. Falling back to uniform average.")
            total_trust_weight = float(len(weighted_client_updates))
            weighted_client_updates = [(params, 1.0, cid) for params, _, cid in weighted_client_updates]

        num_layers = len(weighted_client_updates[0][0])
        aggregated_model_tensors = [
            np.zeros_like(weighted_client_updates[0][0][l], dtype=np.float64)
            for l in range(num_layers)
        ]

        for model_params, weight, cid in weighted_client_updates:
            normalized_weight = weight / total_trust_weight
            for l in range(num_layers):
                aggregated_model_tensors[l] += model_params[l] * normalized_weight

        final_model_parameters = [
            layer.astype(weighted_client_updates[0][0][l].dtype)
            for l, layer in enumerate(aggregated_model_tensors)
        ]

        round_record = {
            "round": server_round,
            "participating_clients": len(weighted_client_updates),
            "median_norm": round(median_norm, 4),
            "client_summaries": client_eval_summaries
        }
        self.round_history.append(round_record)

        return fl.common.ndarrays_to_parameters(final_model_parameters), {
            "round": server_round,
            "participating_clients": len(weighted_client_updates),
            "median_norm": median_norm
        }

class CoordinateMedianFedAvg(fl.server.strategy.FedAvg):
    """
    Coordinate-wise Median Aggregation Baseline (v1.1 Robust Aggregator).
    Computes the coordinate-wise median across all participating client model parameters.
    """
    def aggregate_fit(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, FitRes]],
        failures: List[Union[Tuple[ClientProxy, FitRes], BaseException]],
    ) -> Tuple[Optional[Parameters], Dict[str, Scalar]]:
        if not results:
            return None, {}

        client_params_list = []
        for _, fit_res in results:
            try:
                params = fl.common.parameters_to_ndarrays(fit_res.parameters)
                client_params_list.append(params)
            except Exception:
                continue

        if not client_params_list:
            return None, {}

        num_layers = len(client_params_list[0])
        aggregated = []
        for l in range(num_layers):
            stacked = np.stack([client_params_list[k][l] for k in range(len(client_params_list))], axis=0)
            median_layer = np.median(stacked, axis=0)
            aggregated.append(median_layer.astype(client_params_list[0][l].dtype))

        return fl.common.ndarrays_to_parameters(aggregated), {"round": server_round, "num_clients": len(client_params_list)}

class TrimmedMeanFedAvg(fl.server.strategy.FedAvg):
    """
    Trimmed Mean Aggregation Baseline (v1.1 Robust Aggregator).
    Trims the top and bottom beta fraction of values per coordinate before averaging.
    """
    def __init__(self, *args, beta: float = 0.20, **kwargs):
        super().__init__(*args, **kwargs)
        self.beta = beta

    def aggregate_fit(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, FitRes]],
        failures: List[Union[Tuple[ClientProxy, FitRes], BaseException]],
    ) -> Tuple[Optional[Parameters], Dict[str, Scalar]]:
        if not results:
            return None, {}

        client_params_list = []
        for _, fit_res in results:
            try:
                params = fl.common.parameters_to_ndarrays(fit_res.parameters)
                client_params_list.append(params)
            except Exception:
                continue

        if not client_params_list:
            return None, {}

        K = len(client_params_list)
        trim_count = int(self.beta * K)
        num_layers = len(client_params_list[0])
        aggregated = []

        for l in range(num_layers):
            stacked = np.stack([client_params_list[k][l] for k in range(K)], axis=0)
            if 2 * trim_count >= K or trim_count == 0:
                mean_layer = np.mean(stacked, axis=0)
            else:
                sorted_stacked = np.sort(stacked, axis=0)
                trimmed = sorted_stacked[trim_count : K - trim_count]
                mean_layer = np.mean(trimmed, axis=0)
            aggregated.append(mean_layer.astype(client_params_list[0][l].dtype))

        return fl.common.ndarrays_to_parameters(aggregated), {"round": server_round, "num_clients": K, "trim_count": trim_count}
