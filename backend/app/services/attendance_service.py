from datetime import date, datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User
from app.models.attendance import RawPunch, DailyAttendance

def recalculate_daily_attendance(db: Session, biometric_pin: str, target_date: date) -> Optional[DailyAttendance]:
    """
    Recalculates an employee's daily attendance ledger from all raw biometric punches recorded on target_date.
    Pairs first punch as Check-In and last punch as Check-Out, computing total working hours and day earnings.
    """
    # 1. Locate user mapped to this biometric PIN
    user = db.query(User).filter(User.biometric_pin == biometric_pin).first()
    if not user:
        return None

    # 2. Date boundaries in UTC or local day
    start_dt = datetime.combine(target_date, datetime.min.time())
    end_dt = datetime.combine(target_date, datetime.max.time())

    # 3. Retrieve all raw punches for this employee on this date
    punches = (
        db.query(RawPunch)
        .filter(
            RawPunch.biometric_pin == biometric_pin,
            RawPunch.punch_time >= start_dt,
            RawPunch.punch_time <= end_dt
        )
        .order_by(RawPunch.punch_time.asc())
        .all()
    )

    if not punches:
        return None

    first_punch = punches[0]
    last_punch = punches[-1]
    punch_count = len(punches)

    first_in = first_punch.punch_time
    last_out = None
    total_minutes = 0
    total_hours = 0.0
    status = "CHECKED_IN"

    if punch_count > 1 and last_punch.punch_time > first_punch.punch_time:
        last_out = last_punch.punch_time
        diff_seconds = (last_out - first_in).total_seconds()
        total_minutes = int(diff_seconds // 60)
        total_hours = round(diff_seconds / 3600.0, 2)

        # Categorize status based on hours
        if total_hours >= 7.5:
            status = "PRESENT"
        elif total_hours >= 3.5:
            status = "HALF_DAY"
        else:
            status = "PARTIAL"

    hourly_rate = user.hourly_rate or 0.0
    daily_earning = round(total_hours * hourly_rate, 2)

    # 4. Upsert DailyAttendance record
    daily_record = (
        db.query(DailyAttendance)
        .filter(
            DailyAttendance.employee_id == user.id,
            DailyAttendance.date == target_date
        )
        .first()
    )

    if not daily_record:
        daily_record = DailyAttendance(
            employee_id=user.id,
            date=target_date,
            first_in=first_in,
            last_out=last_out,
            total_minutes=total_minutes,
            total_hours=total_hours,
            hourly_rate_applied=hourly_rate,
            daily_earning=daily_earning,
            status=status,
            punch_count=punch_count,
            is_manually_adjusted=False
        )
        db.add(daily_record)
    else:
        # Don't overwrite if manually locked by admin unless force updated
        if not daily_record.is_manually_adjusted:
            daily_record.first_in = first_in
            daily_record.last_out = last_out
            daily_record.total_minutes = total_minutes
            daily_record.total_hours = total_hours
            daily_record.hourly_rate_applied = hourly_rate
            daily_record.daily_earning = daily_earning
            daily_record.status = status
            daily_record.punch_count = punch_count

    db.commit()
    db.refresh(daily_record)
    return daily_record

def manual_adjust_attendance(
    db: Session,
    employee_id: int,
    target_date: date,
    first_in: Optional[datetime],
    last_out: Optional[datetime],
    remarks: Optional[str]
) -> DailyAttendance:
    """
    Enables shop owner/admin to manually adjust or fix missing punches.
    """
    user = db.query(User).filter(User.id == employee_id).first()
    if not user:
        raise ValueError("Employee not found")

    total_minutes = 0
    total_hours = 0.0
    status = "PRESENT"

    if first_in and last_out and last_out > first_in:
        diff_seconds = (last_out - first_in).total_seconds()
        total_minutes = int(diff_seconds // 60)
        total_hours = round(diff_seconds / 3600.0, 2)
        if total_hours >= 7.5:
            status = "PRESENT"
        elif total_hours >= 3.5:
            status = "HALF_DAY"
        else:
            status = "PARTIAL"
    elif first_in:
        status = "CHECKED_IN"
    else:
        status = "ABSENT"

    hourly_rate = user.hourly_rate or 0.0
    daily_earning = round(total_hours * hourly_rate, 2)

    daily_record = (
        db.query(DailyAttendance)
        .filter(
            DailyAttendance.employee_id == employee_id,
            DailyAttendance.date == target_date
        )
        .first()
    )

    if not daily_record:
        daily_record = DailyAttendance(
            employee_id=employee_id,
            date=target_date,
            first_in=first_in,
            last_out=last_out,
            total_minutes=total_minutes,
            total_hours=total_hours,
            hourly_rate_applied=hourly_rate,
            daily_earning=daily_earning,
            status=status,
            punch_count=2 if (first_in and last_out) else 1,
            is_manually_adjusted=True,
            remarks=remarks
        )
        db.add(daily_record)
    else:
        daily_record.first_in = first_in
        daily_record.last_out = last_out
        daily_record.total_minutes = total_minutes
        daily_record.total_hours = total_hours
        daily_record.hourly_rate_applied = hourly_rate
        daily_record.daily_earning = daily_earning
        daily_record.status = status
        daily_record.is_manually_adjusted = True
        daily_record.remarks = remarks

    db.commit()
    db.refresh(daily_record)
    return daily_record
