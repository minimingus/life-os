import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search as SearchIcon,
  Star,
  Filter,
  X,
  Calendar,
  User,
  Tag as TagIcon,
  Save,
  ShoppingCart,
  Package,
  Wrench,
  Receipt,
  ListTodo,
  GraduationCap,
  Heart,
  FolderKanban
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const modules = [
  { id: "tasks", label: "משימות", icon: ListTodo, entity: "Task" },
  { id: "shopping", label: "קניות", icon: ShoppingCart, entity: "ShoppingItem" },
  { id: "inventory", label: "מלאי", icon: Package, entity: "InventoryItem" },
  { id: "repairs", label: "תיקונים", icon: Wrench, entity: "Repair" },
  { id: "bills", label: "חשבונות", icon: Receipt, entity: "Bill" },
  { id: "projects", label: "פרויקטים", icon: FolderKanban, entity: "Project" },
  { id: "grades", label: "ציונים", icon: GraduationCap, entity: "Grade" },
  { id: "homework", label: "שיעורי בית", icon: GraduationCap, entity: "Homework" },
  { id: "appointments", label: "תורים", icon: Heart, entity: "MedicalAppointment" }
];

const tagColors = {
  red: "bg-red-100 text-red-700 dark:bg-red-900/30",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30",
  green: "bg-green-100 text-green-700 dark:bg-green-900/30",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-900/30",
  gray: "bg-slate-100 text-slate-700 dark:bg-slate-800"
};

