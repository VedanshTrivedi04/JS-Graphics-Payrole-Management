"use client";

import React, { useState } from "react";
import { X, Fingerprint, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface DeviceSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: any[];
  onPunchSuccess: () => void;
}

export const DeviceSimulatorModal: React.FC<DeviceSimulatorModalProps> = ({
  isOpen,
  onClose,
  employees,
  onPunchSuccess,
}) => {
  const [selectedPin, setSelectedPin] = useState(employees[0]?.biometric_pin || "101");
  const [punchType, setPunchType] = useState<number>(0); // 0: In, 1: Out
  const [customTime, setCustomTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulate = async () => {
    setLoading(true);
    setResponseMsg(null);
    try {
      let timeStr = customTime;
      if (!timeStr) {
        const now = new Date();
        timeStr = now.toISOString().replace("T", " ").substring(0, 19);
      } else {
        // convert datetime-local input to YYYY-MM-DD HH:MM:SS
        timeStr = customTime.replace("T", ":").substring(0, 19);
        if (timeStr.length === 16) timeStr += ":00";
      }

      const res = await api.device.simulatePunch(selectedPin, timeStr, punchType);
      setResponseMsg(`Device Received & Synced: ${res.trim()}`);
      onPunchSuccess();
    } catch (err: any) {
      setResponseMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl glass-panel p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Fingerprint className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Identix Terminal Simulator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Simulates a hardware biometric scan sent over HTTP ADMS push
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Employee (Machine PIN)
            </label>
            <select
              value={selectedPin}
              onChange={(e) => setSelectedPin(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.biometric_pin || emp.id}>
                  {emp.full_name} (PIN: {emp.biometric_pin || emp.id}) — ₹{emp.hourly_rate}/hr
                </option>
              ))}
              <option value="999">Custom Demo PIN: 999</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Punch Action
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPunchType(0)}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  punchType === 0
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                Check-In (Arrival)
              </button>
              <button
                type="button"
                onClick={() => setPunchType(1)}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  punchType === 1
                    ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                Check-Out (Departure)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Custom Timestamp (Optional, defaults to now)
            </label>
            <input
              type="datetime-local"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          {responseMsg && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{responseMsg}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleSimulate}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {loading ? "Transmitting..." : "Send Hardware Punch to Cloud"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
