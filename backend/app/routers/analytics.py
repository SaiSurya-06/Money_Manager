from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from typing import List, Optional
from datetime import date, datetime, timedelta
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/summary", response_model=schemas.AnalyticsSummary)
def get_summary(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Total Balance across all accounts
    total_balance = db.query(func.sum(models.Account.balance)).filter(
        models.Account.user_id == current_user.id
    ).scalar() or 0.0

    # Current Month range
    today = date.today()
    start_of_month = date(today.year, today.month, 1)
    
    # Calculate next month start and subtract 1 day to get end of month
    if today.month == 12:
        end_of_month = date(today.year + 1, 1, 1) - timedelta(days=1)
    else:
        end_of_month = date(today.year, today.month + 1, 1) - timedelta(days=1)

    # Monthly Income (actual transactions in current month)
    monthly_income = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == "income",
        models.Transaction.date >= start_of_month,
        models.Transaction.date <= end_of_month
    ).scalar() or 0.0

    # Monthly Expenses (actual transactions in current month)
    monthly_expenses = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == "expense",
        models.Transaction.date >= start_of_month,
        models.Transaction.date <= end_of_month
    ).scalar() or 0.0

    return {
        "total_balance": total_balance,
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "net_savings": monthly_income - monthly_expenses,
        "currency": current_user.preferred_currency
    }

@router.get("/monthly", response_model=List[schemas.MonthlyData])
def get_monthly_analytics(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch last 6 months (including current month)
    today = date.today()
    result = []

    for i in range(5, -1, -1):
        # Subtract months
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1
            
        start_of_month = date(year, month, 1)
        if month == 12:
            end_of_month = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_of_month = date(year, month + 1, 1) - timedelta(days=1)

        income = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.user_id == current_user.id,
            models.Transaction.type == "income",
            models.Transaction.date >= start_of_month,
            models.Transaction.date <= end_of_month
        ).scalar() or 0.0

        expense = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.user_id == current_user.id,
            models.Transaction.type == "expense",
            models.Transaction.date >= start_of_month,
            models.Transaction.date <= end_of_month
        ).scalar() or 0.0

        month_label = start_of_month.strftime("%Y-%m")
        result.append({
            "month": month_label,
            "income": income,
            "expense": expense
        })
    return result

@router.get("/categories", response_model=List[schemas.CategorySpending])
def get_categories_analytics(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Default to current month if dates not provided
    today = date.today()
    s_date = start_date if start_date else date(today.year, today.month, 1)
    if not end_date:
        if today.month == 12:
            end_date = date(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(today.year, today.month + 1, 1) - timedelta(days=1)

    # Subquery to aggregate sum of expenses grouped by category
    spending_query = db.query(
        models.Category.name.label("category_name"),
        models.Category.color.label("category_color"),
        func.sum(models.Transaction.amount).label("total_amount")
    ).join(
        models.Transaction, models.Transaction.category_id == models.Category.id
    ).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == "expense",
        models.Transaction.date >= s_date,
        models.Transaction.date <= end_date
    ).group_by(models.Category.id).all()

    total_expense = sum(item.total_amount for item in spending_query) if spending_query else 0.0

    result = []
    for item in spending_query:
        amount = float(item.total_amount)
        percentage = (amount / total_expense * 100) if total_expense > 0 else 0.0
        result.append({
            "category_name": item.category_name,
            "category_color": item.category_color,
            "amount": amount,
            "percentage": round(percentage, 2)
        })

    # Sort descending by amount
    result.sort(key=lambda x: x["amount"], reverse=True)
    return result

@router.get("/networth", response_model=List[schemas.NetWorthData])
def get_net_worth_trend(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Net worth is total balance across all accounts at any given date.
    # Reconstruct historical net worth:
    # 1. Start with current total balance (this is today's net worth).
    # 2. Get all transactions sorted by date descending.
    # 3. Step backward in time, undoing the balance changes.
    
    current_balance = db.query(func.sum(models.Account.balance)).filter(
        models.Account.user_id == current_user.id
    ).scalar() or 0.0

    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id
    ).order_by(models.Transaction.date.desc(), models.Transaction.id.desc()).all()

    # Reconstruct net worth for each day transactions occurred, plus today.
    today = date.today()
    net_worth_history = []
    
    # We want a series of data points, let's say one per month or per week, or for each transaction date.
    # A daily or per-transaction-date list is great, then we can group it or just show the last 30 days of changes.
    # Let's collect data points for the last 30 days, or for each unique transaction date over the last 6 months.
    # Let's do a daily history for the last 30 days.
    
    # Build a lookup of day -> net worth.
    running_balance = current_balance
    
    # We create a map of dates to net worth
    net_worth_by_date = {}
    net_worth_by_date[today] = running_balance
    
    # Iterate through transactions and step backward
    current_idx = 0
    num_txs = len(transactions)
    
    # Step back day by day for the last 90 days to draw a rich chart
    for i in range(90):
        target_date = today - timedelta(days=i)
        
        # Undo transactions that occurred AFTER this target_date (which means they were in the future relative to target_date)
        while current_idx < num_txs and transactions[current_idx].date > target_date:
            tx = transactions[current_idx]
            # Undo transaction
            if tx.type == "income":
                running_balance -= tx.amount
            elif tx.type == "expense":
                running_balance += tx.amount
            # For transfers, total net worth didn't change, so do nothing.
            current_idx += 1
            
        net_worth_by_date[target_date] = running_balance

    # Format the output chronologically (oldest to newest)
    result = []
    sorted_dates = sorted(list(net_worth_by_date.keys()))
    for d in sorted_dates:
        result.append({
            "date": d.strftime("%Y-%m-%d"),
            "amount": net_worth_by_date[d]
        })
        
    return result
