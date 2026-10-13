from fastapi import FastAPI
from app.database import engine, Base
from app.api import router as api_router
from fastapi.middleware.cors import CORSMiddleware

# Create tables for Phase 1
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ThreatShield API", version="1.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Welcome to ThreatShield API"}
