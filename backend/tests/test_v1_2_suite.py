import pytest
import uuid
import json
import numpy as np
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import SessionLocal, engine, Base
from app.models.domain import User, Organization, CTIRecord, Feedback, FeedbackEnum, RoleEnum, Incident, IncidentStatusEnum
from app.cti.knowledge_graph import TemporalKnowledgeGraphEngine
from app.relevance.engine_v2 import ThreatShieldScoreV2Engine
from app.trust.adaptive_engine import AdaptiveTrustAndRiskEngine
from fl.server.advanced_strategies import MultiKrumAggregator, ClippedFedAvgAggregator, FedProxAggregator, ClientCollusionDetector

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

# 1. Knowledge Graph & Analytics Tests
def test_v1_2_knowledge_graph_analytics(db_session: Session):
    unique = uuid.uuid4().hex[:6]
    org = Organization(name=f"V12_Graph_Org_{unique}", trust_score=0.90, privacy_budget=9.5)
    db_session.add(org)
    db_session.commit()

    cti1 = CTIRecord(
        type="ipv4-addr",
        value="198.51.100.99",
        description="APT29 Cozy Bear beacon dropping LockBit ransomware on host CVE-2024-3400 T1059",
        severity=9.0,
        confidence=0.95,
        organization_id=org.id
    )
    db_session.add(cti1)
    db_session.commit()

    graph = TemporalKnowledgeGraphEngine.build_full_graph(db_session)
    assert graph["total_nodes"] >= 4
    assert graph["total_edges"] >= 3

    analytics = graph["analytics"]
    assert "degree_centrality" in analytics
    assert "pagerank" in analytics
    assert analytics["total_connected_components"] >= 1
    assert len(analytics["top_central_threat_hubs"]) > 0

    # Shortest threat path traversal
    actor_id = "actor-apt29-cozybear"
    path_res = TemporalKnowledgeGraphEngine.find_shortest_threat_path(db_session, actor_id, str(org.id))
    # Path might or might not exist depending on links, but function should return valid dict
    assert "found" in path_res

# 2. ThreatShield Score v2 Mathematical Bounds
def test_v1_2_threatshield_score_v2_bounds(db_session: Session):
    cti = CTIRecord(
        type="domain-name",
        value="apt29-c2.net",
        description="Active C2 domain",
        severity=8.0,
        confidence=0.90
    )
    org = Organization(name=f"ScoreOrg_{uuid.uuid4().hex[:6]}", trust_score=0.85)

    res = ThreatShieldScoreV2Engine.calculate_threatshield_score_v2(
        cti_record=cti,
        source_org=org,
        recipient_org=org,
        feedback_list=[],
        graph_centrality=0.75
    )

    ts_score = res["threatshield_score_v2"]
    assert 0.0 <= ts_score <= 1.0
    assert res["classification"] in ["CRITICAL_ALERT", "HIGH_PRIORITY", "ELEVATED_MONITORING", "INFORMATIONAL_FEED"]
    assert len(res["explainability_reasons"]) > 0
    assert "quality_contribution" in res["component_breakdown"]

# 3. Adaptive Trust & Organization Risk Score v2
def test_v1_2_organization_risk_score(db_session: Session):
    unique = uuid.uuid4().hex[:6]
    org = Organization(name=f"RiskOrg_{unique}", trust_score=0.30, privacy_budget=2.0)
    db_session.add(org)
    db_session.commit()

    risk_data = AdaptiveTrustAndRiskEngine.calculate_organization_risk_score(db_session, org.id)
    assert 0.0 <= risk_data["risk_score"] <= 100.0
    assert risk_data["risk_tier"] in ["CRITICAL", "HIGH", "ELEVATED", "LOW"]
    assert len(risk_data["reasons"]) > 0

# 4. Incident Investigation Lifecycle API
def test_v1_2_incident_lifecycle():
    unique = uuid.uuid4().hex[:6]
    res_org = client.post("/api/organizations/", json={"name": f"IncOrg_{unique}"})
    org_id = res_org.json()["id"]

    email = f"analyst_inc_{unique}@defense.org"
    pwd = "SecurePassword123!"
    client.post("/api/auth/register", json={"email": email, "password": pwd, "organization_id": org_id, "role": "ANALYST"})
    login_res = client.post("/api/auth/login", data={"username": email, "password": pwd})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Incident
    create_res = client.post("/api/incidents/", json={
        "title": "Suspected APT29 Intrusion in DMZ",
        "description": "Beaconing observed on edge firewall",
        "severity": "CRITICAL",
        "linked_techniques": ["T1071.001", "T1059"]
    }, headers=headers)
    assert create_res.status_code == 200
    inc_id = create_res.json()["id"]

    # List Incidents
    list_res = client.get("/api/incidents/", headers=headers)
    assert list_res.status_code == 200
    assert any(i["id"] == inc_id for i in list_res.json())

    # Update Status
    patch_res = client.patch(f"/api/incidents/{inc_id}/status", json={
        "status": "CONTAINED",
        "resolution_notes": "Firewall rules deployed, C2 IP blocked."
    }, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["new_status"] == "CONTAINED"

# 5. Threat Hunting & ATT&CK Matrix API
def test_v1_2_threat_hunting_api():
    unique = uuid.uuid4().hex[:6]
    res_org = client.post("/api/organizations/", json={"name": f"HuntOrg_{unique}"})
    org_id = res_org.json()["id"]

    email = f"analyst_hunt_{unique}@defense.org"
    pwd = "SecurePassword123!"
    client.post("/api/auth/register", json={"email": email, "password": pwd, "organization_id": org_id, "role": "ANALYST"})
    login_res = client.post("/api/auth/login", data={"username": email, "password": pwd})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Search
    search_res = client.get("/api/threat-hunting/search?q=APT29", headers=headers)
    assert search_res.status_code == 200
    assert "matching_indicators" in search_res.json()

    # ATT&CK Matrix
    matrix_res = client.get("/api/threat-hunting/attack-matrix", headers=headers)
    assert matrix_res.status_code == 200
    assert matrix_res.json()["total_unique_techniques"] >= 1

# 6. Multi-Krum & Client Collusion Detection
def test_v1_2_multikrum_and_collusion():
    tensors = [
        [np.array([1.0, 1.0], dtype=np.float32)],
        [np.array([1.1, 0.9], dtype=np.float32)],
        [np.array([0.9, 1.1], dtype=np.float32)],
        [np.array([50.0, 50.0], dtype=np.float32)], # Colluding 1
        [np.array([50.0, 50.0], dtype=np.float32)]  # Colluding 2 (Sybil)
    ]
    client_ids = ["org1", "org2", "org3", "org4", "org5"]

    # Collusion detector should flag org4 and org5
    col_data = ClientCollusionDetector.detect_collusion(tensors, client_ids)
    assert col_data["collusion_detected"] is True
    assert col_data["collusion_scores"]["org4"] > 0.5
    assert col_data["collusion_scores"]["org5"] > 0.5

    # Multi-Krum should discard the 50.0 outliers and aggregate around ~1.0
    agg_krum = MultiKrumAggregator.aggregate(tensors, f_byzantine=2, m_select=3)
    assert np.all(agg_krum[0] < 5.0)
    assert np.all(agg_krum[0] > 0.5)
