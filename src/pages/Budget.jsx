import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  User,
  Receipt,
  Clock
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const categories = {
  housing: { label: "דיור", icon: "🏠", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30" },
  food: { label: "מזון", icon: "🍽️", color: "bg-green-100 text-green-700 dark:bg-green-900/30" },
  transportation: { label: "תחבורה", icon: "🚗", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30" },
  utilities: { label: "חשבונות", icon: "⚡", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30" },
  education: { label: "חינוך", icon: "📚", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30" },
  healthcare: { label: "בריאות", icon: "🏥", color: "bg-red-100 text-red-700 dark:bg-red-900/30" },
  entertainment: { label: "בילויים", icon: "🎭", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30" },
  savings: { label: "חיסכון", icon: "💰", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" },
  other: { label: "אחר", icon: "📦", color: "bg-slate-100 text-slate-700 dark:bg-slate-800" }
};

const savingsCategories = {
  emergency: { label: "קרן חירום", icon: "🚨", color: "bg-red-500" },
  vacation: { label: "חופשה", icon: "✈️", color: "bg-blue-500" },
  house: { label: "דירה/בית", icon: "🏡", color: "bg-green-500" },
  car: { label: "רכב", icon: "🚗", color: "bg-yellow-500" },
  education: { label: "חינוך", icon: "🎓", color: "bg-purple-500" },
  wedding: { label: "חתונה", icon: "💍", color: "bg-pink-500" },
  retirement: { label: "פנסיה", icon: "👴", color: "bg-indigo-500" },
  other: { label: "אחר", icon: "🎯", color: "bg-slate-500" }
};

export default function Budget() {
  const [activeTab, setActiveTab] = useState("expenses");
  const [showDialog, setShowDialog] = useState({ type: null, item: null });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const queryClient = useQueryClient();

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-date")
  });

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ["savingsGoals"],
    queryFn: () => base44.entities.SavingsGoal.list()
  });

  const { data: loans = [] } = useQuery({
    queryKey: ["loans"],
    queryFn: () => base44.entities.Loan.list("-date")
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => base44.entities.FamilyBudget.list("-month")
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ["familyMembers"],
    queryFn: () => base44.entities.FamilyMember.list()
  });

  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(e => isSameMonth(parseISO(e.date), selectedMonth));
  }, [expenses, selectedMonth]);

  const expensesByCategory = useMemo(() => {
    const result = {};
    currentMonthExpenses.forEach(exp => {
      if (!result[exp.category]) result[exp.category] = 0;
      result[exp.category] += exp.amount;
    });
    return result;
  }, [currentMonthExpenses]);

  const totalExpenses = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const activeSavings = savingsGoals.filter(g => g.status === "active");
  const activeLoans = loans.filter(l => l.status === "active");
  const totalBorrowed = activeLoans.filter(l => l.type === "borrowed").reduce((s, l) => s + l.remaining_amount, 0);
  const totalLent = activeLoans.filter(l => l.type === "lent").reduce((s, l) => s + l.remaining_amount, 0);

  const openDialog = (type, item = null) => setShowDialog({ type, item });
  const closeDialog = () => setShowDialog({ type: null, item: null });

  return (
    <div className="space-y-6">
      <PageHeader
        title="תקציב וכלכלה"
        subtitle={`${format(selectedMonth, "MMMM yyyy", { locale: he })}`}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">הוצאות החודש</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  ₪{totalExpenses.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shadow-lg">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">יעדי חיסכון</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {activeSavings.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg">
                <PiggyBank className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">חובות</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  ₪{totalBorrowed.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg">
                <ArrowDownRight className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">הלוואות שנתתי</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  ₪{totalLent.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
                <ArrowUpRight className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="expenses">הוצאות</TabsTrigger>
          <TabsTrigger value="savings">חיסכון</TabsTrigger>
          <TabsTrigger value="loans">הלוואות</TabsTrigger>
          <TabsTrigger value="budget">תקציב</TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4 mt-6">
          <div className="flex gap-2">
            <Button onClick={() => openDialog('expense')} className="flex-1 sm:flex-none">
              <Plus className="w-4 h-4 ml-2" />
              הוצאה חדשה
            </Button>
          </div>

          {/* Category Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">פירוט לפי קטגוריה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(expensesByCategory).map(([cat, amount]) => {
                const config = categories[cat] || categories.other;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {config.label}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          ₪{amount.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={(amount / totalExpenses) * 100} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">הוצאות אחרונות</h3>
            {currentMonthExpenses.slice(0, 10).map(exp => {
              const config = categories[exp.category] || categories.other;
              return (
                <Card key={exp.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl">{config.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100">
                            {exp.description || config.label}
                          </h4>
                          <div className="flex flex-wrap gap-2 mt-2 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{exp.paid_by_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{format(parseISO(exp.date), "d בMMM", { locale: he })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          -₪{exp.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Savings Tab */}
        <TabsContent value="savings" className="space-y-4 mt-6">
          <Button onClick={() => openDialog('savings')} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 ml-2" />
            יעד חיסכון חדש
          </Button>

          <div className="grid gap-4">
            {savingsGoals.map(goal => {
              const config = savingsCategories[goal.category] || savingsCategories.other;
              const progress = (goal.current_amount / goal.target_amount) * 100;
              const remaining = goal.target_amount - goal.current_amount;
              
              return (
                <Card key={goal.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl", config.color)}>
                          {config.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100">{goal.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{config.label}</p>
                        </div>
                      </div>
                      <Badge className={goal.status === "active" ? "bg-green-100 text-green-700" : ""}>
                        {goal.status === "active" ? "פעיל" : goal.status === "completed" ? "הושלם" : "מושהה"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">התקדמות</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          ₪{goal.current_amount.toLocaleString()} / ₪{goal.target_amount.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={progress} className="h-3" />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{Math.round(progress)}%</span>
                        <span>נותרו ₪{remaining.toLocaleString()}</span>
                      </div>
                    </div>

                    {goal.target_date && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Target className="w-4 h-4" />
                        <span>יעד: {format(parseISO(goal.target_date), "d בMMM yyyy", { locale: he })}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Loans Tab */}
        <TabsContent value="loans" className="space-y-4 mt-6">
          <Button onClick={() => openDialog('loan')} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 ml-2" />
            הלוואה חדשה
          </Button>

          <div className="grid gap-4">
            {loans.map(loan => (
              <Card key={loan.id} className={cn(
                loan.type === "borrowed" ? "border-r-4 border-r-red-500" : "border-r-4 border-r-green-500"
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={loan.type === "borrowed" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
                          {loan.type === "borrowed" ? "לווינו" : "הלוונו"}
                        </Badge>
                        {loan.status === "overdue" && (
                          <Badge variant="destructive">באיחור</Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">
                        {loan.person_name}
                      </h3>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-slate-600 dark:text-slate-400">יתרה</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        ₪{loan.remaining_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">סכום מקורי</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        ₪{loan.amount.toLocaleString()}
                      </p>
                    </div>
                    {loan.due_date && (
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">תאריך החזר</p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {format(parseISO(loan.due_date), "d בMMM yyyy", { locale: he })}
                        </p>
                      </div>
                    )}
                  </div>

                  {loan.payments && loan.payments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        {loan.payments.length} תשלומים בוצעו
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>תקציב חודשי מתוכנן</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-slate-500 py-8">
                בקרוב - הגדרת תקציבים חודשיים לכל קטגוריה
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}