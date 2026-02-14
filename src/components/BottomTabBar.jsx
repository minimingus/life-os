import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Home, ListTodo, ShoppingCart, Users, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function BottomTabBar({ navigation }) {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const mainTabs = [
    { name: "דף הבית", href: createPageUrl("Home"), icon: Home, page: "Home" },
    { name: "משימות", href: createPageUrl("Tasks"), icon: ListTodo, page: "Tasks" },
    { name: "קניות", href: createPageUrl("Shopping"), icon: ShoppingCart, page: "Shopping" },
    { name: "משפחה", href: createPageUrl("Family"), icon: Users, page: "Family" },
  ];

  const moreTabs = navigation.filter(
    nav => !mainTabs.find(tab => tab.page === nav.page)
  );

  const isActive = (page) => {
    return location.pathname.includes(page.toLowerCase());
  };

  return (
    <nav 
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 h-16">
        {mainTabs.map((tab) => {
          const active = isActive(tab.page);
          return (
            <Link
              key={tab.name}
              to={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all select-none min-w-[60px]",
                active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400"
              )}
            >
              <tab.icon className={cn("w-5 h-5", active && "scale-110")} />
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          );
        })}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all select-none min-w-[60px]",
                "text-slate-600 dark:text-slate-400"
              )}
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium">עוד</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh]" dir="rtl">
            <SheetHeader>
              <SheetTitle>כל העמודים</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-2">
              {navigation.map((item) => {
                const active = isActive(item.page);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all select-none",
                      active
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}