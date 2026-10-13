from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.domain import RoleEnum, FeedbackEnum

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

# Organization Schemas
class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationResponse(OrganizationBase):
    id: UUID
    trust_score: float
    privacy_budget: float
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    role: RoleEnum = RoleEnum.ANALYST

class UserCreate(UserBase):
    password: str
    organization_id: UUID

class UserResponse(UserBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# CTI Schemas
class CTIBase(BaseModel):
    type: str
    value: str
    description: Optional[str] = None
    severity: float
    confidence: float
    source: Optional[str] = None

class CTICreate(CTIBase):
    pass

class CTIResponse(CTIBase):
    id: UUID
    organization_id: UUID
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

