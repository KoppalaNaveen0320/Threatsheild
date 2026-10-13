import requests
import random
import time

BASE_URL = "http://localhost:8000/api"

def login():
    # Helper to login as attacker
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": "user@orga.com", "password": "password123"})
    if res.status_code == 200:
        return res.json()["access_token"]
    return None

def spam_fake_cti(token, count=100):
    headers = {"Authorization": f"Bearer {token}"}
    for i in range(count):
        fake_ip = f"{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}"
        payload = {
            "type": "ipv4-addr",
            "value": fake_ip,
            "description": "Fake CTI Spam",
            "severity": random.uniform(1.0, 10.0),
            "confidence": 0.1,
            "source": "SpamBot"
        }
        res = requests.post(f"{BASE_URL}/cti/", json=payload, headers=headers)
        print(f"[{i}] Status: {res.status_code}")
        time.sleep(0.1)

if __name__ == "__main__":
    token = login()
    if token:
        print("Starting CTI Spam Attack...")
        spam_fake_cti(token, 50)
    else:
        print("Failed to authenticate.")
