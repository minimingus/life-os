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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { BookOpen, Plus, Edit, Trash2, Clock, Dumbbell } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("schedule");
  const [selectedDay, setSelectedDay] = useState(null);
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
  const [activityFormData, setActivityFormData] = useState({
    family_member_id: "",
    family_member_name: "",
    day: 0,
    activity_name: "",
    location: "",
    start_time: "",
    end_time: "",
    instructor: "",
    color: "#3b82f6",
    notes: ""
  });

  const queryClient = useQueryClient();

  const { data: scheduleItems = [] } = useQuery({
    queryKey: ["schoolSchedule"],
    queryFn: () => base44.entities.SchoolSchedule.list()
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["extracurricular"],
    queryFn: () => base44.entities.Extracurricular.list()
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

  const createActivityMutation = useMutation({
    mutationFn: (data) => base44.entities.Extracurricular.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extracurricular"] });
      resetForm();
    }
  });

  const updateActivityMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Extracurricular.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extracurricular"] });
      resetForm();
    }
  });

  const deleteActivityMutation = useMutation({
    mutationFn: (id) => base44.entities.Extracurricular.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["extracurricular"] })
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
    setActivityFormData({
      family_member_id: "",
      family_member_name: "",
      day: 0,
      activity_name: "",
      location: "",
      start_time: "",
      end_time: "",
      instructor: "",
      color: "#3b82f6",
      notes: ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === "schedule") {
      if (editItem) {
        updateMutation.mutate({ id: editItem.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    } else {
      if (editItem) {
        updateActivityMutation.mutate({ id: editItem.id, data: activityFormData });
      } else {
        createActivityMutation.mutate(activityFormData);
      }
    }
  };

  const openEdit = (item, isActivity = false) => {
    setEditItem(item);
    if (isActivity) {
      setActivityFormData(item);
      setActiveTab("activities");
    } else {
      setFormData(item);
      setActiveTab("schedule");
    }
    setShowDialog(true);
  };

  const openAdd = (day, period) => {
    setActiveTab("schedule");
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
    ? scheduleItems.filter(item => 
        item.family_member_id === selectedMember || 
        item.family_member_name === familyMembers.find(m => m.id === selectedMember)?.name
      )
    : scheduleItems;

  const filteredActivities = selectedMember
    ? activities.filter(item => 
        item.family_member_id === selectedMember || 
        item.family_member_name === familyMembers.find(m => m.id === selectedMember)?.name
      )
    : activities;

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
        title="מערכת שעות וחוגים"
        subtitle={selectedMember 
          ? `מערכת של ${familyMembers.find(m => m.id === selectedMember)?.name || ''}`
          : "בחר ילד כדי להציג את המערכת שלו"
        }
        action={() => {
          if (activeTab === "schedule") {
            setFormData({
              ...formData,
              family_member_id: selectedMember || "",
              family_member_name: familyMembers.find(m => m.id === selectedMember)?.name || ""
            });
          } else {
            setActivityFormData({
              ...activityFormData,
              family_member_id: selectedMember || "",
              family_member_name: familyMembers.find(m => m.id === selectedMember)?.name || ""
            });
          }
          setShowDialog(true);
        }}
        actionLabel={activeTab === "schedule" ? "הוסף שיעור" : "הוסף חוג"}
      >
        {children.length > 0 && (
          <Select value={selectedMember || "none"} onValueChange={(v) => setSelectedMember(v === "none" ? null : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="בחר ילד" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">בחר ילד</SelectItem>
              {children.map(child => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </PageHeader>

      {/* Tabs */}
      {!selectedMember ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-slate-400 mb-2">
            <BookOpen className="w-12 h-12 mx-auto mb-3" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">בחר ילד להצגת מערכת השעות והחוגים</h3>
          <p className="text-slate-500">כל ילד במשפחה מנהל מערכת שעות וחוגים נפרדת משלו</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
             <TabsTrigger value="schedule" className="gap-2">
               <BookOpen className="w-4 h-4" />
               מערכת שעות
             </TabsTrigger>
             <TabsTrigger value="activities" className="gap-2">
               <Dumbbell className="w-4 h-4" />
               חוגים
             </TabsTrigger>
           </TabsList>

           {activeTab === "schedule" && (
             <div className="mb-6 flex flex-wrap gap-2">
               <Button
                 variant={selectedDay === null ? "default" : "outline"}
                 size="sm"
                 onClick={() => setSelectedDay(null)}
                 className={selectedDay === null ? "bg-blue-500" : ""}
               >
                 כל הימים
               </Button>
               {DAYS.map((day, idx) => (
                 <Button
                   key={idx}
                   variant={selectedDay === idx ? "default" : "outline"}
                   size="sm"
                   onClick={() => setSelectedDay(idx)}
                   className={selectedDay === idx ? "bg-blue-500" : ""}
                 >
                   {day}
                 </Button>
               ))}
             </div>
           )}

          <TabsContent value="schedule" className="mt-0">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
          <table className="w-full border-collapse" dir="rtl">
            <thead>
              <tr className="bg-gradient-to-l from-blue-50 to-indigo-50">
                <th className="border border-slate-200 p-3 text-sm font-semibold text-slate-700 w-20">
                   שיעור
                 </th>
                 {(selectedDay === null ? DAYS.map((_, idx) => idx) : [selectedDay]).map((idx) => (
                   <th key={idx} className="border border-slate-200 p-3 text-sm font-semibold text-slate-700">
                     {DAYS[idx]}
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
                     {(selectedDay === null ? DAYS.map((_, idx) => idx) : [selectedDay]).map((dayIdx) => {
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
          </TabsContent>

          <TabsContent value="activities" className="mt-0">
            <div className="space-y-4">
              {DAYS.map((day, dayIdx) => {
                const dayActivities = filteredActivities.filter(a => a.day === dayIdx);
                return dayActivities.length > 0 ? (
                  <div key={dayIdx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-l from-blue-50 to-indigo-50 px-4 py-3 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-700">יום {day}</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {dayActivities
                        .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""))
                        .map(activity => (
                          <div
                            key={activity.id}
                            className="flex items-center gap-4 p-4 rounded-xl border-2 hover:shadow-md transition-all cursor-pointer"
                            style={{ borderColor: activity.color || "#3b82f6", backgroundColor: `${activity.color || "#3b82f6"}10` }}
                            onClick={() => openEdit(activity, true)}
                          >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: activity.color || "#3b82f6" }}>
                              <Dumbbell className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-800">{activity.activity_name}</div>
                              <div className="text-sm text-slate-600 flex items-center gap-3 mt-1">
                                {activity.start_time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {activity.start_time} - {activity.end_time}
                                  </span>
                                )}
                                {activity.location && <span>📍 {activity.location}</span>}
                                {activity.instructor && <span>👤 {activity.instructor}</span>}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteActivityMutation.mutate(activity.id);
                              }}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null;
              })}
              {filteredActivities.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <Dumbbell className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">אין חוגים עדיין</h3>
                  <p className="text-slate-500">הוסף חוגים ופעילויות חוץ בית ספריות</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

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
            <DialogTitle>
              {activeTab === "schedule" 
                ? (editItem ? "עריכת שיעור" : "הוספת שיעור")
                : (editItem ? "עריכת חוג" : "הוספת חוג")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "activities" ? (
              <>
                {children.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">ילד</label>
                    <Select
                      value={activityFormData.family_member_id}
                      onValueChange={(v) => {
                        const member = familyMembers.find(m => m.id === v);
                        setActivityFormData({
                          ...activityFormData,
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

                <div>
                  <label className="text-sm font-medium text-slate-700">שם החוג</label>
                  <Input
                    value={activityFormData.activity_name}
                    onChange={(e) => setActivityFormData({ ...activityFormData, activity_name: e.target.value })}
                    placeholder="למשל: כדורגל"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">יום</label>
                  <Select
                    value={activityFormData.day.toString()}
                    onValueChange={(v) => setActivityFormData({ ...activityFormData, day: parseInt(v) })}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">שעת התחלה</label>
                    <Input
                      type="time"
                      value={activityFormData.start_time}
                      onChange={(e) => setActivityFormData({ ...activityFormData, start_time: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">שעת סיום</label>
                    <Input
                      type="time"
                      value={activityFormData.end_time}
                      onChange={(e) => setActivityFormData({ ...activityFormData, end_time: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">מיקום</label>
                  <Input
                    value={activityFormData.location}
                    onChange={(e) => setActivityFormData({ ...activityFormData, location: e.target.value })}
                    placeholder="מיקום החוג"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">מדריך/ה</label>
                  <Input
                    value={activityFormData.instructor}
                    onChange={(e) => setActivityFormData({ ...activityFormData, instructor: e.target.value })}
                    placeholder="שם המדריך/ה"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">צבע</label>
                  <Input
                    type="color"
                    value={activityFormData.color}
                    onChange={(e) => setActivityFormData({ ...activityFormData, color: e.target.value })}
                    className="mt-1 h-10"
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
                        deleteActivityMutation.mutate(editItem.id);
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
              </>
            ) : (
              <>
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
            </>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}