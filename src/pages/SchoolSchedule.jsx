import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Plus, Edit, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];
const PERIODS = 8; // מספר השיעורים המקסימלי ביום

const SUBJECT_COLORS = {
  "עברית": "bg-blue-100 text-blue-700 border-blue-200",
  "מתמטיקה": "bg-purple-100 text-purple-700 border-purple-200",
  "אנגלית": "bg-green-100 text-green-700 border-green-200",
  "מדעים": "bg-teal-100 text-teal-700 border-teal-200",
  "תנ\"ך": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "היסטוריה": "bg-amber-100 text-amber-700 border-amber-200",
  "גיאוגרפיה": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "ספורט": "bg-orange-100 text-orange-700 border-orange-200",
  "אומנות": "bg-pink-100 text-pink-700 border-pink-200",
  "מוזיקה": "bg-rose-100 text-rose-700 border-rose-200",
};

export default function SchoolSchedule() {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    family_member_id: "",
    family_member_name: "",
    day: 0,
    period_number: 1,
    subject: "",
    teacher: "",
    room: "",
    start_time: "",
    end_time: "",
    notes: ""
  });

  const queryClient = useQueryClient();

  const { data: scheduleItems = [] } = useQuery({
    queryKey: ["schoolSchedule"],
    queryFn: () => base44.entities.SchoolSchedule.list()
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ["familyMembers"],
    queryFn: () => base44.entities.FamilyMember.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SchoolSchedule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolSchedule"] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SchoolSchedule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolSchedule"] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SchoolSchedule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schoolSchedule"] })
  });

  const resetForm = () => {
    setShowDialog(false);
    setEditItem(null);
    setFormData({
      family_member_id: "",
      family_member_name: "",
      day: 0,
      period_number: 1,
      subject: "",
      teacher: "",
      room: "",
      start_time: "",
      end_time: "",
      notes: ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData(item);
    setShowDialog(true);
  };

  const openAdd = (day, period) => {
    setFormData({
      ...formData,
      family_member_id: selectedMember || "",
      family_member_name: familyMembers.find(m => m.id === selectedMember)?.name || "",
      day,
      period_number: period
    });
    setShowDialog(true);
  };

  // סינון לפי בן משפחה נבחר
  const filteredSchedule = selectedMember
    ? scheduleItems.filter(item => item.family_member_id === selectedMember)
    : scheduleItems;

  // ארגון מערכת השעות לפי יום ושיעור
  const getScheduleItem = (day, period) => {
    return filteredSchedule.find(item => item.day === day && item.period_number === period);
  };

  const getSubjectColor = (subject) => {
    for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
      if (subject?.includes(key)) return color;
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const children = familyMembers.filter(m => m.role === "child");

  return (
    <div className="space-y-6">
      <PageHeader
        title="מערכת שעות"
        subtitle="מערכת השעות השבועית של בית הספר"
        action={() => {
          setFormData({
            ...formData,
            family_member_id: selectedMember || "",
            family_member_name: familyMembers.find(m => m.id === selectedMember)?.name || ""
          });
          setShowDialog(true);
        }}
        actionLabel="הוסף שיעור"
      >
        {children.length > 0 && (
          <Select value={selectedMember || "all"} onValueChange={(v) => setSelectedMember(v === "all" ? null : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="בחר ילד" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הילדים</SelectItem>
              {children.map(child => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </PageHeader>

      {/* לוח מערכת השעות */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" dir="rtl">
            <thead>
              <tr className="bg-gradient-to-l from-blue-50 to-indigo-50">
                <th className="border border-slate-200 p-3 text-sm font-semibold text-slate-700 w-20">
                  שיעור
                </th>
                {DAYS.map((day, idx) => (
                  <th key={idx} className="border border-slate-200 p-3 text-sm font-semibold text-slate-700">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(PERIODS)].map((_, periodIdx) => {
                const period = periodIdx + 1;
                return (
                  <tr key={period}>
                    <td className="border border-slate-200 p-2 text-center bg-slate-50 font-medium text-slate-600">
                      {period}
                    </td>
                    {DAYS.map((_, dayIdx) => {
                      const item = getScheduleItem(dayIdx, period);
                      return (
                        <td key={dayIdx} className="border border-slate-200 p-1 min-w-[120px] h-20">
                          {item ? (
                            <div
                              className={cn(
                                "h-full p-2 rounded-lg border-2 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all",
                                getSubjectColor(item.subject)
                              )}
                              onClick={() => openEdit(item)}
                            >
                              <div>
                                <div className="font-semibold text-sm leading-tight">{item.subject}</div>
                                {item.teacher && (
                                  <div className="text-xs opacity-80 mt-0.5">{item.teacher}</div>
                                )}
                              </div>
                              {item.start_time && (
                                <div className="text-xs opacity-70 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {item.start_time}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => openAdd(dayIdx, period)}
                              className="w-full h-full flex items-center justify-center text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* מקרא */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">מקרא</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {Object.entries(SUBJECT_COLORS).map(([subject, color]) => (
            <div key={subject} className={cn("px-3 py-2 rounded-lg border-2 text-sm", color)}>
              {subject}
            </div>
          ))}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editItem ? "עריכת שיעור" : "הוספת שיעור"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {children.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-700">ילד</label>
                <Select
                  value={formData.family_member_id}
                  onValueChange={(v) => {
                    const member = familyMembers.find(m => m.id === v);
                    setFormData({
                      ...formData,
                      family_member_id: v,
                      family_member_name: member?.name || ""
                    });
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר ילד" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map(child => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">יום</label>
                <Select
                  value={formData.day.toString()}
                  onValueChange={(v) => setFormData({ ...formData, day: parseInt(v) })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">שיעור מספר</label>
                <Input
                  type="number"
                  min="1"
                  max={PERIODS}
                  value={formData.period_number}
                  onChange={(e) => setFormData({ ...formData, period_number: parseInt(e.target.value) })}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">שם המקצוע</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="למשל: מתמטיקה"
                className="mt-1"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">שם המורה</label>
              <Input
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                placeholder="שם המורה (אופציונלי)"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">שעת התחלה</label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">שעת סיום</label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">חדר</label>
              <Input
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="מספר חדר (אופציונלי)"
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600">
                {editItem ? "עדכן" : "הוסף"}
              </Button>
              {editItem && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    deleteMutation.mutate(editItem.id);
                    resetForm();
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button type="button" variant="outline" onClick={resetForm}>
                ביטול
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}