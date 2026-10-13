from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.database import get_db
from app.models.domain import User, LedgerBlock, PrivacyEvent, TrustHistory
from app.api.deps import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
def get_security_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns unified stream of cryptographic audit blocks, differential privacy events, and trust updates.
    """
    ledger_blocks = db.query(LedgerBlock).order_by(LedgerBlock.timestamp.desc()).limit(30).all()
    events = []

    for b in ledger_blocks:
        events.append({
            "id": f"ledger-{b.index}",
            "timestamp": b.timestamp.isoformat() if b.timestamp else "",
            "event_type": b.event_type,
            "organization_id": str(b.organization_id) if b.organization_id else None,
            "hash": b.current_hash,
            "details": f"Block #{b.index} | Event ID: {b.event_id} | Payload SHA-256: {b.payload_hash[:12]}...",
            "severity": "high" if "DUPLICATE" in b.event_type or "REPLAY" in b.event_type else "info"
        })

    privacy_events = db.query(PrivacyEvent).order_by(PrivacyEvent.created_at.desc()).limit(15).all()
    for pe in privacy_events:
        events.append({
            "id": f"privacy-{str(pe.id)[:8]}",
            "timestamp": pe.created_at.isoformat() if pe.created_at else "",
            "event_type": "PRIVACY_BUDGET_CONSUMED",
            "organization_id": str(pe.organization_id),
            "hash": pe.mechanism,
            "details": f"Operation: {pe.operation} | Consumed: {pe.epsilon_consumed} ε | Remaining: {pe.epsilon_remaining:.2f} ε",
            "severity": "info"
        })

    events.sort(key=lambda x: x["timestamp"], reverse=True)
    return events
