import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Palette, 
  Plus, 
  Trash2, 
  Trophy,
  Clock,
  DollarSign,
  Target,
  Upload,
  X,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = {
  sport: { label: "ספורט", icon: Trophy, color: "bg-green-100 text-green-600" },
  art: { label: "אמנות", icon: Palette, color: "bg-purple-100 text-purple-600" },
  music: { label: "מוזיקה", icon: Palette, color: "bg-pink-100 text-pink-600" },
  reading: { label: "קריאה", icon: Palette, color: "bg-blue-100 text-blue-600" },
  learning: { label: "למידה", icon: Palette, color: "bg-indigo-100 text-indigo-600" },
  crafts: { label: "יצירה", icon: Palette, color: "bg-orange-100 text-orange-600" },
  collection: { label: "אספנות", icon: Palette, color: "bg-yellow-100 text-yellow-600" },
  gaming: { label: "משחקים", icon: Palette, color: "bg-cyan-100 text-cyan-600" },
  other: { label: "אחר", icon: Palette, color: "bg-slate-100 text-slate-600" }
};

const STATUS = {
  active: { label: "פעיל", color: "bg-green-100 text-green-600" },
  paused: { label: "מושהה", color: "bg-yellow-100 text-yellow-600" },
  completed: { label: "הושלם", color: "bg-blue-100 text-blue-600" }
};

