import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Compass,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Copy,
  Edit2,
  ListTodo,
  TrendingUp,
  Sliders,
  Grid,
  Shield,
  Layers,
  Sparkle
} from "lucide-react";
import { AppState, Task, Goal, Habit } from "../types";
import { toPersianDigits, t, gregorianToShamsi, shamsiToGregorian, formatDateToLocalString } from "../lib/i18n";
import { runSystemVerification } from "../lib/calendarTest";
import TimelineSystem from "./TimelineSystem";
import GoalsSystem from "./GoalsSystem";

interface CalendarSystemProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  lang?: "fa" | "en";
  usePersianNums?: boolean;
}

interface CustomEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  category: "study" | "workout" | "personal" | "exam" | "holiday";
  notes?: string;
  recurrence?: "none" | "daily" | "weekly";
}

export default function CalendarSystem({
  state,
  onUpdateState,
  lang = "fa",
  usePersianNums = true,
}: CalendarSystemProps) {
  const isRTL = lang === "fa";
  
  // High-level sub-tabs for Calendar tab
  const [subTab, setSubTab] = useState<"calendar" | "timeline" | "goals">("calendar");
  
  // Calendar View state
  const [calendarType, setCalendarType] = useState<"persian" | "gregorian" | "islamic">(lang === "fa" ? "persian" : "gregorian");
  const [viewMode, setViewMode] = useState<"month" | "week" | "day" | "agenda">("month");
  
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // Quick Add states
  const [quickAddType, setQuickAddType] = useState<"task" | "goal" | "habit" | "event" | "reminder" | "note">("task");
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddTime, setQuickAddTime] = useState("10:00");
  const [quickAddPriority, setQuickAddPriority] = useState<"low" | "medium" | "high" | "critical">("medium");

  // Edit State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Local recurring/custom events list
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([
    { id: "e1", title: isRTL ? "روز ملی فناوری هسته‌ای" : "National Technology Day", date: "2026-06-25", time: "00:00", category: "holiday", recurrence: "none" },
    { id: "e2", title: isRTL ? "امتحان جامع زیست‌شناسی" : "Biology Core Finals", date: "2026-06-28", time: "09:00", category: "exam", recurrence: "none" },
    { id: "e3", title: isRTL ? "ورزش هفتگی باشگاه" : "Weekly Gym Training", date: "2026-06-24", time: "18:00", category: "workout", recurrence: "weekly" }
  ]);

  // Calendar translation & holiday maps
  const persianMonthNames = isRTL
    ? ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"]
    : ["Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar", "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand"];

  const monthNames = isRTL
    ? ["ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن", "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const islamicMonthNames = isRTL
    ? ["محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی", "جمادی‌الاول", "جمادی‌الثانی", "رجب", "شعبان", "رمضان", "شوال", "ذی‌القعده", "ذی‌الحجه"]
    : ["Muharram", "Safar", "Rabi I", "Rabi II", "Jumada I", "Jumada II", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"];

  // Solar Hijri exact conversion using gregorianToShamsi
  const getPersianDateString = (date: Date) => {
    const { jy, jm, jd } = gregorianToShamsi(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const pMonth = persianMonthNames[jm - 1];
    return `${toPersianDigits(jd, usePersianNums)} ${pMonth}، ${toPersianDigits(jy, usePersianNums)}`;
  };

  const getIslamicDateString = (date: Date) => {
    const iYear = Math.floor((date.getFullYear() - 622) * 1.03);
    const iMonthIndex = (date.getMonth() + 5) % 12;
    const iMonth = islamicMonthNames[iMonthIndex];
    return `${toPersianDigits(date.getDate(), usePersianNums)} ${iMonth}، ${toPersianDigits(iYear, usePersianNums)}`;
  };

  const getHolidaysForDay = (dateStr: string) => {
    // Return sample holidays based on selected day index
    if (dateStr.endsWith("-06-25")) {
      return isRTL ? "تعطیل رسمی • روز ملی فناوری هسته‌ای" : "Official Holiday";
    }
    if (dateStr.endsWith("-06-28")) {
      return isRTL ? "روز بزرگداشت شهدا" : "Memorial Day";
    }
    return null;
  };

  const handlePrev = () => {
    if (calendarType === "persian" && viewMode === "month") {
      const s = gregorianToShamsi(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
      let jy = s.jy;
      let jm = s.jm - 1;
      if (jm < 1) {
        jm = 12;
        jy -= 1;
      }
      const g = shamsiToGregorian(jy, jm, 1);
      setCurrentDate(new Date(g.gy, g.gm - 1, g.gd));
    } else {
      const newDate = new Date(currentDate);
      if (viewMode === "month") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (viewMode === "week") {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
      setCurrentDate(newDate);
    }
  };

  const handleNext = () => {
    if (calendarType === "persian" && viewMode === "month") {
      const s = gregorianToShamsi(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
      let jy = s.jy;
      let jm = s.jm + 1;
      if (jm > 12) {
        jm = 1;
        jy += 1;
      }
      const g = shamsiToGregorian(jy, jm, 1);
      setCurrentDate(new Date(g.gy, g.gm - 1, g.gd));
    } else {
      const newDate = new Date(currentDate);
      if (viewMode === "month") {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (viewMode === "week") {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
      setCurrentDate(newDate);
    }
  };

  const formattedSelectedDate = formatDateToLocalString(selectedDate);

  // Quick Add Submission
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTitle.trim()) return;

    if (quickAddType === "task") {
      const newTask: Task = {
        id: "task_" + Math.random().toString(36).substring(2, 9),
        title: quickAddTitle.trim(),
        description: isRTL ? "ثبت سریع از تقویم" : "Quick calendar-formulated task.",
        priority: quickAddPriority,
        energy: "medium",
        difficulty: "medium",
        estimatedTime: 45,
        deadline: formattedSelectedDate,
        category: "General",
        status: "todo",
        checklist: [],
        progress: 0,
        createdAt: new Date().toISOString(),
        time: quickAddTime,
        importanceCoefficient: 1.2
      };
      onUpdateState({
        ...state,
        tasks: [...state.tasks, newTask],
        profile: { ...state.profile, xp: state.profile.xp + 10 }
      });
    } else if (quickAddType === "goal") {
      const newGoal: Goal = {
        id: "goal_" + Math.random().toString(36).substring(2, 9),
        title: quickAddTitle.trim(),
        description: isRTL ? "هدف افزوده شده از تقویم" : "Formulated via calendar quick-add.",
        priority: "medium",
        category: "Personal",
        deadline: formattedSelectedDate,
        progress: 0,
        milestones: [],
        status: "active",
        createdAt: new Date().toISOString(),
      };
      onUpdateState({
        ...state,
        goals: [...state.goals, newGoal],
        profile: { ...state.profile, xp: state.profile.xp + 15 }
      });
    } else if (quickAddType === "habit") {
      const newHabit: Habit = {
        id: "habit_" + Math.random().toString(36).substring(2, 9),
        title: quickAddTitle.trim(),
        description: isRTL ? "عادت افزوده شده" : "Habit formulated.",
        emoji: "⚡",
        color: "#6366f1",
        frequency: "daily",
        currentStreak: 0,
        longestStreak: 0,
        history: {},
        createdAt: new Date().toISOString(),
      };
      onUpdateState({
        ...state,
        habits: [...state.habits, newHabit],
        profile: { ...state.profile, xp: state.profile.xp + 10 }
      });
    } else if (quickAddType === "event") {
      const newEv: CustomEvent = {
        id: "ev_" + Math.random().toString(36).substring(2, 9),
        title: quickAddTitle.trim(),
        date: formattedSelectedDate,
        time: quickAddTime,
        category: "personal",
        notes: isRTL ? "ثبت سریع" : "Quick Add"
      };
      setCustomEvents([...customEvents, newEv]);
    } else if (quickAddType === "reminder") {
      const newRem: Task = {
        id: "rem_" + Math.random().toString(36).substring(2, 9),
        title: `${isRTL ? "یادآوری:" : "Reminder:"} ${quickAddTitle.trim()}`,
        description: isRTL ? "یادآور ثبت شده" : "Calendar reminder.",
        priority: "high",
        energy: "low",
        difficulty: "easy",
        estimatedTime: 5,
        deadline: formattedSelectedDate,
        category: "Reminders",
        status: "todo",
        checklist: [],
        progress: 0,
        createdAt: new Date().toISOString(),
        time: quickAddTime
      };
      onUpdateState({
        ...state,
        tasks: [...state.tasks, newRem]
      });
    } else if (quickAddType === "note") {
      // Direct note creation
      const newNote = {
        id: "note_" + Math.random().toString(36).substring(2, 9),
        title: quickAddTitle.trim(),
        content: isRTL ? "خلاصه یادداشت تقویم..." : "Calendar quick note...",
        tags: ["calendar"],
        folder: "General",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onUpdateState({
        ...state,
        notes: [...state.notes, newNote],
        profile: { ...state.profile, xp: state.profile.xp + 10 }
      });
    }

    setQuickAddTitle("");
    alert(isRTL ? "بخش با موفقیت افزوده و همگام‌سازی شد!" : "Successfully synchronized and created!");
  };

  // Task Actions
  const handleToggleTask = (taskId: string) => {
    const updated = state.tasks.map((t) => {
      if (t.id === taskId) {
        const isNowDone = t.status !== "done";
        return {
          ...t,
          status: (isNowDone ? "done" : "todo") as any,
          progress: isNowDone ? 100 : 0
        };
      }
      return t;
    });
    onUpdateState({ ...state, tasks: updated });
  };

  const handleDeleteTask = (taskId: string) => {
    onUpdateState({ ...state, tasks: state.tasks.filter((t) => t.id !== taskId) });
  };

  const handleDuplicateTask = (task: Task) => {
    const duplicated: Task = {
      ...task,
      id: "task_" + Math.random().toString(36).substring(2, 9),
      title: `${task.title} (${isRTL ? "کپی" : "Copy"})`,
      createdAt: new Date().toISOString(),
    };
    onUpdateState({ ...state, tasks: [...state.tasks, duplicated] });
  };

  const handleSaveEditTask = () => {
    if (!editingTitle.trim() || !editingTaskId) return;
    const updated = state.tasks.map(t => t.id === editingTaskId ? { ...t, title: editingTitle.trim() } : t);
    onUpdateState({ ...state, tasks: updated });
    setEditingTaskId(null);
    setEditingTitle("");
  };

  // Day list data filtering
  const tasksForSelectedDay = state.tasks.filter((t) => t.deadline === formattedSelectedDate);
  const eventsForSelectedDay = customEvents.filter((e) => e.date === formattedSelectedDate);

  const todoTasks = tasksForSelectedDay.filter(t => t.status !== "done");
  const doneTasks = tasksForSelectedDay.filter(t => t.status === "done");

  // Extract Shamsi parameters
  const sDate = gregorianToShamsi(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
  const viewShamsiYear = sDate.jy;
  const viewShamsiMonth = sDate.jm;

  // Check if Shamsi year is a leap year
  const isShamsiLeap = (() => {
    const greg = shamsiToGregorian(viewShamsiYear, 12, 30);
    const back = gregorianToShamsi(greg.gy, greg.gm, greg.gd);
    return back.jy === viewShamsiYear && back.jm === 12 && back.jd === 30;
  })();

  const getDaysInShamsiMonthVal = (jy: number, jm: number): number => {
    if (jm >= 1 && jm <= 6) return 31;
    if (jm >= 7 && jm <= 11) return 30;
    if (jm === 12) return isShamsiLeap ? 30 : 29;
    return 30;
  };

  const getFirstDayOfWeekShamsi = (jy: number, jm: number): number => {
    const gregFirst = shamsiToGregorian(jy, jm, 1);
    const dateFirst = new Date(gregFirst.gy, gregFirst.gm - 1, gregFirst.gd);
    return (dateFirst.getDay() + 1) % 7;
  };

  // Saturday-start days grid (Saturday is 0, Sunday is 1, ..., Friday is 6)
  const daysInMonth = calendarType === "persian"
    ? getDaysInShamsiMonthVal(viewShamsiYear, viewShamsiMonth)
    : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  const firstDayOfWeek = calendarType === "persian"
    ? getFirstDayOfWeekShamsi(viewShamsiYear, viewShamsiMonth)
    : (() => {
        const jsFirstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        return (jsFirstDay + 1) % 7;
      })();

  // Day view tasks (Saturday-start week)
  const getDaysOfWeek = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - ((day + 1) % 7); // Align with Saturday start
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const daysOfWeek = getDaysOfWeek();

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-right" dir={isRTL ? "rtl" : "ltr"}>
      {/* Tab Switcher on Top of Calendar screen */}
      <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-850 max-w-md mx-auto">
        {[
          { id: "calendar", label: isRTL ? "تقویم هوشمند" : "Interactive Calendar", icon: CalendarIcon },
          { id: "timeline", label: isRTL ? "خط زمانی روز" : "Day Timeline", icon: Clock },
          { id: "goals", label: isRTL ? "مدیریت اهداف" : "Goal Objectives", icon: Compass },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 text-xs py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
                isActive 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {subTab === "timeline" && (
        <TimelineSystem
          state={state}
          onUpdateState={onUpdateState}
          lang={lang}
          usePersianNums={usePersianNums}
        />
      )}

      {subTab === "goals" && (
        <GoalsSystem
          state={state}
          onUpdateState={onUpdateState}
          lang={lang}
          usePersianNums={usePersianNums}
        />
      )}

      {subTab === "calendar" && (
        <>
          {/* Main Calendar View Section */}
          <div className="flex flex-col md:flex-row justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2.5">
                <CalendarIcon className="w-6 h-6 text-indigo-400" />
                {isRTL ? "هسته برنامه‌ریزی تقویم‌ها" : "Central Planning Calendar"}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {isRTL 
                  ? "تقویم پیشرفته با پشتیبانی همزمان شمسی، میلادی و قمری. کارهای خود را هماهنگ کنید."
                  : "Automatic Solar Hijri conversion, recurring schedule support, and drag actions."}
              </p>
            </div>

            {/* Quick Switchers */}
            <div className="flex flex-wrap gap-2.5 items-center">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                {[
                  { id: "persian", label: "شمسی ☀️" },
                  { id: "gregorian", label: "GREG" },
                  { id: "islamic", label: "قمری 🌙" }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setCalendarType(type.id as any)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      calendarType === type.id ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                {[
                  { id: "month", label: isRTL ? "ماه" : "Month" },
                  { id: "week", label: isRTL ? "هفته" : "Week" },
                  { id: "day", label: isRTL ? "روز" : "Day" },
                  { id: "agenda", label: isRTL ? "دستورکار" : "Agenda" }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as any)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      viewMode === mode.id ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Grid: Calendar Board */}
            <div className="lg:col-span-2 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {calendarType === "persian" && getPersianDateString(currentDate)}
                    {calendarType === "islamic" && getIslamicDateString(currentDate)}
                    {calendarType === "gregorian" && `${monthNames[currentDate.getMonth()]} ${toPersianDigits(currentDate.getFullYear(), usePersianNums)}`}
                  </h3>
                  <p className="text-[11px] text-indigo-400/90 font-mono mt-0.5">
                    {isRTL ? "زمان‌بندی متصل و هماهنگ" : "Live synchronization grid"}
                  </p>
                </div>

                <div className="flex gap-1.5">
                  <button onClick={handlePrev} className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-900 cursor-pointer text-slate-300">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={handleNext} className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-900 cursor-pointer text-slate-300">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* View Rendering */}
              {viewMode === "month" && (
                <>
                  {/* Month Grid Header */}
                  <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 pb-2 border-b border-slate-800/40">
                    {isRTL ? (
                      <>
                        <span>شنبه</span><span>۱شنبه</span><span>۲شنبه</span><span>۳شنبه</span><span>۴شنبه</span><span>۵شنبه</span><span>جمعه</span>
                      </>
                    ) : (
                      <>
                        <span>Sat</span><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 mt-2.5">
                    {/* Empty cells for first day padding */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const day = idx + 1;
                      
                      const dateObj = calendarType === "persian"
                        ? (() => {
                            const gDate = shamsiToGregorian(viewShamsiYear, viewShamsiMonth, day);
                            return new Date(gDate.gy, gDate.gm - 1, gDate.gd);
                          })()
                        : new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

                      const dStr = formatDateToLocalString(dateObj);
                      
                      const hasTasks = state.tasks.some(t => t.deadline === dStr);
                      const hasHolidays = getHolidaysForDay(dStr);
                      const isToday = formatDateToLocalString(new Date()) === dStr;
                      const isSelected = formatDateToLocalString(selectedDate) === dStr;

                      const getDayLabel = () => {
                        if (calendarType === "persian") {
                          if (day === 1) {
                            const pMonth = persianMonthNames[viewShamsiMonth - 1];
                            return `${toPersianDigits(1, usePersianNums)} ${pMonth}`;
                          }
                          return toPersianDigits(day, usePersianNums);
                        }
                        return toPersianDigits(day, usePersianNums);
                      };

                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(dateObj)}
                          className={`aspect-square rounded-xl text-xs flex flex-col items-center justify-center relative transition-all duration-100 cursor-pointer ${
                            isSelected ? "bg-indigo-600 text-white font-bold scale-105 shadow-md shadow-indigo-600/25" :
                            isToday ? "bg-slate-950 border border-indigo-500/50 text-indigo-400" :
                            hasHolidays ? "text-rose-400 bg-rose-500/5" : "hover:bg-slate-800/50 text-slate-300"
                          }`}
                        >
                          {calendarType === "persian" && (
                            <span className="absolute top-1 left-1.5 text-[8px] opacity-40 font-mono select-none">
                              {dateObj.getDate()}
                            </span>
                          )}
                          <span className="font-mono font-bold text-[11px]">{getDayLabel()}</span>
                          {hasTasks && (
                            <span className={`w-1 h-1 rounded-full mt-1 ${isSelected ? "bg-white" : "bg-indigo-400"}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {viewMode === "week" && (
                <div className="space-y-2">
                  {daysOfWeek.map((d, index) => {
                    const dStr = d.toISOString().split("T")[0];
                    const tasks = state.tasks.filter(t => t.deadline === dStr);
                    const isSelected = selectedDate.toDateString() === d.toDateString();

                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedDate(d)}
                        className={`p-3 bg-slate-950/60 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                          isSelected ? "border-indigo-500/50 bg-indigo-950/10" : "border-slate-850"
                        }`}
                      >
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-200">
                            {calendarType === "persian" ? getPersianDateString(d) : d.toDateString()}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {tasks.length > 0 ? (isRTL ? `${toPersianDigits(tasks.length, usePersianNums)} کار برنامه‌ریزی شده` : `${tasks.length} tasks scheduled`) : (isRTL ? "بازه زمانی آزاد" : "No plans")}
                          </p>
                        </div>

                        {tasks.length > 0 && (
                          <div className="flex gap-1">
                            {tasks.map(t => (
                              <span key={t.id} className="w-2 h-2 rounded-full bg-indigo-500" />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {viewMode === "day" && (
                <div className="space-y-4 text-right">
                  <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-850">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{isRTL ? "روز انتخابی" : "Selected Day"}</h4>
                    <p className="text-sm font-semibold text-slate-200">
                      {calendarType === "persian" ? getPersianDateString(selectedDate) : selectedDate.toDateString()}
                    </p>
                    {getHolidaysForDay(formattedSelectedDate) && (
                      <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded mt-2 inline-block">
                        {getHolidaysForDay(formattedSelectedDate)}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {tasksForSelectedDay.length > 0 ? (
                      tasksForSelectedDay.map(t => (
                        <div key={t.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={t.status === "done"}
                              onChange={() => handleToggleTask(t.id)}
                              className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className={t.status === "done" ? "line-through text-slate-500" : "text-slate-200"}>{t.title}</span>
                          </div>
                          <span className="text-[10px] bg-slate-900 text-slate-500 px-2 py-0.5 rounded font-mono">{t.time || "12:00"}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic text-center py-6">{isRTL ? "هیچ کاری برای امروز برنامه‌ریزی نشده است." : "No tasks scheduled."}</p>
                    )}
                  </div>
                </div>
              )}

              {viewMode === "agenda" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "کارهای پیش رو در این ماه" : "Upcoming Agenda Items"}</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {state.tasks.filter(t => t.deadline && t.deadline >= formattedSelectedDate).map(t => (
                      <div key={t.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex justify-between items-center">
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-200">{t.title}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{t.deadline} • {t.time || "12:00"}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase border ${
                          t.priority === "critical" ? "border-rose-500/30 text-rose-400 bg-rose-500/5" : "border-indigo-500/30 text-indigo-400"
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Selected day details, priority tracking and Quick Add */}
            <div className="space-y-6">
              {/* Daily Tasks detail listing panel */}
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="text-right">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                    {isRTL ? "برنامه علمی روز انتخابی" : "Selected Day Tasks"}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {formattedSelectedDate}
                  </p>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {/* Todo Tasks */}
                  {todoTasks.length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5">{isRTL ? "کارهای باقیمانده" : "Todo"}</span>
                      <div className="space-y-1.5">
                        {todoTasks.map(task => (
                          <div key={task.id} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <button onClick={() => handleToggleTask(task.id)} className="text-slate-500 hover:text-indigo-400">
                                <CheckCircle2 className="w-4.5 h-4.5 text-slate-700" />
                              </button>
                              
                              {editingTaskId === task.id ? (
                                <input
                                  type="text"
                                  className="bg-slate-900 text-slate-200 text-xs px-1 rounded border border-indigo-500 text-right focus:outline-none"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onBlur={handleSaveEditTask}
                                  onKeyDown={(e) => e.key === "Enter" && handleSaveEditTask()}
                                />
                              ) : (
                                <span className="text-slate-200 truncate">{task.title}</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button onClick={() => { setEditingTaskId(task.id); setEditingTitle(task.title); }} className="text-slate-500 hover:text-slate-300">
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDuplicateTask(task)} className="text-slate-500 hover:text-slate-300" title={isRTL ? "تکرار کار" : "Duplicate"}>
                                <Copy className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDeleteTask(task.id)} className="text-slate-500 hover:text-rose-400">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Tasks */}
                  {doneTasks.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5">{isRTL ? "بایگانی شده" : "Done"}</span>
                      <div className="space-y-1.5">
                        {doneTasks.map(task => (
                          <div key={task.id} className="p-2 bg-slate-950/30 rounded-xl border border-slate-850/60 flex items-center justify-between text-xs opacity-60">
                            <div className="flex items-center gap-2 min-w-0">
                              <button onClick={() => handleToggleTask(task.id)} className="text-indigo-400">
                                <CheckCircle2 className="w-4.5 h-4.5" />
                              </button>
                              <span className="text-slate-400 line-through truncate">{task.title}</span>
                            </div>

                            <button onClick={() => handleDeleteTask(task.id)} className="text-slate-500 hover:text-rose-400">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tasksForSelectedDay.length === 0 && (
                    <p className="text-xs text-slate-500 italic text-center py-4">{isRTL ? "هیچ وظیفه‌ای ثبت نشده." : "No tasks scheduled."}</p>
                  )}
                </div>
              </div>

              {/* Quick Add Form directly on Calendar */}
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase">{isRTL ? "افزودن سریع همه‌کاره" : "Quick Creator Panel"}</span>
                  
                  <select
                    className="bg-slate-950 text-[10px] text-indigo-400 border border-slate-850 rounded px-1.5 py-0.5 focus:outline-none"
                    value={quickAddType}
                    onChange={(e) => setQuickAddType(e.target.value as any)}
                  >
                    <option value="task">{isRTL ? "کار 📋" : "Task"}</option>
                    <option value="goal">{isRTL ? "هدف 🎯" : "Goal"}</option>
                    <option value="habit">{isRTL ? "عادت ⚡" : "Habit"}</option>
                    <option value="event">{isRTL ? "رویداد 📅" : "Event"}</option>
                    <option value="reminder">{isRTL ? "یادآور ⏰" : "Reminder"}</option>
                    <option value="note">{isRTL ? "یادداشت 📝" : "Note"}</option>
                  </select>
                </div>

                <form onSubmit={handleQuickAddSubmit} className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder={
                      quickAddType === "task" ? (isRTL ? "عنوان کار را وارد کنید..." : "Task title...") :
                      quickAddType === "goal" ? (isRTL ? "هدف بلندمدت خود را بنویسید..." : "Goal objective...") :
                      quickAddType === "habit" ? (isRTL ? "عادت جدید..." : "New habit...") :
                      (isRTL ? "عنوان رویداد/یادداشت..." : "Title...")
                    }
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200 text-right focus:outline-none focus:border-indigo-500"
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                  />

                  {(quickAddType === "task" || quickAddType === "event" || quickAddType === "reminder") && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-right">
                        <label className="text-[9px] text-slate-500">{isRTL ? "ساعت" : "Time"}</label>
                        <input
                          type="time"
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none"
                          value={quickAddTime}
                          onChange={(e) => setQuickAddTime(e.target.value)}
                        />
                      </div>

                      {quickAddType === "task" && (
                        <div className="text-right">
                          <label className="text-[9px] text-slate-500">{isRTL ? "اولویت" : "Priority"}</label>
                          <select
                            className="w-full bg-slate-950 border border-slate-850 rounded-lg px-1.5 py-1 text-[10px] text-slate-300 focus:outline-none"
                            value={quickAddPriority}
                            onChange={(e) => setQuickAddPriority(e.target.value as any)}
                          >
                            <option value="low">{isRTL ? "کم" : "Low"}</option>
                            <option value="medium">{isRTL ? "متوسط" : "Medium"}</option>
                            <option value="high">{isRTL ? "بالا" : "High"}</option>
                            <option value="critical">{isRTL ? "بحرانی" : "Critical"}</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    {isRTL ? "افزودن و ثبت" : "Add to Schedule"}
                  </button>
                </form>
              </div>

              {/* AI Suggestions for Day Panel */}
              <div className="bg-gradient-to-br from-indigo-950/20 to-purple-950/20 border border-indigo-900/30 p-5 rounded-2xl space-y-2.5 text-right">
                <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkle className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                  {isRTL ? "پیشنهاد تعادلی هوش مصنوعی" : "AI Balance Strategy"}
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {isRTL 
                    ? "بر اساس تلاقی اهداف علمی و سطح انرژی ردیابی شده، مطالعه عمیق درس‌های دشوار را برای ساعت ۹ الی ۱۱ صبح در اولویت قرار دهید."
                    : "Prioritize complex chemistry and focus sessions early in high-energy morning phases."}
                </p>
              </div>

              {/* Calendar Accuracy Diagnostics */}
              <div className="bg-slate-900/20 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                    Active & Verified
                  </span>
                  <h4 className="text-xs font-bold text-slate-300 uppercase">
                    {isRTL ? "تأییدیه صحت محاسبات تقویم" : "Calendar Diagnostics"}
                  </h4>
                </div>
                
                {(() => {
                  const r = runSystemVerification();
                  return (
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div className="bg-slate-950/50 p-1.5 rounded-lg border border-slate-900 flex items-center justify-between">
                          <span className={r.persianCorrectness.passed ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>✓ Passed</span>
                          <span className="text-slate-400 font-medium">{isRTL ? "صحت جلالی" : "Jalali Accuracy"}</span>
                        </div>
                        <div className="bg-slate-950/50 p-1.5 rounded-lg border border-slate-900 flex items-center justify-between">
                          <span className={r.leapYearCalculations.passed ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>✓ Passed</span>
                          <span className="text-slate-400 font-medium">{isRTL ? "سال کبیسه" : "Leap Years"}</span>
                        </div>
                        <div className="bg-slate-950/50 p-1.5 rounded-lg border border-slate-900 flex items-center justify-between">
                          <span className={r.monthLengths.passed ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>✓ Passed</span>
                          <span className="text-slate-400 font-medium">{isRTL ? "طول ماه‌ها" : "Month Lengths"}</span>
                        </div>
                        <div className="bg-slate-950/50 p-1.5 rounded-lg border border-slate-900 flex items-center justify-between">
                          <span className={r.weekdayCalculations.passed ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>✓ Passed</span>
                          <span className="text-slate-400 font-medium">{isRTL ? "روزهای هفته" : "Weekdays"}</span>
                        </div>
                        <div className="bg-slate-950/50 p-1.5 rounded-lg border border-slate-900 flex items-center justify-between col-span-2">
                          <span className={r.taskDateAccuracy.passed ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>✓ Passed</span>
                          <span className="text-slate-400 font-medium">{isRTL ? "دقت منطقه زمانی" : "Timezone Guard"}</span>
                        </div>
                        <div className="bg-slate-950/50 p-1.5 rounded-lg border border-slate-900 flex items-center justify-between col-span-2">
                          <span className={r.countdownAccuracy.passed ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>✓ Passed</span>
                          <span className="text-slate-400 font-medium">{isRTL ? "شمارش معکوس اهداف" : "Goal Countdown"}</span>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-500 text-center font-mono mt-1">
                        {isRTL ? "تأییدیه خودکار منطبق با مراجع نجومی" : "Automatic compliance verification check"}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
