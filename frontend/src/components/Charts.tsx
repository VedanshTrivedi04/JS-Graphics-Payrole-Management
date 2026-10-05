"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { useTheme } from "@/context/ThemeContext";

interface HoursBarChartProps {
  data: { name: string; hours: number; earning: number }[];
}

export const HoursBarChart: React.FC<HoursBarChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1f2937" : "#e2e8f0"} />
          <XAxis 
            dataKey="name" 
            stroke={isDark ? "#9ca3af" : "#64748b"} 
            fontSize={11}
            tickLine={false}
          />
          <YAxis 
            stroke={isDark ? "#9ca3af" : "#64748b"} 
            fontSize={11}
            tickLine={false}
            unit="h"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#111827" : "#ffffff",
              borderColor: isDark ? "#374151" : "#e2e8f0",
              borderRadius: "12px",
              color: isDark ? "#f3f4f6" : "#111827",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              fontSize: "12px",
            }}
            formatter={(value: any, name: any) => [
              name === "hours" ? `${value} hrs` : `₹${value}`,
              name === "hours" ? "Working Hours" : "Day's Earning"
            ]}
          />
          <Bar 
            dataKey="hours" 
            fill="#3b82f6" 
            radius={[6, 6, 0, 0]} 
            name="hours"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface SalaryBreakdownChartProps {
  gross: number;
  advancesCut: number;
  netPay: number;
}

export const SalaryBreakdownChart: React.FC<SalaryBreakdownChartProps> = ({
  gross,
  advancesCut,
  netPay,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const data = [
    { name: "Net Take-Home Pay", value: Math.max(0, netPay), color: "#10b981" },
    { name: "Mid-Month Advances Cut", value: Math.max(0, advancesCut), color: "#ef4444" },
  ];

  return (
    <div className="w-full h-72 flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#111827" : "#ffffff",
              borderColor: isDark ? "#374151" : "#e2e8f0",
              borderRadius: "12px",
              color: isDark ? "#f3f4f6" : "#111827",
              fontSize: "12px",
            }}
            formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, "Amount"]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend below */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">Net Pay: ₹{netPay.toFixed(0)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">Advance Cut: ₹{advancesCut.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
};
