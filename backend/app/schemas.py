from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date as dt_date, datetime as dt_datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    preferred_currency: str = "USD"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    preferred_currency: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: dt_datetime

    class Config:
        from_attributes = True

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    icon: str
    color: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class Category(CategoryBase):
    id: int
    user_id: Optional[int] = None
    is_default: bool

    class Config:
        from_attributes = True

# Account Schemas
class AccountBase(BaseModel):
    name: str
    type: str  # Bank, Cash, Credit Card, Savings, Investment, Custom
    balance: float = 0.0
    icon: str
    color: str

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    balance: Optional[float] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class Account(AccountBase):
    id: int
    user_id: int
    created_at: dt_datetime

    class Config:
        from_attributes = True

# Transaction Schemas
class TransactionBase(BaseModel):
    account_id: int
    to_account_id: Optional[int] = None
    category_id: Optional[int] = None
    title: str
    amount: float
    type: str  # income, expense, transfer
    date: dt_date
    note: Optional[str] = None
    recurrence: str = "none"  # none, daily, weekly, monthly, yearly
    recurrence_end_date: Optional[dt_date] = None
    is_private: bool = False

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    account_id: Optional[int] = None
    to_account_id: Optional[int] = None
    category_id: Optional[int] = None
    title: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    date: Optional[dt_date] = None
    note: Optional[str] = None
    recurrence: Optional[str] = None
    recurrence_end_date: Optional[dt_date] = None
    is_private: Optional[bool] = None

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    account_id: int
    to_account_id: Optional[int] = None
    category_id: Optional[int] = None
    title: str
    amount: float
    type: str
    date: dt_date
    note: Optional[str] = None
    recurrence: str
    recurrence_end_date: Optional[dt_date] = None
    is_private: bool
    created_at: dt_datetime
    category: Optional[Category] = None
    account_name: Optional[str] = None
    to_account_name: Optional[str] = None
    is_projected: Optional[bool] = False  # To distinguish real vs projected recurring items

    class Config:
        from_attributes = True

# Budget Schemas
class BudgetBase(BaseModel):
    category_id: int
    month: str  # YYYY-MM
    limit_amount: float

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    limit_amount: float

class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    spent_amount: float
    category: Category

    class Config:
        from_attributes = True

# Dashboard/Analytics Schemas
class AnalyticsSummary(BaseModel):
    total_balance: float
    monthly_income: float
    monthly_expenses: float
    net_savings: float
    currency: str

class MonthlyData(BaseModel):
    month: str  # YYYY-MM
    income: float
    expense: float

class CategorySpending(BaseModel):
    category_name: str
    category_color: str
    amount: float
    percentage: float

class NetWorthData(BaseModel):
    date: str  # YYYY-MM-DD or YYYY-MM
    amount: float

# Partner Schemas
class InviteCodeRequest(BaseModel):
    invite_code: str

class InviteLinkResponse(BaseModel):
    invite_code: str
    invite_link: str

class PartnerResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    status: str

    class Config:
        from_attributes = True

class PartnerLinkResponse(BaseModel):
    id: int
    requester_id: int
    recipient_id: Optional[int] = None
    invite_code: str
    status: str
    created_at: dt_datetime
    accepted_at: Optional[dt_datetime] = None

    class Config:
        from_attributes = True

class SharingSettingToggle(BaseModel):
    partner_id: int
    is_shared: bool

class SharingSettingsResponse(BaseModel):
    account_id: int
    account_name: str
    partner_id: int
    partner_name: str
    is_shared: bool

    class Config:
        from_attributes = True
