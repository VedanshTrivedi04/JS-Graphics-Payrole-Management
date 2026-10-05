import re
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.attendance import RawPunch
from app.services.attendance_service import recalculate_daily_attendance

def generate_handshake_response(sn: str) -> str:
    """
    Constructs the exact plain text configuration block required by ZKTeco / Identix ADMS firmware
    during initial connection handshake.
    """
    return (
        f"GET OPTION FROM: {sn}\n"
        "Stamp=9999\n"
        "OpStamp=9999\n"
        "PhotoStamp=0\n"
        "ErrorDelay=60\n"
        "Delay=30\n"
        "TransTimes=00:00;14:00\n"
        "TransInterval=1\n"
        "TransFlag=1111111111\n"
        "TimeZone=330\n"     # UTC +5:30 (India Standard Time)
        "Realtime=1\n"       # Real-time instant push
        "Encrypt=0\n"
    )

def process_attlog_payload(db: Session, device_sn: str, body_text: str) -> int:
    """
    Parses tab-delimited biometric punch records pushed by the Identix terminal,
    saves new punches into raw_punches, and recalculates daily attendance.
    """
    if not body_text:
        return 0

    lines = body_text.strip().splitlines()
    processed_count = 0
    affected_targets = set() # (biometric_pin, target_date)

    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
        
        # Split by tab or multiple spaces
        parts = re.split(r"\t|\s{2,}", line_clean)
        if len(parts) < 2:
            continue

        pin = parts[0].strip()
        time_str = parts[1].strip()
        
        punch_type = 0
        if len(parts) > 2:
            try:
                punch_type = int(parts[2])
            except ValueError:
                punch_type = 0

        verify_type = 1
        if len(parts) > 3:
            try:
                verify_type = int(parts[3])
            except ValueError:
                verify_type = 1

        try:
            punch_dt = datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            # Fallback for ISO format or alternate time strings
            try:
                punch_dt = datetime.fromisoformat(time_str)
            except Exception:
                continue

        # Check for existing punch to prevent duplicates
        existing = (
            db.query(RawPunch)
            .filter(
                RawPunch.biometric_pin == pin,
                RawPunch.punch_time == punch_dt
            )
            .first()
        )

        if not existing:
            new_punch = RawPunch(
                device_sn=device_sn,
                biometric_pin=pin,
                punch_time=punch_dt,
                punch_type=punch_type,
                verify_type=verify_type,
                raw_payload=line_clean
            )
            db.add(new_punch)
            processed_count += 1
            affected_targets.add((pin, punch_dt.date()))

    if processed_count > 0:
        db.commit()

    # Recalculate daily attendance for each affected employee on that date
    for pin, target_date in affected_targets:
        try:
            recalculate_daily_attendance(db, pin, target_date)
        except Exception as e:
            print(f"Error recalculating attendance for PIN {pin} on {target_date}: {e}")

    return processed_count
