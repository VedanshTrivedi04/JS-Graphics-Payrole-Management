import os
import sys
from datetime import date, datetime
from fastapi.testclient import TestClient

# Ensure current directory is on sys.path
sys.path.insert(0, os.path.dirname(__file__))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.main import app
from app.core.database import SessionLocal
from app.models.user import User

client = TestClient(app)

def test_full_pipeline():
    print("=== 1. Testing Health & Root Endpoint ===")
    res = client.get("/")
    assert res.status_code == 200, res.text
    print("Root response:", res.json())

    print("\n=== 2. Testing Admin Login (Default Admin Seeded by Lifespan) ===")
    with client: # Triggers lifespan
        # Test Login by Username
        login_res = client.post("/api/v1/auth/login", json={"identifier": "admin", "password": "admin123"})
        assert login_res.status_code == 200, f"Username login failed: {login_res.text}"
        admin_token = login_res.json()["access_token"]
        print("-> Username Login Successful! Token generated.")

        # Test Login by Phone
        phone_login_res = client.post("/api/v1/auth/login", json={"identifier": "9876543210", "password": "admin123"})
        assert phone_login_res.status_code == 200, f"Phone login failed: {phone_login_res.text}"
        print("-> Phone Number Login Successful!")

        # Test Login by Email
        email_login_res = client.post("/api/v1/auth/login", json={"identifier": "admin@shop.com", "password": "admin123"})
        assert email_login_res.status_code == 200, f"Email login failed: {email_login_res.text}"
        print("-> Email Login Successful!")

        headers = {"Authorization": f"Bearer {admin_token}"}

        print("\n=== 3. Testing Employee Creation with Hourly Rate & Machine PIN ===")
        # Create a test employee: Ramesh Sharma (PIN: 101, Hourly Rate: ₹120.0/hr)
        emp_payload = {
            "username": "ramesh",
            "password": "rameshpassword123",
            "full_name": "Ramesh Sharma",
            "email": "ramesh@shop.com",
            "phone": "9811223344",
            "biometric_pin": "101",
            "hourly_rate": 120.0,
            "department": "Billing & Inventory",
            "designation": "Store Associate",
            "shift_start_time": "09:00",
            "shift_end_time": "18:00"
        }
        
        # Check if already exists in Neon DB
        emp_list = client.get("/api/v1/employees/", headers=headers).json()
        emp_id = None
        for e in emp_list:
            if e["username"] == "ramesh":
                emp_id = e["id"]
                break
        
        if not emp_id:
            emp_res = client.post("/api/v1/employees/", json=emp_payload, headers=headers)
            assert emp_res.status_code == 201, f"Create employee failed: {emp_res.text}"
            emp_id = emp_res.json()["id"]
            print(f"-> Created Employee 'Ramesh Sharma' (ID: {emp_id}, PIN: 101, Rate: ₹120/hr)")
        else:
            print(f"-> Found existing Employee 'Ramesh Sharma' (ID: {emp_id}, PIN: 101)")

        print("\n=== 4. Testing ADMS Handshake (/iclock/cdata) ===")
        handshake_res = client.get("/iclock/cdata?SN=CGKK222862350&pushver=2.0.33S")
        assert handshake_res.status_code == 200
        assert "GET OPTION FROM: CGKK222862350" in handshake_res.text
        assert "TimeZone=330" in handshake_res.text
        print("-> ADMS Handshake response validated:")
        print(handshake_res.text.strip())

        print("\n=== 5. Testing Real-time ADMS Biometric Punch Ingestion ===")
        # Simulate Ramesh (PIN 101) scanning finger at 09:30 AM (Check-in) and 06:30 PM (Check-out) on 2026-10-06
        punch_data = (
            "101\t2026-10-06 09:30:00\t0\t1\t0\t0\n"
            "101\t2026-10-06 18:30:00\t1\t1\t0\t0\n"
        )
        punch_res = client.post(
            "/iclock/cdata?table=ATTLOG&SN=CGKK222862350",
            content=punch_data.encode("utf-8")
        )
        assert punch_res.status_code == 200
        assert "OK:" in punch_res.text
        print(f"-> Machine response received: {punch_res.text.strip()}")

        print("\n=== 6. Validating Daily Working Hours & Day's Earnings Calculation ===")
        att_res = client.get(f"/api/v1/attendance/history?employee_id={emp_id}&from_date=2026-10-06&to_date=2026-10-06", headers=headers)
        assert att_res.status_code == 200, att_res.text
        att_records = att_res.json()
        assert len(att_records) > 0, "No attendance recorded"
        today_att = att_records[0]
        print(f"-> Employee: {today_att['employee_name']}")
        print(f"-> In-Time: {today_att['first_in']} | Out-Time: {today_att['last_out']}")
        print(f"-> Total Hours Calculated: {today_att['total_hours']} hrs (Expected: 9.0 hrs)")
        print(f"-> Day's Calculated Earning: ₹{today_att['daily_earning']} (9.0 hrs * ₹120 = ₹1080.0)")
        assert today_att["total_hours"] == 9.0
        assert today_att["daily_earning"] == 1080.0

        print("\n=== 7. Testing Mid-Month Extra Pay / Advance Deduction ===")
        # Admin records ₹300 advance given in cash to Ramesh
        adv_payload = {
            "employee_id": emp_id,
            "amount": 300.0,
            "date": "2026-10-06",
            "payment_type": "ADVANCE",
            "payment_mode": "CASH",
            "reason": "Mid-day emergency cash advance"
        }
        adv_res = client.post("/api/v1/advances/", json=adv_payload, headers=headers)
        assert adv_res.status_code == 201, adv_res.text
        print(f"-> Recorded Advance Payment of ₹300.00 for {emp_payload['full_name']}")

        print("\n=== 8. Testing Payroll Calculation & Advance Auto-Cut Formula ===")
        # Calculate for 2026-10-01 to 2026-10-31
        payroll_res = client.get(
            f"/api/v1/payroll/calculate?from_date=2026-10-01&to_date=2026-10-31&employee_id={emp_id}",
            headers=headers
        )
        assert payroll_res.status_code == 200, payroll_res.text
        payroll_data = payroll_res.json()
        emp_summary = payroll_data["employees"][0]
        print(f"-> Gross Earnings: ₹{emp_summary['gross_earnings']} (₹1080.0)")
        print(f"-> Mid-Month Advances Cut: -₹{emp_summary['total_advances_deducted']} (-₹300.0)")
        print(f"-> Net Payable Salary: ₹{emp_summary['net_payable_salary']} (Expected: ₹780.0)")
        assert emp_summary["gross_earnings"] == 1080.0
        assert emp_summary["total_advances_deducted"] == 300.0
        assert emp_summary["net_payable_salary"] == 780.0

        print("\n=== 9. Testing PDF Payslip Export ===")
        pdf_res = client.get(
            f"/api/v1/reports/pdf?employee_id={emp_id}&from_date=2026-10-01&to_date=2026-10-31",
            headers=headers
        )
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert len(pdf_res.content) > 1000 # PDF is well-formed binary
        print(f"-> PDF Statement Generated Successfully! Size: {len(pdf_res.content)} bytes")

        print("\n=== 10. Testing CSV Export ===")
        csv_res = client.get(
            f"/api/v1/reports/csv?from_date=2026-10-01&to_date=2026-10-31",
            headers=headers
        )
        assert csv_res.status_code == 200
        assert "Ramesh Sharma" in csv_res.text
        print(f"-> CSV Export Generated Successfully!")
        print("Sample CSV preview:\n" + "\n".join(csv_res.text.strip().splitlines()[:6]))

        print("\n ALL 10 TESTS PASSED WITH 100% SUCCESS AGAINST NEON POSTGRESQL!")

if __name__ == "__main__":
    test_full_pipeline()
