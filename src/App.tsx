import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  Flame,
  Search,
  Sliders,
  Award,
  Clock,
  Compass,
  Trophy,
  Smile,
  LogOut,
  Calendar,
  CheckCircle,
  Plus,
  ArrowUp,
  CloudLightning,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

import { AppState, Task, Goal, Habit, TrackerEntry, Note, JournalEntry, UserProfile, Achievement, ActivityLog } from "./types";
import { PREMIUM_THEMES, Theme } from "./lib/themes";
import { t, toPersianDigits, gregorianToShamsi, SHAMSI_MONTHS, getPersianNumericDate } from "./lib/i18n";

import Sidebar from "./components/Sidebar";
import CommandPalette from "./components/CommandPalette";
import PlannerSystem from "./components/PlannerSystem";
import CalendarSystem from "./components/CalendarSystem";
import CustomTrackers from "./components/CustomTrackers";
import NoteSystem from "./components/NoteSystem";
import JournalSystem from "./components/JournalSystem";
import AIPrediction from "./components/AIPrediction";
import AIGameMaster from "./components/AIGameMaster";
import FixedRoutines from "./components/FixedRoutines";
import ProfileSystem from "./components/ProfileSystem";
import SettingsSystem from "./components/SettingsSystem";
import AuthSystem from "./components/AuthSystem";

