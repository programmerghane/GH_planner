import React, { useState } from "react";
import { Smile, BookOpen, Plus, Trash2, Calendar, Sparkles } from "lucide-react";
import { JournalEntry, AppState } from "../types";
import { toPersianDigits } from "../lib/i18n";

interface JournalSystemProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  onAddXP: (xp: number, type: string, desc: string) => void;
  lang?: "fa" | "en";
  usePersianNums?: boolean;
}

export default function JournalSystem({
  state,
  onUpdateState,
  onAddXP,
  lang = "fa",
  usePersianNums = true,
}: JournalSystemProps) {
  const [mood, setMood] = useState(7);
  const [content, setContent] = useState("");
  const [achievement, setAchievement] = useState("");
  const [learning, setLearning] = useState("");
  const [improvement, setImprovement] = useState("");

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const newJournal: JournalEntry = {
      id: "journal_" + Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString().split("T")[0],
      mood,
      content: content.trim(),
      answers: {
        achievement: achievement.trim(),
        learning: learning.trim(),
        improvement: improvement.trim(),
      },
      createdAt: new Date().toISOString(),
    };

    onUpdateState({
      ...state,
      journalEntries: [newJournal, ...state.journalEntries],
    });

    setContent("");
    setAchievement("");
    setLearning("");
    setImprovement("");
    setMood(7);

    onAddXP(30, "journal", "Completed Daily Wellness Journaling");
    alert(
      lang === "fa"
        ? "دفترچه خاطرات روزانه ثبت شد! ۳۰ امتیاز زیستی کسب کردید."
        : "Daily Journal entry logged! +30 XP gained."
    );
  };

  const handleDeleteJournal = (journalId: string) => {
    const updated = state.journalEntries.filter((j) => j.id !== journalId);
    onUpdateState({
      ...state,
      journalEntries: updated,
    });
  };

  const getMoodEmoji = (score: number) => {
    if (score >= 9) return "🤩";
    if (score >= 7) return "😊";
    if (score >= 5) return "😐";
    if (score >= 3) return "😔";
    return "😫";
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir={lang === "fa" ? "rtl" : "ltr"}>
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 text-right">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2.5 justify-start">
            <Smile className="w-6 h-6 text-indigo-400" />
            {lang === "fa" ? "دفترچه درون‌نگری و ذهن‌آگاهی" : "Mind & Emotion Journals"}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {lang === "fa"
              ? "ثبت شاخص خلق‌وخو، ثبت دستاوردها، تشخیص موانع یادداشت‌برداری و پیگیری تحلیل‌های عاطفی بلندمدت."
              : "Log mood indices, record milestones, identify study friction blocks, and track long-term emotional analytics."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Journal Form */}
        <div className="md:col-span-1.5 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4 text-right">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 justify-start">
            <Plus className="w-4 h-4 text-indigo-400" />
            {lang === "fa" ? "ثبت ترازهای امروز" : "Log Today's Alignments"}
          </h3>

          <form onSubmit={handleSaveJournal} className="space-y-4">
            {/* Mood Scale Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>{lang === "fa" ? "میزان انرژی و خلق‌وخوی خود را بسنجید" : "Rate your energy & mood"}</span>
                <span className="text-indigo-400 font-mono font-bold flex items-center gap-1">
                  {getMoodEmoji(mood)} {toPersianDigits(mood, usePersianNums)}/۱۰
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
                value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
              />
            </div>

            {/* Prompt Inputs */}
            <div>
              <label className="text-[11px] text-slate-400 font-semibold">
                {lang === "fa" ? "امروز به چه دستاوردی رسیدید؟" : "What did you achieve today?"}
              </label>
              <input
                type="text"
                placeholder={lang === "fa" ? "مانند: مطالعه شیمی آلی به مدت ۲ ساعت" : "E.g., Studied organic chemistry for 2 hours"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 mt-1 focus:outline-none focus:border-indigo-500/40 text-right"
                value={achievement}
                onChange={(e) => setAchievement(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold">
                {lang === "fa" ? "چه مفهوم کلیدی‌ای یاد گرفتید؟" : "What key concept did you learn?"}
              </label>
              <input
                type="text"
                placeholder={lang === "fa" ? "مانند: ساختارهای هیبریدی کربن و زوایای پیوند" : "E.g., Carbon hybrid structures and bonding angles"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 mt-1 focus:outline-none focus:border-indigo-500/40 text-right"
                value={learning}
                onChange={(e) => setLearning(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold">
                {lang === "fa" ? "فردا چه چیزی باید بهبود یابد؟" : "What should improve tomorrow?"}
              </label>
              <input
                type="text"
                placeholder={lang === "fa" ? "مانند: خواب زودتر، دوری از صفحه نمایش قبل از خواب" : "E.g., Sleep earlier, avoid screen before sleep"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 mt-1 focus:outline-none focus:border-indigo-500/40 text-right"
                value={improvement}
                onChange={(e) => setImprovement(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold">
                {lang === "fa" ? "افکار و جزئیات روزانه" : "Detailed Thoughts"}
              </label>
              <textarea
                required
                placeholder={lang === "fa" ? "هر آنچه در ذهن دارید بنویسید. افکار خود را آزاد کنید..." : "Write whatever is on your mind. Free your thoughts..."}
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 mt-1 focus:outline-none focus:border-indigo-500/40 resize-none text-right"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
            >
              {lang === "fa" ? "تکمیل ثبت درون‌نگری روزانه (+۳۰ امتیاز)" : "Complete Journaling Entry (+30 XP)"}
            </button>
          </form>
        </div>

        {/* Right Column: Historical logs list */}
        <div className="md:col-span-1.5 space-y-4 text-right">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 justify-start">
            <BookOpen className="w-4.5 h-4.5 text-slate-400" /> {lang === "fa" ? "دفتر ثبت گذشته" : "Past Reflection Logs"}
          </h3>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1" dir={lang === "fa" ? "rtl" : "ltr"}>
            {state.journalEntries.length === 0 ? (
              <p className="text-xs text-slate-500 text-center italic py-12">
                {lang === "fa" ? "هیچ ثبت خاطرات یا درون‌نگری وجود ندارد. افکار خود را در بالا آزاد کنید." : "No past diary or journal entries. Free your mind above."}
              </p>
            ) : (
              state.journalEntries.map((j) => (
                <div
                  key={j.id}
                  className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 p-4 rounded-xl transition-all space-y-3 text-right"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getMoodEmoji(j.mood)}</span>
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block text-right">
                          {lang === "fa" ? "کیفیت روز" : "Day Quality"}: {toPersianDigits(j.mood, usePersianNums)}/۱۰
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 justify-start">
                          <Calendar className="w-3 h-3" /> {toPersianDigits(j.date, usePersianNums)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteJournal(j.id)}
                      className="p-1 rounded-md text-slate-600 hover:text-rose-400 hover:bg-slate-800/40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed italic text-right">
                    "{j.content}"
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-[10px]">
                    {j.answers.achievement && (
                      <div className="p-1.5 bg-slate-950/40 rounded-lg text-right">
                        <span className="text-indigo-400 font-medium block">
                          {lang === "fa" ? "دستاورد" : "Achieved"}
                        </span>
                        <p className="text-slate-400 truncate">
                          {j.answers.achievement}
                        </p>
                      </div>
                    )}
                    {j.answers.learning && (
                      <div className="p-1.5 bg-slate-950/40 rounded-lg text-right">
                        <span className="text-emerald-400 font-medium block">
                          {lang === "fa" ? "آموخته" : "Learned"}
                        </span>
                        <p className="text-slate-400 truncate">
                          {j.answers.learning}
                        </p>
                      </div>
                    )}
                    {j.answers.improvement && (
                      <div className="p-1.5 bg-slate-950/40 rounded-lg text-right">
                        <span className="text-purple-400 font-medium block">
                          {lang === "fa" ? "بهبود" : "Improve"}
                        </span>
                        <p className="text-slate-400 truncate">
                          {j.answers.improvement}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
