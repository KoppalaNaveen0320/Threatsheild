from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from uuid import UUID
import json
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.domain import Incident, IncidentStatusEnum, User, RoleEnum, Organization, CTIRecord
from app.api.deps import get_current_active_user, get_current_analyst

router = APIRouter()

class IncidentCreate(BaseModel):
    title: str
    description: str
    severity: str = "HIGH" # CRITICAL, HIGH, MEDIUM, LOW
    linked_cti_ids: Optional[List[str]] = []
    linked_techniques: Optional[List[str]] = []

class IncidentStatusUpdate(BaseModel):
    status: str
    resolution_notes: Optional[str] = None

@router.post("/", response_model=Dict[str, Any])
def create_incident(
    inc_in: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_analyst)
):
    """
    Creates a new security incident linked to CTI and MITRE ATT&CK techniques.
    """
    incident = Incident(
        title=inc_in.title,
        description=inc_in.description,
        severity=inc_in.severity.upper(),
        status=IncidentStatusEnum.NEW,
        organization_id=current_user.organization_id,
        assigned_to_user_id=current_user.id,
        linked_cti_ids=json.dumps(inc_in.linked_cti_ids or []),
        linked_techniques=json.dumps(inc_in.linked_techniques or []),
        created_at=datetime.utcnow()
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    return {
        "status": "INCIDENT_CREATED",
        "id": str(incident.id),
        "title": incident.title,
        "severity": incident.severity,
        "incident_status": incident.status.name,
        "created_at": incident.created_at.isoformat()
    }

@router.get("/", response_model=List[Dict[str, Any]])
def list_incidents(
    status_filter: Optional[str] = None,
    severity_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists incidents for the user's organization (or all for Admin).
    """
    query = db.query(Incident)
    if current_user.role != RoleEnum.ADMIN:
        query = query.filter(Incident.organization_id == current_user.organization_id)

    if status_filter:
        try:
            enum_val = IncidentStatusEnum[status_filter.upper()]
            query = query.filter(Incident.status == enum_val)
        except KeyError:
            pass

    if severity_filter:
        query = query.filter(Incident.severity == severity_filter.upper())

    incidents = query.order_by(Incident.created_at.desc()).all()

    return [
        {
            "id": str(inc.id),
            "title": inc.title,
            "description": inc.description,
            "severity": inc.severity,
            "status": inc.status.name,
            "organization_id": str(inc.organization_id),
            "linked_cti_count": len(json.loads(inc.linked_cti_ids or "[]")),
            "linked_techniques": json.loads(inc.linked_techniques or "[]"),
            "created_at": inc.created_at.isoformat() if inc.created_at else "",
            "updated_at": inc.updated_at.isoformat() if inc.updated_at else ""
        }
        for inc in incidents
    ]

@router.get("/{incident_id}", response_model=Dict[str, Any])
def get_incident_details(
    incident_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    if current_user.role != RoleEnum.ADMIN and inc.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Forbidden: Tenant isolation violation")

    cti_ids = json.loads(inc.linked_cti_ids or "[]")
    linked_ctis = []
    if cti_ids:
        for cid in cti_ids:
            try:
                c = db.query(CTIRecord).filter(CTIRecord.id == UUID(cid)).first()
                if c:
                    linked_ctis.append({"id": str(c.id), "type": c.type, "value": c.value, "severity": c.severity})
            except Exception:
                pass

    return {
        "id": str(inc.id),
        "title": inc.title,
        "description": inc.description,
        "severity": inc.severity,
        "status": inc.status.name,
        "organization_id": str(inc.organization_id),
        "assigned_to_user_id": str(inc.assigned_to_user_id) if inc.assigned_to_user_id else None,
        "linked_cti_records": linked_ctis,
        "linked_techniques": json.loads(inc.linked_techniques or "[]"),
        "resolution_notes": inc.resolution_notes,
        "created_at": inc.created_at.isoformat() if inc.created_at else "",
        "updated_at": inc.updated_at.isoformat() if inc.updated_at else ""
    }

@router.patch("/{incident_id}/status", response_model=Dict[str, Any])
def update_incident_status(
    incident_id: UUID,
    update_in: IncidentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_analyst)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    if current_user.role != RoleEnum.ADMIN and inc.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Forbidden: Tenant isolation violation")

    try:
        new_status = IncidentStatusEnum[update_in.status.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {update_in.status}")

    inc.status = new_status
    if update_in.resolution_notes:
        inc.resolution_notes = update_in.resolution_notes
    inc.updated_at = datetime.utcnow()
    db.commit()

    return {
        "status": "INCIDENT_UPDATED",
        "id": str(inc.id),
        "new_status": inc.status.name,
        "updated_at": inc.updated_at.isoformat()
    }
