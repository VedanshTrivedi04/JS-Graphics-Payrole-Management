"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
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
  AlertCircle,
  Filter,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [todayRecord, setTodayRecord] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [periodPayroll, setPeriodPayroll] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodLoading, setPeriodLoading] = useState(false);

  // Period / Date Range State (Default: Current Month)
  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);
  const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);

  const [fromDate, setFromDate] = useState<string>(firstDayOfThisMonth);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [activePreset, setActivePreset] = useState<"thisMonth" | "lastMonth" | "twoMonthsAgo" | "custom">("thisMonth");

  // Format Helper for Indian / Standard Time (12-hour AM/PM)
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return "--:--";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return "--:--";
    }
  };

  // Format Helper for Dates
  const formatDateDisplay = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(language === "hi" ? "hi-IN" : "en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        weekday: "short"
      });
    } catch {
      return dateString;
    }
  };

  // Preset Handlers
  const setPreset = (preset: "thisMonth" | "lastMonth" | "twoMonthsAgo") => {
    setActivePreset(preset);
    const d = new Date();
    if (preset === "thisMonth") {
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().substring(0, 10);
      setFromDate(start);
      setToDate(todayStr);
      loadPeriodData(start, todayStr);
    } else if (preset === "lastMonth") {
      const start = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().substring(0, 10);
      const end = new Date(d.getFullYear(), d.getMonth(), 0).toISOString().substring(0, 10);
      setFromDate(start);
      setToDate(end);
      loadPeriodData(start, end);
    } else if (preset === "twoMonthsAgo") {
      const start = new Date(d.getFullYear(), d.getMonth() - 2, 1).toISOString().substring(0, 10);
      const end = new Date(d.getFullYear(), d.getMonth() - 1, 0).toISOString().substring(0, 10);
      setFromDate(start);
      setToDate(end);
      loadPeriodData(start, end);
    }
  };

  const loadPeriodData = async (start: string, end: string) => {
    if (!user) return;
    setPeriodLoading(true);
    try {
      const [historyList, advList, payrollSummary] = await Promise.all([
        api.attendance.history(user.id, start, end),
        api.advances.list(user.id, start, end),
        api.payroll.calculate(start, end, user.id),
      ]);

      setHistory(historyList);
      setAdvances(advList);
      if (payrollSummary.employees && payrollSummary.employees.length > 0) {
        setPeriodPayroll(payrollSummary.employees[0]);
      } else {
        setPeriodPayroll(null);
      }
    } catch (err) {
      console.error("Error loading staff period data:", err);
    } finally {
      setPeriodLoading(false);
    }
  };

  const fetchInitialData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const todayList = await api.attendance.today();
      const myToday = todayList.find((a: any) => a.employee_id === user.id);
      setTodayRecord(myToday || null);
      await loadPeriodData(firstDayOfThisMonth, todayStr);
    } catch (err) {
      console.error("Error loading initial employee data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  if (!user) return null;

  // Dynamic PDF Download URL for the selected date range
  const pdfUrl = api.reports.getPdfDownloadUrl(user.id, fromDate, toDate);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Welcome Banner & Identification */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <Fingerprint className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {t("namasteGreeting")}, {user.full_name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t("staffPinLabel")}: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{user.biometric_pin || "N/A"}</span> • {t("hourlyRateLabel")}: <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{user.hourly_rate.toFixed(2)}/hr</span>
              </p>
            </div>
          </div>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 animate-bounce" />
            {t("downloadPeriodPdfBtn")}
          </a>
        </div>
      </div>

      {/* 2. Today's Live Clock Summary (Today Only) */}
      <div className="rounded-2xl glass-panel p-5 border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          {t("empTodayStatusTitle")}
        </h3>

        {todayRecord && todayRecord.status !== "NOT_IN" ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div>
              <p className="text-slate-400 font-medium">{t("punchInArrival")}</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {formatTime(todayRecord.first_in)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">{t("punchOutDeparture")}</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {todayRecord.last_out ? formatTime(todayRecord.last_out) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    {t("activeNowBadge")}
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">{t("loggedHours")}</p>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400 mt-1">
                {todayRecord.total_hours.toFixed(2)} hrs
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">{t("todayAccumulation")}</p>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{todayRecord.daily_earning.toFixed(2)}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            {t("noPunchTodayMsg")}
          </div>
        )}
      </div>

      {/* 3. 🗓️ INTERACTIVE PERIOD & MONTH SELECTOR (Past Months / Custom Dates) */}
      <div className="rounded-2xl glass-panel p-5 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t("selectPeriod")}
            </h3>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPreset("thisMonth")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activePreset === "thisMonth"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {t("thisMonth")}
            </button>
            <button
              type="button"
              onClick={() => setPreset("lastMonth")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activePreset === "lastMonth"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {t("lastMonth")}
            </button>
            <button
              type="button"
              onClick={() => setPreset("twoMonthsAgo")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activePreset === "twoMonthsAgo"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {t("twoMonthsAgo")}
            </button>
          </div>
        </div>

        {/* Custom Date Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {t("fromDateLabel")}
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setActivePreset("custom");
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {t("toDateLabel")}
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setActivePreset("custom");
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => loadPeriodData(fromDate, toDate)}
              disabled={periodLoading}
              className="w-full py-2 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Filter className="w-3.5 h-3.5" />
              {periodLoading ? t("loading") : t("applyPeriodFilter")}
            </button>
          </div>
        </div>
      </div>

      {/* 4. 💰 SELECTED PERIOD SALARY & HOURS SUMMARY CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("periodSummaryTitle")} ({fromDate} ~ {toDate})
          </h3>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            {t("pdfSlipBtn")}
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard
            title={t("daysPresentCount")}
            value={periodPayroll ? `${periodPayroll.total_days_present} days` : "0 days"}
            subtitle={`${t("hourlyRateLabel")}: ₹${user.hourly_rate}/hr`}
            icon={<Calendar className="w-5 h-5" />}
            colorScheme="blue"
          />
          <KPICard
            title={t("totalHoursCount")}
            value={periodPayroll ? `${periodPayroll.total_hours_worked.toFixed(2)} hrs` : "0.00 hrs"}
            subtitle="Verified Biometric Hours"
            icon={<Clock className="w-5 h-5" />}
            colorScheme="amber"
          />
          <KPICard
            title={t("grossEarnedAmount")}
            value={periodPayroll ? `₹${periodPayroll.gross_earnings.toFixed(2)}` : "₹0.00"}
            subtitle={periodPayroll && periodPayroll.total_advances_deducted > 0 ? `-${t("advanceCutAmount")}: ₹${periodPayroll.total_advances_deducted.toFixed(2)}` : "No deductions"}
            icon={<TrendingUp className="w-5 h-5" />}
            colorScheme="purple"
          />
          <KPICard
            title={t("netTakeHomeAmount")}
            value={periodPayroll ? `₹${periodPayroll.net_payable_salary.toFixed(2)}` : "₹0.00"}
            subtitle="Final Take-Home Pay"
            icon={<CheckCircle2 className="w-5 h-5" />}
            colorScheme="emerald"
          />
        </div>
      </div>

      {/* 5. 🕒 DAY-BY-DAY ATTENDANCE BREAKDOWN (KAB AAYE / KAB GAYE DETAIL) */}
      <div className="rounded-2xl glass-panel p-5 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              {t("dayByDayTitle")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Exact arrival, departure, working hours, and daily earnings for {fromDate} to {toDate}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {history.length} {t("daysPresentCount")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 uppercase font-bold text-[11px]">
                <th className="py-3 px-3.5">{t("date")}</th>
                <th className="py-3 px-3 text-emerald-600 dark:text-emerald-400">{t("inTimeLabel")}</th>
                <th className="py-3 px-3 text-rose-600 dark:text-rose-400">{t("outTimeLabel")}</th>
                <th className="py-3 px-3">{t("hoursWorkedLabel")}</th>
                <th className="py-3 px-3 text-emerald-600 dark:text-emerald-400">{t("dayEarningsLabel")}</th>
                <th className="py-3 px-3">{t("statusLabel")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {t("noRecordsForPeriod")}
                  </td>
                </tr>
              ) : (
                history.map((row) => {
                  const inStr = formatTime(row.first_in);
                  const outStr = row.last_out ? formatTime(row.last_out) : (
                    <span className="text-emerald-500 font-semibold">{t("activeNowBadge")}</span>
                  );

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                        {formatDateDisplay(row.date)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-emerald-700 dark:text-emerald-400">
                        {inStr}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {outStr}
                      </td>
                      <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400">
                        {row.total_hours.toFixed(2)} hrs
                      </td>
                      <td className="py-3 px-3 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{row.daily_earning.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
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

      {/* 6. Mid-Month Advances Ledger in Selected Period */}
      {advances.length > 0 && (
        <div className="rounded-2xl glass-panel p-5 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-rose-500" />
            {t("empAdvancesTitle")} ({fromDate} ~ {toDate})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            {t("empAdvancesSub")}
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
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  -{t("deductionBadge")} ₹{adv.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
