import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sparkles, 
  DollarSign, 
  Package, 
  ShoppingBag, 
  Bell, 
  Wrench,
  TrendingUp,
  Loader2,
  CheckCircle,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AISettings() {
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settingsList = [], isLoading } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: () => base44.entities.AISettings.list()
  });

  const settings = settingsList[0] || {
    spending_alerts_enabled: true,
    spending_threshold_percentage: 20,
    inventory_expiry_alerts_enabled: true,
    inventory_expiry_days: 7,
    shopping_suggestions_enabled: true,
    bill_reminders_enabled: true,
    bill_reminder_days: 5,
    repair_priority_alerts_enabled: true,
    budget_warnings_enabled: true,
    analysis_frequency: "daily",
    notification_time: "08:00"
  };

  const [formData, setFormData] = useState(settings);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (settingsList.length > 0) {
        return await base44.entities.AISettings.update(settingsList[0].id, data);
      } else {
        return await base44.entities.AISettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
      setHasChanges(false);
      toast.success("ההגדרות נשמרו בהצלחה");
    }
  });

  const runAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('analyzeDataAndGenerateInsights', {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ai-insights"] });
      toast.success(`נוצרו ${data.insights_generated} התראות חדשות`);
    },
    onError: (error) => {
      toast.error("שגיאה בניתוח הנתונים: " + error.message);
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const settingsSections = [
    {
      title: "התראות הוצאות",
      icon: DollarSign,
      color: "text-rose-500",
      settings: [
        {
          key: "spending_alerts_enabled",
          label: "התראות על הוצאות חריגות",
          type: "switch"
        },
        {
          key: "spending_threshold_percentage",
          label: "אחוז סטייה להתראה",
          type: "number",
          suffix: "%",
          min: 5,
          max: 100,
          disabled: !formData.spending_alerts_enabled
        }
      ]
    },
    {
      title: "התראות מלאי",
      icon: Package,
      color: "text-orange-500",
      settings: [
        {
          key: "inventory_expiry_alerts_enabled",
          label: "התראות על פריטים שעומדים לפוג תוקף",
          type: "switch"
        },
        {
          key: "inventory_expiry_days",
          label: "ימים מראש להתראה",
          type: "number",
          min: 1,
          max: 30,
          disabled: !formData.inventory_expiry_alerts_enabled
        }
      ]
    },
    {
      title: "הצעות קניה",
      icon: ShoppingBag,
      color: "text-blue-500",
      settings: [
        {
          key: "shopping_suggestions_enabled",
          label: "הצעות קניה חכמות מבוססות AI",
          type: "switch"
        }
      ]
    },
    {
      title: "תזכורות חשבונות",
      icon: Bell,
      color: "text-purple-500",
      settings: [
        {
          key: "bill_reminders_enabled",
          label: "תזכורות לתשלום חשבונות",
          type: "switch"
        },
        {
          key: "bill_reminder_days",
          label: "ימים מראש להתראה",
          type: "number",
          min: 1,
          max: 30,
          disabled: !formData.bill_reminders_enabled
        }
      ]
    },
    {
      title: "עדיפות תיקונים",
      icon: Wrench,
      color: "text-orange-600",
      settings: [
        {
          key: "repair_priority_alerts_enabled",
          label: "התראות על תיקונים דחופים",
          type: "switch"
        }
      ]
    },
    {
      title: "אזהרות תקציב",
      icon: TrendingUp,
      color: "text-rose-600",
      settings: [
        {
          key: "budget_warnings_enabled",
          label: "אזהרות על פרויקטים שחורגים מהתקציב",
          type: "switch"
        }
      ]
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="הגדרות AI והתראות"
        subtitle="התאם אישית את מערכת ההתראות החכמה"
      >
        <Button
          onClick={() => runAnalysisMutation.mutate()}
          disabled={runAnalysisMutation.isPending}
          variant="outline"
          className="gap-2"
        >
          {runAnalysisMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          הרץ ניתוח עכשיו
        </Button>
      </PageHeader>

      <div className="grid gap-6">
        {/* General Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">הגדרות כלליות</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-700 dark:text-slate-300 mb-2 block">תדירות ניתוח</Label>
              <Select 
                value={formData.analysis_frequency}
                onValueChange={(value) => handleChange('analysis_frequency', value)}
              >
                <SelectTrigger className="bg-white dark:bg-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">יומי</SelectItem>
                  <SelectItem value="weekly">שבועי</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-700 dark:text-slate-300 mb-2 block">שעת שליחת התראות</Label>
              <Input
                type="time"
                value={formData.notification_time}
                onChange={(e) => handleChange('notification_time', e.target.value)}
                className="bg-white dark:bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Individual Settings */}
        {settingsSections.map((section, idx) => (
          <div 
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <section.icon className={cn("w-5 h-5", section.color)} />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{section.title}</h2>
            </div>

            <div className="space-y-4">
              {section.settings.map(setting => (
                <div 
                  key={setting.key}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50",
                    setting.disabled && "opacity-50"
                  )}
                >
                  <Label 
                    htmlFor={setting.key}
                    className="text-slate-700 dark:text-slate-300 flex-1 cursor-pointer"
                  >
                    {setting.label}
                  </Label>
                  
                  {setting.type === "switch" ? (
                    <Switch
                      id={setting.key}
                      checked={formData[setting.key]}
                      onCheckedChange={(checked) => handleChange(setting.key, checked)}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        id={setting.key}
                        type="number"
                        min={setting.min}
                        max={setting.max}
                        value={formData[setting.key]}
                        onChange={(e) => handleChange(setting.key, parseInt(e.target.value))}
                        disabled={setting.disabled}
                        className="w-20 bg-white dark:bg-slate-700"
                      />
                      {setting.suffix && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">{setting.suffix}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="fixed bottom-20 lg:bottom-8 left-0 right-0 px-4 lg:px-8 lg:left-72 z-40">
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm text-slate-600 dark:text-slate-300">יש לך שינויים שלא נשמרו</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData(settings);
                    setHasChanges(false);
                  }}
                >
                  ביטול
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-l from-blue-500 to-blue-600"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 ml-2" />
                  )}
                  שמור שינויים
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}