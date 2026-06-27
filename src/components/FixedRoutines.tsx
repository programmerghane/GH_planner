"use client";
import React, { useState } from "react";
import { Plus, Clock, CheckCircle, Circle, Trash2, Bell, BellOff, Star } from "lucide-react";
import { AppState, FixedRoutine } from "../types";
import { XP_REWARDS } from "../lib/levelSystem";
import { t } from "../lib/i18n";

interface Props {
  state: AppState;
  onUpdateState: (s: AppState) => void;
  onAddXP: (amount: number, type: string, desc: string) => void;
  lang: "fa" | "en";
  usePersianNums: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  prayer: "🕌", worship: "🤲", exercise: "💪", meal: "🍽️", sleep: "🌙", custom: "⭐"
};

const CATEGORY_LABELS: Record<string, {fa:string,en:string}> = {
  prayer: {fa:"نماز",en:"Prayer"},
  worship: {fa:"عبادت",en:"Worship"},
  exercise: {fa:"ورزش",en:"Exercise"},
  meal: {fa:"وعده غذایی",en:"Meal"},
  sleep: {fa:"خواب",en:"Sleep"},
  custom: {fa:"سفارشی",en:"Custom"},
};

const ALL_DAYS = [
  {id:"sat",fa:"ش",en:"Sa"},{id:"sun",fa:"ی",en:"Su"},{id:"mon",fa:"د",en:"Mo"},
  {id:"tue",fa:"س",en:"Tu"},{id:"wed",fa:"چ",en:"We"},{id:"thu",fa:"پ",en:"Th"},{id:"fri",fa:"ج",en:"Fr"},
];

const DEFAULT_PRAYERS: Partial<FixedRoutine>[] = [
  { title:"نماز صبح", emoji:"🌅", color:"#6366f1", times:["05:30"], category:"prayer", reminder:true, reminderMinutes:10 },
  { title:"نماز ظهر", emoji:"☀️", color:"#f59e0b", times:["12:30"], category:"prayer", reminder:true, reminderMinutes:5 },
  { title:"نماز عصر", emoji:"🌤️", color:"#f97316", times:["16:00"], category:"prayer", reminder:true, reminderMinutes:5 },
  { title:"نماز مغرب", emoji:"🌆", color:"#8b5cf6", times:["19:30"], category:"prayer", reminder:true, reminderMinutes:5 },
  { title:"نماز عشاء", emoji:"🌙", color:"#1e40af", times:["21:00"], category:"prayer", reminder:true, reminderMinutes:5 },
];

