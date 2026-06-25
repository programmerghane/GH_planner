import React, { useState } from "react";
import {
  CheckSquare,
  Square,
  Trash2,
  Plus,
  Zap,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Flame,
  CheckCircle,
} from "lucide-react";
import { Task, AppState } from "../types";
import { t, toPersianDigits } from "../lib/i18n";

interface PlannerSystemProps {
  state: AppState;
  onUpdateTasks: (tasks: Task[], xpReward?: number) => void;
  triggerSync: (updatedState: any) => void;
  lang?: "fa" | "en";
  usePersianNums?: boolean;
}

export default function PlannerSystem({
  state,
  onUpdateTasks,
  triggerSync,
  lang = "fa",
  usePersianNums = true,
}: PlannerSystemProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [energy, setEnergy] = useState<Task["energy"]>("medium");
  const [difficulty, setDifficulty] = useState<Task["difficulty"]>("medium");
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("General");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState("");
  const [timeBlockFilter, setTimeBlockFilter] = useState<string>("All");
  const [aiPlanning, setAiPlanning] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: Task = {
      id: "task_" + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      description: `Task in ${category} with ${difficulty} difficulty.`,
      priority,
      energy,
      difficulty,
      estimatedTime: Number(estimatedTime) || 30,
      deadline: deadline || undefined,
      category,
      status: "todo",
      checklist: [],
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    const updatedTasks = [...state.tasks, newTask];
    onUpdateTasks(updatedTasks, 10); // Reward 10 XP for task formulation
    setTitle("");
  };

  const handleToggleTask = (taskId: string) => {
    const updated = state.tasks.map((t) => {
      if (t.id === taskId) {
        const newStatus: Task["status"] = t.status === "done" ? "todo" : "done";
        const isNowDone = newStatus === "done";
        return {
          ...t,
          status: newStatus,
          progress: isNowDone ? 100 : 0,
        };
      }
      return t;
    });

    // If a task was completed, reward 25 XP
    const completedTask = state.tasks.find((t) => t.id === taskId);
    const xpReward = completedTask && completedTask.status !== "done" ? 25 : 0;
    onUpdateTasks(updated, xpReward);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = state.tasks.filter((t) => t.id !== taskId);
    onUpdateTasks(updated);
  };

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtask.trim()) return;
    const updated = state.tasks.map((t) => {
      if (t.id === taskId) {
        const subs = [
          ...t.checklist,
          {
            id: "sub_" + Math.random().toString(36).substring(2, 9),
            text: newSubtask.trim(),
            done: false,
          },
        ];
        // Calculate progress
        const doneCount = subs.filter((s) => s.done).length;
        const progress = Math.round((doneCount / subs.length) * 100);
        return { ...t, checklist: subs, progress };
      }
      return t;
    });
    onUpdateTasks(updated);
    setNewSubtask("");
  };

  const handleToggleSubtask = (taskId: string, subId: string) => {
    const updated = state.tasks.map((t) => {
      if (t.id === taskId) {
        const subs = t.checklist.map((s) => {
          if (s.id === subId) return { ...s, done: !s.done };
          return s;
        });
        const doneCount = subs.filter((s) => s.done).length;
        const progress = Math.round((doneCount / subs.length) * 100);
        return {
          ...t,
          checklist: subs,
          progress,
          status: (progress === 100 ? "done" : t.status) as Task["status"],
        };
      }
      return t;
    });
    onUpdateTasks(updated);
  };

  // Trigger Smart server-side AI auto planner
  const runSmartPlanner = async () => {
    if (state.tasks.length === 0) {
      alert(lang === "fa" 
        ? "لطفاً ابتدا چند وظیفه اضافه کنید تا هوش مصنوعی بتواند آن‌ها را سازمان‌دهی کند." 
        : "Please add some tasks first so the AI can organize them.");
      return;
    }
    setAiPlanning(true);
    try {
      const response = await fetch("/api/gemini/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: state.tasks,
          userContext: aiInstruction,
        }),
      });
      if (!response.ok) throw new Error("Planner service error");
      const suggestions = await response.json();

      // Apply the suggestions back to the tasks
      const updatedTasks = state.tasks.map((task) => {
        const match = suggestions.find((s: any) => s.taskId === task.id);
        if (match) {
          return {
            ...task,
            description: `${task.description} (Suggested for ${match.timeBlock})`,
            aiScore: match.aiScore,
            aiSuggestion: match.aiSuggestion,
            // Tag with timeblock category
            category: match.timeBlock,
          };
        }
        return task;
      });

      onUpdateTasks(updatedTasks, 50); // Reward 50 XP for AI optimization
      alert(lang === "fa"
        ? "بهینه‌سازی برنامه با موفقیت انجام شد! وظایف به بهترین شکل در دسته‌بندی‌های زمانی چیده شدند."
        : "AI Schedule optimization complete! Tasks successfully prioritized by time blocks.");
    } catch (err: any) {
      console.error(err);
      alert(lang === "fa"
        ? "اتصال به سرور هوش مصنوعی برقرار نشد. لطفاً کلید API را در تنظیمات بررسی کنید."
        : "Failed to connect to the Gemini AI server. Check Settings > Secrets.");
    } finally {
      setAiPlanning(false);
    }
  };

  const todoTasks = state.tasks.filter((t) => t.status !== "done");
  const completedTasks = state.tasks.filter((t) => t.status === "done");

  const getPriorityColor = (p: Task["priority"]) => {
    switch (p) {
      case "critical":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "high":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "medium":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-right" dir={lang === "fa" ? "rtl" : "ltr"}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-400" />
            {lang === "fa" ? "سامانه برنامه‌ریزی هوشمند" : "Smart Planner OS"}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {lang === "fa"
              ? "تقسیم وظایف درسی، ارزیابی سطوح انرژی روزانه و برنامه‌ریزی خودکار با هوش مصنوعی برای دستیابی به بهترین روتین."
              : "Break down study loads, forecast energy levels, and let AI build optimal routines."}
          </p>
        </div>

        {/* Quick Progress Indicator */}
        <div className="flex items-center gap-4 bg-slate-950/40 px-4 py-2.5 rounded-xl border border-slate-800/80">
          <div className="text-right">
            <p className="text-xs text-slate-500">
              {lang === "fa" ? "میزان تکمیل امروز" : "Today's Completion"}
            </p>
            <p className="text-lg font-display font-bold text-white font-mono">
              {toPersianDigits(
                state.tasks.length > 0
                  ? Math.round((completedTasks.length / state.tasks.length) * 100)
                  : 0,
                usePersianNums
              )}
              %
            </p>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 flex items-center justify-center font-display text-xs font-semibold text-indigo-400 font-mono">
            {toPersianDigits(completedTasks.length, usePersianNums)}/{toPersianDigits(state.tasks.length, usePersianNums)}
          </div>
        </div>
      </div>

      {/* AI Orchestrator Section */}
      <div className="bg-gradient-to-r from-indigo-950/20 to-purple-950/20 border border-indigo-900/40 p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-24 h-24 text-indigo-400" />
        </div>
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-100">
              {t("smartPlannerAuto", lang)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {t("smartPlannerDesc", lang)}
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder={
                  lang === "fa"
                    ? "مثلاً: 'امروز کمی خسته‌ام، کارهای نیازمند تمرکز بالا را برای صبح برنامه‌ریزی کن'"
                    : "E.g., 'I feel tired today, schedule high complexity study items in Morning'"
                }
                className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60 text-right"
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
              />
              <button
                onClick={runSmartPlanner}
                disabled={aiPlanning}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-150 shrink-0 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 disabled:opacity-50 cursor-pointer"
              >
                {aiPlanning ? (lang === "fa" ? "در حال برنامه‌ریزی..." : "Planning...") : t("optimizeSchedule", lang)}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Quick Add Form */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" />
            {lang === "fa" ? "افزودن سریع وظیفه جدید" : "Quick Add Task"}
          </h3>

          <form onSubmit={handleAddTask} className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 font-medium">
                {lang === "fa" ? "عنوان وظیفه" : "Task Title"}
              </label>
              <input
                type="text"
                required
                placeholder={lang === "fa" ? "مثال: مطالعه فصل چهارم شیمی آلی" : "E.g., Study Organic Chemistry chapter 4"}
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60 mt-1 text-right"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 font-medium">
                  {t("priority", lang)}
                </label>
                <select
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none mt-1 text-right"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                >
                  <option value="low">{lang === "fa" ? "کم" : "Low"}</option>
                  <option value="medium">{lang === "fa" ? "متوسط" : "Medium"}</option>
                  <option value="high">{lang === "fa" ? "زیاد" : "High"}</option>
                  <option value="critical">{lang === "fa" ? "بحرانی" : "Critical"}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium">
                  {lang === "fa" ? "بازه زمانی" : "Time Slot"}
                </label>
                <select
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none mt-1 text-right"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="General">{lang === "fa" ? "تخصیص‌نیافته" : "Unassigned"}</option>
                  <option value="Morning">{lang === "fa" ? "صبح ☀️" : "Morning ☀️"}</option>
                  <option value="Afternoon">{lang === "fa" ? "ظهر و عصر ⛅" : "Afternoon ⛅"}</option>
                  <option value="Evening">{lang === "fa" ? "غروب 🌆" : "Evening 🌆"}</option>
                  <option value="Night">{lang === "fa" ? "شب 🌙" : "Night 🌙"}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> {t("energyRequired", lang)}
                </label>
                <select
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none mt-1 text-right"
                  value={energy}
                  onChange={(e) => setEnergy(e.target.value as any)}
                >
                  <option value="low">{lang === "fa" ? "کم 🔋" : "Low 🔋"}</option>
                  <option value="medium">{lang === "fa" ? "متوسط 🔋🔋" : "Medium 🔋🔋"}</option>
                  <option value="high">{lang === "fa" ? "زیاد 🔋🔋🔋" : "High 🔋🔋🔋"}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" /> {lang === "fa" ? "مدت تخمینی (دقیقه)" : "Mins (Est)"}
                </label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-3 py-1 text-xs text-slate-200 mt-1 font-mono text-right"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-medium">
                {lang === "fa" ? "ضرب‌الاجل (اختیاری)" : "Deadline Date (Optional)"}
              </label>
              <input
                type="date"
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none mt-1 font-mono"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white text-xs font-semibold py-2 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> {lang === "fa" ? "ذخیره وظیفه جدید (+۱۰ امتیاز)" : "Add Task (10 XP)"}
            </button>
          </form>
        </div>

        {/* Right Column: Active and Organized tasks */}
        <div className="lg:col-span-2 space-y-4">
          {/* Time Block Filter Options */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 select-none">
            {["All", "Morning", "Afternoon", "Evening", "Night"].map((block) => {
              const label = block === "All" ? (lang === "fa" ? "همه بازه‌ها" : "All") :
                            block === "Morning" ? (lang === "fa" ? "صبح" : "Morning") :
                            block === "Afternoon" ? (lang === "fa" ? "عصر" : "Afternoon") :
                            block === "Evening" ? (lang === "fa" ? "غروب" : "Evening") :
                            (lang === "fa" ? "شب" : "Night");
              return (
                <button
                  key={block}
                  onClick={() => setTimeBlockFilter(block)}
                  className={`text-xs px-3.5 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                    timeBlockFilter === block
                      ? "bg-slate-100 text-slate-950 border-slate-200"
                      : "bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-slate-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Tasks List container */}
          <div className="space-y-2.5">
            {todoTasks.filter(
              (t) => timeBlockFilter === "All" || t.category === timeBlockFilter
            ).length === 0 &&
              completedTasks.filter(
                (t) =>
                  timeBlockFilter === "All" || t.category === timeBlockFilter
              ).length === 0 && (
                <div className="text-center py-12 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                  <CheckCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm font-medium">
                    {lang === "fa" ? "برنامه شما خالی است! روز خود را پر و هدفمند کنید." : "Clean schedule! Let's fill your day."}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {lang === "fa" ? "وظایف جدید در کادر سمت راست وارد کنید یا بهینه‌ساز هوش مصنوعی را اجرا کنید." : "Add high-energy study tasks above or trigger AI optimizer."}
                  </p>
                </div>
              )}

            {/* Todo Tasks */}
            {todoTasks
              .filter(
                (t) =>
                  timeBlockFilter === "All" || t.category === timeBlockFilter
              )
              .map((task) => {
                const categoryLabel = task.category === "Morning" ? (lang === "fa" ? "صبح ☀️" : "Morning ☀️") :
                                      task.category === "Afternoon" ? (lang === "fa" ? "عصر ⛅" : "Afternoon ⛅") :
                                      task.category === "Evening" ? (lang === "fa" ? "غروب 🌆" : "Evening 🌆") :
                                      task.category === "Night" ? (lang === "fa" ? "شب 🌙" : "Night 🌙") :
                                      (lang === "fa" ? "عمومی ⚙️" : "General ⚙️");
                const priorityLabel = task.priority === "critical" ? (lang === "fa" ? "بحرانی" : "Critical") :
                                      task.priority === "high" ? (lang === "fa" ? "زیاد" : "High") :
                                      task.priority === "medium" ? (lang === "fa" ? "متوسط" : "Medium") :
                                      (lang === "fa" ? "کم" : "Low");
                return (
                  <div
                    key={task.id}
                    className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl p-4 transition-all duration-150 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="p-1 rounded-md text-slate-500 hover:text-indigo-400 hover:bg-slate-800/50 cursor-pointer"
                      >
                        <Square className="w-5 h-5" />
                      </button>

                      <div className="flex-1 min-w-0 text-right">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-slate-400 font-mono">
                            {categoryLabel}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border ${getPriorityColor(
                              task.priority
                            )} uppercase font-mono tracking-wider`}
                          >
                            {priorityLabel}
                          </span>
                          {task.energy === "high" && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-0.5 font-mono">
                              <Flame className="w-3 h-3 text-amber-500" /> {lang === "fa" ? "انرژی بالا 🔥" : "High Energy"}
                            </span>
                          )}
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" /> {toPersianDigits(task.estimatedTime, usePersianNums)} {lang === "fa" ? "دقیقه" : "m"}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-100 mt-1">
                          {task.title}
                        </p>
                        {task.aiSuggestion && (
                          <p className="text-[11px] text-purple-400/90 mt-1 italic flex items-center gap-1">
                            <Sparkles className="w-3 h-3 animate-pulse" />
                            {task.aiSuggestion}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            setExpandedTask(
                              expandedTask === task.id ? null : task.id
                            )
                          }
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
                        >
                          {expandedTask === task.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Subtasks details */}
                    {expandedTask === task.id && (
                      <div className="pr-8 pl-0 pt-2.5 border-t border-slate-800/80 space-y-3">
                        <div className="space-y-1.5">
                          {task.checklist.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none"
                              onClick={() =>
                                handleToggleSubtask(task.id, sub.id)
                              }
                            >
                              {sub.done ? (
                                <CheckSquare className="w-4 h-4 text-indigo-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-500" />
                              )}
                              <span
                                className={
                                  sub.done
                                    ? "line-through text-slate-500"
                                    : "text-slate-300"
                                }
                              >
                                {sub.text}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Add subtask input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={lang === "fa" ? "تقسیم وظیفه به گام‌های کوچک‌تر..." : "Break down task step..."}
                            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none text-right"
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddSubtask(task.id);
                            }}
                          />
                          <button
                            onClick={() => handleAddSubtask(task.id)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer"
                          >
                            {lang === "fa" ? "افزودن گام" : "Add Step"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Completed Tasks section header */}
            {completedTasks.length > 0 && (
              <div className="pt-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2.5">
                  {lang === "fa" ? "بایگانی / تکمیل‌شده" : "Archived / Completed"}
                </h4>
                <div className="space-y-2">
                  {completedTasks
                    .filter(
                      (t) =>
                        timeBlockFilter === "All" ||
                        t.category === timeBlockFilter
                    )
                    .map((task) => (
                      <div
                        key={task.id}
                        className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-3 flex items-center justify-between gap-3 opacity-65"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleTask(task.id)}
                            className="p-1 rounded-md text-indigo-400 cursor-pointer"
                          >
                            <CheckSquare className="w-5 h-5" />
                          </button>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-slate-400 line-through">
                              {task.title}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {lang === "fa" ? `تکمیل شد • +${toPersianDigits(25, usePersianNums)} امتیاز دریافت شد` : "Completed • +25 XP awarded"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 rounded-md text-slate-600 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
