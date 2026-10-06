"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Languages } from "lucide-react";

export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center p-1 rounded-xl glass-panel border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
      <div className="flex items-center px-2 text-slate-500 dark:text-slate-400">
        <Languages className="w-4 h-4 mr-1 text-blue-500" />
        {!compact && (
          <span className="text-[11px] font-semibold hidden sm:inline mr-1">
            भाषा / Lang:
          </span>
        )}
      </div>
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={() => setLanguage("hi")}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
            language === "hi"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          हिंदी
        </button>
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
            language === "en"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
};
