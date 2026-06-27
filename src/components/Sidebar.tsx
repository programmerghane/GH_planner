import React from "react";
import {
  Home,
  CheckSquare,
  Calendar,
  Sparkles,
  User,
  Settings,
  Search,
  BookOpen,
  FolderHeart,
  HelpCircle,
  Menu,
  Trophy,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Theme } from "../lib/themes";
import { t, toPersianDigits } from "../lib/i18n";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: Theme;
  onOpenSearch: () => void;
  level: number;
  xp: number;
  lang?: "fa" | "en";
  usePersianNums?: boolean;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  theme,
  onOpenSearch,
  level,
  xp,
  lang = "fa",
  usePersianNums = true,
}: SidebarProps) {
  const isRTL = lang === "fa";
  const tabs = [
    { id: "home", label: t("home", lang), icon: Home },
    { id: "planner", label: t("planner", lang), icon: CheckSquare },
    { id: "calendar", label: t("calendar", lang), icon: Calendar },
    { id: "routines", label: lang === "fa" ? "برنامه ثابت" : "Routines", icon: RefreshCw },
    { id: "trackers", label: t("trackers", lang), icon: FolderHeart },
    { id: "notes", label: t("notes", lang), icon: BookOpen },
    { id: "missions", label: lang === "fa" ? "ماموریت‌ها" : "Missions", icon: Zap },
    { id: "ai", label: t("ai", lang), icon: Sparkles },
    { id: "achievements", label: lang === "fa" ? "تالار افتخار" : "Hall of Fame", icon: Trophy },
    { id: "profile", label: t("profile", lang), icon: User },
    { id: "settings", label: t("settings", lang), icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar Layout */}
      <aside 
        className={`hidden md:flex flex-col w-64 h-screen sticky top-0 ${
          isRTL ? "border-l border-r-0" : "border-r border-l-0"
        } border-slate-800/80 bg-slate-950/40 backdrop-blur-xl p-4 shrink-0 justify-between select-none`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-2 py-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="text-right">
              <h1 className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {isRTL ? "سامانه جی‌اچ" : "GH Planner"}
              </h1>
              <p className="text-[10px] text-indigo-400/80 font-mono tracking-widest uppercase">
                {isRTL ? "سیستم مدیریت زیستی" : "Life OS v1.0"}
              </p>
            </div>
          </div>

          {/* Quick search shortcut banner */}
          <button
            onClick={onOpenSearch}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 text-right text-slate-400 text-xs transition-all duration-150 mb-6`}
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              {isRTL ? "جستجوی سریع..." : "Quick search..."}
            </span>
            <kbd className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* Navigation Items List */}
          <nav className="space-y-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative ${
                    isActive
                      ? `text-white bg-slate-900 ${isRTL ? "border-r-2 border-l-0" : "border-l-2 border-r-0"} border-indigo-500 shadow-xs`
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <Icon
                    className={`w-4.5 h-4.5 transition-transform duration-150 ${
                      isActive ? "text-indigo-400 scale-105" : "text-slate-400"
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.id === "ai" && (
                    <span className={`${isRTL ? "mr-auto ml-0" : "ml-auto mr-0"} flex h-2 w-2 relative`}>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Level Indicator Footer */}
        <div className="border-t border-slate-800/80 pt-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-display font-semibold text-white text-xs">
              {isRTL ? `سطح ${toPersianDigits(level, usePersianNums)}` : `Lvl ${level}`}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-medium text-slate-300 truncate">
                  {isRTL ? "سطح کاربری زیستی" : "Life OS Level"}
                </span>
                <span className="font-mono text-indigo-400 font-semibold">
                  {toPersianDigits(xp, usePersianNums)} {isRTL ? "تجربه" : "XP"}
                </span>
              </div>
              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, xp % 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Unified Bottom Bar (Exactly 5 item slots as mandated) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/85 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 flex justify-around items-center select-none shadow-xl">
        {[
          { id: "home", label: isRTL ? "خانه" : "Home", icon: Home },
          { id: "planner", label: isRTL ? "برنامه‌ریز" : "Planner", icon: CheckSquare },
          { id: "ai", label: isRTL ? "هوش مصنوعی" : "Coach AI", icon: Sparkles },
          { id: "trackers", label: isRTL ? "ردیاب‌ها" : "Trackers", icon: FolderHeart },
          { id: "profile", label: isRTL ? "پروفایل" : "Profile", icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-xl transition-all duration-150 ${
                isActive
                  ? "text-indigo-400 scale-105"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-1 truncate">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
