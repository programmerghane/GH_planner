import React, { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FolderHeart as FolderHeartIcon,
  Flame as FlameIcon,
  Smile,
  LogOut,
  Calendar,
  CheckCircle,
  Plus as PlusIcon,
} from "lucide-react";
import { TrackerType, TrackerEntry, Habit, AppState } from "../types";
import { t, toPersianDigits } from "../lib/i18n";

interface CustomTrackersProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  onAddXP: (xp: number, type: string, desc: string) => void;
  lang?: "fa" | "en";
  usePersianNums?: boolean;
}

export default function CustomTrackers({
  state,
  onUpdateState,
  onAddXP,
  lang = "fa",
  usePersianNums = true,
}: CustomTrackersProps) {
  const [selectedTrackerId, setSelectedTrackerId] = useState<string>("sleep");
  const [newValue, setNewValue] = useState<string>("");
  const [newNote, setNewNote] = useState<string>("");
  const [showAddTrackerForm, setShowAddTrackerForm] = useState(false);
  
  // Custom tracker form states
  const [trackerName, setTrackerName] = useState("");
  const [trackerEmoji, setTrackerEmoji] = useState("🏷️");
  const [trackerColor, setTrackerColor] = useState("#a855f7");
  const [trackerUnit, setTrackerUnit] = useState("");
  const [trackerCategory, setTrackerCategory] = useState("Custom");
  const [trackerInputType, setTrackerInputType] = useState<TrackerType["inputType"]>("number");

  // Habit quick form state
  const [habitTitle, setHabitTitle] = useState("");
  const [habitEmoji, setHabitEmoji] = useState("🚀");
  const [habitColor, setHabitColor] = useState("#6366f1");

  const handleLogTrackerEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    const currentSelected = state.trackerTypes.find((t) => t.id === selectedTrackerId);
    if (!currentSelected) return;

    const parsedVal = currentSelected.inputType === "number" || currentSelected.inputType === "slider" || currentSelected.inputType === "rating" || currentSelected.inputType === "mood"
      ? Number(newValue)
      : newValue;

    const newEntry: TrackerEntry = {
      id: "entry_" + Math.random().toString(36).substring(2, 9),
      trackerTypeId: selectedTrackerId,
      date: new Date().toISOString().split("T")[0],
      value: parsedVal,
      note: newNote.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedEntries = [...state.trackerEntries, newEntry];
    
    // Add XP for logging tracker
    onAddXP(15, "tracker", `Logged entry in ${currentSelected.name}`);

    onUpdateState({
      ...state,
      trackerEntries: updatedEntries,
    });

    setNewValue("");
    setNewNote("");
  };

  const handleCreateTracker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackerName.trim()) return;

    const newTracker: TrackerType = {
      id: "tr_" + Math.random().toString(36).substring(2, 9),
      name: trackerName.trim(),
      description: `Track ${trackerName} logs`,
      emoji: trackerEmoji,
      color: trackerColor,
      unit: trackerUnit || "logs",
      category: trackerCategory,
      inputType: trackerInputType,
      minVal: 0,
      maxVal: 100,
      targetVal: 1,
    };

    onUpdateState({
      ...state,
      trackerTypes: [...state.trackerTypes, newTracker],
    });

    setTrackerName("");
    setTrackerUnit("");
    setShowAddTrackerForm(false);
    onAddXP(30, "tracker", `Formed custom tracker: ${trackerName}`);
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;

    const newHabit: Habit = {
      id: "habit_" + Math.random().toString(36).substring(2, 9),
      title: habitTitle.trim(),
      description: "Build consistency and unlock daily milestones",
      emoji: habitEmoji,
      color: habitColor,
      frequency: "daily",
      currentStreak: 0,
      longestStreak: 0,
      history: {},
      createdAt: new Date().toISOString(),
    };

    onUpdateState({
      ...state,
      habits: [...state.habits, newHabit],
    });

    setHabitTitle("");
    onAddXP(20, "habit", `Established habit: ${habitTitle}`);
  };

  const handleToggleHabitDay = (habitId: string, dateStr: string) => {
    const updatedHabits = state.habits.map((h) => {
      if (h.id === habitId) {
        const history = { ...h.history };
        const currentlyDone = !!history[dateStr];
        history[dateStr] = !currentlyDone;

        // Calculate streaks
        let streak = h.currentStreak;
        if (!currentlyDone) {
          streak += 1;
        } else {
          streak = Math.max(0, streak - 1);
        }

        return {
          ...h,
          history,
          currentStreak: streak,
          longestStreak: Math.max(h.longestStreak, streak),
        };
      }
      return h;
    });

    onAddXP(20, "habit", "Marked habit goal completed");
    onUpdateState({
      ...state,
      habits: updatedHabits,
    });
  };

  const selectedTracker = state.trackerTypes.find((t) => t.id === selectedTrackerId) || state.trackerTypes[0];

  // Map tracker entries to chart data
  const chartData = state.trackerEntries
    .filter((entry) => entry.trackerTypeId === selectedTrackerId)
    .map((e) => ({
      date: e.date,
      value: typeof e.value === "number" ? e.value : 1,
      note: e.note,
    }))
    .slice(-7); // Last 7 logs

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir={lang === "fa" ? "rtl" : "ltr"}>
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 text-right">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2.5 justify-start">
            <FolderHeartIcon className="w-6 h-6 text-indigo-400" />
            {lang === "fa" ? "ردیاب‌های یکپارچه و عادات زیستی" : "Integrative Trackers & Habits"}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {lang === "fa"
              ? "ایجاد روتین‌های ماندگار، ردیابی خواب، ساعات مطالعه، مصرف آب و نمایش روندهای گرافیکی بلادرنگ."
              : "Build bulletproof routines, track sleep, study hours, water metrics, and view real-time graphical trends."}
          </p>
        </div>

        <button
          onClick={() => setShowAddTrackerForm(!showAddTrackerForm)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-150 flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" /> {lang === "fa" ? "ایجاد ردیاب سفارشی" : "Create Custom Tracker"}
        </button>
      </div>

      {showAddTrackerForm && (
        <form onSubmit={handleCreateTracker} className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4 max-w-xl text-right">
          <h3 className="text-sm font-semibold text-slate-200">{lang === "fa" ? "ردیاب معیار سفارشی جدید" : "New Custom Metric Tracker"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400">{lang === "fa" ? "نام ردیاب" : "Tracker Name"}</label>
              <input
                type="text"
                required
                placeholder={lang === "fa" ? "مانند: مدت استفاده از گوشی، صفحات مطالعه" : "E.g., Screen Time, Reading Pages"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 mt-1 focus:outline-none text-right"
                value={trackerName}
                onChange={(e) => setTrackerName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">{lang === "fa" ? "نوع ورودی" : "Input Type"}</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 mt-1 focus:outline-none text-right"
                value={trackerInputType}
                onChange={(e) => setTrackerInputType(e.target.value as any)}
              >
                <option value="number">{lang === "fa" ? "ورودی عددی" : "Number Entry"}</option>
                <option value="slider">{lang === "fa" ? "اسلایدر کشویی" : "Range Slider"}</option>
                <option value="mood">{lang === "fa" ? "خلق‌وخو (۱ تا ۱۰)" : "Mood (1-10)"}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-slate-400">{lang === "fa" ? "برچسب واحد سنجش" : "Unit Label"}</label>
              <input
                type="text"
                placeholder={lang === "fa" ? "مانند: صفحه، دقیقه" : "E.g., pages, mins"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 mt-1 focus:outline-none text-right"
                value={trackerUnit}
                onChange={(e) => setTrackerUnit(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">{lang === "fa" ? "ایموجی" : "Emoji icon"}</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 mt-1 focus:outline-none text-right"
                value={trackerEmoji}
                onChange={(e) => setTrackerEmoji(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">{lang === "fa" ? "رنگ شاخص" : "Accent Color"}</label>
              <input
                type="color"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl h-8 mt-1 p-0.5 cursor-pointer"
                value={trackerColor}
                onChange={(e) => setTrackerColor(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-xl font-semibold transition-colors cursor-pointer"
          >
            {lang === "fa" ? "فرموله‌سازی ردیاب (+۳۰ امتیاز)" : "Formulate Tracker (+30 XP)"}
          </button>
        </form>
      )}

      {/* Habits Streaks and Completion Suite */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Habits checks */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4 text-right">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 justify-start">
              <FlameIcon className="w-4.5 h-4.5 text-orange-500 animate-pulse" />
              {lang === "fa" ? "حلقه عادات روزانه" : "Daily Habit Loop"}
            </h3>
          </div>

          {/* Habit Addition form */}
          <form onSubmit={handleCreateHabit} className="flex gap-2">
            <input
              type="text"
              required
              placeholder={lang === "fa" ? "افزودن عادت (مانند: مطالعه ۲۰ صفحه)" : "Add Habit (e.g., Read 20 mins)"}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none text-right"
              value={habitTitle}
              onChange={(e) => setHabitTitle(e.target.value)}
            />
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-xl text-xs cursor-pointer shrink-0"
            >
              {lang === "fa" ? "افزودن" : "Add"}
            </button>
          </form>

          <div className="space-y-2.5">
            {state.habits.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                {lang === "fa" ? "هنوز عادتی تعریف نشده است. کوچک شروع کنید و زنجیره تداوم بسازید!" : "No habits defined yet. Start small and build streaks!"}
              </p>
            ) : (
              state.habits.map((habit) => {
                const isLoggedToday = !!habit.history[todayStr];
                return (
                  <div
                    key={habit.id}
                    className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{habit.emoji || "🚀"}</span>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-100">
                          {habit.title}
                        </p>
                        <p className="text-[10px] text-orange-400 font-mono flex items-center gap-0.5 mt-0.5">
                          <FlameIcon className="w-3 h-3" /> {toPersianDigits(habit.currentStreak, usePersianNums)} {lang === "fa" ? "روز تداوم پیاپی" : "day streak"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleHabitDay(habit.id, todayStr)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150 flex items-center gap-1 cursor-pointer shrink-0 ${
                        isLoggedToday
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
                      }`}
                    >
                      {isLoggedToday ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" /> {lang === "fa" ? "انجام شد" : "Done"}
                        </>
                      ) : (
                        lang === "fa" ? "ثبت امروز" : "Log Today"
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Columns: Custom Telemetry Graph and Log entry form */}
        <div className="md:col-span-2 space-y-6 text-right">
          {/* Tracker Selection Header Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1" dir={lang === "fa" ? "rtl" : "ltr"}>
            {state.trackerTypes.map((tr) => (
              <button
                key={tr.id}
                onClick={() => setSelectedTrackerId(tr.id)}
                className={`text-xs px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all duration-150 shrink-0 cursor-pointer ${
                  selectedTrackerId === tr.id
                    ? "bg-slate-100 text-slate-950 border-slate-200"
                    : "bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-slate-200"
                }`}
              >
                <span>{tr.emoji}</span>
                <span className="font-semibold">{tr.name}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-stretch">
            {/* Entry Logger */}
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between text-right">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1 justify-start">
                  <span>{selectedTracker.emoji}</span> {lang === "fa" ? `ثبت ${selectedTracker.name}` : `Log ${selectedTracker.name}`}
                </h4>
                <p className="text-xs text-slate-400">
                  {selectedTracker.description}
                </p>

                <form onSubmit={handleLogTrackerEntry} className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400">
                      {lang === "fa" ? "مقدار" : "Value"} ({selectedTracker.unit})
                    </label>
                    <input
                      type="number"
                      required
                      placeholder={lang === "fa" ? `مانند: هدف روزانه ${toPersianDigits(selectedTracker.targetVal, usePersianNums)}` : `E.g., target ${selectedTracker.targetVal}`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none mt-1 text-right"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400">{lang === "fa" ? "یادداشت / توضیحات" : "Notes / Remarks"}</label>
                    <input
                      type="text"
                      placeholder={lang === "fa" ? "مانند: خواب عمیق و راحت" : "E.g., slept like a rock"}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none mt-1 text-right"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 rounded-xl transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {lang === "fa" ? "ذخیره مقدار جدید (+۱۵ امتیاز)" : "Save Entry (+15 XP)"}
                  </button>
                </form>
              </div>
            </div>

            {/* Graphical Analytics (Recharts Area Chart) */}
            <div className="sm:col-span-2 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-right">
                  {lang === "fa" ? "تاریخچه تله‌متری و آمار (۷ ثبت اخیر)" : "Historical telemetry (7 logs)"}
                </h4>
                <span className="text-[10px] text-indigo-400 font-mono font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  {lang === "fa" ? "هدف" : "Target"}: {toPersianDigits(selectedTracker.targetVal, usePersianNums)} {selectedTracker.unit}
                </span>
              </div>

              <div className="flex-1 min-h-[160px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={selectedTracker.color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={selectedTracker.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#1e293b",
                          borderRadius: "12px",
                          textAlign: "right",
                        }}
                        labelStyle={{ color: "#94a3b8", fontSize: "11px" }}
                        itemStyle={{ color: "#f8fafc", fontSize: "12px" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={selectedTracker.color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8 italic text-center">
                    {lang === "fa" ? "اولین مقدار تله‌متری خود را برای نمایش نمودارها ثبت کنید!" : "Log your first telemetry entry to render charts!"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
