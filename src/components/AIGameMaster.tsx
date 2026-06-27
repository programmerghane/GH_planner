"use client";
import React, { useState, useEffect } from "react";
import { Zap, Target, Star, RefreshCw, CheckCircle, Clock, Award, TrendingUp, Brain, ChevronDown, ChevronUp, Sparkles, Trophy, Calendar, BarChart3 } from "lucide-react";
import { AppState } from "../types";
import { getRankInfo, xpProgressInCurrentLevel, getCurrentSeason } from "../lib/levelSystem";

interface Mission {
  id?: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  priority: string;
  estimatedMinutes: number;
  xpReward: number;
  bonusXP?: number;
  type: string;
  whySelected: string;
  deadline: string;
  completed?: boolean;
}

interface Props {
  state: AppState;
  onUpdateState: (s: AppState) => void;
  onAddXP: (amount: number, type: string, desc: string) => void;
  lang: "fa" | "en";
}

const DIFF_COLORS = { easy: "text-emerald-400 bg-emerald-400/10", medium: "text-amber-400 bg-amber-400/10", hard: "text-rose-400 bg-rose-400/10" };
const DIFF_FA = { easy: "آسان", medium: "متوسط", hard: "سخت" };
const TYPE_ICONS: Record<string, string> = { daily:"📋", focus:"🎯", health:"💚", study:"📚", fitness:"💪", recovery:"🌿", challenge:"⚔️", weekly:"📅", monthly:"🏆" };

