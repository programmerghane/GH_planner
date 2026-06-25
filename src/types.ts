export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  energy: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // in minutes
  actualTime?: number; // in minutes
  deadline?: string; // YYYY-MM-DD
  category: string;
  status: 'todo' | 'in_progress' | 'done';
  checklist: { id: string; text: string; done: boolean }[];
  progress: number; // 0 to 100
  aiScore?: number;
  aiSuggestion?: string;
  createdAt: string;
  // New properties for Timeline and Calendar
  time?: string; // HH:MM
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
  deadline: string; // YYYY-MM-DD
  progress: number; // 0 to 100
  milestones: { id: string; text: string; done: boolean }[];
  status: 'active' | 'completed' | 'abandoned';
  createdAt: string;
  // New properties
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
  history: { [date: string]: boolean }; // YYYY-MM-DD -> completed
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
  inputType: 'number' | 'boolean' | 'rating' | 'slider' | 'text' | 'mood';
  minVal: number;
  maxVal: number;
  targetVal: number;
}

export interface TrackerEntry {
  id: string;
  trackerTypeId: string;
  date: string; // YYYY-MM-DD
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
  date: string; // YYYY-MM-DD
  mood: number; // 1-10
  content: string;
  answers: {
    achievement: string;
    learning: string;
    improvement: string;
  };
  createdAt: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  level: number;
  xp: number;
  rank: string;
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
  date: string; // YYYY-MM-DD
  xpGained: number;
  activityType: string; // 'task' | 'habit' | 'goal' | 'tracker' | 'journal'
  description: string;
}

export interface Countdown {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
}

export interface AppState {
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  trackerTypes: TrackerType[];
  trackerEntries: TrackerEntry[];
  notes: Note[];
  journalEntries: JournalEntry[];
  profile: UserProfile;
  achievements: Achievement[];
  activityLogs: ActivityLog[];
  countdowns?: Countdown[];
}
