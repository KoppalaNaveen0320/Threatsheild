import hashlib
import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.domain import LedgerBlock
import uuid

def generate_hash(payload: str) -> str:
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def canonical_json(payload_dict: dict) -> str:
    return json.dumps(payload_dict, sort_keys=True, separators=(',', ':'))

def canonical_timestamp(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

def generate_block_hash(previous_hash: str, payload_hash: str, timestamp: datetime) -> str:
    ts_str = canonical_timestamp(timestamp)
    block_content = f"{previous_hash}|{payload_hash}|{ts_str}"
    return generate_hash(block_content)

def append_to_ledger(db: Session, organization_id: str, event_type: str, event_id: str, payload_dict: dict):
    # Fetch the latest block
    last_block = db.query(LedgerBlock).order_by(LedgerBlock.index.desc()).first()
    
    previous_hash = last_block.current_hash if last_block else "0" * 64
    
    payload_str = canonical_json(payload_dict)
    payload_hash = generate_hash(payload_str)
    
    # Store with zeroed microseconds
    timestamp = datetime.utcnow().replace(microsecond=0)
    
    current_hash = generate_block_hash(previous_hash, payload_hash, timestamp)
    
    if isinstance(organization_id, str):
        try: organization_id = uuid.UUID(organization_id)
        except ValueError: pass
    if event_id is not None:
        event_id = str(event_id)

    new_block = LedgerBlock(
        timestamp=timestamp,
        previous_hash=previous_hash,
        payload_hash=payload_hash,
        organization_id=organization_id,
        event_type=event_type,
        event_id=event_id,
        current_hash=current_hash
    )
    
    db.add(new_block)
    db.commit()
    db.refresh(new_block)
    return new_block

def verify_ledger(db: Session) -> bool:
    blocks = db.query(LedgerBlock).order_by(LedgerBlock.index.asc()).all()
    if not blocks:
        return True # Empty ledger is valid
        
    for i in range(len(blocks)):
        curr = blocks[i]
        
        if i > 0:
            prev = blocks[i-1]
            # 1. Check chain linkage
            if curr.previous_hash != prev.current_hash:
                return False
            
        # 2. Verify current block hash using exact deterministic function
        expected_hash = generate_block_hash(curr.previous_hash, curr.payload_hash, curr.timestamp)
        
        if curr.current_hash != expected_hash:
            return False
            
    return True
