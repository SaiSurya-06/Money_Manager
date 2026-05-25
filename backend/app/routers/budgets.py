from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import extract, and_, func
from typing import List, Optional
from datetime import date, datetime
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/budgets", tags=["budgets"])

def get_spent_amount(db: Session, user_id: int, category_id: int, month_str: str) -> float:
    # month_str format: YYYY-MM
    try:
        year, month = map(int, month_str.split("-"))
    except ValueError:
        return 0.0

    # Query sum of actual transactions of type "expense"
    result = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == user_id,
        models.Transaction.category_id == category_id,
        models.Transaction.type == "expense",
        extract("year", models.Transaction.date) == year,
        extract("month", models.Transaction.date) == month,
        # Only include non-projected transactions or all?
        # Usually budget is calculated against actual entries.
    ).scalar()

    return float(result) if result else 0.0

@router.get("", response_model=List[schemas.BudgetResponse])
def list_budgets(
    month: Optional[str] = None,  # YYYY-MM
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not month:
        month = datetime.today().strftime("%Y-%m")

    budgets = db.query(models.Budget).filter(
        models.Budget.user_id == current_user.id,
        models.Budget.month == month
    ).all()

    response = []
    for b in budgets:
        spent = get_spent_amount(db, current_user.id, b.category_id, b.month)
        response.append({
            "id": b.id,
            "user_id": b.user_id,
            "category_id": b.category_id,
            "month": b.month,
            "limit_amount": b.limit_amount,
            "spent_amount": spent,
            "category": b.category
        })
    return response

@router.post("", response_model=schemas.BudgetResponse)
def create_budget(
    budget_in: schemas.BudgetCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify category exists
    category = db.query(models.Category).filter(
        models.Category.id == budget_in.category_id,
        (models.Category.user_id == current_user.id) | (models.Category.is_default == True)
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if budget already exists for this category and month
    existing = db.query(models.Budget).filter(
        models.Budget.user_id == current_user.id,
        models.Budget.category_id == budget_in.category_id,
        models.Budget.month == budget_in.month
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A budget for this category in this month already exists. Please edit the existing one."
        )

    new_budget = models.Budget(
        user_id=current_user.id,
        category_id=budget_in.category_id,
        month=budget_in.month,
        limit_amount=budget_in.limit_amount
    )
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)

    spent = get_spent_amount(db, current_user.id, new_budget.category_id, new_budget.month)
    return {
        "id": new_budget.id,
        "user_id": new_budget.user_id,
        "category_id": new_budget.category_id,
        "month": new_budget.month,
        "limit_amount": new_budget.limit_amount,
        "spent_amount": spent,
        "category": category
    }

@router.put("/{budget_id}", response_model=schemas.BudgetResponse)
def update_budget(
    budget_id: int,
    budget_update: schemas.BudgetUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    budget = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    budget.limit_amount = budget_update.limit_amount
    db.add(budget)
    db.commit()
    db.refresh(budget)

    spent = get_spent_amount(db, current_user.id, budget.category_id, budget.month)
    return {
        "id": budget.id,
        "user_id": budget.user_id,
        "category_id": budget.category_id,
        "month": budget.month,
        "limit_amount": budget.limit_amount,
        "spent_amount": spent,
        "category": budget.category
    }

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    budget = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    db.delete(budget)
    db.commit()
    return None

