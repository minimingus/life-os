import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, Grid3x3, List, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InventoryFilters({
  searchQuery,
  onSearchChange,
  filterLocation,
  onLocationChange,
  showStaplesOnly,
  onStaplesToggle,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  locations,
  stapleCount
}) {
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="חפש פריט..."
          className="pr-10 h-11"
        />
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {/* Location Filter */}
        <Select value={filterLocation} onValueChange={onLocationChange}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="מיקום" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            {Object.entries(locations).map(([key, { label, icon: Icon }]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Staples Filter */}
        <Button
          variant={showStaplesOnly ? "default" : "outline"}
          size="sm"
          onClick={onStaplesToggle}
          className={cn(
            "h-9",
            showStaplesOnly && "bg-amber-500 hover:bg-amber-600 border-amber-500"
          )}
        >
          <Star className="w-4 h-4 ml-1" />
          בסיסיים ({stapleCount})
        </Button>

        {/* Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="מיון" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">שם</SelectItem>
            <SelectItem value="quantity">כמות</SelectItem>
            <SelectItem value="expiry">תאריך תפוגה</SelectItem>
            <SelectItem value="status">סטטוס</SelectItem>
          </SelectContent>
        </Select>

        <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* View Mode */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className="h-7 w-7 p-0"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("list")}
            className="h-7 w-7 p-0"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}