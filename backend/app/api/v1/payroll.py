from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime, timezone
from app.core.database import get_db
from app.models.user import User
from app.models.payroll import MonthlyPayroll
from app.models.advance import AdvancePayment
from app.schemas.payroll import ComprehensivePayrollReport, EmployeePayrollSummary, MarkPayrollPaidRequest
from app.services.payroll_service import calculate_comprehensive_payroll, calculate_employee_payroll
from app.api.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/payroll", tags=["Payroll & Salary Calculation"])

@router.get("/calculate", response_model=ComprehensivePayrollReport)
def calculate_payroll(
    from_date: date = Query(..., description="Start date of the custom billing range"),
    to_date: date = Query(..., description="End date of the custom billing range"),
    employee_id: Optional[int] = Query(None, description="Optional specific employee ID"),
    custom_hourly_rate: Optional[float] = Query(None, description="Optional rate override per hour"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calculate hours worked, gross earnings, mid-month advance pay deductions, and net payable salary
    for any custom date range.
    """
    if from_date > to_date:
        raise HTTPException(status_code=400, detail="from_date cannot be after to_date")

    # If employee, can only calculate for themselves
    if current_user.role == "employee":
        employee_id = current_user.id
        custom_hourly_rate = None # Staff cannot override their rate

    report = calculate_comprehensive_payroll(
        db=db,
        from_date=from_date,
        to_date=to_date,
        employee_id=employee_id,
        custom_hourly_rate=custom_hourly_rate
    )
    return report

@router.post("/mark-paid")
def mark_payroll_paid(
    paid_req: MarkPayrollPaidRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Marks the calculated payroll as PAID and settles mid-month advances for this date range. (Admin only)
    """
    summary = calculate_employee_payroll(
        db=db,
        employee_id=paid_req.employee_id,
        from_date=paid_req.from_date,
        to_date=paid_req.to_date
    )

    payroll_record = MonthlyPayroll(
        employee_id=paid_req.employee_id,
        period_start=paid_req.from_date,
        period_end=paid_req.to_date,
        total_days_worked=summary.total_days_present,
        total_hours_worked=summary.total_hours_worked,
        hourly_rate=summary.hourly_rate,
        gross_salary=summary.gross_earnings,
        total_advances_deducted=summary.total_advances_deducted,
        total_bonuses=summary.total_bonuses,
        net_salary=summary.net_payable_salary,
        status="PAID",
        payment_date=paid_req.payment_date,
        payment_reference=paid_req.payment_reference,
        notes=paid_req.notes
    )
    db.add(payroll_record)

    # Mark all advances in this range as settled
    db.query(AdvancePayment).filter(
        AdvancePayment.employee_id == paid_req.employee_id,
        AdvancePayment.date >= paid_req.from_date,
        AdvancePayment.date <= paid_req.to_date
    ).update({
        "is_settled": True,
        "settled_at": datetime.now(timezone.utc)
    }, synchronize_session=False)

    db.commit()
    db.refresh(payroll_record)

    return {
        "message": f"Payroll for {summary.employee_name} marked as PAID. Net paid: {summary.net_payable_salary}",
        "payroll_id": payroll_record.id
    }
