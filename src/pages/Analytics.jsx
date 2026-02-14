import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  CheckCircle2,
  Calendar,
  Sparkles
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isSameMonth } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-date")
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list()
  });

  const { data: shopping = [] } = useQuery({
    queryKey: ["shopping"],
    queryFn: () => base44.entities.ShoppingItem.list()
  });

  const { data: bills = [] } = useQuery({
    queryKey: ["bills"],
    queryFn: () => base44.entities.Bill.list()
  });

  // Monthly expenses trend
  const monthlyExpenses = useMemo(() => {
    const months = [];
    const monthsCount = selectedPeriod === "12months" ? 12 : 6;
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthExpenses = expenses.filter(e => {
        const expDate = parseISO(e.date);
        return expDate >= monthStart && expDate <= monthEnd;
      });
      
      const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      months.push({
        month: format(monthDate, "MMM", { locale: he }),
        amount: total,
        count: monthExpenses.length
      });
    }
    
    return months;
  }, [expenses, selectedPeriod]);

  // Expenses by category
  const expensesByCategory = useMemo(() => {
    const categories = {};
    expenses.forEach(e => {
      if (!categories[e.category]) {
        categories[e.category] = { name: e.category, value: 0 };
      }
      categories[e.category].value += e.amount;
    });
    return Object.values(categories);
  }, [expenses]);

  // Tasks completion trend
  const tasksCompletion = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthTasks = tasks.filter(t => {
        if (!t.completed_at) return false;
        return isSameMonth(parseISO(t.completed_at), monthDate);
      });
      
      months.push({
        month: format(monthDate, "MMM", { locale: he }),
        completed: monthTasks.length,
        total: tasks.filter(t => t.created_date && isSameMonth(parseISO(t.created_date), monthDate)).length
      });
    }
    return months;
  }, [tasks]);

  // Current vs previous month comparison
  const currentMonth = useMemo(() => {
    const now = new Date();
    const current = expenses.filter(e => isSameMonth(parseISO(e.date), now));
    const previous = expenses.filter(e => isSameMonth(parseISO(e.date), subMonths(now, 1)));
    
    const currentTotal = current.reduce((s, e) => s + e.amount, 0);
    const previousTotal = previous.reduce((s, e) => s + e.amount, 0);
    const change = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
    
    return {
      current: currentTotal,
      previous: previousTotal,
      change: Math.round(change),
      isIncrease: change > 0
    };
  }, [expenses]);

  // Predictions for next month
  const predictions = useMemo(() => {
    const last3Months = monthlyExpenses.slice(-3);
    const avgExpenses = last3Months.reduce((s, m) => s + m.amount, 0) / 3;
    
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return {
      expectedExpenses: Math.round(avgExpenses),
      expectedTasks: Math.round(totalTasks * 0.3),
      completionRate: Math.round(completionRate)
    };
  }, [monthlyExpenses, tasks]);

  const generatePDFReport = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generateAnalyticsReport', {
        period: selectedPeriod,
        date: new Date().toISOString()
      });
      
      // Download the PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `דוח-ניתוח-${format(new Date(), "yyyy-MM")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success("הדוח הורד בהצלחה");
    } catch (error) {
      toast.error("שגיאה ביצירת הדוח");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="ניתוח נתונים"
        subtitle="מגמות, השוואות ותחזיות"
        action={
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6months">6 חודשים</SelectItem>
                <SelectItem value="12months">12 חודשים</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generatePDFReport} disabled={isGenerating}>
              <Download className="w-4 h-4 ml-2" />
              {isGenerating ? "מייצר..." : "הורד דוח PDF"}
            </Button>
          </div>
        }
      />

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">החודש vs חודש שעבר</p>
              {currentMonth.isIncrease ? (
                <TrendingUp className="w-5 h-5 text-red-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-green-500" />
              )}
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              ₪{currentMonth.current.toLocaleString()}
            </p>
            <p className={`text-sm mt-1 ${currentMonth.isIncrease ? 'text-red-600' : 'text-green-600'}`}>
              {currentMonth.isIncrease ? '+' : ''}{currentMonth.change}% מחודש שעבר
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">צפי לחודש הבא</p>
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              ₪{predictions.expectedExpenses.toLocaleString()}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              מבוסס על ממוצע 3 חודשים
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">אחוז השלמת משימות</p>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {predictions.completionRate}%
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              צפי: {predictions.expectedTasks} משימות חדשות
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="expenses">הוצאות</TabsTrigger>
          <TabsTrigger value="tasks">משימות</TabsTrigger>
          <TabsTrigger value="categories">קטגוריות</TabsTrigger>
        </TabsList>

        {/* Expenses Trend */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>מגמת הוצאות חודשית</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => `₪${value.toLocaleString()}`}
                    labelFormatter={(label) => `חודש: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="סכום"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Completion */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>השלמת משימות - 6 חודשים אחרונים</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tasksCompletion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#10b981" name="הושלמו" />
                  <Bar dataKey="total" fill="#3b82f6" name="נוצרו" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Breakdown */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>פירוט הוצאות לפי קטגוריות</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₪${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}