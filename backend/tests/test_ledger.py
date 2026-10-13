import pytest
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from datetime import datetime, timedelta
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.domain import Base, LedgerBlock
from app.ledger.engine import append_to_ledger, verify_ledger, generate_block_hash, canonical_json, generate_hash

@pytest.fixture
def db():
    # SQLite in-memory database for testing
    import sqlite3
    sqlite3.register_adapter(uuid.UUID, lambda u: u.hex)
    
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_normal_ledger_block(db):
    org_id = str(uuid.uuid4())
    event_id = str(uuid.uuid4())
    payload = {"ip": "1.1.1.1", "severity": 9.0}
    
    block = append_to_ledger(db, org_id, "CTI_SUBMISSION", event_id, payload)
    assert block is not None
    assert block.current_hash is not None
    assert verify_ledger(db) is True

def test_multiple_sequential_blocks(db):
    org_id = str(uuid.uuid4())
    for i in range(5):
        append_to_ledger(db, org_id, "CTI_SUBMISSION", str(uuid.uuid4()), {"val": i})
    assert verify_ledger(db) is True
    blocks = db.query(LedgerBlock).order_by(LedgerBlock.index.asc()).all()
    assert len(blocks) == 5
    for i in range(1, 5):
        assert blocks[i].previous_hash == blocks[i-1].current_hash

def test_different_timestamps(db):
    org_id = str(uuid.uuid4())
    b1 = append_to_ledger(db, org_id, "CTI", str(uuid.uuid4()), {"val": 1})
    # Manually change timestamp before hashing
    b1.timestamp = b1.timestamp - timedelta(days=1)
    db.commit()
    assert verify_ledger(db) is False

def test_microsecond_timestamps(db):
    org_id = str(uuid.uuid4())
    b1 = append_to_ledger(db, org_id, "CTI", str(uuid.uuid4()), {"val": 1})
    # Our canonical representation drops microseconds
    # Simulating what happens if the DB returns a timestamp with microseconds
    b1.timestamp = b1.timestamp.replace(microsecond=500000)
    # The canonicalizer should ignore/drop them in verify or we just make sure verify handles it
    # Actually canonicalizer formats as %Y-%m-%dT%H:%M:%SZ which natively drops microseconds
    assert verify_ledger(db) is True

def test_utc_timestamps(db):
    # Verify the canonical timestamp outputs exactly the expected format
    dt = datetime(2026, 1, 1, 12, 0, 0)
    from app.ledger.engine import canonical_timestamp
    assert canonical_timestamp(dt) == "2026-01-01T12:00:00Z"

def test_tampered_payload(db):
    org_id = str(uuid.uuid4())
    b1 = append_to_ledger(db, org_id, "CTI", str(uuid.uuid4()), {"val": 1})
    # Attack: tamper with payload hash without fixing current_hash
    b1.payload_hash = generate_hash(canonical_json({"val": 999}))
    db.commit()
    assert verify_ledger(db) is False

def test_tampered_previous_hash(db):
    org_id = str(uuid.uuid4())
    append_to_ledger(db, org_id, "CTI", str(uuid.uuid4()), {"val": 1})
    b2 = append_to_ledger(db, org_id, "CTI", str(uuid.uuid4()), {"val": 2})
    b2.previous_hash = "0" * 64
    db.commit()
    assert verify_ledger(db) is False

def test_tampered_timestamp(db):
    org_id = str(uuid.uuid4())
    b1 = append_to_ledger(db, org_id, "CTI", str(uuid.uuid4()), {"val": 1})
    b1.timestamp = datetime(2030, 1, 1)
    db.commit()
    assert verify_ledger(db) is False

def test_reordered_json_fields(db):
    # JSON with different order but identical semantics should yield same payload hash
    p1 = {"a": 1, "b": 2}
    p2 = {"b": 2, "a": 1}
    assert canonical_json(p1) == canonical_json(p2)
    assert generate_hash(canonical_json(p1)) == generate_hash(canonical_json(p2))

def test_sqlite_persistence_retrieval(db):
    org_id = str(uuid.uuid4())
    b1 = append_to_ledger(db, org_id, "CTI", str(uuid.uuid4()), {"val": 1})
    
    # Force a close and reload to test persistence serialization
    db.expunge_all()
    
    b1_reloaded = db.query(LedgerBlock).first()
    assert b1_reloaded.current_hash == b1.current_hash
    
    assert verify_ledger(db) is True
