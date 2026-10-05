from datetime import date
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.attendance import DailyAttendance
from app.models.advance import AdvancePayment
from app.schemas.payroll import EmployeePayrollSummary, ComprehensivePayrollReport
from app.schemas.attendance import DailyAttendanceResponse
from app.schemas.advance import AdvanceResponse
from app.core.config import settings

def calculate_employee_payroll(
    db: Session,
    employee_id: int,
    from_date: date,
    to_date: date,
    custom_hourly_rate: Optional[float] = None
) -> EmployeePayrollSummary:
    """
    Computes working hours, gross earnings, mid-month advance cuts, and net pay for an employee
    across any custom date range.
    """
    user = db.query(User).filter(User.id == employee_id).first()
    if not user:
        raise ValueError("Employee not found")

    rate_to_use = custom_hourly_rate if custom_hourly_rate is not None else (user.hourly_rate or 0.0)

    # 1. Fetch daily attendance records in range
    attendances = (
        db.query(DailyAttendance)
        .filter(
            DailyAttendance.employee_id == employee_id,
            DailyAttendance.date >= from_date,
            DailyAttendance.date <= to_date
        )
        .order_by(DailyAttendance.date.asc())
        .all()
    )

    total_hours_worked = 0.0
    total_days_present = 0

    attendance_responses = []
    for att in attendances:
        if att.total_hours > 0:
            total_days_present += 1
            total_hours_worked += att.total_hours
        
        # Calculate daily earning with currently applied rate
        day_earning = round(att.total_hours * rate_to_use, 2)
        
        att_resp = DailyAttendanceResponse(
            id=att.id,
            employee_id=att.employee_id,
            employee_name=user.full_name,
            biometric_pin=user.biometric_pin,
            date=att.date,
            first_in=att.first_in,
            last_out=att.last_out,
            total_minutes=att.total_minutes,
            total_hours=att.total_hours,
            hourly_rate_applied=rate_to_use,
            daily_earning=day_earning,
            status=att.status,
            punch_count=att.punch_count,
            is_manually_adjusted=att.is_manually_adjusted,
            remarks=att.remarks
        )
        attendance_responses.append(att_resp)

    total_hours_worked = round(total_hours_worked, 2)
    gross_earnings = round(total_hours_worked * rate_to_use, 2)

    # 2. Fetch advances and adjustments in range
    advances = (
        db.query(AdvancePayment)
        .filter(
            AdvancePayment.employee_id == employee_id,
            AdvancePayment.date >= from_date,
            AdvancePayment.date <= to_date
        )
        .order_by(AdvancePayment.date.asc())
        .all()
    )

    total_advances_deducted = 0.0
    total_bonuses = 0.0
    advance_responses = []

    for adv in advances:
        if adv.payment_type in ["ADVANCE", "DEDUCTION"]:
            total_advances_deducted += adv.amount
        elif adv.payment_type == "BONUS":
            total_bonuses += adv.amount

        adv_resp = AdvanceResponse(
            id=adv.id,
            employee_id=adv.employee_id,
            employee_name=user.full_name,
            amount=adv.amount,
            date=adv.date,
            payment_type=adv.payment_type,
            payment_mode=adv.payment_mode,
            reason=adv.reason,
            is_settled=adv.is_settled,
            settled_at=adv.settled_at,
            created_at=adv.created_at
        )
        advance_responses.append(adv_resp)

    total_advances_deducted = round(total_advances_deducted, 2)
    total_bonuses = round(total_bonuses, 2)

    # 3. Final Net Payable Calculation:
    # Net Pay = Gross Earnings - Mid-month Advances + Bonuses
    net_payable_salary = round(gross_earnings - total_advances_deducted + total_bonuses, 2)

    return EmployeePayrollSummary(
        employee_id=user.id,
        employee_name=user.full_name,
        biometric_pin=user.biometric_pin,
        department=user.department,
        hourly_rate=rate_to_use,
        from_date=from_date,
        to_date=to_date,
        total_days_present=total_days_present,
        total_hours_worked=total_hours_worked,
        gross_earnings=gross_earnings,
        total_advances_deducted=total_advances_deducted,
        total_bonuses=total_bonuses,
        net_payable_salary=net_payable_salary,
        daily_breakdown=attendance_responses,
        advances_breakdown=advance_responses
    )

def calculate_comprehensive_payroll(
    db: Session,
    from_date: date,
    to_date: date,
    employee_id: Optional[int] = None,
    custom_hourly_rate: Optional[float] = None
) -> ComprehensivePayrollReport:
    """
    Computes comprehensive payroll across all active employees or a specific employee.
    """
    query = db.query(User).filter(User.is_active == True, User.role == "employee")
    if employee_id:
        query = query.filter(User.id == employee_id)
    
    employees = query.all()

    summaries: List[EmployeePayrollSummary] = []
    total_gross = 0.0
    total_advances = 0.0
    total_net = 0.0

    for emp in employees:
        summary = calculate_employee_payroll(
            db=db,
            employee_id=emp.id,
            from_date=from_date,
            to_date=to_date,
            custom_hourly_rate=custom_hourly_rate
        )
        summaries.append(summary)
        total_gross += summary.gross_earnings
        total_advances += summary.total_advances_deducted
        total_net += summary.net_payable_salary

    return ComprehensivePayrollReport(
        organization_name=settings.DEFAULT_ORGANIZATION_NAME,
        from_date=from_date,
        to_date=to_date,
        currency=settings.DEFAULT_CURRENCY_SYMBOL,
        total_employees_count=len(summaries),
        total_gross_payout=round(total_gross, 2),
        total_advances_deducted=round(total_advances, 2),
        total_net_payout=round(total_net, 2),
        employees=summaries
    )
