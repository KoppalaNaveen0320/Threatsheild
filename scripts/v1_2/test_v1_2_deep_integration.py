import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_deep_integration():
    print("Testing v1.2 Research & Operations API integration...")

    # 1. Health check
    res = requests.get(f"{BASE_URL}/api/health/")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health = res.json()
    print(f"[+] Health: {health.get('version')} ({health.get('status')})")

    # 2. Register & login admin
    import uuid
    rand_id = uuid.uuid4().hex[:6]
    org_res = requests.post(f"{BASE_URL}/api/organizations/", json={
        "name": f"Integration Org {rand_id}",
        "sector": "Defense Industrial Base",
        "region": "US-East",
        "reputation_score": 0.85
    })
    org_id = org_res.json()["id"]

    requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": f"deep_admin_{rand_id}@cyber.org",
        "username": f"deep_admin_{rand_id}",
        "password": "StrongPassword!123",
        "organization_id": org_id,
        "role": "ADMIN"
    })

    login_res = requests.post(f"{BASE_URL}/api/auth/login", data={
        "username": f"deep_admin_{rand_id}@cyber.org",
        "password": "StrongPassword!123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create CTI Indicator
    cti_res = requests.post(f"{BASE_URL}/api/cti/", json={
        "type": "ipv4-addr",
        "value": f"198.51.100.{int(rand_id, 16) % 250 + 1}",
        "confidence": 0.90,
        "severity": 8.5,
        "description": "APT29 Cobalt Strike C2 server targeting critical infrastructure",
        "tlp": "AMBER",
        "tags": ["APT29", "Cobalt Strike", "C2"],
        "threat_actor": "APT29",
        "malware_family": "Cobalt Strike",
        "mitre_attack_id": "T1071.001"
    }, headers=headers)
    assert cti_res.status_code == 200, f"CTI ingestion failed: {cti_res.text}"
    cti_id = cti_res.json()["id"]
    print(f"[+] Ingested CTI: ID={cti_id}")

    # 4. Investigate Dossier (360-degree)
    inv_res = requests.get(f"{BASE_URL}/api/cti/{cti_id}/investigate", headers=headers)
    assert inv_res.status_code == 200, f"Investigate failed: {inv_res.text}"
    dossier = inv_res.json()
    score_v2 = dossier["intelligence"]["threatshield_score_v2"]
    print(f"[+] 360-degree Dossier: ThreatShield Score v2 = {score_v2:.4f}")
    assert "component_breakdown" in dossier["intelligence"]

    # 5. FL Research Experiments CSV endpoint
    fl_exp_res = requests.get(f"{BASE_URL}/api/fl/research/experiments", headers=headers)
    assert fl_exp_res.status_code == 200, f"FL experiments failed: {fl_exp_res.text}"
    experiments = fl_exp_res.json()
    print(f"[+] FL Research Experiments loaded: {len(experiments)} rows from results/v1_2/experiments_v1_2.csv")

    # 6. FL Research Aggregators CSV endpoint
    fl_agg_res = requests.get(f"{BASE_URL}/api/fl/research/aggregators", headers=headers)
    assert fl_agg_res.status_code == 200, f"FL aggregators failed: {fl_agg_res.text}"
    aggregators = fl_agg_res.json()
    print(f"[+] FL Aggregator Benchmarks loaded: {len(aggregators)} algorithms from results/v1_2/aggregator_benchmarks.csv")

    # 7. Privacy Utility Frontier CSV endpoint
    priv_front_res = requests.get(f"{BASE_URL}/api/privacy/utility-frontier", headers=headers)
    assert priv_front_res.status_code == 200, f"Privacy frontier failed: {priv_front_res.text}"
    frontier = priv_front_res.json()
    print(f"[+] Privacy Frontier loaded: {len(frontier)} data points from results/v1_2/privacy_utility_frontier.csv")

    # 8. Security Alert Stream & Resolution
    alerts_res = requests.get(f"{BASE_URL}/api/analytics/security-alerts", headers=headers)
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    print(f"[+] Security Alerts stream retrieved: {len(alerts)} alerts")
    if alerts:
        alert_id = alerts[0]["id"]
        res_patch = requests.patch(f"{BASE_URL}/api/analytics/security-alerts/{alert_id}/resolve", headers=headers)
        assert res_patch.status_code == 200
        print(f"[+] Alert {alert_id} marked as RESOLVED")

    print("\n================================================================================")
    print("ALL v1.2 EXTENDED RESEARCH & OPERATIONS ENDPOINTS VERIFIED (100% OPERATIONAL)")
    print("================================================================================")

if __name__ == "__main__":
    try:
        test_deep_integration()
    except Exception as e:
        print(f"[-] Validation error: {e}")
        sys.exit(1)
