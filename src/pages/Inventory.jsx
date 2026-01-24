import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
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
  Package, 
  Trash2, 
  AlertTriangle,
  RefrigeratorIcon,
  Snowflake,
  Archive,
  DoorOpen,
  Plus,
  Minus,
  ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays, isBefore } from "date-fns";

const CATEGORIES = {
  fruits: { label: "פירות", color: "bg-red-100 text-red-600" },
  vegetables: { label: "ירקות", color: "bg-green-100 text-green-600" },
  dairy: { label: "מוצרי חלב", color: "bg-blue-100 text-blue-600" },
  meat: { label: "בשר ודגים", color: "bg-rose-100 text-rose-600" },
  bread: { label: "לחם ומאפים", color: "bg-amber-100 text-amber-600" },
  frozen: { label: "קפואים", color: "bg-cyan-100 text-cyan-600" },
  pantry: { label: "מזווה", color: "bg-orange-100 text-orange-600" },
  cleaning: { label: "ניקיון", color: "bg-purple-100 text-purple-600" },
  other: { label: "אחר", color: "bg-slate-100 text-slate-600" }
};

const LOCATIONS = {
  fridge: { label: "מקרר", icon: RefrigeratorIcon },
  freezer: { label: "מקפיא", icon: Snowflake },
  pantry: { label: "מזווה", icon: Archive },
  cabinet: { label: "ארון", icon: DoorOpen }
};

const UNITS = {
  units: "יחידות",
  kg: 'ק"ג',
  gram: "גרם",
  liter: "ליטר",
  pack: "חבילה"
};

