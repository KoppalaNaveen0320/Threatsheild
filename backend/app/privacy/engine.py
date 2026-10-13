import os
import numpy as np
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from sqlalchemy.orm import Session
from app.models.domain import Organization, PrivacyEvent
from fastapi import HTTPException

# Robust key for AES-256-GCM (32 bytes)
_AES_KEY = os.getenv("AES_SECRET_KEY", "0123456789abcdef0123456789abcdef").encode("utf-8")
aesgcm = AESGCM(_AES_KEY)

def encrypt_data(data: str) -> bytes:
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, data.encode('utf-8'), None)
    return nonce + ciphertext

def decrypt_data(encrypted_data: bytes) -> str:
    nonce = encrypted_data[:12]
    ciphertext = encrypted_data[12:]
    return aesgcm.decrypt(nonce, ciphertext, None).decode('utf-8')

def get_laplace_scale(sensitivity: float, epsilon: float) -> float:
    """
    Computes Laplace scale parameter: b = Δf / ε
    """
    if epsilon <= 0:
        raise ValueError("Epsilon budget parameter must be strictly positive (ε > 0)")
    if sensitivity <= 0:
        raise ValueError("Sensitivity parameter must be strictly positive (Δf > 0)")
    return float(sensitivity / epsilon)

def apply_laplace_noise(value: float, sensitivity: float, epsilon: float) -> float:
    """
    Applies Laplace noise to a numerical value for Differential Privacy.
    M(D) = f(D) + Lap(0, Δf / ε)
    """
    scale = get_laplace_scale(sensitivity, epsilon)
    noise = float(np.random.laplace(0, scale))
    return float(value + noise)

def consume_privacy_budget(db: Session, org_id, operation: str, epsilon_cost: float) -> bool:
    """
    Tracks and decrements differential privacy budget for an organization.
    Blocks query with HTTP 403 when budget is exhausted.
    """
    if epsilon_cost <= 0:
        raise HTTPException(status_code=400, detail="Epsilon cost must be greater than 0")
        
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    if org.privacy_budget < epsilon_cost:
        raise HTTPException(
            status_code=403,
            detail=f"Privacy budget exhausted. Current budget is {org.privacy_budget:.2f} ε, requested operation requires {epsilon_cost:.2f} ε."
        )
        
    org.privacy_budget -= epsilon_cost
    
    event = PrivacyEvent(
        organization_id=org_id,
        operation=operation,
        epsilon_consumed=epsilon_cost,
        epsilon_remaining=org.privacy_budget,
        mechanism="laplace"
    )
    db.add(event)
    db.commit()
    
    return True
