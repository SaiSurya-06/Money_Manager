from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, users, accounts, categories, transactions, budgets, analytics, partners

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Money Manager API",
    description="Backend services for Money Manager web application",
    version="1.0.0"
)

# CORS configurations
# For production, restrict this to specific origins
origins = [
    "http://localhost:5173",  # React Vite local dev server
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "*"  # Allow all for development flexibility
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root status endpoint
@app.get("/")
def read_root():
    return {"status": "healthy", "service": "Money Manager API"}

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(accounts.router)
app.include_router(categories.router)
app.include_router(transactions.router)
app.include_router(budgets.router)
app.include_router(analytics.router)
app.include_router(partners.router)
