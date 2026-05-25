from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_me(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.preferred_currency is not None:
        current_user.preferred_currency = user_update.preferred_currency
    if user_update.password is not None:
        current_user.hashed_password = auth.get_password_hash(user_update.password)
        
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
