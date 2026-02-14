import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Package,
  Plus,
  Minus,
  ShoppingCart,
  AlertTriangle,
  Star,
  Edit2,
  Trash2,
  Clock,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";

export default function InventoryCard({ 
  item, 
  categoryConfig, 
  locationConfig,
  onEdit, 
  onDelete, 
  onUpdateQuantity,
  onMarkFinished,
  onAddToShopping 
}) {
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [quickQuantity, setQuickQuantity] = useState(item.quantity || 0);

  const handleQuickUpdate = () => {
    onUpdateQuantity(item, quickQuantity - (item.quantity || 0));
    setShowQuickEdit(false);
  };

  const getExpiryInfo = () => {
    if (!item.expiry_date) return null;
    const days = differenceInDays(parseISO(item.expiry_date), new Date());
    
    if (days < 0) return { text: "פג תוקף", color: "text-red-600", bgColor: "bg-red-100", urgent: true };
    if (days === 0) return { text: "תופג היום", color: "text-orange-600", bgColor: "bg-orange-100", urgent: true };
    if (days <= 3) return { text: `${days} ימים`, color: "text-amber-600", bgColor: "bg-amber-100", urgent: true };
    if (days <= 7) return { text: `${days} ימים`, color: "text-yellow-600", bgColor: "bg-yellow-50", urgent: false };
    return { text: format(parseISO(item.expiry_date), "dd/MM", { locale: he }), color: "text-slate-500", bgColor: "bg-slate-50", urgent: false };
  };

  const expiryInfo = getExpiryInfo();
  const CategoryIcon = categoryConfig.icon;
  const LocationIcon = locationConfig.icon;
  const isLowStock = item.min_quantity && item.quantity <= item.min_quantity;
  const isOutOfStock = item.quantity === 0;
  const stockPercentage = item.min_quantity > 0 ? (item.quantity / item.min_quantity) * 100 : 100;

  return (
    <>
      <div 
        className={cn(
          "group relative bg-white dark:bg-slate-800 rounded-xl border-2 transition-all duration-300 hover:shadow-xl",
          isOutOfStock ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10" :
          isLowStock ? "border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10" :
          expiryInfo?.urgent ? "border-amber-300 dark:border-amber-800" :
          "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
        )}
      >
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start gap-3 mb-3">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm", categoryConfig.color)}>
              <CategoryIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight mb-1">
                {item.name}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                  <LocationIcon className="w-3 h-3" />
                  <span>{locationConfig.label}</span>
                </div>
                {item.is_staple && (
                  <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0 text-[10px] h-4 px-1.5">
                    <Star className="w-2.5 h-2.5 ml-0.5 fill-current" />
                    בסיסי
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 flex-shrink-0"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Quantity Display */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {item.quantity || 0}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {item.unit === "units" ? "יחידות" :
                   item.unit === "kg" ? 'ק"ג' :
                   item.unit === "gram" ? "גרם" :
                   item.unit === "liter" ? "ליטר" : "חבילה"}
                </span>
              </div>
              {item.min_quantity > 0 && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  מינימום: {item.min_quantity}
                </span>
              )}
            </div>
            
            {/* Progress Bar */}
            {item.min_quantity > 0 && (
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    stockPercentage > 100 ? "bg-blue-500" :
                    stockPercentage > 50 ? "bg-green-500" :
                    stockPercentage > 20 ? "bg-orange-500" : "bg-red-500"
                  )}
                  style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {isOutOfStock && (
              <Badge className="bg-red-600 dark:bg-red-700 text-white border-0 text-[11px] shadow-sm">
                <AlertTriangle className="w-3 h-3 ml-1" />
                נגמר במלאי
              </Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge className="bg-orange-500 dark:bg-orange-600 text-white border-0 text-[11px] shadow-sm">
                <AlertTriangle className="w-3 h-3 ml-1" />
                מלאי נמוך
              </Badge>
            )}
            {expiryInfo && (
              <Badge className={cn("border-0 text-[11px] shadow-sm flex items-center gap-1", expiryInfo.bgColor)}>
                <Clock className="w-3 h-3" />
                <span className={expiryInfo.color}>{expiryInfo.text}</span>
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateQuantity(item, -1)}
                disabled={item.quantity <= 0}
                className="flex-1 h-10 border-2"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuickEdit(true)}
                className="flex-1 h-10 border-2 font-bold"
              >
                {item.quantity || 0}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateQuantity(item, 1)}
                className="flex-1 h-10 border-2 border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddToShopping(item)}
              className="h-10 border-2 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <ShoppingCart className="w-4 h-4 ml-1" />
              לרשימה
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkFinished(item)}
              className="flex-1 h-8 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              נגמר לגמרי
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Edit Dialog */}
      <Dialog open={showQuickEdit} onOpenChange={setShowQuickEdit}>
        <DialogContent className="sm:max-w-xs" dir="rtl">
          <DialogHeader>
            <DialogTitle>עדכון כמות - {item.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                כמות חדשה
              </label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={quickQuantity}
                onChange={(e) => setQuickQuantity(parseFloat(e.target.value) || 0)}
                className="text-xl font-bold text-center"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 5, 10].map(val => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickQuantity(quickQuantity + val)}
                >
                  +{val}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleQuickUpdate} className="flex-1 bg-green-600 hover:bg-green-700">
                עדכן
              </Button>
              <Button variant="outline" onClick={() => setShowQuickEdit(false)}>
                ביטול
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}