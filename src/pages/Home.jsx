import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isToday, isTomorrow, parseISO, isBefore, addDays } from "date-fns";
import { he } from "date-fns/locale";
import { 
  ShoppingCart, 
  Package, 
  Wrench, 
  FolderKanban, 
  Receipt, 
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import QuickAction from "@/components/ui/QuickAction";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AIInsightsPanel from "@/components/AIInsightsPanel";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: shoppingItems = [], isLoading: loadingShopping } = useQuery({
    queryKey: ["shopping"],
    queryFn: () => base44.entities.ShoppingItem.list()
  });

  const { data: inventory = [], isLoading: loadingInventory } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.InventoryItem.list()
  });

  const { data: repairs = [], isLoading: loadingRepairs } = useQuery({
    queryKey: ["repairs"],
    queryFn: () => base44.entities.Repair.list()
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: bills = [], isLoading: loadingBills } = useQuery({
    queryKey: ["bills"],
    queryFn: () => base44.entities.Bill.list()
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["events"],
    queryFn: () => base44.entities.CalendarEvent.list()
  });

  const { data: insights = [] } = useQuery({
    queryKey: ["ai-insights"],
    queryFn: async () => {
      const all = await base44.entities.AIInsight.list('-created_date');
      return all.filter(i => !i.is_dismissed);
    }
  });

  const isLoading = loadingShopping || loadingInventory || loadingRepairs || loadingProjects || loadingBills || loadingEvents;

  const pendingShoppingCount = shoppingItems.filter(i => !i.is_purchased).length;
  const lowInventoryCount = inventory.filter(i => i.status === "low" || i.status === "expired").length;
  const activeRepairsCount = repairs.filter(r => r.status !== "completed").length;
  const activeProjectsCount = projects.filter(p => p.status !== "completed").length;
  const unpaidBillsCount = bills.filter(b => !b.is_paid).length;
  
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const todayEvents = events.filter(e => e.date === todayStr);

  const lowStapleItems = inventory.filter(i => i.is_staple && (i.status === "low" || i.quantity === 0));

  const urgentItems = [
    ...lowStapleItems.map(i => ({
      type: "staple",
      title: `${i.name} - פריט בסיסי שנגמר`,
      icon: Package,
      color: "text-orange-500",
      href: createPageUrl("Inventory")
    })),
    ...repairs.filter(r => r.priority === "urgent" && r.status !== "completed").map(r => ({
      type: "repair",
      title: r.title,
      icon: Wrench,
      color: "text-rose-500",
      href: createPageUrl("Repairs")
    })),
    ...bills.filter(b => !b.is_paid && b.due_date && isBefore(parseISO(b.due_date), addDays(today, 3))).map(b => ({
      type: "bill",
      title: `חשבון ${b.type === "electricity" ? "חשמל" : b.type === "water" ? "מים" : b.type === "arnona" ? "ארנונה" : b.type === "vaad_bayit" ? "ועד בית" : b.type} - ₪${b.amount}`,
      icon: Receipt,
      color: "text-orange-500",
      href: createPageUrl("Bills")
    })),
    ...inventory.filter(i => i.status === "expired").map(i => ({
      type: "inventory",
      title: `${i.name} פג תוקף`,
      icon: Package,
      color: "text-rose-500",
      href: createPageUrl("Inventory")
    }))
  ].slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100">
            שלום! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {format(today, "EEEE, d בMMMM", { locale: he })}
          </p>
        </div>
        <Link to={createPageUrl("AISettings")}>
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">הגדרות AI</span>
          </Button>
        </Link>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">התראות חכמות</h2>
              <Badge className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                {insights.length}
              </Badge>
            </div>
          </div>
          <AIInsightsPanel compact />
        </div>
      )}

      {/* Urgent Alerts */}
      {urgentItems.length > 0 && (
        <div className="bg-gradient-to-l from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 rounded-2xl p-5 border border-rose-100 dark:border-rose-900/30">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">דורש תשומת לב</h2>
          </div>
          <div className="space-y-2">
            {urgentItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.href}
                className="flex items-center gap-3 p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-sm text-slate-700 dark:text-slate-300">{item.title}</span>
                <ArrowLeft className="w-4 h-4 text-slate-300 dark:text-slate-600 mr-auto" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="רשימת קניות"
          value={pendingShoppingCount}
          subtitle="פריטים לקנות"
          icon={ShoppingCart}
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30"
          onClick={() => window.location.href = createPageUrl("Shopping")}
        />
        <StatCard
          title="מלאי נמוך"
          value={lowInventoryCount}
          subtitle="פריטים להשלמה"
          icon={Package}
          iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30"
          onClick={() => window.location.href = createPageUrl("Inventory")}
        />
        <StatCard
          title="אחזקת בית"
          value={activeRepairsCount}
          subtitle="משימות פתוחות"
          icon={Wrench}
          iconBg="bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/30"
          onClick={() => window.location.href = createPageUrl("Repairs")}
        />
        <StatCard
          title="חשבונות לתשלום"
          value={unpaidBillsCount}
          subtitle="ממתינים לתשלום"
          icon={Receipt}
          iconBg="bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/30"
          onClick={() => window.location.href = createPageUrl("Bills")}
        />
      </div>

      {/* Today's Events */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-slate-800">היום ביומן</h2>
          </div>
          <Link 
            to={createPageUrl("FamilyCalendar")}
            className="text-sm text-blue-500 hover:text-blue-600 font-medium"
          >
            צפה ביומן
          </Link>
        </div>
        <div className="p-5">
          {todayEvents.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>אין אירועים מתוכננים להיום</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayEvents.map(event => (
                <div 
                  key={event.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-slate-50"
                >
                  <div 
                    className="w-1 h-12 rounded-full"
                    style={{ backgroundColor: event.color || "#3b82f6" }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{event.title}</p>
                    <p className="text-sm text-slate-500">
                      {event.start_time && `${event.start_time}`}
                      {event.end_time && ` - ${event.end_time}`}
                      {event.family_member_name && ` • ${event.family_member_name}`}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                    {event.type === "school" && "בית ספר"}
                    {event.type === "activity" && "חוג"}
                    {event.type === "event" && "אירוע"}
                    {event.type === "appointment" && "פגישה"}
                    {event.type === "other" && "אחר"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-slate-800 mb-4">פעולות מהירות</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction
            title="הוסף פריט לרשימת קניות"
            description={`${pendingShoppingCount} פריטים ברשימה`}
            icon={ShoppingCart}
            href={createPageUrl("Shopping")}
            color="blue"
          />
          <QuickAction
            title="משימת אחזקה חדשה"
            description={`${activeRepairsCount} משימות פתוחות`}
            icon={Wrench}
            href={createPageUrl("Repairs")}
            color="orange"
          />
          <QuickAction
            title="הוסף אירוע ליומן"
            description="ניהול לוח זמנים"
            icon={Calendar}
            href={createPageUrl("FamilyCalendar")}
            color="purple"
          />
        </div>
      </div>

      {/* Active Projects */}
      {activeProjectsCount > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-teal-500" />
              <h2 className="font-semibold text-slate-800">פרויקטים פעילים</h2>
            </div>
            <Link 
              to={createPageUrl("Projects")}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium"
            >
              צפה בכל הפרויקטים
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {projects.filter(p => p.status !== "completed").slice(0, 3).map(project => (
              <div key={project.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{project.title}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {project.budget && `תקציב: ₪${project.budget.toLocaleString()}`}
                      {project.spent && ` • הוצא: ₪${project.spent.toLocaleString()}`}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={
                      project.status === "planning" ? "bg-slate-100 text-slate-600" :
                      project.status === "in_progress" ? "bg-blue-50 text-blue-600" :
                      "bg-amber-50 text-amber-600"
                    }
                  >
                    {project.status === "planning" && "בתכנון"}
                    {project.status === "in_progress" && "בביצוע"}
                    {project.status === "on_hold" && "מושהה"}
                  </Badge>
                </div>
                {project.tasks && project.tasks.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {project.tasks.filter(t => t.completed).length} / {project.tasks.length} משימות הושלמו
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-l from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(project.tasks.filter(t => t.completed).length / project.tasks.length) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}