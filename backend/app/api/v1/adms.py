from fastapi import APIRouter, Request, Depends
from fastapi.responses import PlainTextResponse, JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.attendance import DeviceHeartbeat
from app.services.adms_service import generate_handshake_response, process_attlog_payload

router = APIRouter(tags=["ADMS Biometric Push"])

def update_heartbeat(db: Session, sn: str, action: str, client_ip: str, info: str = ""):
    try:
        hb = db.query(DeviceHeartbeat).filter(DeviceHeartbeat.device_sn == sn).first()
        now = datetime.now(timezone.utc)
        if not hb:
            hb = DeviceHeartbeat(
                device_sn=sn,
                ip_address=client_ip,
                last_seen=now,
                last_action=action,
                info=info
            )
            db.add(hb)
        else:
            hb.last_seen = now
            hb.last_action = action
            hb.ip_address = client_ip
            hb.info = info
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[HEARTBEAT ERROR] Failed to record heartbeat for {sn}: {e}")

@router.get("/iclock/cdata")
async def adms_handshake(request: Request, db: Session = Depends(get_db)):
    """
    Step 1: Identix Device Handshake GET request.
    Returns plain-text configuration expected by ZKTeco ADMS firmware.
    """
    query_params = dict(request.query_params)
    sn = query_params.get("SN", "IDENTIX-UNKNOWN")
    client_ip = request.client.host if request.client else "unknown"
    print(f"[ADMS HANDSHAKE] Device Serial Number: {sn} from IP: {client_ip}")

    update_heartbeat(db, sn, "HANDSHAKE", client_ip, str(query_params))

    config_response = generate_handshake_response(sn)
    return PlainTextResponse(config_response)

@router.post("/iclock/cdata")
async def adms_receive_attendance(request: Request, db: Session = Depends(get_db)):
    """
    Step 2: Real-time punch ingestion POST request.
    Pushed by the Identix machine immediately upon fingerprint scan.
    """
    query_params = dict(request.query_params)
    table = query_params.get("table", "")
    sn = query_params.get("SN", "IDENTIX-UNKNOWN")
    client_ip = request.client.host if request.client else "unknown"

    body = await request.body()
    data_str = body.decode(errors="ignore")

    print(f"[ADMS PUSH] Incoming Table: {table} from Device SN: {sn} ({client_ip})")
    update_heartbeat(db, sn, f"PUSH_{table}", client_ip, f"Punches payload size: {len(data_str)}")

    if table == "ATTLOG":
        count = process_attlog_payload(db=db, device_sn=sn, body_text=data_str)
        print(f"[ADMS PUSH] Processed & Synced {count} punch(es) from Device {sn}")
        # The device strictly expects "OK: <count>" to mark logs as received and cleared from buffer
        return PlainTextResponse(f"OK: {count}")

    # Fallback for other tables like OPERLOG / ATTPHOTO
    return PlainTextResponse("OK")

@router.get("/iclock/getrequest")
async def adms_command_poll(request: Request, db: Session = Depends(get_db)):
    """
    Step 3: Device heartbeat & remote command poll.
    Returns 'OK' if no pending commands.
    """
    query_params = dict(request.query_params)
    sn = query_params.get("SN", "IDENTIX-UNKNOWN")
    client_ip = request.client.host if request.client else "unknown"

    update_heartbeat(db, sn, "POLL_COMMAND", client_ip)
    return PlainTextResponse("OK")

@router.get("/iclock/device-status")
def get_device_status(sn: str = "CGKK222862350", db: Session = Depends(get_db)):
    """
    Real-time check to see if the physical hardware is currently connected.
    """
    hb = db.query(DeviceHeartbeat).filter(DeviceHeartbeat.device_sn == sn).first()
    if not hb:
        return {
            "device_sn": sn,
            "is_connected": False,
            "status": "OFFLINE",
            "message": "No heartbeat received yet from this device serial number."
        }

    now = datetime.now(timezone.utc)
    # Ensure hb.last_seen has timezone
    last_seen = hb.last_seen
    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=timezone.utc)
    seconds_ago = int((now - last_seen).total_seconds())

    is_online = seconds_ago <= 180 # within last 3 minutes

    return {
        "device_sn": sn,
        "is_connected": is_online,
        "status": "ONLINE" if is_online else "OFFLINE",
        "seconds_ago": seconds_ago,
        "last_seen_utc": last_seen.isoformat(),
        "last_action": hb.last_action,
        "ip_address": hb.ip_address,
        "message": "Device is live and actively connected!" if is_online else f"Last seen {seconds_ago} seconds ago."
    }
