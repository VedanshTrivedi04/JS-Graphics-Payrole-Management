from pydantic import BaseModel, EmailStr
from typing import Optional

class LoginRequest(BaseModel):
    # User can login with either username, email, or phone number!
    identifier: str
    password: str

class UserSummary(BaseModel):
    id: int
    username: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    biometric_pin: Optional[str] = None
    hourly_rate: float
    is_active: bool

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserSummary

class InitialAdminSetup(BaseModel):
    username: str
    password: str
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
