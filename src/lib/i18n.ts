/**
 * Centralized i18n and Persian/Solar Hijri Calendar helper utilities for Life OS.
 */

import { toJalaali, toGregorian } from "jalaali-js";

// Gregorian to Solar Hijri (Shamsi) exact conversion
export function gregorianToShamsi(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  return toJalaali(gy, gm, gd);
}

// Solar Hijri (Shamsi) to Gregorian conversion
export function shamsiToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  return toGregorian(jy, jm, jd);
}

// Timezone-safe date utility helpers
export function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateToLocalString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getPersianNumericDate(date: Date, enabled: boolean = true): string {
  const { jy, jm, jd } = gregorianToShamsi(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const yStr = String(jy);
  const mStr = String(jm).padStart(2, "0");
  const dStr = String(jd).padStart(2, "0");
  const res = `${yStr}/${mStr}/${dStr}`;
  return toPersianDigits(res, enabled);
}

// Converts standard English numbers to Persian numbers
export function toPersianDigits(text: string | number, enabled: boolean = true): string {
  if (!enabled) return String(text);
  const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(text).replace(/[0-9]/g, (w) => persianNumbers[parseInt(w, 10)]);
}

// Shamsi month list
export const SHAMSI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

// Shamsi short day names starting from Saturday
export const SHAMSI_WEEKDAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
export const SHAMSI_WEEKDAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];

