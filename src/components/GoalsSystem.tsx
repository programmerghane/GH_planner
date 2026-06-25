import React, { useState } from "react";
import {
  Target,
  Plus,
  Calendar,
  Sparkles,
  Trophy,
  CheckCircle,
  Clock,
  Trash2,
  AlertTriangle,
  Grid,
  Link2,
  Bookmark
} from "lucide-react";
import { Goal, AppState, Task, Habit } from "../types";
import { toPersianDigits } from "../lib/i18n";

interface GoalsSystemProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  lang?: "fa" | "en";
  usePersianNums?: boolean;
}

export default function GoalsSystem({
  state,
  onUpdateState,
  lang = "fa",
  usePersianNums = true,
}: GoalsSystemProps) {
  const isRTL = lang === "fa";
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Goal["priority"]>("medium");
  const [category, setCategory] = useState("Academic");
  const [deadline, setDeadline] = useState("");
  
  const [newMilestoneText, setNewMilestoneText] = useState("");
  const [selectedGoalIdForMilestone, setSelectedGoalIdForMilestone] = useState<string | null>(null);

  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newGoal: Goal = {
      id: "goal_" + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      description: description.trim() || (isRTL ? "برنامه‌ریزی هدفمند دوره جدید" : "Systematic growth planning goal."),
      priority,
      category,
      deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      progress: 0,
      milestones: [],
      status: "active",
      createdAt: new Date().toISOString(),
      relatedHabits: [],
    };

    const updatedGoals = [...state.goals, newGoal];
    onUpdateState({
      ...state,
      goals: updatedGoals,
      profile: {
        ...state.profile,
        xp: state.profile.xp + 15 // Reward 15 XP for goal formulating
      }
    });

    setTitle("");
    setDescription("");
    setShowAddGoal(false);
  };

  const handleDeleteGoal = (goalId: string) => {
    const updated = state.goals.filter(g => g.id !== goalId);
    onUpdateState({ ...state, goals: updated });
  };

  const handleAddMilestone = (goalId: string) => {
    if (!newMilestoneText.trim()) return;

    const updatedGoals = state.goals.map(g => {
      if (g.id === goalId) {
        const newMilestones = [
          ...g.milestones,
          { id: "m_" + Math.random().toString(36).substring(2, 9), text: newMilestoneText.trim(), done: false }
        ];
        const doneCount = newMilestones.filter(m => m.done).length;
        const progress = newMilestones.length > 0 ? Math.round((doneCount / newMilestones.length) * 100) : 0;
        return { ...g, milestones: newMilestones, progress };
      }
      return g;
    });

    onUpdateState({ ...state, goals: updatedGoals });
    setNewMilestoneText("");
    setSelectedGoalIdForMilestone(null);
  };

  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    let triggeredGoalCompletion = false;
    let earnedXP = 0;

    const updatedGoals = state.goals.map(g => {
      if (g.id === goalId) {
        const updatedMilestones = g.milestones.map(m => {
          if (m.id === milestoneId) {
            const isNowDone = !m.done;
            earnedXP += isNowDone ? 10 : -10; // 10 XP for milestone checkoff
            return { ...m, done: isNowDone };
          }
          return m;
        });

        const doneCount = updatedMilestones.filter(m => m.done).length;
        const total = updatedMilestones.length;
        const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;
        
        let status = g.status;
        if (progress === 100 && g.status !== "completed") {
          status = "completed";
          triggeredGoalCompletion = true;
          earnedXP += 100; // 100 XP massive reward for complete goal!
        } else if (progress < 100 && g.status === "completed") {
          status = "active";
          earnedXP -= 100;
        }

        return {
          ...g,
          milestones: updatedMilestones,
          progress,
          status
        };
      }
      return g;
    });

    // Award XP and update achievements
    let updatedAchievements = [...(state.achievements || [])];
    if (triggeredGoalCompletion) {
      // Find a goal related achievement and progress it
      updatedAchievements = updatedAchievements.map(ach => {
        if (ach.id.includes("goal") || ach.id === "task_10") {
          const nextProg = Math.min(ach.progress + 1, ach.maxProgress);
          return {
            ...ach,
            progress: nextProg,
            unlocked: nextProg === ach.maxProgress,
            unlockedAt: nextProg === ach.maxProgress ? new Date().toISOString() : ach.unlockedAt
          };
        }
        return ach;
      });
      alert(isRTL 
        ? "تبریک فراوان! هدف با موفقیت تکمیل شد و ۱۰۰ امتیاز پاداش دریافت کردید! دستاوردها و تراز شما ارتقا یافت." 
        : "Incredible Job! All milestones cleared, Goal fully Completed! +100 XP Awarded!");
    }

    onUpdateState({
      ...state,
      goals: updatedGoals,
      achievements: updatedAchievements,
      profile: {
        ...state.profile,
        xp: state.profile.xp + earnedXP,
        level: Math.floor((state.profile.xp + earnedXP) / 100) + 1, // Auto level-up checking
      }
    });
  };

  const handleSmartAiSuggestions = async (goalId: string) => {
    setAiLoading(goalId);
    try {
      const targetGoal = state.goals.find(g => g.id === goalId);
      if (!targetGoal) return;

      const response = await fetch("/api/gemini/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `Goal Title: ${targetGoal.title}\nGoal Description: ${targetGoal.description}\nDeadline: ${targetGoal.deadline}`,
          action: "summarize"
        })
      });

      if (response.ok) {
        const raw = await response.json();
        const suggestions = raw.result || (isRTL ? "برنامه‌ریزی هوشمند انجام شد." : "AI suggestions aligned.");
        
        const updatedGoals = state.goals.map(g => {
          if (g.id === goalId) {
            return { ...g, aiSuggestions: suggestions };
          }
          return g;
        });

        onUpdateState({ ...state, goals: updatedGoals });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(null);
    }
  };

  const getPriorityColor = (p: Goal["priority"]) => {
    switch (p) {
      case "high": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "medium": return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-right" dir={isRTL ? "rtl" : "ltr"}>
      {/* Upper banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2.5">
            <Target className="w-6 h-6 text-indigo-400" />
            {isRTL ? "سامانه برنامه‌ریزی اهداف میان‌مدت" : "Objective Goal Planner"}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isRTL 
              ? "تعیین اهداف کلان شخصی و درسی به همراه گام‌های اجرایی مستقل، همگام‌سازی لحظه‌ای پیشرفت و پاداش تراز."
              : "Formulate strategic long-term goals with subtask milestones. Auto-complete triggers XP gains."}
          </p>
        </div>

        <button
          onClick={() => setShowAddGoal(!showAddGoal)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-600/15"
        >
          <Plus className="w-4 h-4" />
          {isRTL ? "افزودن هدف جدید" : "Create Goal"}
        </button>
      </div>

      {showAddGoal && (
        <form onSubmit={handleAddGoal} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">{isRTL ? "افزودن فرم هدف علمی یا شخصی" : "Add Goal Specification"}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-right">
              <label className="text-xs text-slate-400">{isRTL ? "عنوان هدف" : "Goal Title"}</label>
              <input
                type="text"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 mt-1 focus:outline-none focus:border-indigo-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="text-right">
              <label className="text-xs text-slate-400">{isRTL ? "تاریخ ضرب‌الاجل" : "Target Deadline"}</label>
              <input
                type="date"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 mt-1 focus:outline-none"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="text-right">
            <label className="text-xs text-slate-400">{isRTL ? "توضیحات و جزئیات" : "Description"}</label>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 mt-1 focus:outline-none h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <div className="text-right">
              <label className="text-xs text-slate-400">{isRTL ? "اولویت هدف" : "Priority"}</label>
              <select
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 mt-1 focus:outline-none block"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="low">{isRTL ? "کم" : "Low"}</option>
                <option value="medium">{isRTL ? "متوسط" : "Medium"}</option>
                <option value="high">{isRTL ? "بالا" : "High"}</option>
              </select>
            </div>

            <div className="text-right">
              <label className="text-xs text-slate-400">{isRTL ? "دسته‌بندی" : "Category"}</label>
              <select
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 mt-1 focus:outline-none block"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Academic">{isRTL ? "آموزشی 📚" : "Academic"}</option>
                <option value="Fitness">{isRTL ? "سلامتی و ورزش 💪" : "Fitness"}</option>
                <option value="Personal">{isRTL ? "توسعه فردی ⚙️" : "Personal"}</option>
                <option value="Financial">{isRTL ? "مالی 💵" : "Financial"}</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            {isRTL ? "ثبت هدف" : "Save Goal"}
          </button>
        </form>
      )}

      {/* Goal Listing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {state.goals.length > 0 ? (
          state.goals.map((goal) => {
            const isCompleted = goal.status === "completed";
            return (
              <div
                key={goal.id}
                className={`bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between ${
                  isCompleted ? "opacity-75 border-emerald-500/30" : ""
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className={`text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </span>

                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-2 text-right">
                    <h3 className={`text-base font-bold text-white ${isCompleted ? "line-through text-slate-400" : ""}`}>
                      {goal.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {goal.description}
                    </p>
                  </div>

                  {/* Progress Slider Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {toPersianDigits(goal.deadline, usePersianNums)}
                      </span>
                      <span className="font-bold text-indigo-400 font-mono">
                        {toPersianDigits(goal.progress, usePersianNums)}%
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted ? "bg-emerald-500" : "bg-indigo-500"
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Milestones / Subtasks section */}
                  <div className="mt-4 space-y-2 border-t border-slate-800/60 pt-3 text-right">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                      {isRTL ? "گام‌ها و اهداف فرعی" : "Goal Milestones"}
                    </h4>

                    <div className="space-y-1.5">
                      {goal.milestones.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => handleToggleMilestone(goal.id, m.id)}
                          className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={m.done}
                            readOnly
                            className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className={m.done ? "line-through text-slate-500 font-mono" : "text-slate-300"}>
                            {m.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    {selectedGoalIdForMilestone === goal.id ? (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          placeholder={isRTL ? "تعهد گام اجرایی جدید..." : "Add milestone..."}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 text-right"
                          value={newMilestoneText}
                          onChange={(e) => setNewMilestoneText(e.target.value)}
                        />
                        <button
                          onClick={() => handleAddMilestone(goal.id)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedGoalIdForMilestone(goal.id)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 mt-2 block"
                      >
                        + {isRTL ? "افزودن گام فرعی به هدف" : "Add sub-milestone"}
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Suggestions block */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-col gap-2">
                  <button
                    onClick={() => handleSmartAiSuggestions(goal.id)}
                    disabled={aiLoading === goal.id}
                    className="bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-indigo-900/30 text-indigo-400 hover:text-indigo-300 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 justify-center"
                  >
                    <Sparkles className="w-3 h-3" />
                    {aiLoading === goal.id ? (isRTL ? "دریافت توصیه‌ها..." : "Loading suggestions...") : (isRTL ? "دریافت مسیر پیشنهادی هوش مصنوعی" : "AI Route Planning Suggestions")}
                  </button>

                  {goal.aiSuggestions && (
                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-850 text-[11px] text-slate-300 leading-relaxed text-right">
                      {goal.aiSuggestions}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-12 bg-slate-900/20 border border-slate-850 rounded-2xl">
            <Target className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400 mt-2 italic">
              {isRTL ? "هیچ هدف ثبت‌شده‌ای یافت نشد. همین حالا اولین هدف خود را تعریف کنید!" : "No active goals mapped yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
