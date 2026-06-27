import React, { useState } from "react";
import { Sparkles, MessageSquare, Send, Compass, BarChart, AlertTriangle } from "lucide-react";
import { AppState } from "../types";

interface AIPredictionProps {
  state: AppState;
  onAddXP: (xp: number, type: string, desc: string) => void;
  lang?: "fa" | "en";
  usePersianNums?: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
}

export default function AIPrediction({
  state,
  onAddXP,
  lang = "fa",
  usePersianNums = true,
}: AIPredictionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "m1",
      role: "ai",
      text: lang === "fa"
        ? "درود، فرمانده. من دوقلوی دیجیتال و استراتژیست عملکرد شما هستم. اجازه دهید بارهای کاری روزانه شما را تحلیل کنم یا به هرگونه سوالی درباره بهره‌وری و عادات پاسخ دهم."
        : "Greetings, Commander. I am your Digital Twin and performance strategist. Let me analyze your daily workloads or answer any productivity and habit questions you have.",
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [simulationHorizon, setSimulationHorizon] = useState<"1_week" | "1_month" | "6_months">("1_week");

  // Custom Balance Metrics based on actual logs
  const categories = [
    { name: lang === "fa" ? "مطالعه و تمرکز" : "Study/Focus", score: state.tasks.length > 0 ? Math.round((state.tasks.filter(t => t.status === "done").length / state.tasks.length) * 100) : 40, color: "bg-indigo-500" },
    { name: lang === "fa" ? "آمادگی جسمانی" : "Physical Fitness", score: state.trackerEntries.some(e => e.trackerTypeId === "workout") ? 85 : 50, color: "bg-amber-500" },
    { name: lang === "fa" ? "کیفیت خواب" : "Sleep Quality", score: state.trackerEntries.some(e => e.trackerTypeId === "sleep") ? 75 : 60, color: "bg-teal-500" },
    { name: lang === "fa" ? "سلامت روان" : "Mental Health", score: state.journalEntries.length > 0 ? Math.round((state.journalEntries.reduce((acc, curr) => acc + curr.mood, 0) / state.journalEntries.length) * 10) : 65, color: "bg-pink-500" },
    { name: lang === "fa" ? "حلقه عادات" : "Habit Loops", score: state.habits.length > 0 ? Math.min(100, Math.round(state.habits.reduce((acc, curr) => acc + curr.currentStreak, 0) * 15)) : 30, color: "bg-purple-500" },
  ];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: "user_" + Math.random().toString(36).substring(2, 9),
      role: "user",
      text: inputMsg.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMsg("");
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          chatHistory: messages,
          state,
        }),
      });

      if (!response.ok) throw new Error("AI chatbot server disconnected");
      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: "ai_" + Math.random().toString(36).substring(2, 9),
        role: "ai",
        text: data.reply,
      };

      setMessages((prev) => [...prev, aiMsg]);
      onAddXP(10, "ai", "Consulted Digital Twin Coach");
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: "ai_err",
        role: "ai",
        text: lang === "fa"
          ? "من در برقراری ارتباط با سرورهای هوش مصنوعی جمینی با خطا مواجه شدم. لطفا مطمئن شوید که کلید API جمینی شما در بخش تنظیمات > رمزها پیکربندی شده است."
          : "خطایی در ارتباط با GH AI رخ داد. لطفاً دوباره تلاش کنید.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Predefined simulated future predictions depending on selected horizon
  const getSimulatedOutcomes = () => {
    switch (simulationHorizon) {
      case "1_week":
        return {
          productivity: lang === "fa" ? "۸۵٪ (منحنی صعودی امیدوارکننده)" : "85% (Optimistic upward curve)",
          burnoutRisk: lang === "fa" ? "پایین (استراحت‌های منظم ثبت‌شده)" : "Low (Steady rests logged)",
          forecast: lang === "fa" 
            ? "اگر تمرینات منظم ورزشی خود را حفظ کنید، امتیاز تمرکز کلی شما دوشنبه آینده ۱۲٪ افزایش خواهد یافت."
            : "If you maintain your daily workout loops, your overall focus score will rise by 12% next Monday.",
        };
      case "1_month":
        return {
          productivity: lang === "fa" ? "۹۲٪ (آستانه عملکرد عالی)" : "92% (High-performance threshold)",
          burnoutRisk: lang === "fa" ? "متوسط (بافرهای خواب را افزایش دهید)" : "Moderate (Increase sleep buffers)",
          forecast: lang === "fa"
            ? "یک زنجیره تداوم ۴ هفته‌ای روی عادات، سطح زیستی شما را به سطح ۸ ارتقا داده و پوسته‌های افسانه‌ای را باز می‌کند."
            : "A 4-week continuous streak on habits will increase your Life OS level to Level 8, unlocking legendary themes.",
        };
      default:
        return {
          productivity: lang === "fa" ? "۹۶٪ (استاندارد استاد نخبه)" : "96% (Elite Master standard)",
          burnoutRisk: lang === "fa" ? "بالا (نیازمند انجمادهای زمان‌بندی)" : "High (Requires schedule freezes)",
          forecast: lang === "fa"
            ? "در ۶ ماه آینده، انباشت فعلی بازه‌های مطالعاتی موفقیت کامل در امتحانات نهایی دانشگاه را با قطعیت ۹۵٪ پیش‌بینی می‌کند."
            : "In 6 months, current cumulative study blocks forecast complete success in upcoming university exams with 95% certainty.",
        };
    }
  };

  const simulation = getSimulatedOutcomes();

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-right" dir={lang === "fa" ? "rtl" : "ltr"}>
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2.5 justify-start">
            <Sparkles className="w-6 h-6 text-purple-400 animate-spin-slow" />
            {lang === "fa" ? "دوقلوی دیجیتال و جی‌پی‌اس زیستی" : "Digital Twin & Life GPS"}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {lang === "fa"
              ? "مسیر آینده خود را شبیه‌سازی کنید، تعادل همه‌جانبه زندگی خود را بسنجید و از مربی هوش مصنوعی مشاوره بگیرید."
              : "Simulate your future trajectory, evaluate holistic life balance, and receive deep counsel from your AI Coach."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Columns: Digital Twin Chat console */}
        <div className="lg:col-span-2 bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col h-[520px] overflow-hidden">
          {/* Chat header banner */}
          <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center gap-3 justify-start">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <h3 className="text-xs font-semibold text-slate-200">
                {lang === "fa" ? "کنسول استراتژی دوقلوی دیجیتال" : "Digital Twin Strategy Console"}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                {lang === "fa" ? "مدل: GH AI • فید زمینه کامل فعال" : "Model: GH AI • Full Context Feed Active"}
              </p>
            </div>
          </div>

          {/* Chat message logs scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed text-right ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-3 text-xs text-indigo-400 animate-pulse flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                  {lang === "fa" ? "دوقلو در حال پردازش..." : "Twin processing states..."}
                </div>
              </div>
            )}
          </div>

          {/* Chat input box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800/80 flex gap-2">
            <input
              type="text"
              required
              placeholder={
                lang === "fa"
                  ? "از مربی درباره نکات مطالعه، ریکاوری ورزشی یا بهینه‌سازی برنامه بپرسید..."
                  : "Ask coach for study tips, workout recovery, or schedule optimization..."
              }
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60 text-right"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-all duration-150 shrink-0 cursor-pointer"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>

        {/* Right Column: Simulated forecast & Life Balance wheel */}
        <div className="space-y-6">
          {/* Simulated Forecast Module */}
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center gap-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Compass className="w-4 h-4 text-purple-400" />
                {lang === "fa" ? "شبیه‌ساز آینده" : "Future Simulator"}
              </h4>

              <select
                className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-[10px] text-slate-300 font-mono text-right"
                value={simulationHorizon}
                onChange={(e) => setSimulationHorizon(e.target.value as any)}
              >
                <option value="1_week">{lang === "fa" ? "۱ هفته" : "1 Week"}</option>
                <option value="1_month">{lang === "fa" ? "۱ ماه" : "1 Month"}</option>
                <option value="6_months">{lang === "fa" ? "۶ ماه" : "6 Months"}</option>
              </select>
            </div>

            <div className="space-y-3 text-right">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/60">
                  <span className="text-slate-500 text-[10px]">{lang === "fa" ? "بهره‌وری" : "Productivity"}</span>
                  <p className="font-semibold text-slate-200 mt-0.5">
                    {simulation.productivity}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/60">
                  <span className="text-slate-500 text-[10px]">{lang === "fa" ? "ریسک خستگی" : "Burnout Risk"}</span>
                  <p className="font-semibold text-slate-200 mt-0.5">
                    {simulation.burnoutRisk}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-xs text-indigo-300 leading-relaxed text-right">
                <p className="font-semibold text-slate-100 mb-1">{lang === "fa" ? "پیش‌بینی و تحلیل" : "Forecast Analysis"}</p>
                "{simulation.forecast}"
              </div>
            </div>
          </div>

          {/* Life Balance Wheel dashboard */}
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <BarChart className="w-4 h-4 text-indigo-400" />
              {lang === "fa" ? "چرخ تعادل زندگی" : "Life Balance Wheel"}
            </h4>

            <div className="space-y-3">
              {categories.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{cat.name}</span>
                    <span className="font-mono text-slate-400">{cat.score}%</span>
                  </div>
                  {/* Visual segment progress bar */}
                  <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                      style={{ width: `${cat.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400 text-right">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p>
                {lang === "fa"
                  ? "سطح تمرکز شما فوق‌العاده است، اما فاکتور خواب شما کمی پایین است. امشب ثبت ردیاب خواب را اولویت قرار دهید تا تعادل برقرار شود."
                  : "Your focus levels are outstanding, but Sleep metrics are slightly depressed. Prioritize sleep log tracking tonight to balance ratios."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
