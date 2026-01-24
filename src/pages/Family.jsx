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
  Trash2,
  User,
  Baby,
  Upload,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInYears } from "date-fns";

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

export default function Family() {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "child",
    birth_date: "",
    color: "#3b82f6",
    avatar: ""
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

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FamilyMember.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["family"] })
  });

  const resetForm = () => {
    setShowDialog(false);
    setEditItem(null);
    setFormData({
      name: "",
      role: "child",
      birth_date: "",
      color: "#3b82f6",
      avatar: ""
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
      avatar: item.avatar || ""
    });
    setShowDialog(true);
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
                    onDelete={(id) => deleteMutation.mutate(id)}
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
                    onDelete={(id) => deleteMutation.mutate(id)}
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

function MemberCard({ member, onEdit, onDelete, getAge }) {
  const age = getAge(member.birth_date);
  
  return (
    <div 
      className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all cursor-pointer"
      onClick={() => onEdit(member)}
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
          {member.birth_date && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(parseISO(member.birth_date), "dd/MM/yyyy")}
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(member.id);
          }}
          className="text-slate-400 hover:text-rose-500 flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}