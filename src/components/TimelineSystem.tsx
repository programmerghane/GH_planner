import React, { useState, useEffect } from "react";
import {
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  Compass,
  AlertTriangle,
  CheckCircle,
  Flame,
  Calendar,
  BookOpen,
  Coffee,
  Activity,
  Award,
  Trash2,
  CalendarDays,
  Dumbbell
} from "lucide-react";
import { Task, Goal, Habit, AppState } from "../types";
import { toPersianDigits } from "../lib/i18n";

interface TimelineSystemProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  lang?: "fa" | "en";
  usePersianNums?: boolean;
}

export interface FocusBlock {
  id: string;
  title: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: "study" | "workout" | "reading" | "deep_work" | "rest" | "sleep" | "meeting";
  color: string;
  icon: string;
}

export default function TimelineSystem({
  state,
  onUpdateState,
  lang = "fa",
  usePersianNums = true,
}: TimelineSystemProps) {
  const isRTL = lang === "fa";
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiReview, setAiReview] = useState<any | null>(null);
  const [aiBlockLoading, setAiBlockLoading] = useState(false);

  // Focus Blocks State (with defaults if not in profile/state)
  const [focusBlocks, setFocusBlocks] = useState<FocusBlock[]>([
    { id: "fb_1", title: isRTL ? "خواب و استراحت شبانه" : "Night Sleep", startTime: "00:00", endTime: "07:00", type: "sleep", color: "bg-indigo-950/40 text-indigo-400 border-indigo-900/40", icon: "🌙" },
    { id: "fb_2", title: isRTL ? "ورزش صبحگاهی" : "Morning Workout", startTime: "07:30", endTime: "08:15", type: "workout", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: "💪" },
    { id: "fb_3", title: isRTL ? "جلسه تیمی و هماهنگی" : "Team Sync Meeting", startTime: "09:00", endTime: "10:00", type: "meeting", color: "bg-sky-500/10 text-sky-400 border-sky-500/20", icon: "👥" },
    { id: "fb_4", title: isRTL ? "مطالعه زیست‌شناسی کنکور" : "Biology Core Review", startTime: "10:30", endTime: "12:30", type: "study", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: "📚" },
    { id: "fb_5", title: isRTL ? "کار عمیق پژوهشی" : "Deep Research Work", startTime: "14:00", endTime: "17:00", type: "deep_work", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", icon: "💻" },
    { id: "fb_6", title: isRTL ? "مطالعه آزاد کتاب" : "Free Book Reading", startTime: "21:30", endTime: "22:30", type: "reading", color: "bg-pink-500/10 text-pink-400 border-pink-500/20", icon: "📖" },
  ]);

  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState("");
  const [newBlockStart, setNewBlockStart] = useState("09:00");
  const [newBlockEnd, setNewBlockEnd] = useState("10:00");
  const [newBlockType, setNewBlockType] = useState<FocusBlock["type"]>("study");

  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${hh}:${mm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter tasks for the selected date
  const tasksForDay = state.tasks.filter(t => {
    if (!t.deadline) return false;
    return t.deadline === selectedDate;
  });

  const getBlockStyles = (type: FocusBlock["type"]) => {
    switch (type) {
      case "study": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "workout": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "reading": return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "deep_work": return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "rest": return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      case "sleep": return "bg-violet-950/40 text-violet-400 border-violet-900/40";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getBlockIcon = (type: FocusBlock["type"]) => {
    switch (type) {
      case "study": return "📚";
      case "workout": return "💪";
      case "reading": return "📖";
      case "deep_work": return "💻";
      case "rest": return "☕";
      case "sleep": return "🌙";
      default: return "🔔";
    }
  };

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockTitle.trim()) return;

    const newBlock: FocusBlock = {
      id: "fb_" + Math.random().toString(36).substring(2, 9),
      title: newBlockTitle.trim(),
      startTime: newBlockStart,
      endTime: newBlockEnd,
      type: newBlockType,
      color: getBlockStyles(newBlockType),
      icon: getBlockIcon(newBlockType)
    };

    setFocusBlocks([...focusBlocks, newBlock].sort((a,b) => a.startTime.localeCompare(b.startTime)));
    setNewBlockTitle("");
    setShowAddBlock(false);
  };

  const handleDeleteBlock = (id: string) => {
    setFocusBlocks(focusBlocks.filter(b => b.id !== id));
  };

  // Convert time HH:MM to float representing hours (e.g. "07:30" -> 7.5)
  const timeToVal = (timeStr: string) => {
    const parts = timeStr.split(":");
    if (parts.length < 2) return 0;
    return parseFloat(parts[0]) + parseFloat(parts[1]) / 60;
  };

  // Check overlap/conflict with other focus blocks or scheduled tasks
  const conflicts = [];
  for (let i = 0; i < focusBlocks.length; i++) {
    const b1 = focusBlocks[i];
    const s1 = timeToVal(b1.startTime);
    const e1 = timeToVal(b1.endTime);
    for (let j = i + 1; j < focusBlocks.length; j++) {
      const b2 = focusBlocks[j];
      const s2 = timeToVal(b2.startTime);
      const e2 = timeToVal(b2.endTime);

      if ((s1 < e2 && e1 > s2) || (s2 < e1 && e2 > s1)) {
        conflicts.push({
          b1,
          b2,
          text: isRTL 
            ? `هم‌پوشانی بین "${b1.title}" (${b1.startTime}-${b1.endTime}) و "${b2.title}" (${b2.startTime}-${b2.endTime})` 
            : `Overlapping between "${b1.title}" and "${b2.title}"`
        });
      }
    }
  }

  // Detect empty slots (free time slots of more than 30 minutes)
  const getFreeTimeSlots = () => {
    const sorted = [...focusBlocks].sort((a,b) => a.startTime.localeCompare(b.startTime));
    const freeSlots = [];
    let currentEnd = 0; // 00:00

    for (const b of sorted) {
      const sVal = timeToVal(b.startTime);
      if (sVal - currentEnd >= 0.5) { // At least 30 minutes free
        const formatTime = (val: number) => {
          const hh = Math.floor(val);
          const mm = Math.round((val - hh) * 60);
          return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
        };
        freeSlots.push({
          start: formatTime(currentEnd),
          end: b.startTime,
          duration: Math.round((sVal - currentEnd) * 60)
        });
      }
      currentEnd = Math.max(currentEnd, timeToVal(b.endTime));
    }

    if (24 - currentEnd >= 0.5) {
      const formatTime = (val: number) => {
        const hh = Math.floor(val);
        const mm = Math.round((val - hh) * 60);
        return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      };
      freeSlots.push({
        start: formatTime(currentEnd),
        end: "24:00",
        duration: Math.round((24 - currentEnd) * 60)
      });
    }

    return freeSlots;
  };

  const freeTimeSlots = getFreeTimeSlots();

  // Smart AI Time Blocking trigger via Gemini
  const handleSmartTimeBlocking = async () => {
    setAiBlockLoading(true);
    try {
      const response = await fetch("/api/gemini/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: state.tasks,
          userContext: isRTL 
            ? "لطفا ساعت دقیق پیشنهادی (مثلا 09:30 یا 15:00) برای وظایف زیر را مشخص کن که بهترین راندمان را داشته باشد."
            : "Suggest precise timestamps (HH:MM) for these tasks based on energy level."
        })
      });

      if (response.ok) {
        const suggestions = await response.json();
        const updatedTasks = state.tasks.map((task) => {
          const match = suggestions.find((s: any) => s.taskId === task.id);
          if (match) {
            // Pick a reasonable hour based on block suggestion if not explicit
            let proposedTime = task.time || "10:00";
            if (match.timeBlock === "Morning") proposedTime = "09:00";
            else if (match.timeBlock === "Afternoon") proposedTime = "14:30";
            else if (match.timeBlock === "Evening") proposedTime = "18:00";
            else if (match.timeBlock === "Night") proposedTime = "21:00";

            return {
              ...task,
              time: proposedTime,
              deadline: selectedDate,
              aiSuggestion: match.aiSuggestion,
              aiScore: match.aiScore,
            };
          }
          return task;
        });

        onUpdateState({ ...state, tasks: updatedTasks });
        alert(isRTL ? "بلوک‌های زمانی هوشمند با موفقیت برنامه‌ریزی و همگام‌سازی شدند!" : "AI Smart Time blocking successfully aligned and synced!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiBlockLoading(false);
    }
  };

  // Smart Auto Rescheduling for missed tasks
  const handleAutoReschedule = () => {
    const nowVal = timeToVal(currentTime || "12:00");
    let rescheduledCount = 0;

    const updatedTasks = state.tasks.map(t => {
      // If task is scheduled for today, is not completed, and its scheduled time is in the past
      if (t.deadline === selectedDate && t.status !== "done" && t.time) {
        const tVal = timeToVal(t.time);
        if (tVal < nowVal) {
          // Find first free slot after current time
          const nextSlot = freeTimeSlots.find(slot => timeToVal(slot.start) >= nowVal);
          const newTime = nextSlot ? slotToStartTimeWithBuffer(nextSlot.start) : "17:30";
          rescheduledCount++;
          return {
            ...t,
            time: newTime,
            aiSuggestion: isRTL ? "تغییر زمان هوشمند پس از ازدست‌رفتن ضرب‌الاجل" : "Rescheduled to preserve workload balance."
          };
        }
      }
      return t;
    });

    if (rescheduledCount > 0) {
      onUpdateState({ ...state, tasks: updatedTasks });
      alert(isRTL 
        ? `تعداد ${rescheduledCount} وظیفه معلق به علت گذشتن زمان، به بازه‌های آزاد آینده منتقل شدند.` 
        : `Rescheduled ${rescheduledCount} tasks to future free slots safely.`);
    } else {
      alert(isRTL ? "هیچ وظیفه معلقی در زمان‌های گذشته یافت نشد." : "No missed tasks detected for rescheduling.");
    }
  };

  const slotToStartTimeWithBuffer = (startStr: string) => {
    const val = timeToVal(startStr);
    // Add a quick 10 min buffer
    const buf = val + 10/60;
    const hh = Math.floor(buf);
    const mm = Math.round((buf - hh) * 60);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  // Trigger Smart Day Review
  const triggerSmartDayReview = async () => {
    setAiReviewLoading(true);
    try {
      const response = await fetch("/api/gemini/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state })
      });
      if (response.ok) {
        const data = await response.json();
        setAiReview(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiReviewLoading(false);
    }
  };

  // Drag and Drop time editing proxy helper
  const handleDragShiftTime = (taskId: string, direction: "up" | "down") => {
    const updatedTasks = state.tasks.map(t => {
      if (t.id === taskId && t.time) {
        const val = timeToVal(t.time);
        const shift = direction === "up" ? -0.5 : 0.5; // shift by 30 mins
        let newVal = val + shift;
        if (newVal < 0) newVal = 23.5;
        if (newVal >= 24) newVal = 0;

        const hh = Math.floor(newVal);
        const mm = Math.round((newVal - hh) * 60);
        const timeStr = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;

        return { ...t, time: timeStr };
      }
      return t;
    });
    onUpdateState({ ...state, tasks: updatedTasks });
  };

  // Estimate completion rate
  const completedCount = tasksForDay.filter(t => t.status === "done").length;
  const totalCount = tasksForDay.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Active / next activity tracker
  const getActiveActivity = () => {
    const val = timeToVal(currentTime || "12:00");
    const activeBlock = focusBlocks.find(b => {
      const s = timeToVal(b.startTime);
      const e = timeToVal(b.endTime);
      return val >= s && val <= e;
    });
    return activeBlock ? activeBlock.title : (isRTL ? "زمان آزاد / متفرقه" : "Free Time / Leisure");
  };

  const getNextActivity = () => {
    const val = timeToVal(currentTime || "12:00");
    const futureBlocks = focusBlocks.filter(b => timeToVal(b.startTime) > val);
    if (futureBlocks.length === 0) return isRTL ? "اتمام برنامه‌های امروز" : "End of daily plans";
    return `${futureBlocks[0].startTime} - ${futureBlocks[0].title}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-right" dir={isRTL ? "rtl" : "ltr"}>
      {/* Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-indigo-400" />
            {isRTL ? "خط زمانی هوشمند زیستی" : "Smart Daily Timeline"}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isRTL 
              ? "مدیریت زمانبندی خطی ۲۴ ساعته روز، ادغام با تقویم و برنامه‌ریز زیستی به همراه تصحیح تعارض هوش مصنوعی."
              : "Linear 24-hour visual schedule with live progress and automatic rescheduling."}
          </p>
        </div>

        {/* Live Clock Progress Card */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <p className="text-slate-500 text-[10px] uppercase">{isRTL ? "زمان جاری" : "Current Time"}</p>
            <p className="text-lg font-bold text-indigo-400 mt-0.5">{toPersianDigits(currentTime || "12:00", usePersianNums)}</p>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-right">
            <p className="text-slate-500 text-[10px] uppercase">{isRTL ? "فعالیت زنده" : "Active Now"}</p>
            <p className="text-xs font-bold text-emerald-400 truncate max-w-[120px] mt-0.5">{getActiveActivity()}</p>
          </div>
        </div>
      </div>

      {/* Date Switcher and Timeline Options */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/20 p-4 rounded-2xl border border-slate-850">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400">{isRTL ? "انتخاب روز:" : "Choose Day:"}</label>
          <input
            type="date"
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-xl font-mono focus:outline-none"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Smart Time Blocking */}
          <button
            onClick={handleSmartTimeBlocking}
            disabled={aiBlockLoading}
            className="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {aiBlockLoading ? (isRTL ? "در حال بلوک‌بندی..." : "Blocking...") : (isRTL ? "بلوک‌بندی هوشمند هوش مصنوعی" : "AI Smart Time Block")}
          </button>

          {/* Auto Reschedule Missed */}
          <button
            onClick={handleAutoReschedule}
            className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            {isRTL ? "باززمان‌بندی خودکار کارهای فوت‌شده" : "Auto Reschedule Missed"}
          </button>
        </div>
      </div>

      {/* Conflicts and Live Progress Summary Warning Widgets */}
      {conflicts.length > 0 && (
        <div className="bg-rose-950/20 border border-rose-900/30 p-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-300 uppercase tracking-widest">
              {isRTL ? "تعارض در برنامه‌ریزی روزانه شناسایی شد!" : "Schedule Conflicts Detected!"}
            </h4>
            <div className="mt-1.5 space-y-1 text-xs text-rose-400/90 font-mono">
              {conflicts.map((conf, index) => (
                <p key={index}>• {conf.text}</p>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              {isRTL 
                ? "پیشنهاد: بر روی دکمه‌ی بلوک‌بندی هوشمند کلیک کنید تا هوش مصنوعی زمان‌های متعارض را برطرف کند."
                : "Tip: Use AI Smart Time Block to resolve overlaps instantly."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Columns: Visual 24-hour timeline */}
        <div className="lg:col-span-2 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              {isRTL ? "جدول خط زمانی روز" : "Daily Scheduler Chart"}
            </h3>

            <button
              onClick={() => setShowAddBlock(!showAddBlock)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {isRTL ? "بخش جدید" : "New Block"}
            </button>
          </div>

          {showAddBlock && (
            <form onSubmit={handleCreateBlock} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="text-right">
                  <label className="text-[10px] text-slate-400">{isRTL ? "عنوان بخش" : "Block Title"}</label>
                  <input
                    type="text"
                    required
                    placeholder={isRTL ? "مثلا: مطالعه ریاضی" : "e.g., Math study"}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 mt-1"
                    value={newBlockTitle}
                    onChange={(e) => setNewBlockTitle(e.target.value)}
                  />
                </div>

                <div className="text-right">
                  <label className="text-[10px] text-slate-400">{isRTL ? "زمان شروع" : "Start Time"}</label>
                  <input
                    type="time"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono mt-1"
                    value={newBlockStart}
                    onChange={(e) => setNewBlockStart(e.target.value)}
                  />
                </div>

                <div className="text-right">
                  <label className="text-[10px] text-slate-400">{isRTL ? "زمان پایان" : "End Time"}</label>
                  <input
                    type="time"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono mt-1"
                    value={newBlockEnd}
                    onChange={(e) => setNewBlockEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                  <span className="text-[10px] text-slate-500 self-center">{isRTL ? "دسته‌بندی:" : "Type:"}</span>
                  <select
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
                    value={newBlockType}
                    onChange={(e) => setNewBlockType(e.target.value as any)}
                  >
                    <option value="study">{isRTL ? "مطالعه 📚" : "Study"}</option>
                    <option value="workout">{isRTL ? "ورزش 💪" : "Workout"}</option>
                    <option value="reading">{isRTL ? "کتاب‌خوانی 📖" : "Reading"}</option>
                    <option value="deep_work">{isRTL ? "کار عمیق 💻" : "Deep Work"}</option>
                    <option value="rest">{isRTL ? "استراحت ☕" : "Rest"}</option>
                    <option value="sleep">{isRTL ? "خواب 🌙" : "Sleep"}</option>
                    <option value="meeting">{isRTL ? "جلسه 👥" : "Meeting"}</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-1.5 rounded-lg font-semibold cursor-pointer"
                >
                  {isRTL ? "افزودن" : "Add"}
                </button>
              </div>
            </form>
          )}

          {/* 24h Timeline List Display with Visual Time Scale */}
          <div className="space-y-4">
            {focusBlocks.map((block) => {
              // Find tasks mapped inside this block
              const startVal = timeToVal(block.startTime);
              const endVal = timeToVal(block.endTime);

              const mappedTasks = tasksForDay.filter(t => {
                if (!t.time) return false;
                const tVal = timeToVal(t.time);
                return tVal >= startVal && tVal < endVal;
              });

              return (
                <div key={block.id} className="relative group pl-2 border-l-2 border-indigo-500/25">
                  <div className={`p-4 rounded-xl border ${block.color} flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative transition-all duration-150`}>
                    <div className="flex items-start gap-3">
                      <span className="text-xl shrink-0">{block.icon}</span>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono tracking-wider">{toPersianDigits(block.startTime, usePersianNums)} - {toPersianDigits(block.endTime, usePersianNums)}</span>
                          <span className="text-[10px] opacity-60 uppercase">{block.type}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-100 mt-1">{block.title}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      {/* Delete section block */}
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer transition-all"
                        title={isRTL ? "حذف بخش" : "Delete block"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Tasks nested inside this focus block */}
                  {mappedTasks.length > 0 && (
                    <div className="mt-2 mr-6 space-y-2">
                      {mappedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded text-[10px]">
                              {toPersianDigits(task.time || "12:00", usePersianNums)}
                            </span>
                            <span className={task.status === "done" ? "line-through text-slate-500" : "text-slate-300 font-semibold"}>
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Drag Reschedule Shifter controls */}
                            <div className="flex flex-col">
                              <button
                                onClick={() => handleDragShiftTime(task.id, "up")}
                                className="text-[9px] hover:text-indigo-400 cursor-pointer"
                                title={isRTL ? "جابجایی به عقب" : "Shift back"}
                              >
                                ▲
                              </button>
                              <button
                                onClick={() => handleDragShiftTime(task.id, "down")}
                                className="text-[9px] hover:text-indigo-400 cursor-pointer"
                                title={isRTL ? "جابجایی به جلو" : "Shift forward"}
                              >
                                ▼
                              </button>
                            </div>

                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono border ${
                              task.priority === "critical" ? "border-rose-500/30 text-rose-400 bg-rose-500/5" :
                              task.priority === "high" ? "border-amber-500/30 text-amber-400 bg-amber-500/5" :
                              "border-indigo-500/30 text-indigo-400 bg-indigo-500/5"
                            }`}>
                              {toPersianDigits(task.estimatedTime, usePersianNums)} {isRTL ? "دقیقه" : "min"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Free Time Finder & AI Smart Review */}
        <div className="space-y-6">
          {/* Daily Completion Progress Widget */}
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-400" />
              {isRTL ? "راندمان خط زمانی" : "Timeline Completion Progress"}
            </h3>

            <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
              <div className="text-right flex-1">
                <p className="text-[10px] text-slate-500">{isRTL ? "تکمیل کارهای امروز" : "Today's Task Completion"}</p>
                <p className="text-2xl font-bold text-white font-mono mt-0.5">
                  {toPersianDigits(completionPercentage, usePersianNums)}%
                </p>
              </div>

              <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 flex items-center justify-center font-bold text-slate-200 text-xs font-mono">
                {toPersianDigits(completedCount, usePersianNums)}/{toPersianDigits(totalCount, usePersianNums)}
              </div>
            </div>
          </div>

          {/* Free Time Slots detector */}
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-emerald-400" />
              {isRTL ? "ردیاب بازه‌های آزاد روز" : "Detected Free Slots"}
            </h3>

            <div className="space-y-2">
              {freeTimeSlots.length > 0 ? (
                freeTimeSlots.map((slot, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between">
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-400 font-mono">
                        {toPersianDigits(slot.start, usePersianNums)} - {toPersianDigits(slot.end, usePersianNums)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isRTL ? `مدت زمان: ${toPersianDigits(slot.duration, usePersianNums)} دقیقه` : `Duration: ${slot.duration} mins`}
                      </p>
                    </div>

                    <span className="text-[9px] bg-slate-900 text-slate-500 px-2.5 py-1 rounded-md">
                      {isRTL ? "بدون تعارض" : "No conflicts"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center italic">{isRTL ? "هیچ بازه آزادی شناسایی نشد (تراکم بالا)" : "No free slots detected today."}</p>
              )}
            </div>
          </div>

          {/* Smart Day Review section via Gemini */}
          <div className="bg-gradient-to-br from-indigo-950/25 to-purple-950/25 border border-indigo-900/30 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-400" />
              {isRTL ? "بازبینی هوشمند عملکرد روز" : "AI Smart Day Review"}
            </h3>

            <p className="text-xs text-slate-300">
              {isRTL 
                ? "هوش مصنوعی با تحلیل راندمان مطالعه، عادات و کیفیت خواب، گزارش دقیقی از روز سپری‌شده صادر می‌کند."
                : "Generate a fully personalized high-performance audit review based on today's logs."}
            </p>

            <button
              onClick={triggerSmartDayReview}
              disabled={aiReviewLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {aiReviewLoading ? (isRTL ? "در حال تحلیل..." : "Analyzing...") : (isRTL ? "تولید گزارش زیست‌سنجی روزانه" : "Generate Day Review")}
            </button>

            {aiReview && (
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-900 space-y-3 text-right">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">{isRTL ? "خلاصه تحلیل" : "Summary"}</span>
                  <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{aiReview.summary}</p>
                </div>

                <div className="border-t border-slate-850 pt-2">
                  <span className="text-[10px] text-indigo-400 uppercase">{isRTL ? "مهم‌ترین اولویت فردا" : "Most Important Priority"}</span>
                  <p className="text-xs font-bold text-slate-100 mt-0.5">{aiReview.mostImportantTask}</p>
                </div>

                <div className="border-t border-slate-850 pt-2">
                  <span className="text-[10px] text-emerald-400 uppercase">{isRTL ? "توصیه بهره‌وری روز" : "Productivity Advice"}</span>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{aiReview.productivityAdvice}</p>
                </div>

                <div className="border-t border-slate-850 pt-2">
                  <span className="text-[10px] text-rose-400 uppercase">{isRTL ? "هشدار فرسودگی / سلامت" : "Healthy Warning"}</span>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{aiReview.warning}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
