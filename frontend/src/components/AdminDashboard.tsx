"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  FileText, 
  PlusCircle, 
  Radio, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  FileSpreadsheet, 
  ArrowUpRight, 
  Fingerprint,
  RefreshCw
} from "lucide-react";
import { api } from "@/lib/api";
import { KPICard } from "./KPICard";
import { HoursBarChart, SalaryBreakdownChart } from "./Charts";
import { LivePunchTicker } from "./LivePunchTicker";
import { EmployeeModal } from "./EmployeeModal";
import { AdvanceModal } from "./AdvanceModal";
import { ManualPunchModal } from "./ManualPunchModal";
import { DeviceSimulatorModal } from "./DeviceSimulatorModal";

interface AdminDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  simulatorOpen: boolean;
  setSimulatorOpen: (open: boolean) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab,
  setActiveTab,
  simulatorOpen,
  setSimulatorOpen,
}) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [rawPunches, setRawPunches] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [payrollReport, setPayrollReport] = useState<any | null>(null);

  // Date range state for Payroll & Reports (Default to current month: 1st to today/end of month)
  const todayStr = new Date().toISOString().substring(0, 10);
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  const [payrollFromDate, setPayrollFromDate] = useState(firstDayOfMonth);
  const [payrollToDate, setPayrollToDate] = useState(todayStr);
  const [customRateOverride, setCustomRateOverride] = useState<string>("");

  // Modals
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [manualPunchOpen, setManualPunchOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [empList, todayList, punchList, advList] = await Promise.all([
        api.employees.list(),
        api.attendance.today(),
        api.attendance.rawPunches(30),
        api.advances.list(),
      ]);
      setEmployees(empList);
      setTodayAttendance(todayList);
      setRawPunches(punchList);
      setAdvances(advList);
    } catch (err) {
      console.error("Error fetching admin dashboard data:", err);
    }
  };

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const rate = customRateOverride ? parseFloat(customRateOverride) : undefined;
      const report = await api.payroll.calculate(payrollFromDate, payrollToDate, undefined, rate);
      setPayrollReport(report);
    } catch (err: any) {
      alert("Failed to calculate payroll: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPayroll();
    const interval = setInterval(fetchData, 10000); // Poll every 10s for real-time changes
    return () => clearInterval(interval);
  }, []);

  // Quick Employee map for raw punches
  const employeeMap = employees.reduce((acc, curr) => {
    if (curr.biometric_pin) acc[curr.biometric_pin] = curr.full_name;
    return acc;
  }, {} as Record<string, string>);

  // KPI Calculations
  const presentTodayCount = todayAttendance.filter((a) => a.status === "PRESENT" || a.status === "CHECKED_IN" || a.status === "HALF_DAY").length;
  const totalHoursToday = todayAttendance.reduce((sum, a) => sum + (a.total_hours || 0), 0);
  const totalEarningsToday = todayAttendance.reduce((sum, a) => sum + (a.daily_earning || 0), 0);
  const totalAdvancesThisMonth = advances.reduce((sum, a) => sum + (a.payment_type === "ADVANCE" ? a.amount : 0), 0);

  // Bar chart data for today's hours
  const hoursChartData = todayAttendance.map((a) => ({
    name: a.employee_name ? a.employee_name.split(" ")[0] : `PIN:${a.biometric_pin}`,
    hours: a.total_hours || 0,
    earning: a.daily_earning || 0,
  }));

  const handleDeleteEmployee = async (id: number) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      try {
        await api.employees.delete(id);
        fetchData();
        setActionSuccess("Employee removed successfully");
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleDeleteAdvance = async (id: number) => {
    if (confirm("Delete this advance record?")) {
      try {
        await api.advances.delete(id);
        fetchData();
        fetchPayroll();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleMarkPaid = async (empId: number) => {
    try {
      const res = await api.payroll.markPaid({
        employee_id: empId,
        from_date: payrollFromDate,
        to_date: payrollToDate,
        payment_date: new Date().toISOString().substring(0, 10),
        payment_reference: "Settled via Cash / UPI",
        notes: "Full settlement for the period",
      });
      alert(res.message);
      fetchPayroll();
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Action success alert */}
      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="font-bold">×</button>
        </div>
      )}

      {/* ======================= TAB 1: OVERVIEW & LIVE ATTENDANCE ======================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Present Today"
              value={`${presentTodayCount} / ${employees.length}`}
              subtitle="Staff currently in store / total"
              icon={<Users className="w-6 h-6" />}
              colorScheme="emerald"
            />
            <KPICard
              title="Hours Logged Today"
              value={`${totalHoursToday.toFixed(1)} hrs`}
              subtitle="Sum of active working hours"
              icon={<Clock className="w-6 h-6" />}
              colorScheme="blue"
            />
            <KPICard
              title="Est. Day's Wage"
              value={`₹${totalEarningsToday.toFixed(2)}`}
              subtitle="Per-hour rate applied today"
              icon={<DollarSign className="w-6 h-6" />}
              colorScheme="amber"
            />
            <KPICard
              title="Total Advances Given"
              value={`₹${totalAdvancesThisMonth.toFixed(2)}`}
              subtitle="Auto-deducts in month payroll"
              icon={<TrendingUp className="w-6 h-6" />}
              colorScheme="purple"
            />
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Quick Shop Actions:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingEmployee(null);
                  setEmployeeModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Staff
              </button>
              <button
                onClick={() => setAdvanceModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Give Advance / Extra Pay
              </button>
              <button
                onClick={() => setManualPunchOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                Fix Missing Punch
              </button>
              <button
                onClick={fetchData}
                title="Refresh Live Data"
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chart + Live Stream Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl glass-panel p-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Today's Staff Working Hours
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Calculated First-In to Last-Out
                </span>
              </div>
              <HoursBarChart data={hoursChartData} />
            </div>

            <div className="lg:col-span-1">
              <LivePunchTicker punches={rawPunches} employeeMap={employeeMap} />
            </div>
          </div>

          {/* Today's Live Attendance Table */}
          <div className="rounded-2xl glass-panel p-5 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Today's Attendance & Real-Time Earning Board
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Date: {new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {todayAttendance.length} Tracked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Employee</th>
                    <th className="py-3 px-3">PIN</th>
                    <th className="py-3 px-3">In-Time</th>
                    <th className="py-3 px-3">Out-Time</th>
                    <th className="py-3 px-3">Working Hours</th>
                    <th className="py-3 px-3">Hourly Rate</th>
                    <th className="py-3 px-3">Today's Pay</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {todayAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No employees registered yet. Add staff or run the hardware simulator.
                      </td>
                    </tr>
                  ) : (
                    todayAttendance.map((row) => {
                      const inStr = row.first_in ? new Date(row.first_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";
                      const outStr = row.last_out ? new Date(row.last_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";
                      const isPresent = row.status === "PRESENT" || row.status === "CHECKED_IN";
                      
                      return (
                        <tr key={row.employee_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                            {row.employee_name}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-500">
                            {row.biometric_pin || "N/A"}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                            {inStr}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                            {outStr}
                          </td>
                          <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400">
                            {row.total_hours.toFixed(2)} hrs
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-500">
                            ₹{row.hourly_rate_applied}/hr
                          </td>
                          <td className="py-3 px-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                            ₹{row.daily_earning.toFixed(2)}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isPresent
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : row.status === "HALF_DAY"
                                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                : "bg-slate-500/10 text-slate-500"
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                setManualPunchOpen(true);
                              }}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                            >
                              Adjust
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: STAFF & RATES ======================= */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Staff & Compensation Directory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage employees, biometric terminal PIN matching, and configured hourly rates
              </p>
            </div>
            <button
              onClick={() => {
                setEditingEmployee(null);
                setEmployeeModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Add New Staff
            </button>
          </div>

          <div className="rounded-2xl glass-panel p-5 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Biometric PIN</th>
                    <th className="py-3 px-3">Hourly Rate</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Shift Timing</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {emp.full_name}
                        <p className="text-[10px] text-slate-400 font-normal">@{emp.username}</p>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {emp.biometric_pin || "Not Assigned"}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{emp.hourly_rate.toFixed(2)}/hr
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {emp.phone || "N/A"}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {emp.department || "General"}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {emp.shift_start_time} - {emp.shift_end_time}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingEmployee(emp);
                            setEmployeeModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 3: ADVANCES & EXTRA PAY ======================= */}
      {activeTab === "advances" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Mid-Month Advances & Extra Pay Ledger
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Any advance cash or UPI given mid-month is automatically cut from the monthly salary total
              </p>
            </div>
            <button
              onClick={() => setAdvanceModalOpen(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Record Advance / Extra Pay
            </button>
          </div>

          {/* Formula banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500 text-white shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white">Auto-Deduction Formula: </span>
              Net Monthly Salary = (Total Hours Worked × Hourly Rate) - Total Mid-Month Advances + Bonuses.
            </div>
          </div>

          <div className="rounded-2xl glass-panel p-5 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Employee</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Mode</th>
                    <th className="py-3 px-3">Reason / Remarks</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {advances.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No mid-month advances or extra payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    advances.map((adv) => (
                      <tr key={adv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3 text-slate-500 font-mono">
                          {adv.date}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {adv.employee_name}
                        </td>
                        <td className="py-3 px-3 font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                          ₹{adv.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                          {adv.payment_type}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {adv.payment_mode}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {adv.reason || "Advance payment"}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            adv.is_settled
                              ? "bg-slate-500/10 text-slate-500"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          }`}>
                            {adv.is_settled ? "Settled in Payroll" : "Pending Cut"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeleteAdvance(adv.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 4: PAYROLL & PDF REPORTS ======================= */}
      {activeTab === "payroll" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Payroll Engine & Custom Date Statements
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate monthly or custom billing date statements, view advance deductions, and export PDF slips
              </p>
            </div>

            {/* Global CSV Download */}
            <a
              href={api.reports.getCsvDownloadUrl(payrollFromDate, payrollToDate)}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 flex items-center gap-1.5 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Export Full Sheet (CSV)
            </a>
          </div>

          {/* Date Filter & Rate Override Card */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={payrollFromDate}
                onChange={(e) => setPayrollFromDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={payrollToDate}
                onChange={(e) => setPayrollToDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hourly Rate Override (Optional ₹)
              </label>
              <input
                type="number"
                placeholder="Default per staff"
                value={customRateOverride}
                onChange={(e) => setCustomRateOverride(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <button
                onClick={fetchPayroll}
                disabled={loading}
                className="w-full py-2 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Calculating..." : "Calculate Statement"}
              </button>
            </div>
          </div>

          {/* Summary Figures & Donut Chart */}
          {payrollReport && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPICard
                  title="Total Gross Earned"
                  value={`₹${payrollReport.total_gross_payout.toFixed(2)}`}
                  subtitle="Hours × Hourly Rate"
                  icon={<DollarSign className="w-6 h-6" />}
                  colorScheme="blue"
                />
                <KPICard
                  title="Total Advances Cut"
                  value={`-₹${payrollReport.total_advances_deducted.toFixed(2)}`}
                  subtitle="Mid-month payouts deducted"
                  icon={<TrendingUp className="w-6 h-6" />}
                  colorScheme="rose"
                />
                <KPICard
                  title="Final Net Payable"
                  value={`₹${payrollReport.total_net_payout.toFixed(2)}`}
                  subtitle="Amount to disburse"
                  icon={<CheckCircle2 className="w-6 h-6" />}
                  colorScheme="emerald"
                />
              </div>

              <div className="lg:col-span-1 rounded-2xl glass-panel p-4 border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Payout Distribution
                </h3>
                <SalaryBreakdownChart
                  gross={payrollReport.total_gross_payout}
                  advancesCut={payrollReport.total_advances_deducted}
                  netPay={payrollReport.total_net_payout}
                />
              </div>
            </div>
          )}

          {/* Itemized Employee-wise Statement Table */}
          {payrollReport && (
            <div className="rounded-2xl glass-panel p-5 border border-slate-200 dark:border-slate-800 overflow-hidden">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
                Staff Payroll & Deduction Statement ({payrollFromDate} to {payrollToDate})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                      <th className="py-3 px-3">Employee</th>
                      <th className="py-3 px-3">Days Present</th>
                      <th className="py-3 px-3">Total Hours</th>
                      <th className="py-3 px-3">Rate</th>
                      <th className="py-3 px-3">Gross Salary</th>
                      <th className="py-3 px-3 text-rose-500">Advance Cut</th>
                      <th className="py-3 px-3 text-emerald-500">Net Take-Home</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {payrollReport.employees.map((emp: any) => {
                      const rate = customRateOverride ? parseFloat(customRateOverride) : undefined;
                      const pdfUrl = api.reports.getPdfDownloadUrl(emp.employee_id, payrollFromDate, payrollToDate, rate);

                      return (
                        <tr key={emp.employee_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                            {emp.employee_name}
                            <p className="text-[10px] text-slate-400 font-normal">PIN: {emp.biometric_pin || "N/A"}</p>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                            {emp.total_days_present} days
                          </td>
                          <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400">
                            {emp.total_hours_worked.toFixed(2)} hrs
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-500">
                            ₹{emp.hourly_rate}/hr
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                            ₹{emp.gross_earnings.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 font-bold text-rose-600 dark:text-rose-400">
                            -₹{emp.total_advances_deducted.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            ₹{emp.net_payable_salary.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right space-x-2">
                            <a
                              href={pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 font-bold border border-blue-500/20 transition-all"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              PDF Slip
                            </a>
                            <button
                              onClick={() => handleMarkPaid(emp.employee_id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold border border-emerald-500/20 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Mark Paid
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 5: HARDWARE & ADMS INFO ======================= */}
      {activeTab === "device" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Identix Biometric Terminal & Cloud Push Config
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Device communicates directly over HTTP Cloud ADMS without requiring any local office LAN
              </p>
            </div>
            <button
              onClick={() => setSimulatorOpen(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              Launch Hardware Simulator
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl glass-panel p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-blue-500" />
                Physical Device Hardware Profile
              </h3>
              <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Device Model</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Identix x 2008</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Serial Number (SN)</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">CGKK222862350</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Platform & Kernel</span>
                  <span className="font-semibold text-slate-900 dark:text-white">ZLM60_TFT (ZKFinger VX10.0)</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Push Service Version</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Ver 2.0.33S-20220613</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Protocol Support</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    ADMS Cloud Push Enabled
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl glass-panel p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-500" />
                On-Device Menu Setup Instructions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                To link your physical machine to this cloud backend, enter the on-screen machine settings:
              </p>
              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono space-y-1.5 border border-slate-800">
                <div>[Cloud Server Setting]</div>
                <div>Server Mode: <span className="text-emerald-400">ADMS</span></div>
                <div>Enable Domain Name: <span className="text-emerald-400">ON</span></div>
                <div>Server Address: <span className="text-amber-400">your-deployed-domain.com</span></div>
                <div>Server Port: <span className="text-amber-400">8000 (or 443/80)</span></div>
                <div>Enable Proxy Server: <span className="text-slate-500">OFF</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <EmployeeModal
        isOpen={employeeModalOpen}
        onClose={() => setEmployeeModalOpen(false)}
        onSuccess={fetchData}
        initialData={editingEmployee}
      />

      <AdvanceModal
        isOpen={advanceModalOpen}
        onClose={() => setAdvanceModalOpen(false)}
        onSuccess={() => {
          fetchData();
          fetchPayroll();
        }}
        employees={employees}
      />

      <ManualPunchModal
        isOpen={manualPunchOpen}
        onClose={() => setManualPunchOpen(false)}
        onSuccess={fetchData}
        employees={employees}
      />

      <DeviceSimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        employees={employees}
        onPunchSuccess={fetchData}
      />
    </div>
  );
};
