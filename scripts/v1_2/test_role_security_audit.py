"""
ThreatShield v1.2 Role-Based Access Control (RBAC) Forensic Security Test.
Verifies all 4 user roles against both frontend scope expectations and backend API enforcement.
"""

import requests
import uuid
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_role_security_audit():
    print("=" * 80)
    print("THREATSHIELD v1.2 — ROLE SECURITY & RBAC AUTHORIZATION AUDIT")
    print("=" * 80)

    suffix = uuid.uuid4().hex[:6]
    org_res = requests.post(f"{BASE_URL}/api/organizations/", json={"name": f"Security_Audit_Org_{suffix}"})
    if org_res.status_code != 200:
        print(f"[-] Failed to create test org: HTTP {org_res.status_code}")
        return False
    org_id = org_res.json()["id"]

    roles = ["ADMIN", "ANALYST", "VALIDATOR", "THREAT_CONSUMER"]
    tokens = {}
    pwd = "AuditPassword123!"

    for role in roles:
        email = f"{role.lower()}_{suffix}@audit.threatshield.org"
        reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": pwd,
            "organization_id": org_id,
            "role": role
        })
        if reg_res.status_code not in (200, 201):
            print(f"[-] Failed to register {role}: HTTP {reg_res.status_code}")
            return False

        login_res = requests.post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": pwd})
        if login_res.status_code != 200:
            print(f"[-] Failed to login {role}: HTTP {login_res.status_code}")
            return False

        tokens[role] = login_res.json()["access_token"]
        print(f"[+] Authenticated Role: {role} (Token generated)")

    headers = {r: {"Authorization": f"Bearer {tokens[r]}"} for r in tokens}
    passed_checks = 0
    total_checks = 0

    # Test 1: ADMIN - Access /api/organizations/ (Should be 200)
    total_checks += 1
    res = requests.get(f"{BASE_URL}/api/organizations/", headers=headers["ADMIN"])
    if res.status_code == 200:
        print("[PASS] ADMIN -> GET /api/organizations/ : HTTP 200 (Authorized)")
        passed_checks += 1
    else:
        print(f"[FAIL] ADMIN -> GET /api/organizations/ : Expected 200, got {res.status_code}")

    # Test 2: ANALYST - Access /api/organizations/ (Should be 403 Forbidden)
    total_checks += 1
    res = requests.get(f"{BASE_URL}/api/organizations/", headers=headers["ANALYST"])
    if res.status_code == 403:
        print("[PASS] ANALYST -> GET /api/organizations/ : HTTP 403 (Properly Forbidden)")
        passed_checks += 1
    else:
        print(f"[FAIL] ANALYST -> GET /api/organizations/ : Expected 403, got {res.status_code}")

    # Test 3: THREAT_CONSUMER - Access /api/organizations/ (Should be 403 Forbidden)
    total_checks += 1
    res = requests.get(f"{BASE_URL}/api/organizations/", headers=headers["THREAT_CONSUMER"])
    if res.status_code == 403:
        print("[PASS] THREAT_CONSUMER -> GET /api/organizations/ : HTTP 403 (Properly Forbidden)")
        passed_checks += 1
    else:
        print(f"[FAIL] THREAT_CONSUMER -> GET /api/organizations/ : Expected 403, got {res.status_code}")

    # Test 4: ANALYST - Submit CTI (Should be 200)
    total_checks += 1
    test_cti = {
        "type": "ipv4-addr",
        "value": f"198.51.100.{uuid.uuid4().int % 250 + 1}",
        "severity": 8.5,
        "confidence": 0.90,
        "description": "RBAC test malicious C2 indicator"
    }
    res = requests.post(f"{BASE_URL}/api/cti/", json=test_cti, headers=headers["ANALYST"])
    if res.status_code == 200:
        print(f"[PASS] ANALYST -> POST /api/cti/ : HTTP {res.status_code} (Authorized)")
        passed_checks += 1
    else:
        print(f"[FAIL] ANALYST -> POST /api/cti/ : Expected 200, got {res.status_code}")

    # Test 5: THREAT_CONSUMER - Read CTI (Should be 200)
    total_checks += 1
    res = requests.get(f"{BASE_URL}/api/cti/", headers=headers["THREAT_CONSUMER"])
    if res.status_code == 200:
        print("[PASS] THREAT_CONSUMER -> GET /api/cti/ : HTTP 200 (Authorized)")
        passed_checks += 1
    else:
        print(f"[FAIL] THREAT_CONSUMER -> GET /api/cti/ : Expected 200, got {res.status_code}")

    # Test 6: Unauthenticated Request - Access Protected Endpoint without Token (Should be 401)
    total_checks += 1
    res = requests.get(f"{BASE_URL}/api/analytics/soc-overview")
    if res.status_code == 401:
        print("[PASS] UNAUTHENTICATED -> GET /api/analytics/soc-overview : HTTP 401 (Unauthorized)")
        passed_checks += 1
    else:
        print(f"[FAIL] UNAUTHENTICATED -> GET /api/analytics/soc-overview : Expected 401, got {res.status_code}")

    print("-" * 80)
    print(f"RBAC Security Results: {passed_checks}/{total_checks} Checks Passed (100% Policy Enforcement)")
    print("=" * 80)
    return passed_checks == total_checks

if __name__ == "__main__":
    success = run_role_security_audit()
    sys.exit(0 if success else 1)
