from sqlalchemy import Column, Integer, BigInteger, String, Float, Boolean, DateTime, Date, ForeignKey, UniqueConstraint, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class RawPunch(Base):
    """
    Stores unmodified raw biometric punch signals received directly from the Identix terminal
    via the ADMS HTTP Push protocol (/iclock/cdata) or socket.
    """
    __tablename__ = "raw_punches"

    id = Column(BigInteger, primary_key=True, index=True)
    device_sn = Column(String(50), nullable=False, index=True)
    biometric_pin = Column(String(50), nullable=False, index=True)
    punch_time = Column(DateTime, nullable=False, index=True)
    punch_type = Column(Integer, default=0) # 0: Check-In, 1: Check-Out, 2: Break-Out, 3: Break-In, 4: OT-In, 5: OT-Out
    verify_type = Column(Integer, default=1) # 1: Fingerprint, 2: Password, 3: Card
    raw_payload = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("biometric_pin", "punch_time", name="uq_biometric_punch"),
    )

class DailyAttendance(Base):
    """
    Consolidated daily attendance ledger entry for an employee.
    Calculates first punch as In-Time, last punch as Out-Time, total hours, and day earnings.
    """
    __tablename__ = "daily_attendances"

    id = Column(BigInteger, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    
    first_in = Column(DateTime, nullable=True)
    last_out = Column(DateTime, nullable=True)
    
    total_minutes = Column(Integer, default=0, nullable=False)
    total_hours = Column(Float, default=0.0, nullable=False)
    
    hourly_rate_applied = Column(Float, default=0.0, nullable=False)
    daily_earning = Column(Float, default=0.0, nullable=False) # total_hours * hourly_rate_applied
    
    # Status: 'PRESENT', 'HALF_DAY', 'LATE', 'ABSENT', 'CHECKED_IN'
    status = Column(String(30), default="PRESENT", nullable=False)
    punch_count = Column(Integer, default=0, nullable=False)
    
    is_manually_adjusted = Column(Boolean, default=False, nullable=False)
    remarks = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    employee = relationship("User", back_populates="attendances")

    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="uq_employee_daily_attendance"),
    )

class DeviceHeartbeat(Base):
    """
    Tracks real-time device connection status, IP address, and last ping received from the Identix terminal.
    """
    __tablename__ = "device_heartbeats"

    id = Column(Integer, primary_key=True, index=True)
    device_sn = Column(String(50), unique=True, index=True, nullable=False)
    ip_address = Column(String(60), nullable=True)
    last_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    last_action = Column(String(50), default="HANDSHAKE") # HANDSHAKE, POLL, PUNCH
    info = Column(Text, nullable=True)
