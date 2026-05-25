from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("", response_model=List[schemas.Category])
def list_categories(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch default categories (where is_default is true) OR user's custom categories
    categories = db.query(models.Category).filter(
        (models.Category.user_id == current_user.id) | 
        (models.Category.user_id.is_(None)) |
        (models.Category.is_default == True)
    ).all()
    
    # Deduplicate default categories if they overlap
    seen = {}
    deduped = []
    for cat in categories:
        # User categories override default ones of the same name for this user if applicable
        key = cat.name.lower()
        if key not in seen or (seen[key].user_id is None and cat.user_id is not None):
            seen[key] = cat

    return list(seen.values())

@router.post("", response_model=schemas.Category)
def create_category(
    category_in: schemas.CategoryCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    new_category = models.Category(
        user_id=current_user.id,
        name=category_in.name,
        icon=category_in.icon,
        color=category_in.color,
        is_default=False
    )
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

@router.put("/{category_id}", response_model=schemas.Category)
def update_category(
    category_id: int,
    category_update: schemas.CategoryUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    category = db.query(models.Category).filter(
        models.Category.id == category_id,
        models.Category.user_id == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found or is a system default and cannot be modified."
        )
        
    for key, value in category_update.model_dump(exclude_unset=True).items():
        setattr(category, key, value)
        
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    category = db.query(models.Category).filter(
        models.Category.id == category_id,
        models.Category.user_id == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found or is a system default and cannot be deleted."
        )
        
    db.delete(category)
    db.commit()
    return None
