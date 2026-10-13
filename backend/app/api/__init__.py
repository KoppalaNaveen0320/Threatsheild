from fastapi import APIRouter
from app.api import (
    auth,
    organizations,
    cti,
    privacy,
    ledger,
    health,
    trust,
    relevance,
    fl,
    security_events,
    incidents,
    threat_hunting,
    v1_2_analytics
)

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
router.include_router(cti.router, prefix="/cti", tags=["cti"])
router.include_router(privacy.router, prefix="/privacy", tags=["privacy"])
router.include_router(ledger.router, prefix="/ledger", tags=["ledger"])
router.include_router(health.router, prefix="/health", tags=["health"])
router.include_router(trust.router, prefix="/trust", tags=["trust"])
router.include_router(relevance.router, prefix="/relevance", tags=["relevance"])
router.include_router(fl.router, prefix="/fl", tags=["fl"])
router.include_router(security_events.router, prefix="/security-events", tags=["security-events"])
router.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
router.include_router(threat_hunting.router, prefix="/threat-hunting", tags=["threat-hunting"])
router.include_router(v1_2_analytics.router, prefix="/analytics", tags=["v1_2_analytics"])

