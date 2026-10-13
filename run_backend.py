import os
import sys
import uvicorn
import sqlite3
import uuid

# Adjust path for local imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

# Force SQLite for local testing
os.environ["DATABASE_URL"] = "sqlite:///./verification.db"
os.environ["AES_SECRET_KEY"] = "0123456789abcdef0123456789abcdef"

sqlite3.register_adapter(uuid.UUID, lambda u: u.hex)

from backend.app.main import app
from backend.app.database import Base, engine

# Ensure tables exist
Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
