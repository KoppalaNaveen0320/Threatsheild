import os
import uuid
import sqlite3
import pytest
import numpy as np
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///./test_suite.db"
sqlite3.register_adapter(uuid.UUID, lambda u: u.hex)

from app.database import Base, get_db
from app.main import app
from app.security.security import get_password_hash, verify_password
from app.trust.engine import explain_contribution_weight
from app.privacy.engine import get_laplace_scale, consume_privacy_budget
from app.models.domain import Organization
from fl.server.strategy import TrustWeightedFedAvg

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_suite.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

# 1. Password Hashing Security Test
def test_bcrypt_password_hashing():
    pw = "SuperSecurePassword123!"
    hashed = get_password_hash(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

# 2. CTI Normalization and Duplicate Detection Test
def test_cti_normalization_and_duplicate():
    unique = uuid.uuid4().hex[:6]
    org_res = client.post("/api/organizations/", json={"name": f"SecOrg_{unique}"})
    assert org_res.status_code == 200
    org_id = org_res.json()["id"]
    
    user_res = client.post("/api/auth/register", json={
        "email": f"analyst_{unique}@secorga.com",
        "password": "Password123!",
        "organization_id": org_id,
        "role": "ANALYST"
    })
    assert user_res.status_code == 200
    
    login_res = client.post("/api/auth/login", data={"username": f"analyst_{unique}@secorga.com", "password": "Password123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Submit first indicator with extra whitespace and uppercase
    sub1 = client.post("/api/cti/", json={
        "type": "domain-name",
        "value": f"   EVIL-C2-{unique}.ORG   ",
        "description": "Active C2",
        "severity": 8.0,
        "confidence": 0.90
    }, headers=headers)
    assert sub1.status_code == 200
    data1 = sub1.json()
    assert data1["value"] == f"evil-c2-{unique}.org" # Normalized
    assert data1["status"] == "NEW"
    
    # Submit duplicate indicator
    sub2 = client.post("/api/cti/", json={
        "type": "domain-name",
        "value": f"evil-c2-{unique}.org",
        "description": "Duplicate report",
        "severity": 8.0,
        "confidence": 0.90
    }, headers=headers)
    assert sub2.status_code == 200
    data2 = sub2.json()
    assert data2["status"] == "DUPLICATE"

# 3. CTI Correlation Graph Test
def test_cti_correlation_graph():
    unique = uuid.uuid4().hex[:6]
    org_res = client.post("/api/organizations/", json={"name": f"GraphOrg_{unique}"})
    org_id = org_res.json()["id"]
    
    client.post("/api/auth/register", json={
        "email": f"graph_{unique}@test.com",
        "password": "Password123!",
        "organization_id": org_id,
        "role": "ANALYST"
    })
    login_res = client.post("/api/auth/login", data={"username": f"graph_{unique}@test.com", "password": "Password123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    client.post("/api/cti/", json={
        "type": "ipv4-addr",
        "value": "198.51.100.77",
        "severity": 7.0,
        "confidence": 0.85
    }, headers=headers)
    
    graph_res = client.get("/api/cti/correlation/graph", headers=headers)
    assert graph_res.status_code == 200
    graph_data = graph_res.json()
    assert graph_data["total_nodes"] >= 2
    assert graph_data["total_edges"] >= 1

# 4. Trust Explainability & Bounds Test
def test_trust_explainability():
    exp = explain_contribution_weight(trust_score=0.85, quality_score=0.90, anomaly_score=0.02, normalized_weight=0.50)
    assert "Legitimate high-confidence contribution" in exp["explanation"]
    
    exp_penalized = explain_contribution_weight(trust_score=0.30, quality_score=0.20, anomaly_score=0.85, normalized_weight=0.002)
    assert "primarily because" in exp_penalized["explanation"]
    assert "elevated L2 divergence" in exp_penalized["explanation"]

# 5. Differential Privacy Scale & Validation Test
def test_differential_privacy_scale():
    scale = get_laplace_scale(sensitivity=1.0, epsilon=0.5)
    assert scale == 2.0
    
    # Invalid epsilon
    with pytest.raises(ValueError):
        get_laplace_scale(sensitivity=1.0, epsilon=-0.5)

    # Privacy budget deduction
    db = TestingSessionLocal()
    org = Organization(name=f"DP_Org_{uuid.uuid4().hex[:6]}", trust_score=0.5, privacy_budget=1.0, status="ACTIVE")
    db.add(org)
    db.commit()
    db.refresh(org)
    
    consume_privacy_budget(db, org.id, "query_stats", 0.5)
    db.refresh(org)
    assert org.privacy_budget == 0.5
    
    consume_privacy_budget(db, org.id, "query_stats", 0.5)
    db.refresh(org)
    assert org.privacy_budget == 0.0
    
    # Next query must fail with 403
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        consume_privacy_budget(db, org.id, "query_stats", 0.5)
    assert exc_info.value.status_code == 403
    db.close()

# 6. FL Model Update Parameter Validation (NaN / Inf Rejection)
def test_fl_strategy_nan_rejection():
    strat = TrustWeightedFedAvg()
    
    valid_layer = [np.array([1.0, 2.0, 3.0]), np.array([[0.5, 0.5], [0.1, 0.2]])]
    assert strat.validate_client_parameters(valid_layer) is True
    
    nan_layer = [np.array([1.0, np.nan, 3.0])]
    assert strat.validate_client_parameters(nan_layer) is False
    
    inf_layer = [np.array([1.0, np.inf, 3.0])]
    assert strat.validate_client_parameters(inf_layer) is False

# 7. System Health Endpoint Test
def test_system_health_endpoint():
    res = client.get("/api/health/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert "database" in data["components"]
    assert "stix_engine" in data["components"]
    assert "privacy_engine" in data["components"]
    assert "ledger_engine" in data["components"]
    assert "fl_engine" in data["components"]