// Translation dictionary
export const DICTIONARY: { [key: string]: { fa: string; en: string } } = {
  // Navigation / Tabs
  home: { fa: "داشبورد اصلی", en: "Main Dashboard" },
  planner: { fa: "برنامه‌ریزی و اهداف", en: "Planner & Goals" },
  calendar: { fa: "تقویم شمسی سیستم", en: "Ecosystem Calendar" },
  trackers: { fa: "ردیاب‌ها و عادات", en: "Trackers & Habits" },
  notes: { fa: "یادداشت‌ها و کوئیز", en: "Notes & Quiz" },
  ai: { fa: "دوقلوی دیجیتال (هوش مصنوعی)", en: "AI Digital Twin" },
  profile: { fa: "میزان رشد و جوایز", en: "My Growth & Badges" },
  settings: { fa: "تنظیمات سامانه", en: "System Settings" },
  appTitle: { fa: "برنامه‌ریز و دستیار هوشمند زیستی", en: "GH Life OS Planner" },

  // Home Greetings and Header
  greetingMorning: { fa: "صبح بخیر، فرمانده", en: "Good morning, Commander" },
  greetingAfternoon: { fa: "ظهر بخیر، فرمانده", en: "Good afternoon, Commander" },
  greetingEvening: { fa: "عصر بخیر، فرمانده", en: "Good evening, Commander" },
  customizeWidgets: { fa: "سفارشی‌سازی ویجت‌ها", en: "Customize Widgets" },
  widgetOrganizer: { fa: "سازمان‌دهنده ویجت‌های تعاملی", en: "Interactive Widget Organizer" },
  widgetOrganizerDesc: { fa: "پنهان‌سازی یا تغییر اولویت ابزارهای صفحه اصلی برای شخصی‌سازی محیط کاربری.", en: "Hide or reorder dashboard elements for your bespoke Life OS workspace." },
  tehranWeather: { fa: "⛅ ۲۴ درجه سانتی‌گراد، تهران", en: "⛅ 24°C, Tehran" },

  // AI Briefing Widget
  aiCommanderBriefing: { fa: "گزارش روزانه دستیار هوشمند (هوش مصنوعی)", en: "AI Commander Briefing" },
  forceRefresh: { fa: "به‌روزرسانی اجباری", en: "Force Refresh" },
  revising: { fa: "در حال بررسی و تحلیل...", en: "Analyzing stats..." },
  consultingTwin: { fa: "در حال رایزنی با دوقلوی دیجیتال شما...", en: "Consulting with Digital Twin..." },
  generateBriefing: { fa: "تولید گزارش روزانه هوشمند با هوش مصنوعی", en: "Generate AI Daily Briefing" },
  primaryTaskTarget: { fa: "هدف و وظیفه اصلی امروز", en: "Primary Task Target" },
  restBufferSlots: { fa: "بازه پیشنهادی استراحت", en: "Rest Buffer Slots" },
  warningAdvice: { fa: "هشدار سلامتی و خستگی", en: "Warning advice" },

  // Quick Actions Widget
  quickAddActions: { fa: "عملیات سریع و افزودن", en: "Quick Add Actions" },
  addTask: { fa: "افزودن وظیفه", en: "Add Task" },
  addActivity: { fa: "ایجاد فعالیت جدید", en: "Add activity" },
  addJournal: { fa: "ثبت روزنگار", en: "Add Journal" },
  reflectionLog: { fa: "ثبت بازتاب احساسی", en: "Reflection log" },
  addNote: { fa: "افزودن یادداشت", en: "Add Note" },
  draftFile: { fa: "ایجاد چرک‌نویس", en: "Draft file" },
  askTwin: { fa: "مشاوره با دوقلو", en: "Ask Twin" },
  consultAiCoach: { fa: "گفتگو با مربی هوش مصنوعی", en: "Consult AI coach" },

  // Tasks List Widget
  todaysTasks: { fa: "وظایف برنامه‌ریزی‌شده امروز", en: "Today's Planner Tasks" },
  viewPlanner: { fa: "مشاهده برنامه‌ریز کامل", en: "View Planner" },
  noPendingTasks: { fa: "هیچ وظیفه معلقی وجود ندارد. برنامه‌ای تمیز و عالی!", en: "No pending tasks. Clean planner slate!" },
  done: { fa: "انجام شد", en: "Done" },

  // Countdowns Widget
  targetCountdowns: { fa: "شمارش معکوس و ضرب‌الاجل‌ها", en: "Target Countdowns" },
  daysLeft: { fa: "روز باقی‌مانده", en: "days left" },
  happeningToday: { fa: "همین امروز!", en: "Happening Today" },

  // Scores Widget
  lifeOsScores: { fa: "شاخص‌های عملکرد زیستی", en: "Life OS Scores" },
  productivityIndex: { fa: "شاخص بهره‌وری روزانه", en: "Productivity Index" },
  dailyBalanceRating: { fa: "امتیاز تعادل و آرامش زندگی", en: "Daily Balance Rating" },

  // Planner System
  taskManager: { fa: "مدیریت کارآمد وظایف روزانه", en: "High-Performance Task Management" },
  taskManagerDesc: { fa: "تخصیص هوشمند اولویت‌ها، سطح انرژی، زمان تخمینی و مدیریت چک‌لیست تعاملی.", en: "Organize activities with priority tiers, energy indexes, estimated durations, and sub-task checklists." },
  smartPlannerAuto: { fa: "برنامه‌ریزی خودکار با هوش مصنوعی", en: "Smart AI Auto-Scheduling" },
  smartPlannerDesc: { fa: "با زدن دکمه زیر، هوش مصنوعی وظایف را به بهترین بازه‌های زمانی روز تخصیص می‌دهد.", en: "Let Gemini optimize your day by sorting tasks into optimal time blocks based on your energy levels." },
  optimizeSchedule: { fa: "بهینه‌سازی برنامه با هوش مصنوعی", en: "Optimize Schedule via Gemini" },
  optimizing: { fa: "در حال بهینه‌سازی...", en: "Optimizing..." },
  taskInputPlaceholder: { fa: "عنوانی برای کار جدید بنویسید...", en: "Enter new task title..." },
  category: { fa: "دسته‌بندی", en: "Category" },
  priority: { fa: "اولویت", en: "Priority" },
  energyRequired: { fa: "انرژی مورد نیاز", en: "Energy Required" },
  difficulty: { fa: "درجه سختی", en: "Difficulty" },
  durationMin: { fa: "زمان تخمینی (دقیقه)", en: "Estimated Duration (Min)" },
  deadline: { fa: "تاریخ مهلت", en: "Deadline Date" },
  saveTask: { fa: "ذخیره وظیفه جدید", en: "Save Task" },
  tasksTodo: { fa: "کارهای در دست انجام", en: "Tasks To Do" },
  tasksInProgress: { fa: "کارهای در حال انجام", en: "Tasks In Progress" },
  tasksDone: { fa: "کارهای تکمیل‌شده", en: "Tasks Completed" },
  noTasksInSection: { fa: "هیچ کاری در این بخش نیست", en: "No tasks in this section" },
  allCategories: { fa: "همه دسته‌بندی‌ها", en: "All Categories" },
  general: { fa: "عمومی", en: "General" },
  study: { fa: "تحصیل و مطالعه", en: "Study" },
  workout: { fa: "تمرین و ورزش", en: "Workout" },
  health: { fa: "سلامت و تغذیه", en: "Health" },
  personal: { fa: "شخصی", en: "Personal" },
  goalsSystem: { fa: "سامانه اهداف و مایلستون‌ها", en: "Milestone & Goals System" },
  goalsDesc: { fa: "اهداف میان‌مدت و بلندمدت خود را تعریف کنید و گام‌های رسیدن به آن را ثبت نمایید.", en: "Track medium and long-term milestones. Tie sub-steps to lock in achievements." },
  addGoal: { fa: "تعریف هدف جدید", en: "Define New Goal" },
  goalInputPlaceholder: { fa: "مثال: یادگیری کامل برنامه‌نویسی React", en: "E.g., Master React Full-Stack Development" },
  addMilestone: { fa: "افزودن گام فرعی", en: "Add Milestone Step" },
  milestones: { fa: "مایلستون‌ها / گام‌ها", en: "Milestones & Steps" },
  saveGoal: { fa: "ذخیره هدف", en: "Save Goal" },
  activeGoals: { fa: "اهداف فعال و پویا", en: "Active Goals" },
  completedGoals: { fa: "اهداف به سرانجام رسیده", en: "Completed Goals" },

  // Calendar System
  multiCalendars: { fa: "تقویم‌های یکپارچه زیستی", en: "Ecosystem Calendars" },
  calendarDesc: { fa: "هماهنگی بی‌نظیر بین تقویم شمسی (خورشیدی)، میلادی و قمری همراه با زمان‌بندی دقیق وظایف.", en: "Coordinate across Solar Hijri, Gregorian, and Lunar Islamic calendars with automatic timezone shift alignment." },
  gregorian: { fa: "میلادی", en: "Gregorian" },
  solarPersian: { fa: "شمسی خورشیدی ☀️", en: "Solar Persian ☀️" },
  islamicHijri: { fa: "قمری اسلامی 🌙", en: "Islamic Hijri 🌙" },
  selectedDay: { fa: "روز انتخاب‌شده:", en: "Selected Day:" },
  daySchedule: { fa: "برنامه روزانه", en: "Day Schedule" },
  eventTitle: { fa: "عنوان رویداد", en: "Event title" },
  saveEvent: { fa: "ذخیره رویداد", en: "Save Event" },
  noEvents: { fa: "هیچ رویدادی در این روز ثبت نشده است. مایل به برنامه‌ریزی جدید هستید؟", en: "No events on this day. Open to study suggestions!" },
  smartSlotPredictor: { fa: "پیش‌بینی هوشمند بهترین بازه", en: "Smart Slot Predictor" },
  studySlotPrediction: { fa: "تحلیل هوش مصنوعی بر اساس چرخه‌های انرژی شما، بهترین بازه تمرکز امروز را مشخص کرد:", en: "AI analysis of your high energy study cycles has selected today's best slot:" },
  bestStudySlot: { fa: "بهترین زمان مطالعه عمیق", en: "Best Study Slot" },
  studySlotDesc: { fa: "مرور مباحث پیچیده همزمان با بازه آرامش محیطی و بالاترین آمادگی ذهنی.", en: "Biology revisions matched with quiet environmental period and fresh rest blocks." },

  // Custom Trackers & Habits
  habitsAndTrackersTitle: { fa: "ردیاب عادات و فاکتورهای زیستی", en: "Habits & Custom Metrics Trackers" },
  habitsDesc: { fa: "ثبت مداوم عادات مثبت و اندازه‌گیری روزانه معیارهای کلیدی سلامت، ورزش، خواب و روان.", en: "Form sustainable habits and monitor quantitative health metrics like hydration and sleep." },
  dailyHabits: { fa: "عادات روزانه من", en: "My Daily Habits" },
  weeklyHabits: { fa: "عادات هفتگی من", en: "My Weekly Habits" },
  createHabit: { fa: "ایجاد عادت جدید", en: "Create New Habit" },
  habitPlaceholder: { fa: "عادت جدید (مثل: مطالعه کتاب)", en: "New habit (e.g., Read 10 pages)" },
  longestStreak: { fa: "بیشترین تداوم:", en: "Longest Streak:" },
  currentStreak: { fa: "تداوم فعلی:", en: "Current Streak:" },
  quantitativeTrackers: { fa: "ردیاب‌های عددی و معیاری", en: "Quantitative Trackers" },
  createCustomTracker: { fa: "ساخت ردیاب سفارشی جدید", en: "Create Custom Tracker" },
  trackerName: { fa: "نام ردیاب (مثل: مصرف آب)", en: "Tracker Name" },
  trackerEmoji: { fa: "ایموجی", en: "Emoji" },
  trackerUnit: { fa: "واحد سنجش (مثل: لیتر، ساعت)", en: "Measurement Unit" },
  inputType: { fa: "نوع ورودی", en: "Input Type" },
  number: { fa: "عدد", en: "Number" },
  slider: { fa: "اسلایدر", en: "Slider" },
  mood: { fa: "احساسات و خلق و خو", en: "Mood Scale" },
  boolean: { fa: "بله / خیر", en: "Yes / No" },
  minValue: { fa: "حداقل مقدار", en: "Min Value" },
  maxValue: { fa: "حداکثر مقدار", en: "Max Value" },
  targetValue: { fa: "هدف روزانه", en: "Target Value" },
  saveTracker: { fa: "ذخیره ردیاب", en: "Save Tracker" },
  logValueFor: { fa: "ثبت مقدار برای", en: "Log Value for" },
  enterValue: { fa: "مقدار را وارد کنید", en: "Enter value" },
  optionalNote: { fa: "یادداشت اختیاری...", en: "Optional note..." },
  submitLog: { fa: "ثبت در سیستم", en: "Submit Log" },
  pastEntries: { fa: "گزارش‌های پیشین", en: "Past Entries" },

  // Note System
  academicNotes: { fa: "دفترچه یادداشت دیجیتال", en: "Academic & General Notes" },
  notesDesc: { fa: "ثبت متون علمی، کارهای درسی و پژوهشی همراه با ابزارهای هوش مصنوعی مانند خلاصه‌سازی و کوئیز.", en: "Keep structured notes, research materials, or lecture drafts with AI flashcards & quizzes." },
  newNote: { fa: "یادداشت جدید", en: "New Note" },
  noteTitlePlaceholder: { fa: "عنوان یادداشت...", en: "Note title..." },
  noteContentPlaceholder: { fa: "شروع به نوشتن متن با پشتیبانی از Markdown کنید...", en: "Start writing with rich markdown support..." },
  noteFolder: { fa: "پوشه", en: "Folder" },
  noteTagsComma: { fa: "برچسب‌ها (با کاما جدا کنید)", en: "Tags (comma separated)" },
  saveNote: { fa: "ذخیره یادداشت", en: "Save Note" },
  aiHelpers: { fa: "ابزارهای هوش مصنوعی یادداشت", en: "AI Note Helpers" },
  aiSummarize: { fa: "خلاصه‌سازی متن با هوش مصنوعی", en: "Summarize via AI" },
  aiFlashcards: { fa: "ساخت فلش‌کارت آموزشی", en: "Generate Study Flashcards" },
  aiQuiz: { fa: "طراحی کوئیز هوشمند بر اساس متن", en: "Create AI Quiz from Note" },
  academicQuizZone: { fa: "بخش آزمون هوشمند مربی دوقلو", en: "AI Twin Quiz Zone" },
  interactiveFlashcards: { fa: "فلش‌کارت‌های تعاملی آموزشی", en: "Interactive Study Flashcards" },
  flipCard: { fa: "چرخاندن کارت", en: "Flip Card" },
  correctAnswer: { fa: "پاسخ صحیح است!", en: "Correct Answer!" },
  wrongAnswer: { fa: "پاسخ اشتباه! دوباره تلاش کنید.", en: "Incorrect! Try again." },

  // Journal System
  emotionalReflection: { fa: "دفترچه خودشناسی و بازتاب احساسات", en: "Emotional Reflection & Mind Journals" },
  journalDesc: { fa: "خودشناسی عمیق با ثبت روزانه احوال روحی، بزرگ‌ترین دستاوردها، درس‌های آموخته‌شده و بازخوردها.", en: "Reflect on accomplishments, capture daily emotional logs, and review weekly cognitive patterns." },
  dailyMoodRating: { fa: "امتیاز خلق و خوی روزانه (۱ تا ۱۰)", en: "Daily Mood Rating (1 to 10)" },
  achievementQuestion: { fa: "بزرگ‌ترین دستاورد یا پیروزی شما در امروز چه بود؟", en: "What was your greatest victory or achievement today?" },
  learningQuestion: { fa: "امروز چه درس ارزشمندی آموختید؟", en: "What is the most valuable lesson you learned today?" },
  improvementQuestion: { fa: "فردا چه چیز مهمی را می‌توانید بهبود دهید؟", en: "What is one thing you can improve tomorrow?" },
  journalWritePlaceholder: { fa: "احساسات و تفکرات آزاد خود را به زیبایی ثبت کنید...", en: "Free-write your stream of consciousness..." },
  saveJournal: { fa: "ثبت روزنگار بازتاب", en: "Save Journal Entry" },
  reflectionHistory: { fa: "تاریخچه بازتاب‌های پیشین", en: "Reflection History" },

  // AI Predictor / Twin Coach
  digitalTwinTitle: { fa: "مربی هوشمند و دوقلوی دیجیتال شما", en: "Your Digital Twin & AI Performance Coach" },
  twinDesc: { fa: "گفتگو با نسخه الگوریتمی خودتان که بر اساس داده‌ها، رفتارها و عادات شما آموزش دیده است؛ همراه با پیش‌بینی یک هفته آینده.", en: "Interact with your analytical twin trained on your habits, simulated future projections, and daily logs." },
  askDigitalTwinCoach: { fa: "گفتگو با مربی دوقلوی دیجیتال", en: "Ask your Digital Twin Coach" },
  aiCoachPlaceholder: { fa: "فرمانده، هر سوالی دارید درباره روند بهره‌وری یا سبک زندگی بپرسید...", en: "Ask your twin about your productivity, study block layouts, or burnout risks..." },
  send: { fa: "ارسال", en: "Send" },
  simulationEngine: { fa: "موتور شبیه‌سازی آینده زیستی (پیش‌بینی ۱ هفته آینده)", en: "Life OS Simulation Engine (1-Week Projections)" },
  simulationDesc: { fa: "شبیه‌سازی بر اساس روندهای جاری شما در ثبت خواب، ورزش، وظایف و تعادل عاطفی.", en: "Run physics-based simulations on your current trajectories for tasks, sleep, and emotional health." },
  simulateBtn: { fa: "اجرای شبیه‌سازی آینده نزدیک", en: "Run Future Outlook Simulation" },
  simulating: { fa: "در حال شبیه‌سازی آینده...", en: "Running predictive simulation..." },
  simOutput: { fa: "خروجی شبیه‌ساز الگوها", en: "Predictive Simulator Output" },

  // Profile Growth
  commanderStats: { fa: "شاخص‌های رشد و دستاوردهای فرمانده", en: "Commander Growth & Accomplishments" },
  xpProgress: { fa: "پیشرفت سطح و امتیاز تجربه", en: "XP Leveling Progress" },
  currentRank: { fa: "جایگاه فعلی:", en: "Current Rank:" },
  longestStreakDays: { fa: "بیشترین تداوم روزنگاری:", en: "Longest Journal Streak:" },
  freezeTokens: { fa: "توکن‌های انجماد تداوم:", en: "Streak Freeze Tokens:" },
  useFreezeToken: { fa: "استفاده از توکن انجماد", en: "Use Freeze Token" },
  activityLogs: { fa: "تاریخچه فعالیت‌ها و امتیازات تجربه (XP)", en: "Activity Logs & XP History" },
  badgeRoom: { fa: "تالار جوایز و دستاوردها", en: "Accomplishment Badges Gallery" },
  unlocked: { fa: "آزادشده", en: "Unlocked" },
  locked: { fa: "قفل‌شده", en: "Locked" },

  // Settings
  themeCustomization: { fa: "شخصی‌سازی پوسته و رنگ سیستم", en: "Theme & Workspace Customization" },
  accentColor: { fa: "رنگ شاخص و اصلی (Accent)", en: "Primary Accent Color" },
  systemLanguage: { fa: "زبان پیش‌فرض کل سیستم", en: "Default System Language" },
  farsi: { fa: "فارسی (Persian) - راست‌به‌چپ 🇮🇷", en: "Persian (Farsi) - RTL 🇮🇷" },
  english: { fa: "انگلیسی (English) - LTR 🇺🇸", en: "English (English) - LTR 🇺🇸" },
  numeralPreference: { fa: "فرمت نمایش اعداد", en: "Numeral System Preference" },
  usePersianNumerals: { fa: "نمایش اعداد با فونت زیبای فارسی (۰۱۲۳۴۵۶۷۸۹)", en: "Display using Persian Numerals (۰۱۲۳۴۵۶۷۸۹)" },
  useEnglishNumerals: { fa: "نمایش اعداد انگلیسی (0123456789)", en: "Display using Standard English Numerals (0123456789)" },
  exportBackup: { fa: "خروجی گرفتن و پشتیبان‌گیری داده‌ها", en: "Data Export & State Backup" },
  exportBackupDesc: { fa: "دانلود تمامی داده‌های ثبت‌شده در سیستم به صورت یک فایل JSON برای امنیت بیشتر.", en: "Save and download your complete local database state to a file." },
  exportBtn: { fa: "دانلود فایل پشتیبان JSON", en: "Download State JSON" },
  importBackup: { fa: "بازیابی اطلاعات از فایل پشتیبان", en: "Restore State from Backup" },
  importBackupDesc: { fa: "بارگذاری داده‌های پیشین از روی فایل JSON برای هماهنگ‌سازی.", en: "Upload a previously exported JSON backup file to restore your database state." },
  importBtn: { fa: "انتخاب و بارگذاری فایل", en: "Choose and Load File" },
  firstLaunchNotice: { fa: "به منظور هماهنگی عالی، سامانه به صورت خودکار روی زبان فارسی (راست‌به‌چپ) بهینه‌سازی شده است.", en: "The workspace is optimized in Persian (RTL) layout with solar hijri calendar system by default." },
};

// Main translator hook/helper function
export function t(key: string, lang: "fa" | "en" = "fa"): string {
  const item = DICTIONARY[key];
  if (!item) return key;
  return item[lang] || item["fa"] || key;
}
