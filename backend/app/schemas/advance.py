from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class AdvanceCreate(BaseModel):
    employee_id: int
    amount: float
    date: date
    payment_type: str = "ADVANCE"   # "ADVANCE", "DEDUCTION", "BONUS"
    payment_mode: str = "CASH"      # "CASH", "UPI", "BANK_TRANSFER"
    reason: Optional[str] = None

class AdvanceUpdate(BaseModel):
    amount: Optional[float] = None
    date: Optional[date] = None
    payment_type: Optional[str] = None
    payment_mode: Optional[str] = None
    reason: Optional[str] = None
    is_settled: Optional[bool] = None

class AdvanceResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    amount: float
    date: date
    payment_type: str
    payment_mode: str
    reason: Optional[str] = None
    is_settled: bool
    settled_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
