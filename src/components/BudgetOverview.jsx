import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Home as HomeIcon,
  ShoppingCart,
  Car,
  Zap,
  GraduationCap,
  Heart,
  Smile,
  PiggyBank,
  MoreHorizontal,
  Plus,
  Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_CONFIG = {
  housing: { label: "דיור", icon: HomeIcon, color: "text-blue-600" },
  food: { label: "מזון", icon: ShoppingCart, color: "text-green-600" },
  transportation: { label: "תחבורה", icon: Car, color: "text-orange-600" },
  utilities: { label: "חשבונות", icon: Zap, color: "text-yellow-600" },
  education: { label: "חינוך", icon: GraduationCap, color: "text-purple-600" },
  healthcare: { label: "בריאות", icon: Heart, color: "text-red-600" },
  entertainment: { label: "בילויים", icon: Smile, color: "text-pink-600" },
  savings: { label: "חיסכון", icon: PiggyBank, color: "text-emerald-600" },
  other: { label: "אחר", icon: MoreHorizontal, color: "text-slate-600" }
};

export default function BudgetOverview({ compact = false }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const queryClient = useQueryClient();

  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: budgets = [] } = useQuery({
    queryKey: ["family-budget"],
    queryFn: () => base44.entities.FamilyBudget.list()
  });

  const currentBudget = budgets.find(b => b.month === currentMonth) || {
    month: currentMonth,
    total_income: 0,
    categories: {},
    actual_spending: {}
  };

  const [formData, setFormData] = useState(currentBudget);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (currentBudget.id) {
        return await base44.entities.FamilyBudget.update(currentBudget.id, data);
      } else {
        return await base44.entities.FamilyBudget.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-budget"] });
      setShowDialog(false);
      setEditMode(false);
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const openEdit = () => {
    setFormData(currentBudget);
    setEditMode(true);
    setShowDialog(true);
  };

  const totalBudget = Object.values(currentBudget.categories || {}).reduce((sum, val) => sum + (val || 0), 0);
  const totalSpent = Object.values(currentBudget.actual_spending || {}).reduce((sum, val) => sum + (val || 0), 0);
  const remaining = totalBudget - totalSpent;
  const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  if (compact) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">תקציב חודשי</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(currentMonth).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={openEdit}>
            <Edit2 className="w-4 h-4 ml-1" />
            עריכה
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">תקציב מתוכנן</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              ₪{totalBudget.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">הוצאות בפועל</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              ₪{totalSpent.toLocaleString()}
            </span>
          </div>
          
          <Progress value={percentageUsed} className="h-2" />
          
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">יתרה</span>
            <div className="flex items-center gap-2">
              {remaining >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
              <span className={cn(
                "font-bold",
                remaining >= 0 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                ₪{Math.abs(remaining).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>ניהול תקציב משפחתי</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  הכנסה חודשית
                </label>
                <Input
                  type="number"
                  value={formData.total_income || ""}
                  onChange={(e) => setFormData({ ...formData, total_income: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="text-lg font-semibold"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">תקציב לפי קטגוריות</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <div key={key}>
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-1">
                          <Icon className={cn("w-4 h-4", config.color)} />
                          {config.label}
                        </label>
                        <Input
                          type="number"
                          value={formData.categories?.[key] || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            categories: {
                              ...formData.categories,
                              [key]: parseFloat(e.target.value) || 0
                            }
                          })}
                          placeholder="0"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700">
                  שמור
                </Button>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  ביטול
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}