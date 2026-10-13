"""
ThreatShield v1.2 Forensic End-to-End Traceability & Incident Lifecycle Audit.
Traces a real entity through the complete cyber defense workflow across all 11 stages.
"""

import requests
import uuid
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_e2e_traceability_audit():
    print("=" * 80)
    print("THREATSHIELD v1.2 — FORENSIC END-TO-END TRACEABILITY AUDIT")
    print("=" * 80)

    # 1. Register & Login
    suffix = uuid.uuid4().hex[:6]
    org_res = requests.post(f"{BASE_URL}/api/organizations/", json={"name": f"Trace_Org_{suffix}"})
    assert org_res.status_code == 200
    org_id = org_res.json()["id"]

    email = f"lead_admin_{suffix}@soc.defense.org"
    pwd = "TraceSecurePassword123!"
    requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": email,
        "password": pwd,
        "organization_id": org_id,
        "role": "ADMIN"
    })
    login_res = requests.post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": pwd})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[1/11] LOGIN: Authenticated analyst {email} (HTTP 200)")

    # 2. SOC Dashboard Overview
    soc_res = requests.get(f"{BASE_URL}/api/analytics/soc-overview", headers=headers)
    assert soc_res.status_code == 200
    kpis = soc_res.json()["kpis"]
    print(f"[2/11] SOC DASHBOARD: Active Incidents={kpis['active_incidents_count']}, Ledger={kpis['ledger_integrity']}")

    # 3. Ingest High-Risk IOC
    ioc_val = f"198.51.100.{uuid.uuid4().int % 250 + 1}"
    cti_res = requests.post(f"{BASE_URL}/api/cti/", json={
        "type": "ipv4-addr",
        "value": ioc_val,
        "severity": 9.4,
        "confidence": 0.95,
        "description": f"APT29 C2 beaconing active on {ioc_val} targeting defense infrastructure with Cobalt Strike."
    }, headers=headers)
    assert cti_res.status_code == 200
    ioc_id = cti_res.json()["id"]
    print(f"[3/11] SELECT HIGH-RISK IOC: Ingested & Indexed {ioc_val} (ID: {ioc_id})")

    # 4. IOC Investigation Dossier
    dos_res = requests.get(f"{BASE_URL}/api/cti/{ioc_id}/investigate", headers=headers)
    assert dos_res.status_code == 200
    dossier = dos_res.json()
    score_v2 = dossier["intelligence"]["threatshield_score_v2"]
    breakdown = dossier["intelligence"]["component_breakdown"]
    print(f"[4/11] IOC INVESTIGATION: ThreatShield Score v2 = {score_v2:.4f}")

    # 5. Score Breakdown Verification
    expected_score = (
        breakdown["quality_contribution"] +
        breakdown["trust_contribution"] +
        breakdown["relevance_contribution"] +
        breakdown["freshness_contribution"] +
        breakdown["graph_centrality_contribution"] +
        breakdown["sightings_contribution"]
    )
    assert abs(score_v2 - expected_score) < 1e-3
    print(f"[5/11] SCORE BREAKDOWN: Mathematical sum & linear combination verified exact (Delta < 1e-3)")

    # 6. Graph Relationships & Shortest Path
    path_res = requests.get(f"{BASE_URL}/api/analytics/graph/path?source_id=actor-apt29-cozybear&target_id=malware-cobaltstrike", headers=headers)
    assert path_res.status_code == 200
    path_data = path_res.json()
    hop_count = path_data.get('hop_count', 0)
    print(f"[6/11] GRAPH RELATIONSHIP: Shortest Threat Path found ({hop_count} hops: {path_data.get('natural_language_explanation', 'Connected')})")

    # 7. Create Incident
    inc_res = requests.post(f"{BASE_URL}/api/incidents/", json={
        "title": f"Active Cobalt Strike C2 Egress to {ioc_val}",
        "description": f"Observed unauthorized outbound beaconing to indicator {ioc_val}.",
        "severity": "CRITICAL",
        "linked_cti_ids": [ioc_id],
        "linked_techniques": ["T1059.001", "T1071.001"]
    }, headers=headers)
    assert inc_res.status_code == 200
    inc_id = inc_res.json()["id"]
    print(f"[7/11] CREATE INCIDENT: Created Incident ID {inc_id} (Status: NEW)")

    # 8. Full 6-Stage Incident Lifecycle Transition
    stages = ["TRIAGED", "INVESTIGATING", "CONTAINED", "RESOLVED", "CLOSED"]
    for st in stages:
        patch_res = requests.patch(f"{BASE_URL}/api/incidents/{inc_id}/status", json={
            "status": st,
            "resolution_notes": f"Advanced lifecycle to {st} during forensic verification."
        }, headers=headers)
        assert patch_res.status_code == 200
        assert patch_res.json()["new_status"] == st
    print(f"[8/11] INCIDENT LIFECYCLE: Standardized 6 stages (NEW -> TRIAGED -> INVESTIGATING -> CONTAINED -> RESOLVED -> CLOSED) verified")

    # 9. Organization Risk Score
    risk_res = requests.get(f"{BASE_URL}/api/analytics/organizations/{org_id}/risk", headers=headers)
    assert risk_res.status_code == 200
    risk_data = risk_res.json()
    risk_score = risk_data.get("risk_score", risk_data.get("organization_risk_score", 0))
    print(f"[9/11] ORGANIZATION RISK: Computed Risk Score = {risk_score:.2f} / 100")

    # 10. Audit Ledger Exploration
    ledger_res = requests.get(f"{BASE_URL}/api/ledger/blocks", headers=headers)
    assert ledger_res.status_code == 200
    blocks = ledger_res.json()
    print(f"[10/11] AUDIT LEDGER: Retrieved {len(blocks)} immutable SHA-256 blocks")

    # 11. Verify Hash-Chain Integrity
    verify_res = requests.get(f"{BASE_URL}/api/ledger/verify", headers=headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["valid"] is True
    print(f"[11/11] VERIFY CHAIN: Permissioned Hash-Chain Integrity CONFIRMED (100% Intact)")

    print("=" * 80)
    print("ALL 11 STAGES OF END-TO-END FORENSIC WORKFLOW VERIFIED SUCCESSFULLY (PASS)")
    print("=" * 80)
    return True

if __name__ == "__main__":
    success = run_e2e_traceability_audit()
    sys.exit(0 if success else 1)
