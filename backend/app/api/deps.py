from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import User, RoleEnum
from app.security.security import SECRET_KEY, ALGORITHM
from pydantic import ValidationError
import uuid

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
        user_uuid = uuid.UUID(user_id)
    except (JWTError, ValidationError, ValueError):
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    # Check if org is active etc.
    return current_user

def get_current_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions: Requires ADMIN role")
    return current_user

def get_current_analyst(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role not in [RoleEnum.ADMIN, RoleEnum.ANALYST]:
        raise HTTPException(status_code=403, detail="Not enough permissions: Requires ANALYST or ADMIN role")
    return current_user

def get_current_validator(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role not in [RoleEnum.ADMIN, RoleEnum.VALIDATOR]:
        raise HTTPException(status_code=403, detail="Not enough permissions: Requires VALIDATOR or ADMIN role")
    return current_user
