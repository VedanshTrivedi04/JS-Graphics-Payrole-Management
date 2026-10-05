"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Save, DollarSign } from "lucide-react";
import { api } from "@/lib/api";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
    phone: "",
    biometric_pin: "",
    hourly_rate: 100,
    department: "Sales & Billing",
    designation: "Associate",
    shift_start_time: "09:00",
    shift_end_time: "18:00",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username || "",
        password: "",
        full_name: initialData.full_name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        biometric_pin: initialData.biometric_pin || "",
        hourly_rate: initialData.hourly_rate || 100,
        department: initialData.department || "Sales & Billing",
        designation: initialData.designation || "Associate",
        shift_start_time: initialData.shift_start_time || "09:00",
        shift_end_time: initialData.shift_end_time || "18:00",
      });
    } else {
      setFormData({
        username: "",
        password: "",
        full_name: "",
        email: "",
        phone: "",
        biometric_pin: "",
        hourly_rate: 100,
        department: "Sales & Billing",
        designation: "Associate",
        shift_start_time: "09:00",
        shift_end_time: "18:00",
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (initialData) {
        const updatePayload: any = { ...formData };
        if (!updatePayload.password) delete updatePayload.password;
        await api.employees.update(initialData.id, updatePayload);
      } else {
        await api.employees.create(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl glass-panel p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {initialData ? "Edit Employee Profile" : "Register New Staff Member"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure credentials, biometric terminal PIN, and hourly salary rate
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Ramesh Sharma"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Biometric Machine PIN *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. 101"
                value={formData.biometric_pin}
                onChange={(e) => setFormData({ ...formData, biometric_pin: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Username (for Login) *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. ramesh"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password {initialData ? "(Leave empty to keep)" : "*"}
              </label>
              <input
                required={!initialData}
                type="password"
                placeholder="******"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. 9811223344"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hourly Rate (₹ / Hour) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                <input
                  required
                  type="number"
                  step="0.5"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-7 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shift Start
              </label>
              <input
                type="time"
                value={formData.shift_start_time}
                onChange={(e) => setFormData({ ...formData, shift_start_time: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shift End
              </label>
              <input
                type="time"
                value={formData.shift_end_time}
                onChange={(e) => setFormData({ ...formData, shift_end_time: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : initialData ? "Update Employee" : "Register Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
