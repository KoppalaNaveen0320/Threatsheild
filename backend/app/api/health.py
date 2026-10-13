from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any
from datetime import datetime
from app.database import get_db

router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
def get_system_health(db: Session = Depends(get_db)):
    """
    Performs live health checks across all ThreatShield core subsystems.
    """
    health = {
        "status": "HEALTHY",
        "version": "1.2.0",
        "timestamp": datetime.utcnow().isoformat(),
        "components": {}
    }
    
    # 1. Database Connection Check
    try:
        db.execute(text("SELECT 1"))
        health["components"]["database"] = {"status": "HEALTHY", "engine": "SQLite/SQLAlchemy"}
    except Exception as e:
        health["components"]["database"] = {"status": "DEGRADED", "error": str(e)}
        health["status"] = "DEGRADED"
        
    # 2. STIX 2.1 Engine Check
    try:
        import stix2
        health["components"]["stix_engine"] = {"status": "HEALTHY", "version": getattr(stix2, "__version__", "3.0.2")}
    except Exception as e:
        health["components"]["stix_engine"] = {"status": "UNAVAILABLE", "error": str(e)}
        health["status"] = "DEGRADED"
        
    # 3. Differential Privacy Engine Check
    try:
        from app.privacy.engine import apply_laplace_noise
        val = apply_laplace_noise(10.0, 1.0, 1.0)
        health["components"]["privacy_engine"] = {"status": "HEALTHY", "mechanism": "Laplace DP (ε-budgeting)"}
    except Exception as e:
        health["components"]["privacy_engine"] = {"status": "UNAVAILABLE", "error": str(e)}
        health["status"] = "DEGRADED"
        
    # 4. Trust & Relevance Engine Check
    try:
        from app.trust.engine import explain_contribution_weight
        exp = explain_contribution_weight(0.8, 0.9, 0.05, 0.50)
        health["components"]["trust_engine"] = {"status": "HEALTHY", "model": "EMA + Anomaly-Weighted"}
    except Exception as e:
        health["components"]["trust_engine"] = {"status": "UNAVAILABLE", "error": str(e)}
        health["status"] = "DEGRADED"
        
    # 5. Cryptographic Ledger Engine Check
    try:
        from app.ledger.engine import verify_ledger
        is_valid = verify_ledger(db)
        health["components"]["ledger_engine"] = {"status": "HEALTHY", "chain_valid": is_valid, "algorithm": "SHA-256"}
    except Exception as e:
        health["components"]["ledger_engine"] = {"status": "UNAVAILABLE", "error": str(e)}
        health["status"] = "DEGRADED"
        
    # 6. Federated Learning Engine Check
    try:
        from fl.server.strategy import TrustWeightedFedAvg
        strat = TrustWeightedFedAvg()
        health["components"]["fl_engine"] = {"status": "HEALTHY", "strategy": "TrustWeightedFedAvg", "framework": "Flower/PyTorch"}
    except Exception as e:
        health["components"]["fl_engine"] = {"status": "UNAVAILABLE", "error": str(e)}
        health["status"] = "DEGRADED"
        
    return health