const DEFAULT_STATE: AppState = {
  tasks: [],
  goals: [],
  habits: [],
  trackerTypes: [],
  trackerEntries: [],
  notes: [],
  journalEntries: [],
  profile: {
    name: "Explorer",
    avatar: "",
    level: 1,
    xp: 0,
    rank: "Beginner",
    streakCount: 0,
    longestStreak: 0,
    freezeTokens: 0,
    productivityScore: 0,
    lifeScore: 0,
    joinedDate: new Date().toISOString(),
  },
  achievements: [],
  activityLogs: [],
  countdowns: [],
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem("gh_planner_user_id"));
  const [langState, setLangState] = useState<"fa" | "en">(() => (localStorage.getItem("gh_planner_lang") as "fa" | "en") || "fa");

  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<Theme>(PREMIUM_THEMES[0]);
  const [loading, setLoading] = useState(true);

  // Widget customizer states
  const [showLayoutCustomizer, setShowLayoutCustomizer] = useState(false);
  const [widgets, setWidgets] = useState([
    { id: "briefing", name: "AI Daily Briefing", visible: true },
    { id: "quick_actions", name: "Quick Actions", visible: true },
    { id: "schedule", name: "Planner Schedule", visible: true },
    { id: "countdowns", name: "Target Countdowns", visible: true },
    { id: "scores", name: "Life OS Scores", visible: true },
  ]);

  // AI Daily Briefing text local storage cached
  const [aiBriefing, setAiBriefing] = useState<{
    summary: string;
    mostImportantTask: string;
    productivityAdvice: string;
    freeTimeAdvice: string;
    warning: string;
  } | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);

  // Countdown creation states
  const [showAddCountdown, setShowAddCountdown] = useState(false);
  const [countdownTitle, setCountdownTitle] = useState("");
  const [countdownDate, setCountdownDate] = useState("");

  // Load state from DB on start
  useEffect(() => {
    async function init() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const headers: HeadersInit = {};
        const userId = localStorage.getItem("gh_planner_user_id");
        if (userId) {
          headers["x-user-id"] = userId;
        }
        const res = await fetch("/api/state", { headers });
        if (res.ok) {
          const data = await res.json();
          // Handle both {state: {...}} and direct state formats
          const appState = data.state || data;
          if (appState && appState.profile) {
            setState({
              ...DEFAULT_STATE,
              ...appState,
              profile: { ...DEFAULT_STATE.profile, ...(appState.profile || {}) },
              tasks: appState.tasks || [],
              goals: appState.goals || [],
              habits: appState.habits || [],
              notes: appState.notes || [],
              trackerTypes: appState.trackerTypes || [],
              trackerEntries: appState.trackerEntries || [],
              achievements: appState.achievements || [],
              activityLogs: appState.activityLogs || [],
              countdowns: appState.countdowns || [],
            });
            if (appState.profile?.themeId) {
              const match = PREMIUM_THEMES.find((t) => t.id === appState.profile.themeId);
              if (match) setActiveTheme(match);
            }
            if (appState.profile?.language) {
              setLangState(appState.profile.language);
            }
          }
        }
      } catch (err) {
        console.error("Using offline state cache from localStorage:", err);
        const cached = localStorage.getItem("gh_planner_state");
        if (cached) {
          setState(JSON.parse(cached));
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [isAuthenticated]);

  // Hotkey listener for Ctrl+K search palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Save/Sync state back to Server API & Local Cache
  const triggerSync = async (updated: AppState) => {
    setState(updated);
    localStorage.setItem("gh_planner_state", JSON.stringify(updated));

    if (!isAuthenticated) return;

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      const userId = localStorage.getItem("gh_planner_user_id");
      if (userId) {
        headers["x-user-id"] = userId;
      }
      await fetch("/api/state", {
        method: "POST",
        headers,
        body: JSON.stringify({ state: updated }),
      });
    } catch (err) {
      console.warn("Sync queued. Running in offline draft mode.");
    }
  };

  // Manage custom countdowns
  const handleAddCountdown = () => {
    if (!countdownTitle.trim() || !countdownDate) return;
    const newCountdown = {
      id: "countdown_" + Math.random().toString(36).substring(2, 9),
      title: countdownTitle.trim(),
      date: countdownDate,
    };
    const updatedCountdowns = [...(state.countdowns || []), newCountdown];
    triggerSync({ ...state, countdowns: updatedCountdowns });
    setCountdownTitle("");
    setCountdownDate("");
    setShowAddCountdown(false);
  };

  const handleDeleteCountdown = (id: string) => {
    const updatedCountdowns = (state.countdowns || []).filter((c) => c.id !== id);
    triggerSync({ ...state, countdowns: updatedCountdowns });
  };

  // Gamification Engine: Adds XP points to profile and manages levels/ranks
  const addXP = (amount: number, type: string, description: string) => {
    const profile = { ...state.profile };
    const logs = [...state.activityLogs];

    profile.xp += amount;
    const previousLevel = profile.level;
    const newLevel = Math.floor(profile.xp / 100) + 1;
    profile.level = newLevel;

    // Check rank promotions
    if (newLevel >= 10) {
      profile.rank = "Legend";
    } else if (newLevel >= 8) {
      profile.rank = "Expert";
    } else if (newLevel >= 6) {
      profile.rank = "Skilled";
    } else if (newLevel >= 4) {
      profile.rank = "Apprentice";
    } else if (newLevel >= 2) {
      profile.rank = "Explorer";
    } else {
      profile.rank = "Beginner";
    }

    if (newLevel > previousLevel) {
      profile.freezeTokens += 1;
      alert(`🎉 LEVEL UP! You reached Level ${newLevel}! Earned +1 Streak Freeze token.`);
    }

    // Insert activity log
    logs.push({
      id: "log_" + Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString().split("T")[0],
      xpGained: amount,
      activityType: type,
      description,
    });

    // Check achievement progress
    const achievements = state.achievements.map((ach) => {
      let progress = ach.progress;
      if (ach.id === "task_1" && type === "task") progress = Math.min(ach.maxProgress, progress + 1);
      if (ach.id === "task_10" && type === "task") progress = Math.min(ach.maxProgress, progress + 1);
      if (ach.id === "legendary_os") progress = Math.min(ach.maxProgress, newLevel);

      const isUnlockedNow = !ach.unlocked && progress >= ach.maxProgress;
      if (isUnlockedNow) {
        setTimeout(() => {
          alert(`🏆 Achievement Unlocked: ${ach.title}!`);
        }, 300);
      }

      return {
        ...ach,
        progress,
        unlocked: ach.unlocked || isUnlockedNow,
        unlockedAt: isUnlockedNow ? new Date().toISOString() : ach.unlockedAt,
      };
    });

    // Recalculate Productivity and Life scores
    const doneTasksCount = state.tasks.filter((t) => t.status === "done").length;
    profile.productivityScore = state.tasks.length > 0 ? Math.round((doneTasksCount / state.tasks.length) * 100) : 100;

    const journalCount = state.journalEntries.length;
    profile.lifeScore = journalCount > 0 ? Math.round((state.journalEntries.reduce((acc, curr) => acc + curr.mood, 0) / journalCount) * 10) : 100;

    triggerSync({
      ...state,
      profile,
      activityLogs: logs,
      achievements,
    });
  };

  const handleUpdateTasks = (updatedTasks: Task[], xpReward = 0) => {
    let updatedState = { ...state, tasks: updatedTasks };
    if (xpReward > 0) {
      // Calculate XP inline to avoid double sync
      const profile = { ...updatedState.profile };
      profile.xp = (profile.xp || 0) + xpReward;
      profile.level = Math.floor(profile.xp / 100) + 1;
      // Recalculate productivity
      const doneCount = updatedTasks.filter(t => t.status === "done").length;
      profile.productivityScore = updatedTasks.length > 0 
        ? Math.round((doneCount / updatedTasks.length) * 100) 
        : 0;
      updatedState = { ...updatedState, profile };
    }
    triggerSync(updatedState);
  };

  // Generate real-time AI daily summary calling server proxy
  const loadBriefing = async () => {
    setBriefingLoading(true);
    try {
      const response = await fetch("/api/gemini/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      if (!response.ok) throw new Error("Briefing API error");
      const data = await response.json();
      setAiBriefing(data);
    } catch (err) {
      console.error(err);
      setAiBriefing({
        summary: "Your study schedule looks tidy. Log sleep duration tonight.",
        mostImportantTask: state.tasks.find((t) => t.priority === "critical")?.title || "Complete standard daily planner blocks",
        productivityAdvice: "Tackle high energy slots first.",
        freeTimeAdvice: "Expected rest slots: 16:00 to 18:00.",
        warning: "Maintain hydration metrics! Ensure you log water intake.",
      });
    } finally {
      setBriefingLoading(false);
    }
  };

  // Automatically load briefing on start or when tasks lists update
  useEffect(() => {
    if (state.tasks.length > 0) {
      loadBriefing();
    }
  }, [state.tasks.length]);

  // Greetings depending on hourly clocks
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getGreetingKey = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "greetingMorning";
    if (hour < 18) return "greetingAfternoon";
    return "greetingEvening";
  };

  // Persian Solar Calendar Label
  const getPersianDateLabel = () => {
    const today = new Date();
    const { jy, jm, jd } = gregorianToShamsi(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const monthName = SHAMSI_MONTHS[jm - 1];
    const written = `${toPersianDigits(jd, usePersianNums)} ${monthName}، ${toPersianDigits(jy, usePersianNums)}`;
    const numeric = getPersianNumericDate(today, usePersianNums);
    return `${written} (${numeric})`;
  };

  // Widget layout order re-arrangers
  const moveWidget = (idx: number, direction: "up" | "down") => {
    const reordered = [...widgets];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= widgets.length) return;

    const temp = reordered[idx];
    reordered[idx] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    setWidgets(reordered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Sparkles className="w-12 h-12 text-indigo-400 animate-spin-slow" />
        <h2 className="text-white font-display font-semibold tracking-tight">
          Booting GH Planner Life OS...
        </h2>
        <p className="text-xs text-slate-500">Checking cloud storage & sync lines</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthSystem
        lang={langState}
        setLang={(l) => {
          setLangState(l);
          localStorage.setItem("gh_planner_lang", l);
        }}
        onLoginSuccess={(profile, fullState) => {
          const uid = profile?.id || profile?.userId || localStorage.getItem("gh_planner_user_id") || "";
          if (uid) localStorage.setItem("gh_planner_user_id", uid);
          localStorage.setItem("gh_planner_lang", profile?.language || "fa");
          if (profile?.language) setLangState(profile.language);
          if (fullState) {
            // Merge fullState with DEFAULT_STATE to prevent null errors
            setState({
              ...DEFAULT_STATE,
              ...fullState,
              profile: {
                ...DEFAULT_STATE.profile,
                ...(fullState.profile || {}),
                ...profile,
                id: uid,
              },
              tasks: fullState.tasks || [],
              goals: fullState.goals || [],
              habits: fullState.habits || [],
              notes: fullState.notes || [],
              trackerTypes: fullState.trackerTypes || DEFAULT_STATE.trackerTypes || [],
              trackerEntries: fullState.trackerEntries || [],
              achievements: fullState.achievements || [],
              activityLogs: fullState.activityLogs || [],
              countdowns: fullState.countdowns || [],
            });
          } else {
            setState((prev) => ({
              ...prev,
              profile: { ...prev.profile, ...profile, id: uid }
            }));
          }
          if (profile?.themeId) {
            const match = PREMIUM_THEMES.find((t) => t.id === profile.themeId);
            if (match) setActiveTheme(match);
          }
          setIsAuthenticated(true);
        }}
      />
    );
  }

  const lang = state.profile?.language || "fa";
  const usePersianNums = state.profile?.usePersianNumerals !== false;
  const isRTL = lang === "fa";

  return (
    <div 
      dir={isRTL ? "rtl" : "ltr"}
      className={`min-h-screen ${activeTheme.background} flex flex-col md:flex-row transition-all duration-300 ${isRTL ? "font-sans" : ""}`}
    >
      {/* Sidebar component - Desktop layout sticky side, mobile bot bar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={activeTheme}
        onOpenSearch={() => setIsSearchOpen(true)}
        level={state.profile.level}
        xp={state.profile.xp}
        lang={lang}
        usePersianNums={usePersianNums}
      />

      {/* Main Screen layout container */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Active Tab Router */}
          {activeTab === "home" && (
            <div className="space-y-6 text-right">
              {/* Header section widget with dates and greeting */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-6">
                <div>
                  <h1 className="text-3xl font-display font-extrabold tracking-tight text-white">
                    {lang === "fa" ? `${t(getGreetingKey(), lang)}، ${state.profile.name}` : `${getGreeting()}, Commander ${state.profile.name}`}
                  </h1>
                  <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>{lang === "fa" ? getPersianDateLabel() : new Date().toDateString()}</span>
                    {lang === "fa" && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="text-indigo-400 font-medium font-mono">
                          {new Date().toLocaleDateString("en-US")}
                        </span>
                      </>
                    )}
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400 font-mono">
                      {lang === "fa" ? "⛅ ۲۴ درجه سانتی‌گراد، تهران" : "⛅ 24°C, Tehran"}
                    </span>
                  </p>
                </div>

                {/* Customize layout drawer toggle */}
                <button
                  onClick={() => setShowLayoutCustomizer(!showLayoutCustomizer)}
                  className="bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-800 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                  {t("customizeWidgets", lang)}
                </button>
              </div>

              {/* Customizable Widgets Layout */}
              {showLayoutCustomizer && (
                <div className="bg-slate-900/60 border border-indigo-500/20 p-5 rounded-2xl space-y-3.5 text-right">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                    {t("widgetOrganizer", lang)}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t("widgetOrganizerDesc", lang)}
                  </p>

                  <div className="space-y-2">
                    {widgets.map((widget, idx) => (
                      <div
                        key={widget.id}
                        className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={widget.visible}
                            onChange={(e) => {
                              const updated = [...widgets];
                              updated[idx].visible = e.target.checked;
                              setWidgets(updated);
                            }}
                            className="rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-800 cursor-pointer"
                          />
                          <span className="font-semibold text-slate-200">
                            {widget.id === "briefing" ? t("aiCommanderBriefing", lang) : 
                             widget.id === "quick_actions" ? t("quickAddActions", lang) :
                             widget.id === "schedule" ? t("todaysTasks", lang) :
                             widget.id === "countdowns" ? t("targetCountdowns", lang) :
                             t("lifeOsScores", lang)}
                          </span>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => moveWidget(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 rounded bg-slate-900 text-slate-400 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveWidget(idx, "down")}
                            disabled={idx === widgets.length - 1}
                            className="p-1 rounded bg-slate-900 text-slate-400 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Render widgets in order */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {widgets.map((widget) => {
                  if (!widget.visible) return null;

                  if (widget.id === "briefing") {
                    return (
                      <div
                        key="briefing"
                        className="md:col-span-2 bg-gradient-to-br from-indigo-950/25 to-purple-950/25 border border-indigo-900/40 p-5 rounded-2xl relative overflow-hidden text-right"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                          <Sparkles className="w-24 h-24 text-indigo-400" />
                        </div>

                        <div className="flex justify-between items-center pb-3 border-b border-indigo-900/40">
                          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 animate-spin-slow" />
                            {t("aiCommanderBriefing", lang)}
                          </h3>

                          <button
                            onClick={loadBriefing}
                            disabled={briefingLoading}
                            className="text-[10px] bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-mono font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                          >
                            {briefingLoading ? t("revising", lang) : t("forceRefresh", lang)}
                          </button>
                        </div>

                        <div className="mt-4 space-y-4 text-xs">
                          {briefingLoading ? (
                            <p className="text-indigo-300 animate-pulse">
                              {t("consultingTwin", lang)}
                            </p>
                          ) : aiBriefing ? (
                            <>
                              <p className="text-slate-200 leading-relaxed font-medium text-sm">
                                "{aiBriefing.summary}"
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900">
                                  <span className="text-slate-500 text-[10px] uppercase block mb-1">
                                    {t("primaryTaskTarget", lang)}
                                  </span>
                                  <p className="font-semibold text-slate-200 truncate">
                                    {aiBriefing.mostImportantTask}
                                  </p>
                                </div>

                                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900">
                                  <span className="text-slate-500 text-[10px] uppercase block mb-1">
                                    {t("restBufferSlots", lang)}
                                  </span>
                                  <p className="font-semibold text-slate-200 truncate">
                                    {aiBriefing.freeTimeAdvice}
                                  </p>
                                </div>
                              </div>

                              <p className="text-[11px] text-amber-400 mt-2 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 italic">
                                💡 {t("warningAdvice", lang)}: {aiBriefing.warning}
                              </p>
                            </>
                          ) : (
                            <div className="py-2">
                              <button
                                onClick={loadBriefing}
                                className="bg-indigo-600 text-white text-xs px-4 py-2 rounded-xl font-semibold"
                              >
                                Generate AI Daily Briefing
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (widget.id === "quick_actions") {
                    return (
                      <div
                        key="quick_actions"
                        className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4 text-right"
                      >
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {t("quickAddActions", lang)}
                        </h3>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setActiveTab("planner");
                            }}
                            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-850 hover:border-slate-700 text-right transition-all cursor-pointer"
                          >
                            <span className="text-xs font-bold text-slate-200 block">
                              {lang === "fa" ? `+ ${t("addTask", lang)}` : `+ Task`}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {t("addActivity", lang)}
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab("trackers");
                            }}
                            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-850 hover:border-slate-700 text-right transition-all cursor-pointer"
                          >
                            <span className="text-xs font-bold text-slate-200 block">
                              {lang === "fa" ? `+ ${t("addJournal", lang)}` : `+ Journal`}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {t("reflectionLog", lang)}
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab("notes");
                            }}
                            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-850 hover:border-slate-700 text-right transition-all cursor-pointer"
                          >
                            <span className="text-xs font-bold text-slate-200 block">
                              {lang === "fa" ? `+ ${t("addNote", lang)}` : `+ Note`}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {t("draftFile", lang)}
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab("ai");
                            }}
                            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-850 hover:border-slate-700 text-right transition-all cursor-pointer"
                          >
                            <span className="text-xs font-bold text-purple-400 block">
                              {t("askTwin", lang)}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {t("consultAiCoach", lang)}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (widget.id === "schedule") {
                    return (
                      <div
                        key="schedule"
                        className="md:col-span-2 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4 text-right"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {t("todaysTasks", lang)}
                          </h3>
                          <button
                            onClick={() => setActiveTab("planner")}
                            className="text-[10px] text-indigo-400 font-bold hover:underline cursor-pointer"
                          >
                            {t("viewPlanner", lang)}
                          </button>
                        </div>

                        <div className="space-y-2 max-h-[180px] overflow-y-auto">
                          {state.tasks.filter((t) => t.status !== "done").length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-6 text-center">
                              {t("noPendingTasks", lang)}
                            </p>
                          ) : (
                            state.tasks
                              .filter((t) => t.status !== "done")
                              .slice(0, 3)
                              .map((task) => (
                                <div
                                  key={task.id}
                                  className="p-3 rounded-xl bg-slate-950/40 border border-slate-850 flex items-center justify-between text-xs"
                                >
                                  <div className="text-right">
                                    <p className="font-semibold text-slate-200">
                                      {task.title}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                      {t("category", lang)}: {task.category || "General"} • {t("priority", lang)}: {task.priority}
                                    </p>
                                  </div>

                                  <button
                                    onClick={() => {
                                      // Toggle task done
                                      const updated = state.tasks.map((t) => {
                                        if (t.id === task.id) return { ...t, status: "done" as const, progress: 100 };
                                        return t;
                                      });
                                      handleUpdateTasks(updated, 25);
                                    }}
                                    className="bg-slate-900 hover:bg-indigo-600 hover:text-white px-2.5 py-1 rounded-lg text-slate-400 text-[10px] transition-all cursor-pointer"
                                  >
                                    {t("done", lang)}
                                  </button>
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (widget.id === "countdowns") {
                    const countdownList = state.countdowns || [];
                    
                    const getDaysLeft = (targetDateStr: string) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const target = new Date(targetDateStr);
                      target.setHours(0, 0, 0, 0);
                      const diffTime = target.getTime() - today.getTime();
                      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    };

                    return (
                      <div
                        key="countdowns"
                        className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4 text-right"
                      >
                        <div className="flex justify-between items-center">
                          {!showAddCountdown && (
                            <button
                              onClick={() => setShowAddCountdown(true)}
                              className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <Plus className="w-3 h-3" />
                              {lang === "fa" ? "افزودن" : "Add"}
                            </button>
                          )}
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {t("targetCountdowns", lang)}
                          </h3>
                        </div>

                        {showAddCountdown && (
                          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-right">
                            <p className="text-[10px] font-bold text-slate-400">{lang === "fa" ? "شمارش معکوس جدید" : "New Target Countdown"}</p>
                            <input
                              type="text"
                              required
                              placeholder={lang === "fa" ? "عنوان رویداد (مثلاً آزمون فیزیک)" : "Event title (e.g. Exam)"}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60 text-right"
                              value={countdownTitle}
                              onChange={(e) => setCountdownTitle(e.target.value)}
                            />
                            <input
                              type="date"
                              required
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60 text-right"
                              value={countdownDate}
                              onChange={(e) => setCountdownDate(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end pt-1">
                              <button
                                onClick={() => {
                                  setShowAddCountdown(false);
                                  setCountdownTitle("");
                                  setCountdownDate("");
                                }}
                                className="bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                              >
                                {lang === "fa" ? "لغو" : "Cancel"}
                              </button>
                              <button
                                onClick={handleAddCountdown}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                              >
                                {lang === "fa" ? "ذخیره" : "Save"}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2.5">
                          {countdownList.length === 0 ? (
                            <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850/60 text-center py-6">
                              <p className="text-xs text-slate-500 italic">
                                {lang === "fa"
                                  ? "هیچ شمارش معکوسی تعریف نشده است. رویداد مهم جدیدی ایجاد کنید!"
                                  : "No countdowns defined. Create key target dates to stay focused!"}
                              </p>
                            </div>
                          ) : (
                            countdownList.map((c) => {
                              const daysLeft = getDaysLeft(c.date);
                              const formattedDate = new Date(c.date).toLocaleDateString(
                                lang === "fa" ? "fa-IR" : "en-US"
                              );
                              
                              let badgeColor = "text-indigo-400 bg-indigo-500/10";
                              if (daysLeft <= 3) {
                                badgeColor = "text-rose-400 bg-rose-500/10 animate-pulse";
                              } else if (daysLeft <= 7) {
                                badgeColor = "text-amber-400 bg-amber-500/10";
                              }

                              return (
                                <div
                                  key={c.id}
                                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 flex justify-between items-center text-xs group"
                                >
                                  <button
                                    onClick={() => handleDeleteCountdown(c.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all cursor-pointer mr-2 shrink-0"
                                    title={lang === "fa" ? "حذف" : "Delete"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  <div className="flex-1 text-right">
                                    <p className="font-semibold text-slate-200">
                                      {c.title}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                      {toPersianDigits(formattedDate, usePersianNums)}
                                    </p>
                                  </div>

                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg font-mono shrink-0 ml-2 ${badgeColor}`}>
                                    {daysLeft > 0 ? (
                                      lang === "fa" ? `${toPersianDigits(daysLeft, usePersianNums)} روز مانده` : `${daysLeft}d left`
                                    ) : daysLeft === 0 ? (
                                      lang === "fa" ? "امروز!" : "Today!"
                                    ) : (
                                      lang === "fa" ? "گذشته" : "Passed"
                                    )}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (widget.id === "scores") {
                    return (
                      <div
                        key="scores"
                        className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4 text-right"
                      >
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {t("lifeOsScores", lang)}
                        </h3>

                        <div className="space-y-3 text-xs">
                          <div>
                            <div className="flex justify-between mb-1 text-slate-300">
                              <span>{t("productivityIndex", lang)}</span>
                              <span className="font-mono text-indigo-400 font-bold">
                                {toPersianDigits(state.profile.productivityScore, usePersianNums)}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all"
                                style={{ width: `${state.profile.productivityScore}%` }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-1 text-slate-300">
                              <span>{t("dailyBalanceRating", lang)}</span>
                              <span className="font-mono text-emerald-400 font-bold">
                                {toPersianDigits(state.profile.lifeScore, usePersianNums)}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${state.profile.lifeScore}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          )}

          {activeTab === "planner" && (
            <PlannerSystem
              state={state}
              onUpdateTasks={handleUpdateTasks}
              triggerSync={triggerSync}
              lang={lang}
              usePersianNums={usePersianNums}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarSystem
              state={state}
              onUpdateState={triggerSync}
              lang={lang}
              usePersianNums={usePersianNums}
            />
          )}

          {activeTab === "trackers" && (
            <CustomTrackers
              state={state}
              onUpdateState={triggerSync}
              onAddXP={addXP}
              lang={lang}
              usePersianNums={usePersianNums}
            />
          )}

          {activeTab === "notes" && (
            <NoteSystem
              state={state}
              onUpdateState={triggerSync}
              onAddXP={addXP}
              lang={lang}
              usePersianNums={usePersianNums}
            />
          )}

          {activeTab === "ai" && (
            <AIPrediction
              state={state}
              onAddXP={addXP}
              lang={lang}
              usePersianNums={usePersianNums}
            />
          )}

          {activeTab === "missions" && (
        <AIGameMaster
          state={state}
          onUpdateState={handleUpdateState}
          onAddXP={addXP}
          lang={langState}
        />
      )}

      {activeTab === "routines" && (
        <FixedRoutines
          state={state}
          onUpdateState={handleUpdateState}
          onAddXP={addXP}
          lang={langState}
          usePersianNums={state.profile?.usePersianNumerals || false}
        />
      )}

      {activeTab === "achievements" && (
        <div className="space-y-6 pb-20" dir={langState === "fa" ? "rtl" : "ltr"}>
          <div>
            <h2 className="text-2xl font-black text-white mb-1">
              {langState === "fa" ? "🏆 تالار افتخارات" : "🏆 Hall of Fame"}
            </h2>
            <p className="text-xs text-slate-400">
              {langState === "fa" ? "دستاوردهای شما در GH Planner" : "Your achievements in GH Planner"}
            </p>
          </div>

          {/* Season Records */}
          {(state.profile?.seasonRecords || []).length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                {langState === "fa" ? "رکوردهای فصلی" : "Season Records"}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(state.profile?.seasonRecords || []).map((record: any, i: number) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-center">
                    <div className="text-3xl mb-2">{record.icon}</div>
                    <p className="font-black text-white text-sm">{langState==="fa"?`فصل ${record.season}`:`Season ${record.season}`}</p>
                    <p className="text-xs text-indigo-400">Level {record.maxLevel}</p>
                    <p className="text-xs text-slate-500">{record.rank}</p>
                    <p className="text-xs text-amber-400 mt-1">{record.maxXP.toLocaleString()} XP</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              {langState === "fa" ? "دستاوردها" : "Achievements"} ({(state.achievements || []).filter(a=>a.unlocked).length}/{(state.achievements||[]).length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(state.achievements || []).map((ach: any) => (
                <div key={ach.id}
                  className={`border rounded-2xl p-4 text-center transition-all ${
                    ach.unlocked
                      ? "bg-indigo-950/30 border-indigo-700/40"
                      : "bg-slate-900/30 border-slate-800 opacity-40 grayscale"
                  }`}>
                  <div className="text-3xl mb-2">{ach.unlocked ? "🏅" : "🔒"}</div>
                  <p className={`font-bold text-xs ${ach.unlocked ? "text-white" : "text-slate-500"}`}>{ach.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{ach.description}</p>
                  {!ach.unlocked && ach.maxProgress > 1 && (
                    <div className="mt-2">
                      <div className="h-1 bg-slate-800 rounded-full">
                        <div className="h-full bg-indigo-600 rounded-full"
                          style={{width:`${(ach.progress/ach.maxProgress)*100}%`}} />
                      </div>
                      <p className="text-[9px] text-slate-500 mt-0.5">{ach.progress}/{ach.maxProgress}</p>
                    </div>
                  )}
                  {ach.unlocked && ach.unlockedAt && (
                    <p className="text-[9px] text-indigo-400 mt-1">{new Date(ach.unlockedAt).toLocaleDateString(langState==="fa"?"fa-IR":"en-US")}</p>
                  )}
                </div>
              ))}
              {(state.achievements || []).length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-500">
                  <div className="text-5xl mb-3">🏆</div>
                  <p className="font-bold">{langState==="fa"?"هنوز دستاوردی نداری":"No achievements yet"}</p>
                  <p className="text-xs mt-1">{langState==="fa"?"تسک‌ها رو کامل کن تا دستاورد کسب کنی":"Complete tasks to earn achievements"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "profile" && (
            <ProfileSystem
              state={state}
              onUpdateState={triggerSync}
              lang={lang}
              usePersianNums={usePersianNums}
            />
          )}

          {activeTab === "settings" && (
            <SettingsSystem
              state={state}
              onUpdateState={triggerSync}
              activeTheme={activeTheme}
              onSelectTheme={(theme) => {
                setActiveTheme(theme);
                // Persist theme choice in state
                triggerSync({
                  ...state,
                  profile: { ...state.profile, themeId: theme.id } as any,
                });
              }}
              onUpdateAccentColor={(color) => {
                const adjustedTheme = { ...activeTheme, primary: color };
                setActiveTheme(adjustedTheme);
              }}
              onLogOut={() => {
                localStorage.removeItem("gh_planner_user_id");
                localStorage.removeItem("gh_planner_lang");
                setIsAuthenticated(false);
                setState(DEFAULT_STATE);
                setActiveTab("home");
              }}
            />
          )}
        </div>
      </main>

      {/* Instant command palette modal popup */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        state={state}
        lang={lang}
        usePersianNums={usePersianNums}
        onAddTask={(title) => {
          const newTask: Task = {
            id: "task_" + Math.random().toString(36).substring(2, 9),
            title: title.trim(),
            description: "Formulated through instant search command line.",
            category: "General",
            priority: "medium",
            energy: "medium",
            difficulty: "medium",
            estimatedTime: 30,
            status: "todo",
            checklist: [],
            progress: 0,
            createdAt: new Date().toISOString(),
          };
          handleUpdateTasks([...state.tasks, newTask], 10);
        }}
        onAddNote={(title) => {
          const newNote: Note = {
            id: "note_" + Math.random().toString(36).substring(2, 9),
            title: title.trim(),
            content: "Drafted through command line. Double tap to edit.",
            tags: ["Draft"],
            folder: "General",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          triggerSync({
            ...state,
            notes: [newNote, ...state.notes],
          });
          addXP(15, "note", "Drafted note in NoteSystem");
        }}
        onAddGoal={(title) => {
          const newGoal: Goal = {
            id: "goal_" + Math.random().toString(36).substring(2, 9),
            title: title.trim(),
            description: "A goal drafted from the global search console.",
            priority: "medium",
            category: "General",
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            progress: 0,
            milestones: [],
            status: "active",
            createdAt: new Date().toISOString(),
          };
          triggerSync({
            ...state,
            goals: [...state.goals, newGoal],
          });
          addXP(20, "goal", "Formulated new long-term goal");
        }}
        onNavigate={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
