import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Mail, Smartphone, Clock, AlertTriangle } from "lucide-react";

export default function NotificationSettingsDialog({ open, onOpenChange, memberId, memberName }) {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["taskNotificationSettings", memberId],
    queryFn: async () => {
      const all = await base44.entities.TaskNotificationSettings.filter({ family_member_id: memberId });
      return all[0] || null;
    },
    enabled: !!memberId
  });

  const [formData, setFormData] = useState({
    family_member_id: memberId,
    family_member_name: memberName,
    enabled: true,
    notification_channels: ["in_app"],
    days_before_due: [1, 3],
    notify_on_assignment: true,
    notify_overdue: true,
    daily_summary: false,
    daily_summary_time: "08:00"
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    } else if (memberId) {
      setFormData({
        family_member_id: memberId,
        family_member_name: memberName,
        enabled: true,
        notification_channels: ["in_app"],
        days_before_due: [1, 3],
        notify_on_assignment: true,
        notify_overdue: true,
        daily_summary: false,
        daily_summary_time: "08:00"
      });
    }
  }, [settings, memberId, memberName]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings) {
        return base44.entities.TaskNotificationSettings.update(settings.id, data);
      } else {
        return base44.entities.TaskNotificationSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskNotificationSettings"] });
      onOpenChange(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const toggleChannel = (channel) => {
    const channels = formData.notification_channels.includes(channel)
      ? formData.notification_channels.filter(c => c !== channel)
      : [...formData.notification_channels, channel];
    setFormData({ ...formData, notification_channels: channels });
  };

  const toggleDaysBefore = (day) => {
    const days = formData.days_before_due.includes(day)
      ? formData.days_before_due.filter(d => d !== day)
      : [...formData.days_before_due, day].sort((a, b) => a - b);
    setFormData({ ...formData, days_before_due: days });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            הגדרות התראות עבור {memberName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* הפעלת התראות */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-slate-600" />
              <div>
                <div className="font-semibold text-slate-800">התראות פעילות</div>
                <div className="text-sm text-slate-500">קבל התראות על משימות</div>
              </div>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
          </div>

          {formData.enabled && (
            <>
              {/* ערוצי התראות */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">ערוצי התראות</label>
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer hover:bg-slate-50 transition-colors"
                    style={{
                      borderColor: formData.notification_channels.includes("in_app") ? "#3b82f6" : "#e2e8f0"
                    }}
                    onClick={() => toggleChannel("in_app")}
                  >
                    <Checkbox checked={formData.notification_channels.includes("in_app")} />
                    <Smartphone className="w-5 h-5 text-blue-500" />
                    <span>התראות באפליקציה</span>
                  </div>
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer hover:bg-slate-50 transition-colors"
                    style={{
                      borderColor: formData.notification_channels.includes("email") ? "#3b82f6" : "#e2e8f0"
                    }}
                    onClick={() => toggleChannel("email")}
                  >
                    <Checkbox checked={formData.notification_channels.includes("email")} />
                    <Mail className="w-5 h-5 text-blue-500" />
                    <span>התראות במייל</span>
                  </div>
                </div>
              </div>

              {/* תזמון התראות */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">התראה לפני תאריך יעד</label>
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 3, 7, 14].map(day => (
                    <Badge
                      key={day}
                      variant={formData.days_before_due.includes(day) ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2"
                      style={{
                        backgroundColor: formData.days_before_due.includes(day) ? "#3b82f6" : "transparent",
                        color: formData.days_before_due.includes(day) ? "white" : "#64748b"
                      }}
                      onClick={() => toggleDaysBefore(day)}
                    >
                      {day === 0 ? "באותו יום" : `${day} ימים לפני`}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* הגדרות נוספות */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">הגדרות נוספות</label>
                
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-500" />
                    <span className="text-sm">התראה כשמשימה מוקצית</span>
                  </div>
                  <Switch
                    checked={formData.notify_on_assignment}
                    onCheckedChange={(checked) => setFormData({ ...formData, notify_on_assignment: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm">התראה על משימות באיחור</span>
                  </div>
                  <Switch
                    checked={formData.notify_overdue}
                    onCheckedChange={(checked) => setFormData({ ...formData, notify_overdue: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">סיכום יומי של משימות</span>
                  </div>
                  <Switch
                    checked={formData.daily_summary}
                    onCheckedChange={(checked) => setFormData({ ...formData, daily_summary: checked })}
                  />
                </div>

                {formData.daily_summary && (
                  <div className="pr-6">
                    <label className="text-xs text-slate-500">שעת סיכום יומי</label>
                    <Input
                      type="time"
                      value={formData.daily_summary_time}
                      onChange={(e) => setFormData({ ...formData, daily_summary_time: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600">
              שמור הגדרות
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}