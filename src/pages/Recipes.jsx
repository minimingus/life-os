import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ChefHat, 
  Plus, 
  Trash2, 
  Clock, 
  Users, 
  Star, 
  Search,
  Upload,
  ShoppingCart,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = {
  breakfast: { label: "ארוחת בוקר", color: "bg-yellow-100 text-yellow-600" },
  lunch: { label: "צהריים", color: "bg-orange-100 text-orange-600" },
  dinner: { label: "ערב", color: "bg-purple-100 text-purple-600" },
  dessert: { label: "קינוח", color: "bg-pink-100 text-pink-600" },
  snack: { label: "חטיף", color: "bg-green-100 text-green-600" },
  drink: { label: "משקה", color: "bg-blue-100 text-blue-600" },
  other: { label: "אחר", color: "bg-slate-100 text-slate-600" }
};

const DIFFICULTY = {
  easy: { label: "קל", color: "bg-green-100 text-green-600" },
  medium: { label: "בינוני", color: "bg-yellow-100 text-yellow-600" },
  hard: { label: "מתקדם", color: "bg-red-100 text-red-600" }
};

export default function Recipes() {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    category: "other",
    cuisine: "",
    prep_time: "",
    cook_time: "",
    servings: "",
    difficulty: "medium",
    ingredients: [],
    instructions: "",
    notes: "",
    image_url: "",
    tags: [],
    source: "",
    is_favorite: false
  });
  const [ingredientInput, setIngredientInput] = useState({ name: "", amount: "" });
  const [tagInput, setTagInput] = useState("");

  const queryClient = useQueryClient();

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: () => base44.entities.Recipe.list("-created_date")
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Recipe.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Recipe.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Recipe.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] })
  });

  const resetForm = () => {
    setShowDialog(false);
    setEditItem(null);
    setFormData({
      title: "",
      category: "other",
      cuisine: "",
      prep_time: "",
      cook_time: "",
      servings: "",
      difficulty: "medium",
      ingredients: [],
      instructions: "",
      notes: "",
      image_url: "",
      tags: [],
      source: "",
      is_favorite: false
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      prep_time: formData.prep_time ? parseInt(formData.prep_time) : null,
      cook_time: formData.cook_time ? parseInt(formData.cook_time) : null,
      servings: formData.servings ? parseInt(formData.servings) : null
    };
    
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      title: item.title || "",
      category: item.category || "other",
      cuisine: item.cuisine || "",
      prep_time: item.prep_time || "",
      cook_time: item.cook_time || "",
      servings: item.servings || "",
      difficulty: item.difficulty || "medium",
      ingredients: item.ingredients || [],
      instructions: item.instructions || "",
      notes: item.notes || "",
      image_url: item.image_url || "",
      tags: item.tags || [],
      source: item.source || "",
      is_favorite: item.is_favorite || false
    });
    setShowDialog(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
    }
  };

  const addIngredient = () => {
    if (ingredientInput.name) {
      setFormData({
        ...formData,
        ingredients: [...formData.ingredients, ingredientInput]
      });
      setIngredientInput({ name: "", amount: "" });
    }
  };

  const removeIngredient = (index) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    });
  };

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput]
      });
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const addToShopping = async (recipe) => {
    for (const ingredient of recipe.ingredients || []) {
      await base44.entities.ShoppingItem.create({
        name: ingredient.name,
        quantity: ingredient.amount,
        notes: `מהמתכון: ${recipe.title}`
      });
    }
    alert(`${recipe.ingredients?.length || 0} רכיבים נוספו לרשימת הקניות`);
  };

  const filteredRecipes = recipes
    .filter(r => filterCategory === "all" || r.category === filterCategory)
    .filter(r => 
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="מתכונים"
        subtitle={`${recipes.length} מתכונים`}
        action={() => setShowDialog(true)}
        actionLabel="מתכון חדש"
      />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש מתכונים..."
            className="pr-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקטגוריות</SelectItem>
            {Object.entries(CATEGORIES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {recipes.length === 0 && !isLoading ? (
        <EmptyState
          icon={ChefHat}
          title="אין מתכונים"
          description="התחל לאסוף את המתכונים האהובים עליך"
          action={() => setShowDialog(true)}
          actionLabel="הוסף מתכון"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map(recipe => {
            const categoryConfig = CATEGORIES[recipe.category] || CATEGORIES.other;
            const difficultyConfig = DIFFICULTY[recipe.difficulty] || DIFFICULTY.medium;
            
            return (
              <div
                key={recipe.id}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => openEdit(recipe)}
              >
                {recipe.image_url ? (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={recipe.image_url} 
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <ChefHat className="w-16 h-16 text-slate-300" />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-slate-800 line-clamp-1">{recipe.title}</h3>
                    {recipe.is_favorite && (
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={cn(categoryConfig.color, "border-0 text-xs")}>
                      {categoryConfig.label}
                    </Badge>
                    <Badge className={cn(difficultyConfig.color, "border-0 text-xs")}>
                      {difficultyConfig.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {recipe.prep_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {recipe.prep_time} דק'
                      </span>
                    )}
                    {recipe.servings && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {recipe.servings} מנות
                      </span>
                    )}
                  </div>

                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {recipe.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addToShopping(recipe)}
                      className="flex-1"
                    >
                      <ShoppingCart className="w-4 h-4 ml-1" />
                      לקניות
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(recipe.id)}
                      className="text-rose-500 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editItem ? "עריכת מתכון" : "מתכון חדש"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">שם המתכון</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="למשל: פסטה ברוטב עגבניות"
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">קטגוריה</label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">רמת קושי</label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(v) => setFormData({ ...formData, difficulty: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DIFFICULTY).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">הכנה (דק')</label>
                <Input
                  type="number"
                  value={formData.prep_time}
                  onChange={(e) => setFormData({ ...formData, prep_time: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">בישול (דק')</label>
                <Input
                  type="number"
                  value={formData.cook_time}
                  onChange={(e) => setFormData({ ...formData, cook_time: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">מנות</label>
                <Input
                  type="number"
                  value={formData.servings}
                  onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">רכיבים</label>
              <div className="space-y-2">
                {formData.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <span className="flex-1 text-sm">{ing.name}</span>
                    <span className="text-sm text-slate-500">{ing.amount}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeIngredient(i)}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={ingredientInput.name}
                    onChange={(e) => setIngredientInput({ ...ingredientInput, name: e.target.value })}
                    placeholder="שם הרכיב"
                    className="flex-1"
                  />
                  <Input
                    value={ingredientInput.amount}
                    onChange={(e) => setIngredientInput({ ...ingredientInput, amount: e.target.value })}
                    placeholder="כמות"
                    className="w-24"
                  />
                  <Button type="button" onClick={addIngredient} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">הוראות הכנה</label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="תאר את שלבי ההכנה..."
                className="mt-1"
                rows={5}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">תגיות</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {tag}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="הוסף תגית (צמחוני, טבעוני...)"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">תמונה</label>
              {formData.image_url ? (
                <div className="mt-2">
                  <img src={formData.image_url} alt="Recipe" className="w-full h-48 object-cover rounded-lg" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({ ...formData, image_url: "" })}
                    className="mt-2"
                  >
                    הסר תמונה
                  </Button>
                </div>
              ) : (
                <label className="mt-2 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">העלה תמונה</span>
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600">
                {editItem ? "עדכן" : "הוסף"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                ביטול
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}