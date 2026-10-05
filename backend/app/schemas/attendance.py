from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

class RawPunchResponse(BaseModel):
    id: int
    device_sn: str
    biometric_pin: str
    punch_time: datetime
    punch_type: int
    verify_type: int

    class Config:
        from_attributes = True

class DailyAttendanceResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    biometric_pin: Optional[str] = None
    date: date
    first_in: Optional[datetime] = None
    last_out: Optional[datetime] = None
    total_minutes: int
    total_hours: float
    hourly_rate_applied: float
    daily_earning: float
    status: str
    punch_count: int
    is_manually_adjusted: bool
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

class ManualAttendanceAdjust(BaseModel):
    employee_id: int
    date: date
    first_in: Optional[datetime] = None
    last_out: Optional[datetime] = None
    remarks: Optional[str] = "Manual entry by admin"
