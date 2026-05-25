# Money Manager - Premium Personal Finance Portal

Money Manager is a highly responsive, visually stunning personal finance web application built using **React** (frontend) and **FastAPI** (backend) with **SQLite** for development and a migration-friendly **SQLAlchemy ORM** database architecture.

---

## Key Features

1. **JWT-Based Authentication**: Secure login/signup gateways. Newly registered users automatically receive a default currency setting and a seed pack of default expense/income categories.
2. **Account Portfolios (CRUD)**: Manage multiple bank checking, savings, credit cards, and investment accounts in a grid of 3D tilt-effect cards.
3. **Transaction History & Filter Panels**: Full transaction history list with live search filters by type, date range, account, and categories.
4. **Recurrence Engine**: Yields actual and future projected recurring items (daily, weekly, monthly, yearly) on queries, projecting cashflow up to 2 years in advance.
5. **Budgets & Real-Time Warn Alert**: Dynamic category budgets with real-time utilization progress bars. Triggers visual warning flags and toast banners upon reaching **80% or 100%** limits.
6. **Analytics charts**: Features Income vs Expense side-by-side bar charts, category expense pie-charts, and reconstructed historical net worth timelines.
7. **Custom Monthly calendar**: Seamless date grid linking transaction dots. Clicking calendar dates opens detailed sub-lists to CRUD transactions inline.
8. **Dual Mode theme**: Premium frosted glassmorphism overlays with vivid red active-glow states. Adapts between Dark and Light mode automatically (persisted via `localStorage`).

---

## Directory Layout

```text
c:\M&M/
├── backend/
│   ├── app/
│   │   ├── database.py       # SQLAlchemy engine & SQLite config
│   │   ├── models.py         # SQLAlchemy schemas (User, Account, Transaction, Budget, Category)
│   │   ├── schemas.py        # Pydantic validation validation rules
│   │   ├── auth.py           # Bcrypt & JWT security helpers
│   │   └── routers/
│   │       ├── auth.py       # Signup & login routes (seeds default categories)
│   │       ├── users.py      # Profile retrieval & currency updates
│   │       ├── accounts.py   # Account portfolios CRUD
│   │       ├── categories.py # Default & custom categories CRUD
│   │       ├── transactions.py # Core transaction CRUD & recurrence projection
│   │       ├── budgets.py    # Target limit CRUD & spending aggregates
│   │       └── analytics.py  # Dashboard aggregates & Net Worth timeline history
│   ├── seed.py               # Database seed loader script
│   └── requirements.txt      # Python dependencies manifest
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layouts/      # Main responsive Sidebar/BottomNav layouts
│   │   │   └── ui/           # Shared widgets (Dynamic Icon mapping)
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Caches user currency preferences
│   │   │   ├── ThemeContext.jsx  # Dark/Light toggle
│   │   │   └── ToastContext.jsx  # Glassmorphic warning alerts
│   │   ├── hooks/
│   │   │   └── useCountUp.js     # Numerical counter animations
│   │   ├── pages/            # Login, Signup, Dashboard, Accounts, Transactions, Budgets, Settings
│   │   ├── utils/
│   │   │   └── api.js        # Global fetch client with JWT interceptor
│   │   ├── App.jsx           # React-Router setup & Protected Route guards
│   │   ├── index.css         # Styling system base & custom glass cards classes
│   │   └── main.jsx          # React DOM mounting
│   ├── index.html            # Google Font Outfit/Inter mounts
│   ├── postcss.config.js
│   ├── tailwind.config.js    # Custom red theme configurations
│   └── vite.config.js
└── README.md
```

---

## Local Setup Instructions

### 1. Backend Server Configuration

Ensure you have Python 3.10+ installed.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Initialize the database and populate test data:
   ```bash
   python seed.py
   ```
4. Fire up the local FastAPI service:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The API documentation will be interactive and accessible at `http://127.0.0.1:8000/docs`.

### 2. Frontend Client Setup

Ensure you have Node.js 18+ installed.

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Launch the local dev server:
   ```bash
   npm run dev
   ```
4. Access the web app at `http://localhost:5173`.

---

## Seeded Login Credentials

To explore the dashboard immediately with accounts, transactions, and alerts:

* **Email:** `demo@example.com`
* **Password:** `password123`

*Note: The demo seed includes a Food & Dining budget set to $500, with $420.40 already spent. Adding a transaction in the Food category or viewing the Budgets page will demonstrate the real-time **84% utilization toast and dashboard indicator warnings**!*