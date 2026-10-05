from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.core.database import get_db
from app.models.user import User
from app.models.attendance import DailyAttendance, RawPunch
from app.schemas.attendance import DailyAttendanceResponse, RawPunchResponse, ManualAttendanceAdjust
from app.services.attendance_service import manual_adjust_attendance, recalculate_daily_attendance
from app.services.adms_service import process_attlog_payload
from app.api.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/attendance", tags=["Attendance Management"])

@router.get("/today", response_model=List[DailyAttendanceResponse])
def get_today_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Real-time Live Attendance Dashboard for today.
    Shows who has punched in, who is still working, total hours, and today's accumulated salary.
    """
    today = date.today()
    
    # Query all active employees
    employees = db.query(User).filter(User.role == "employee", User.is_active == True).all()
    results = []

    for emp in employees:
        att = (
            db.query(DailyAttendance)
            .filter(DailyAttendance.employee_id == emp.id, DailyAttendance.date == today)
            .first()
        )
        
        # If employee has not punched today yet, construct an ABSENT / NOT_IN status object
        if not att:
            results.append(DailyAttendanceResponse(
                id=0,
                employee_id=emp.id,
                employee_name=emp.full_name,
                biometric_pin=emp.biometric_pin,
                date=today,
                first_in=None,
                last_out=None,
                total_minutes=0,
                total_hours=0.0,
                hourly_rate_applied=emp.hourly_rate or 0.0,
                daily_earning=0.0,
                status="NOT_IN",
                punch_count=0,
                is_manually_adjusted=False,
                remarks=None
            ))
        else:
            results.append(DailyAttendanceResponse(
                id=att.id,
                employee_id=emp.id,
                employee_name=emp.full_name,
                biometric_pin=emp.biometric_pin,
                date=att.date,
                first_in=att.first_in,
                last_out=att.last_out,
                total_minutes=att.total_minutes,
                total_hours=att.total_hours,
                hourly_rate_applied=att.hourly_rate_applied,
                daily_earning=att.daily_earning,
                status=att.status,
                punch_count=att.punch_count,
                is_manually_adjusted=att.is_manually_adjusted,
                remarks=att.remarks
            ))

    # If current user is employee, filter to show only their record
    if current_user.role == "employee":
        return [r for r in results if r.employee_id == current_user.id]

    return results

@router.get("/history", response_model=List[DailyAttendanceResponse])
def get_attendance_history(
    employee_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Query historical attendance with date range filters.
    """
    if current_user.role == "employee":
        employee_id = current_user.id

    query = db.query(DailyAttendance).join(User, DailyAttendance.employee_id == User.id)

    if employee_id:
        query = query.filter(DailyAttendance.employee_id == employee_id)
    if from_date:
        query = query.filter(DailyAttendance.date >= from_date)
    if to_date:
        query = query.filter(DailyAttendance.date <= to_date)

    attendances = query.order_by(DailyAttendance.date.desc()).all()
    
    responses = []
    for att in attendances:
        user = att.employee
        responses.append(DailyAttendanceResponse(
            id=att.id,
            employee_id=att.employee_id,
            employee_name=user.full_name if user else "Unknown",
            biometric_pin=user.biometric_pin if user else None,
            date=att.date,
            first_in=att.first_in,
            last_out=att.last_out,
            total_minutes=att.total_minutes,
            total_hours=att.total_hours,
            hourly_rate_applied=att.hourly_rate_applied,
            daily_earning=att.daily_earning,
            status=att.status,
            punch_count=att.punch_count,
            is_manually_adjusted=att.is_manually_adjusted,
            remarks=att.remarks
        ))
    return responses

@router.post("/manual-adjust", response_model=DailyAttendanceResponse)
def adjust_attendance(
    adjust_data: ManualAttendanceAdjust,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Manually fix or adjust an employee's check-in/out times. (Admin only)
    Automatically updates working hours and calculated day earnings.
    """
    try:
        updated = manual_adjust_attendance(
            db=db,
            employee_id=adjust_data.employee_id,
            target_date=adjust_data.date,
            first_in=adjust_data.first_in,
            last_out=adjust_data.last_out,
            remarks=adjust_data.remarks
        )
        user = updated.employee
        return DailyAttendanceResponse(
            id=updated.id,
            employee_id=updated.employee_id,
            employee_name=user.full_name if user else "",
            biometric_pin=user.biometric_pin if user else None,
            date=updated.date,
            first_in=updated.first_in,
            last_out=updated.last_out,
            total_minutes=updated.total_minutes,
            total_hours=updated.total_hours,
            hourly_rate_applied=updated.hourly_rate_applied,
            daily_earning=updated.daily_earning,
            status=updated.status,
            punch_count=updated.punch_count,
            is_manually_adjusted=updated.is_manually_adjusted,
            remarks=updated.remarks
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/raw-punches", response_model=List[RawPunchResponse])
def get_raw_punches(
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    View latest raw biometric punch records directly received from the machine. (Admin only)
    """
    punches = db.query(RawPunch).order_by(RawPunch.punch_time.desc()).limit(limit).all()
    return punches

@router.post("/upload-usb-log")
async def upload_usb_attlog(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Import historical biometric logs directly from a USB pen drive export (e.g. 1_attlog.dat).
    """
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    processed_count = process_attlog_payload(db=db, device_sn="USB-IMPORT", body_text=text)
    return {
        "message": f"Successfully processed and imported {processed_count} attendance records from USB file.",
        "filename": file.filename,
        "records_imported": processed_count
    }
