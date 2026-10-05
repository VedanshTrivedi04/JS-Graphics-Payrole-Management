"use client";

import React, { useState } from "react";
import { X, Clock, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

interface ManualPunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: any[];
}

export const ManualPunchModal: React.FC<ManualPunchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employees,
}) => {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [targetDate, setTargetDate] = useState(new Date().toISOString().substring(0, 10));
  const [firstInTime, setFirstInTime] = useState("09:30");
  const [lastOutTime, setLastOutTime] = useState("18:30");
  const [remarks, setRemarks] = useState("Manual adjustment by shop owner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const inIso = firstInTime ? `${targetDate}T${firstInTime}:00` : undefined;
      const outIso = lastOutTime ? `${targetDate}T${lastOutTime}:00` : undefined;

      await api.attendance.manualAdjust({
        employee_id: Number(employeeId),
        date: targetDate,
        first_in: inIso,
        last_out: outIso,
        remarks,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to adjust attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl glass-panel p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Manual Attendance Adjustment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fix missing check-in/out times. Hours & pay recalculate instantly.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Employee
            </label>
            <select
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} (PIN: {emp.biometric_pin || emp.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date
            </label>
            <input
              required
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                In-Time (Check-In)
              </label>
              <input
                type="time"
                value={firstInTime}
                onChange={(e) => setFirstInTime(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Out-Time (Check-Out)
              </label>
              <input
                type="time"
                value={lastOutTime}
                onChange={(e) => setLastOutTime(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? "Updating..." : "Save Manual Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
