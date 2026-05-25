from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Deterministic absolute path for SQLite file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # If running on Vercel serverless environment, write SQLite to /tmp (the only writeable folder)
    if os.getenv("VERCEL") == "1" or "AWS_LAMBDA_FUNCTION_NAME" in os.environ:
        DATABASE_URL = "sqlite:////tmp/money_manager.db"
    else:
        DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'money_manager.db')}"

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("libsql://"):
    DATABASE_URL = DATABASE_URL.replace("libsql://", "sqlite+libsql://", 1)

# Apply check_same_thread ONLY for local sqlite databases (not remote libsql)
is_local_sqlite = DATABASE_URL.startswith("sqlite:") and not DATABASE_URL.startswith("sqlite+libsql")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if is_local_sqlite else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
