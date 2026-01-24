import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Users, 
  User,
  Baby,
  Upload,
  Calendar,
  FolderKanban,
  ListTodo,
  CalendarDays,
  Clock,
  GraduationCap,
  Dumbbell,
  X,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInYears } from "date-fns";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  { value: "#3b82f6", label: "כחול" },
  { value: "#10b981", label: "ירוק" },
  { value: "#f59e0b", label: "כתום" },
  { value: "#ef4444", label: "אדום" },
  { value: "#8b5cf6", label: "סגול" },
  { value: "#ec4899", label: "ורוד" },
  { value: "#14b8a6", label: "טורקיז" },
  { value: "#f97316", label: "כתום כהה" }
];

const RESPONSIBILITIES = [
  { value: "קניות", label: "קניות", color: "bg-blue-100 text-blue-700" },
  { value: "בישול", label: "בישול", color: "bg-orange-100 text-orange-700" },
  { value: "ניקיון", label: "ניקיון", color: "bg-green-100 text-green-700" },
  { value: "כביסה", label: "כביסה", color: "bg-purple-100 text-purple-700" },
  { value: "טיפול בילדים", label: "טיפול בילדים", color: "bg-pink-100 text-pink-700" },
  { value: "תחזוקה", label: "תחזוקה", color: "bg-red-100 text-red-700" }
];

