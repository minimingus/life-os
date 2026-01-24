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
  ShoppingCart, 
  Plus, 
  Trash2, 
  Apple, 
  Carrot, 
  Milk, 
  Beef, 
  Croissant,
  Snowflake,
  Sparkles,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = {
  fruits: { label: "פירות", icon: Apple, color: "bg-red-100 text-red-600" },
  vegetables: { label: "ירקות", icon: Carrot, color: "bg-green-100 text-green-600" },
  dairy: { label: "מוצרי חלב", icon: Milk, color: "bg-blue-100 text-blue-600" },
  meat: { label: "בשר ודגים", icon: Beef, color: "bg-rose-100 text-rose-600" },
  bread: { label: "לחם ומאפים", icon: Croissant, color: "bg-amber-100 text-amber-600" },
  frozen: { label: "קפואים", icon: Snowflake, color: "bg-cyan-100 text-cyan-600" },
  cleaning: { label: "ניקיון", icon: Sparkles, color: "bg-purple-100 text-purple-600" },
  other: { label: "אחר", icon: Package, color: "bg-slate-100 text-slate-600" }
};

const UNITS = {
  units: "יחידות",
  kg: 'ק"ג',
  gram: "גרם",
  liter: "ליטר",
  pack: "חבילה"
};

export default function Shopping() {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    category: "other",
    quantity: 1,
    unit: "units",
    notes: "",
    priority: "medium"
  });

  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["shopping"],
    queryFn: () => base44.entities.ShoppingItem.list("-created_date")
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ShoppingItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping"] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShoppingItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping"] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ShoppingItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shopping"] })
  });

  const resetForm = () => {
    setShowDialog(false);
    setEditItem(null);
    setFormData({
      name: "",
      category: "other",
      quantity: 1,
      unit: "units",
      notes: "",
      priority: "medium"
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

  const togglePurchased = (item) => {
    updateMutation.mutate({ 
      id: item.id, 
      data: { ...item, is_purchased: !item.is_purchased } 
    });
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      name: item.name || "",
      category: item.category || "other",
      quantity: item.quantity || 1,
      unit: item.unit || "units",
      notes: item.notes || "",
      priority: item.priority || "medium"
    });
    setShowDialog(true);
  };

  const filteredItems = filterCategory === "all" 
    ? items 
    : items.filter(i => i.category === filterCategory);

  const pendingItems = filteredItems.filter(i => !i.is_purchased);
  const purchasedItems = filteredItems.filter(i => i.is_purchased);

  const clearPurchased = () => {
    purchasedItems.forEach(item => deleteMutation.mutate(item.id));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="רשימת קניות"
        subtitle={`${pendingItems.length} פריטים לקנות`}
        action={() => setShowDialog(true)}
        actionLabel="הוסף פריט"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterCategory("all")}
          className={filterCategory === "all" ? "bg-blue-500" : ""}
        >
          הכל
        </Button>
        {Object.entries(CATEGORIES).map(([key, { label }]) => (
          <Button
            key={key}
            variant={filterCategory === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory(key)}
            className={filterCategory === key ? "bg-blue-500" : ""}
          >
            {label}
          </Button>
        ))}
      </div>

      {items.length === 0 && !isLoading ? (
        <EmptyState
          icon={ShoppingCart}
          title="רשימת הקניות ריקה"
          description="הוסף פריטים לרשימת הקניות שלך"
          action={() => setShowDialog(true)}
          actionLabel="הוסף פריט"
        />
      ) : (
        <div className="space-y-6">
          {/* Pending Items */}
          {pendingItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">לקנות ({pendingItems.length})</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {pendingItems.map(item => {
                  const cat = CATEGORIES[item.category] || CATEGORIES.other;
                  const Icon = cat.icon;
                  return (
                    <div 
                      key={item.id}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => openEdit(item)}
                    >
                      <Checkbox
                        checked={item.is_purchased}
                        onCheckedChange={(e) => {
                          e.stopPropagation?.();
                          togglePurchased(item);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", cat.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800">{item.name}</p>
                        <p className="text-sm text-slate-500">
                          {item.quantity} {UNITS[item.unit] || item.unit}
                          {item.notes && ` • ${item.notes}`}
                        </p>
                      </div>
                      {item.priority === "high" && (
                        <Badge className="bg-rose-100 text-rose-600 border-0">דחוף</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(item.id);
                        }}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Purchased Items */}
          {purchasedItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden opacity-60">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-600">נרכשו ({purchasedItems.length})</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearPurchased}
                  className="text-slate-500 hover:text-rose-500"
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  נקה רשימה
                </Button>
              </div>
              <div className="divide-y divide-slate-100">
                {purchasedItems.map(item => {
                  const cat = CATEGORIES[item.category] || CATEGORIES.other;
                  const Icon = cat.icon;
                  return (
                    <div 
                      key={item.id}
                      className="flex items-center gap-4 p-4"
                    >
                      <Checkbox
                        checked={item.is_purchased}
                        onCheckedChange={() => togglePurchased(item)}
                      />
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center opacity-50", cat.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-500 line-through">{item.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editItem ? "עריכת פריט" : "הוספת פריט"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">שם הפריט</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="למשל: עגבניות"
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
                <label className="text-sm font-medium text-slate-700">כמות</label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">יחידה</label>
                <Select
                  value={formData.unit}
                  onValueChange={(v) => setFormData({ ...formData, unit: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(UNITS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">הערות</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="הערות נוספות..."
                className="mt-1"
              />
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