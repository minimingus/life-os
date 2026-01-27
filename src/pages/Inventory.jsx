import React, { useState } from "react";
import { Edit } from "lucide-react";
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
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays, isBefore } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import NotificationSettingsPanel from "@/components/NotificationSettingsPanel";

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

  let filteredItems = filterLocation === "all"
    ? items
    : items.filter(i => i.location === filterLocation);
  
  if (showStaplesOnly) {
    filteredItems = filteredItems.filter(i => i.is_staple);
  }

  if (showMissingOnly) {
    filteredItems = filteredItems.filter(i => 
      i.status === "out_of_stock" || 
      (i.status === "low" && (i.min_quantity || 0) > 1)
    );
  }

  // Apply active filter from badges
  if (activeFilter === "lowStaples") {
    filteredItems = filteredItems.filter(i => i.is_staple && (i.status === "low" || i.status === "out_of_stock"));
  } else if (activeFilter === "expired") {
    filteredItems = filteredItems.filter(i => i.status === "expired");
  } else if (activeFilter === "low") {
    filteredItems = filteredItems.filter(i => i.status === "low");
  }

  // Split items by availability
  const availableItems = filteredItems.filter(i => 
    i.status !== "out_of_stock" && 
    !(i.status === "low" && (i.min_quantity || 0) > 1)
  );
  const missingItems = filteredItems.filter(i => 
    i.status === "out_of_stock" || 
    (i.status === "low" && (i.min_quantity || 0) > 1)
  );
  const displayItems = activeTab === "available" ? availableItems : missingItems;

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="מלאי בבית"
        subtitle={`${items.length} פריטים במלאי`}
        action={() => setShowDialog(true)}
        actionLabel="הוסף פריט"
      >
        <Button
          variant="outline"
          onClick={() => setShowSettings(!showSettings)}
          className="border-slate-200 hover:bg-slate-50"
        >
          🔔 התראות
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowReceiptDialog(true)}
          className="border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <FileUp className="w-4 h-4 ml-2" />
          העלה חשבונית
        </Button>
      </PageHeader>

      {showSettings && (
        <div className="mb-6">
          <NotificationSettingsPanel />
        </div>
      )}

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
        <div className="flex flex-wrap gap-3">
          {lowStapleCount > 0 && (
            <Badge 
              className={cn(
                "bg-orange-500 cursor-pointer hover:bg-orange-600 transition-colors",
                activeFilter === "lowStaples" && "ring-2 ring-orange-300 ring-offset-2"
              )}
              onClick={() => setActiveFilter(activeFilter === "lowStaples" ? null : "lowStaples")}
            >
              <Star className="w-3 h-3 ml-1" />
              {lowStapleCount} פריטים בסיסיים נגמרים
            </Badge>
          )}
          {expiredCount > 0 && (
            <Badge 
              variant="destructive" 
              className={cn(
                "bg-rose-500 cursor-pointer hover:bg-rose-600 transition-colors",
                activeFilter === "expired" && "ring-2 ring-rose-300 ring-offset-2"
              )}
              onClick={() => setActiveFilter(activeFilter === "expired" ? null : "expired")}
            >
              <AlertTriangle className="w-3 h-3 ml-1" />
              {expiredCount} פריטים פגי תוקף
            </Badge>
          )}
          {lowCount > 0 && (
            <Badge 
              className={cn(
                "bg-amber-500 cursor-pointer hover:bg-amber-600 transition-colors",
                activeFilter === "low" && "ring-2 ring-amber-300 ring-offset-2"
              )}
              onClick={() => setActiveFilter(activeFilter === "low" ? null : "low")}
            >
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
        <div className="h-8 w-px bg-slate-200 mx-1" />
        <Button
          variant={showStaplesOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowStaplesOnly(!showStaplesOnly)}
          className={showStaplesOnly ? "bg-amber-500 hover:bg-amber-600" : ""}
        >
          <Star className="w-4 h-4 ml-1" />
          פריטים בסיסיים ({stapleCount})
        </Button>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">
              מלאי זמין ({availableItems.length})
            </TabsTrigger>
            <TabsTrigger value="missing">
              חוסרים ({missingItems.length})
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
              <div className="space-y-3">
                {Object.entries(CATEGORIES).map(([catKey, catData]) => {
                  const categoryItems = availableItems.filter(i => i.category === catKey);
                  if (categoryItems.length === 0) return null;
                  
                  return (
                    <div key={catKey} className="space-y-2">
                      <div className="flex items-center gap-2 px-2">
                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0", catData.color)}>
                          <Package className="w-3 h-3" />
                        </div>
                        <span className="font-semibold text-slate-700 text-sm">{catData.label}</span>
                        <Badge variant="outline" className="text-xs">{categoryItems.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {categoryItems.map(item => {
                          const loc = LOCATIONS[item.location] || LOCATIONS.fridge;
                          const LocationIcon = loc.icon;
                          const expiryInfo = getExpiryInfo(item.expiry_date);

                          return (
                            <div 
                              key={item.id}
                              className={cn(
                                "rounded-lg border p-3 transition-all",
                                item.status === "expired" ? "border-rose-300 bg-rose-50" :
                                item.status === "low" ? "border-amber-300 bg-amber-50" :
                                "bg-white border-slate-200"
                              )}
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-slate-900 text-sm mb-1">{item.name}</h4>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                      <LocationIcon className="w-3 h-3" />
                                      {loc.label}
                                    </span>
                                    {item.status === "expired" && (
                                      <Badge variant="destructive" className="text-xs h-5">פג תוקף</Badge>
                                    )}
                                    {item.status === "low" && (
                                      <Badge className="bg-amber-500 text-xs h-5">נמוך</Badge>
                                    )}
                                    {item.is_staple && (
                                      <Badge className="bg-amber-500 text-xs h-5">
                                        <Star className="w-3 h-3 ml-1 fill-white" />
                                        חובה
                                      </Badge>
                                    )}
                                    {expiryInfo && (
                                      <span className={cn("px-1.5 py-0.5 rounded text-xs", expiryInfo.color)}>
                                        {expiryInfo.text}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEdit(item)}
                                  className="text-slate-400 hover:text-slate-600 h-7 w-7"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                              </div>

                              {/* Quantity Controls - Compact */}
                              <div className="flex items-center gap-2 mb-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-9 w-9 rounded-lg"
                                  onClick={() => updateQuantity(item, -1)}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <div className="flex-1 text-center">
                                  <div className="text-xl font-bold text-slate-900">{item.quantity}</div>
                                  <div className="text-xs text-slate-500">{UNITS[item.unit]}</div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-9 w-9 rounded-lg border-green-300 text-green-600 hover:bg-green-50"
                                  onClick={() => updateQuantity(item, 1)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Action Buttons - Compact */}
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  onClick={() => markAsFinished(item)}
                                  size="sm"
                                  className="h-9 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 ml-1" />
                                  נגמר
                                </Button>
                                <Button
                                  onClick={() => addToShoppingList(item)}
                                  variant="outline"
                                  size="sm"
                                  className="h-9 border-blue-300 text-blue-600 hover:bg-blue-50 text-xs rounded-lg"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5 ml-1" />
                                  לרשימה
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
          <TabsContent value="missing" className="mt-6">
            {missingItems.length === 0 ? (
              <EmptyState
                icon={Package}
                title="אין חוסרים"
                description="כל הפריטים זמינים"
              />
            ) : (
              <div className="space-y-3">
                {Object.entries(CATEGORIES).map(([catKey, catData]) => {
                  const categoryItems = missingItems.filter(i => i.category === catKey);
                  if (categoryItems.length === 0) return null;
                  
                  return (
                    <div key={catKey} className="space-y-2">
                      <div className="flex items-center gap-2 px-2">
                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0", catData.color)}>
                          <Package className="w-3 h-3" />
                        </div>
                        <span className="font-semibold text-red-900 text-sm">{catData.label}</span>
                        <Badge className="bg-red-600 text-xs">{categoryItems.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {categoryItems.map(item => {
                          const loc = LOCATIONS[item.location] || LOCATIONS.fridge;
                          const LocationIcon = loc.icon;
                          const expiryInfo = getExpiryInfo(item.expiry_date);

                          return (
                            <div 
                              key={item.id}
                              className={cn(
                                "rounded-lg border p-3 transition-all",
                                item.status === "out_of_stock" ? "border-red-400 bg-red-50" :
                                item.status === "expired" ? "border-rose-300 bg-rose-50" :
                                "border-amber-300 bg-amber-50"
                              )}
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-slate-900 text-sm mb-1">{item.name}</h4>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                      <LocationIcon className="w-3 h-3" />
                                      {loc.label}
                                    </span>
                                    {item.status === "out_of_stock" && (
                                      <Badge className="bg-red-600 text-white text-xs h-5">נגמר</Badge>
                                    )}
                                    {item.status === "expired" && (
                                      <Badge variant="destructive" className="text-xs h-5">פג תוקף</Badge>
                                    )}
                                    {item.status === "low" && (
                                      <Badge className="bg-amber-500 text-xs h-5">נמוך</Badge>
                                    )}
                                    {item.is_staple && (
                                      <Badge className="bg-amber-500 text-xs h-5">
                                        <Star className="w-3 h-3 ml-1 fill-white" />
                                        חובה
                                      </Badge>
                                    )}
                                    {expiryInfo && (
                                      <span className={cn("px-1.5 py-0.5 rounded text-xs", expiryInfo.color)}>
                                        {expiryInfo.text}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEdit(item)}
                                  className="text-slate-400 hover:text-slate-600 h-7 w-7"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                              </div>

                              {/* Restock Button for Out of Stock */}
                              {item.status === "out_of_stock" ? (
                                <Button
                                  onClick={() => updateQuantity(item, 1)}
                                  className="w-full h-10 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg mb-2 text-sm"
                                >
                                  <CheckCircle2 className="w-4 h-4 ml-2" />
                                  חזר מלאי
                                </Button>
                              ) : (
                                <div className="flex items-center gap-2 mb-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 w-9 rounded-lg"
                                    onClick={() => updateQuantity(item, -1)}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <div className="flex-1 text-center">
                                    <div className="text-xl font-bold text-slate-900">{item.quantity}</div>
                                    <div className="text-xs text-slate-500">{UNITS[item.unit]}</div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 w-9 rounded-lg border-green-300 text-green-600 hover:bg-green-50"
                                    onClick={() => updateQuantity(item, 1)}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className={cn("grid gap-2", item.status === "out_of_stock" ? "grid-cols-1" : "grid-cols-2")}>
                                {item.status !== "out_of_stock" && (
                                  <Button
                                    onClick={() => markAsFinished(item)}
                                    size="sm"
                                    className="h-9 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg"
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5 ml-1" />
                                    נגמר
                                  </Button>
                                )}
                                <Button
                                  onClick={() => addToShoppingList(item)}
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "h-9 border-blue-300 text-blue-600 hover:bg-blue-50 text-xs rounded-lg",
                                    item.status === "out_of_stock" && "col-span-1"
                                  )}
                                >
                                  <ShoppingCart className="w-3.5 h-3.5 ml-1" />
                                  לרשימה
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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