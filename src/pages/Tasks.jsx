import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
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
  ListTodo,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  User as UserIcon,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isPast } from "date-fns";
import NotificationSettingsDialog from "@/components/NotificationSettingsDialog";

const CATEGORIES = {
  shopping: { label: "קניות", icon: "🛒", color: "bg-blue-100 text-blue-700" },
  cooking: { label: "בישול", icon: "🍳", color: "bg-orange-100 text-orange-700" },
  cleaning: { label: "ניקיון", icon: "🧹", color: "bg-green-100 text-green-700" },
  maintenance: { label: "תחזוקה", icon: "🔧", color: "bg-red-100 text-red-700" },
  other: { label: "אחר", icon: "📌", color: "bg-slate-100 text-slate-700" }
};

const STATUSES = {
  pending: { label: "בהמתנה", icon: Circle, color: "text-slate-400" },
  in_progress: { label: "בתהליך", icon: Clock, color: "text-amber-500" },
  completed: { label: "הושלמה", icon: CheckCircle2, color: "text-green-600" }
};

export default function Tasks() {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [selectedMemberForSettings, setSelectedMemberForSettings] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other",
    priority: "medium",
    assigned_to_id: "",
    assigned_to_name: "",
    due_date: "",
    status: "pending"
  });

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
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      resetForm();
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
      category: "other",
      priority: "medium",
      assigned_to_id: "",
      assigned_to_name: "",
      due_date: "",
      status: "pending"
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

  const toggleStatus = (task) => {
    const nextStatus = task.status === "pending" ? "in_progress" : 
                      task.status === "in_progress" ? "completed" : "pending";
    updateMutation.mutate({
      id: task.id,
      data: { ...task, status: nextStatus, completed_at: nextStatus === "completed" ? new Date().toISOString() : null }
    });
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      category: item.category || "other",
      priority: item.priority || "medium",
      assigned_to_id: item.assigned_to_id || "",
      assigned_to_name: item.assigned_to_name || "",
      due_date: item.due_date || "",
      status: item.status || "pending"
    });
    setShowDialog(true);
  };

  const filteredTasks = filterStatus === "all" 
    ? tasks 
    : tasks.filter(t => t.status === filterStatus);

  const pendingTasks = filteredTasks.filter(t => t.status === "pending");
  const inProgressTasks = filteredTasks.filter(t => t.status === "in_progress");
  const completedTasks = filteredTasks.filter(t => t.status === "completed");

  const overdueTasks = pendingTasks.filter(t => 
    t.due_date && isPast(parseISO(t.due_date))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="משימות"
        subtitle={`${pendingTasks.length} משימות בהמתנה`}
        action={() => setShowDialog(true)}
        actionLabel="הוסף משימה"
      >
        <Button
          variant="outline"
          onClick={() => {
            const user = members[0];
            if (user) {
              setSelectedMemberForSettings({ id: user.id, name: user.name });
              setShowNotificationSettings(true);
            }
          }}
          className="gap-2"
        >
          <Bell className="w-4 h-4" />
          הגדרות התראות
        </Button>
      </PageHeader>

      {/* Alert for overdue tasks */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-700">{overdueTasks.length} משימות逾期</p>
              <p className="text-sm text-red-600 mt-1">יש משימות שהתאריך האחרון שלהן חלף</p>
            </div>
          </div>
        </div>
      )}

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("all")}
          className={filterStatus === "all" ? "bg-blue-500" : ""}
        >
          הכל
        </Button>
        {Object.entries(STATUSES).map(([key, { label }]) => {
          const count = tasks.filter(t => t.status === key).length;
          return (
            <Button
              key={key}
              variant={filterStatus === key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(key)}
              className={filterStatus === key ? "bg-blue-500" : ""}
            >
              {label} ({count})
            </Button>
          );
        })}
      </div>

      {tasks.length === 0 && !isLoading ? (
        <EmptyState
          icon={ListTodo}
          title="אין משימות"
          description="הוסף משימות להנהל את המשפחה"
          action={() => setShowDialog(true)}
          actionLabel="הוסף משימה"
        />
      ) : (
        <div className="space-y-4">
          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Circle className="w-4 h-4 text-slate-400" />
                בהמתנה ({pendingTasks.length})
              </h3>
              <div className="space-y-2">
                {pendingTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleStatus(task)}
                    onEdit={() => openEdit(task)}
                    onDelete={() => deleteMutation.mutate(task.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* In Progress Tasks */}
          {inProgressTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                בתהליך ({inProgressTasks.length})
              </h3>
              <div className="space-y-2">
                {inProgressTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleStatus(task)}
                    onEdit={() => openEdit(task)}
                    onDelete={() => deleteMutation.mutate(task.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-2 opacity-60">
              <h3 className="font-semibold text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                הושלמו ({completedTasks.length})
              </h3>
              <div className="space-y-2">
                {completedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleStatus(task)}
                    onEdit={() => openEdit(task)}
                    onDelete={() => deleteMutation.mutate(task.id)}
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
            <DialogTitle>{editItem ? "עריכת משימה" : "הוספת משימה"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">כותרת</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="למשל: קנות חלב"
                className="mt-1"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">תיאור</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="פרטים נוספים..."
                className="mt-1"
              />
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
                    {Object.entries(CATEGORIES).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">עדיפות</label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">נמוכה</SelectItem>
                    <SelectItem value="medium">רגילה</SelectItem>
                    <SelectItem value="high">דחוף</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">אחראי</label>
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
                  <SelectTrigger className="mt-1">
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
              <div>
                <label className="text-sm font-medium text-slate-700">תאריך סיום</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="mt-1"
                />
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

      {/* Notification Settings Dialog */}
      {selectedMemberForSettings && (
        <NotificationSettingsDialog
          open={showNotificationSettings}
          onOpenChange={setShowNotificationSettings}
          memberId={selectedMemberForSettings.id}
          memberName={selectedMemberForSettings.name}
        />
      )}
    </div>
  );
}

function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const cat = CATEGORIES[task.category] || CATEGORIES.other;
  const StatusIcon = STATUSES[task.status]?.icon || Circle;
  const isOverdue = task.due_date && task.status !== "completed" && isPast(parseISO(task.due_date));

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer",
        task.status === "completed" ? "bg-slate-50 border-slate-100" :
        isOverdue ? "bg-red-50 border-red-200" :
        task.status === "in_progress" ? "bg-amber-50 border-amber-200" :
        "bg-white border-slate-100 hover:border-slate-300"
      )}
      onClick={onEdit}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="mt-1 flex-shrink-0 hover:scale-110 transition-transform"
      >
        <StatusIcon className={cn(
          "w-6 h-6",
          STATUSES[task.status]?.color || "text-slate-400"
        )} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className={cn(
            "font-medium",
            task.status === "completed" ? "line-through text-slate-500" : "text-slate-800"
          )}>
            {task.title}
          </h4>
          <Badge className={cat.color}>{cat.label}</Badge>
          {task.priority === "high" && (
            <Badge className="bg-red-100 text-red-700">דחוף</Badge>
          )}
        </div>
        
        {task.description && (
          <p className="text-sm text-slate-600 mt-1">{task.description}</p>
        )}

        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
          {task.assigned_to_name && (
            <span className="flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              {task.assigned_to_name}
            </span>
          )}
          {task.due_date && (
            <span className={isOverdue && task.status !== "completed" ? "text-red-600 font-medium" : ""}>
              📅 {format(parseISO(task.due_date), "dd/MM/yyyy")}
            </span>
          )}
          {task.related_item_name && (
            <span className="text-blue-600">📌 {task.related_item_name}</span>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-slate-400 hover:text-rose-500 flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}