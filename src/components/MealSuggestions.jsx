import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChefHat, Clock, Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const difficultyConfig = {
  "קל": { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: "👍" },
  "בינוני": { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: "👌" },
  "מאתגר": { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: "🔥" }
};

export default function MealSuggestions() {
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["mealSuggestions"],
    queryFn: async () => {
      const response = await base44.functions.invoke("getMealSuggestions");
      return response.data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const handleMealClick = (meal) => {
    setSelectedMeal(meal);
    setShowDialog(true);
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="mr-3 text-slate-600 dark:text-slate-400">מחפש מתכונים...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const meals = data?.suggestions || [];

  if (meals.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <ChefHat className="w-12 h-12 mx-auto mb-3 text-orange-400" />
            <p className="text-slate-600 dark:text-slate-400">אין מספיק מצרכים למתכונים</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-3"
            >
              נסה שוב
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">מה מבשלים היום?</CardTitle>
                <p className="text-xs text-slate-600 dark:text-slate-400">המלצות AI בהתבסס על המלאי</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-orange-600 dark:text-orange-400"
            >
              <Sparkles className="w-4 h-4 ml-1" />
              רעננן
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {meals.map((meal, idx) => {
            const diffConfig = difficultyConfig[meal.difficulty] || difficultyConfig["בינוני"];
            return (
              <button
                key={idx}
                onClick={() => handleMealClick(meal)}
                className="w-full text-right bg-white dark:bg-slate-800 rounded-xl p-4 border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">{meal.name}</h4>
                  <Badge className={cn("text-xs", diffConfig.color)}>
                    {diffConfig.icon} {meal.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{meal.prep_time} דקות</span>
                  </div>
                  <span>•</span>
                  <span>{meal.ingredients?.length || 0} מרכיבים</span>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Recipe Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-orange-500" />
              {selectedMeal?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMeal && (
            <div className="space-y-6">
              {/* Info */}
              <div className="flex gap-3">
                <Badge className={cn("text-sm", difficultyConfig[selectedMeal.difficulty]?.color)}>
                  {difficultyConfig[selectedMeal.difficulty]?.icon} {selectedMeal.difficulty}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  <Clock className="w-3 h-3 ml-1" />
                  {selectedMeal.prep_time} דקות
                </Badge>
              </div>

              {/* Ingredients */}
              <div>
                <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-slate-100">מרכיבים</h3>
                <ul className="space-y-2">
                  {selectedMeal.ingredients?.map((ingredient, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-slate-100">הוראות הכנה</h3>
                <ol className="space-y-3">
                  {selectedMeal.instructions?.map((step, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 flex-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tips */}
              {selectedMeal.tips && (
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  <h3 className="font-bold text-sm mb-2 text-amber-900 dark:text-amber-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    טיפ מקצועי
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-300">{selectedMeal.tips}</p>
                </div>
              )}

              <Button
                onClick={() => setShowDialog(false)}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                סגור
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}