import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  ShoppingBag, 
  Bell, 
  Wrench,
  DollarSign,
  X,
  CheckCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const iconMap = {
  spending_alert: DollarSign,
  inventory_expiry: Clock,
  shopping_suggestion: ShoppingBag,
  bill_reminder: Bell,
  repair_priority: Wrench,
  budget_warning: TrendingUp
};

const colorMap = {
  spending_alert: "from-rose-500 to-pink-500",
  inventory_expiry: "from-orange-500 to-amber-500",
  shopping_suggestion: "from-blue-500 to-cyan-500",
  bill_reminder: "from-purple-500 to-violet-500",
  repair_priority: "from-orange-500 to-red-500",
  budget_warning: "from-rose-500 to-red-600"
};

const priorityColors = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
};

export default function AIInsightsPanel({ compact = false }) {
  const queryClient = useQueryClient();

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ["ai-insights"],
    queryFn: async () => {
      const all = await base44.entities.AIInsight.list('-created_date');
      return all.filter(i => !i.is_dismissed);
    }
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => base44.entities.AIInsight.update(id, { is_dismissed: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-insights"] });
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.AIInsight.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-insights"] });
    }
  });

  const handleAction = async (insight, action) => {
    try {
      if (action.action === "add_to_shopping") {
        await base44.entities.ShoppingItem.create({
          name: action.data.item_name,
          notes: action.data.reason,
          priority: "medium"
        });
        queryClient.invalidateQueries({ queryKey: ["shopping"] });
      } else if (action.action === "mark_bill_paid") {
        await base44.entities.Bill.update(action.data.bill_id, { 
          is_paid: true,
          paid_date: new Date().toISOString().split('T')[0]
        });
        queryClient.invalidateQueries({ queryKey: ["bills"] });
      } else if (action.action === "view_project") {
        window.location.href = `/projects`;
      } else if (action.action === "mark_for_use") {
        // Could add to a meal plan or recipe list
        console.log("Mark for use:", action.data.item_name);
      }
      
      dismissMutation.mutate(insight.id);
    } catch (error) {
      console.error("Error handling action:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30 text-center">
        <Sparkles className="w-12 h-12 mx-auto mb-3 text-blue-500 dark:text-blue-400" />
        <p className="text-slate-600 dark:text-slate-300 font-medium">אין התראות חדשות</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">המערכת מנתחת את הנתונים באופן שוטף</p>
      </div>
    );
  }

  const displayInsights = compact ? insights.slice(0, 3) : insights;

  return (
    <div className="space-y-3">
      {displayInsights.map(insight => {
        const Icon = iconMap[insight.type] || Sparkles;
        const gradient = colorMap[insight.type] || "from-blue-500 to-cyan-500";

        return (
          <div
            key={insight.id}
            className={cn(
              "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all hover:shadow-lg",
              !insight.is_read && "ring-2 ring-blue-500/20 dark:ring-blue-400/20"
            )}
            onClick={() => !insight.is_read && markReadMutation.mutate(insight.id)}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br shadow-lg",
                  gradient
                )}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">{insight.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className={priorityColors[insight.priority]}>
                        {insight.priority === "low" && "נמוך"}
                        {insight.priority === "medium" && "בינוני"}
                        {insight.priority === "high" && "גבוה"}
                        {insight.priority === "urgent" && "דחוף"}
                      </Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissMutation.mutate(insight.id);
                        }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors select-none"
                      >
                        <X className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{insight.description}</p>
                  
                  {insight.action_items && insight.action_items.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {insight.action_items.slice(0, 2).map((action, idx) => (
                        <Button
                          key={idx}
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(insight, action);
                          }}
                          className="text-xs h-8 min-h-[32px]"
                        >
                          <CheckCircle className="w-3 h-3 ml-1" />
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}