export default function FixedRoutines({ state, onUpdateState, onAddXP, lang, usePersianNums }: Props) {
  const isRTL = lang === "fa";
  const routines = state.fixedRoutines || [];
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("⭐");
  const [color, setColor] = useState("#6366f1");
  const [times, setTimes] = useState(["08:00"]);
  const [category, setCategory] = useState<FixedRoutine["category"]>("custom");
  const [days, setDays] = useState<string[]>(["sat","sun","mon","tue","wed","thu","fri"]);
  const [reminder, setReminder] = useState(true);
  const [reminderMin, setReminderMin] = useState(10);

  const todayKey = new Date().toISOString().split("T")[0];
  const todayDayId = ["sun","mon","tue","wed","thu","fri","sat"][new Date().getDay()];

  const addRoutine = (preset?: Partial<FixedRoutine>) => {
    const newR: FixedRoutine = {
      id: "routine_" + Math.random().toString(36).slice(2,9),
      title: preset?.title || title.trim() || "برنامه جدید",
      emoji: preset?.emoji || emoji,
      color: preset?.color || color,
      times: preset?.times || times,
      days: preset?.days || days as any,
      category: preset?.category || category,
      reminder: preset?.reminder ?? reminder,
      reminderMinutes: preset?.reminderMinutes || reminderMin,
      history: {},
      createdAt: new Date().toISOString(),
    };
    onUpdateState({ ...state, fixedRoutines: [...routines, newR] });
    setShowAdd(false);
    setTitle(""); setTimes(["08:00"]);
  };

  const toggleDone = (routineId: string, time: string) => {
    const key = `${todayKey}_${time}`;
    const updated = routines.map(r => {
      if (r.id !== routineId) return r;
      const newHistory = { ...r.history, [key]: !r.history[key] };
      return { ...r, history: newHistory };
    });
    onUpdateState({ ...state, fixedRoutines: updated });
    const routine = routines.find(r => r.id === routineId);
    const wasChecked = routine?.history[key];
    if (!wasChecked) onAddXP(XP_REWARDS.routineCheck, "routine", `انجام ${routine?.title}`);
  };

  const deleteRoutine = (id: string) => {
    onUpdateState({ ...state, fixedRoutines: routines.filter(r => r.id !== id) });
  };

  const addTime = () => setTimes([...times, "12:00"]);
  const updateTime = (idx: number, val: string) => {
    const t = [...times]; t[idx] = val; setTimes(t);
  };

  // فیلتر برنامه‌های امروز
  const todayRoutines = routines.filter(r => r.days.includes(todayDayId as any));

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">
            {lang === "fa" ? "برنامه‌های ثابت" : "Fixed Routines"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {lang === "fa" ? "نماز، ورزش و برنامه‌های روزانه ثابت" : "Prayers, workouts and fixed daily schedules"}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          {lang === "fa" ? "افزودن" : "Add"}
        </button>
      </div>

      {/* Quick add prayers */}
      {routines.filter(r => r.category === "prayer").length === 0 && (
        <div className="bg-indigo-950/30 border border-indigo-800/40 p-4 rounded-2xl">
          <p className="text-sm text-indigo-300 font-bold mb-3">
            {lang === "fa" ? "🕌 افزودن سریع اوقات نماز" : "🕌 Quick add prayer times"}
          </p>
          <button
            onClick={() => DEFAULT_PRAYERS.forEach(p => addRoutine(p))}
            className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs px-4 py-2 rounded-xl font-bold transition-all border border-indigo-700/40"
          >
            {lang === "fa" ? "افزودن همه اوقات نماز" : "Add all prayer times"}
          </button>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-slate-900/80 border border-slate-700 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white">{lang === "fa" ? "برنامه جدید" : "New Routine"}</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">{lang === "fa" ? "عنوان" : "Title"}</label>
              <div className="flex gap-2">
                <input value={emoji} onChange={e=>setEmoji(e.target.value)}
                  className="w-12 bg-slate-800 border border-slate-700 rounded-lg px-2 text-center text-lg" />
                <input value={title} onChange={e=>setTitle(e.target.value)}
                  placeholder={lang==="fa"?"نام برنامه...":"Routine name..."}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">{lang==="fa"?"دسته‌بندی":"Category"}</label>
              <select value={category} onChange={e=>setCategory(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                {Object.entries(CATEGORY_LABELS).map(([k,v])=>(
                  <option key={k} value={k}>{CATEGORY_ICONS[k]} {lang==="fa"?v.fa:v.en}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">{lang==="fa"?"رنگ":"Color"}</label>
              <input type="color" value={color} onChange={e=>setColor(e.target.value)}
                className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer" />
            </div>
          </div>

          {/* Times */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">{lang==="fa"?"زمان‌ها":"Times"}</label>
            <div className="flex flex-wrap gap-2">
              {times.map((time, idx) => (
                <input key={idx} type="time" value={time} onChange={e=>updateTime(idx,e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
              ))}
              <button onClick={addTime}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white">
                + {lang==="fa"?"زمان":"time"}
              </button>
            </div>
          </div>

          {/* Days */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">{lang==="fa"?"روزها":"Days"}</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_DAYS.map(d => (
                <button key={d.id}
                  onClick={() => setDays(prev => prev.includes(d.id) ? prev.filter(x=>x!==d.id) : [...prev,d.id])}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${days.includes(d.id)?"bg-indigo-600 text-white":"bg-slate-800 text-slate-400"}`}>
                  {lang==="fa"?d.fa:d.en}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400">{lang==="fa"?"یادآوری":"Reminder"}</label>
            <div className="flex items-center gap-2">
              {reminder && (
                <input type="number" value={reminderMin} onChange={e=>setReminderMin(+e.target.value)}
                  className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center"
                  min={1} max={60} />
              )}
              <button onClick={()=>setReminder(!reminder)}
                className={`p-2 rounded-lg transition-all ${reminder?"bg-indigo-600/20 text-indigo-400":"bg-slate-800 text-slate-500"}`}>
                {reminder ? <Bell className="w-4 h-4"/> : <BellOff className="w-4 h-4"/>}
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={()=>setShowAdd(false)}
              className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-sm font-bold">
              {lang==="fa"?"لغو":"Cancel"}
            </button>
            <button onClick={()=>addRoutine()}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold">
              {lang==="fa"?"ذخیره":"Save"}
            </button>
          </div>
        </div>
      )}

      {/* Today's routines */}
      {todayRoutines.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            {lang==="fa"?"امروز":"Today"}
          </h3>
          <div className="space-y-2">
            {todayRoutines.map(r => (
              <div key={r.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{r.emoji}</span>
                    <div>
                      <p className="font-bold text-white text-sm">{r.title}</p>
                      <p className="text-xs text-slate-500">{CATEGORY_LABELS[r.category]?.[lang]}</p>
                    </div>
                  </div>
                  <button onClick={()=>deleteRoutine(r.id)} className="text-slate-600 hover:text-rose-400 p-1">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.times.map(time => {
                    const key = `${todayKey}_${time}`;
                    const done = r.history[key];
                    return (
                      <button key={time} onClick={()=>toggleDone(r.id,time)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          done ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
                               : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-indigo-500"
                        }`}>
                        {done ? <CheckCircle className="w-3.5 h-3.5"/> : <Circle className="w-3.5 h-3.5"/>}
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All routines */}
      {routines.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            {lang==="fa"?"همه برنامه‌ها":"All Routines"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {routines.map(r => {
              const todayDone = r.times.filter(time => r.history[`${todayKey}_${time}`]).length;
              const totalToday = r.days.includes(todayDayId as any) ? r.times.length : 0;
              return (
                <div key={r.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{background: r.color + "20", border: `1px solid ${r.color}40`}}>
                    {r.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{r.title}</p>
                    <p className="text-xs text-slate-500">{r.times.join(" • ")}</p>
                    {totalToday > 0 && (
                      <p className="text-xs mt-0.5" style={{color: r.color}}>
                        {todayDone}/{totalToday} {lang==="fa"?"امروز":"today"}
                      </p>
                    )}
                  </div>
                  <button onClick={()=>deleteRoutine(r.id)} className="text-slate-600 hover:text-rose-400">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {routines.length === 0 && !showAdd && (
        <div className="text-center py-12 text-slate-500">
          <div className="text-5xl mb-3">🕌</div>
          <p className="font-bold">{lang==="fa"?"هنوز برنامه ثابتی اضافه نشده":"No fixed routines yet"}</p>
          <p className="text-xs mt-1">{lang==="fa"?"نماز، ورزش یا هر برنامه ثابت دیگری اضافه کن":"Add prayers, workouts or any fixed schedule"}</p>
        </div>
      )}
    </div>
  );
}
