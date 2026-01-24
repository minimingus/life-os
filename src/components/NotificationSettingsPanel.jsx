import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationSettingsPanel() {
  const [settings, setSettings] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: userSettings } = useQuery({
    queryKey: ["notificationSettings"],
    queryFn: async () => {
      try {
        const items = await base44.entities.NotificationSettings.list();
        return items[0] || null;
      } catch {
        return null;
      }
    }
  });

  useEffect(() => {
    if (userSettings) {
      setSettings(userSettings);
    } else {
      setSettings({
        expiry_alert_days: 3,
        expiry_notifications_enabled: true,
        staples_alert_enabled: true,
        low_stock_alert_enabled: true,
        notification_method: "system",
        email: ""
      });
    }
  }, [userSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (userSettings?.id) {
        await base44.entities.NotificationSettings.update(userSettings.id, settings);
      } else {
        await base44.entities.NotificationSettings.create(settings);
      }
      queryClient.invalidateQueries({ queryKey: ["notificationSettings"] });
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-800">הגדרות התראות</h3>
          <p className="text-sm text-slate-500">קבע איך ומתי לקבל התראות על המלאי</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* תאריכי תפוגה */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              id="expiry_enabled"
              checked={settings.expiry_notifications_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, expiry_notifications_enabled: checked })
              }
            />
            <label
              htmlFor="expiry_enabled"
              className="font-medium text-slate-800 flex-1 cursor-pointer"
            >
              התראות על תאריכי תפוגה
            </label>
          </div>
          {settings.expiry_notifications_enabled && (
            <div className="ml-6 space-y-2">
              <label className="text-sm text-slate-600">
                הוזהר בכמה ימים מראש:
              </label>
              <Input
                type="number"
                min="1"
                max="30"
                value={settings.expiry_alert_days}
                onChange={(e) =>
                  setSettings({ ...settings, expiry_alert_days: parseInt(e.target.value) })
                }
                className="w-24"
              />
              <p className="text-xs text-slate-500">
                תקבל התראה כשנשאר פחות מ-{settings.expiry_alert_days} ימים לתפוגה
              </p>
            </div>
          )}
        </div>

        {/* פריטים בסיסיים */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              id="staples_enabled"
              checked={settings.staples_alert_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, staples_alert_enabled: checked })
              }
            />
            <label
              htmlFor="staples_enabled"
              className="font-medium text-slate-800 flex-1 cursor-pointer"
            >
              התראות על פריטים בסיסיים שנגמרו
            </label>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              id="low_stock_enabled"
              checked={settings.low_stock_alert_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, low_stock_alert_enabled: checked })
              }
            />
            <label
              htmlFor="low_stock_enabled"
              className="font-medium text-slate-800 flex-1 cursor-pointer"
            >
              התראות על מלאי נמוך בפריטים בסיסיים
            </label>
          </div>
        </div>

        {/* אמצעי התראה */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <label className="text-sm font-medium text-slate-700 block">
            אמצעי התראה
          </label>
          <Select
            value={settings.notification_method}
            onValueChange={(value) =>
              setSettings({ ...settings, notification_method: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">
                <span>🔔 התראות במערכת</span>
              </SelectItem>
              <SelectItem value="email">
                <span>📧 התראות במייל</span>
              </SelectItem>
              <SelectItem value="both">
                <span>📧🔔 שניהם</span>
              </SelectItem>
            </SelectContent>
          </Select>

          {(settings.notification_method === "email" ||
            settings.notification_method === "both") && (
            <div className="space-y-2">
              <label className="text-sm text-slate-600">כתובת מייל:</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={settings.email || ""}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            שומר...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 ml-2" />
            שמור הגדרות
          </>
        )}
      </Button>
    </div>
  );
}