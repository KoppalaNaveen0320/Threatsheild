import requests
from spam_cti import login

BASE_URL = "http://localhost:8000/api"

def replay_attack(token, target_cti_id):
    """
    Simulates a replay attack by fetching an old, trusted CTI bundle and re-submitting
    it to artificially boost reputation or trigger stale defenses.
    """
    headers = {"Authorization": f"Bearer {token}"}
    
    # In a real replay, the attacker intercepts a bundle. Here we query an existing one.
    res = requests.get(f"{BASE_URL}/cti/{target_cti_id}", headers=headers)
    if res.status_code != 200:
        print("Failed to fetch target CTI.")
        return
        
    old_cti = res.json()
    
    # Strip ID and re-submit as new
    payload = {
        "type": old_cti["type"],
        "value": old_cti["value"],
        "description": old_cti["description"] + " (Replayed)",
        "severity": old_cti["severity"],
        "confidence": old_cti["confidence"],
        "source": old_cti["source"]
    }
    
    res2 = requests.post(f"{BASE_URL}/cti/", json=payload, headers=headers)
    print(f"Replay submission status: {res2.status_code}")
    
    # In Phase 9 Evaluation, the system should detect this duplicate hash 
    # in the ledger and flag it, decaying the attacker's trust.

if __name__ == "__main__":
    token = login()
    if token:
        # Requires a valid UUID for a CTI to replay against
        print("Starting Replay Attack Simulator...")
        # replay_attack(token, "some-uuid-here")
    else:
        print("Failed to authenticate.")
