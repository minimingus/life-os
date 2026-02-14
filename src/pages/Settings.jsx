import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  ListTodo,
  ShoppingCart,
  Package,
  Wrench,
  Receipt,
  FolderKanban,
  Calendar,
  Users,
  Heart,
  Wallet,
  GraduationCap,
  TrendingUp,
  Sparkles,
  Bell,
  Clock,
  Save
} from "lucide-react";
import { toast } from "sonner";

const ALL_MODULES = [
  { id: "tasks", label: "משימות", icon: ListTodo, category: "ניהול יומיומי" },
  { id: "shopping", label: "רשימת קניות", icon: ShoppingCart, category: "ניהול יומיומי" },
  { id: "inventory", label: "מלאי", icon: Package, category: "ניהול יומיומי" },
  { id: "repairs", label: "אחזקת בית", icon: Wrench, category: "בית" },
  { id: "bills", label: "חשבונות ותשלומים", icon: Receipt, category: "כספים" },
  { id: "budget", label: "תקציב וכלכלה", icon: Wallet, category: "כספים" },
  { id: "projects", label: "פרויקטים", icon: FolderKanban, category: "בית" },
  { id: "calendar", label: "יומן משפחתי", icon: Calendar, category: "משפחה" },
  { id: "routine", label: "לוז משפחתי", icon: Clock, category: "משפחה" },
  { id: "family", label: "בני משפחה", icon: Users, category: "משפחה" },
  { id: "health", label: "בריאות המשפחה", icon: Heart, category: "בריאות" },
  { id: "education", label: "חינוך ולמידה", icon: GraduationCap, category: "חינוך" },
  { id: "schedule", label: "מערכת שעות", icon: Calendar, category: "חינוך" },
  { id: "analytics", label: "ניתוח נתונים", icon: TrendingUp, category: "מתקדם" },
  { id: "ai", label: "התראות AI", icon: Sparkles, category: "מתקדם" },
  { id: "notifications", label: "הגדרות התראות", icon: Bell, category: "מתקדם" }
];

const categories = [...new Set(ALL_MODULES.map(m => m.category))];

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["moduleSettings"],
    queryFn: async () => {
      const list = await base44.entities.ModuleSettings.list();
      return list[0] || null;
    }
  });

  const [enabledModules, setEnabledModules] = useState(
    settings?.enabled_modules || ALL_MODULES.map(m => m.id)
  );

  const saveMutation = useMutation({
    mutationFn: async (modules) => {
      if (settings?.id) {
        return base44.entities.ModuleSettings.update(settings.id, {
          enabled_modules: modules
        });
      } else {
        return base44.entities.ModuleSettings.create({
          enabled_modules: modules
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moduleSettings"] });
      toast.success("ההגדרות נשמרו בהצלחה");
    }
  });

  const toggleModule = (moduleId) => {
    setEnabledModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSave = () => {
    saveMutation.mutate(enabledModules);
  };

  const hasChanges = JSON.stringify(enabledModules.sort()) !== 
    JSON.stringify((settings?.enabled_modules || ALL_MODULES.map(m => m.id)).sort());

  return (
    <div className="space-y-6">
      <PageHeader
        title="הגדרות מודולים"
        subtitle="בחר אילו מודולים להציג במערכת"
      />

      <div className="space-y-6">
        {categories.map(category => {
          const categoryModules = ALL_MODULES.filter(m => m.category === category);
          
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {categoryModules.map(module => {
                    const Icon = module.icon;
                    const isEnabled = enabledModules.includes(module.id);
                    
                    return (
                      <div
                        key={module.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isEnabled 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className={`font-medium ${
                              isEnabled 
                                ? 'text-slate-900 dark:text-slate-100' 
                                : 'text-slate-500 dark:text-slate-400'
                            }`}>
                              {module.label}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => toggleModule(module.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {hasChanges && (
        <div className="fixed bottom-20 lg:bottom-8 left-1/2 -translate-x-1/2 z-50">
          <Card className="shadow-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">יש שינויים שלא נשמרו</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEnabledModules(settings?.enabled_modules || ALL_MODULES.map(m => m.id))}
                  >
                    ביטול
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 ml-2" />
                    שמור שינויים
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}