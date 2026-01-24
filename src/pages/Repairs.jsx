import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
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
  Wrench, 
  Trash2, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
  Package,
  MapPin,
  Camera,
  Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

const STATUS_CONFIG = {
  pending: { label: "ממתין", icon: Clock, color: "bg-slate-100 text-slate-600" },
  in_progress: { label: "בטיפול", icon: Loader2, color: "bg-blue-100 text-blue-600" },
  waiting_parts: { label: "ממתין לחלקים", icon: Package, color: "bg-amber-100 text-amber-600" },
  completed: { label: "הושלם", icon: CheckCircle2, color: "bg-green-100 text-green-600" }
};

const PRIORITY_CONFIG = {
  low: { label: "נמוכה", color: "bg-slate-100 text-slate-600" },
  medium: { label: "בינונית", color: "bg-blue-100 text-blue-600" },
  high: { label: "גבוהה", color: "bg-orange-100 text-orange-600" },
  urgent: { label: "דחוף", color: "bg-rose-100 text-rose-600" }
};

export default function Repairs() {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    priority: "medium",
    status: "pending",
    estimated_cost: "",
    due_date: "",
    photos: []
  });

  const queryClient = useQueryClient();

  const { data: repairs = [], isLoading } = useQuery({
    queryKey: ["repairs"],
    queryFn: () => base44.entities.Repair.list("-created_date")
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Repair.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repairs"] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Repair.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repairs"] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Repair.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["repairs"] })
  });

  const resetForm = () => {
    setShowDialog(false);
    setEditItem(null);
    setFormData({
      title: "",
      description: "",
      location: "",
      priority: "medium",
      status: "pending",
      estimated_cost: "",
      due_date: "",
      photos: []
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
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
      location: item.location || "",
      priority: item.priority || "medium",
      status: item.status || "pending",
      estimated_cost: item.estimated_cost || "",
      actual_cost: item.actual_cost || "",
      due_date: item.due_date || "",
      photos: item.photos || []
    });
    setShowDialog(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, photos: [...formData.photos, file_url] });
    }
  };

  const filteredRepairs = filterStatus === "all"
    ? repairs
    : repairs.filter(r => r.status === filterStatus);

  const activeRepairs = repairs.filter(r => r.status !== "completed");
  const urgentCount = repairs.filter(r => r.priority === "urgent" && r.status !== "completed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="תיקונים"
        subtitle={`${activeRepairs.length} תיקונים פתוחים`}
        action={() => setShowDialog(true)}
        actionLabel="דווח על תקלה"
      />

      {/* Alert */}
      {urgentCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <span className="text-rose-700 font-medium">{urgentCount} תיקונים דחופים ממתינים לטיפול</span>
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
          הכל ({repairs.length})
        </Button>
        {Object.entries(STATUS_CONFIG).map(([key, { label, icon: Icon }]) => (
          <Button
            key={key}
            variant={filterStatus === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(key)}
            className={filterStatus === key ? "bg-blue-500" : ""}
          >
            <Icon className="w-4 h-4 ml-1" />
            {label} ({repairs.filter(r => r.status === key).length})
          </Button>
        ))}
      </div>

      {repairs.length === 0 && !isLoading ? (
        <EmptyState
          icon={Wrench}
          title="אין תיקונים"
          description="הכל עובד כמו שצריך! דווח על תקלה כשיש צורך"
          action={() => setShowDialog(true)}
          actionLabel="דווח על תקלה"
        />
      ) : (
        <div className="grid gap-4">
          {filteredRepairs.map(repair => {
            const statusConfig = STATUS_CONFIG[repair.status] || STATUS_CONFIG.pending;
            const priorityConfig = PRIORITY_CONFIG[repair.priority] || PRIORITY_CONFIG.medium;
            const StatusIcon = statusConfig.icon;
            
            return (
              <div 
                key={repair.id}
                className={cn(
                  "bg-white rounded-2xl border p-5 hover:shadow-lg transition-all cursor-pointer",
                  repair.priority === "urgent" && repair.status !== "completed" 
                    ? "border-rose-200 shadow-rose-100" 
                    : "border-slate-100"
                )}
                onClick={() => openEdit(repair)}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                    statusConfig.color
                  )}>
                    <StatusIcon className={cn("w-6 h-6", repair.status === "in_progress" && "animate-spin")} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-800">{repair.title}</h3>
                        {repair.location && (
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {repair.location}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Badge className={cn(priorityConfig.color, "border-0")}>
                          {priorityConfig.label}
                        </Badge>
                        <Badge className={cn(statusConfig.color, "border-0")}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                    
                    {repair.description && (
                      <p className="text-sm text-slate-600 mt-3 line-clamp-2">{repair.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
                      {repair.estimated_cost && (
                        <span>עלות משוערת: ₪{repair.estimated_cost}</span>
                      )}
                      {repair.due_date && repair.due_date.length >= 10 && (
                        <span>יעד: {format(parseISO(repair.due_date), "dd/MM/yyyy")}</span>
                      )}
                      {repair.photos && repair.photos.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          {repair.photos.length} תמונות
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(repair.id);
                    }}
                    className="text-slate-400 hover:text-rose-500 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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
            <DialogTitle>{editItem ? "עריכת תיקון" : "דיווח על תקלה"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">כותרת</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="למשל: דליפה בברז המטבח"
                className="mt-1"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">תיאור</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="תאר את התקלה בפירוט..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">מיקום בבית</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="למשל: מטבח, חדר שינה ראשי..."
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    {Object.entries(PRIORITY_CONFIG).map(([key, { label }]) => (
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
                    {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">עלות משוערת (₪)</label>
                <Input
                  type="number"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">תאריך יעד</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {editItem && (
              <div>
                <label className="text-sm font-medium text-slate-700">עלות בפועל (₪)</label>
                <Input
                  type="number"
                  value={formData.actual_cost || ""}
                  onChange={(e) => setFormData({ ...formData, actual_cost: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            )}

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
                {editItem ? "עדכן" : "דווח"}
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