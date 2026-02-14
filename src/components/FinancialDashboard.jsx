import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Calendar, ShoppingCart, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { he } from "date-fns/locale";

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

export default function FinancialDashboard() {
  const { data: bills = [] } = useQuery({
    queryKey: ["bills"],
    queryFn: () => base44.entities.Bill.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: consumptionLogs = [] } = useQuery({
    queryKey: ["consumptionLogs"],
    queryFn: () => base44.entities.ConsumptionLog.list()
  });

  // חישוב נתונים פיננסיים
  const financialData = useMemo(() => {
    const now = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i);
      return {
        month: format(month, 'MMM', { locale: he }),
        fullDate: month,
        bills: 0,
        shopping: 0,
        projects: 0
      };
    });

    // חשבונות לפי חודש
    bills.forEach(bill => {
      if (bill.paid_date) {
        const billMonth = parseISO(bill.paid_date);
        const monthData = last6Months.find(m => 
          format(m.fullDate, 'yyyy-MM') === format(billMonth, 'yyyy-MM')
        );
        if (monthData) {
          monthData.bills += bill.amount || 0;
        }
      }
    });

    // קניות לפי חודש
    consumptionLogs.forEach(log => {
      if (log.action_type === 'purchased' && log.date) {
        const logMonth = parseISO(log.date);
        const monthData = last6Months.find(m => 
          format(m.fullDate, 'yyyy-MM') === format(logMonth, 'yyyy-MM')
        );
        if (monthData) {
          monthData.shopping += log.cost || 0;
        }
      }
    });

    // פרויקטים לפי חודש
    projects.forEach(project => {
      if (project.completed_date && project.spent) {
        const projectMonth = parseISO(project.completed_date);
        const monthData = last6Months.find(m => 
          format(m.fullDate, 'yyyy-MM') === format(projectMonth, 'yyyy-MM')
        );
        if (monthData) {
          monthData.projects += project.spent || 0;
        }
      }
    });

    return last6Months;
  }, [bills, projects, consumptionLogs]);

  // פילוח הוצאות החודש
  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    let totalBills = 0;
    let totalShopping = 0;
    let totalProjects = 0;

    bills.forEach(bill => {
      if (bill.paid_date) {
        const billDate = parseISO(bill.paid_date);
        if (billDate >= monthStart && billDate <= monthEnd) {
          totalBills += bill.amount || 0;
        }
      }
    });

    consumptionLogs.forEach(log => {
      if (log.action_type === 'purchased' && log.date) {
        const logDate = parseISO(log.date);
        if (logDate >= monthStart && logDate <= monthEnd) {
          totalShopping += log.cost || 0;
        }
      }
    });

    projects.forEach(project => {
      if (project.completed_date && project.spent) {
        const projectDate = parseISO(project.completed_date);
        if (projectDate >= monthStart && projectDate <= monthEnd) {
          totalProjects += project.spent || 0;
        }
      }
    });

    return [
      { name: 'חשבונות', value: totalBills, color: COLORS[0] },
      { name: 'קניות', value: totalShopping, color: COLORS[1] },
      { name: 'פרויקטים', value: totalProjects, color: COLORS[2] }
    ].filter(item => item.value > 0);
  }, [bills, projects, consumptionLogs]);

  const totalThisMonth = currentMonthExpenses.reduce((sum, item) => sum + item.value, 0);
  const totalLastMonth = useMemo(() => {
    const lastMonth = financialData[financialData.length - 2];
    return (lastMonth?.bills || 0) + (lastMonth?.shopping || 0) + (lastMonth?.projects || 0);
  }, [financialData]);

  const percentChange = totalLastMonth > 0 
    ? ((totalThisMonth - totalLastMonth) / totalLastMonth * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-4">
      {/* סיכום חודשי */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">הוצאות החודש</CardTitle>
                <p className="text-xs text-slate-600 dark:text-slate-400">{format(new Date(), 'MMMM yyyy', { locale: he })}</p>
              </div>
            </div>
            {percentChange !== 0 && (
              <Badge className={cn(
                "flex items-center gap-1",
                percentChange > 0 
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              )}>
                {percentChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(percentChange)}% מחודש שעבר
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            ₪{totalThisMonth.toLocaleString()}
          </div>
          
          {currentMonthExpenses.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {currentMonthExpenses.map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">{item.name}</div>
                  <div className="text-lg font-bold" style={{ color: item.color }}>
                    ₪{item.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* גרף מגמות */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            מגמות ב-6 חודשים אחרונים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={financialData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="bills" stroke={COLORS[0]} name="חשבונות" strokeWidth={2} />
              <Line type="monotone" dataKey="shopping" stroke={COLORS[1]} name="קניות" strokeWidth={2} />
              <Line type="monotone" dataKey="projects" stroke={COLORS[2]} name="פרויקטים" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* פילוח הוצאות */}
      {currentMonthExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="w-5 h-5 text-orange-500" />
              פילוח הוצאות החודש
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={currentMonthExpenses}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {currentMonthExpenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `₪${value.toLocaleString()}`}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}