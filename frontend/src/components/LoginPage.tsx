"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { 
  Fingerprint, 
  Lock, 
  User, 
  Sun, 
  Moon, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  FileText
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const { 
    login, 
    loginWithBiometric, 
    isBiometricActive, 
    enrolledBiometricUser, 
    disableBiometrics 
  } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [enableBiometricOnLogin, setEnableBiometricOnLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(identifier, password, enableBiometricOnLogin);
    } catch (err: any) {
      setError(err.message || t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setError(null);
    try {
      await loginWithBiometric();
    } catch (err: any) {
      setError(err.message || t("biometricFailed"));
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleQuickFill = (type: "admin" | "staff") => {
    if (type === "admin") {
      setIdentifier("admin");
      setPassword("admin123");
    } else {
      setIdentifier("ramesh");
      setPassword("rameshpassword123");
    }
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 relative overflow-hidden">
      {/* Background ambient decorative orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top right language selector & theme toggle */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-2 z-20">
        <LanguageSelector />
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl glass-panel text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
          aria-label={t("toggleTheme")}
        >
          {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>
      </div>

      <div className="w-full max-w-md mt-6 sm:mt-0">
        {/* Brand header with glowing new app icon */}
        <div className="text-center mb-6">
          <div className="inline-block p-1.5 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 shadow-xl shadow-blue-500/25 mb-3 group hover:scale-105 transition-transform">
            <img
              src="/app-icon.png"
              alt="Identix PayFlow Icon"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-inner object-cover"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t("appName")}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {t("tagline")}
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("accountLogin")}
            </h2>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              {t("liveConnected")}
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </div>
          )}

          {/* 🌟 NATIVE BIOMETRIC / FINGERPRINT QUICK LOGIN BUTTON 🌟 */}
          {isBiometricActive && (
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-purple-600/15 border border-blue-500/30">
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={biometricLoading}
                className="w-full flex flex-col items-center justify-center p-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="p-3 rounded-full bg-white/15 group-hover:scale-110 transition-transform mb-2">
                  <Fingerprint className="w-8 h-8 text-white animate-pulse" />
                </div>
                <span className="font-bold text-sm">
                  {biometricLoading ? t("biometricScanning") : t("loginWithBiometric")}
                </span>
                {enrolledBiometricUser && (
                  <span className="text-[11px] text-blue-100 font-medium mt-0.5">
                    {t("welcomeBack")}, {enrolledBiometricUser.full_name || enrolledBiometricUser.username}
                  </span>
                )}
              </button>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>{t("orEnterPassword")}</span>
                <button
                  type="button"
                  onClick={disableBiometrics}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  {t("unlinkBiometric")}
                </button>
              </div>
            </div>
          )}

          {/* Traditional Password Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("identifierLabel")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  required
                  type="text"
                  placeholder={t("identifierPlaceholder")}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("passwordLabel")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  required
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Enable Fingerprint Login Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="enableBiometricCheck"
                checked={enableBiometricOnLogin}
                onChange={(e) => setEnableBiometricOnLogin(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
              />
              <label 
                htmlFor="enableBiometricCheck" 
                className="text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer flex items-center gap-1.5"
              >
                <Fingerprint className="w-3.5 h-3.5 text-blue-500" />
                {t("enableBiometricLabel")}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? t("authenticating") : t("signInWithPassword")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credential Fillers */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-2">
              {t("quickDemoLogins")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("admin")}
                className="py-2 px-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 transition-all text-center cursor-pointer"
              >
                👑 {t("shopOwner")}
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("staff")}
                className="py-2 px-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 transition-all text-center cursor-pointer"
              >
                👤 {t("staffRamesh")}
              </button>
            </div>
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
          <div className="p-2 rounded-xl glass-panel">
            <Zap className="w-3.5 h-3.5 mx-auto mb-1 text-amber-500" />
            <span>{t("zeroLanPush")}</span>
          </div>
          <div className="p-2 rounded-xl glass-panel">
            <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-1 text-blue-500" />
            <span>{t("fingerprintLogin")}</span>
          </div>
          <div className="p-2 rounded-xl glass-panel">
            <FileText className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-500" />
            <span>{t("pdfSlipEngine")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
