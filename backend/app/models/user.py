from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    
    # Roles: "admin" (Shop Owner / HR) or "employee" (Staff)
    role = Column(String(20), default="employee", nullable=False)
    
    # Biometric Machine PIN / User ID (from Identix terminal)
    biometric_pin = Column(String(50), unique=True, index=True, nullable=True)
    
    # Compensation Configuration
    hourly_rate = Column(Float, default=0.0, nullable=False)         # e.g., ₹100.00 / hour
    monthly_base_salary = Column(Float, default=0.0, nullable=False) # fallback if monthly rate is preferred
    
    # Shift parameters
    shift_start_time = Column(String(10), default="09:00")
    shift_end_time = Column(String(10), default="18:00")
    
    department = Column(String(100), nullable=True)
    designation = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    attendances = relationship("DailyAttendance", back_populates="employee", cascade="all, delete-orphan")
    advances = relationship("AdvancePayment", back_populates="employee", foreign_keys="AdvancePayment.employee_id", cascade="all, delete-orphan")
    payrolls = relationship("MonthlyPayroll", back_populates="employee", cascade="all, delete-orphan")
