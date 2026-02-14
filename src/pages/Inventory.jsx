import React, { useState, useMemo } from "react";
import { Edit } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import InventoryAnalytics from "@/components/InventoryAnalytics";
import InventoryCard from "@/components/inventory/InventoryCard";
import InventoryFilters from "@/components/inventory/InventoryFilters";
import QuickAddInventory from "@/components/inventory/QuickAddInventory";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  ShoppingCart,
  X,
  Star,
  FileUp,
  Loader2,
  Tag,
  Sparkles,
  Clock,
  Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays, isBefore } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import NotificationSettingsPanel from "@/components/NotificationSettingsPanel";

const CATEGORIES = {
  fruits: { label: "פירות", color: "bg-red-100 text-red-600", icon: Package },
  vegetables: { label: "ירקות", color: "bg-green-100 text-green-600", icon: Package },
  dairy: { label: "מוצרי חלב", color: "bg-blue-100 text-blue-600", icon: Package },
  meat: { label: "בשר ודגים", color: "bg-rose-100 text-rose-600", icon: Package },
  bread: { label: "לחם ומאפים", color: "bg-amber-100 text-amber-600", icon: Package },
  frozen: { label: "קפואים", color: "bg-cyan-100 text-cyan-600", icon: Snowflake },
  pantry: { label: "מזווה", color: "bg-orange-100 text-orange-600", icon: Archive },
  cleaning: { label: "ניקיון", color: "bg-purple-100 text-purple-600", icon: Sparkles },
  other: { label: "אחר", color: "bg-slate-100 text-slate-600", icon: Package }
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
  const [showStaplesOnly, setShowStaplesOnly] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("available");
  const [expandedItems, setExpandedItems] = useState({});
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptResult, setReceiptResult] = useState(null);
  const [dismissedOutOfStockAlert, setDismissedOutOfStockAlert] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid");
  const [formData, setFormData] = useState({
    name: "",
    category: "other",
    quantity: 1,
    unit: "units",
    expiry_date: "",
    location: "fridge",
    min_quantity: 0,
    status: "ok",
    is_staple: false,
    tags: []
  });
  const [newTag, setNewTag] = useState("");

  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.InventoryItem.list()
  });

  const { data: notificationSettings } = useQuery({
    queryKey: ["notificationSettings"],
    queryFn: async () => {
      try {
        const items = await base44.entities.NotificationSettings.list();
        return items[0] || null;
      } catch {
        return null;
      }
    }
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
      status: "ok",
      is_staple: false,
      tags: []
    });
    setNewTag("");
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

  const addOrUpdateShoppingItem = async (item) => {
    // בדוק אם הפריט קיים כבר ברשימת קניות
    const existingItems = await base44.entities.ShoppingItem.list();
    const existingItem = existingItems.find(si => 
      si.name.toLowerCase() === item.name.toLowerCase() && !si.is_purchased
    );

    if (existingItem) {
      // עדכן את הכמות של הפריט הקיים
      await base44.entities.ShoppingItem.update(existingItem.id, {
        ...existingItem,
        quantity: (existingItem.quantity || 1) + (item.quantity || 1)
      });
    } else {
      // יצור פריט חדש
      await base44.entities.ShoppingItem.create({
        name: item.name,
        category: item.category,
        quantity: item.quantity || 1,
        unit: item.unit,
        priority: item.is_staple ? 'high' : 'medium',
        notes: 'נוסף אוטומטית - נגמר במלאי'
      });
    }
    queryClient.invalidateQueries({ queryKey: ["shopping"] });
  };

  const updateQuantity = async (item, delta) => {
    const newQuantity = Math.max(0, (item.quantity || 0) + delta);
    let status = getItemStatus({ ...item, quantity: newQuantity });
    
    // נגמר לחלוטין
    if (newQuantity === 0) {
      status = "out_of_stock";
      await addOrUpdateShoppingItem(item);
    }
    
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

  const markAsFinished = async (item) => {
    // Set quantity to 0 and mark as out of stock
    updateMutation.mutate({ 
      id: item.id, 
      data: { ...item, quantity: 0, status: "out_of_stock" } 
    });
    
    // Add or update in shopping list
    await addOrUpdateShoppingItem(item);
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingReceipt(true);
    setReceiptResult(null);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract data using AI
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "number" },
                  unit: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result.status === "success" && result.output?.items) {
        setReceiptResult(result.output);
        
        // Update inventory
        for (const item of result.output.items) {
          // Try to find existing item by name
          const existingItem = items.find(i => 
            i.name.toLowerCase().includes(item.name.toLowerCase()) ||
            item.name.toLowerCase().includes(i.name.toLowerCase())
          );

          if (existingItem) {
            // Update existing item quantity
            const newQuantity = (existingItem.quantity || 0) + (item.quantity || 1);
            const status = getItemStatus({ ...existingItem, quantity: newQuantity });
            await base44.entities.InventoryItem.update(existingItem.id, {
              ...existingItem,
              quantity: newQuantity,
              status
            });
          } else {
            // Create new item with smart defaults
            const category = guessCategory(item.name);
            const location = guessLocation(category);
            await base44.entities.InventoryItem.create({
              name: item.name,
              quantity: item.quantity || 1,
              unit: item.unit || "units",
              category,
              location,
              status: "ok"
            });
          }
        }

        queryClient.invalidateQueries({ queryKey: ["inventory"] });
      } else {
        alert("לא הצלחנו לחלץ נתונים מהחשבונית. נסה שוב.");
      }
    } catch (error) {
      console.error("Error processing receipt:", error);
      alert("שגיאה בעיבוד החשבונית");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const guessCategory = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("עגבני") || lowerName.includes("מלפפון") || lowerName.includes("חסה")) return "vegetables";
    if (lowerName.includes("תפוח") || lowerName.includes("בננה") || lowerName.includes("תפוז")) return "fruits";
    if (lowerName.includes("חלב") || lowerName.includes("גבינה") || lowerName.includes("יוגורט") || lowerName.includes("ביצ")) return "dairy";
    if (lowerName.includes("בשר") || lowerName.includes("עוף") || lowerName.includes("דג")) return "meat";
    if (lowerName.includes("לחם") || lowerName.includes("לחמני") || lowerName.includes("פיתה")) return "bread";
    if (lowerName.includes("קפוא") || lowerName.includes("גלידה")) return "frozen";
    if (lowerName.includes("אורז") || lowerName.includes("פסטה") || lowerName.includes("קמח") || lowerName.includes("שמן")) return "pantry";
    if (lowerName.includes("נקי") || lowerName.includes("סבון") || lowerName.includes("אקונומיקה")) return "cleaning";
    return "other";
  };

  const guessLocation = (category) => {
    if (["fruits", "vegetables", "dairy", "meat"].includes(category)) return "fridge";
    if (category === "frozen") return "freezer";
    if (["pantry", "cleaning", "other"].includes(category)) return "pantry";
    if (category === "bread") return "cabinet";
    return "pantry";
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
      status: item.status || "ok",
      is_staple: item.is_staple || false,
      tags: item.tags || []
    });
    setShowDialog(true);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) });
  };

  // Filter and search logic
  const { availableItems, missingItems, displayItems } = useMemo(() => {
    let filtered = items;

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(i => 
        i.name.toLowerCase().includes(query) ||
        i.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Location filter
    if (filterLocation !== "all") {
      filtered = filtered.filter(i => i.location === filterLocation);
    }

    // Staples filter
    if (showStaplesOnly) {
      filtered = filtered.filter(i => i.is_staple);
    }

    // Badge filters
    if (activeFilter === "lowStaples") {
      filtered = filtered.filter(i => i.is_staple && (i.status === "low" || i.status === "out_of_stock"));
    } else if (activeFilter === "expired") {
      filtered = filtered.filter(i => i.status === "expired");
    } else if (activeFilter === "low") {
      filtered = filtered.filter(i => i.status === "low");
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name, 'he');
        case "quantity":
          return (b.quantity || 0) - (a.quantity || 0);
        case "expiry":
          if (!a.expiry_date && !b.expiry_date) return 0;
          if (!a.expiry_date) return 1;
          if (!b.expiry_date) return -1;
          return new Date(a.expiry_date) - new Date(b.expiry_date);
        case "status":
          const statusOrder = { out_of_stock: 0, expired: 1, low: 2, ok: 3 };
          return (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
        default:
          return 0;
      }
    });

    const available = filtered.filter(i => 
      i.status !== "out_of_stock" && 
      !(i.status === "low" && (i.min_quantity || 0) > 1)
    );
    const missing = filtered.filter(i => 
      i.status === "out_of_stock" || 
      (i.status === "low" && (i.min_quantity || 0) > 1)
    );

    return {
      availableItems: available,
      missingItems: missing,
      displayItems: activeTab === "available" ? available : activeTab === "missing" ? missing : filtered
    };
  }, [items, searchQuery, filterLocation, showStaplesOnly, activeFilter, sortBy, activeTab]);

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
  const outOfStockCount = items.filter(i => i.status === "out_of_stock").length;
  const missingCount = items.filter(i => 
    i.status === "out_of_stock" || 
    (i.status === "low" && (i.min_quantity || 0) > 1)
  ).length;
  const stapleCount = items.filter(i => i.is_staple).length;
  const lowStapleCount = items.filter(i => i.is_staple && (i.status === "low" || i.status === "out_of_stock")).length;

  const isExpiringSoon = (item) => {
    if (!item.expiry_date) return false;
    const days = differenceInDays(parseISO(item.expiry_date), new Date());
    const threshold = notificationSettings?.expiry_alert_days || 3;
    return days >= 0 && days <= threshold;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="מלאי בבית"
        subtitle={`${items.length} פריטים • ${availableItems.length} זמינים • ${missingItems.length} חוסרים`}
        action={{
          label: "פריט חדש",
          icon: Plus,
          onClick: () => setShowDialog(true)
        }}
      >
        <Button
          variant="outline"
          onClick={() => setShowReceiptDialog(true)}
          className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <FileUp className="w-4 h-4 ml-2" />
          העלה חשבונית
        </Button>
      </PageHeader>

      {/* Out of Stock Alert - CRITICAL */}
      {outOfStockCount > 0 && !dismissedOutOfStockAlert && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-2xl shadow-2xl shadow-red-500/30 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">🚨 פריטים נגמרו במלאי!</h3>
              <p className="text-red-100 mb-3">{outOfStockCount} פריטים נגמרו לחלוטין ונוספו אוטומטית לרשימת הקניות</p>
              <div className="flex flex-wrap gap-2">
                {items.filter(i => i.status === "out_of_stock").map(item => (
                  <Badge key={item.id} className="bg-white/20 text-white border-white/30">
                    {item.name}
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDismissedOutOfStockAlert(true)}
              className="text-white hover:bg-white/20 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Alert Badges */}
      {(expiredCount > 0 || lowCount > 0 || lowStapleCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {lowStapleCount > 0 && (
            <button
              onClick={() => setActiveFilter(activeFilter === "lowStaples" ? null : "lowStaples")}
              className={cn(
                "px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2 min-h-[44px]",
                "bg-orange-500 hover:bg-orange-600 text-white",
                activeFilter === "lowStaples" && "ring-2 ring-orange-300 dark:ring-orange-700 ring-offset-2 scale-105"
              )}
            >
              <Star className="w-4 h-4 fill-current" />
              {lowStapleCount} בסיסיים נגמרים
            </button>
          )}
          {expiredCount > 0 && (
            <button
              onClick={() => setActiveFilter(activeFilter === "expired" ? null : "expired")}
              className={cn(
                "px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2 min-h-[44px]",
                "bg-red-500 hover:bg-red-600 text-white",
                activeFilter === "expired" && "ring-2 ring-red-300 dark:ring-red-700 ring-offset-2 scale-105"
              )}
            >
              <AlertTriangle className="w-4 h-4" />
              {expiredCount} פגי תוקף
            </button>
          )}
          {lowCount > 0 && (
            <button
              onClick={() => setActiveFilter(activeFilter === "low" ? null : "low")}
              className={cn(
                "px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2 min-h-[44px]",
                "bg-amber-500 hover:bg-amber-600 text-white",
                activeFilter === "low" && "ring-2 ring-amber-300 dark:ring-amber-700 ring-offset-2 scale-105"
              )}
            >
              <AlertTriangle className="w-4 h-4" />
              {lowCount} מלאי נמוך
            </button>
          )}
        </div>
      )}

      {/* Quick Add */}
      <QuickAddInventory onAdd={(data) => createMutation.mutate(data)} />

      {/* Filters */}
      <InventoryFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterLocation={filterLocation}
        onLocationChange={setFilterLocation}
        showStaplesOnly={showStaplesOnly}
        onStaplesToggle={() => setShowStaplesOnly(!showStaplesOnly)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        locations={LOCATIONS}
        stapleCount={stapleCount}
      />

      {items.length === 0 && !isLoading ? (
        <EmptyState
          icon={Package}
          title="המלאי ריק"
          description="הוסף פריטים למעקב המלאי שלך"
          action={() => setShowDialog(true)}
          actionLabel="הוסף פריט"
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">
              מלאי זמין ({availableItems.length})
            </TabsTrigger>
            <TabsTrigger value="missing">
              חוסרים ({missingItems.length})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              ניתוח וחיזוי
            </TabsTrigger>
          </TabsList>
          <TabsContent value="available" className="mt-6">
            {availableItems.length === 0 ? (
              <EmptyState
                icon={Package}
                title="אין פריטים זמינים"
                description="כל הפריטים נגמרו או במלאי נמוך"
              />
            ) : (
              <div className={cn(
                viewMode === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-3"
              )}>
                {availableItems.map(item => {
                  const cat = CATEGORIES[item.category] || CATEGORIES.other;
                  const loc = LOCATIONS[item.location] || LOCATIONS.fridge;
                  
                  return (
                    <InventoryCard
                      key={item.id}
                      item={item}
                      categoryConfig={cat}
                      locationConfig={loc}
                      onEdit={openEdit}
                      onDelete={(item) => deleteMutation.mutate(item.id)}
                      onUpdateQuantity={updateQuantity}
                      onMarkFinished={markAsFinished}
                      onAddToShopping={addToShoppingList}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">
              זמין ({availableItems.length})
            </TabsTrigger>
            <TabsTrigger value="missing">
              חוסרים ({missingItems.length})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              ניתוח
            </TabsTrigger>
          </TabsList>
          <TabsContent value="available" className="mt-6">
            {availableItems.length === 0 ? (
              <EmptyState
                icon={Package}
                title="אין פריטים זמינים"
                description="כל הפריטים נגמרו או במלאי נמוך"
              />
            ) : (
              <div className={cn(
                viewMode === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-3"
              )}>
                {availableItems.map(item => {
                  const cat = CATEGORIES[item.category] || CATEGORIES.other;
                  const loc = LOCATIONS[item.location] || LOCATIONS.fridge;
                  
                  return (
                    <InventoryCard
                      key={item.id}
                      item={item}
                      categoryConfig={cat}
                      locationConfig={loc}
                      onEdit={openEdit}
                      onDelete={(item) => deleteMutation.mutate(item.id)}
                      onUpdateQuantity={updateQuantity}
                      onMarkFinished={markAsFinished}
                      onAddToShopping={addToShoppingList}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-6">
            <InventoryAnalytics />
          </TabsContent>
        </Tabs>
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

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_staple"
                  checked={formData.is_staple}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_staple: checked })}
                />
                <label htmlFor="is_staple" className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500" />
                  פריט בסיסי (חייב להיות תמיד במלאי)
                </label>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">תגיות</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="לדוגמא: הכרחי לסופ'ש"
                    className="flex-1"
                  />
                  <Button type="button" onClick={addTag} variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Tag className="w-3 h-3 ml-1" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="mr-1 hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
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

      {/* Receipt Upload Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>העלאת חשבונית קנייה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-slate-600">
              <p className="mb-2">העלה תמונה של חשבונית הקניות, והמערכת תעדכן את המלאי באופן אוטומטי.</p>
              <ul className="list-disc list-inside space-y-1 text-slate-500">
                <li>תמונה ברורה של החשבונית</li>
                <li>המערכת תזהה פריטים קיימים ותוסיף חדשים</li>
                <li>הכמויות יתעדכנו אוטומטית</li>
              </ul>
            </div>

            {uploadingReceipt ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-600">מעבד את החשבונית...</p>
                <p className="text-sm text-slate-400 mt-1">זה יכול לקחת כמה שניות</p>
              </div>
            ) : receiptResult ? (
              <div className="space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    המלאי עודכן בהצלחה!
                  </div>
                  <p className="text-sm text-green-600">
                    {receiptResult.items?.length || 0} פריטים עודכנו במלאי
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">פריטים שזוהו:</p>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {receiptResult.items?.map((item, idx) => (
                      <div key={idx} className="text-sm p-2 bg-slate-50 rounded">
                        {item.name} - {item.quantity} {item.unit || "יחידות"}
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  onClick={() => {
                    setShowReceiptDialog(false);
                    setReceiptResult(null);
                  }}
                >
                  סגור
                </Button>
              </div>
            ) : (
              <div>
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleReceiptUpload}
                  />
                  <div className="flex flex-col items-center">
                    <FileUp className="w-12 h-12 text-slate-400 mb-3" />
                    <p className="text-sm font-medium text-slate-700">העלה תמונת חשבונית</p>
                    <p className="text-xs text-slate-500 mt-1">JPG, PNG או PDF</p>
                  </div>
                </label>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}