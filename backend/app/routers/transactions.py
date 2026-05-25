from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta
import calendar
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/transactions", tags=["transactions"])

def add_months(sourcedate: date, months: int) -> date:
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    day = min(sourcedate.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)

def add_years(sourcedate: date, years: int) -> date:
    try:
        return date(sourcedate.year + years, sourcedate.month, sourcedate.day)
    except ValueError:
        # Handle Leap Years (Feb 29)
        return date(sourcedate.year + years, sourcedate.month, 28)

def project_single_recurrence(tx: models.Transaction, start_date: date, end_date: date) -> List[dict]:
    occurrences = []
    
    # If not recurring, check if it falls in range
    if tx.recurrence == "none":
        if start_date <= tx.date <= end_date:
            occurrences.append(format_tx_to_dict(tx))
        return occurrences

    # Recurring transaction projection
    tx_date = tx.date
    limit_date = tx.recurrence_end_date if tx.recurrence_end_date else end_date
    # Limit max projection to prevent infinite loops (e.g. projection for next 5 years)
    max_projection_limit = date.today() + timedelta(days=365 * 2)
    limit_date = min(limit_date, end_date, max_projection_limit)

    current_date = tx_date
    idx = 0
    while current_date <= limit_date:
        if current_date >= start_date:
            # We don't mark index 0 as projected if it is the original transaction and occurs on the master date
            is_proj = not (idx == 0 and current_date == tx_date)
            occurrences.append(format_tx_to_dict(tx, current_date, is_proj))
        
        # Advance current_date
        idx += 1
        if tx.recurrence == "daily":
            current_date += timedelta(days=1)
        elif tx.recurrence == "weekly":
            current_date += timedelta(weeks=1)
        elif tx.recurrence == "monthly":
            current_date = add_months(tx_date, idx)
        elif tx.recurrence == "yearly":
            current_date = add_years(tx_date, idx)
        else:
            break  # Safe fallback for unsupported types

    return occurrences

def format_tx_to_dict(tx: models.Transaction, specific_date: Optional[date] = None, is_projected: bool = False) -> dict:
    return {
        "id": tx.id,
        "user_id": tx.user_id,
        "account_id": tx.account_id,
        "to_account_id": tx.to_account_id,
        "category_id": tx.category_id,
        "title": tx.title,
        "amount": tx.amount,
        "type": tx.type,
        "date": specific_date if specific_date else tx.date,
        "note": tx.note,
        "recurrence": tx.recurrence,
        "recurrence_end_date": tx.recurrence_end_date,
        "created_at": tx.created_at,
        "account_name": tx.account.name if tx.account else None,
        "to_account_name": tx.to_account.name if tx.to_account else None,
        "category": {
            "id": tx.category.id,
            "name": tx.category.name,
            "icon": tx.category.icon,
            "color": tx.category.color,
            "is_default": tx.category.is_default
        } if tx.category else None,
        "is_projected": is_projected,
        "is_private": tx.is_private
    }

def update_balances_on_create(db: Session, tx: models.Transaction):
    # Adjust source account
    account = db.query(models.Account).filter(models.Account.id == tx.account_id).first()
    if account:
        if tx.type == "income":
            account.balance += tx.amount
        elif tx.type == "expense":
            account.balance -= tx.amount
        elif tx.type == "transfer":
            account.balance -= tx.amount
            # Adjust destination account
            to_account = db.query(models.Account).filter(models.Account.id == tx.to_account_id).first()
            if to_account:
                to_account.balance += tx.amount
                db.add(to_account)
        db.add(account)

def update_balances_on_delete(db: Session, tx: models.Transaction):
    # Adjust source account (reversing action)
    account = db.query(models.Account).filter(models.Account.id == tx.account_id).first()
    if account:
        if tx.type == "income":
            account.balance -= tx.amount
        elif tx.type == "expense":
            account.balance += tx.amount
        elif tx.type == "transfer":
            account.balance += tx.amount
            # Revert destination account
            to_account = db.query(models.Account).filter(models.Account.id == tx.to_account_id).first()
            if to_account:
                to_account.balance -= tx.amount
                db.add(to_account)
        db.add(account)

@router.get("", response_model=List[schemas.TransactionResponse])
def list_transactions(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    account_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id)

    # Basic DB filtering for non-date ranges
    if account_id:
        query = query.filter((models.Transaction.account_id == account_id) | (models.Transaction.to_account_id == account_id))
    if category_id:
        query = query.filter(models.Transaction.category_id == category_id)
    if type:
        query = query.filter(models.Transaction.type == type)
    if search:
        query = query.filter(models.Transaction.title.ilike(f"%{search}%"))

    # Fetch transactions from DB
    db_transactions = query.all()

    # Define range for projection
    # Default range is from 10 years ago to 1 year in the future if not specified
    today = date.today()
    s_date = start_date if start_date else today - timedelta(days=365 * 10)
    e_date = end_date if end_date else today + timedelta(days=365)

    all_occurrences = []
    for tx in db_transactions:
        projected = project_single_recurrence(tx, s_date, e_date)
        all_occurrences.extend(projected)

    # Sort occurrences by date descending, then ID descending
    all_occurrences.sort(key=lambda x: (x["date"], x["id"]), reverse=True)
    return all_occurrences

