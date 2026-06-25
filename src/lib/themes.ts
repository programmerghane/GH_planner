export interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  background: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  primary: string;
  accent: string;
  gradient: string;
  accentGradient: string;
}

export const PREMIUM_THEMES: Theme[] = [
  {
    id: "midnight",
    name: "Midnight Slate",
    isDark: true,
    background: "bg-slate-950 text-slate-100",
    cardBg: "bg-slate-900/60 border-slate-800/80",
    textPrimary: "text-slate-100",
    textSecondary: "text-slate-400",
    borderColor: "border-slate-800/80",
    primary: "rgb(99, 102, 241)", // Indigo
    accent: "rgb(168, 85, 247)", // Purple
    gradient: "from-slate-950 via-slate-900 to-slate-950",
    accentGradient: "from-indigo-500 to-purple-600",
  },
  {
    id: "oled",
    name: "Pure OLED Black",
    isDark: true,
    background: "bg-black text-neutral-100",
    cardBg: "bg-zinc-900/40 border-zinc-800",
    textPrimary: "text-neutral-100",
    textSecondary: "text-neutral-400",
    borderColor: "border-zinc-800",
    primary: "rgb(168, 85, 247)", // Purple
    accent: "rgb(236, 72, 153)", // Pink
    gradient: "from-black to-zinc-950",
    accentGradient: "from-purple-600 to-pink-600",
  },
  {
    id: "cyberpunk",
    name: "Neon Cyberpunk",
    isDark: true,
    background: "bg-gray-950 text-gray-100",
    cardBg: "bg-gray-900/80 border-cyan-500/30",
    textPrimary: "text-white",
    textSecondary: "text-cyan-400/80",
    borderColor: "border-cyan-500/30",
    primary: "rgb(6, 182, 212)", // Cyan
    accent: "rgb(236, 72, 153)", // Hot Pink
    gradient: "from-gray-950 via-slate-900 to-gray-950",
    accentGradient: "from-cyan-400 to-pink-500",
  },
  {
    id: "forest",
    name: "Emerald Forest",
    isDark: true,
    background: "bg-stone-950 text-stone-100",
    cardBg: "bg-stone-900/80 border-emerald-900/50",
    textPrimary: "text-stone-100",
    textSecondary: "text-emerald-400/80",
    borderColor: "border-emerald-900/50",
    primary: "rgb(16, 185, 129)", // Emerald
    accent: "rgb(101, 163, 13)", // Lime
    gradient: "from-stone-950 via-zinc-900 to-stone-950",
    accentGradient: "from-emerald-500 to-lime-500",
  },
  {
    id: "rose",
    name: "Sunset Rose",
    isDark: false,
    background: "bg-stone-50 text-stone-900",
    cardBg: "bg-white/80 border-rose-100 shadow-sm",
    textPrimary: "text-stone-800",
    textSecondary: "text-stone-500",
    borderColor: "border-rose-100",
    primary: "rgb(244, 63, 94)", // Rose
    accent: "rgb(249, 115, 22)", // Orange
    gradient: "from-stone-50 via-rose-50/20 to-stone-100",
    accentGradient: "from-rose-500 to-orange-500",
  },
  {
    id: "nord",
    name: "Arctic Nord",
    isDark: true,
    background: "bg-slate-900 text-slate-100",
    cardBg: "bg-slate-800/50 border-slate-700/60",
    textPrimary: "text-slate-100",
    textSecondary: "text-cyan-200/70",
    borderColor: "border-slate-700/60",
    primary: "rgb(14, 165, 233)", // Sky
    accent: "rgb(45, 212, 191)", // Teal
    gradient: "from-slate-950 to-slate-900",
    accentGradient: "from-sky-500 to-teal-400",
  },
  {
    id: "dracula",
    name: "Vampire Dracula",
    isDark: true,
    background: "bg-neutral-950 text-neutral-100",
    cardBg: "bg-neutral-900/70 border-violet-900/40",
    textPrimary: "text-neutral-100",
    textSecondary: "text-violet-300",
    borderColor: "border-violet-900/40",
    primary: "rgb(139, 92, 246)", // Violet
    accent: "rgb(244, 63, 94)", // Rose
    gradient: "from-neutral-950 via-neutral-900 to-neutral-950",
    accentGradient: "from-violet-500 to-rose-500",
  },
  {
    id: "minimal_white",
    name: "Minimalist Ivory",
    isDark: false,
    background: "bg-zinc-50 text-zinc-900",
    cardBg: "bg-white border-zinc-200/80 shadow-xs",
    textPrimary: "text-zinc-900",
    textSecondary: "text-zinc-500",
    borderColor: "border-zinc-200/80",
    primary: "rgb(24, 24, 27)", // Zinc 800/900
    accent: "rgb(113, 113, 122)", // Zinc 500
    gradient: "from-zinc-50 via-zinc-100/50 to-zinc-50",
    accentGradient: "from-zinc-800 to-zinc-500",
  }
];
