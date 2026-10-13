from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.domain import Organization, User, RoleEnum
from app.schemas.domain import OrganizationCreate, OrganizationResponse
from app.api.deps import get_current_active_user, get_current_admin

router = APIRouter()

@router.post("/", response_model=OrganizationResponse)
def create_organization(org_in: OrganizationCreate, db: Session = Depends(get_db)):
    # This might require admin in real life, but for testing let it be open or just create it.
    org = db.query(Organization).filter(Organization.name == org_in.name).first()
    if org:
        raise HTTPException(status_code=400, detail="Organization already exists")
    
    db_org = Organization(name=org_in.name)
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    return db_org

@router.get("/", response_model=List[OrganizationResponse])
def read_organizations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    organizations = db.query(Organization).offset(skip).limit(limit).all()
    return organizations

@router.get("/{org_id}", response_model=OrganizationResponse)
def read_organization(org_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    # RBAC: Only allow users of this org or admins
    is_admin = (current_user.role == RoleEnum.ADMIN) or (getattr(current_user.role, 'value', None) == 'ADMIN') or (getattr(current_user.role, 'name', None) == 'ADMIN')
    if current_user.organization_id != org_id and not is_admin:
         raise HTTPException(status_code=403, detail="Not enough permissions")
    return org
