from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.api.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/employees", tags=["Employee Management"])

@router.get("/", response_model=List[EmployeeResponse])
def list_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all employees. (Admin sees all, employees see colleagues directory).
    """
    employees = db.query(User).filter(User.role == "employee").order_by(User.full_name.asc()).all()
    return employees

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    emp_data: EmployeeCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Create a new employee profile. (Admin only)
    Sets up credentials (username, password, phone, email), biometric PIN, and per-hour salary rate.
    """
    # Check duplicate username
    if db.query(User).filter(User.username == emp_data.username.strip()).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    # Check duplicate email
    if emp_data.email and db.query(User).filter(User.email == str(emp_data.email).strip()).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    # Check duplicate phone
    if emp_data.phone and db.query(User).filter(User.phone == emp_data.phone.strip()).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")

    # Check duplicate biometric PIN
    if emp_data.biometric_pin and db.query(User).filter(User.biometric_pin == emp_data.biometric_pin.strip()).first():
        raise HTTPException(status_code=400, detail="Biometric Machine PIN is already assigned to another staff")

    new_emp = User(
        username=emp_data.username.strip(),
        hashed_password=get_password_hash(emp_data.password),
        full_name=emp_data.full_name.strip(),
        email=str(emp_data.email).strip() if emp_data.email else None,
        phone=emp_data.phone.strip() if emp_data.phone else None,
        biometric_pin=emp_data.biometric_pin.strip() if emp_data.biometric_pin else None,
        hourly_rate=emp_data.hourly_rate,
        monthly_base_salary=emp_data.monthly_base_salary,
        shift_start_time=emp_data.shift_start_time,
        shift_end_time=emp_data.shift_end_time,
        department=emp_data.department,
        designation=emp_data.designation,
        role="employee",
        is_active=True
    )

    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return new_emp

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve details of a specific employee.
    """
    # If not admin, can only view own profile
    if current_user.role != "admin" and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this profile")

    emp = db.query(User).filter(User.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    emp_update: EmployeeUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Update employee profile, hourly rate, biometric PIN, or shift timings. (Admin only)
    """
    emp = db.query(User).filter(User.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    if emp_update.full_name is not None:
        emp.full_name = emp_update.full_name.strip()
    if emp_update.email is not None:
        emp.email = str(emp_update.email).strip() if emp_update.email else None
    if emp_update.phone is not None:
        emp.phone = emp_update.phone.strip() if emp_update.phone else None
    if emp_update.biometric_pin is not None:
        # Check if already taken
        if emp_update.biometric_pin.strip():
            existing = db.query(User).filter(User.biometric_pin == emp_update.biometric_pin.strip(), User.id != employee_id).first()
            if existing:
                raise HTTPException(status_code=400, detail="Biometric PIN already assigned to another staff")
        emp.biometric_pin = emp_update.biometric_pin.strip() if emp_update.biometric_pin else None
    if emp_update.hourly_rate is not None:
        emp.hourly_rate = emp_update.hourly_rate
    if emp_update.monthly_base_salary is not None:
        emp.monthly_base_salary = emp_update.monthly_base_salary
    if emp_update.shift_start_time is not None:
        emp.shift_start_time = emp_update.shift_start_time
    if emp_update.shift_end_time is not None:
        emp.shift_end_time = emp_update.shift_end_time
    if emp_update.department is not None:
        emp.department = emp_update.department
    if emp_update.designation is not None:
        emp.designation = emp_update.designation
    if emp_update.is_active is not None:
        emp.is_active = emp_update.is_active
    if emp_update.password is not None and emp_update.password.strip():
        emp.hashed_password = get_password_hash(emp_update.password)

    db.commit()
    db.refresh(emp)
    return emp

@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Deactivate or remove employee. (Admin only)
    """
    emp = db.query(User).filter(User.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    db.delete(emp)
    db.commit()
    return {"message": f"Employee {emp.full_name} deleted successfully"}
