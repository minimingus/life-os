import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/ui/PageHeader";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  ShoppingCart,
  AlertTriangle,
  Download,
  Sparkles,
  Package,
  DollarSign,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from "date-fns";
import { he } from "date-fns/locale";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function AIReports() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);

  const { data: insights = [] } = useQuery({
    queryKey: ["ai-insights"],
    queryFn: () => base44.entities.AIInsight.list("-created_date")
  });

  const { data: bills = [] } = useQuery({
    queryKey: ["bills"],
    queryFn: () => base44.entities.Bill.list()
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.InventoryItem.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["family-budget"],
    queryFn: () => base44.entities.FamilyBudget.list()
  });

  // Calculate insights statistics
  const insightsByType = insights.reduce((acc, insight) => {
    acc[insight.type] = (acc[insight.type] || 0) + 1;
    return acc;
  }, {});

  const insightTypeLabels = {
    spending_alert: "התראות הוצאה",
    inventory_expiry: "פג תוקף",
    shopping_suggestion: "הצעות קניה",
    bill_reminder: "תזכורת חשבון",
    repair_priority: "עדיפות תיקון",
    budget_warning: "אזהרת תקציב"
  };

  const pieData = Object.entries(insightsByType).map(([type, count]) => ({
    name: insightTypeLabels[type] || type,
    value: count
  }));

  // Spending trends (last 6 months)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    return format(date, "yyyy-MM");
  });

  const spendingTrends = last6Months.map(month => {
    const budget = budgets.find(b => b.month === month);
    const totalBudget = budget ? Object.values(budget.categories || {}).reduce((sum, val) => sum + (val || 0), 0) : 0;
    const totalSpent = budget ? Object.values(budget.actual_spending || {}).reduce((sum, val) => sum + (val || 0), 0) : 0;
    
    return {
      month: format(parseISO(month + "-01"), "MMM", { locale: he }),
      תקציב: totalBudget,
      הוצאות: totalSpent,
      יתרה: totalBudget - totalSpent
    };
  });

  // Expiring items
  const today = new Date();
  const expiringItems = inventory.filter(item => {
    if (!item.expiry_date) return false;
    const expiryDate = parseISO(item.expiry_date);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 14;
  }).sort((a, b) => parseISO(a.expiry_date) - parseISO(b.expiry_date));

  // Shopping recommendations tracking
  const shoppingInsights = insights.filter(i => i.type === "shopping_suggestion");
  const uniqueRecommendations = new Set();
  shoppingInsights.forEach(insight => {
    if (insight.action_items) {
      insight.action_items.forEach(action => {
        if (action.data?.item_name) {
          uniqueRecommendations.add(action.data.item_name);
        }
      });
    }
  });

  // Project budget analysis
  const projectBudgetData = projects
    .filter(p => p.budget && p.budget > 0)
    .map(p => ({
      name: p.title.length > 20 ? p.title.substring(0, 20) + "..." : p.title,
      תקציב: p.budget,
      הוצאות: p.spent || 0,
      יתרה: p.budget - (p.spent || 0)
    }))
    .slice(0, 8);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await base44.functions.invoke("exportAIReportPDF", {
        insights,
        bills,
        inventory: expiringItems,
        projects: projectBudgetData,
        spendingTrends
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("שגיאה בייצוא הדוח");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="דוחות AI מפורטים"
        subtitle="ניתוח מעמיק של כל ההתראות והמלצות המערכת"
        action={{
          label: isExporting ? "מייצא..." : "ייצא PDF",
          icon: Download,
          onClick: handleExportPDF,
          disabled: isExporting
        }}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">סה"כ התראות</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{insights.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">פריטים תופגים</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{expiringItems.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">המלצות קניה</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{uniqueRecommendations.size}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">פרויקטים פעילים</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {projects.filter(p => p.status !== "completed").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} dir="rtl">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">סקירה</TabsTrigger>
          <TabsTrigger value="spending">מגמות הוצאה</TabsTrigger>
          <TabsTrigger value="inventory">מלאי תופג</TabsTrigger>
          <TabsTrigger value="shopping">המלצות קניה</TabsTrigger>
          <TabsTrigger value="projects">תקציבי פרויקטים</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Insights Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">התפלגות התראות לפי סוג</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">התראות אחרונות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {insights.slice(0, 6).map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-2",
                        insight.priority === "urgent" ? "bg-red-500" :
                        insight.priority === "high" ? "bg-orange-500" :
                        insight.priority === "medium" ? "bg-blue-500" : "bg-slate-400"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{insight.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {insight.description}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {format(parseISO(insight.created_date), "dd/MM/yyyy HH:mm", { locale: he })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="spending" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">מגמות הוצאה - 6 חודשים אחרונים</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={spendingTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="תקציב" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="הוצאות" stroke="#EF4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="יתרה" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {spendingTrends.slice(-3).map((month, idx) => (
              <Card key={idx}>
                <CardContent className="p-5">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{month.month}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 dark:text-slate-400">תקציב</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        ₪{month.תקציב.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 dark:text-slate-400">הוצאות</span>
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                        ₪{month.הוצאות.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">יתרה</span>
                      <div className="flex items-center gap-1">
                        {month.יתרה >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                        )}
                        <span className={cn(
                          "text-sm font-bold",
                          month.יתרה >= 0 
                            ? "text-green-600 dark:text-green-400" 
                            : "text-red-600 dark:text-red-400"
                        )}>
                          ₪{Math.abs(month.יתרה).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">פריטי מלאי שעומדים לפוג תוקף (14 יום הקרובים)</CardTitle>
            </CardHeader>
            <CardContent>
              {expiringItems.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                  אין פריטים שעומדים לפוג תוקף בתקופה הקרובה
                </p>
              ) : (
                <div className="space-y-2">
                  {expiringItems.map((item, idx) => {
                    const daysUntilExpiry = Math.ceil(
                      (parseISO(item.expiry_date) - today) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border-r-4",
                          daysUntilExpiry <= 3 
                            ? "bg-red-50 dark:bg-red-900/20 border-red-500" 
                            : daysUntilExpiry <= 7
                            ? "bg-orange-50 dark:bg-orange-900/20 border-orange-500"
                            : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {item.quantity} {item.unit || "יחידות"}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className={cn(
                            "text-sm font-semibold",
                            daysUntilExpiry <= 3 ? "text-red-600 dark:text-red-400" :
                            daysUntilExpiry <= 7 ? "text-orange-600 dark:text-orange-400" :
                            "text-yellow-600 dark:text-yellow-400"
                          )}>
                            {daysUntilExpiry === 0 ? "תופג היום!" :
                             daysUntilExpiry === 1 ? "תופג מחר" :
                             `${daysUntilExpiry} ימים`}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {format(parseISO(item.expiry_date), "dd/MM/yyyy", { locale: he })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shopping" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">סיכום המלצות קניה מה-AI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from(uniqueRecommendations).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{item}</span>
                  </div>
                ))}
                {uniqueRecommendations.size === 0 && (
                  <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                    אין המלצות קניה כרגע
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">מעקב תקציב פרויקטים</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={projectBudgetData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="תקציב" fill="#3B82F6" />
                  <Bar dataKey="הוצאות" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects
              .filter(p => p.budget && p.spent && p.spent > p.budget)
              .slice(0, 4)
              .map((project, idx) => (
                <Card key={idx} className="border-r-4 border-red-500">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{project.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {project.status === "completed" ? "הושלם" :
                           project.status === "in_progress" ? "בתהליך" : "בתכנון"}
                        </p>
                      </div>
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">תקציב</span>
                        <span className="font-semibold">₪{project.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">הוצאות</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          ₪{project.spent.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="font-medium text-red-600 dark:text-red-400">חריגה</span>
                        <span className="font-bold text-red-600 dark:text-red-400">
                          ₪{(project.spent - project.budget).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}