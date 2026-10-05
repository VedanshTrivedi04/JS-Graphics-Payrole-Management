"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { KPICard } from "./KPICard";
import { 
  Clock, 
  DollarSign, 
  Calendar, 
  Download, 
  TrendingUp, 
  CheckCircle2, 
  Fingerprint, 
  FileText,
  AlertCircle
} from "lucide-react";

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [monthPayroll, setMonthPayroll] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().substring(0, 10);
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);

  const fetchStaffData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [todayList, historyList, advList, payrollSummary] = await Promise.all([
        api.attendance.today(),
        api.attendance.history(user.id),
        api.advances.list(user.id),
        api.payroll.calculate(firstDayOfMonth, todayStr, user.id),
      ]);

      const myToday = todayList.find((a: any) => a.employee_id === user.id);
      setTodayRecord(myToday || null);
      setHistory(historyList);
      setAdvances(advList);
      if (payrollSummary.employees && payrollSummary.employees.length > 0) {
        setMonthPayroll(payrollSummary.employees[0]);
      }
    } catch (err) {
      console.error("Error loading employee dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [user]);

  if (!user) return null;

  const pdfUrl = api.reports.getPdfDownloadUrl(user.id, firstDayOfMonth, todayStr);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <Fingerprint className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Namaste, {user.full_name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Staff PIN: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{user.biometric_pin || "N/A"}</span> • Hourly Rate: <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{user.hourly_rate.toFixed(2)}/hr</span>
              </p>
            </div>
          </div>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download My Month Payslip (PDF)
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Today's Hours"
          value={todayRecord ? `${todayRecord.total_hours.toFixed(2)} hrs` : "0.00 hrs"}
          subtitle={todayRecord?.first_in ? `In: ${new Date(todayRecord.first_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Not checked in yet"}
          icon={<Clock className="w-6 h-6" />}
          colorScheme="blue"
        />
        <KPICard
          title="Today's Earning"
          value={todayRecord ? `₹${todayRecord.daily_earning.toFixed(2)}` : "₹0.00"}
          subtitle={`At ₹${user.hourly_rate}/hr rate`}
          icon={<DollarSign className="w-6 h-6" />}
          colorScheme="emerald"
        />
        <KPICard
          title="This Month Take-Home"
          value={monthPayroll ? `₹${monthPayroll.net_payable_salary.toFixed(2)}` : "₹0.00"}
          subtitle={monthPayroll ? `After -₹${monthPayroll.total_advances_deducted} advance cut` : "Calculated live"}
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorScheme="purple"
        />
      </div>

      {/* Today's Live Clock Card */}
      <div className="rounded-2xl glass-panel p-5 border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          Today's Biometric Attendance Status
        </h3>

        {todayRecord && todayRecord.status !== "NOT_IN" ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Punch In (Arrival)</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {todayRecord.first_in ? new Date(todayRecord.first_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Punch Out (Departure)</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {todayRecord.last_out ? new Date(todayRecord.last_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active Now"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Logged Hours</p>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400 mt-1">
                {todayRecord.total_hours.toFixed(2)} hrs
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Today's Accumulation</p>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{todayRecord.daily_earning.toFixed(2)}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            You haven't punched your fingerprint today. Scan your finger on the shop machine to begin your shift.
          </div>
        )}
      </div>

      {/* Mid-Month Advances Transparency Card */}
      {advances.length > 0 && (
        <div className="rounded-2xl glass-panel p-5 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-rose-500" />
            Mid-Month Cash / UPI Advances Taken
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            These amounts are deducted from your final monthly salary payout.
          </p>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {advances.map((adv) => (
              <div key={adv.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    ₹{adv.amount.toFixed(2)} via {adv.payment_mode}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {adv.date} • {adv.reason || "Advance payment"}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Deduction
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Attendance History Table */}
      <div className="rounded-2xl glass-panel p-5 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          My Recent Attendance & Hours History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">In-Time</th>
                <th className="py-3 px-3">Out-Time</th>
                <th className="py-3 px-3">Hours Worked</th>
                <th className="py-3 px-3">Earned (₹)</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No historical attendance found yet.
                  </td>
                </tr>
              ) : (
                history.map((row) => {
                  const inStr = row.first_in ? new Date(row.first_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";
                  const outStr = row.last_out ? new Date(row.last_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 font-mono">
                        {row.date}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {inStr}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {outStr}
                      </td>
                      <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400">
                        {row.total_hours.toFixed(2)} hrs
                      </td>
                      <td className="py-3 px-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₹{row.daily_earning.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {row.status}
                        </span>
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
  );
};
