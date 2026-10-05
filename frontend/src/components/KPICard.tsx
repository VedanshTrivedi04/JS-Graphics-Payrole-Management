import React from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  colorScheme?: "blue" | "emerald" | "amber" | "purple" | "rose";
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorScheme = "blue",
}) => {
  const colorMap = {
    blue: {
      border: "border-blue-500/20",
      bgGradient: "from-blue-500/10 to-indigo-500/5",
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      textAccent: "text-blue-600 dark:text-blue-400",
    },
    emerald: {
      border: "border-emerald-500/20",
      bgGradient: "from-emerald-500/10 to-teal-500/5",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      textAccent: "text-emerald-600 dark:text-emerald-400",
    },
    amber: {
      border: "border-amber-500/20",
      bgGradient: "from-amber-500/10 to-orange-500/5",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      textAccent: "text-amber-600 dark:text-amber-400",
    },
    purple: {
      border: "border-purple-500/20",
      bgGradient: "from-purple-500/10 to-pink-500/5",
      iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      textAccent: "text-purple-600 dark:text-purple-400",
    },
    rose: {
      border: "border-rose-500/20",
      bgGradient: "from-rose-500/10 to-red-500/5",
      iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      textAccent: "text-rose-600 dark:text-rose-400",
    },
  };

  const scheme = colorMap[colorScheme];

  return (
    <div className={`relative overflow-hidden rounded-2xl glass-panel p-5 border ${scheme.border} bg-gradient-to-br ${scheme.bgGradient} transition-all duration-300 hover:scale-[1.01] hover:shadow-xl`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {value}
            </h3>
            {trend && (
              <span className={`text-xs font-semibold ${scheme.textAccent}`}>
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${scheme.iconBg} shadow-inner`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
