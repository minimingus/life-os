import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Package,
  Calendar,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, parseISO, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";

export default function InventoryAnalytics() {
  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.InventoryItem.list()
  });

  const { data: shopping = [] } = useQuery({
    queryKey: ["shopping"],
    queryFn: () => base44.entities.ShoppingItem.list()
  });

  // Calculate consumption patterns and predictions
  const analytics = useMemo(() => {
    const today = new Date();
    const predictions = [];
    const lowStockAlerts = [];
    const optimizationSuggestions = [];

    inventory.forEach(item => {
      // Calculate average consumption based on min_quantity and current stock
      const optimalLevel = item.min_quantity || 5;
      const currentLevel = item.quantity || 0;
      const stockPercentage = optimalLevel > 0 ? (currentLevel / optimalLevel) * 100 : 100;

      // Predict days until restock needed
      // Simple heuristic: if item is staple and has min_quantity, estimate based on that
      let daysUntilRestock = null;
      let dailyConsumption = null;

      if (item.is_staple && item.min_quantity && currentLevel > 0) {
        // Assume we consume about 10-20% of optimal level per week for staples
        dailyConsumption = (optimalLevel * 0.15) / 7; // 15% per week average
        daysUntilRestock = Math.floor((currentLevel - item.min_quantity) / dailyConsumption);
      }

      // Check if item is in shopping list
      const inShoppingList = shopping.some(s => 
        s.inventory_item_id === item.id || 
        s.name.toLowerCase() === item.name.toLowerCase()
      );

      // Determine stock status
      let status = "optimal";
      let statusLabel = "תקין";
      let statusColor = "text-green-600";

      if (currentLevel === 0) {
        status = "out_of_stock";
        statusLabel = "אזל מהמלאי";
        statusColor = "text-red-600";
      } else if (currentLevel < item.min_quantity) {
        status = "low_stock";
        statusLabel = "מלאי נמוך";
        statusColor = "text-orange-600";
      } else if (stockPercentage > 200) {
        status = "overstock";
        statusLabel = "מלאי עודף";
        statusColor = "text-blue-600";
      }

      const itemAnalysis = {
        ...item,
        optimalLevel,
        currentLevel,
        stockPercentage,
        daysUntilRestock,
        dailyConsumption,
        inShoppingList,
        status,
        statusLabel,
        statusColor
      };

      predictions.push(itemAnalysis);

      // Generate alerts
      if (status === "low_stock" && !inShoppingList && item.is_staple) {
        lowStockAlerts.push({
          ...itemAnalysis,
          priority: "high",
          message: `${item.name} במלאי נמוך - מומלץ להזמין`
        });
      }

      if (daysUntilRestock !== null && daysUntilRestock <= 7 && daysUntilRestock > 0 && !inShoppingList) {
        lowStockAlerts.push({
          ...itemAnalysis,
          priority: "medium",
          message: `${item.name} יגמר בעוד ${daysUntilRestock} ימים`
        });
      }

      // Optimization suggestions
      if (status === "overstock") {
        optimizationSuggestions.push({
          ...itemAnalysis,
          suggestion: `יש לך ${Math.round(stockPercentage - 100)}% יותר ${item.name} מהנדרש - שקול לצמצם קניות`
        });
      }
    });

    return {
      predictions: predictions.sort((a, b) => {
        if (a.status === "out_of_stock" && b.status !== "out_of_stock") return -1;
        if (a.status !== "out_of_stock" && b.status === "out_of_stock") return 1;
        if (a.status === "low_stock" && b.status !== "low_stock") return -1;
        if (a.status !== "low_stock" && b.status === "low_stock") return 1;
        return 0;
      }),
      lowStockAlerts: lowStockAlerts.sort((a, b) => {
        if (a.priority === "high" && b.priority !== "high") return -1;
        if (a.priority !== "high" && b.priority === "high") return 1;
        return 0;
      }),
      optimizationSuggestions
    };
  }, [inventory, shopping]);

  // Stock status distribution
  const statusDistribution = [
    { 
      name: "אזל", 
      value: analytics.predictions.filter(p => p.status === "out_of_stock").length,
      color: "#EF4444"
    },
    { 
      name: "נמוך", 
      value: analytics.predictions.filter(p => p.status === "low_stock").length,
      color: "#F59E0B"
    },
    { 
      name: "תקין", 
      value: analytics.predictions.filter(p => p.status === "optimal").length,
      color: "#10B981"
    },
    { 
      name: "עודף", 
      value: analytics.predictions.filter(p => p.status === "overstock").length,
      color: "#3B82F6"
    }
  ];

  // Predicted shortage timeline (next 14 days)
  const shortageTimeline = analytics.predictions
    .filter(p => p.daysUntilRestock !== null && p.daysUntilRestock >= 0 && p.daysUntilRestock <= 14)
    .map(p => ({
      name: p.name,
      days: p.daysUntilRestock,
      date: format(new Date(Date.now() + p.daysUntilRestock * 24 * 60 * 60 * 1000), "dd/MM", { locale: he })
    }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">התראות דחופות</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {analytics.lowStockAlerts.filter(a => a.priority === "high").length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">מלאי אופטימלי</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analytics.predictions.filter(p => p.status === "optimal").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">צפוי להיגמר בקרוב</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {shortageTimeline.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">הצעות שיפור</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {analytics.optimizationSuggestions.length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {analytics.lowStockAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              התראות מלאי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.lowStockAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-4 rounded-lg border-r-4 flex items-start justify-between",
                    alert.priority === "high"
                      ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                      : "bg-orange-50 dark:bg-orange-900/20 border-orange-500"
                  )}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <Package className="w-5 h-5 mt-1 text-slate-600 dark:text-slate-400" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{alert.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{alert.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-slate-500 dark:text-slate-500">
                          מלאי נוכחי: {alert.currentLevel} {alert.unit || "יחידות"}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-500">
                          רמה אופטימלית: {alert.optimalLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={alert.priority === "high" ? "destructive" : "default"}>
                    {alert.priority === "high" ? "דחוף" : "בינוני"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Level Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">התפלגות סטטוס מלאי</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6">
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Shortage Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">צפי מחסורים - 14 ימים הקרובים</CardTitle>
          </CardHeader>
          <CardContent>
            {shortageTimeline.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                אין מחסורים צפויים בתקופה הקרובה
              </p>
            ) : (
              <div className="space-y-2">
                {shortageTimeline.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        item.days <= 3 ? "bg-red-500" :
                        item.days <= 7 ? "bg-orange-500" : "bg-yellow-500"
                      )} />
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.days === 0 ? "היום" :
                         item.days === 1 ? "מחר" :
                         `${item.days} ימים`}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Status Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">סטטוס מפורט - פריטי מלאי</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.predictions.slice(0, 20).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                    <Badge variant="outline" className={item.statusColor}>
                      {item.statusLabel}
                    </Badge>
                    {item.is_staple && (
                      <Badge variant="secondary" className="text-xs">בסיסי</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mb-2">
                    <span>נוכחי: {item.currentLevel} {item.unit || "יח'"}</span>
                    <span>אופטימלי: {item.optimalLevel}</span>
                    {item.daysUntilRestock !== null && item.daysUntilRestock > 0 && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.daysUntilRestock} ימים עד הזמנה
                      </span>
                    )}
                  </div>
                  <Progress 
                    value={Math.min(item.stockPercentage, 100)} 
                    className="h-2"
                  />
                </div>
                {item.stockPercentage > 100 ? (
                  <TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0" />
                ) : item.stockPercentage < 50 ? (
                  <TrendingDown className="w-5 h-5 text-orange-500 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Suggestions */}
      {analytics.optimizationSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              הצעות לאופטימיזציה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.optimizationSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-r-4 border-blue-500"
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {suggestion.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}