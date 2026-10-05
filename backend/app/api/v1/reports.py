from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.core.database import get_db
from app.models.user import User
from app.services.payroll_service import calculate_employee_payroll, calculate_comprehensive_payroll
from app.services.report_service import generate_employee_payslip_pdf, generate_payroll_summary_csv
from app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Export & Reports"])

@router.get("/pdf")
def export_payroll_pdf(
    employee_id: int = Query(..., description="Employee ID for individual statement"),
    from_date: date = Query(..., description="Start of date range"),
    to_date: date = Query(..., description="End of date range"),
    custom_hourly_rate: Optional[float] = Query(None, description="Optional custom rate override"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate and download a professional PDF Payslip & Detailed Attendance Breakdown
    for any custom date range.
    """
    if from_date > to_date:
        raise HTTPException(status_code=400, detail="from_date cannot be after to_date")

    # If employee, can only export own report
    if current_user.role == "employee" and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Not authorized to export this employee's statement")

    try:
        summary = calculate_employee_payroll(
            db=db,
            employee_id=employee_id,
            from_date=from_date,
            to_date=to_date,
            custom_hourly_rate=custom_hourly_rate
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    pdf_buffer = generate_employee_payslip_pdf(summary)
    filename = f"Statement_{summary.employee_name.replace(' ', '_')}_{from_date}_{to_date}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename={filename}"
        }
    )

@router.get("/csv")
def export_payroll_csv(
    from_date: date = Query(..., description="Start of date range"),
    to_date: date = Query(..., description="End of date range"),
    employee_id: Optional[int] = Query(None, description="Optional specific employee"),
    custom_hourly_rate: Optional[float] = Query(None, description="Optional rate override"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export comprehensive payroll and attendance summary to CSV (for Excel / Google Sheets).
    """
    if from_date > to_date:
        raise HTTPException(status_code=400, detail="from_date cannot be after to_date")

    if current_user.role == "employee":
        employee_id = current_user.id
        custom_hourly_rate = None

    report = calculate_comprehensive_payroll(
        db=db,
        from_date=from_date,
        to_date=to_date,
        employee_id=employee_id,
        custom_hourly_rate=custom_hourly_rate
    )

    csv_buffer = generate_payroll_summary_csv(report)
    filename = f"Payroll_Summary_{from_date}_{to_date}.csv"

    return StreamingResponse(
        iter([csv_buffer.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
