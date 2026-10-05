from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.models import User
from app.core.security import get_password_hash
from app.api.v1 import auth, adms, employees, attendance, advances, payroll, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Automatically create tables in Neon Postgres if not yet created
    Base.metadata.create_all(bind=engine)
    
    # 2. Check if default admin exists; if not, create default initial admin
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.role == "admin").first()
        if not admin_user:
            default_admin = User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="Shop Owner / Administrator",
                email="admin@shop.com",
                phone="9876543210",
                role="admin",
                hourly_rate=0.0,
                is_active=True
            )
            db.add(default_admin)
            db.commit()
            print("---------------------------------------------------------------")
            print(" Default Admin Account Created in Neon Postgres:")
            print(" Username : admin")
            print(" Password : admin123")
            print(" Phone    : 9876543210")
            print(" Email    : admin@shop.com")
            print(" (Please change password in settings upon initial login)")
            print("---------------------------------------------------------------")
    finally:
        db.close()
    
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Identix Biometric Attendance, Hourly Working Hours, and Payroll Management with Neon DB",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for Next.js frontend and mobile clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Root-level ADMS endpoints (Identix biometric machine directly hits /iclock/cdata)
app.include_router(adms.router)

# 2. Versioned API endpoints
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(employees.router, prefix=settings.API_V1_STR)
app.include_router(attendance.router, prefix=settings.API_V1_STR)
app.include_router(advances.router, prefix=settings.API_V1_STR)
app.include_router(payroll.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)

from sqlalchemy import text
from datetime import datetime, timezone

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "adms_listener": "Active on /iclock/cdata",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/ping")
@app.get("/api/v1/keep-alive")
def keep_alive():
    """
    Anti-Sleep Heartbeat Endpoint for Render & Neon DB.
    Hit this endpoint every 10-14 minutes via Cron-job.org / UptimeRobot to:
    1. Prevent Render free-tier container from going to sleep.
    2. Keep the Neon PostgreSQL compute connection warm and prevent DB cold starts.
    """
    db_status = "connected"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "awake",
        "keep_alive": True,
        "server_time_utc": datetime.now(timezone.utc).isoformat(),
        "neon_postgres": db_status,
        "adms_service": "listening on /iclock/cdata",
        "message": "Heartbeat acknowledged. Render container & Neon DB kept awake."
    }