@router.get("/by-date/{date_str}", response_model=List[schemas.TransactionResponse])
def get_transactions_by_date(
    date_str: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    db_transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id
    ).all()

    all_occurrences = []
    for tx in db_transactions:
        # Check if the recurrence has an occurrence on this specific day
        projected = project_single_recurrence(tx, target_date, target_date)
        all_occurrences.extend(projected)

    return all_occurrences

@router.post("", response_model=schemas.TransactionResponse)
def create_transaction(
    tx_in: schemas.TransactionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account exists
    account = db.query(models.Account).filter(
        models.Account.id == tx_in.account_id,
        models.Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Source account not found")

    # If transfer, verify destination account exists
    if tx_in.type == "transfer":
        if not tx_in.to_account_id:
            raise HTTPException(status_code=400, detail="Destination account required for transfer")
        to_account = db.query(models.Account).filter(
            models.Account.id == tx_in.to_account_id,
            models.Account.user_id == current_user.id
        ).first()
        if not to_account:
            raise HTTPException(status_code=404, detail="Destination account not found")
        if tx_in.account_id == tx_in.to_account_id:
            raise HTTPException(status_code=400, detail="Source and destination accounts must be different")

    # Verify category exists if provided
    if tx_in.category_id:
        category = db.query(models.Category).filter(
            models.Category.id == tx_in.category_id,
            (models.Category.user_id == current_user.id) | (models.Category.is_default == True)
        ).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    new_tx = models.Transaction(
        user_id=current_user.id,
        account_id=tx_in.account_id,
        to_account_id=tx_in.to_account_id if tx_in.type == "transfer" else None,
        category_id=tx_in.category_id,
        title=tx_in.title,
        amount=tx_in.amount,
        type=tx_in.type,
        date=tx_in.date,
        note=tx_in.note,
        recurrence=tx_in.recurrence,
        recurrence_end_date=tx_in.recurrence_end_date,
        is_private=tx_in.is_private
    )

    db.add(new_tx)
    # Adjust balances
    update_balances_on_create(db, new_tx)
    db.commit()
    db.refresh(new_tx)

    return format_tx_to_dict(new_tx)

@router.put("/{tx_id}", response_model=schemas.TransactionResponse)
def update_transaction(
    tx_id: int,
    tx_update: schemas.TransactionUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    tx = db.query(models.Transaction).filter(
        models.Transaction.id == tx_id,
        models.Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Revert old balance changes
    update_balances_on_delete(db, tx)

    # Perform updates
    update_data = tx_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tx, key, value)

    # Re-validate accounts and categories post-update
    account = db.query(models.Account).filter(
        models.Account.id == tx.account_id,
        models.Account.user_id == current_user.id
    ).first()
    if not account:
        db.rollback()
        raise HTTPException(status_code=404, detail="Source account not found")

    if tx.type == "transfer":
        if not tx.to_account_id:
            db.rollback()
            raise HTTPException(status_code=400, detail="Destination account required for transfer")
        to_account = db.query(models.Account).filter(
            models.Account.id == tx.to_account_id,
            models.Account.user_id == current_user.id
        ).first()
        if not to_account:
            db.rollback()
            raise HTTPException(status_code=404, detail="Destination account not found")

    if tx.category_id:
        category = db.query(models.Category).filter(
            models.Category.id == tx.category_id,
            (models.Category.user_id == current_user.id) | (models.Category.is_default == True)
        ).first()
        if not category:
            db.rollback()
            raise HTTPException(status_code=404, detail="Category not found")

    # Apply new balance changes
    update_balances_on_create(db, tx)
    db.commit()
    db.refresh(tx)

    return format_tx_to_dict(tx)

@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    tx_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    tx = db.query(models.Transaction).filter(
        models.Transaction.id == tx_id,
        models.Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Revert balance modifications
    update_balances_on_delete(db, tx)
    db.delete(tx)
    db.commit()

    return None

@router.patch("/{tx_id}/privacy", response_model=schemas.TransactionResponse)
def toggle_transaction_privacy(
    tx_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    tx = db.query(models.Transaction).filter(
        models.Transaction.id == tx_id,
        models.Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    tx.is_private = not tx.is_private
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return format_tx_to_dict(tx)
