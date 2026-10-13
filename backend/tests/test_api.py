import os
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///./test_suite.db"

import sqlite3
sqlite3.register_adapter(uuid.UUID, lambda u: u.hex)

from app.database import Base, get_db
from app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_suite.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
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

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to ThreatShield API"}

def test_full_api_workflow():
    unique_suffix = uuid.uuid4().hex[:6]
    org_name = f"Org_{unique_suffix}"
    email = f"user_{unique_suffix}@example.com"
    password = "Password123!"

    # 1. Create Organization
    res_org = client.post("/api/organizations/", json={"name": org_name})
    assert res_org.status_code == 200
    org_id = res_org.json()["id"]
    assert res_org.json()["name"] == org_name

    # 2. Register User
    res_reg = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "organization_id": org_id,
            "role": "ANALYST"
        }
    )
    assert res_reg.status_code == 200
    assert res_reg.json()["email"] == email

    # 3. Login
    res_login = client.post(
        "/api/auth/login",
        data={"username": email, "password": password}
    )
    assert res_login.status_code == 200
    assert "access_token" in res_login.json()
    token = res_login.json()["access_token"]

    # 4. Submit CTI
    headers = {"Authorization": f"Bearer {token}"}
    res_cti = client.post(
        "/api/cti/",
        json={
            "type": "ipv4-addr",
            "value": "198.51.100.1",
            "description": "C2 Server",
            "severity": 8.5,
            "confidence": 0.9,
            "source": "Threat Intel Feeder"
        },
        headers=headers
    )
    assert res_cti.status_code == 200
    assert res_cti.json()["value"] == "198.51.100.1"

    # 5. Export STIX Bundle
    res_stix = client.get("/api/cti/export/stix-bundle", headers=headers)
    assert res_stix.status_code == 200
    assert "objects" in res_stix.json()

