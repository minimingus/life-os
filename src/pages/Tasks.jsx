import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Plus,
  Circle,
  Calendar as CalendarIcon,
  Flag,
  Tag as TagIcon,
  Inbox,
  CalendarDays,
  Filter,
  Repeat,
  X,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isToday, isTomorrow, isThisWeek, addDays, addWeeks, addMonths, addYears, startOfWeek } from "date-fns";
import { he } from "date-fns/locale";

const PRIORITY_COLORS = {
  1: "text-red-600",
  2: "text-orange-500",
  3: "text-blue-500",
  4: "text-slate-400"
};

const RECURRENCE_PATTERNS = {
  daily: "יומי",
  weekly: "שבועי",
  monthly: "חודשי",
  yearly: "שנתי"
};

const WEEKDAYS = [
  { value: 0, label: "א" },
  { value: 1, label: "ב" },
  { value: 2, label: "ג" },
  { value: 3, label: "ד" },
  { value: 4, label: "ה" },
  { value: 5, label: "ו" },
  { value: 6, label: "ש" }
];

export default function Tasks() {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [quickAddValue, setQuickAddValue] = useState("");
  const [selectedSection, setSelectedSection] = useState("inbox");
  const [filterProject, setFilterProject] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);
  const [completionNote, setCompletionNote] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project: "",
    priority: 4,
    labels: [],
    assigned_to_id: "",
    assigned_to_name: "",
    due_date: "",
    due_time: "",
    is_recurring: false,
    recurrence_pattern: "weekly",
    recurrence_interval: 1,
    recurrence_days: [],
    status: "pending"
  });
  const [newLabel, setNewLabel] = useState("");

  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list("-created_date")
  });

  const { data: members = [] } = useQuery({
    queryKey: ["family"],
    queryFn: () => base44.entities.FamilyMember.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setQuickAddValue("");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] })
  });

  const resetForm = () => {
    setShowDialog(false);
    setEditItem(null);
    setFormData({
      title: "",
      description: "",
      project: "",
      priority: 4,
      labels: [],
      assigned_to_id: "",
      assigned_to_name: "",
      due_date: "",
      due_time: "",
      is_recurring: false,
      recurrence_pattern: "weekly",
      recurrence_interval: 1,
      recurrence_days: [],
      status: "pending"
    });
    setNewLabel("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
    resetForm();
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!quickAddValue.trim()) return;
    
    createMutation.mutate({
      title: quickAddValue,
      status: "pending",
      priority: 4
    });
  };

  const toggleComplete = async (task) => {
    if (task.status === "completed") {
      // Uncomplete
      updateMutation.mutate({
        id: task.id,
        data: { ...task, status: "pending", completed_at: null, completion_note: null }
      });
    } else {
      // Show completion dialog
      setTaskToComplete(task);
      setShowCompleteDialog(true);
    }
  };

  const completeTask = async () => {
    if (!taskToComplete) return;
    
    const completed_at = new Date().toISOString();
    
    // If recurring, create next occurrence
    if (taskToComplete.is_recurring && taskToComplete.recurrence_pattern) {
      const nextDate = calculateNextOccurrence(taskToComplete);
      if (nextDate) {
        await createMutation.mutateAsync({
          ...taskToComplete,
          id: undefined,
          due_date: format(nextDate, "yyyy-MM-dd"),
          status: "pending",
          completed_at: null,
          completion_note: null,
          parent_task_id: taskToComplete.parent_task_id || taskToComplete.id
        });
      }
    }
    
    await updateMutation.mutateAsync({
      id: taskToComplete.id,
      data: { 
        ...taskToComplete, 
        status: "completed", 
        completed_at,
        completion_note: completionNote.trim() || null
      }
    });
    
    setShowCompleteDialog(false);
    setTaskToComplete(null);
    setCompletionNote("");
  };

  const calculateNextOccurrence = (task) => {
    if (!task.due_date) return null;
    
    const currentDate = parseISO(task.due_date);
    const interval = task.recurrence_interval || 1;
    
    switch (task.recurrence_pattern) {
      case "daily":
        return addDays(currentDate, interval);
      case "weekly":
        if (task.recurrence_days?.length > 0) {
          // Find next day in the cycle
          const currentDay = currentDate.getDay();
          const sortedDays = [...task.recurrence_days].sort((a, b) => a - b);
          const nextDay = sortedDays.find(d => d > currentDay) || sortedDays[0];
          const daysToAdd = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;
          return addDays(currentDate, daysToAdd);
        }
        return addWeeks(currentDate, interval);
      case "monthly":
        return addMonths(currentDate, interval);
      case "yearly":
        return addYears(currentDate, interval);
      default:
        return null;
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      project: item.project || "",
      priority: item.priority || 4,
      labels: item.labels || [],
      assigned_to_id: item.assigned_to_id || "",
      assigned_to_name: item.assigned_to_name || "",
      due_date: item.due_date || "",
      due_time: item.due_time || "",
      is_recurring: item.is_recurring || false,
      recurrence_pattern: item.recurrence_pattern || "weekly",
      recurrence_interval: item.recurrence_interval || 1,
      recurrence_days: item.recurrence_days || [],
      status: item.status || "pending"
    });
    setShowDialog(true);
  };

  const addLabel = () => {
    if (newLabel.trim() && !formData.labels.includes(newLabel.trim())) {
      setFormData({ ...formData, labels: [...formData.labels, newLabel.trim()] });
      setNewLabel("");
    }
  };

  const removeLabel = (label) => {
    setFormData({ ...formData, labels: formData.labels.filter(l => l !== label) });
  };

  const toggleRecurrenceDay = (day) => {
    const days = formData.recurrence_days || [];
    if (days.includes(day)) {
      setFormData({ ...formData, recurrence_days: days.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, recurrence_days: [...days, day].sort() });
    }
  };

  // Organize tasks by sections
  const activeTasks = tasks.filter(t => t.status !== "completed");
  const completedTasks = tasks.filter(t => t.status === "completed");

  const todayTasks = activeTasks.filter(t => 
    t.due_date && isToday(parseISO(t.due_date))
  );
  
  const tomorrowTasks = activeTasks.filter(t => 
    t.due_date && isTomorrow(parseISO(t.due_date))
  );
  
  const thisWeekTasks = activeTasks.filter(t => 
    t.due_date && isThisWeek(parseISO(t.due_date), { locale: he }) && 
    !isToday(parseISO(t.due_date)) && !isTomorrow(parseISO(t.due_date))
  );
  
  const inboxTasks = activeTasks.filter(t => !t.due_date);
  
  const overdueTasks = activeTasks.filter(t => 
    t.due_date && parseISO(t.due_date) < new Date() && 
    !isToday(parseISO(t.due_date))
  );

  // Apply project filter
  const filterByProject = (taskList) => {
    if (filterProject === "all") return taskList;
    return taskList.filter(t => t.project === filterProject);
  };

  // Get unique projects
  const projects = [...new Set(tasks.map(t => t.project).filter(Boolean))];

  // Determine which tasks to show
  let displayTasks = [];
  let sectionTitle = "";
  
  switch (selectedSection) {
    case "today":
      displayTasks = filterByProject(todayTasks);
      sectionTitle = "היום";
      break;
    case "tomorrow":
      displayTasks = filterByProject(tomorrowTasks);
      sectionTitle = "מחר";
      break;
    case "week":
      displayTasks = filterByProject(thisWeekTasks);
      sectionTitle = "השבוע";
      break;
    case "completed":
      displayTasks = filterByProject(completedTasks);
      sectionTitle = "הושלמו";
      break;
    default:
      displayTasks = filterByProject(inboxTasks);
      sectionTitle = "תיבת דואר נכנס";
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-0 -m-4 lg:-m-8">
      {/* Sidebar */}
      <div className="lg:w-64 bg-slate-50 border-b lg:border-l border-slate-200 p-4 lg:p-6 overflow-y-auto">
        <Button
          onClick={() => setShowDialog(true)}
          className="w-full bg-red-500 hover:bg-red-600 mb-6 h-10"
        >
          <Plus className="w-4 h-4 ml-2" />
          הוסף משימה
        </Button>

        <div className="space-y-1 mb-6">
          <button
            onClick={() => setSelectedSection("inbox")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              selectedSection === "inbox" 
                ? "bg-slate-200 text-slate-900 font-medium" 
                : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <Inbox className="w-4 h-4" />
            תיבת דואר נכנס
            {inboxTasks.length > 0 && (
              <span className="mr-auto text-xs text-slate-500">{inboxTasks.length}</span>
            )}
          </button>

          <button
            onClick={() => setSelectedSection("today")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              selectedSection === "today" 
                ? "bg-slate-200 text-slate-900 font-medium" 
                : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <CalendarIcon className="w-4 h-4 text-green-600" />
            היום
            {todayTasks.length > 0 && (
              <span className="mr-auto text-xs text-slate-500">{todayTasks.length}</span>
            )}
          </button>

          <button
            onClick={() => setSelectedSection("tomorrow")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              selectedSection === "tomorrow" 
                ? "bg-slate-200 text-slate-900 font-medium" 
                : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <CalendarDays className="w-4 h-4 text-amber-600" />
            מחר
            {tomorrowTasks.length > 0 && (
              <span className="mr-auto text-xs text-slate-500">{tomorrowTasks.length}</span>
            )}
          </button>

          <button
            onClick={() => setSelectedSection("week")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              selectedSection === "week" 
                ? "bg-slate-200 text-slate-900 font-medium" 
                : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <CalendarDays className="w-4 h-4 text-blue-600" />
            השבוע
            {thisWeekTasks.length > 0 && (
              <span className="mr-auto text-xs text-slate-500">{thisWeekTasks.length}</span>
            )}
          </button>

          <button
            onClick={() => setSelectedSection("completed")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              selectedSection === "completed" 
                ? "bg-slate-200 text-slate-900 font-medium" 
                : "text-slate-700 hover:bg-slate-100"
            )}
          >
            ✓ הושלמו
            {completedTasks.length > 0 && (
              <span className="mr-auto text-xs text-slate-500">{completedTasks.length}</span>
            )}
          </button>
        </div>

        {projects.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-semibold text-slate-500 mb-2 px-3">פרויקטים</h3>
            <div className="space-y-1">
              {projects.map(project => {
                const count = activeTasks.filter(t => t.project === project).length;
                return (
                  <button
                    key={project}
                    onClick={() => setFilterProject(filterProject === project ? "all" : project)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      filterProject === project
                        ? "bg-slate-200 text-slate-900 font-medium"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    {project}
                    {count > 0 && (
                      <span className="mr-auto text-xs text-slate-500">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-200 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900">{sectionTitle}</h1>
            {filterProject !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterProject("all")}
                className="text-slate-600"
              >
                <X className="w-4 h-4 ml-1" />
                נקה סינון
              </Button>
            )}
          </div>

          {/* Quick Add */}
          <form onSubmit={handleQuickAdd} className="flex gap-2">
            <Input
              value={quickAddValue}
              onChange={(e) => setQuickAddValue(e.target.value)}
              placeholder="הקלד משימה חדשה..."
              className="flex-1"
            />
            <Button type="submit" size="icon" variant="ghost">
              <Plus className="w-5 h-5" />
            </Button>
          </form>

          {overdueTasks.length > 0 && selectedSection !== "completed" && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">
                {overdueTasks.length} משימות באיחור
              </p>
            </div>
          )}
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {displayTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">אין משימות כאן</p>
            </div>
          ) : (
            <div className="space-y-1">
              {displayTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => toggleComplete(task)}
                  onEdit={() => openEdit(task)}
                  onDelete={() => deleteMutation.mutate(task.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editItem ? "עריכת משימה" : "משימה חדשה"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="שם המשימה"
                className="text-base font-medium"
                required
              />
            </div>

            <div>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="תיאור"
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 mb-1 block">תאריך</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">שעה</label>
                <Input
                  type="time"
                  value={formData.due_time}
                  onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 mb-1 block">עדיפות</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={cn(
                      "flex-1 py-2 rounded-lg border-2 transition-all",
                      formData.priority === p
                        ? "border-red-500 bg-red-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <Flag className={cn("w-4 h-4 mx-auto", PRIORITY_COLORS[p])} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 mb-1 block">פרויקט</label>
              <Input
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                placeholder="שם הפרויקט"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 mb-1 block">תגיות</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                  placeholder="הוסף תגית"
                  className="flex-1"
                />
                <Button type="button" onClick={addLabel} size="sm" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.labels.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.labels.map((label, idx) => (
                    <Badge key={idx} variant="outline" className="gap-1">
                      {label}
                      <button type="button" onClick={() => removeLabel(label)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-600 mb-1 block">אחראי</label>
              <Select
                value={formData.assigned_to_id}
                onValueChange={(v) => {
                  const member = members.find(m => m.id === v);
                  setFormData({
                    ...formData,
                    assigned_to_id: v,
                    assigned_to_name: member?.name || ""
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר בן משפחה" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <label className="text-xs text-slate-600 mb-2 block">סוג משימה</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_recurring: false })}
                  className={cn(
                    "py-3 px-4 rounded-lg border-2 transition-all text-sm font-medium",
                    !formData.is_recurring
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  <Circle className="w-4 h-4 mx-auto mb-1" />
                  חד פעמית
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_recurring: true })}
                  className={cn(
                    "py-3 px-4 rounded-lg border-2 transition-all text-sm font-medium",
                    formData.is_recurring
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  <Repeat className="w-4 h-4 mx-auto mb-1" />
                  חוזרת
                </button>
              </div>

              {formData.is_recurring && (
                <div className="space-y-3 pr-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">תבנית</label>
                      <Select
                        value={formData.recurrence_pattern}
                        onValueChange={(v) => setFormData({ ...formData, recurrence_pattern: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(RECURRENCE_PATTERNS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">כל</label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.recurrence_interval}
                        onChange={(e) => setFormData({ ...formData, recurrence_interval: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  {formData.recurrence_pattern === "weekly" && (
                    <div>
                      <label className="text-xs text-slate-600 mb-2 block">ימים</label>
                      <div className="flex gap-1">
                        {WEEKDAYS.map(day => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleRecurrenceDay(day.value)}
                            className={cn(
                              "flex-1 py-2 rounded-lg border-2 text-xs font-medium transition-all",
                              formData.recurrence_days?.includes(day.value)
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-200 text-slate-600 hover:border-slate-300"
                            )}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-red-500 hover:bg-red-600">
                {editItem ? "שמור" : "הוסף משימה"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                ביטול
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Task Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>השלמת משימה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-900">{taskToComplete?.title}</p>
              {taskToComplete?.description && (
                <p className="text-sm text-slate-600 mt-1">{taskToComplete.description}</p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                הוסף הערה (אופציונלי)
              </label>
              <textarea
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="מה למדת? מה הצליח? מה ניתן לשפר?"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button 
                type="button"
                onClick={completeTask}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                ✓ סמן כהושלם
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setShowCompleteDialog(false);
                  setTaskToComplete(null);
                  setCompletionNote("");
                }}
              >
                ביטול
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const isOverdue = task.due_date && task.status !== "completed" && 
    parseISO(task.due_date) < new Date() && !isToday(parseISO(task.due_date));

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-all cursor-pointer border border-transparent",
        task.status === "completed" && "opacity-50",
        isOverdue && "bg-red-50/50"
      )}
      onClick={onEdit}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="mt-0.5 flex-shrink-0"
      >
        {task.status === "completed" ? (
          <div className="w-5 h-5 rounded-full bg-slate-400 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className={cn(
            "w-5 h-5 rounded-full border-2 hover:border-slate-400 transition-colors",
            task.priority === 1 ? "border-red-500" :
            task.priority === 2 ? "border-orange-500" :
            task.priority === 3 ? "border-blue-500" :
            "border-slate-300"
          )} />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-sm font-medium",
            task.status === "completed" ? "line-through text-slate-500" : "text-slate-900"
          )}>
            {task.title}
          </p>
          {task.is_recurring && (
            <Repeat className="w-3 h-3 text-slate-400" />
          )}
        </div>

        {task.description && (
          <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
          {task.due_date && (
            <span className={cn(
              "flex items-center gap-1",
              isOverdue && "text-red-600 font-medium"
            )}>
              <CalendarIcon className="w-3 h-3" />
              {format(parseISO(task.due_date), "d בMMM", { locale: he })}
              {task.due_time && ` ${task.due_time}`}
            </span>
          )}
          {task.project && (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              {task.project}
            </span>
          )}
          {task.assigned_to_name && (
            <span>@{task.assigned_to_name}</span>
          )}
          {task.completion_note && (
            <span className="flex items-center gap-1 text-green-600">
              <MessageSquare className="w-3 h-3" />
              {task.completion_note}
            </span>
          )}
          {task.labels?.map((label, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}