import pytest
import uuid
import json
import numpy as np
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import SessionLocal, engine, Base
from app.models.domain import User, Organization, CTIRecord, Feedback, FeedbackEnum, RoleEnum
from app.cti.correlation import ThreatCorrelationEngine
from app.cti.normalizer import CTINormalizer
from fl.server.strategy import CoordinateMedianFedAvg, TrimmedMeanFedAvg, TrustWeightedFedAvg

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

# 1. Multi-Entity Correlation Graph Tests
def test_v1_1_correlation_graph_filtering(db_session: Session):
    unique = uuid.uuid4().hex[:6]
    org = Organization(name=f"V11_Graph_Org_{unique}", trust_score=0.88, privacy_budget=10.0)
    db_session.add(org)
    db_session.commit()
    db_session.refresh(org)

    cti1 = CTIRecord(
        type="ipv4-addr",
        value="198.51.100.22",
        description="Cobalt Strike beacon active on host CVE-2024-1234 T1059.001",
        severity=9.0,
        confidence=0.95,
        status="NEW",
        organization_id=org.id
    )
    db_session.add(cti1)
    db_session.commit()

    graph = ThreatCorrelationEngine.build_correlation_graph(db_session, min_severity=7.0)
    node_types = {n["type"] for n in graph["nodes"]}
    assert "organization" in node_types
    assert "indicator" in node_types
    assert "malware" in node_types
    assert "threat-actor" in node_types
    assert "vulnerability" in node_types
    assert "attack-pattern" in node_types

    summary = graph["graph_summary"]
    assert summary["total_nodes"] >= 5
    assert summary["correlated_vulnerabilities"] >= 1

# 2. CTI Normalization and Duplicate Case Invariance
def test_v1_1_cti_deduplication_case_insensitivity():
    norm1 = CTINormalizer.normalize_indicator("domain-name", "  HTTPS://Evil-C2-Domain.COM/path  ")
    norm2 = CTINormalizer.normalize_indicator("domain-name", "evil-c2-domain.com")
    assert norm1.is_valid is True
    assert norm2.is_valid is True
    assert norm1.normalized_value == norm2.normalized_value == "evil-c2-domain.com"

# 3. Robust Aggregators (Coordinate-wise Median & Trimmed Mean)
def test_v1_1_robust_aggregation_strategies():
    # 5 clients: 4 clean, 1 extreme scaled poisoner
    clean_client_1 = [np.array([[1.0, 2.0], [3.0, 4.0]], dtype=np.float32)]
    clean_client_2 = [np.array([[1.1, 1.9], [2.9, 4.1]], dtype=np.float32)]
    clean_client_3 = [np.array([[0.9, 2.1], [3.1, 3.9]], dtype=np.float32)]
    clean_client_4 = [np.array([[1.0, 2.0], [3.0, 4.0]], dtype=np.float32)]
    poisoned_client_5 = [np.array([[1000.0, -1000.0], [5000.0, -5000.0]], dtype=np.float32)]

    stacked_pool = [clean_client_1, clean_client_2, clean_client_3, clean_client_4, poisoned_client_5]

    # Coordinate Median
    stacked_tensors = np.stack([p[0] for p in stacked_pool], axis=0)
    median_layer = np.median(stacked_tensors, axis=0)
    # The median must not be influenced by the 1000.0 poisoner
    assert np.all(median_layer < 5.0)
    assert np.all(median_layer > 0.5)

    # Trimmed Mean (beta=0.20 trims 1 top and 1 bottom from 5 clients)
    sorted_tensors = np.sort(stacked_tensors, axis=0)
    trimmed_layer = np.mean(sorted_tensors[1:4], axis=0)
    assert np.all(trimmed_layer < 5.0)
    assert np.all(trimmed_layer > 0.5)

# 4. RBAC Permission Tier Validation
def test_v1_1_rbac_tier_authorization():
    unique = uuid.uuid4().hex[:6]
    res_org = client.post("/api/organizations/", json={"name": f"RBAC_Org_{unique}"})
    org_id = res_org.json()["id"]

    roles = ["ADMIN", "ANALYST", "VALIDATOR", "THREAT_CONSUMER"]
    headers_map = {}

    for r in roles:
        email = f"user_{r.lower()}_{unique}@defense.org"
        pwd = "SecurePassword123!"
        client.post("/api/auth/register", json={
            "email": email,
            "password": pwd,
            "organization_id": org_id,
            "role": r
        })
        login_res = client.post("/api/auth/login", data={"username": email, "password": pwd})
        token = login_res.json()["access_token"]
        headers_map[r] = {"Authorization": f"Bearer {token}"}

    # ADMIN: Full platform access
    res_admin = client.get("/api/organizations/", headers=headers_map["ADMIN"])
    assert res_admin.status_code == 200

    # ANALYST: Cannot access all organizations
    res_analyst = client.get("/api/organizations/", headers=headers_map["ANALYST"])
    assert res_analyst.status_code == 403

    # VALIDATOR: Can query CTI
    res_val = client.get("/api/cti/", headers=headers_map["VALIDATOR"])
    assert res_val.status_code == 200

# 5. Security Telemetry Stream Test
def test_v1_1_security_events_stream():
    unique = uuid.uuid4().hex[:6]
    res_org = client.post("/api/organizations/", json={"name": f"SecEvent_Org_{unique}"})
    org_id = res_org.json()["id"]

    email = f"admin_event_{unique}@defense.org"
    pwd = "SecurePassword123!"
    client.post("/api/auth/register", json={"email": email, "password": pwd, "organization_id": org_id, "role": "ADMIN"})
    login_res = client.post("/api/auth/login", data={"username": email, "password": pwd})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Query security events
    res_events = client.get("/api/security-events/", headers=headers)
    assert res_events.status_code == 200
    events = res_events.json()
    assert isinstance(events, list)