export default function AIGameMaster({ state, onUpdateState, onAddXP, lang }: Props) {
  const fa = lang === "fa";
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"missions"|"reflection"|"weekly"|"score">("missions");
  const [reflection, setReflection] = useState<any>(null);
  const [weeklyReview, setWeeklyReview] = useState<any>(null);
  const [idealScore, setIdealScore] = useState<any>(null);
  const [expandedMission, setExpandedMission] = useState<string|null>(null);
  const [loadingRef, setLoadingRef] = useState(false);

  const rankInfo = getRankInfo(state.profile?.level || 1);
  const xpProg = xpProgressInCurrentLevel(state.profile?.totalXP || state.profile?.xp || 0);
  const season = getCurrentSeason(state.profile?.joinedDate || new Date().toISOString());

  useEffect(() => {
    if (missions.length === 0) generateMissions();
  }, []);

  const generateMissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/daily-missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      const data = await res.json();
      const m = (data.missions || []).map((mission: Mission, i: number) => ({
        ...mission, id: "mission_" + i + "_" + Date.now(), completed: false,
      }));
      setMissions(m);
    } catch { setMissions([]); }
    setLoading(false);
  };

  const completeMission = (mission: Mission) => {
    const xp = mission.xpReward + (mission.bonusXP || 0);
    onAddXP(xp, "mission", `${fa?"تکمیل ماموریت":"Completed mission"}: ${mission.title}`);
    setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, completed: true } : m));
  };

  const loadReflection = async () => {
    setLoadingRef(true);
    try {
      const res = await fetch("/api/ai/daily-reflection", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      setReflection(await res.json());
    } catch {}
    setLoadingRef(false);
  };

  const loadWeekly = async () => {
    setLoadingRef(true);
    try {
      const res = await fetch("/api/ai/weekly-review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      setWeeklyReview(await res.json());
    } catch {}
    setLoadingRef(false);
  };

  const loadIdealScore = async () => {
    setLoadingRef(true);
    try {
      const res = await fetch("/api/ai/ideal-self-score", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, period: "today" }),
      });
      setIdealScore(await res.json());
    } catch {}
    setLoadingRef(false);
  };

  const ScoreBar = ({ label, value, color = "#6366f1" }: any) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-slate-400">{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6" dir={fa ? "rtl" : "ltr"}>
      {/* Header with rank */}
      <div className="bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border border-indigo-800/30 rounded-3xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className={`w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-3xl ${rankInfo.border}`}>
              {rankInfo.icon}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-black text-lg">Level {state.profile?.level || 1}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: rankInfo.color + "20", color: rankInfo.color }}>
                {fa ? rankInfo.rankFa : rankInfo.rank}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <span>{xpProg.current.toLocaleString()} / {xpProg.needed.toLocaleString()} XP</span>
              <span>•</span>
              <span>{fa ? `فصل ${season.season}` : `Season ${season.season}`}</span>
              <span>•</span>
              <span style={{ color: "#f59e0b" }}>🔥 {state.profile?.streakCount || 0}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${xpProg.percent}%` }} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: fa?"فصل":"Season", value: `${season.daysLeft}d` },
            { label: fa?"کل XP":"Total XP", value: (state.profile?.totalXP || state.profile?.xp || 0).toLocaleString() },
            { label: fa?"دستاورد":"Achieve", value: (state.achievements || []).filter(a=>a.unlocked).length },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900/50 rounded-xl p-2">
              <p className="text-lg font-black text-white">{s.value}</p>
              <p className="text-[10px] text-slate-500 font-bold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-2xl">
        {[
          { id:"missions", fa:"ماموریت‌ها", en:"Missions", icon:<Target className="w-3.5 h-3.5"/> },
          { id:"reflection", fa:"بازتاب امروز", en:"Reflection", icon:<Brain className="w-3.5 h-3.5"/> },
          { id:"weekly", fa:"هفتگی", en:"Weekly", icon:<Calendar className="w-3.5 h-3.5"/> },
          { id:"score", fa:"امتیاز ایده‌آل", en:"Ideal Score", icon:<BarChart3 className="w-3.5 h-3.5"/> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-[10px] font-bold transition-all ${
              activeTab === tab.id ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}>
            {tab.icon}
            <span className="hidden sm:inline">{fa ? tab.fa : tab.en}</span>
          </button>
        ))}
      </div>

      {/* Missions Tab */}
      {activeTab === "missions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              {fa ? "ماموریت‌های روزانه GH" : "GH Daily Missions"}
            </h3>
            <button onClick={generateMissions} disabled={loading}
              className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-slate-700 transition-all">
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              {fa ? "بازسازی" : "Refresh"}
            </button>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3 animate-bounce">🤖</div>
              <p className="text-sm text-slate-400 font-bold">{fa ? "GH در حال تحلیل..." : "GH analyzing..."}</p>
            </div>
          )}

          {!loading && missions.map(mission => (
            <div key={mission.id}
              className={`border rounded-2xl p-4 transition-all ${
                mission.completed ? "bg-emerald-950/20 border-emerald-800/30 opacity-60"
                  : "bg-slate-900/50 border-slate-800 hover:border-indigo-700/50"
              }`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xl">{TYPE_ICONS[mission.type] || "📋"}</span>
                  <div className="min-w-0">
                    <p className={`font-bold text-sm ${mission.completed ? "line-through text-slate-500" : "text-white"}`}>
                      {mission.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${DIFF_COLORS[mission.difficulty]}`}>
                        {fa ? DIFF_FA[mission.difficulty] : mission.difficulty}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />{mission.estimatedMinutes}{fa?"دق":"m"}
                      </span>
                      <span className="text-[10px] text-indigo-400 font-bold">+{mission.xpReward}XP</span>
                      {mission.bonusXP && <span className="text-[10px] text-amber-400 font-bold">+{mission.bonusXP}🎁</span>}
                    </div>
                  </div>
                </div>
                {!mission.completed && (
                  <button onClick={() => completeMission(mission)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 mr-2">
                    {fa ? "انجام شد" : "Done"}
                  </button>
                )}
                {mission.completed && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
              </div>

              <p className="text-xs text-slate-400 mb-2">{mission.description}</p>

              <button onClick={() => setExpandedMission(expandedMission === mission.id ? null : mission.id || null)}
                className="text-[10px] text-indigo-400 flex items-center gap-1 hover:text-indigo-300">
                {fa ? "چرا این ماموریت؟" : "Why this mission?"}
                {expandedMission === mission.id ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
              </button>
              {expandedMission === mission.id && (
                <p className="text-[11px] text-slate-500 mt-2 bg-slate-800/50 p-2 rounded-lg">{mission.whySelected}</p>
              )}
            </div>
          ))}

          {!loading && missions.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">{fa ? "ماموریتی وجود ندارد" : "No missions yet"}</p>
              <button onClick={generateMissions}
                className="mt-3 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl font-bold">
                {fa ? "تولید ماموریت" : "Generate Missions"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reflection Tab */}
      {activeTab === "reflection" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white">{fa ? "بازتاب امروز" : "Today's Reflection"}</h3>
            <button onClick={loadReflection} disabled={loadingRef}
              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
              <Brain className={`w-3 h-3 ${loadingRef ? "animate-pulse" : ""}`} />
              {fa ? "تحلیل کن" : "Analyze"}
            </button>
          </div>

          {reflection ? (
            <div className="space-y-4">
              {/* Overall Score */}
              <div className="bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border border-indigo-800/30 rounded-2xl p-5 text-center">
                <div className="text-6xl font-black text-white mb-1">{reflection.overallScore}</div>
                <p className="text-xs text-indigo-300 font-bold">{fa ? "امتیاز کلی روز" : "Overall Day Score"}</p>
              </div>

              {/* Scores */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                <ScoreBar label={fa?"بهره‌وری":"Productivity"} value={reflection.productivityScore} color="#6366f1" />
                <ScoreBar label={fa?"سلامتی":"Health"} value={reflection.healthScore} color="#10b981" />
                <ScoreBar label={fa?"مطالعه":"Study"} value={reflection.studyScore} color="#3b82f6" />
                <ScoreBar label={fa?"ورزش":"Fitness"} value={reflection.fitnessScore} color="#f59e0b" />
                <ScoreBar label={fa?"عادات":"Habits"} value={reflection.habitScore} color="#8b5cf6" />
                <ScoreBar label={fa?"خواب":"Sleep"} value={reflection.sleepScore} color="#06b6d4" />
              </div>

              {/* Coach message */}
              <div className="bg-indigo-950/30 border border-indigo-800/30 rounded-2xl p-4">
                <p className="text-xs font-bold text-indigo-300 mb-2">🤖 GH {fa?"می‌گوید":"says"}:</p>
                <p className="text-sm text-white leading-relaxed">{reflection.coachMessage}</p>
              </div>

              {/* Key insights */}
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: fa?"بزرگترین دستاورد":"Biggest Achievement", value: reflection.biggestAchievement, color:"#10b981", icon:"🏆" },
                  { label: fa?"از دست رفته":"Missed Opportunity", value: reflection.biggestMissedOpportunity, color:"#f59e0b", icon:"⚠️" },
                  { label: fa?"فردا چه کار کنم":"Tomorrow's Focus", value: reflection.biggestImprovementTomorrow, color:"#6366f1", icon:"🎯" },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-500 mb-1">{item.icon} {item.label}</p>
                    <p className="text-sm text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Tomorrow plan */}
              {reflection.tomorrowPlan && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-400 mb-3">📅 {fa?"برنامه فردا":"Tomorrow's Plan"}</p>
                  <div className="space-y-2">
                    {reflection.tomorrowPlan.top3Priorities?.map((p: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-[10px] font-black">{i+1}</span>
                        <span className="text-sm text-white">{p}</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">{fa?"بیدار شدن":"Wake up"}</p>
                        <p className="font-black text-white">{reflection.tomorrowPlan.suggestedWakeUp}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">{fa?"خواب":"Bedtime"}</p>
                        <p className="font-black text-white">{reflection.tomorrowPlan.suggestedBedtime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">{fa ? "بازتاب امروز آماده نیست" : "Reflection not ready"}</p>
              <p className="text-xs text-slate-500 mt-1">{fa ? "برای دریافت تحلیل GH کلیک کن" : "Click to get GH analysis"}</p>
            </div>
          )}
        </div>
      )}

      {/* Weekly Tab */}
      {activeTab === "weekly" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white">{fa ? "مرور هفتگی" : "Weekly Review"}</h3>
            <button onClick={loadWeekly} disabled={loadingRef}
              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
              <TrendingUp className={`w-3 h-3 ${loadingRef ? "animate-pulse" : ""}`} />
              {fa ? "مرور کن" : "Review"}
            </button>
          </div>

          {weeklyReview ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: fa?"XP هفته":"Week XP", value: weeklyReview.weeklyXP, color:"#6366f1" },
                  { label: fa?"بهره‌وری":"Productivity", value: weeklyReview.weeklyProductivity+"%", color:"#10b981" },
                  { label: fa?"عادات":"Habits", value: weeklyReview.weeklyHabitConsistency+"%", color:"#f59e0b" },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
                    <p className="font-black text-lg" style={{color:s.color}}>{s.value}</p>
                    <p className="text-[10px] text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-indigo-950/30 border border-indigo-800/30 rounded-2xl p-4 space-y-3">
                <div>
                  <p className="text-[10px] text-emerald-400 font-bold mb-1">✅ {fa?"بهترین روز":"Best Day"}</p>
                  <p className="text-sm text-white">{weeklyReview.bestDay}</p>
                </div>
                <div>
                  <p className="text-[10px] text-rose-400 font-bold mb-1">⚠️ {fa?"ضعیف‌ترین روز":"Worst Day"}</p>
                  <p className="text-sm text-white">{weeklyReview.worstDay}</p>
                </div>
                <div>
                  <p className="text-[10px] text-indigo-400 font-bold mb-1">💡 {fa?"توصیه هفته بعد":"Next Week Advice"}</p>
                  <p className="text-sm text-white">{weeklyReview.nextWeekAdvice}</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl">
                  <p className="text-xs text-white italic">"{weeklyReview.motivationalMessage}"</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">{fa ? "مرور هفتگی آماده نیست" : "Weekly review not ready"}</p>
            </div>
          )}
        </div>
      )}

      {/* Ideal Score Tab */}
      {activeTab === "score" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white">{fa ? "امتیاز خود ایده‌آل" : "Ideal Self Score"}</h3>
            <button onClick={loadIdealScore} disabled={loadingRef}
              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
              <Star className={`w-3 h-3 ${loadingRef ? "animate-pulse" : ""}`} />
              {fa ? "محاسبه" : "Calculate"}
            </button>
          </div>

          {idealScore ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: fa?"XP کسب شده":"XP Earned", value: idealScore.xpEarned, color:"#6366f1" },
                  { label: fa?"XP از دست رفته":"XP Missed", value: idealScore.missedXP, color:"#f43f5e" },
                  { label: fa?"تکمیل تسک":"Completion", value: idealScore.completionPercent+"%", color:"#10b981" },
                  { label: fa?"امتیاز بهره‌وری":"Productivity", value: idealScore.productivityScore+"%", color:"#f59e0b" },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
                    <p className="font-black text-xl" style={{color:s.color}}>{s.value}</p>
                    <p className="text-[10px] text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <ScoreBar label={fa?"سلامتی":"Health"} value={idealScore.healthScore} color="#10b981" />
                <ScoreBar label={fa?"خواب":"Sleep"} value={idealScore.sleepScore} color="#06b6d4" />
                <ScoreBar label={fa?"ورزش":"Fitness"} value={idealScore.fitnessScore} color="#f59e0b" />
                <ScoreBar label={fa?"مطالعه":"Study"} value={idealScore.studyProgress} color="#3b82f6" />
              </div>

              <div className="space-y-3">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-rose-400 font-bold mb-1">🔍 {fa?"چه چیزی مانع شد؟":"What prevented?"}</p>
                  <p className="text-sm text-white">{idealScore.whatPrevented}</p>
                </div>
                <div className="bg-indigo-950/30 border border-indigo-800/30 rounded-xl p-3">
                  <p className="text-[10px] text-indigo-400 font-bold mb-1">⚡ {fa?"کوچکترین تغییر بزرگ":"Smallest Big Change"}</p>
                  <p className="text-sm text-white">{idealScore.smallestImpactChange}</p>
                </div>
                <div className="bg-emerald-950/20 border border-emerald-800/20 rounded-xl p-3">
                  <p className="text-sm text-emerald-300 italic">"{idealScore.encouragement}"</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">{fa ? "امتیاز محاسبه نشده" : "Score not calculated"}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
