import React from "react";
import { cn } from "@/lib/utils";

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendUp,
  className,
  iconBg = "bg-blue-500",
  onClick
}) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100",
        onClick && "cursor-pointer hover:scale-[1.02]",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              "text-xs mt-2 font-medium",
              trendUp ? "text-emerald-500" : "text-rose-500"
            )}>
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
            iconBg
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}