"use client";

import React from "react";
import { Fingerprint, Clock, CheckCircle2, ArrowRightCircle, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface PunchItem {
  id: number;
  device_sn: string;
  biometric_pin: string;
  punch_time: string;
  punch_type: number;
}

interface LivePunchTickerProps {
  punches: PunchItem[];
  employeeMap?: Record<string, string>;
}

export const LivePunchTicker: React.FC<LivePunchTickerProps> = ({ punches, employeeMap = {} }) => {
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl glass-panel p-5 border border-slate-200/80 dark:border-slate-800/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {t("livePunchesTitle")}
          </h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Listening via Cloud ADMS
        </span>
      </div>

      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {punches.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            <Fingerprint className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400 animate-pulse" />
            {t("noPunchesCaptured")}
          </div>
        ) : (
          punches.slice(0, 8).map((punch) => {
            const empName = employeeMap[punch.biometric_pin] || `Staff (PIN: ${punch.biometric_pin})`;
            const isOut = punch.punch_type === 1;
            const punchDate = new Date(punch.punch_time);
            const timeStr = punchDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

            return (
              <div
                key={punch.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${isOut ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {empName}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      PIN: {punch.biometric_pin} • SN: {punch.device_sn}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isOut
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {isOut ? "Check-Out" : "Check-In"}
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {timeStr}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
