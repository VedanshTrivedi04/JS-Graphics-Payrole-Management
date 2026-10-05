from sqlalchemy import Column, Integer, Float, Boolean, DateTime, Date, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class AdvancePayment(Base):
    """
    Tracks mid-month advances, extra payouts, incentives, and penalty deductions.
    Advances and deductions are automatically calculated and deducted from the employee's monthly payroll.
    """
    __tablename__ = "advance_payments"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    amount = Column(Float, nullable=False) # e.g. ₹2,000.00
    date = Column(Date, nullable=False, index=True)
    
    # Types: "ADVANCE" (extra pay/advance salary), "DEDUCTION" (damage/penalty), "BONUS" (extra reward)
    payment_type = Column(String(20), default="ADVANCE", nullable=False)
    
    # Mode: "CASH", "UPI", "BANK_TRANSFER"
    payment_mode = Column(String(30), default="CASH", nullable=False)
    
    reason = Column(Text, nullable=True) # e.g. "Emergency medical advance requested by staff"
    
    # Settlement tracking
    is_settled = Column(Boolean, default=False, nullable=False)
    settled_at = Column(DateTime, nullable=True)
    
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    employee = relationship("User", back_populates="advances", foreign_keys=[employee_id])
    creator = relationship("User", foreign_keys=[created_by_id])
