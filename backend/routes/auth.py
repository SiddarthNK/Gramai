from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.orm import Session

from database.models import User, get_db
from authentication.auth import (
    hash_password, verify_password,
    create_access_token, get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    name:     str
    email:    str
    password: str
    location: str = ""
    role:     str = "Farmer"


class UpdateProfileRequest(BaseModel):
    name:     Optional[str] = None
    location: Optional[str] = None
    role:     Optional[str] = None
    language: Optional[str] = None


class LoginRequest(BaseModel):
    email:    str
    password: str


def user_to_dict(user: User) -> dict:
    return {
        "id":       user.id,
        "name":     user.name,
        "email":    user.email,
        "location": user.location,
        "role":     user.role,
        "language": user.language,
    }


@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user = User(
        name=req.name,
        email=req.email,
        password_hash=hash_password(req.password),
        location=req.location,
        role=req.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user_to_dict(user)}


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user_to_dict(user)}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return user_to_dict(current_user)


@router.put("/profile")
def update_profile(req: UpdateProfileRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if req.name is not None:
        current_user.name = req.name
    if req.location is not None:
        current_user.location = req.location
    if req.role is not None:
        current_user.role = req.role
    if req.language is not None:
        current_user.language = req.language
    
    db.commit()
    db.refresh(current_user)
    return user_to_dict(current_user)
