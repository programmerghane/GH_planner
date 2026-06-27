export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  energy: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  actualTime?: number;
  deadline?: string;
  category: string;
  status: 'todo' | 'in_progress' | 'done';
  checklist: { id: string; text: string; done: boolean }[];
  progress: number;
  aiScore?: number;
  aiSuggestion?: string;
  createdAt: string;
  time?: string;
  importanceCoefficient?: number;
  relatedGoalId?: string;
  isRecurring?: boolean;
  recurrence?: 'none' | 'daily' | 'weekly';
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  deadline: string;
  progress: number;
  milestones: { id: string; text: string; done: boolean }[];
  status: 'active' | 'completed' | 'abandoned';
  createdAt: string;
  relatedHabits?: string[];
  aiSuggestions?: string;
}

export interface Habit {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  frequency: 'daily' | 'weekly';
  currentStreak: number;
  longestStreak: number;
  history: { [date: string]: boolean };
  createdAt: string;
}

// ─── Fixed Routine (نماز، ورزش صبحگاهی و ...) ───────────────────
export interface FixedRoutine {
  id: string;
  title: string;
  emoji: string;
  color: string;
  times: string[]; // ["05:30", "12:30", "17:00"] - زمان‌های ثابت
  days: ('sat'|'sun'|'mon'|'tue'|'wed'|'thu'|'fri')[];
  category: 'prayer' | 'worship' | 'exercise' | 'meal' | 'sleep' | 'custom';
  reminder: boolean;
  reminderMinutes: number; // دقیقه قبل از یادآوری
  history: { [dateTime: string]: boolean }; // "2024-01-01_05:30" -> done
  createdAt: string;
}

export interface TrackerType {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  unit: string;
  category: string;
  inputType: 'number' | 'boolean' | 'rating' | 'slider' | 'text' | 'mood' | 'range';
  minVal: number;
  maxVal: number;
  targetVal: number;
}

export interface TrackerEntry {
  id: string;
  trackerTypeId: string;
  date: string;
  value: number | string | boolean;
  note: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  mood: number;
  content: string;
  answers: { achievement: string; learning: string; improvement: string };
  createdAt: string;
}

// ─── Season Record ─────────────────────────────────────────────────
export interface SeasonRecord {
  season: number; // 1,2,3,...
  year: number;
  quarter: 1|2|3|4;
  maxLevel: number;
  maxXP: number;
  rank: string;
  icon: string;
  achievements: number;
  tasksCompleted: number;
  endDate: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  totalXP: number; // XP کل همیشه جمع میشه
  rank: string;
  rankIcon: string; // آیکون مخصوص هر رنک
  rankBorder: string; // border style پروفایل
  streakCount: number;
  longestStreak: number;
  freezeTokens: number;
  productivityScore: number;
  lifeScore: number;
  joinedDate: string;
  themeId?: string;
  language?: 'fa' | 'en';
  usePersianNumerals?: boolean;
  userId?: string;
  twoFactorEnabled?: boolean;
  biometricsEnabled?: boolean;
  linkedAccounts?: string[];
  onboardingCompleted?: boolean;
  isGuest?: boolean;
  email?: string;
  phone?: string;
  aiPersonality?: string;
  wakeUpTime?: string;
  bedTime?: string;
  selectedGoals?: string[];
  interests?: string[];
  // Season system
  currentSeason: number;
  seasonStartDate: string;
  seasonRecords: SeasonRecord[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legendary';
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt?: string;
}

export interface ActivityLog {
  id: string;
  date: string;
  xpGained: number;
  activityType: string;
  description: string;
}

export interface Countdown {
  id: string;
  title: string;
  date: string;
}

export interface AppState {
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  fixedRoutines: FixedRoutine[];
  trackerTypes: TrackerType[];
  trackerEntries: TrackerEntry[];
  notes: Note[];
  journalEntries: JournalEntry[];
  profile: UserProfile;
  achievements: Achievement[];
  activityLogs: ActivityLog[];
  countdowns?: Countdown[];
}
