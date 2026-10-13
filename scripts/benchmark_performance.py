import os
import sys
import time
import csv
import json
import numpy as np
from datetime import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database import SessionLocal, engine, Base
from app.models.domain import Organization, User, CTIRecord, LedgerBlock
from app.cti.normalizer import CTINormalizer
from app.cti.stix_mapper import STIX21Engine
from app.ledger.engine import append_to_ledger, verify_ledger
from app.privacy.engine import apply_laplace_noise
from fl.server.strategy import TrustWeightedFedAvg
from fl.server.secure_aggregation import SecureAggregationPrototype

RESULTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'results')
os.makedirs(RESULTS_DIR, exist_ok=True)

def benchmark_all_subsystems():
    print("=" * 70)
    print("THREATSHIELD — CORE SUBSYSTEM PERFORMANCE BENCHMARK")
    print("=" * 70)

    db = SessionLocal()
    benchmark_records = []

    # 1. CTI Normalization Latency
    test_indicators = [
        ("ipv4-addr", "192.168.1.100"),
        ("domain-name", "Malicious-C2-Domain.com."),
        ("file-hash", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
        ("url", "HTTP://malicious.ru:8080/payload.exe"),
        ("email-addr", "attacker@phishing-defense.net")
    ]
    t0 = time.perf_counter()
    for _ in range(500):
        for itype, ival in test_indicators:
            CTINormalizer.normalize_indicator(itype, ival)
    t1 = time.perf_counter()
    norm_latency_ms = ((t1 - t0) / 2500) * 1000
    benchmark_records.append({
        "subsystem": "CTI Normalization Engine",
        "operation": "Normalize & Validate Indicator",
        "iterations": 2500,
        "mean_latency_ms": round(norm_latency_ms, 4),
        "throughput_ops_sec": round(2500 / (t1 - t0), 1)
    })

    # 2. STIX 2.1 Bundle Serialization Latency
    sample_records = [
        type("CTI", (), {"id": f"rec-{i}", "type": "ipv4-addr", "value": f"10.0.0.{i}", "description": "Test", "confidence": 0.9, "created_at": datetime.utcnow()})
        for i in range(10)
    ]
    t0 = time.perf_counter()
    for _ in range(200):
        STIX21Engine.create_stix_bundle(sample_records, "CyberDefense Alpha", "org-alpha-123")
    t1 = time.perf_counter()
    stix_latency_ms = ((t1 - t0) / 200) * 1000
    benchmark_records.append({
        "subsystem": "STIX 2.1 Engine",
        "operation": "Bundle 10 SDOs + SROs",
        "iterations": 200,
        "mean_latency_ms": round(stix_latency_ms, 4),
        "throughput_ops_sec": round(200 / (t1 - t0), 1)
    })

    # 3. Cryptographic Hash-Chain Ledger Block Append Latency
    dummy_payload = {"test_metric": 100, "ioc": "1.2.3.4"}
    t0 = time.perf_counter()
    for i in range(100):
        append_to_ledger(db, "a968bfc7-d199-4535-a6ac-c84b3f7c5055", "BENCHMARK_BLOCK", str(i), dummy_payload)
    t1 = time.perf_counter()
    ledger_insert_ms = ((t1 - t0) / 100) * 1000
    benchmark_records.append({
        "subsystem": "Cryptographic Audit Ledger",
        "operation": "SHA-256 Canonical Block Append",
        "iterations": 100,
        "mean_latency_ms": round(ledger_insert_ms, 4),
        "throughput_ops_sec": round(100 / (t1 - t0), 1)
    })

    # 4. Cryptographic Hash-Chain Chain Verification Latency
    t0 = time.perf_counter()
    for _ in range(50):
        verify_ledger(db)
    t1 = time.perf_counter()
    ledger_verify_ms = ((t1 - t0) / 50) * 1000
    benchmark_records.append({
        "subsystem": "Cryptographic Audit Ledger",
        "operation": "Full Hash-Chain Integrity Verification",
        "iterations": 50,
        "mean_latency_ms": round(ledger_verify_ms, 4),
        "throughput_ops_sec": round(50 / (t1 - t0), 1)
    })

    # 5. Differential Privacy Laplace Noise Query Latency
    t0 = time.perf_counter()
    for _ in range(2000):
        apply_laplace_noise(50.0, 1.0, 0.5)
    t1 = time.perf_counter()
    dp_latency_ms = ((t1 - t0) / 2000) * 1000
    benchmark_records.append({
        "subsystem": "Differential Privacy Engine",
        "operation": "Laplace Noise Mechanism Evaluation",
        "iterations": 2000,
        "mean_latency_ms": round(dp_latency_ms, 4),
        "throughput_ops_sec": round(2000 / (t1 - t0), 1)
    })

    # 6. Secure Aggregation Prototype Latency
    mock_layers = [np.random.randn(128, 78).astype(np.float32), np.random.randn(64, 128).astype(np.float32)]
    client_ids = ["org-1", "org-2", "org-3", "org-4"]
    t0 = time.perf_counter()
    for r in range(100):
        masked_updates = [
            SecureAggregationPrototype.mask_client_update(cid, client_ids, mock_layers, r)
            for cid in client_ids
        ]
        agg = SecureAggregationPrototype.aggregate_masked_updates(masked_updates, [1.0, 1.0, 1.0, 1.0])
    t1 = time.perf_counter()
    secagg_ms = ((t1 - t0) / 100) * 1000
    benchmark_records.append({
        "subsystem": "Secure Aggregation Prototype",
        "operation": "4-Client Pairwise Mask & Unmask Aggregation",
        "iterations": 100,
        "mean_latency_ms": round(secagg_ms, 4),
        "throughput_ops_sec": round(100 / (t1 - t0), 1)
    })

    db.close()

    # Save to CSV
    csv_file = os.path.join(RESULTS_DIR, "benchmark_performance.csv")
    with open(csv_file, mode="w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=benchmark_records[0].keys())
        writer.writeheader()
        writer.writerows(benchmark_records)

    print(f"\n[+] Saved performance benchmark to: {csv_file}\n")
    for r in benchmark_records:
        print(f"• {r['subsystem']} ({r['operation']}): {r['mean_latency_ms']:.4f} ms | {r['throughput_ops_sec']} ops/sec")

if __name__ == "__main__":
    benchmark_all_subsystems()
