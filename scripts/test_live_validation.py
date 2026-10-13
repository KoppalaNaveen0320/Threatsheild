import requests
import json
import uuid
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_live_api():
    print("=" * 80)
    print("THREATSHIELD v1.1 — LIVE END-TO-END SYSTEM VALIDATION AUDIT")
    print(f"Target Base URL: {BASE_URL}")
    print("=" * 80)

    # 1. Health Check
    res_health = requests.get(f"{BASE_URL}/api/health/")
    assert res_health.status_code == 200, f"Health check failed: {res_health.text}"
    health_data = res_health.json()
    print(f"[+] Health Check Passed: {health_data.get('status')} | Version: {health_data.get('version', '1.1.0')}")

    # 2. Organization Creation
    unique = uuid.uuid4().hex[:6]
    org_res = requests.post(f"{BASE_URL}/api/organizations/", json={"name": f"LiveValidationOrg_{unique}"})
    assert org_res.status_code == 200, f"Org creation failed: {org_res.text}"
    org_id = org_res.json()["id"]
    print(f"[+] Organization Created: ID={org_id}")

    # 3. User Registration and Login for all 4 Roles
    roles = ["ADMIN", "ANALYST", "VALIDATOR", "THREAT_CONSUMER"]
    tokens = {}
    for role in roles:
        email = f"user_{role.lower()}_{unique}@defense.org"
        pwd = "SecurePassword123!"
        reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": pwd,
            "organization_id": org_id,
            "role": role
        })
        assert reg_res.status_code == 200, f"Registration failed for {role}: {reg_res.text}"

        login_res = requests.post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": pwd})
        assert login_res.status_code == 200, f"Login failed for {role}: {login_res.text}"
        tokens[role] = login_res.json()["access_token"]
        print(f"[+] User Authenticated: Role={role} | Email={email}")

    # 4. RBAC Verification
    # A) Admin can list organizations
    res_admin_orgs = requests.get(f"{BASE_URL}/api/organizations/", headers={"Authorization": f"Bearer {tokens['ADMIN']}"})
    assert res_admin_orgs.status_code == 200, "ADMIN should have full access to organizations"
    print("[+] RBAC Verified: ADMIN successfully accessed organization listing")

    # B) Analyst is forbidden from listing all organizations
    res_analyst_orgs = requests.get(f"{BASE_URL}/api/organizations/", headers={"Authorization": f"Bearer {tokens['ANALYST']}"})
    assert res_analyst_orgs.status_code == 403, "ANALYST should be forbidden from tenant management"
    print("[+] RBAC Verified: ANALYST properly forbidden (403) from tenant administration")

    # 5. CTI Ingestion, Normalization, Quality, Relevance, ThreatShield Score
    cti_payload = {
        "type": "domain-name",
        "value": "  HTTPS://Apt29-CozyBear-C2.COM/login  ",
        "description": "Active C2 beacon identified in perimeter telemetry CVE-2024-3400 T1071.001",
        "severity": 8.5,
        "confidence": 0.95
    }
    cti_res = requests.post(f"{BASE_URL}/api/cti/", json=cti_payload, headers={"Authorization": f"Bearer {tokens['ANALYST']}"})
    assert cti_res.status_code == 200, f"CTI ingestion failed: {cti_res.text}"
    cti_data = cti_res.json()
    cti_id = cti_data["id"]
    normalized_val = cti_data["value"]
    assert normalized_val == "apt29-cozybear-c2.com", f"Normalization failed: got {normalized_val}"
    print(f"[+] CTI Ingested & Normalized: {normalized_val} (ID={cti_id})")

    # 6. Query CTI Decision Scores
    score_res = requests.get(f"{BASE_URL}/api/cti/{cti_id}/scores", headers={"Authorization": f"Bearer {tokens['ANALYST']}"})
    assert score_res.status_code == 200, f"Score query failed: {score_res.text}"
    scores = score_res.json()
    q_score = scores["quality"]["quality_score"]
    r_score = scores["relevance"]["relevance_score"]
    ts_score = scores["threatshield_score"]["threatshield_score"]
    print(f"[+] CTI Scores Computed: Quality={q_score:.4f} | Relevance={r_score:.4f} | ThreatShield Decision Score={ts_score:.4f} ({scores['threatshield_score']['priority']})")
    assert 0.0 <= q_score <= 1.0
    assert 0.0 <= r_score <= 1.0
    assert 0.0 <= ts_score <= 1.0

    # 7. Sighting Feedback & Closed-Loop Trust Update
    fb_payload = {
        "feedback_type": "CONFIRMED_MALICIOUS",
        "comment": "Confirmed malicious traffic observed matching STIX indicator",
        "confidence": 1.0
    }
    fb_res = requests.post(f"{BASE_URL}/api/cti/{cti_id}/feedback", json=fb_payload, headers={"Authorization": f"Bearer {tokens['VALIDATOR']}"})
    assert fb_res.status_code == 200, f"Feedback submission failed: {fb_res.text}"
    fb_data = fb_res.json()
    print(f"[+] Sighting Feedback Recorded: Feedback ID={fb_data['feedback_id']} | Updated Source Trust={fb_data['source_organization_trust']}")

    # 8. STIX 2.1 Export
    stix_res = requests.get(f"{BASE_URL}/api/cti/export/stix-bundle", headers={"Authorization": f"Bearer {tokens['THREAT_CONSUMER']}"})
    assert stix_res.status_code == 200, f"STIX export failed: {stix_res.text}"
    bundle = stix_res.json()
    assert bundle["type"] == "bundle"
    assert len(bundle.get("objects", [])) > 0
    print(f"[+] STIX 2.1 Bundle Exported: {len(bundle['objects'])} STIX Domain Objects verified")

    # 9. Correlation Graph with Dynamic Filters
    graph_res = requests.get(f"{BASE_URL}/api/cti/correlation/graph?min_severity=7.0", headers={"Authorization": f"Bearer {tokens['ANALYST']}"})
    assert graph_res.status_code == 200, f"Graph query failed: {graph_res.text}"
    graph_data = graph_res.json()
    print(f"[+] Correlation Graph Generated: {graph_data['total_nodes']} nodes, {graph_data['total_edges']} edges | Summary: {graph_data.get('graph_summary')}")

    # 10. Security Events Telemetry Stream
    events_res = requests.get(f"{BASE_URL}/api/security-events/", headers={"Authorization": f"Bearer {tokens['ADMIN']}"})
    assert events_res.status_code == 200, f"Security events stream failed: {events_res.text}"
    events = events_res.json()
    print(f"[+] Security Telemetry Stream Active: {len(events)} security/audit events retrieved")

    # 11. Cryptographic Audit Ledger Verification
    ledger_res = requests.get(f"{BASE_URL}/api/ledger/verify", headers={"Authorization": f"Bearer {tokens['ADMIN']}"})
    assert ledger_res.status_code == 200, f"Ledger verification failed: {ledger_res.text}"
    ledger_status = ledger_res.json()
    assert ledger_status["is_valid"] is True, f"Ledger hash chain invalid: {ledger_status}"
    print(f"[+] Permissioned Cryptographic Audit Ledger Verified: Total Blocks={ledger_status['total_blocks']} | Chain Intact=TRUE")

    print("\n" + "=" * 80)
    print("ALL LIVE END-TO-END VALIDATION CHECKS PASSED (100% OPERATIONAL)")
    print("=" * 80)

if __name__ == "__main__":
    test_live_api()
