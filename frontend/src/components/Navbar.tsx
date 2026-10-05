"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { 
  Fingerprint, 
  Sun, 
  Moon, 
  LogOut, 
  Radio, 
  User as UserIcon, 
  ShieldCheck, 
  Menu, 
  X,
  Sparkles
} from "lucide-react";

interface NavbarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onOpenSimulator?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenSimulator }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  const adminTabs = [
    { id: "overview", label: "Overview & Live Feed" },
    { id: "staff", label: "Staff & Rates" },
    { id: "advances", label: "Advances & Extra Pay" },
    { id: "payroll", label: "Payroll & PDF Reports" },
    { id: "device", label: "Biometric Hardware" },
  ];

  const employeeTabs = [
    { id: "my-today", label: "Today's Clock" },
    { id: "my-history", label: "Attendance History" },
    { id: "my-earnings", label: "Salary & Advances" },
  ];

  const tabs = isAdmin ? adminTabs : employeeTabs;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Device Status */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Fingerprint className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                  Identix PayFlow
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Cloud ADMS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Zero-LAN Biometric Attendance & Hourly Payroll
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          {user && setActiveTab && (
            <nav className="hidden md:flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Quick Test Device Simulator Button */}
            {isAdmin && onOpenSimulator && (
              <button
                onClick={onOpenSimulator}
                title="Test Machine Punch"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Punch Simulator</span>
              </button>
            )}

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>

            {/* User Profile & Logout */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400">
                    {isAdmin ? "Shop Owner" : `Staff (PIN: ${user.biometric_pin || "N/A"})`}
                  </span>
                </div>

                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : null}

            {/* Mobile Hamburger Menu */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && user && setActiveTab && (
          <div className="md:hidden py-3 px-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}

            {isAdmin && onOpenSimulator && (
              <button
                onClick={() => {
                  onOpenSimulator();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 font-medium"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                Test Machine Punch Simulator
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
