import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Clock, 
  User,
  Trash2,
  Sun,
  Briefcase,
  Baby,
  Home,
  Dumbbell,
  ChefHat,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = {
  morning: { label: "בוקר", icon: Sun, color: "bg-amber-100 text-amber-700" },
  work: { label: "עבודה", icon: Briefcase, color: "bg-blue-100 text-blue-700" },
  kids: { label: "ילדים", icon: Baby, color: "bg-pink-100 text-pink-700" },
  household: { label: "משק בית", icon: Home, color: "bg-green-100 text-green-700" },
  sport: { label: "ספורט", icon: Dumbbell, color: "bg-purple-100 text-purple-700" },
  cooking: { label: "בישול", icon: ChefHat, color: "bg-orange-100 text-orange-700" },
  other: { label: "אחר", icon: Calendar, color: "bg-slate-100 text-slate-700" }
};

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export default function FamilyRoutine() {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [formData, setFormData] = useState({
    title: "",
    start_time: "",
    end_time: "",
    family_member_id: "",
    family_member_name: "",
    days: [selectedDay],
    description: "",
    category: "other",
    color: ""
  });

  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ["routine-tasks"],
    queryFn: () => base44.entities.RoutineTask.list()
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ["family"],
    queryFn: () => base44.entities.FamilyMember.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RoutineTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routine-tasks"] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RoutineTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routine-tasks"] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RoutineTask.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["routine-tasks"] })
  });

  const resetForm = () => {
    setShowDialog(false);
    setEditItem(null);
    setFormData({
      title: "",
      start_time: "",
      end_time: "",
      family_member_id: "",
      family_member_name: "",
      days: [selectedDay],
      description: "",
      category: "other",
      color: ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (task) => {
    setEditItem(task);
    setFormData({
      title: task.title || "",
      start_time: task.start_time || "",
      end_time: task.end_time || "",
      family_member_id: task.family_member_id || "",
      family_member_name: task.family_member_name || "",
      days: task.days || [selectedDay],
      description: task.description || "",
      category: task.category || "other",
      color: task.color || ""
    });
    setShowDialog(true);
  };

  const toggleDay = (dayIndex) => {
    const days = formData.days || [];
    if (days.includes(dayIndex)) {
      setFormData({ ...formData, days: days.filter(d => d !== dayIndex) });
    } else {
      setFormData({ ...formData, days: [...days, dayIndex].sort() });
    }
  };

  // Filter tasks by selected day
  const dailyTasks = tasks
    .filter(task => task.days?.includes(selectedDay))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Group by family member
  const tasksByMember = {};
  dailyTasks.forEach(task => {
    const memberName = task.family_member_name || "כללי";
    if (!tasksByMember[memberName]) {
      tasksByMember[memberName] = [];
    }
    tasksByMember[memberName].push(task);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="לוח סדר יום משפחתי"
        subtitle="ניהול שגרת היום של כל בני המשפחה"
        action={() => setShowDialog(true)}
        actionLabel="הוסף משימה"
      />

      {/* Day selector */}
      <div className="flex flex-wrap gap-2">
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

      {/* Timeline View */}
      <div className="space-y-6">
        {Object.entries(tasksByMember).map(([memberName, memberTasks]) => {
          const member = familyMembers.find(m => m.name === memberName);
          
          return (
            <div key={memberName} className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                {member?.avatar ? (
                  <img src={member.avatar} alt={memberName} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-800">{memberName}</h3>
                  <p className="text-sm text-slate-500">{memberTasks.length} משימות</p>
                </div>
              </div>

              <div className="space-y-3">
                {memberTasks.map(task => {
                  const category = CATEGORIES[task.category] || CATEGORIES.other;
                  const CategoryIcon = category.icon;
                  
                  return (
                    <div 
                      key={task.id}
                      className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => openEdit(task)}
                    >
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", category.color)}>
                        <CategoryIcon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{task.start_time}</span>
                            {task.end_time && <span>- {task.end_time}</span>}
                          </div>
                        </div>

                        {task.days && task.days.length < 7 && (
                          <div className="flex gap-1 mt-2">
                            {task.days.map(dayIdx => (
                              <Badge key={dayIdx} variant="outline" className="text-xs">
                                {DAYS[dayIdx].substring(0, 2)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(task.id);
                        }}
                        className="text-slate-400 hover:text-rose-500 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {dailyTasks.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">אין משימות ליום {DAYS[selectedDay]}</p>
            <p className="text-sm mt-1">הוסף משימות כדי לארגן את סדר היום</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editItem ? "עריכת משימה" : "הוספת משימה ללוח"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">שם המשימה</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="למשל: הכנת ארוחת בוקר"
                className="mt-1"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">תיאור</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="פירוט המשימה..."
                className="mt-1"
                rows={2}
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
                  required
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">קטגוריה</label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([key, { label, icon: Icon }]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">בן משפחה אחראי</label>
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
                    <SelectValue placeholder="בחר..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>כללי</SelectItem>
                    {familyMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">ימים בשבוע</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant={formData.days?.includes(idx) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(idx)}
                    className={formData.days?.includes(idx) ? "bg-blue-500" : ""}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600">
                {editItem ? "עדכן" : "הוסף"}
              </Button>
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