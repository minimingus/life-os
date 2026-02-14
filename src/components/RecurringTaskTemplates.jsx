import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, Coffee, Home, Dumbbell, ShoppingBag, Sparkles } from "lucide-react";

const templates = [
  {
    name: "תרגול יומי",
    icon: Dumbbell,
    color: "from-orange-500 to-red-500",
    config: {
      recurrence_pattern: "daily",
      recurrence_interval: 1,
      recurrence_days: []
    }
  },
  {
    name: "ימי עבודה",
    icon: Coffee,
    color: "from-blue-500 to-cyan-500",
    config: {
      recurrence_pattern: "weekly",
      recurrence_interval: 1,
      recurrence_days: [1, 2, 3, 4, 5]
    }
  },
  {
    name: "סוף שבוע",
    icon: Home,
    color: "from-purple-500 to-pink-500",
    config: {
      recurrence_pattern: "weekly",
      recurrence_interval: 1,
      recurrence_days: [5, 6]
    }
  },
  {
    name: "קניות שבועיות",
    icon: ShoppingBag,
    color: "from-green-500 to-emerald-500",
    config: {
      recurrence_pattern: "weekly",
      recurrence_interval: 1,
      recurrence_days: [4]
    }
  },
  {
    name: "ניקיון חודשי",
    icon: Sparkles,
    color: "from-indigo-500 to-blue-500",
    config: {
      recurrence_pattern: "monthly",
      recurrence_interval: 1,
      recurrence_days: []
    }
  },
  {
    name: "יום הולדת שנתי",
    icon: Calendar,
    color: "from-pink-500 to-rose-500",
    config: {
      recurrence_pattern: "yearly",
      recurrence_interval: 1,
      recurrence_days: []
    }
  }
];

export default function RecurringTaskTemplates({ onSelect }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">תבניות מהירות</p>
      <div className="grid grid-cols-2 gap-2">
        {templates.map((template, idx) => {
          const Icon = template.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(template.config)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all group"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg",
                template.color
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
                {template.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}