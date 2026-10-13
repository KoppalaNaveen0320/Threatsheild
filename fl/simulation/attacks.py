import numpy as np
import copy
from typing import List, Dict, Any, Tuple
import torch
import torch.utils.data as data_utils

class AdversarialAttackSimulator:
    """
    ThreatShield Adversarial Attack Simulation Suite.
    
    Implements controlled benchmark simulations for:
    1. Model Parameter Poisoning (Gaussian Perturbation)
    2. Gradient / Update Sign Flip Attack
    3. Parameter Scaling Attack
    4. Data Label Flipping Attack
    5. Replay Attack
    6. Fake / Spam CTI Injection
    7. Duplicate CTI Flooding
    8. Sybil / Collusive Update Attack
    """

    @staticmethod
    def gaussian_parameter_poisoning(
        clean_weights: List[np.ndarray],
        poisoning_strength: float = 2.0,
        seed: int = 42
    ) -> List[np.ndarray]:
        """
        Perturbs clean model weights with zero-mean Gaussian noise scaled by poisoning_strength.
        """
        rng = np.random.RandomState(seed)
        poisoned = []
        for layer in clean_weights:
            noise = rng.normal(loc=0.0, scale=poisoning_strength, size=layer.shape).astype(layer.dtype)
            poisoned.append(layer + noise)
        return poisoned

    @staticmethod
    def gradient_sign_flip_attack(
        clean_weights: List[np.ndarray],
        initial_weights: List[np.ndarray],
        scaling_factor: float = 1.5
    ) -> List[np.ndarray]:
        """
        Inverts the direction of parameter updates:
        Delta_W_mal = -scaling_factor * (W_clean - W_initial)
        W_mal = W_initial + Delta_W_mal
        """
        poisoned = []
        for w_clean, w_init in zip(clean_weights, initial_weights):
            delta = w_clean - w_init
            flipped_delta = -1.0 * scaling_factor * delta
            poisoned.append(w_init + flipped_delta)
        return poisoned

    @staticmethod
    def parameter_scaling_attack(
        clean_weights: List[np.ndarray],
        initial_weights: List[np.ndarray],
        scale_multiplier: float = 10.0
    ) -> List[np.ndarray]:
        """
        Amplifies the update vector by scale_multiplier to dominate FedAvg:
        Delta_W_mal = scale_multiplier * Delta_W_clean
        """
        poisoned = []
        for w_clean, w_init in zip(clean_weights, initial_weights):
            delta = w_clean - w_init
            scaled_delta = scale_multiplier * delta
            poisoned.append(w_init + scaled_delta)
        return poisoned

    @staticmethod
    def label_flipping_attack(
        train_loader: data_utils.DataLoader,
        flip_source_class: int = 1,
        flip_target_class: int = 0
    ) -> data_utils.DataLoader:
        """
        Flips training labels from flip_source_class (e.g. Malicious = 1) to flip_target_class (Normal = 0).
        """
        all_features = []
        all_labels = []
        for feats, labels in train_loader:
            flipped_labels = labels.clone()
            mask = (labels == flip_source_class)
            flipped_labels[mask] = flip_target_class
            all_features.append(feats)
            all_labels.append(flipped_labels)

        X_cat = torch.cat(all_features, dim=0)
        y_cat = torch.cat(all_labels, dim=0)
        dataset = data_utils.TensorDataset(X_cat, y_cat)
        return data_utils.DataLoader(dataset, batch_size=train_loader.batch_size, shuffle=True)

    @staticmethod
    def replay_attack_simulation(
        historical_weights: List[List[np.ndarray]],
        target_round: int
    ) -> List[np.ndarray]:
        """
        Replays stale model update weights from an earlier round (e.g. round 0).
        """
        if not historical_weights:
            raise ValueError("No historical weights available to simulate replay attack")
        return copy.deepcopy(historical_weights[0])

    @staticmethod
    def sybil_collusive_updates(
        malicious_weight: List[np.ndarray],
        num_sybils: int = 3,
        jitter_std: float = 0.01,
        seed: int = 42
    ) -> List[List[np.ndarray]]:
        """
        Simulates multiple colluding Sybil clients submitting near-identical malicious updates.
        """
        rng = np.random.RandomState(seed)
        sybil_updates = []
        for i in range(num_sybils):
            sybil = []
            for layer in malicious_weight:
                jitter = rng.normal(0, jitter_std, layer.shape).astype(layer.dtype)
                sybil.append(layer + jitter)
            sybil_updates.append(sybil)
        return sybil_updates
