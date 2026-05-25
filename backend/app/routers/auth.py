from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/auth", tags=["auth"])

DEFAULT_CATEGORIES = [
    {"name": "Salary", "icon": "Briefcase", "color": "#4CAF50"},
    {"name": "Investments", "icon": "TrendingUp", "color": "#009688"},
    {"name": "Food & Dining", "icon": "Utensils", "color": "#FF5722"},
    {"name": "Rent & Housing", "icon": "Home", "color": "#3F51B5"},
    {"name": "Utilities", "icon": "Zap", "color": "#FFC107"},
    {"name": "Transportation", "icon": "Car", "color": "#03A9F4"},
    {"name": "Entertainment", "icon": "Film", "color": "#9C27B0"},
    {"name": "Healthcare", "icon": "HeartPulse", "color": "#E91E63"},
    {"name": "Shopping", "icon": "ShoppingBag", "color": "#FF9800"},
    {"name": "Education", "icon": "GraduationCap", "color": "#795548"},
    {"name": "Others", "icon": "Grid", "color": "#607D8B"},
]

@router.post("/signup", response_model=schemas.Token)
def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    # Create new user
    hashed_password = auth.get_password_hash(user_in.password)
    new_user = models.User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=hashed_password,
        preferred_currency=user_in.preferred_currency
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Seed default categories for this user
    for cat in DEFAULT_CATEGORIES:
        new_cat = models.Category(
            user_id=new_user.id,
            name=cat["name"],
            icon=cat["icon"],
            color=cat["color"],
            is_default=True
        )
        db.add(new_cat)
    
    # Create default Account for convenience
    default_account = models.Account(
        user_id=new_user.id,
        name="Main Account",
        type="Bank",
        balance=0.0,
        icon="Wallet",
        color="#E53935"
    )
    db.add(default_account)
    db.commit()

    # Generate token
    access_token = auth.create_access_token(data={"sub": new_user.email, "user_id": new_user.id})
    return {"access_token": access_token, "token_type": "bearer"}

# We allow login via either standard form data (OAuth2) or JSON payload
class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login", response_model=schemas.Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    access_token = auth.create_access_token(data={"sub": user.email, "user_id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}
