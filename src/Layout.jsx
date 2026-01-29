import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import OfflineIndicator from "./components/OfflineIndicator";
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
              ListTodo
            } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "דף הבית", href: createPageUrl("Home"), icon: Home, page: "Home" },
    { name: "משימות", href: createPageUrl("Tasks"), icon: ListTodo, page: "Tasks" },
    { name: "רשימת קניות", href: createPageUrl("Shopping"), icon: ShoppingCart, page: "Shopping" },
    { name: "מלאי בבית", href: createPageUrl("Inventory"), icon: Package, page: "Inventory" },
    { name: "אחזקת בית", href: createPageUrl("Repairs"), icon: Wrench, page: "Repairs" },
    { name: "פרויקטים", href: createPageUrl("Projects"), icon: FolderKanban, page: "Projects" },
    { name: "חשבונות", href: createPageUrl("Bills"), icon: Receipt, page: "Bills" },
    { name: "יומן משפחתי", href: createPageUrl("FamilyCalendar"), icon: Calendar, page: "FamilyCalendar" },
    { name: "לוז משפחתי", href: createPageUrl("FamilyRoutine"), icon: Clock, page: "FamilyRoutine" },
    { name: "מערכת שעות", href: createPageUrl("SchoolSchedule"), icon: Calendar, page: "SchoolSchedule" },
    { name: "בני המשפחה", href: createPageUrl("Family"), icon: Users, page: "Family" },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <style>{`
        :root {
          --primary: 215 80% 45%;
          --primary-light: 215 85% 55%;
          --accent: 165 80% 40%;
          --warm: 35 90% 55%;
        }
      `}</style>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 right-0 left-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800">ניהול הבית</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 right-0 h-full z-50 w-72 bg-white shadow-2xl shadow-slate-200/50 transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">ניהול הבית</h1>
                  <p className="text-xs text-slate-500">הכל במקום אחד</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-gradient-to-l from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-blue-500"
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
          <div className="p-4 border-t border-slate-100">
            <div className="px-4 py-3 rounded-xl bg-gradient-to-l from-blue-50 to-indigo-50">
              <p className="text-xs text-slate-500">משפחת</p>
              <p className="text-sm font-semibold text-slate-700">אברמוביץ 👨‍👩‍👧‍👦</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:mr-72 min-h-screen">
        <div className="pt-20 lg:pt-8 pb-8 px-4 lg:px-8">
          {children}
        </div>
      </main>

      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}