from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base
import enum

class RoleEnum(enum.Enum):
    ADMIN = "ADMIN"
    ANALYST = "ANALYST"
    VALIDATOR = "VALIDATOR"
    THREAT_CONSUMER = "THREAT_CONSUMER"

class FeedbackEnum(enum.Enum):
    USEFUL = "USEFUL"
    NOT_USEFUL = "NOT_USEFUL"
    FALSE_POSITIVE = "FALSE_POSITIVE"
    CONFIRMED_MALICIOUS = "CONFIRMED_MALICIOUS"
    EXPIRED = "EXPIRED"

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True)
    trust_score = Column(Float, default=0.5)
    privacy_budget = Column(Float, default=10.0)
    public_key = Column(String, nullable=True)
    status = Column(String, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.ANALYST)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    organization = relationship("Organization")

class CTIRecord(Base):
    __tablename__ = "cti_records"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    type = Column(String, index=True)
    value = Column(String, index=True)
    description = Column(Text)
    severity = Column(Float)
    confidence = Column(Float)
    source = Column(String)
    status = Column(String, default="NEW")
    created_at = Column(DateTime, default=datetime.utcnow)

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cti_id = Column(UUID(as_uuid=True), ForeignKey("cti_records.id"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    feedback_type = Column(Enum(FeedbackEnum))
    comment = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class FederatedRound(Base):
    __tablename__ = "federated_rounds"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    round_number = Column(Integer, unique=True)
    global_model_hash = Column(String)
    participating_clients = Column(Integer)
    aggregation_method = Column(String)
    accuracy = Column(Float, nullable=True)
    loss = Column(Float, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class ModelUpdate(Base):
    __tablename__ = "model_updates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    federated_round_id = Column(UUID(as_uuid=True), ForeignKey("federated_rounds.id"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    model_hash = Column(String)
    update_norm = Column(Float)
    anomaly_score = Column(Float, nullable=True)
    trust_score = Column(Float, nullable=True)
    quality_score = Column(Float, nullable=True)
    contribution_weight = Column(Float, nullable=True)
    accepted = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PrivacyEvent(Base):
    __tablename__ = "privacy_events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    operation = Column(String)
    epsilon_consumed = Column(Float)
    epsilon_remaining = Column(Float)
    mechanism = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class TrustHistory(Base):
    __tablename__ = "trust_history"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    previous_score = Column(Float)
    new_score = Column(Float)
    reason = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class IncidentStatusEnum(enum.Enum):
    NEW = "NEW"
    TRIAGED = "TRIAGED"
    INVESTIGATING = "INVESTIGATING"
    CONTAINED = "CONTAINED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, index=True)
    description = Column(Text)
    severity = Column(String, default="HIGH")
    status = Column(Enum(IncidentStatusEnum), default=IncidentStatusEnum.NEW)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    assigned_to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    linked_cti_ids = Column(Text, default="[]")
    linked_techniques = Column(Text, default="[]")
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SecurityAlert(Base):
    __tablename__ = "security_alerts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String)
    severity = Column(String, default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW
    trigger_type = Column(String) # COLLUSION_SUSPECT, FL_ANOMALY, PRIVACY_EXHAUSTION, REPLAY_BURST, CTI_SPAM
    description = Column(Text)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    related_entity_id = Column(String, nullable=True)
    recommended_action = Column(Text)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class LedgerBlock(Base):
    __tablename__ = "ledger_blocks"
    index = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    previous_hash = Column(String)
    payload_hash = Column(String)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    event_type = Column(String)
    event_id = Column(String)
    current_hash = Column(String)

