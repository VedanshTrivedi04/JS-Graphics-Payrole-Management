from fastapi import APIRouter, Request, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.adms_service import generate_handshake_response, process_attlog_payload

router = APIRouter(tags=["ADMS Biometric Push"])

@router.get("/iclock/cdata")
async def adms_handshake(request: Request):
    """
    Step 1: Identix Device Handshake GET request.
    Returns plain-text configuration expected by ZKTeco ADMS firmware.
    """
    query_params = dict(request.query_params)
    sn = query_params.get("SN", "IDENTIX-UNKNOWN")
    print(f"[ADMS HANDSHAKE] Device Serial Number: {sn}")
    
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
    
    body = await request.body()
    data_str = body.decode(errors="ignore")
    
    print(f"[ADMS PUSH] Incoming Table: {table} from Device SN: {sn}")
    
    if table == "ATTLOG":
        count = process_attlog_payload(db=db, device_sn=sn, body_text=data_str)
        print(f"[ADMS PUSH] Processed & Synced {count} punch(es) from Device {sn}")
        # The device strictly expects "OK: <count>" to mark logs as received and cleared from buffer
        return PlainTextResponse(f"OK: {count}")

    # Fallback for other tables like OPERLOG / ATTPHOTO
    return PlainTextResponse("OK")

@router.get("/iclock/getrequest")
async def adms_command_poll(request: Request):
    """
    Step 3: Device heartbeat & remote command poll.
    Returns 'OK' if no pending commands.
    """
    return PlainTextResponse("OK")
