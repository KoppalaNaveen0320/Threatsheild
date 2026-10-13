import pytest
import numpy as np
import uuid
from datetime import datetime, timedelta
import torch

from app.database import Base, engine, SessionLocal
from app.models.domain import Organization, User, CTIRecord, LedgerBlock, Feedback, FeedbackEnum, RoleEnum
from app.cti.normalizer import CTINormalizer
from app.cti.stix_mapper import STIX21Engine
from app.relevance.engine import (
    RelevanceAndQualityEngine,
    WEIGHT_CONFIDENCE,
    WEIGHT_FRESHNESS,
    WEIGHT_SOURCE_TRUST,
    WEIGHT_HISTORICAL_USEFULNESS,
    ALPHA_QUALITY,
    BETA_SOURCE_TRUST,
    GAMMA_RELEVANCE,
    DELTA_FRESHNESS
)
from app.trust.engine import (
    update_trust_score,
    calculate_cti_quality,
    explain_organization_trust,
    explain_contribution_weight
)
from app.privacy.engine import apply_laplace_noise, get_laplace_scale, consume_privacy_budget
from app.ledger.engine import append_to_ledger, verify_ledger, generate_block_hash
from app.security.replay import ReplayProtectionEngine
from fl.server.strategy import TrustWeightedFedAvg
from fl.server.secure_aggregation import SecureAggregationPrototype
from fl.simulation.attacks import AdversarialAttackSimulator

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

# 1. Mathematical Constraint Assertions
def test_mathematical_score_bounds():
    # Quality weights sum to 1.0
    assert abs((WEIGHT_CONFIDENCE + WEIGHT_FRESHNESS + WEIGHT_SOURCE_TRUST + WEIGHT_HISTORICAL_USEFULNESS) - 1.0) < 1e-6
    # ThreatShield weights sum to 1.0
    assert abs((ALPHA_QUALITY + BETA_SOURCE_TRUST + GAMMA_RELEVANCE + DELTA_FRESHNESS) - 1.0) < 1e-6

    # Test range for Quality Score: 0 <= Q <= 1
    for conf in [0.0, 0.5, 1.0]:
        for trust in [0.0, 0.5, 1.0]:
            q_res = RelevanceAndQualityEngine.calculate_cti_quality_score(
                confidence=conf,
                created_at=datetime.utcnow(),
                source_trust=trust,
                feedback_ratio=0.75
            )
            q = q_res["quality_score"]
            assert 0.0 <= q <= 1.0

    # Test range for Relevance Score: 0 <= R <= 1
    class DummyCTI:
        severity = 8.5
        confidence = 0.95
        created_at = datetime.utcnow()

    r_res = RelevanceAndQualityEngine.calculate_relevance_score(DummyCTI(), sightings_count=3)
    r = r_res["relevance_score"]
    assert 0.0 <= r <= 1.0

    # Test range for ThreatShield Score: 0 <= TS <= 1
    ts_res = RelevanceAndQualityEngine.calculate_threatshield_score(
        quality_score=0.85,
        source_trust=0.90,
        relevance_score=0.80,
        freshness=0.95
    )
    ts = ts_res["threatshield_score"]
    assert 0.0 <= ts <= 1.0

# 2. CTI Normalization and Validation Tests
def test_cti_normalizer_suite():
    # IPv4 Normalization
    loopback_res = CTINormalizer.normalize_indicator("ipv4-addr", "  127.0.0.1  ")
    assert loopback_res.is_valid is True
    assert loopback_res.normalized_value == "127.0.0.1"
    assert loopback_res.status == "SUSPICIOUS" # Loopback address

    # Public IPv4
    pub_ip = CTINormalizer.normalize_indicator("ipv4-addr", "198.51.100.45")
    assert pub_ip.is_valid is True
    assert pub_ip.status == "NORMALIZED"

    # Malformed IPv4
    invalid_ip = CTINormalizer.normalize_indicator("ipv4-addr", "999.999.999.999")
    assert invalid_ip.is_valid is False
    assert invalid_ip.status == "INVALID"

    # Domain Normalization
    dom_res = CTINormalizer.normalize_indicator("domain-name", "  HTTPS://Evil-C2-Domain.COM/path  ")
    assert dom_res.is_valid is True
    assert dom_res.normalized_value == "evil-c2-domain.com"

    # Hash Normalization (SHA-256)
    hash_res = CTINormalizer.normalize_indicator("file-hash", "SHA256:E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855")
    assert hash_res.is_valid is True
    assert hash_res.normalized_value == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

    # URL Normalization
    url_res = CTINormalizer.normalize_indicator("url", "http://Malicious.RU:8080/drop.exe")
    assert url_res.is_valid is True
    assert "malicious.ru:8080" in url_res.normalized_value

