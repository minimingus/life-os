import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";

export default function PageHeader({ 
  title, 
  subtitle, 
  action,
  actionLabel = "הוסף חדש",
  actionIcon: ActionIcon = Plus,
  children,
  showBack = true,
  backTo
}) {
  const navigate = useNavigate();
  const isHomePage = title === "שלום! 👋" || window.location.pathname === "/" || window.location.pathname === "/home";

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        {showBack && !isHomePage && (
          <button
            onClick={handleBack}
            className="lg:hidden flex items-center justify-center w-11 h-11 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none"
            aria-label="חזור"
          >
            <ArrowRight className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
          {subtitle && (
            <p className="text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {children}
          {action && (
            <Button 
              onClick={action}
              className="bg-gradient-to-l from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 min-h-[44px]"
            >
              <ActionIcon className="w-4 h-4 ml-2" />
              <span className="hidden sm:inline">{actionLabel}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}