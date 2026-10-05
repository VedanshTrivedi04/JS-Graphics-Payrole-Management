from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, InitialAdminSetup, UserSummary
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with Username, Email, OR Phone number + Password.
    Returns JWT access token with role permissions.
    """
    clean_identifier = login_data.identifier.strip()
    
    # Query matching username OR email OR phone number
    user = (
        db.query(User)
        .filter(
            or_(
                User.username == clean_identifier,
                User.email == clean_identifier,
                User.phone == clean_identifier
            )
        )
        .first()
    )

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email/phone or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    token = create_access_token(subject=user.id, role=user.role)
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserSummary.model_validate(user)
    )

@router.get("/me", response_model=UserSummary)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Retrieve profile of the currently logged-in user.
    """
    return UserSummary.model_validate(current_user)

@router.post("/setup-admin", response_model=TokenResponse)
def setup_initial_admin(admin_data: InitialAdminSetup, db: Session = Depends(get_db)):
    """
    Initial onboarding: Creates the first Shop Owner / Admin account if none exists.
    """
    admin_exists = db.query(User).filter(User.role == "admin").first()
    if admin_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An administrator already exists. Please log in."
        )

    # Check for duplicate username/email/phone
    if db.query(User).filter(User.username == admin_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    new_admin = User(
        username=admin_data.username.strip(),
        hashed_password=get_password_hash(admin_data.password),
        full_name=admin_data.full_name.strip(),
        email=str(admin_data.email).strip() if admin_data.email else None,
        phone=admin_data.phone.strip() if admin_data.phone else None,
        role="admin",
        hourly_rate=0.0,
        is_active=True
    )

    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    token = create_access_token(subject=new_admin.id, role=new_admin.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserSummary.model_validate(new_admin)
    )
