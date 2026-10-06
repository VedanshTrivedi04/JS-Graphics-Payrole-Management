from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from app.schemas.attendance import DailyAttendanceResponse
from app.schemas.advance import AdvanceResponse

class PayrollCalculateRequest(BaseModel):
    employee_id: Optional[int] = None
    from_date: date
    to_date: date
    custom_hourly_rate: Optional[float] = None # Overrides default employee rate if provided

class EmployeePayrollSummary(BaseModel):
    employee_id: int
    employee_name: str
    biometric_pin: Optional[str] = None
    department: Optional[str] = None
    hourly_rate: float
    from_date: date
    to_date: date
    
    total_days_present: int
    total_hours_worked: float
    gross_earnings: float
    
    total_advances_deducted: float
    total_bonuses: float
    net_payable_salary: float
    
    daily_breakdown: List[DailyAttendanceResponse] = []
    advances_breakdown: List[AdvanceResponse] = []
    is_paid: bool = False
    payment_date: Optional[date] = None
    payment_reference: Optional[str] = None

class ComprehensivePayrollReport(BaseModel):
    organization_name: str
    from_date: date
    to_date: date
    currency: str
    total_employees_count: int
    total_gross_payout: float
    total_advances_deducted: float
    total_net_payout: float
    employees: List[EmployeePayrollSummary]

class MonthlyCycleSummary(BaseModel):
    month_key: str          # e.g., "2026-10"
    month_name: str         # e.g., "October 2026"
    from_date: date
    to_date: date
    is_current_month: bool
    total_employees: int
    total_hours_worked: float
    total_gross: float
    total_advances: float
    total_net: float
    status: str             # "PAID", "PENDING", "NO_ACTIVITY"

class MarkPayrollPaidRequest(BaseModel):
    employee_id: int
    from_date: date
    to_date: date
    payment_date: date
    payment_reference: Optional[str] = None # e.g. "UPI / Bank Ref #827364"
    notes: Optional[str] = None
