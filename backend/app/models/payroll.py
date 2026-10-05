from sqlalchemy import Column, Integer, Float, DateTime, Date, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class MonthlyPayroll(Base):
    """
    Generated payroll summaries for an employee over a specific period (monthly or custom range).
    Stores calculated hours, gross pay, mid-month advance deductions, bonuses, and net payable.
    """
    __tablename__ = "monthly_payrolls"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    period_start = Column(Date, nullable=False, index=True)
    period_end = Column(Date, nullable=False, index=True)
    
    total_days_worked = Column(Integer, default=0, nullable=False)
    total_hours_worked = Column(Float, default=0.0, nullable=False)
    hourly_rate = Column(Float, default=0.0, nullable=False)
    
    gross_salary = Column(Float, default=0.0, nullable=False)
    total_advances_deducted = Column(Float, default=0.0, nullable=False)
    total_bonuses = Column(Float, default=0.0, nullable=False)
    net_salary = Column(Float, default=0.0, nullable=False)
    
    # Status: 'PENDING', 'PAID'
    status = Column(String(20), default="PENDING", nullable=False)
    payment_date = Column(Date, nullable=True)
    payment_reference = Column(String(100), nullable=True) # e.g., "UPI/123456789" or "Cash"
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    employee = relationship("User", back_populates="payrolls")
