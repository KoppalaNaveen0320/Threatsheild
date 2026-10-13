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
from app.relevance.engine_v2 import ThreatShieldScoreV2Engine
from app.trust.adaptive_engine import AdaptiveTrustAndRiskEngine
from app.cti.knowledge_graph import TemporalKnowledgeGraphEngine
from fl.server.advanced_strategies import MultiKrumAggregator, ClippedFedAvgAggregator, FedProxAggregator, ClientCollusionDetector
from fl.server.secure_aggregation import SecureAggregationPrototype
from app.database import SessionLocal, engine, Base
from app.models.domain import CTIRecord, Organization, Feedback

RESULTS_V1_2_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'results', 'v1_2')
os.makedirs(RESULTS_V1_2_DIR, exist_ok=True)

def benchmark_v1_2():
    print("=" * 80)
    print("THREATSHIELD v1.2 — EXTENDED SUBSYSTEM PERFORMANCE BENCHMARK")
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z | Environment: Local Prototype Benchmark")
    print("=" * 80)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    records = []

    def record(subsys, op, iters, duration_ms):
        mean_ms = duration_ms / iters
        ops_sec = (iters / (duration_ms / 1000.0)) if duration_ms > 0 else 0.0
        records.append({
            "subsystem": subsys,
            "operation": op,
            "iterations": iters,
            "total_duration_ms": round(duration_ms, 4),
            "mean_latency_ms": round(mean_ms, 4),
            "throughput_ops_sec": round(ops_sec, 2),
            "measured_environment": "Local Prototype Benchmark (Intel x86_64, Python 3.10.11)"
        })
        print(f"• {subsys} ({op}): {mean_ms:.4f} ms | {ops_sec:.1f} ops/sec")

    # 1. Temporal Knowledge Graph Construction
    t0 = time.perf_counter()
    N_GRAPH = 50
    for _ in range(N_GRAPH):
        _ = TemporalKnowledgeGraphEngine.build_full_graph(db)
    dt = (time.perf_counter() - t0) * 1000.0
    record("Knowledge Graph Engine", "17-entity graph construction & PageRank/centrality analytics", N_GRAPH, dt)

    # 2. Graph Traversal & Shortest Path (BFS)
    t0 = time.perf_counter()
    N_TRAV = 100
    for _ in range(N_TRAV):
        _ = TemporalKnowledgeGraphEngine.find_shortest_threat_path(db, "actor-apt29-cozybear", "malware-cobaltstrike")
    dt = (time.perf_counter() - t0) * 1000.0
    record("Graph Analytics", "Multi-hop shortest threat path traversal & explainability", N_TRAV, dt)

    # 3. ThreatShield Score v2 Calculation
    dummy_cti = type("CTI", (), {
        "id": uuid.uuid4(),
        "type": "domain-name",
        "value": "c2.malicious.net",
        "severity": 8.0,
        "confidence": 0.90,
        "created_at": datetime.utcnow()
    })
    t0 = time.perf_counter()
    N_TS2 = 500
    for _ in range(N_TS2):
        _ = ThreatShieldScoreV2Engine.calculate_threatshield_score_v2(dummy_cti, None, None, [], graph_centrality=0.65)
    dt = (time.perf_counter() - t0) * 1000.0
    record("ThreatShield Score v2", "6-Factor Quality, Trust, Relevance, Freshness, Graph, Sighting scoring", N_TS2, dt)

    # 4. Multi-Client Collusion Detection
    tensors = [
        [np.random.randn(64, 78).astype(np.float32), np.random.randn(64).astype(np.float32)]
        for _ in range(5)
    ]
    t0 = time.perf_counter()
    N_COL = 100
    for _ in range(N_COL):
        _ = ClientCollusionDetector.detect_collusion(tensors, [f"org_{i}" for i in range(5)])
    dt = (time.perf_counter() - t0) * 1000.0
    record("Collusion Detection", "Pairwise cosine matrix & Sybil cluster detection (5 clients)", N_COL, dt)

    # 5. Multi-Krum Aggregation
    t0 = time.perf_counter()
    N_KRUM = 100
    for _ in range(N_KRUM):
        _ = MultiKrumAggregator.aggregate(tensors, f_byzantine=1, m_select=4)
    dt = (time.perf_counter() - t0) * 1000.0
    record("Multi-Krum FL", "Byzantine Euclidean distance matrix & top-m aggregation", N_KRUM, dt)

    # 6. Organization Risk Score v2 Calculation
    dummy_org = db.query(Organization).first()
    org_id_val = dummy_org.id if dummy_org else uuid.uuid4()
    t0 = time.perf_counter()
    N_RISK = 200
    for _ in range(N_RISK):
        _ = AdaptiveTrustAndRiskEngine.calculate_organization_risk_score(db, org_id_val)
    dt = (time.perf_counter() - t0) * 1000.0
    record("Organization Risk Engine", "Multi-vector risk aggregation (Trust, FP, FL anomaly, Privacy)", N_RISK, dt)

    # 7. Security Event Correlation
    t0 = time.perf_counter()
    N_CORR = 100
    for _ in range(N_CORR):
        _ = AdaptiveTrustAndRiskEngine.correlate_security_events(db)
    dt = (time.perf_counter() - t0) * 1000.0
    record("Event Correlation", "Cross-subsystem multi-stage attack sequence correlation", N_CORR, dt)

    # Save to results/v1_2/benchmark_performance.csv
    csv_path = os.path.join(RESULTS_V1_2_DIR, "benchmark_performance.csv")
    with open(csv_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=records[0].keys())
        w.writeheader()
        w.writerows(records)

    print(f"\n[+] Saved v1.2 performance benchmark to: {csv_path}")
    db.close()

if __name__ == "__main__":
    benchmark_v1_2()