export default function Hobbies() {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    category: "other",
    description: "",
    family_member_id: "",
    family_member_name: "",
    status: "active",
    start_date: "",
    frequency: "weekly",
    time_spent: "",
    budget: "",
    budget_spent: "",
    goals: [],
    milestones: [],
    resources: [],
    notes: "",
    photos: [],
    color: "#3b82f6"
  });
  const [goalInput, setGoalInput] = useState("");
  const [resourceInput, setResourceInput] = useState("");

  const queryClient = useQueryClient();

  const { data: hobbies = [], isLoading } = useQuery({
    queryKey: ["hobbies"],
    queryFn: () => base44.entities.Hobby.list("-created_date")
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ["family"],
    queryFn: () => base44.entities.FamilyMember.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Hobby.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hobbies"] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Hobby.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hobbies"] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Hobby.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hobbies"] })
  });

  const resetForm = () => {
    setShowDialog(false);
    setEditItem(null);
    setFormData({
      title: "",
      category: "other",
      description: "",
      family_member_id: "",
      family_member_name: "",
      status: "active",
      start_date: "",
      frequency: "weekly",
      time_spent: "",
      budget: "",
      budget_spent: "",
      goals: [],
      milestones: [],
      resources: [],
      notes: "",
      photos: [],
      color: "#3b82f6"
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const member = familyMembers.find(m => m.id === formData.family_member_id);
    const data = {
      ...formData,
      family_member_name: member?.name || "",
      time_spent: formData.time_spent ? parseFloat(formData.time_spent) : null,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      budget_spent: formData.budget_spent ? parseFloat(formData.budget_spent) : null
    };
    
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      title: item.title || "",
      category: item.category || "other",
      description: item.description || "",
      family_member_id: item.family_member_id || "",
      family_member_name: item.family_member_name || "",
      status: item.status || "active",
      start_date: item.start_date || "",
      frequency: item.frequency || "weekly",
      time_spent: item.time_spent || "",
      budget: item.budget || "",
      budget_spent: item.budget_spent || "",
      goals: item.goals || [],
      milestones: item.milestones || [],
      resources: item.resources || [],
      notes: item.notes || "",
      photos: item.photos || [],
      color: item.color || "#3b82f6"
    });
    setShowDialog(true);
  };

  const addGoal = () => {
    if (goalInput) {
      setFormData({
        ...formData,
        goals: [...formData.goals, { description: goalInput, completed: false }]
      });
      setGoalInput("");
    }
  };

  const toggleGoal = (index) => {
    const newGoals = [...formData.goals];
    newGoals[index].completed = !newGoals[index].completed;
    setFormData({ ...formData, goals: newGoals });
  };

  const removeGoal = (index) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter((_, i) => i !== index)
    });
  };

  const addResource = () => {
    if (resourceInput && !formData.resources.includes(resourceInput)) {
      setFormData({
        ...formData,
        resources: [...formData.resources, resourceInput]
      });
      setResourceInput("");
    }
  };

  const removeResource = (resource) => {
    setFormData({
      ...formData,
      resources: formData.resources.filter(r => r !== resource)
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({
        ...formData,
        photos: [...formData.photos, file_url]
      });
    }
  };

  const filteredHobbies = hobbies.filter(h => 
    filterStatus === "all" || h.status === filterStatus
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="תחביבים ופרויקטים אישיים"
        subtitle={`${hobbies.length} פרויקטים`}
        action={() => setShowDialog(true)}
        actionLabel="פרויקט חדש"
      />

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("all")}
          className={filterStatus === "all" ? "bg-blue-500" : ""}
        >
          הכל
        </Button>
        {Object.entries(STATUS).map(([key, { label }]) => (
          <Button
            key={key}
            variant={filterStatus === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(key)}
            className={filterStatus === key ? "bg-blue-500" : ""}
          >
            {label}
          </Button>
        ))}
      </div>

      {hobbies.length === 0 && !isLoading ? (
        <EmptyState
          icon={Palette}
          title="אין תחביבים"
          description="התחל לעקוב אחר התחביבים והפרויקטים האישיים שלך"
          action={() => setShowDialog(true)}
          actionLabel="הוסף תחביב"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHobbies.map(hobby => {
            const categoryConfig = CATEGORIES[hobby.category] || CATEGORIES.other;
            const statusConfig = STATUS[hobby.status] || STATUS.active;
            const Icon = categoryConfig.icon;
            const completedGoals = hobby.goals?.filter(g => g.completed).length || 0;
            const totalGoals = hobby.goals?.length || 0;
            const budgetProgress = hobby.budget ? (hobby.budget_spent / hobby.budget) * 100 : 0;
            
            return (
              <div
                key={hobby.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => openEdit(hobby)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: hobby.color + '20', color: hobby.color }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{hobby.title}</h3>
                      {hobby.family_member_name && (
                        <p className="text-xs text-slate-500">{hobby.family_member_name}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={cn(statusConfig.color, "border-0")}>
                    {statusConfig.label}
                  </Badge>
                </div>

                {hobby.description && (
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{hobby.description}</p>
                )}

                {totalGoals > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>מטרות</span>
                      <span>{completedGoals}/{totalGoals}</span>
                    </div>
                    <Progress value={(completedGoals / totalGoals) * 100} className="h-2" />
                  </div>
                )}

                {hobby.budget && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>תקציב</span>
                      <span>₪{hobby.budget_spent || 0} / ₪{hobby.budget}</span>
                    </div>
                    <Progress value={budgetProgress} className="h-2" />
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  {hobby.time_spent && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {hobby.time_spent} שעות
                    </span>
                  )}
                  <Badge variant="secondary" className={cn(categoryConfig.color, "border-0 text-xs")}>
                    {categoryConfig.label}
                  </Badge>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(hobby.id);
                  }}
                  className="mt-3 w-full text-rose-500 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4 ml-1" />
                  מחק
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editItem ? "עריכת תחביב" : "תחביב חדש"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">שם</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="למשל: לימוד גיטרה"
                className="mt-1"
                required
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
                <label className="text-sm font-medium text-slate-700">סטטוס</label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">תיאור</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="תאר את התחביב או הפרויקט..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">בן משפחה</label>
              <Select
                value={formData.family_member_id}
                onValueChange={(v) => setFormData({ ...formData, family_member_id: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>ללא שיוך</SelectItem>
                  {familyMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">תקציב (₪)</label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">הוצא (₪)</label>
                <Input
                  type="number"
                  value={formData.budget_spent}
                  onChange={(e) => setFormData({ ...formData, budget_spent: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Goals */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">מטרות</label>
              <div className="space-y-2">
                {formData.goals.map((goal, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <Checkbox
                      checked={goal.completed}
                      onCheckedChange={() => toggleGoal(i)}
                    />
                    <span className={cn(
                      "flex-1 text-sm",
                      goal.completed && "line-through text-slate-500"
                    )}>
                      {goal.description}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeGoal(i)}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="הוסף מטרה..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                  />
                  <Button type="button" onClick={addGoal} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">משאבים ולינקים</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.resources.map((resource, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {resource}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeResource(resource)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={resourceInput}
                  onChange={(e) => setResourceInput(e.target.value)}
                  placeholder="הוסף קישור או משאב..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResource())}
                />
                <Button type="button" onClick={addResource} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
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