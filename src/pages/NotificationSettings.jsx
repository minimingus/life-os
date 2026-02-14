import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import PushNotificationSetup from "@/components/PushNotificationSetup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Receipt, 
  Package, 
  CheckSquare, 
  Sparkles, 
  Moon,
  Save
} from "lucide-react";
import { toast } from "sonner";

export default function NotificationSettings() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreferences.list();
      return prefs[0] || {
        bill_reminders: true,
        bill_days_before: 3,
        inventory_low_stock: true,
        inventory_expired: true,
        task_reminders: true,
        task_days_before: 1,
        task_assignment: true,
        ai_insights: true,
        quiet_hours_enabled: false,
        quiet_hours_start: "22:00",
        quiet_hours_end: "08:00"
      };
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences?.id) {
        return await base44.entities.NotificationPreferences.update(preferences.id, data);
      } else {
        return await base44.entities.NotificationPreferences.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationPreferences']);
      toast.success('ההגדרות נשמרו');
    }
  });

  const handleUpdate = (field, value) => {
    updateMutation.mutate({
      ...preferences,
      [field]: value
    });
  };

  if (isLoading) {
    return <div className="p-6">טוען...</div>;
  }

  const settingsSections = [
    {
      title: "חשבונות",
      icon: Receipt,
      color: "text-purple-600 dark:text-purple-400",
      settings: [
        {
          key: "bill_reminders",
          label: "התראות על חשבונות לתשלום",
          description: "קבל התראה על חשבונות שמתקרבים למועד התשלום"
        },
        {
          key: "bill_days_before",
          label: "ימים לפני מועד התשלום",
          type: "number",
          min: 1,
          max: 14,
          dependency: "bill_reminders"
        }
      ]
    },
    {
      title: "מלאי",
      icon: Package,
      color: "text-green-600 dark:text-green-400",
      settings: [
        {
          key: "inventory_low_stock",
          label: "מלאי נמוך",
          description: "התראה כשפריטים מגיעים לכמות מינימלית"
        },
        {
          key: "inventory_expired",
          label: "פריטים שפג תוקפם",
          description: "התראה על פריטים שפג תוקפם או עומדים לפוג"
        }
      ]
    },
    {
      title: "משימות",
      icon: CheckSquare,
      color: "text-blue-600 dark:text-blue-400",
      settings: [
        {
          key: "task_reminders",
          label: "תזכורות למשימות",
          description: "קבל תזכורת על משימות שמתקרבות לתאריך יעד"
        },
        {
          key: "task_days_before",
          label: "ימים לפני תאריך היעד",
          type: "number",
          min: 0,
          max: 7,
          dependency: "task_reminders"
        },
        {
          key: "task_assignment",
          label: "הקצאת משימות",
          description: "התראה כשמישהו מקצה לך משימה חדשה"
        }
      ]
    },
    {
      title: "תובנות AI",
      icon: Sparkles,
      color: "text-amber-600 dark:text-amber-400",
      settings: [
        {
          key: "ai_insights",
          label: "התראות AI",
          description: "קבל התראות על תובנות והמלצות חדשות מהמערכת"
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="הגדרות התראות"
        subtitle="התאם אישית את ההתראות שלך"
      />

      {/* Push Notifications Setup */}
      <PushNotificationSetup />

      {/* Notification Settings */}
      <div className="space-y-4">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${section.color}`} />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.settings.map((setting) => {
                  const isDisabled = setting.dependency && !preferences[setting.dependency];
                  
                  if (setting.type === "number") {
                    return (
                      <div key={setting.key} className={isDisabled ? "opacity-50" : ""}>
                        <Label className="text-sm font-medium mb-2 block">
                          {setting.label}
                        </Label>
                        <Input
                          type="number"
                          min={setting.min}
                          max={setting.max}
                          value={preferences[setting.key] || setting.min}
                          onChange={(e) => handleUpdate(setting.key, parseInt(e.target.value))}
                          disabled={isDisabled}
                          className="w-32"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={setting.key} className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Label htmlFor={setting.key} className="text-sm font-medium cursor-pointer">
                          {setting.label}
                        </Label>
                        {setting.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {setting.description}
                          </p>
                        )}
                      </div>
                      <Switch
                        id={setting.key}
                        checked={preferences[setting.key] || false}
                        onCheckedChange={(checked) => handleUpdate(setting.key, checked)}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              שעות שקט
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="text-sm font-medium">הפעל שעות שקט</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  לא תתקבלנה התראות במהלך השעות המוגדרות
                </p>
              </div>
              <Switch
                checked={preferences.quiet_hours_enabled || false}
                onCheckedChange={(checked) => handleUpdate('quiet_hours_enabled', checked)}
              />
            </div>

            {preferences.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <Label className="text-sm mb-2 block">משעה</Label>
                  <Input
                    type="time"
                    value={preferences.quiet_hours_start || "22:00"}
                    onChange={(e) => handleUpdate('quiet_hours_start', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm mb-2 block">עד שעה</Label>
                  <Input
                    type="time"
                    value={preferences.quiet_hours_end || "08:00"}
                    onChange={(e) => handleUpdate('quiet_hours_end', e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}