export default function Family() {
  const [showDialog, setShowDialog] = useState(false);
  const [showMemberView, setShowMemberView] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "child",
    birth_date: "",
    color: "#3b82f6",
    avatar: "",
    responsibilities: [],
    email: "",
    phone: "",
    notification_preference: "none"
  });

  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["family"],
    queryFn: () => base44.entities.FamilyMember.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FamilyMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FamilyMember.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
      resetForm();
    }
  });



  const resetForm = () => {
    setShowDialog(false);
    setEditItem(null);
    setFormData({
      name: "",
      role: "child",
      birth_date: "",
      color: "#3b82f6",
      avatar: "",
      responsibilities: [],
      email: "",
      phone: "",
      notification_preference: "none"
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
    setFormData({
      name: item.name || "",
      role: item.role || "child",
      birth_date: item.birth_date || "",
      color: item.color || "#3b82f6",
      avatar: item.avatar || "",
      responsibilities: item.responsibilities || [],
      email: item.email || "",
      phone: item.phone || "",
      notification_preference: item.notification_preference || "none"
    });
    setShowDialog(true);
  };

  const toggleResponsibility = (responsibility) => {
    setFormData({
      ...formData,
      responsibilities: formData.responsibilities.includes(responsibility)
        ? formData.responsibilities.filter(r => r !== responsibility)
        : [...formData.responsibilities, responsibility]
    });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, avatar: file_url });
    }
  };

  const getAge = (birthDate) => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), parseISO(birthDate));
  };

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["routineTasks"],
    queryFn: () => base44.entities.RoutineTask.list()
  });

  const { data: events = [] } = useQuery({
    queryKey: ["calendarEvents"],
    queryFn: () => base44.entities.CalendarEvent.list()
  });

  const { data: scheduleItems = [] } = useQuery({
    queryKey: ["schoolSchedule"],
    queryFn: () => base44.entities.SchoolSchedule.list()
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["extracurricular"],
    queryFn: () => base44.entities.Extracurricular.list()
  });

  const openMemberView = (member) => {
    setSelectedMember(member);
    setShowMemberView(true);
  };

  const parents = members.filter(m => m.role === "parent");
  const children = members.filter(m => m.role === "child");

  return (
    <div className="space-y-6">
      <PageHeader
        title="בני המשפחה"
        subtitle={`${members.length} בני משפחה`}
        action={() => setShowDialog(true)}
        actionLabel="הוסף בן משפחה"
      />

      {members.length === 0 && !isLoading ? (
        <EmptyState
          icon={Users}
          title="אין בני משפחה"
          description="הוסף את בני המשפחה לניהול יומן ואירועים"
          action={() => setShowDialog(true)}
          actionLabel="הוסף בן משפחה"
        />
      ) : (
        <div className="space-y-8">
          {/* Parents */}
          {parents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                הורים
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {parents.map(member => (
                  <MemberCard 
                    key={member.id} 
                    member={member} 
                    onEdit={openEdit}
                    onView={openMemberView}
                    getAge={getAge}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Children */}
          {children.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Baby className="w-5 h-5" />
                ילדים
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {children.map(member => (
                  <MemberCard 
                    key={member.id} 
                    member={member} 
                    onEdit={openEdit}
                    onView={openMemberView}
                    getAge={getAge}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editItem ? "עריכת בן משפחה" : "הוספת בן משפחה"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar */}
            <div className="flex justify-center">
              <label className="relative cursor-pointer group">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg"
                  style={{ backgroundColor: formData.color }}
                >
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      {formData.name ? formData.name[0].toUpperCase() : "?"}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">שם</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="השם המלא"
                className="mt-1"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">תפקיד</label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">הורה</SelectItem>
                  <SelectItem value="child">ילד/ה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">תאריך לידה</label>
              <Input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">צבע ביומן</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {COLORS.map(({ value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: value })}
                    className={cn(
                      "w-8 h-8 rounded-full transition-transform",
                      formData.color === value && "ring-2 ring-offset-2 ring-slate-400 scale-110"
                    )}
                    style={{ backgroundColor: value }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-3 block">תחומי אחריות</label>
              <div className="flex flex-wrap gap-2">
                {RESPONSIBILITIES.map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleResponsibility(value)}
                    className={cn(
                      "px-3 py-2 rounded-lg font-medium text-sm transition-all border-2",
                      formData.responsibilities.includes(value)
                        ? `${color} border-current`
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {formData.role === "parent" && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900 mb-3">הגדרות התראות</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700">מייל</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="הזן כתובת מייל"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700">טלפון (SMS)</label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="הזן מספר טלפון"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700">ערוץ התראות</label>
                      <Select
                        value={formData.notification_preference}
                        onValueChange={(v) => setFormData({ ...formData, notification_preference: v })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">אל תשלח התראות</SelectItem>
                          <SelectItem value="email">מייל בלבד</SelectItem>
                          <SelectItem value="sms">SMS בלבד</SelectItem>
                          <SelectItem value="both">מייל + SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            )}

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

      {/* Member View Dialog */}
      <Dialog open={showMemberView} onOpenChange={setShowMemberView}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden shadow-lg"
                style={{ backgroundColor: selectedMember?.color || "#3b82f6" }}
              >
                {selectedMember?.avatar ? (
                  <img src={selectedMember.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {selectedMember?.name?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div>
                <DialogTitle className="text-2xl">{selectedMember?.name}</DialogTitle>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedMember?.role === "parent" ? "הורה" : "ילד/ה"}
                  {selectedMember?.birth_date && ` • גיל ${getAge(selectedMember.birth_date)}`}
                </p>
              </div>
            </div>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-6 mt-4">
              {(() => {
                const memberProjects = projects.filter(p => p.family_member_id === selectedMember.id);
                const memberTasks = tasks.filter(t => t.family_member_id === selectedMember.id);
                const memberEvents = events.filter(e => e.family_member_id === selectedMember.id);
                const memberSchedule = scheduleItems.filter(s => s.family_member_id === selectedMember.id);
                const memberActivities = activities.filter(a => a.family_member_id === selectedMember.id);
                
                const hasAnyData = memberProjects.length > 0 || memberTasks.length > 0 || 
                  memberEvents.length > 0 || memberSchedule.length > 0 || memberActivities.length > 0;

                if (!hasAnyData) {
                  return (
                    <div className="text-center py-12 text-slate-500">
                      <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>אין פרטים קשורים לבן משפחה זה כרגע</p>
                    </div>
                  );
                }
              })()}

              {/* Projects */}
              {(() => {
                const memberProjects = projects.filter(p => p.family_member_id === selectedMember.id);
                return memberProjects.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
                      <FolderKanban className="w-5 h-5" />
                      פרויקטים ({memberProjects.length})
                    </h3>
                    <div className="space-y-2">
                      {memberProjects.map(project => (
                        <div key={project.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-slate-800">{project.title}</p>
                              {project.description && (
                                <p className="text-sm text-slate-600 mt-1">{project.description}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-200 hover:bg-blue-100 flex-shrink-0"
                              onClick={() => window.open(`/projects?member=${selectedMember.id}`, '_blank')}
                            >
                              <ListTodo className="w-3 h-3 ml-1" />
                              משימות
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Routine Tasks */}
              {(() => {
                const memberTasks = tasks.filter(t => t.family_member_id === selectedMember.id);
                return memberTasks.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
                      <Clock className="w-5 h-5" />
                      משימות בלוז ({memberTasks.length})
                    </h3>
                    <div className="space-y-2">
                      {memberTasks.map(task => (
                        <div key={task.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="font-medium text-slate-800">{task.title}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {task.start_time} {task.end_time && `- ${task.end_time}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Calendar Events */}
              {(() => {
                const memberEvents = events.filter(e => e.family_member_id === selectedMember.id);
                return memberEvents.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
                      <CalendarDays className="w-5 h-5" />
                      אירועים ({memberEvents.length})
                    </h3>
                    <div className="space-y-2">
                      {memberEvents.slice(0, 5).map(event => (
                        <div key={event.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="font-medium text-slate-800">{event.title}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {event.date && format(parseISO(event.date), "dd/MM/yyyy")}
                            {event.start_time && ` • ${event.start_time}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* School Schedule */}
              {(() => {
                const memberSchedule = scheduleItems.filter(s => s.family_member_id === selectedMember.id);
                return memberSchedule.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
                      <GraduationCap className="w-5 h-5" />
                      מערכת שעות ({memberSchedule.length})
                    </h3>
                    <div className="space-y-2">
                      {memberSchedule.slice(0, 5).map(item => (
                        <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="font-medium text-slate-800">{item.subject}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {item.teacher && `${item.teacher} • `}
                            {item.start_time} - {item.end_time}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Extracurricular Activities */}
              {(() => {
                const memberActivities = activities.filter(a => a.family_member_id === selectedMember.id);
                return memberActivities.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
                      <Dumbbell className="w-5 h-5" />
                      חוגים ({memberActivities.length})
                    </h3>
                    <div className="space-y-2">
                      {memberActivities.map(activity => (
                        <div key={activity.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="font-medium text-slate-800">{activity.activity_name}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {activity.location && `${activity.location} • `}
                            {activity.start_time} - {activity.end_time}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MemberCard({ member, onEdit, onView, getAge }) {
  const age = getAge(member.birth_date);
  
  return (
    <div 
      className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all cursor-pointer"
      onClick={() => onView(member)}
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg"
          style={{ backgroundColor: member.color || "#3b82f6" }}
        >
          {member.avatar ? (
            <img src={member.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-white">
              {member.name?.[0]?.toUpperCase() || "?"}
            </span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-slate-800">{member.name}</h3>
          <p className="text-sm text-slate-500">
            {member.role === "parent" ? "הורה" : "ילד/ה"}
            {age !== null && ` • גיל ${age}`}
          </p>
          {member.responsibilities && member.responsibilities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {member.responsibilities.map((resp) => {
                const respConfig = RESPONSIBILITIES.find(r => r.value === resp);
                return (
                  <Badge key={resp} className={cn("text-xs", respConfig?.color)}>
                    {respConfig?.label || resp}
                  </Badge>
                );
              })}
            </div>
          )}
          {member.birth_date && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(parseISO(member.birth_date), "dd/MM/yyyy")}
            </p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(member);
          }}
          className="text-slate-600 hover:text-blue-600 flex-shrink-0"
        >
          עריכה
        </Button>
      </div>
    </div>
  );
}