export default function Inventory() {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterLocation, setFilterLocation] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    category: "other",
    quantity: 1,
    unit: "units",
    expiry_date: "",
    location: "fridge",
    min_quantity: 0,
    status: "ok"
  });

  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.InventoryItem.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InventoryItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InventoryItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InventoryItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] })
  });

  const createShoppingMutation = useMutation({
    mutationFn: (data) => base44.entities.ShoppingItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping"] });
    }
  });

  const resetForm = () => {
    setShowDialog(false);
    setEditItem(null);
    setFormData({
      name: "",
      category: "other",
      quantity: 1,
      unit: "units",
      expiry_date: "",
      location: "fridge",
      min_quantity: 0,
      status: "ok"
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const status = getItemStatus(formData);
    const data = { ...formData, status };
    
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getItemStatus = (item) => {
    if (item.expiry_date && isBefore(parseISO(item.expiry_date), new Date())) {
      return "expired";
    }
    if (item.min_quantity && item.quantity <= item.min_quantity) {
      return "low";
    }
    return "ok";
  };

  const updateQuantity = (item, delta) => {
    const newQuantity = Math.max(0, (item.quantity || 0) + delta);
    const status = getItemStatus({ ...item, quantity: newQuantity });
    updateMutation.mutate({ 
      id: item.id, 
      data: { ...item, quantity: newQuantity, status } 
    });
  };

  const addToShoppingList = (item) => {
    createShoppingMutation.mutate({
      name: item.name,
      category: item.category,
      quantity: 1,
      unit: item.unit
    });
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      name: item.name || "",
      category: item.category || "other",
      quantity: item.quantity || 1,
      unit: item.unit || "units",
      expiry_date: item.expiry_date || "",
      location: item.location || "fridge",
      min_quantity: item.min_quantity || 0,
      status: item.status || "ok"
    });
    setShowDialog(true);
  };

  const filteredItems = filterLocation === "all"
    ? items
    : items.filter(i => i.location === filterLocation);

  const getExpiryInfo = (date) => {
    if (!date) return null;
    const expiry = parseISO(date);
    const days = differenceInDays(expiry, new Date());
    
    if (days < 0) return { text: "פג תוקף", color: "text-rose-500 bg-rose-50" };
    if (days === 0) return { text: "היום", color: "text-orange-500 bg-orange-50" };
    if (days <= 3) return { text: `${days} ימים`, color: "text-amber-500 bg-amber-50" };
    return { text: format(expiry, "dd/MM"), color: "text-slate-500 bg-slate-50" };
  };

  const expiredCount = items.filter(i => i.status === "expired").length;
  const lowCount = items.filter(i => i.status === "low").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="מלאי בבית"
        subtitle={`${items.length} פריטים במלאי`}
        action={() => setShowDialog(true)}
        actionLabel="הוסף פריט"
      />

      {/* Alert Badges */}
      {(expiredCount > 0 || lowCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {expiredCount > 0 && (
            <Badge variant="destructive" className="bg-rose-500">
              <AlertTriangle className="w-3 h-3 ml-1" />
              {expiredCount} פריטים פגי תוקף
            </Badge>
          )}
          {lowCount > 0 && (
            <Badge className="bg-amber-500">
              <AlertTriangle className="w-3 h-3 ml-1" />
              {lowCount} פריטים במלאי נמוך
            </Badge>
          )}
        </div>
      )}

      {/* Location Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterLocation === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterLocation("all")}
          className={filterLocation === "all" ? "bg-blue-500" : ""}
        >
          הכל
        </Button>
        {Object.entries(LOCATIONS).map(([key, { label, icon: Icon }]) => (
          <Button
            key={key}
            variant={filterLocation === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterLocation(key)}
            className={filterLocation === key ? "bg-blue-500" : ""}
          >
            <Icon className="w-4 h-4 ml-1" />
            {label}
          </Button>
        ))}
      </div>

      {items.length === 0 && !isLoading ? (
        <EmptyState
          icon={Package}
          title="המלאי ריק"
          description="הוסף פריטים למעקב המלאי שלך"
          action={() => setShowDialog(true)}
          actionLabel="הוסף פריט"
        />
      ) : (
        <div className="grid gap-4">
          {filteredItems.map(item => {
            const cat = CATEGORIES[item.category] || CATEGORIES.other;
            const loc = LOCATIONS[item.location] || LOCATIONS.fridge;
            const LocationIcon = loc.icon;
            const expiryInfo = getExpiryInfo(item.expiry_date);
            
            return (
              <div 
                key={item.id}
                className={cn(
                  "bg-white rounded-2xl border p-4 hover:shadow-md transition-all cursor-pointer",
                  item.status === "expired" ? "border-rose-200 bg-rose-50/50" :
                  item.status === "low" ? "border-amber-200 bg-amber-50/50" :
                  "border-slate-100"
                )}
                onClick={() => openEdit(item)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", cat.color)}>
                    <Package className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      {item.status === "expired" && (
                        <Badge variant="destructive" className="text-xs">פג תוקף</Badge>
                      )}
                      {item.status === "low" && (
                        <Badge className="bg-amber-500 text-xs">מלאי נמוך</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <LocationIcon className="w-3 h-3" />
                        {loc.label}
                      </span>
                      {expiryInfo && (
                        <span className={cn("px-2 py-0.5 rounded-full text-xs", expiryInfo.color)}>
                          תפוגה: {expiryInfo.text}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item, -1)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-16 text-center font-semibold">
                      {item.quantity} {UNITS[item.unit]}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item, 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => addToShoppingList(item)}
                      className="text-slate-400 hover:text-blue-500"
                      title="הוסף לרשימת קניות"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editItem ? "עריכת פריט" : "הוספת פריט למלאי"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">שם הפריט</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="למשל: חלב"
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
                <label className="text-sm font-medium text-slate-700">מיקום</label>
                <Select
                  value={formData.location}
                  onValueChange={(v) => setFormData({ ...formData, location: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOCATIONS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">כמות</label>
                <Input
                  type="number"
                  min="0"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">תאריך תפוגה</label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">כמות מינימלית להתראה</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({ ...formData, min_quantity: parseFloat(e.target.value) })}
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
    </div>
  );
}