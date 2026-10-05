from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.core.database import get_db
from app.models.user import User
from app.models.advance import AdvancePayment
from app.schemas.advance import AdvanceCreate, AdvanceUpdate, AdvanceResponse
from app.api.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/advances", tags=["Advances & Extra Pay Management"])

@router.post("/", response_model=AdvanceResponse, status_code=status.HTTP_201_CREATED)
def record_advance_payment(
    adv_data: AdvanceCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Record an advance payment (extra pay) or bonus given to an employee.
    Advances will be automatically deducted from their monthly/periodic payroll calculation.
    """
    emp = db.query(User).filter(User.id == adv_data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    new_adv = AdvancePayment(
        employee_id=adv_data.employee_id,
        amount=adv_data.amount,
        date=adv_data.date,
        payment_type=adv_data.payment_type.upper(),
        payment_mode=adv_data.payment_mode.upper(),
        reason=adv_data.reason,
        is_settled=False,
        created_by_id=admin.id
    )

    db.add(new_adv)
    db.commit()
    db.refresh(new_adv)

    return AdvanceResponse(
        id=new_adv.id,
        employee_id=new_adv.employee_id,
        employee_name=emp.full_name,
        amount=new_adv.amount,
        date=new_adv.date,
        payment_type=new_adv.payment_type,
        payment_mode=new_adv.payment_mode,
        reason=new_adv.reason,
        is_settled=new_adv.is_settled,
        settled_at=new_adv.settled_at,
        created_at=new_adv.created_at
    )

@router.get("/", response_model=List[AdvanceResponse])
def list_advances(
    employee_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    is_settled: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List advance payments and deductions with optional filters.
    Staff can view their own advances; Admins can view all.
    """
    if current_user.role == "employee":
        employee_id = current_user.id

    query = db.query(AdvancePayment).join(User, AdvancePayment.employee_id == User.id)

    if employee_id:
        query = query.filter(AdvancePayment.employee_id == employee_id)
    if from_date:
        query = query.filter(AdvancePayment.date >= from_date)
    if to_date:
        query = query.filter(AdvancePayment.date <= to_date)
    if is_settled is not None:
        query = query.filter(AdvancePayment.is_settled == is_settled)

    advances = query.order_by(AdvancePayment.date.desc()).all()
    
    responses = []
    for adv in advances:
        responses.append(AdvanceResponse(
            id=adv.id,
            employee_id=adv.employee_id,
            employee_name=adv.employee.full_name if adv.employee else "",
            amount=adv.amount,
            date=adv.date,
            payment_type=adv.payment_type,
            payment_mode=adv.payment_mode,
            reason=adv.reason,
            is_settled=adv.is_settled,
            settled_at=adv.settled_at,
            created_at=adv.created_at
        ))
    return responses

@router.delete("/{advance_id}")
def delete_advance(
    advance_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Delete an advance payment record. (Admin only)
    """
    adv = db.query(AdvancePayment).filter(AdvancePayment.id == advance_id).first()
    if not adv:
        raise HTTPException(status_code=404, detail="Advance record not found")

    db.delete(adv)
    db.commit()
    return {"message": "Advance record deleted successfully"}
