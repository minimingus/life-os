import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { 
  FolderKanban, 
  Trash2,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Wallet,
  Upload,
  Image,
  Filter,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

const STATUS_CONFIG = {
  planning: { label: "בתכנון", color: "bg-slate-100 text-slate-600" },
  in_progress: { label: "בביצוע", color: "bg-blue-100 text-blue-600" },
  on_hold: { label: "מושהה", color: "bg-amber-100 text-amber-600" },
  completed: { label: "הושלם", color: "bg-green-100 text-green-600" }
};

const RANGE_CONFIG = {
  short: { label: "טווח קצר", color: "bg-emerald-100 text-emerald-700" },
  medium: { label: "טווח בינוני", color: "bg-blue-100 text-blue-700" },
  long: { label: "טווח ארוך", color: "bg-purple-100 text-purple-700" }
};

const TYPE_CONFIG = {
  personal: { label: "אישי", color: "bg-violet-100 text-violet-700" },
  family: { label: "משפחתי", color: "bg-cyan-100 text-cyan-700" }
};

export default function Projects() {
  const [showDialog, setShowDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterRange, setFilterRange] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterMember, setFilterMember] = useState("all");
  const [newTask, setNewTask] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "family",
    family_member_id: "",
    family_member_name: "",
    status: "planning",
    year: new Date().getFullYear(),
    range: "medium",
    budget: "",
    spent: "",
    start_date: "",
    target_date: "",
    tasks: [],
    photos: []
  });

  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date")
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ["familyMembers"],
    queryFn: () => base44.entities.FamilyMember.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
  });

  const resetForm = () => {
    setShowDialog(false);
    setEditItem(null);
    setNewTask("");
    setFormData({
      title: "",
      description: "",
      type: "family",
      family_member_id: "",
      family_member_name: "",
      status: "planning",
      year: new Date().getFullYear(),
      range: "medium",
      budget: "",
      spent: "",
      start_date: "",
      target_date: "",
      tasks: [],
      photos: []
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      year: formData.year ? parseInt(formData.year) : new Date().getFullYear(),
      budget: formData.budget ? parseFloat(formData.budget) : null,
      spent: formData.spent ? parseFloat(formData.spent) : null,
      completed_date: formData.status === "completed" ? format(new Date(), "yyyy-MM-dd") : null
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
      description: item.description || "",
      type: item.type || "family",
      family_member_id: item.family_member_id || "",
      family_member_name: item.family_member_name || "",
      status: item.status || "planning",
      year: item.year || new Date().getFullYear(),
      range: item.range || "medium",
      budget: item.budget || "",
      spent: item.spent || "",
      start_date: item.start_date || "",
      target_date: item.target_date || "",
      tasks: item.tasks || [],
      photos: item.photos || []
    });
    setShowDialog(true);
  };

  const addTask = () => {
    if (newTask.trim()) {
      setFormData({
        ...formData,
        tasks: [...formData.tasks, { title: newTask.trim(), completed: false }]
      });
      setNewTask("");
    }
  };

  const toggleTask = (idx) => {
    const newTasks = [...formData.tasks];
    newTasks[idx].completed = !newTasks[idx].completed;
    setFormData({ ...formData, tasks: newTasks });
  };

  const removeTask = (idx) => {
    setFormData({
      ...formData,
      tasks: formData.tasks.filter((_, i) => i !== idx)
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, photos: [...formData.photos, file_url] });
    }
  };

  const filteredProjects = projects.filter(p => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterYear !== "all" && p.year !== parseInt(filterYear)) return false;
    if (filterRange !== "all" && p.range !== filterRange) return false;
    if (filterType !== "all" && p.type !== filterType) return false;
    if (filterMember !== "all" && p.family_member_id !== filterMember) return false;
    return true;
  });

  const availableYears = [...new Set(projects.map(p => p.year).filter(Boolean))].sort((a, b) => b - a);

  const getProgress = (project) => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    return Math.round((project.tasks.filter(t => t.completed).length / project.tasks.length) * 100);
  };

  const activeFiltersCount = [filterStatus, filterYear, filterRange, filterType, filterMember].filter(f => f !== "all").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="פרויקטים"
        subtitle={`${projects.filter(p => p.status !== "completed").length} פרויקטים פעילים`}
        action={() => setShowDialog(true)}
        actionLabel="פרויקט חדש"
      />

      {/* Filters Toggle */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          פילטרים
          {activeFiltersCount > 0 && (
            <Badge className="bg-blue-500 text-white h-5 min-w-5 px-1.5 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterStatus("all");
              setFilterYear("all");
              setFilterRange("all");
              setFilterType("all");
              setFilterMember("all");
            }}
            className="gap-1 text-slate-500 hover:text-slate-700"
          >
            <X className="w-3 h-3" />
            נקה הכל
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-2 block">סטטוס</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-2 block">שנה</label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל השנים</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-2 block">טווח</label>
              <Select value={filterRange} onValueChange={setFilterRange}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הטווחים</SelectItem>
                  {Object.entries(RANGE_CONFIG).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-2 block">סוג</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  {Object.entries(TYPE_CONFIG).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {familyMembers.length > 0 && (
              <div>
                <label className="text-xs font-medium text-slate-500 mb-2 block">בן משפחה</label>
                <Select value={filterMember} onValueChange={setFilterMember}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל בני המשפחה</SelectItem>
                    {familyMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}

      {projects.length === 0 && !isLoading ? (
        <EmptyState
          icon={FolderKanban}
          title="אין פרויקטים"
          description="צור פרויקט חדש לניהול עבודות שיפוץ ותחזוקה בבית"
          action={() => setShowDialog(true)}
          actionLabel="פרויקט חדש"
        />
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map(project => {
            const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
            const rangeConfig = RANGE_CONFIG[project.range] || RANGE_CONFIG.medium;
            const typeConfig = TYPE_CONFIG[project.type] || TYPE_CONFIG.family;
            const progress = getProgress(project);
            const completedTasks = project.tasks?.filter(t => t.completed).length || 0;
            const totalTasks = project.tasks?.length || 0;
            
            return (
              <div 
                key={project.id}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => openEdit(project)}
              >
                {/* Header Image */}
                {project.photos && project.photos.length > 0 && (
                  <div className="h-32 bg-slate-100 overflow-hidden">
                    <img 
                      src={project.photos[0]} 
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg text-slate-800">{project.title}</h3>
                        <Badge className={cn(typeConfig.color, "border-0")}>
                          {typeConfig.label}
                        </Badge>
                        {project.type === "personal" && project.family_member_name && (
                          <Badge variant="outline" className="border-violet-200 text-violet-700">
                            {project.family_member_name}
                          </Badge>
                        )}
                        <Badge className={cn(statusConfig.color, "border-0")}>
                          {statusConfig.label}
                        </Badge>
                        {project.range && (
                          <Badge className={cn(rangeConfig.color, "border-0")}>
                            {rangeConfig.label}
                          </Badge>
                        )}
                        {project.year && (
                          <Badge variant="outline" className="border-slate-200">
                            {project.year}
                          </Badge>
                        )}
                      </div>
                      
                      {project.description && (
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(project.id);
                      }}
                      className="text-slate-400 hover:text-rose-500 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Progress */}
                  {totalTasks > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-600">התקדמות</span>
                        <span className="text-slate-500">{completedTasks} / {totalTasks} משימות</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                  
                  {/* Info Row */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500">
                    {project.budget && (
                      <span className="flex items-center gap-1">
                        <Wallet className="w-4 h-4" />
                        תקציב: ₪{project.budget.toLocaleString()}
                        {project.spent && (
                          <span className={cn(
                            "mr-1",
                            project.spent > project.budget ? "text-rose-500" : "text-emerald-500"
                          )}>
                            (הוצא: ₪{project.spent.toLocaleString()})
                          </span>
                        )}
                      </span>
                    )}
                    {project.target_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        יעד: {format(parseISO(project.target_date), "dd/MM/yyyy")}
                      </span>
                    )}
                    {project.photos && project.photos.length > 1 && (
                      <span className="flex items-center gap-1">
                        <Image className="w-4 h-4" />
                        {project.photos.length} תמונות
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editItem ? "עריכת פרויקט" : "פרויקט חדש"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">שם הפרויקט</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="למשל: שיפוץ מרפסת"
                className="mt-1"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">תיאור</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="פרטים על הפרויקט..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">סוג הפרויקט</label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ 
                  ...formData, 
                  type: v,
                  family_member_id: v === "family" ? "" : formData.family_member_id,
                  family_member_name: v === "family" ? "" : formData.family_member_name
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_CONFIG).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type === "personal" && familyMembers.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-700">בן משפחה</label>
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
                    <SelectValue placeholder="בחר בן משפחה" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">שנה</label>
                <Input
                  type="number"
                  min="2000"
                  max="2100"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="mt-1"
                />
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
                    {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">טווח</label>
                <Select
                  value={formData.range}
                  onValueChange={(v) => setFormData({ ...formData, range: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RANGE_CONFIG).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">תקציב (₪)</label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">הוצאות בפועל (₪)</label>
                <Input
                  type="number"
                  value={formData.spent}
                  onChange={(e) => setFormData({ ...formData, spent: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">תאריך התחלה</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">תאריך יעד</label>
                <Input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Tasks */}
            <div>
              <label className="text-sm font-medium text-slate-700">משימות</label>
              <div className="mt-2 space-y-2">
                {formData.tasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(idx)}
                    />
                    <span className={cn(
                      "flex-1 text-sm",
                      task.completed && "line-through text-slate-400"
                    )}>
                      {task.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTask(idx)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="הוסף משימה..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTask())}
                  />
                  <Button type="button" variant="outline" onClick={addTask}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Photos */}
            <div>
              <label className="text-sm font-medium text-slate-700">תמונות</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.photos?.map((photo, idx) => (
                  <div key={idx} className="relative w-20 h-20">
                    <img src={photo} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        photos: formData.photos.filter((_, i) => i !== idx)
                      })}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Upload className="w-6 h-6 text-slate-400" />
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600">
                {editItem ? "עדכן" : "צור פרויקט"}
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