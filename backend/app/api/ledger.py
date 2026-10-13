from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import User, LedgerBlock
from app.api.deps import get_current_active_user, get_current_admin
from app.ledger.engine import verify_ledger

router = APIRouter()

@router.get("/blocks")
def get_blocks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    blocks = db.query(LedgerBlock).order_by(LedgerBlock.index.desc()).offset(skip).limit(limit).all()
    return blocks

@router.get("/verify")
def verify_chain(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    is_valid = verify_ledger(db)
    total_blocks = db.query(LedgerBlock).count()
    return {
        "valid": is_valid,
        "is_valid": is_valid,
        "total_blocks": total_blocks,
        "status": "VERIFIED_TAMPER_FREE" if is_valid else "TAMPERING_DETECTED"
    }
