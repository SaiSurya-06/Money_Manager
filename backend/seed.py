import sys
import os
from datetime import date, datetime, timedelta

# Ensure parent directory is in path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app import models, auth

def seed_db():
    print("Initializing database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Creating demo users...")
        hashed_password = auth.get_password_hash("password123")
        
        # User A
        demo_user = models.User(
            email="demo@example.com",
            name="Alex Mercer",
            hashed_password=hashed_password,
            preferred_currency="USD"
        )
        db.add(demo_user)
        
        # User B (Partner)
        partner_user = models.User(
            email="partner@example.com",
            name="Taylor Mason",
            hashed_password=hashed_password,
            preferred_currency="USD"
        )
        db.add(partner_user)
        
        db.commit()
        db.refresh(demo_user)
        db.refresh(partner_user)

        print("Seeding categories for users...")
        categories_to_seed = [
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

        # Categories mapping
        user_cats = {}
        partner_cats = {}
        
        for cat in categories_to_seed:
            c1 = models.Category(
                user_id=demo_user.id,
                name=cat["name"],
                icon=cat["icon"],
                color=cat["color"],
                is_default=True
            )
            c2 = models.Category(
                user_id=partner_user.id,
                name=cat["name"],
                icon=cat["icon"],
                color=cat["color"],
                is_default=True
            )
            db.add(c1)
            db.add(c2)
            db.commit()
            db.refresh(c1)
            db.refresh(c2)
            user_cats[cat["name"]] = c1
            partner_cats[cat["name"]] = c2

        print("Creating demo accounts...")
        # User A Accounts
        acc_a1 = models.Account(user_id=demo_user.id, name="Chase Checking", type="Bank", balance=3450.00, icon="Wallet", color="#2196F3")
        acc_a2 = models.Account(user_id=demo_user.id, name="Ally High-Yield Savings", type="Savings", balance=15400.00, icon="PiggyBank", color="#4CAF50")
        acc_a3 = models.Account(user_id=demo_user.id, name="Sapphire Credit Card", type="Credit Card", balance=-480.00, icon="CreditCard", color="#E53935")
        acc_a4 = models.Account(user_id=demo_user.id, name="Cash Wallet", type="Cash", balance=180.00, icon="Coins", color="#FF9800")
        
        # User B Accounts
        acc_b1 = models.Account(user_id=partner_user.id, name="Taylor Checking", type="Bank", balance=2100.00, icon="Wallet", color="#FF5722")
        acc_b2 = models.Account(user_id=partner_user.id, name="Joint Savings", type="Savings", balance=8500.00, icon="PiggyBank", color="#9C27B0")
        
        db.add_all([acc_a1, acc_a2, acc_a3, acc_a4, acc_b1, acc_b2])
        db.commit()
        db.refresh(acc_a1); db.refresh(acc_a2); db.refresh(acc_a3); db.refresh(acc_a4)
        db.refresh(acc_b1); db.refresh(acc_b2)

        print("Creating mutual Partner Link...")
        partner_link = models.PartnerLink(
            requester_id=demo_user.id,
            recipient_id=partner_user.id,
            invite_code="partner_link_code",
            status="accepted",
            created_at=datetime.utcnow() - timedelta(days=2),
            accepted_at=datetime.utcnow() - timedelta(days=2)
        )
        db.add(partner_link)

        print("Creating account sharing configurations...")
        # Share all User A accounts with User B
        db.add(models.AccountSharingSettings(user_id=demo_user.id, account_id=acc_a1.id, partner_id=partner_user.id, is_shared=True))
        db.add(models.AccountSharingSettings(user_id=demo_user.id, account_id=acc_a2.id, partner_id=partner_user.id, is_shared=True))
        db.add(models.AccountSharingSettings(user_id=demo_user.id, account_id=acc_a3.id, partner_id=partner_user.id, is_shared=True))
        db.add(models.AccountSharingSettings(user_id=demo_user.id, account_id=acc_a4.id, partner_id=partner_user.id, is_shared=True))
        
        # Share all User B accounts with User A
        db.add(models.AccountSharingSettings(user_id=partner_user.id, account_id=acc_b1.id, partner_id=demo_user.id, is_shared=True))
        db.add(models.AccountSharingSettings(user_id=partner_user.id, account_id=acc_b2.id, partner_id=demo_user.id, is_shared=True))
        
        db.commit()

        print("Creating demo budgets...")
        current_month = datetime.today().strftime("%Y-%m")
        budgets_to_seed = [
            {"category": "Food & Dining", "limit": 500.00},
            {"category": "Entertainment", "limit": 200.00},
            {"category": "Utilities", "limit": 300.00},
            {"category": "Shopping", "limit": 400.00},
        ]

        for b in budgets_to_seed:
            new_budget = models.Budget(
                user_id=demo_user.id,
                category_id=user_cats[b["category"]].id,
                month=current_month,
                limit_amount=b["limit"]
            )
            db.add(new_budget)
        db.commit()

        print("Creating transactions history...")
        today = date.today()
        yesterday = today - timedelta(days=1)
        two_days_ago = today - timedelta(days=2)
        three_days_ago = today - timedelta(days=3)
        five_days_ago = today - timedelta(days=5)
        ten_days_ago = today - timedelta(days=10)
        fifteen_days_ago = today - timedelta(days=15)
        
        first_of_this_month = date(today.year, today.month, 1)
        first_of_last_month = date(
            today.year if today.month > 1 else today.year - 1,
            today.month - 1 if today.month > 1 else 12,
            1
        )

        transactions_to_seed = [
            # Salary Recurring
            {
                "user_id": demo_user.id,
                "account_id": acc_a1.id,
                "category_id": user_cats["Salary"].id,
                "title": "Monthly Salary Paycheck",
                "amount": 4200.00,
                "type": "income",
                "date": first_of_this_month,
                "note": "Direct deposit salary",
                "recurrence": "monthly",
                "recurrence_end_date": today + timedelta(days=365)
            },
            # Rent
            {
                "user_id": demo_user.id,
                "account_id": acc_a1.id,
                "category_id": user_cats["Rent & Housing"].id,
                "title": "Apartment Monthly Rent",
                "amount": 1200.00,
                "type": "expense",
                "date": first_of_this_month,
                "recurrence": "monthly"
            },
            # Food & Dining (Over 80% warning condition)
            {
                "user_id": demo_user.id,
                "account_id": acc_a3.id,
                "category_id": user_cats["Food & Dining"].id,
                "title": "Whole Foods Grocery Run",
                "amount": 165.40,
                "type": "expense",
                "date": three_days_ago
            },
            {
                "user_id": demo_user.id,
                "account_id": acc_a3.id,
                "category_id": user_cats["Food & Dining"].id,
                "title": "Premium Steakhouse Dinner",
                "amount": 180.00,
                "type": "expense",
                "date": yesterday
            },
            {
                "user_id": demo_user.id,
                "account_id": acc_a4.id,
                "category_id": user_cats["Food & Dining"].id,
                "title": "Downtown Sushi Lunch",
                "amount": 75.00,
                "type": "expense",
                "date": today
            },
            # PRIVATE transaction for Alex (User A)
            {
                "user_id": demo_user.id,
                "account_id": acc_a3.id,
                "category_id": user_cats["Entertainment"].id,
                "title": "Surprise Concert Tickets (Hidden)",
                "amount": 150.00,
                "type": "expense",
                "date": today,
                "note": "Secret surprise for Taylor",
                "is_private": True
            },

            # User B (Partner Taylor Mason) transactions
            {
                "user_id": partner_user.id,
                "account_id": acc_b1.id,
                "category_id": partner_cats["Salary"].id,
                "title": "Taylor Monthly Paycheck",
                "amount": 3500.00,
                "type": "income",
                "date": first_of_this_month
            },
            {
                "user_id": partner_user.id,
                "account_id": acc_b1.id,
                "category_id": partner_cats["Food & Dining"].id,
                "title": "Trader Joe's groceries",
                "amount": 110.50,
                "type": "expense",
                "date": yesterday,
                "note": "Weekly groceries"
            },
            # PRIVATE transaction for Taylor (User B)
            {
                "user_id": partner_user.id,
                "account_id": acc_b1.id,
                "category_id": partner_cats["Others"].id,
                "title": "Secret Surprise Gift (Hidden)",
                "amount": 120.00,
                "type": "expense",
                "date": today,
                "note": "Secret surprise for Alex",
                "is_private": True
            }
        ]

        for tx in transactions_to_seed:
            new_tx = models.Transaction(
                user_id=tx["user_id"],
                account_id=tx["account_id"],
                to_account_id=tx.get("to_account_id"),
                category_id=tx.get("category_id"),
                title=tx["title"],
                amount=tx["amount"],
                type=tx["type"],
                date=tx["date"],
                note=tx.get("note"),
                recurrence=tx.get("recurrence", "none"),
                recurrence_end_date=tx.get("recurrence_end_date"),
                is_private=tx.get("is_private", False)
            )
            db.add(new_tx)
        
        db.commit()
        print("Database successfully seeded with demo and partner configurations!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
