import io
import csv
from datetime import date
from typing import List
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
from reportlab.lib.units import inch
from app.schemas.payroll import EmployeePayrollSummary, ComprehensivePayrollReport
from app.core.config import settings

def generate_employee_payslip_pdf(summary: EmployeePayrollSummary) -> io.BytesIO:
    """
    Generates a professional, detailed PDF salary slip and attendance report for an employee
    covering any custom date range.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#1e293b"),
        alignment=1 # Center
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b"),
        alignment=1
    )
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=10,
        spaceAfter=6
    )
    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#334155")
    )
    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0f172a")
    )
    header_cell_style = ParagraphStyle(
        'HeaderCellText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white,
        alignment=1 # Center
    )
    fin_cell_style = ParagraphStyle(
        'FinCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#1e293b"),
        alignment=1 # Center
    )
    fin_cell_bold = ParagraphStyle(
        'FinCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0f172a"),
        alignment=1 # Center
    )
    fin_cell_net = ParagraphStyle(
        'FinCellNet',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13,
        textColor=colors.HexColor("#15803d"),
        alignment=1 # Center
    )
    cell_center_style = ParagraphStyle(
        'CellCenterText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#334155"),
        alignment=1 # Center
    )
    cell_center_bold = ParagraphStyle(
        'CellCenterBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
        alignment=1 # Center
    )

    elements = []
    sym = "Rs. "

    # 1. Company Header & Title
    elements.append(Paragraph(settings.DEFAULT_ORGANIZATION_NAME, title_style))
    elements.append(Paragraph("ATTENDANCE & PAYROLL STATEMENT", subtitle_style))
    elements.append(Paragraph(f"Period: {summary.from_date.strftime('%d-%b-%Y')} to {summary.to_date.strftime('%d-%b-%Y')}", subtitle_style))
    elements.append(Spacer(1, 12))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=12))

    # 2. Employee Info & Compensation Card
    info_data = [
        [
            Paragraph("<b>Employee Name:</b>", cell_bold),
            Paragraph(summary.employee_name, cell_style),
            Paragraph("<b>Biometric PIN:</b>", cell_bold),
            Paragraph(summary.biometric_pin or "N/A", cell_style)
        ],
        [
            Paragraph("<b>Department:</b>", cell_bold),
            Paragraph(summary.department or "General Staff", cell_style),
            Paragraph("<b>Hourly Rate:</b>", cell_bold),
            Paragraph(f"{sym}{summary.hourly_rate:.2f} / hr", cell_style)
        ]
    ]
    info_table = Table(info_data, colWidths=[100, 160, 100, 160])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 14))

    # 3. Financial & Hours Summary Box
    financial_data = [
        [
            Paragraph("Days Worked", header_cell_style),
            Paragraph("Total Hours", header_cell_style),
            Paragraph("Gross Earnings", header_cell_style),
            Paragraph("Advance / Extra Cut", header_cell_style),
            Paragraph("Net Payable", header_cell_style),
        ],
        [
            Paragraph(f"{summary.total_days_present} days", fin_cell_style),
            Paragraph(f"{summary.total_hours_worked:.2f} hrs", fin_cell_style),
            Paragraph(f"{sym}{summary.gross_earnings:.2f}", fin_cell_style),
            Paragraph(f"-{sym}{summary.total_advances_deducted:.2f}", fin_cell_bold),
            Paragraph(f"<b>{sym}{summary.net_payable_salary:.2f}</b>", fin_cell_net),
        ]
    ]
    financial_table = Table(financial_data, colWidths=[90, 95, 110, 115, 110])
    financial_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#0f172a")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(financial_table)
    elements.append(Spacer(1, 16))

    # 4. Itemized Attendance Breakdown Table
    elements.append(Paragraph("Day-by-Day Attendance Breakdown", section_style))
    att_headers = ["Date", "In-Time", "Out-Time", "Hours", "Rate", "Day's Earning", "Status"]
    att_rows = [[Paragraph(h, header_cell_style) for h in att_headers]]

    for att in summary.daily_breakdown:
        in_str = att.first_in.strftime("%I:%M %p") if att.first_in else "--:--"
        out_str = att.last_out.strftime("%I:%M %p") if att.last_out else "--:--"
        
        status_color = "#15803d" if att.status == "PRESENT" else ("#b45309" if att.status in ["HALF_DAY", "PARTIAL"] else "#b91c1c")
        status_style = ParagraphStyle(
            f'Status_{att.status}',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor(status_color),
            alignment=1
        )
        
        att_rows.append([
            Paragraph(att.date.strftime("%d-%b-%Y"), cell_center_style),
            Paragraph(in_str, cell_center_style),
            Paragraph(out_str, cell_center_style),
            Paragraph(f"{att.total_hours:.2f}", cell_center_style),
            Paragraph(f"{sym}{att.hourly_rate_applied:.1f}", cell_center_style),
            Paragraph(f"{sym}{att.daily_earning:.2f}", cell_center_bold),
            Paragraph(att.status, status_style)
        ])

    if len(summary.daily_breakdown) == 0:
        att_rows.append([Paragraph("No attendance records found for this period", cell_center_style)] + [Paragraph("", cell_center_style)] * 6)

    att_table = Table(att_rows, colWidths=[80, 75, 75, 55, 65, 85, 85])
    att_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#334155")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(att_table)
    elements.append(Spacer(1, 16))

    # 5. Mid-month Advances & Extra Pay Cuts Table (If any)
    if summary.advances_breakdown:
        elements.append(Paragraph("Advances & Extra Pay Deductions (Cut from Total Salary)", section_style))
        adv_headers = ["Date", "Type", "Amount", "Mode", "Notes / Reason"]
        adv_rows = [[Paragraph(h, header_cell_style) for h in adv_headers]]

        for adv in summary.advances_breakdown:
            adv_rows.append([
                Paragraph(adv.date.strftime("%d-%b-%Y"), cell_center_style),
                Paragraph(adv.payment_type, cell_center_style),
                Paragraph(f"{sym}{adv.amount:.2f}", cell_center_bold),
                Paragraph(adv.payment_mode, cell_center_style),
                Paragraph(adv.reason or "Advance payment", cell_style)
            ])

        adv_table = Table(adv_rows, colWidths=[90, 80, 90, 80, 180])
        adv_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#b91c1c")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#fff1f2")]),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(adv_table)
        elements.append(Spacer(1, 20))

    # 6. Signatures block
    sig_data = [
        [
            Paragraph("____________________________<br/><b>Employee Signature</b>", cell_style),
            Paragraph("____________________________<br/><b>Authorized Signatory / Owner</b>", cell_style)
        ]
    ]
    sig_table = Table(sig_data, colWidths=[260, 260])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 20),
    ]))
    elements.append(KeepTogether(sig_table))

    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_payroll_summary_csv(report: ComprehensivePayrollReport) -> io.StringIO:
    """
    Generates a CSV export of comprehensive payroll and attendance for Excel / spreadsheet view.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Title rows
    writer.writerow([report.organization_name, "PAYROLL & ATTENDANCE SUMMARY"])
    writer.writerow(["Period", f"{report.from_date} to {report.to_date}"])
    writer.writerow([])
    
    # Header
    writer.writerow([
        "Employee ID",
        "Employee Name",
        "Biometric PIN",
        "Department",
        "Hourly Rate",
        "Days Present",
        "Total Hours",
        "Gross Earnings",
        "Advances Cut",
        "Bonuses",
        "Net Payable"
    ])
    
    for emp in report.employees:
        writer.writerow([
            emp.employee_id,
            emp.employee_name,
            emp.biometric_pin or "",
            emp.department or "",
            emp.hourly_rate,
            emp.total_days_present,
            emp.total_hours_worked,
            emp.gross_earnings,
            emp.total_advances_deducted,
            emp.total_bonuses,
            emp.net_payable_salary
        ])
        
    writer.writerow([])
    writer.writerow([
        "TOTAL",
        f"{report.total_employees_count} Employees",
        "",
        "",
        "",
        "",
        "",
        report.total_gross_payout,
        report.total_advances_deducted,
        "",
        report.total_net_payout
    ])
    
    output.seek(0)
    return output
