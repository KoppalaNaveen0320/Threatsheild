import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///./test_suite.db"

import sqlite3
sqlite3.register_adapter(uuid.UUID, lambda u: u.hex)

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database import Base, get_db
from app.main import app
from app.models.domain import RoleEnum, Organization, CTIRecord, Feedback, FeedbackEnum
from app.trust.engine import update_trust_score, calculate_cti_quality
from app.privacy.engine import apply_laplace_noise, consume_privacy_budget
from app.ledger.engine import verify_ledger

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

def test_complete_threatshield_lifecycle():
    """
    Validates complete end-to-end lifecycle:
    Org Registration -> Admin User Creation -> Login -> JWT -> Role Auth ->
    CTI Submission -> STIX 2.1 Serialization -> Storage -> Search ->
    Feedback Submission -> Trust Update -> Privacy Budget & DP Noise ->
    Ledger Block Logging -> Cryptographic Chain Verification.
    """
    db = TestingSessionLocal()
    
    # 1. Organization Registration
    suffix = uuid.uuid4().hex[:6]
    org_name = f"CyberDefense_Org_{suffix}"
    res_org = client.post("/api/organizations/", json={"name": org_name})
    assert res_org.status_code == 200
    org_data = res_org.json()
    org_id = org_data["id"]
    assert org_data["name"] == org_name
    assert org_data["trust_score"] == 0.5
    assert org_data["privacy_budget"] == 10.0

    # 2. Admin User Creation
    admin_email = f"admin_{suffix}@cyberdefense.org"
    admin_password = "SecurePassword123!"
    res_user = client.post(
        "/api/auth/register",
        json={
            "email": admin_email,
            "password": admin_password,
            "organization_id": org_id,
            "role": "ADMIN"
        }
    )
    assert res_user.status_code == 200
    user_data = res_user.json()
    user_id = user_data["id"]
    assert user_data["email"] == admin_email
    assert user_data["role"] == "ADMIN"

    # 3. Login & JWT Generation
    res_login = client.post(
        "/api/auth/login",
        data={"username": admin_email, "password": admin_password}
    )
    assert res_login.status_code == 200
    token_data = res_login.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Role Authorization (Admin accessing organization list)
    res_orgs = client.get("/api/organizations/?limit=1000", headers=headers)
    assert res_orgs.status_code == 200
    assert any(str(o["id"]).replace("-", "") == str(org_id).replace("-", "") for o in res_orgs.json())

    # 5. CTI Submission
    res_cti = client.post(
        "/api/cti/",
        json={
            "type": "ipv4-addr",
            "value": "203.0.113.195",
            "description": "Observed active CobaltStrike Beacon",
            "severity": 9.2,
            "confidence": 0.95,
            "source": "ThreatShield Sensor Alpha"
        },
        headers=headers
    )
    assert res_cti.status_code == 200
    cti_data = res_cti.json()
    cti_id = cti_data["id"]
    assert cti_data["value"] == "203.0.113.195"
    assert cti_data["status"] == "NEW"

    # 6. STIX 2.1 Bundle Conversion & Export
    res_stix = client.get("/api/cti/export/stix-bundle", headers=headers)
    assert res_stix.status_code == 200
    stix_bundle = res_stix.json()
    assert stix_bundle["type"] == "bundle"
    assert "objects" in stix_bundle
    # Check that identity and indicator exist
    types = [obj["type"] for obj in stix_bundle["objects"]]
    assert "identity" in types
    assert "indicator" in types

    # 7. CTI Search & Retrieval
    res_search = client.get("/api/cti/?limit=1000", headers=headers)
    assert res_search.status_code == 200
    assert any(str(c["id"]).replace("-", "") == str(cti_id).replace("-", "") for c in res_search.json())

    res_single = client.get(f"/api/cti/{cti_id}", headers=headers)
    assert res_single.status_code == 200
    assert res_single.json()["value"] == "203.0.113.195"

    # 8. Feedback & Trust Score Update
    db.close()
    db = TestingSessionLocal()
    # Direct feedback calculation: peer confirms malicious
    fb = Feedback(
        cti_id=uuid.UUID(cti_id),
        organization_id=uuid.UUID(org_id),
        user_id=uuid.UUID(user_id),
        feedback_type=FeedbackEnum.CONFIRMED_MALICIOUS,
        confidence=1.0,
        comment="Confirmed IOC against SOC honeypot telemetry"
    )
    db.add(fb)
    db.commit()

    quality = calculate_cti_quality(db, cti_id)
    assert quality == 1.0

    new_trust = update_trust_score(db, org_id, quality, "Peer confirmed malicious CTI")
    # T_new = 0.5 * (1 - 0.15) + 0.15 * 1.0 = 0.425 + 0.15 = 0.575
    assert abs(new_trust - 0.575) < 1e-4

    # 9. Privacy Budget Tracking & Laplace Differential Privacy Noise
    res_budget_before = client.get("/api/privacy/budget", headers=headers)
    assert res_budget_before.status_code == 200
    budget_val_before = res_budget_before.json()["privacy_budget"]

    res_privacy_stats = client.get("/api/privacy/stats", headers=headers)
    assert res_privacy_stats.status_code == 200
    privacy_stats = res_privacy_stats.json()
    assert privacy_stats["mechanism"] == "laplace"
    assert privacy_stats["epsilon_consumed"] == 0.5

    res_budget_after = client.get("/api/privacy/budget", headers=headers)
    assert res_budget_after.status_code == 200
    budget_val_after = res_budget_after.json()["privacy_budget"]
    assert budget_val_after == budget_val_before - 0.5

    # 10. Audit Ledger Verification
    res_ledger_verify = client.get("/api/ledger/verify", headers=headers)
    assert res_ledger_verify.status_code == 200
    assert res_ledger_verify.json()["valid"] is True

    res_blocks = client.get("/api/ledger/blocks", headers=headers)
    assert res_blocks.status_code == 200
    assert len(res_blocks.json()) >= 1
    
    db.close()
