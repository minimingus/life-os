import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

export default function QuickAction({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  onClick,
  color = "blue"
}) {
  const colors = {
    blue: "from-blue-500 to-blue-600 shadow-blue-500/30",
    green: "from-emerald-500 to-emerald-600 shadow-emerald-500/30",
    orange: "from-orange-500 to-orange-600 shadow-orange-500/30",
    purple: "from-purple-500 to-purple-600 shadow-purple-500/30",
    pink: "from-pink-500 to-pink-600 shadow-pink-500/30",
    teal: "from-teal-500 to-teal-600 shadow-teal-500/30",
  };

  const Wrapper = href ? Link : "button";
  const wrapperProps = href ? { to: href } : { onClick };

  return (
    <Wrapper
      {...wrapperProps}
      className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group w-full text-right"
    >
      <div className={cn(
        "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg flex-shrink-0",
        colors[color]
      )}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{title}</p>
        {description && (
          <p className="text-sm text-slate-500 truncate">{description}</p>
        )}
      </div>
      <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:-translate-x-1 transition-all" />
    </Wrapper>
  );
}