export default function Search() {
  const [query, setQuery] = useState("");
  const [selectedModules, setSelectedModules] = useState(modules.map(m => m.id));
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const queryClient = useQueryClient();

  const { data: savedSearches = [] } = useQuery({
    queryKey: ["savedSearches"],
    queryFn: () => base44.entities.SavedSearch.list()
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: () => base44.entities.Tag.list()
  });

  // Load data from all modules
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list(),
    enabled: selectedModules.includes("tasks")
  });

  const { data: shopping = [] } = useQuery({
    queryKey: ["shopping"],
    queryFn: () => base44.entities.ShoppingItem.list(),
    enabled: selectedModules.includes("shopping")
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.InventoryItem.list(),
    enabled: selectedModules.includes("inventory")
  });

  const { data: repairs = [] } = useQuery({
    queryKey: ["repairs"],
    queryFn: () => base44.entities.Repair.list(),
    enabled: selectedModules.includes("repairs")
  });

  const { data: bills = [] } = useQuery({
    queryKey: ["bills"],
    queryFn: () => base44.entities.Bill.list(),
    enabled: selectedModules.includes("bills")
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
    enabled: selectedModules.includes("projects")
  });

  const saveSearchMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedSearch.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedSearches"] });
      setShowSaveDialog(false);
      setSaveName("");
      toast.success("החיפוש נשמר בהצלחה");
    }
  });

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const results = [];
    const searchLower = query.toLowerCase();

    if (selectedModules.includes("tasks")) {
      tasks.forEach(item => {
        if (
          item.title?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
        ) {
          results.push({
            id: item.id,
            type: "tasks",
            title: item.title,
            subtitle: item.description,
            date: item.due_date,
            status: item.status,
            icon: ListTodo,
            data: item
          });
        }
      });
    }

    if (selectedModules.includes("shopping")) {
      shopping.forEach(item => {
        if (item.name?.toLowerCase().includes(searchLower)) {
          results.push({
            id: item.id,
            type: "shopping",
            title: item.name,
            subtitle: `${item.quantity || ""} ${item.unit || ""}`,
            icon: ShoppingCart,
            data: item
          });
        }
      });
    }

    if (selectedModules.includes("inventory")) {
      inventory.forEach(item => {
        if (item.name?.toLowerCase().includes(searchLower)) {
          results.push({
            id: item.id,
            type: "inventory",
            title: item.name,
            subtitle: `${item.quantity || 0} ${item.unit || ""}`,
            date: item.expiry_date,
            icon: Package,
            data: item
          });
        }
      });
    }

    if (selectedModules.includes("repairs")) {
      repairs.forEach(item => {
        if (
          item.title?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
        ) {
          results.push({
            id: item.id,
            type: "repairs",
            title: item.title,
            subtitle: item.location,
            status: item.status,
            icon: Wrench,
            data: item
          });
        }
      });
    }

    if (selectedModules.includes("bills")) {
      bills.forEach(item => {
        if (item.type?.toLowerCase().includes(searchLower)) {
          results.push({
            id: item.id,
            type: "bills",
            title: item.type,
            subtitle: `₪${item.amount}`,
            date: item.due_date,
            icon: Receipt,
            data: item
          });
        }
      });
    }

    if (selectedModules.includes("projects")) {
      projects.forEach(item => {
        if (
          item.title?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
        ) {
          results.push({
            id: item.id,
            type: "projects",
            title: item.title,
            subtitle: item.description,
            status: item.status,
            icon: FolderKanban,
            data: item
          });
        }
      });
    }

    return results;
  }, [query, selectedModules, tasks, shopping, inventory, repairs, bills, projects]);

  const handleSaveSearch = () => {
    saveSearchMutation.mutate({
      name: saveName,
      query,
      filters: {
        modules: selectedModules,
        tags: selectedTags
      }
    });
  };

  const loadSavedSearch = (search) => {
    setQuery(search.query || "");
    setSelectedModules(search.filters?.modules || modules.map(m => m.id));
    setSelectedTags(search.filters?.tags || []);
  };

  const toggleModule = (moduleId) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            חיפוש גלובלי
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            חפש בכל המודולים במקביל
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חפש משימות, קניות, מלאי, תיקונים ועוד..."
            className="pr-12 h-14 text-lg shadow-lg"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1"
          >
            <Filter className="w-4 h-4 ml-2" />
            פילטרים ({selectedModules.length})
          </Button>
          {query && (
            <Button onClick={() => setShowSaveDialog(true)} variant="outline">
              <Save className="w-4 h-4 ml-2" />
              שמור חיפוש
            </Button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-bold mb-4 text-slate-900 dark:text-slate-100">חפש במודולים:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {modules.map(module => (
                  <label
                    key={module.id}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all",
                      selectedModules.includes(module.id)
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    )}
                  >
                    <Checkbox
                      checked={selectedModules.includes(module.id)}
                      onCheckedChange={() => toggleModule(module.id)}
                    />
                    <module.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{module.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Searches */}
        {savedSearches.length > 0 && !query && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-bold mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                חיפושים שמורים
              </h3>
              <div className="flex flex-wrap gap-2">
                {savedSearches.map(search => (
                  <Button
                    key={search.id}
                    variant="outline"
                    size="sm"
                    onClick={() => loadSavedSearch(search)}
                    className="gap-2"
                  >
                    {search.is_favorite && <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />}
                    {search.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {query && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              נמצאו {searchResults.length} תוצאות
            </p>

            {searchResults.map((result, idx) => (
              <Card key={`${result.type}-${result.id}-${idx}`} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <result.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {result.title}
                        </h3>
                        <Badge variant="outline" className="flex-shrink-0">
                          {modules.find(m => m.id === result.type)?.label}
                        </Badge>
                      </div>
                      {result.subtitle && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                          {result.subtitle}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                        {result.date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(result.date), "d בMMM", { locale: he })}
                          </div>
                        )}
                        {result.status && (
                          <Badge className="text-xs">
                            {result.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {query && searchResults.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <SearchIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 dark:text-slate-400">לא נמצאו תוצאות</p>
              <p className="text-sm text-slate-400 mt-1">נסה לחפש משהו אחר או שנה את הפילטרים</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Save Search Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>שמור חיפוש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="שם החיפוש"
            />
            <div className="flex gap-2">
              <Button onClick={() => setShowSaveDialog(false)} variant="outline" className="flex-1">
                ביטול
              </Button>
              <Button onClick={handleSaveSearch} disabled={!saveName} className="flex-1">
                שמור
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}