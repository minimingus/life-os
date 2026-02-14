import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VoiceInput from "@/components/VoiceInput";
import { Plus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_ITEMS = [
  { name: "חלב", category: "dairy", unit: "units", location: "fridge", is_staple: true },
  { name: "לחם", category: "bread", unit: "units", location: "cabinet", is_staple: true },
  { name: "ביצים", category: "dairy", unit: "units", location: "fridge", is_staple: true },
  { name: "עגבניות", category: "vegetables", unit: "kg", location: "fridge" },
  { name: "מלפפון", category: "vegetables", unit: "units", location: "fridge" },
  { name: "בננות", category: "fruits", unit: "kg", location: "cabinet" },
  { name: "אורז", category: "pantry", unit: "kg", location: "pantry", is_staple: true },
  { name: "פסטה", category: "pantry", unit: "pack", location: "pantry", is_staple: true }
];

export default function QuickAddInventory({ onAdd }) {
  const [customName, setCustomName] = useState("");

  const handleQuickAdd = (template) => {
    onAdd({
      ...template,
      quantity: 1,
      min_quantity: template.is_staple ? 2 : 0,
      status: "ok"
    });
  };

  const handleCustomAdd = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;
    
    onAdd({
      name: customName,
      category: "other",
      quantity: 1,
      unit: "units",
      location: "pantry",
      status: "ok"
    });
    setCustomName("");
  };

  const handleVoiceResult = (text) => {
    // Parse voice input like "הוסף חלב" or just "חלב"
    const cleanText = text.replace(/הוסף|תוסיף|להוסיף/gi, '').trim();
    if (cleanText) {
      setCustomName(cleanText);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">הוספה מהירה</h3>
      </div>

      <form onSubmit={handleCustomAdd} className="flex gap-2 mb-3">
        <Input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="שם הפריט..."
          className="flex-1 bg-white dark:bg-slate-800"
        />
        <VoiceInput onResult={handleVoiceResult} placeholder="אמור שם פריט..." />
        <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
        </Button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {QUICK_ITEMS.map((item, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            onClick={() => handleQuickAdd(item)}
            className="h-auto py-2 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-slate-200 dark:border-slate-700"
          >
            <div className="flex flex-col items-center gap-1">
              <Plus className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span className="text-xs">{item.name}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}