# 3. STIX 2.1 Engine Tests
def test_stix_21_bundle_and_relationships(db_session):
    records = [
        type("CTI", (), {"id": uuid.uuid4(), "type": "ipv4-addr", "value": "198.51.100.1", "description": "C2 IP", "confidence": 0.95, "created_at": datetime.utcnow(), "organization_id": uuid.uuid4()}),
        type("CTI", (), {"id": uuid.uuid4(), "type": "domain-name", "value": "apt-c2-server.org", "description": "APT Domain", "confidence": 0.88, "created_at": datetime.utcnow(), "organization_id": uuid.uuid4()})
    ]

    bundle = STIX21Engine.create_stix_bundle(records, "CyberDefense Alpha", str(uuid.uuid4()))
    bundle_json = bundle.serialize()
    assert "identity--" in bundle_json
    assert "indicator--" in bundle_json
    assert "relationship--" in bundle_json

    is_valid, parsed, errors = STIX21Engine.parse_and_validate_stix_bundle(bundle_json)
    assert is_valid is True
    assert len(parsed) == 2
    assert len(errors) == 0

# 4. Multi-Factor Trust & Explainability Tests
def test_trust_engine_and_feedback_loop(db_session):
    unique_name = f"Test_Org_Defense_{uuid.uuid4().hex[:6]}"
    org = Organization(name=unique_name, trust_score=0.70, privacy_budget=10.0)
    db_session.add(org)
    db_session.commit()
    db_session.refresh(org)

    # Trust update
    new_t = update_trust_score(db_session, org.id, 1.0, "Successful peer validation", "VALIDATION_SUCCESS")
    assert 0.0 <= new_t <= 1.0
    assert new_t > 0.70 # Positive evaluation should increase score

    # Explainability
    exp = explain_organization_trust(db_session, org.id)
    assert "trust_score" in exp
    assert "positive_factors" in exp
    assert "recent_audit_trail" in exp
    assert len(exp["recent_audit_trail"]) > 0

# 5. Differential Privacy Engine Tests
def test_privacy_laplace_accounting(db_session):
    unique_name = f"Privacy_Test_Org_{uuid.uuid4().hex[:6]}"
    org = Organization(name=unique_name, trust_score=0.80, privacy_budget=2.0)
    db_session.add(org)
    db_session.commit()
    db_session.refresh(org)

    # Valid budget consumption
    success = consume_privacy_budget(db_session, org.id, "TEST_QUERY", 0.5)
    assert success is True
    assert abs(org.privacy_budget - 1.5) < 1e-5

    # Budget exhaustion test
    consume_privacy_budget(db_session, org.id, "HEAVY_QUERY", 1.5)
    assert org.privacy_budget == 0.0

    # Query beyond budget should fail with 403
    with pytest.raises(Exception):
        consume_privacy_budget(db_session, org.id, "OVER_LIMIT_QUERY", 0.1)

# 6. Secure Aggregation Zero-Sum Masking Test
def test_secure_aggregation_zero_sum_cancellation():
    client_ids = ["client_1", "client_2", "client_3", "client_4"]
    clean_layers = [
        np.array([[1.0, 2.0], [3.0, 4.0]], dtype=np.float32),
        np.array([0.5, -0.5], dtype=np.float32)
    ]

    # Mask each client update
    masked_updates = [
        SecureAggregationPrototype.mask_client_update(cid, client_ids, clean_layers, round_num=1)
        for cid in client_ids
    ]

    # Individual masked updates should differ from clean layers
    assert not np.allclose(masked_updates[0][0], clean_layers[0])

    # Unweighted aggregated result should cancel all masks exactly
    aggregated = SecureAggregationPrototype.aggregate_masked_updates(masked_updates, [1.0, 1.0, 1.0, 1.0])
    for l_idx in range(len(clean_layers)):
        assert np.allclose(aggregated[l_idx], clean_layers[l_idx], atol=1e-5)

# 7. Replay Attack Shield Test
def test_replay_protection_shield():
    engine_rep = ReplayProtectionEngine(window_seconds=10)
    org_id = "test-org-123"
    event_id = "event-unique-001"
    now = datetime.utcnow()
    payload = "type=ipv4:val=10.0.0.1"

    # First attempt: Valid
    valid, reason = engine_rep.verify_and_record_event(org_id, event_id, now, payload)
    assert valid is True

    # Immediate replay attempt: Should be blocked
    replayed, reason_replay = engine_rep.verify_and_record_event(org_id, event_id, now, payload)
    assert replayed is False
    assert "Replay attack detected" in reason_replay

    # Stale timestamp: Should be rejected
    stale_time = now - timedelta(seconds=60)
    stale_valid, stale_reason = engine_rep.verify_and_record_event(org_id, "event-stale", stale_time, "new_payload")
    assert stale_valid is False
    assert "drift" in stale_reason

# 8. Cryptographic Hash-Chain Ledger Tamper Verification
def test_cryptographic_ledger_tamper_detection(db_session):
    # Verify clean ledger
    assert verify_ledger(db_session) is True

    # Append block
    b1 = append_to_ledger(db_session, "a968bfc7-d199-4535-a6ac-c84b3f7c5055", "SECURITY_AUDIT", "ev-1", {"status": "SECURE"})
    assert verify_ledger(db_session) is True

    # Tamper with block payload hash
    orig_hash = b1.payload_hash
    b1.payload_hash = "0000000000000000000000000000000000000000000000000000000000000000"
    db_session.commit()
    assert verify_ledger(db_session) is False

    # Restore
    b1.payload_hash = orig_hash
    db_session.commit()
    assert verify_ledger(db_session) is True
