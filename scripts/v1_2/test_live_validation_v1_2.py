import requests
import json
import uuid
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_v1_2_live_system():
    print("=" * 80)
    print("THREATSHIELD v1.2 — LIVE EXTENDED SUBSYSTEM VALIDATION AUDIT")
    print(f"Target Server: {BASE_URL}")
    print("=" * 80)

    # 1. Health check
    h_res = requests.get(f"{BASE_URL}/api/health/")
    assert h_res.status_code == 200
    print(f"[+] Subsystem Health Check: {h_res.json()['status']}")

    # 2. Org & Analyst User
    suffix = uuid.uuid4().hex[:6]
    org_res = requests.post(f"{BASE_URL}/api/organizations/", json={"name": f"V12_Validation_Org_{suffix}"})
    assert org_res.status_code == 200
    org_id = org_res.json()["id"]

    email = f"analyst_v12_{suffix}@defense.org"
    pwd = "SecurePassword123!"
    requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": email,
        "password": pwd,
        "organization_id": org_id,
        "role": "ANALYST"
    })
    token = requests.post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": pwd}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[+] Analyst Authenticated: {email}")

    # 3. Ingest CTI with ATT&CK techniques and CVEs
    cti_payload = {
        "type": "ipv4-addr",
        "value": "198.51.100.188",
        "description": "APT29 Cozy Bear campaign exploiting CVE-2024-3400 with Cobalt Strike beacon T1059.001",
        "severity": 9.2,
        "confidence": 0.95
    }
    cti_res = requests.post(f"{BASE_URL}/api/cti/", json=cti_payload, headers=headers)
    assert cti_res.status_code == 200
    cti_id = cti_res.json()["id"]
    print(f"[+] Advanced CTI Ingested: ID={cti_id}")

    # 4. ThreatShield Decision Score v2 Explainability
    score_res = requests.get(f"{BASE_URL}/api/analytics/score/explain/{cti_id}", headers=headers)
    assert score_res.status_code == 200
    score_data = score_res.json()
    ts_v2 = score_data["threatshield_score_v2"]
    print(f"[+] ThreatShield Score v2: {ts_v2:.4f} ({score_data['classification']})")
    print(f"    Breakdown: Q={score_data['component_breakdown']['quality_contribution']} | T={score_data['component_breakdown']['trust_contribution']} | R={score_data['component_breakdown']['relevance_contribution']} | G={score_data['component_breakdown']['graph_centrality_contribution']}")

    # 5. Incident Lifecycle API
    inc_payload = {
        "title": "Edge Gateway Intrusion Alert",
        "description": "Correlated C2 traffic matching APT29 indicators",
        "severity": "CRITICAL",
        "linked_cti_ids": [cti_id],
        "linked_techniques": ["T1059.001", "T1071.001"]
    }
    inc_res = requests.post(f"{BASE_URL}/api/incidents/", json=inc_payload, headers=headers)
    assert inc_res.status_code == 200
    inc_id = inc_res.json()["id"]
    print(f"[+] Incident Created: ID={inc_id} (Status: {inc_res.json()['incident_status']})")

    # Update Incident Status
    patch_res = requests.patch(f"{BASE_URL}/api/incidents/{inc_id}/status", json={"status": "INVESTIGATING", "resolution_notes": "Forensic isolation in progress"}, headers=headers)
    assert patch_res.status_code == 200
    print(f"[+] Incident Status Advanced: {patch_res.json()['new_status']}")

    # 6. Temporal Knowledge Graph & Analytics
    graph_res = requests.get(f"{BASE_URL}/api/analytics/graph", headers=headers)
    assert graph_res.status_code == 200
    g_data = graph_res.json()
    print(f"[+] Temporal Knowledge Graph: {g_data['total_nodes']} nodes, {g_data['total_edges']} edges")
    print(f"    Graph Analytics: {len(g_data.get('analytics', {}).get('top_central_threat_hubs', []))} central threat hubs identified")

    # 7. Shortest Threat Path Traversal
    path_res = requests.get(f"{BASE_URL}/api/analytics/graph/path?source_id=actor-apt29-cozybear&target_id=malware-cobaltstrike", headers=headers)
    assert path_res.status_code == 200
    print(f"[+] Threat Path Traversal: Found={path_res.json().get('found')} | Explanation: {path_res.json().get('natural_language_explanation', 'No direct path')}")

    # 8. Threat Hunting & ATT&CK Matrix
    hunt_res = requests.get(f"{BASE_URL}/api/threat-hunting/search?q=APT29", headers=headers)
    assert hunt_res.status_code == 200
    print(f"[+] Threat Hunting Search: {len(hunt_res.json()['matching_indicators'])} matching indicators, {len(hunt_res.json()['matching_incidents'])} incidents")

    matrix_res = requests.get(f"{BASE_URL}/api/threat-hunting/attack-matrix", headers=headers)
    assert matrix_res.status_code == 200
    print(f"[+] MITRE ATT&CK Matrix: {matrix_res.json()['total_unique_techniques']} techniques mapped across alliance")

    # 9. Organization Risk Score v2
    risk_res = requests.get(f"{BASE_URL}/api/analytics/organizations/{org_id}/risk", headers=headers)
    assert risk_res.status_code == 200
    risk_data = risk_res.json()
    print(f"[+] Organization Risk Score v2: {risk_data['risk_score']}/100 ({risk_data['risk_tier']})")

    # 10. Security Alerts & Event Correlation
    alerts_res = requests.get(f"{BASE_URL}/api/analytics/security-alerts", headers=headers)
    assert alerts_res.status_code == 200
    print(f"[+] Correlated Security Alerts Stream: {len(alerts_res.json())} active operational alerts")

    print("\n" + "=" * 80)
    print("ALL THREATSHIELD v1.2 EXTENDED SUBSYSTEMS LIVE VERIFIED (100% OPERATIONAL)")
    print("=" * 80)

if __name__ == "__main__":
    test_v1_2_live_system()
