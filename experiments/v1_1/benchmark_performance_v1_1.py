import os
import sys
import time
import json
import uuid
import csv
import numpy as np
from datetime import datetime

# Path setup
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))

from app.cti.normalizer import CTINormalizer
from app.cti.stix_mapper import STIX21Engine
from app.ledger.engine import generate_block_hash, verify_ledger, append_to_ledger
from app.privacy.engine import apply_laplace_noise
from app.relevance.engine import RelevanceAndQualityEngine
from app.trust.engine import update_trust_score
from app.cti.correlation import ThreatCorrelationEngine
from fl.server.secure_aggregation import SecureAggregationPrototype
from app.database import SessionLocal, engine, Base
from app.models.domain import CTIRecord, Organization, Feedback

RESULTS_V1_1_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'results', 'v1_1')
os.makedirs(RESULTS_V1_1_DIR, exist_ok=True)

def benchmark_v1_1_subsystems():
    print("=" * 80)
    print("THREATSHIELD v1.1 — SUBSYSTEM PERFORMANCE BENCHMARK")
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z | Host: Windows 11 Enterprise (CPython 3.10.11)")
    print("=" * 80)

    db = SessionLocal()
    benchmark_records = []

    def record_bench(name: str, op_desc: str, iterations: int, duration_ms: float):
        mean_ms = duration_ms / iterations
        ops_sec = (iterations / (duration_ms / 1000.0)) if duration_ms > 0 else 0.0
        benchmark_records.append({
            "subsystem": name,
            "operation": op_desc,
            "iterations": iterations,
            "total_duration_ms": round(duration_ms, 4),
            "mean_latency_ms": round(mean_ms, 4),
            "throughput_ops_sec": round(ops_sec, 2),
            "measured_environment": "Local Prototype Benchmark (Intel x86_64, Python 3.10.11)"
        })
        print(f"• {name} ({op_desc}): {mean_ms:.4f} ms | {ops_sec:.1f} ops/sec")

    # 1. CTI Normalization
    t0 = time.perf_counter()
    N_NORM = 1000
    for _ in range(N_NORM):
        CTINormalizer.normalize_indicator("ipv4-addr", "  198.51.100.45  ")
        CTINormalizer.normalize_indicator("domain-name", "  HTTPS://Evil-C2-Domain.COM/path  ")
        CTINormalizer.normalize_indicator("file-hash", "SHA256:E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855")
    dt = (time.perf_counter() - t0) * 1000.0
    record_bench("CTI Normalizer", "Multi-type validation & syntactic normalization", N_NORM * 3, dt)

    # 2. STIX 2.1 Serialization
    dummy_records = [
        type("CTI", (), {
            "id": uuid.uuid4(),
            "type": "ipv4-addr",
            "value": f"198.51.100.{i}",
            "description": f"C2 Node {i}",
            "confidence": 0.85,
            "created_at": datetime.utcnow(),
            "organization_id": uuid.uuid4()
        })
        for i in range(10)
    ]
    t0 = time.perf_counter()
    N_STIX = 100
    for _ in range(N_STIX):
        bundle = STIX21Engine.create_stix_bundle(dummy_records, "DefenseAlliance Org", str(uuid.uuid4()))
        _ = bundle.serialize()
    dt = (time.perf_counter() - t0) * 1000.0
    record_bench("STIX 2.1 Engine", "SDO + SRO generation & JSON bundle serialization (10 items)", N_STIX, dt)

    # 3. CTI Correlation Graph
    t0 = time.perf_counter()
    N_GRAPH = 50
    for _ in range(N_GRAPH):
        _ = ThreatCorrelationEngine.build_correlation_graph(db)
    dt = (time.perf_counter() - t0) * 1000.0
    record_bench("Correlation Engine", "Multi-entity graph construction & relational analytics", N_GRAPH, dt)

    # 4. Trust Calculation & Explainability
    dummy_org_id = uuid.uuid4()
    t0 = time.perf_counter()
    N_TRUST = 200
    for _ in range(N_TRUST):
        _ = update_trust_score(db, dummy_org_id, 0.90, "Automated Benchmark Feedback", "BENCHMARK_TEST")
    dt = (time.perf_counter() - t0) * 1000.0
    record_bench("Trust Engine", "Bounded EMA update & audit history logging", N_TRUST, dt)

    # 5. Threat Relevance & ThreatShield Score
    dummy_cti = type("CTI", (), {
        "id": uuid.uuid4(),
        "type": "ipv4-addr",
        "value": "203.0.113.5",
        "severity": 8.5,
        "confidence": 0.95,
        "created_at": datetime.utcnow()
    })
    t0 = time.perf_counter()
    N_REL = 500
    for _ in range(N_REL):
        q = RelevanceAndQualityEngine.calculate_cti_quality_score(0.95, datetime.utcnow(), 0.85, 0.90)
        r = RelevanceAndQualityEngine.calculate_relevance_score(dummy_cti, None, sightings_count=3)
        _ = RelevanceAndQualityEngine.calculate_threatshield_score(q["quality_score"], 0.85, r["relevance_score"], 0.95)
    dt = (time.perf_counter() - t0) * 1000.0
    record_bench("Relevance & Decision Engine", "Multi-factor Quality, Relevance, and ThreatShield scoring", N_REL, dt)

    # 6. Differential Privacy
    t0 = time.perf_counter()
    N_DP = 1000
    for _ in range(N_DP):
        apply_laplace_noise(150.0, 1.0, 1.0)
    dt = (time.perf_counter() - t0) * 1000.0
    record_bench("Differential Privacy", "Laplace noise generation & epsilon deduction", N_DP, dt)

    # 7. Cryptographic Audit Ledger Block Append
    t0 = time.perf_counter()
    N_LEDGER = 100
    for i in range(N_LEDGER):
        append_to_ledger(db, str(dummy_org_id), "BENCHMARK_EVENT", str(uuid.uuid4()), {"iteration": i})
    dt = (time.perf_counter() - t0) * 1000.0
    record_bench("Audit Ledger", "SHA-256 canonical hashing & persistent chain append", N_LEDGER, dt)

    # 8. Cryptographic Audit Ledger Full Verification
    t0 = time.perf_counter()
    N_VERIFY = 50
    for _ in range(N_VERIFY):
        verify_ledger(db)
    dt = (time.perf_counter() - t0) * 1000.0
    record_bench("Audit Ledger", "Full cryptographic hash-chain integrity verification", N_VERIFY, dt)

    # 9. Secure Aggregation Prototype
    client_ids = ["org_1", "org_2", "org_3", "org_4"]
    clean_layers = [np.random.randn(64, 78).astype(np.float32), np.random.randn(64).astype(np.float32)]
    t0 = time.perf_counter()
    N_SECAGG = 100
    for _ in range(N_SECAGG):
        masked_updates = [SecureAggregationPrototype.mask_client_update(cid, client_ids, clean_layers, round_num=1) for cid in client_ids]
        _ = SecureAggregationPrototype.aggregate_masked_updates(masked_updates, client_weights=[0.25] * len(client_ids))
    dt = (time.perf_counter() - t0) * 1000.0
    record_bench("Secure Aggregation", "4-Client pairwise mask generation & zero-sum aggregation", N_SECAGG, dt)

    # Save to results/v1_1/benchmark_performance.csv
    csv_path = os.path.join(RESULTS_V1_1_DIR, "benchmark_performance.csv")
    with open(csv_path, mode="w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=benchmark_records[0].keys())
        writer.writeheader()
        writer.writerows(benchmark_records)

    print(f"\n[+] Saved v1.1 performance benchmark to: {csv_path}")
    db.close()

if __name__ == "__main__":
    benchmark_v1_1_subsystems()
