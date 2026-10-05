from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class EmployeeCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    biometric_pin: Optional[str] = None # Terminal user PIN
    hourly_rate: float = 0.0            # e.g., ₹100.0/hr
    monthly_base_salary: float = 0.0
    shift_start_time: str = "09:00"
    shift_end_time: str = "18:00"
    department: Optional[str] = None
    designation: Optional[str] = None
    role: str = "employee"

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    biometric_pin: Optional[str] = None
    hourly_rate: Optional[float] = None
    monthly_base_salary: Optional[float] = None
    shift_start_time: Optional[str] = None
    shift_end_time: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class EmployeeResponse(BaseModel):
    id: int
    username: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    biometric_pin: Optional[str] = None
    hourly_rate: float
    monthly_base_salary: float
    shift_start_time: str
    shift_end_time: str
    department: Optional[str] = None
    designation: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
