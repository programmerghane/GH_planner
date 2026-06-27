// ─── GH Planner — Level & XP System ─────────────────────────────

// XP مورد نیاز برای هر لول — هرچی بالاتر سخت‌تر
export function xpForLevel(level: number): number {
  if (level <= 0) return 0;
  // فرمول: XP = 500 * level^1.8
  // لول 1: 500 | لول 2: ~1900 | لول 5: ~9500 | لول 10: ~31500 | لول 20: ~107k
  return Math.floor(500 * Math.pow(level, 1.8));
}

// XP کل تجمعی تا رسیدن به لول X
export function totalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) total += xpForLevel(i);
  return total;
}

// لول فعلی از روی totalXP
export function levelFromTotalXP(totalXP: number): number {
  let level = 1;
  let accumulated = 0;
  while (accumulated + xpForLevel(level) <= totalXP) {
    accumulated += xpForLevel(level);
    level++;
  }
  return level - 1 < 1 ? 1 : level - 1;
}

// درصد پیشرفت در لول فعلی
export function xpProgressInCurrentLevel(totalXP: number): { current: number; needed: number; percent: number } {
  const level = levelFromTotalXP(totalXP);
  const xpBeforeLevel = totalXPForLevel(level);
  const needed = xpForLevel(level + 1);
  const current = totalXP - xpBeforeLevel;
  return { current, needed, percent: Math.round((current / needed) * 100) };
}

// ─── XP بر اساس اولویت و سختی تسک ──────────────────────────────
export function taskXP(priority: string, difficulty: string): number {
  const priorityMult: Record<string, number> = { low: 1, medium: 1.5, high: 2.5, critical: 4 };
  const difficultyMult: Record<string, number> = { easy: 1, medium: 1.5, hard: 2.5 };
  const base = 50;
  return Math.floor(base * (priorityMult[priority] || 1) * (difficultyMult[difficulty] || 1));
}

// XP برای انواع فعالیت
export const XP_REWARDS = {
  taskAdd: 5,
  taskComplete: (priority: string, difficulty: string) => taskXP(priority, difficulty),
  goalAdd: 30,
  goalComplete: 500,
  habitCheck: 20,
  routineCheck: 15, // RoutineFixed
  noteAdd: 10,
  journalEntry: 40,
  trackerLog: 8,
  loginStreak: (streak: number) => Math.min(streak * 10, 200), // حداکثر 200
};

// ─── رنک‌ها و آیکون‌ها ───────────────────────────────────────────
export interface RankInfo {
  rank: string;
  rankFa: string;
  icon: string;
  border: string; // Tailwind class
  glow: string;
  minLevel: number;
  color: string;
}

export const RANKS: RankInfo[] = [
  { minLevel:1,  rank:"Novice",       rankFa:"مبتدی",       icon:"🌱", border:"ring-2 ring-slate-600",          glow:"shadow-slate-500/20",   color:"#64748b" },
  { minLevel:3,  rank:"Explorer",     rankFa:"کاوشگر",      icon:"🔍", border:"ring-2 ring-blue-600",           glow:"shadow-blue-500/30",    color:"#3b82f6" },
  { minLevel:5,  rank:"Apprentice",   rankFa:"کارآموز",     icon:"⚡", border:"ring-2 ring-indigo-500",         glow:"shadow-indigo-500/30",  color:"#6366f1" },
  { minLevel:8,  rank:"Warrior",      rankFa:"جنگجو",       icon:"⚔️", border:"ring-2 ring-violet-500",         glow:"shadow-violet-500/40",  color:"#8b5cf6" },
  { minLevel:12, rank:"Skilled",      rankFa:"ماهر",        icon:"🎯", border:"ring-2 ring-purple-500",         glow:"shadow-purple-500/40",  color:"#a855f7" },
  { minLevel:17, rank:"Expert",       rankFa:"خبره",        icon:"🏆", border:"ring-2 ring-amber-500",          glow:"shadow-amber-500/40",   color:"#f59e0b" },
  { minLevel:23, rank:"Master",       rankFa:"استاد",       icon:"👑", border:"ring-2 ring-orange-400",         glow:"shadow-orange-500/50",  color:"#fb923c" },
  { minLevel:30, rank:"GrandMaster",  rankFa:"استادبزرگ",   icon:"💎", border:"ring-2 ring-cyan-400",           glow:"shadow-cyan-500/50",    color:"#22d3ee" },
  { minLevel:40, rank:"Legend",       rankFa:"افسانه",      icon:"🌟", border:"ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-950", glow:"shadow-yellow-500/60", color:"#facc15" },
  { minLevel:50, rank:"Mythic",       rankFa:"اسطوره",      icon:"🔥", border:"ring-4 ring-rose-500 ring-offset-2 ring-offset-slate-950 animate-pulse", glow:"shadow-rose-500/70", color:"#f43f5e" },
  { minLevel:75, rank:"Immortal",     rankFa:"جاودانه",     icon:"✨", border:"ring-4 ring-white ring-offset-2 ring-offset-slate-950",     glow:"shadow-white/50",       color:"#ffffff" },
];

export function getRankInfo(level: number): RankInfo {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (level >= r.minLevel) current = r;
  }
  return current;
}

// ─── Season System ────────────────────────────────────────────────
// هر فصل = 3 ماه (۹۱ روز)
export function getCurrentSeason(joinDate: string): { season: number; quarter: 1|2|3|4; year: number; daysLeft: number } {
  const now = new Date();
  const joined = new Date(joinDate);
  const daysSince = Math.floor((now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24));
  const season = Math.floor(daysSince / 91) + 1;
  const month = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3) as 1|2|3|4;
  const seasonEnd = new Date(joined.getTime() + season * 91 * 24 * 60 * 60 * 1000);
  const daysLeft = Math.max(0, Math.ceil((seasonEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  return { season, quarter, year: now.getFullYear(), daysLeft };
}
