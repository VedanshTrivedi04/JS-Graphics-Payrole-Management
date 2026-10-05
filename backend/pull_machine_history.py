import sys
import os
from datetime import datetime
from zk import ZK, const

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.attendance import RawPunch
from app.services.attendance_service import recalculate_daily_attendance

def pull_entire_machine_history(device_ip: str = "192.168.1.201", port: int = 4370, comm_key: int = 0):
    """
    Connects directly to the Identix terminal over LAN socket (Port 4370),
    dumps ALL registered users and the ENTIRE historical attendance log database,
    and ingests everything directly into Neon PostgreSQL.
    """
    print(f"================================================================")
    print(f" Connecting to Identix Machine at {device_ip}:{port} (Comm Key: {comm_key})...")
    print(f"================================================================")

    zk = ZK(device_ip, port=port, timeout=10, password=comm_key, force_udp=False)
    conn = None
    db = SessionLocal()

    try:
        conn = zk.connect()
        print("Connected to Device successfully!")
        
        # Disable device temporarily to prevent concurrent writes during historical dump
        conn.disable_device()

        # 1. Fetch Machine Info
        sn = conn.get_serialnumber() or "IDENTIX-UNKNOWN"
        firmware = conn.get_firmware_version()
        platform = conn.get_platform()
        print(f"Device SN: {sn} | Firmware: {firmware} | Platform: {platform}")

        # 2. Extract All Registered Users from Machine Database
        print("\n--- 1. Pulling Registered Users from Machine ---")
        users = conn.get_users()
        print(f"Found {len(users)} registered users in machine memory.")
        
        user_pin_map = {}
        for u in users:
            pin = str(u.user_id).strip()
            user_pin_map[pin] = u.name or f"Staff_{pin}"

            # Check if user already exists in Neon DB by biometric_pin
            existing_user = db.query(User).filter(User.biometric_pin == pin).first()
            if not existing_user:
                print(f" -> Creating user in Neon DB: PIN {pin} - {u.name or 'Staff'}")
                new_user = User(
                    username=f"staff_{pin}",
                    hashed_password="$2b$12$dummyhashforinitialmachineimportplaceholder",
                    full_name=u.name if u.name else f"Staff {pin}",
                    biometric_pin=pin,
                    hourly_rate=100.0, # Default initial rate
                    role="employee",
                    is_active=True
                )
                db.add(new_user)
        db.commit()

        # 3. Extract Entire Historical Attendance Log from Machine Database
        print("\n--- 2. Pulling Complete Historical Attendance Logs ---")
        attendances = conn.get_attendance()
        print(f"Total Historical Attendance Records in Machine: {len(attendances)}")

        inserted_punches = 0
        affected_days = set() # (pin, date)

        for record in attendances:
            pin = str(record.user_id).strip()
            punch_time = record.timestamp
            target_date = punch_time.date()

            # Prevent duplicate inserts
            existing_punch = (
                db.query(RawPunch)
                .filter(
                    RawPunch.biometric_pin == pin,
                    RawPunch.punch_time == punch_time
                )
                .first()
            )

            if not existing_punch:
                new_punch = RawPunch(
                    device_sn=sn,
                    biometric_pin=pin,
                    punch_time=punch_time,
                    punch_type=record.status or 0,
                    verify_type=record.punch or 1,
                    raw_payload=f"IMPORTED_FROM_DEVICE_FLASH: {record}"
                )
                db.add(new_punch)
                inserted_punches += 1
                affected_days.add((pin, target_date))

        db.commit()
        print(f"Successfully inserted {inserted_punches} new historical punches into Neon PostgreSQL.")

        # 4. Automatically compute Daily Attendance, Working Hours & Wages for all historical days
        print("\n--- 3. Calculating Historical Working Hours & Daily Wages ---")
        for pin, t_date in affected_days:
            try:
                recalculate_daily_attendance(db, pin, t_date)
            except Exception as e:
                print(f"Calculation error for PIN {pin} on {t_date}: {e}")

        print(f"Processed and calculated attendance for {len(affected_days)} employee-day records.")
        print("\n All historical data from machine is now safely stored in Neon DB!")

    except Exception as e:
        print(f"\nConnection Error: {e}")
        print("\nTips:")
        print("1. Check machine IP address in machine menu: Comm -> Network -> IP Address.")
        print("2. Ensure PC and Machine are on the same Wi-Fi / Router or connected with Ethernet cable.")
        print("3. Check Comm Key in machine menu (default is 0).")
    finally:
        if conn:
            conn.enable_device()
            conn.disconnect()
        db.close()

if __name__ == "__main__":
    ip = sys.argv[1] if len(sys.argv) > 1 else "192.168.1.201"
    key = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    pull_entire_machine_history(device_ip=ip, comm_key=key)
