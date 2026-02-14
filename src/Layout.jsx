import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { 
                  Home, 
                  ShoppingCart, 
                  Package, 
                  Wrench, 
                  FolderKanban, 
                  Receipt, 
                  Calendar, 
                  Users,
                  Menu,
                  X,
                  ChevronLeft,
                  Clock,
                  ListTodo,
                  MoreHorizontal,
                  Sparkles,
                  Bell,
                  Heart,
                  Wallet,
                  GraduationCap,
                  Search as SearchIcon
                } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const location = useLocation();

  const bottomTabItems = [
    { name: "בית", href: createPageUrl("Home"), icon: Home, page: "Home" },
    { name: "חיפוש", href: createPageUrl("Search"), icon: SearchIcon, page: "Search" },
    { name: "משימות", href: createPageUrl("Tasks"), icon: ListTodo, page: "Tasks" },
    { name: "קניות", href: createPageUrl("Shopping"), icon: ShoppingCart, page: "Shopping" },
  ];

  const moreItems = [
    { name: "הגדרות התראות", href: createPageUrl("NotificationSettings"), icon: Bell, page: "NotificationSettings" },
    { name: "בריאות המשפחה", href: createPageUrl("Health"), icon: Heart, page: "Health" },
    { name: "תקציב וכלכלה", href: createPageUrl("Budget"), icon: Wallet, page: "Budget" },
    { name: "חינוך ולמידה", href: createPageUrl("Education"), icon: GraduationCap, page: "Education" },
    { name: "דוחות AI", href: createPageUrl("AIReports"), icon: Sparkles, page: "AIReports" },
    { name: "התראות AI", href: createPageUrl("AISettings"), icon: Sparkles, page: "AISettings" },
    { name: "יומן משפחתי", href: createPageUrl("FamilyCalendar"), icon: Calendar, page: "FamilyCalendar" },
    { name: "אחזקת בית", href: createPageUrl("Repairs"), icon: Wrench, page: "Repairs" },
    { name: "פרויקטים", href: createPageUrl("Projects"), icon: FolderKanban, page: "Projects" },
    { name: "חשבונות", href: createPageUrl("Bills"), icon: Receipt, page: "Bills" },
    { name: "לוז משפחתי", href: createPageUrl("FamilyRoutine"), icon: Clock, page: "FamilyRoutine" },
    { name: "מערכת שעות", href: createPageUrl("SchoolSchedule"), icon: Calendar, page: "SchoolSchedule" },
    { name: "בני המשפחה", href: createPageUrl("Family"), icon: Users, page: "Family" },
  ];

  const allNavigation = [...bottomTabItems, ...moreItems];

  return (
    <div dir="rtl" className="min-h-screen bg-background dark:bg-slate-900">
      {/* Mobile Header */}
      <header 
        className="lg:hidden fixed top-0 right-0 left-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-center h-14">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">ניהול הבית</h1>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed top-0 right-0 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50 border-l border-slate-200 dark:border-slate-700">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">ניהול הבית</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">הכל במקום אחד</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {allNavigation.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-gradient-to-l from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30" 
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-blue-500"
                  )} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <ChevronLeft className="w-4 h-4 mr-auto" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="px-4 py-3 rounded-xl bg-gradient-to-l from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">משפחת</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">אברמוביץ 👨‍👩‍👧‍👦</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:mr-72 min-h-screen pb-20 lg:pb-8">
        <div 
          className="pt-20 lg:pt-8 px-4 lg:px-8"
          style={{ 
            paddingTop: 'calc(env(safe-area-inset-top) + 3.5rem)',
            minHeight: 'calc(100vh - env(safe-area-inset-bottom) - 5rem)'
          }}
        >
          {children}
        </div>
      </main>

      {/* Bottom Tab Bar - Mobile Only */}
      <nav 
        className="lg:hidden fixed bottom-0 right-0 left-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-16">
          {bottomTabItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors min-w-[44px] select-none",
                  isActive 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                <item.icon className={cn("w-6 h-6", isActive && "scale-110")} />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}

          <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors min-w-[44px] select-none",
                  moreItems.some(i => i.page === currentPageName) || ["NotificationSettings", "Health"].includes(currentPageName)
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                <MoreHorizontal className="w-6 h-6" />
                <span className="text-xs font-medium">עוד</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[70vh] bg-white dark:bg-slate-900" dir="rtl">
              <div className="py-4 space-y-1">
                {moreItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={item.href}
                      onClick={() => setMoreSheetOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-4 rounded-xl transition-all min-h-[44px]",
                        isActive 
                          ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" 
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <item.icon className="w-6 h-6 flex-shrink-0" />
                      <span className="font-medium text-base">{item.name}</span>
                      {isActive && (
                        <ChevronLeft className="w-5 h-5 mr-auto" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}