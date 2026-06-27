import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Supabase ────────────────────────────────────────────────────
const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function db(method: string, endpoint: string, body?: any) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Supabase not configured");
  const res = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${endpoint}: ${text}`);
  return text ? JSON.parse(text) : [];
}

// ─── Groq AI ─────────────────────────────────────────────────────
async function groq(messages: {role:string;content:string}[], json=false): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return json ? "{}" : "GROQ_API_KEY not set";
  const body: any = { model: "llama-3.3-70b-versatile", messages, max_tokens: 1024, temperature: 0.7 };
  if (json) body.response_format = { type: "json_object" };
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  const d = await res.json() as any;
  return d.choices?.[0]?.message?.content || (json ? "{}" : "");
}

// ─── Helpers ─────────────────────────────────────────────────────
const uid = () => "u_" + Math.random().toString(36).slice(2, 10);
const hash = (p: string) => Buffer.from(p + "gh_salt").toString("base64");

const DEFAULT_TRACKERS = [
  { id:"sleep", name:"ردیاب خواب", emoji:"🌙", color:"#6366f1", unit:"ساعت", category:"سلامتی", inputType:"number", minVal:0, maxVal:24, targetVal:8 },
  { id:"study", name:"جلسه مطالعه", emoji:"📚", color:"#10b981", unit:"ساعت", category:"آموزش", inputType:"number", minVal:0, maxVal:24, targetVal:6 },
  { id:"water", name:"مصرف آب", emoji:"💧", color:"#3b82f6", unit:"لیوان", category:"سلامتی", inputType:"number", minVal:0, maxVal:20, targetVal:8 },
  { id:"mood", name:"حال و روز", emoji:"😊", color:"#f59e0b", unit:"امتیاز", category:"سلامت روان", inputType:"range", minVal:1, maxVal:10, targetVal:7 },
  { id:"workout", name:"تمرین ورزشی", emoji:"💪", color:"#ef4444", unit:"دقیقه", category:"تناسب اندام", inputType:"number", minVal:0, maxVal:300, targetVal:45 },
];

function makeState(id: string, name: string, lang="fa", extra={}) {
  return {
    tasks:[], goals:[], habits:[],
    fixedRoutines: [],
    trackerTypes: DEFAULT_TRACKERS,
    trackerEntries:[], notes:[], journalEntries:[],
    profile:{
      id, name, avatar:"", level:1, xp:0, totalXP:0,
      rank:"Novice", rankIcon:"🌱", rankBorder:"ring-2 ring-slate-600",
      streakCount:0, longestStreak:0, freezeTokens:0,
      productivityScore:0, lifeScore:0,
      joinedDate: new Date().toISOString(),
      language: lang, onboardingCompleted: false,
      currentSeason: 1, seasonStartDate: new Date().toISOString(), seasonRecords: [],
      ...extra,
    },
    achievements:[], activityLogs:[], countdowns:[],
  };
}

async function getUser(id: string) {
  const rows = await db("GET", `/gh_users?id=eq.${encodeURIComponent(id)}&select=id,state`);
  return rows?.[0] || null;
}

async function saveUser(id: string, state: any) {
  await db("PATCH", `/gh_users?id=eq.${encodeURIComponent(id)}`, { state });
}

const PORT = parseInt(process.env.PORT || "3000", 10);

async function start() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  // ── State ──────────────────────────────────────────────────────
  app.get("/api/state", async (req, res) => {
    const id = req.headers["x-user-id"] as string;
    if (!id) return res.status(400).json({ success:false, error:"No user ID" });
    try {
      const user = await getUser(id);
      if (user) return res.json({ success:true, state: user.state });
      res.json({ success:false, error:"Not found" });
    } catch(e:any) { res.status(500).json({ success:false, error:e.message }); }
  });

  app.post("/api/state", async (req, res) => {
    const id = req.headers["x-user-id"] as string;
    if (!id) return res.status(400).json({ success:false });
    try {
      const state = req.body.state || req.body;
      await saveUser(id, state);
      res.json({ success:true });
    } catch(e:any) { res.status(500).json({ success:false, error:e.message }); }
  });

  // ── Auth ───────────────────────────────────────────────────────
  app.post("/api/auth/guest", async (req, res) => {
    const id = uid();
    const { lang="fa" } = req.body;
    const state = makeState(id, lang==="fa"?"مهمان":"Guest", lang, { isGuest:true });
    try {
      await db("POST", "/gh_users", { id, state });
      res.json({ success:true, userId:id, profile:state.profile, state });
    } catch(e:any) { res.status(500).json({ success:false, error:e.message }); }
  });

  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name, lang="fa" } = req.body;
    if (!email || !password) return res.status(400).json({ success:false, error:"Email and password required" });
    try {
      const exist = await db("GET", `/gh_users?email=eq.${encodeURIComponent(email)}&select=id`);
      if (exist?.length) return res.status(409).json({ success:false, error:"Email already registered" });
      const id = uid();
      const state = makeState(id, name||email.split("@")[0], lang, { email });
      await db("POST", "/gh_users", { id, email, password_hash:hash(password), state });
      res.json({ success:true, userId:id, profile:{...state.profile, id}, state });
    } catch(e:any) { res.status(500).json({ success:false, error:e.message }); }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const rows = await db("GET", `/gh_users?email=eq.${encodeURIComponent(email)}&select=id,password_hash,state`);
      if (!rows?.length) return res.status(401).json({ success:false, error:"Invalid credentials" });
      const u = rows[0];
      if (u.password_hash !== hash(password)) return res.status(401).json({ success:false, error:"Invalid credentials" });
      const profile = { ...u.state?.profile, id:u.id };
      res.json({ success:true, userId:u.id, profile, state:{ ...u.state, profile } });
    } catch(e:any) { res.status(500).json({ success:false, error:e.message }); }
  });

  app.post("/api/auth/send-otp", (_req, res) => {
    res.json({ success:true, message:"OTP: 1234 (demo mode)" });
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    const { phone, otp } = req.body;
    if (otp !== "1234") return res.status(400).json({ success:false, error:"Invalid OTP" });
    try {
      const rows = await db("GET", `/gh_users?phone=eq.${encodeURIComponent(phone)}&select=id,state`);
      if (rows?.length) {
        const u = rows[0];
        const profile = { ...u.state?.profile, id:u.id };
        return res.json({ success:true, userId:u.id, profile, state:{ ...u.state, profile } });
      }
      const id = uid();
      const state = makeState(id, phone, "fa", { phone });
      await db("POST", "/gh_users", { id, phone, state });
      res.json({ success:true, userId:id, profile:{...state.profile, id}, state });
    } catch(e:any) { res.status(500).json({ success:false, error:e.message }); }
  });

  app.post("/api/auth/complete-onboarding", async (req, res) => {
    const id = (req.headers["x-user-id"] as string) || req.body.userId;
    if (!id) return res.status(400).json({ success:false, error:"No user ID" });
    try {
      const user = await getUser(id);
      if (!user) {
        // User might be new guest — create them
        const newState = makeState(id, req.body.profile?.name||"User", req.body.profile?.language||"fa");
        newState.profile = { ...newState.profile, ...req.body.profile, id, onboardingCompleted:true };
        await db("POST", "/gh_users", { id, state: newState });
        return res.json({ success:true, profile:newState.profile, state:newState });
      }
      const state = user.state;
      const profileUpdate = req.body.profile || req.body.profileUpdates || {};
      const prefs = req.body.preferences || {};
      state.profile = {
        ...state.profile,
        ...profileUpdate,
        id,
        onboardingCompleted: true,
        aiPersonality: prefs.aiPersonality || profileUpdate.aiPersonality || state.profile.aiPersonality,
        wakeUpTime: prefs.wakeUpTime || state.profile.wakeUpTime,
        bedTime: prefs.bedTime || state.profile.bedTime,
        selectedGoals: prefs.selectedGoals || [],
        interests: prefs.interests || [],
      };
      await saveUser(id, state);
      res.json({ success:true, profile:state.profile, state });
    } catch(e:any) { res.status(500).json({ success:false, error:e.message }); }
  });

  // Stub endpoints
  const stub = (_r: any, res: any) => res.json({ success:true });
  app.post("/api/auth/social-login", (_r, res) => res.json({ success:false, error:"Not available" }));
  app.post("/api/auth/link", stub);
  app.post("/api/auth/unlink", stub);
  app.post("/api/auth/toggle-2fa", stub);
  app.post("/api/auth/toggle-biometrics", stub);
  app.post("/api/auth/revoke-session", stub);

  // ── GH AI ──────────────────────────────────────────────────────
  app.post("/api/gemini/briefing", async (req, res) => {
    try {
      const state = req.body.state || {};
      const p = state.profile || {};
      const lang = p.language || "fa";
      const fa = lang === "fa";
      const tasks = (state.tasks||[]).slice(0,5).map((t:any)=>t.title).join(", ");
      const goals = (state.goals||[]).slice(0,3).map((g:any)=>g.title).join(", ");
      const prompt = `You are GH — AI Life Coach. Generate a daily briefing.
User: ${p.name}, Level ${p.level||1}, XP: ${p.xp||0}
Tasks: ${tasks||"none"}
Goals: ${goals||"none"}
${fa?"پاسخ را به فارسی بنویس.":"Reply in English."}
Return ONLY valid JSON: {"summary":"...","mostImportantTask":"...","productivityAdvice":"...","freeTimeAdvice":"...","warning":"..."}`;
      const text = await groq([{role:"user",content:prompt}], true);
      res.json(JSON.parse(text));
    } catch(e:any) {
      res.json({ summary:"GH در حال آماده‌سازی...", mostImportantTask:"اولین تسک روز", productivityAdvice:"تمرکز بر اولویت‌ها", freeTimeAdvice:"استراحت بعد از ظهر", warning:"آب کافی بنوشید" });
    }
  });

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, chatHistory=[], state={} } = req.body;
      const lang = state?.profile?.language || "fa";
      const sys = `You are GH — AI Life Coach in GH Planner.
User: ${state?.profile?.name||"User"}, Level: ${state?.profile?.level||1}
Tasks: ${(state?.tasks||[]).slice(0,5).map((t:any)=>t.title).join(", ")||"none"}
${lang==="fa"?"همیشه به فارسی روان پاسخ بده.":"Reply in English."}`;
      const msgs = [
        {role:"system", content:sys},
        ...chatHistory.slice(-6).map((m:any)=>({role:m.role==="ai"?"assistant":"user", content:m.text})),
        {role:"user", content:message},
      ];
      const reply = await groq(msgs);
      res.json({ reply });
    } catch(e:any) { res.status(500).json({ error:e.message }); }
  });

  app.post("/api/gemini/planner", async (req, res) => {
    try {
      const { tasks=[], userContext="", language="fa" } = req.body;
      const fa = language==="fa";
      const prompt = `Schedule these tasks optimally.
Tasks: ${JSON.stringify(tasks.slice(0,10).map((t:any)=>({id:t.id,title:t.title,priority:t.priority})))}
Request: "${userContext}"
${fa?"فیلد aiSuggestion به فارسی.":""}
Return ONLY a JSON array: [{"taskId":"...","timeBlock":"Morning|Afternoon|Evening","aiScore":80,"aiSuggestion":"..."}]`;
      const text = await groq([{role:"user",content:prompt}], true);
      let parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      if (!Array.isArray(parsed)) parsed = parsed.tasks || parsed.schedule || [];
      res.json(parsed);
    } catch { res.json([]); }
  });

  app.post("/api/gemini/notes", async (req, res) => {
    try {
      const { content, action } = req.body;
      const prompts: Record<string,string> = {
        summarize: "خلاصه این یادداشت را به فارسی بنویس:",
        flashcards: 'Create 3 flashcards. Return ONLY JSON array: [{"question":"...","answer":"..."}]',
        quiz: 'Create 3 MCQ. Return ONLY JSON array: [{"question":"...","options":["a","b","c","d"],"correctIndex":0}]',
        proofread: "ویرایش و بهبود بده:",
      };
      const isJson = action==="flashcards"||action==="quiz";
      const result = await groq([{role:"user",content:`${prompts[action]||prompts.proofread}\n\n${content}`}], isJson);
      res.json({ result });
    } catch(e:any) { res.status(500).json({ error:e.message }); }
  });

// ─── AI Game Master - Daily Missions ─────────────────────────────
app.post("/api/ai/daily-missions", async (req, res) => {
  try {
    const { state } = req.body;
    const p = state?.profile || {};
    const lang = p.language || "fa";
    const fa = lang === "fa";
    const tasks = state?.tasks || [];
    const goals = state?.goals || [];
    const habits = state?.habits || [];
    const trackerEntries = state?.trackerEntries || [];
    const pendingTasks = tasks.filter((t: any) => t.status !== "done");
    const workload = pendingTasks.length;
    const missionCount = workload > 7 ? 3 : workload > 4 ? 4 : 5;

    const prompt = `You are GH — AI Game Master and Life Coach.
Generate exactly ${missionCount} personalized daily missions for this user.
User: ${p.name}, Level ${p.level || 1}, Rank: ${p.rank || "Novice"}, Streak: ${p.streakCount || 0} days
Current tasks (${pendingTasks.length}): ${pendingTasks.slice(0, 5).map((t: any) => `${t.title}(${t.priority})`).join(", ")}
Goals: ${goals.slice(0, 3).map((g: any) => g.title).join(", ") || "none"}
Habits: ${habits.slice(0, 3).map((h: any) => h.title).join(", ") || "none"}
Season: ${p.currentSeason || 1}
${fa ? "Generate missions in Persian. Be encouraging and specific." : "Generate missions in English."}

Rules:
- Never repeat what's already in current tasks
- Balance between different life areas (study, health, personal)
- XP should be 20-150 based on difficulty and priority
- Make missions specific and actionable

Return ONLY valid JSON array:
[{
  "title": "...",
  "description": "...",
  "difficulty": "easy|medium|hard",
  "priority": "low|medium|high|critical",
  "estimatedMinutes": 30,
  "xpReward": 50,
  "bonusXP": 20,
  "type": "daily|focus|health|study|fitness",
  "whySelected": "...",
  "deadline": "today"
}]`;

    const text = await groq([{ role: "user", content: prompt }], true);
    let parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    if (!Array.isArray(parsed)) parsed = parsed.missions || parsed.tasks || [];
    res.json({ missions: parsed.slice(0, missionCount) });
  } catch (e: any) {
    res.json({ missions: [], error: e.message });
  }
});

// ─── AI Daily Reflection ─────────────────────────────────────────
app.post("/api/ai/daily-reflection", async (req, res) => {
  try {
    const { state } = req.body;
    const p = state?.profile || {};
    const lang = p.language || "fa";
    const fa = lang === "fa";
    const today = new Date().toISOString().split("T")[0];
    const todayTasks = (state?.tasks || []).filter((t: any) => t.createdAt?.startsWith(today) || t.status === "done");
    const doneTasks = todayTasks.filter((t: any) => t.status === "done");
    const todayHabits = (state?.habits || []).filter((h: any) => h.history?.[today]);
    const todayTracker = (state?.trackerEntries || []).filter((e: any) => e.date === today);

    const prompt = `You are GH — Personal AI Coach. Generate a warm, supportive daily reflection.
User: ${p.name}, Level ${p.level || 1}
Today completed tasks (${doneTasks.length}/${todayTasks.length}): ${doneTasks.slice(0, 5).map((t: any) => t.title).join(", ") || "none"}
Habits checked: ${todayHabits.length}
Tracker entries: ${todayTracker.length}
XP today: ${(state?.activityLogs || []).filter((l: any) => l.date === today).reduce((a: number, b: any) => a + b.xpGained, 0)}
${fa ? "Write the reflection in warm, encouraging Persian. Like a personal coach, not a report." : "Write in English."}

Return ONLY valid JSON:
{
  "overallScore": 75,
  "productivityScore": 80,
  "healthScore": 70,
  "studyScore": 65,
  "fitnessScore": 60,
  "habitScore": 75,
  "sleepScore": 70,
  "moodEstimate": "good",
  "biggestAchievement": "...",
  "mostValuableTask": "...",
  "biggestMissedOpportunity": "...",
  "xpEarned": 150,
  "xpMissed": 80,
  "coachMessage": "...",
  "whyThisScore": "...",
  "helpfulHabits": ["..."],
  "slowingHabits": ["..."],
  "biggestImprovementTomorrow": "...",
  "tomorrowPlan": {
    "top3Priorities": ["...", "...", "..."],
    "suggestedWakeUp": "06:30",
    "suggestedBedtime": "23:00",
    "studyDuration": 90,
    "workoutDuration": 30,
    "productivityTarget": 80
  }
}`;

    const text = await groq([{ role: "user", content: prompt }], true);
    res.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── AI Weekly Review ─────────────────────────────────────────────
app.post("/api/ai/weekly-review", async (req, res) => {
  try {
    const { state } = req.body;
    const p = state?.profile || {};
    const lang = p.language || "fa";
    const fa = lang === "fa";
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekLogs = (state?.activityLogs || []).filter((l: any) => new Date(l.date) >= weekAgo);
    const weekXP = weekLogs.reduce((a: number, b: any) => a + b.xpGained, 0);
    const weekDoneTasks = (state?.tasks || []).filter((t: any) => t.status === "done").length;

    const prompt = `You are GH — AI Analyst. Generate a detailed weekly review.
User: ${p.name}, Level ${p.level || 1}
Week XP: ${weekXP}
Tasks completed this week: ${weekDoneTasks}
Streak: ${p.streakCount || 0}
${fa ? "Write in Persian. Be analytical but encouraging." : "Write in English."}

Return ONLY valid JSON:
{
  "weeklyXP": ${weekXP},
  "bestDay": "...",
  "worstDay": "...",
  "weeklyProductivity": 75,
  "weeklyHabitConsistency": 80,
  "weeklySleepQuality": 70,
  "weeklyFitnessProgress": 65,
  "weeklyStudyProgress": 70,
  "rankProgress": "...",
  "biggestImprovement": "...",
  "biggestWeakness": "...",
  "nextWeekAdvice": "...",
  "motivationalMessage": "..."
}`;

    const text = await groq([{ role: "user", content: prompt }], true);
    res.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── AI Monthly Report ────────────────────────────────────────────
app.post("/api/ai/monthly-report", async (req, res) => {
  try {
    const { state } = req.body;
    const p = state?.profile || {};
    const lang = p.language || "fa";
    const fa = lang === "fa";
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthLogs = (state?.activityLogs || []).filter((l: any) => new Date(l.date) >= monthAgo);
    const monthXP = monthLogs.reduce((a: number, b: any) => a + b.xpGained, 0);
    const completedGoals = (state?.goals || []).filter((g: any) => g.status === "completed").length;

    const prompt = `You are GH — AI Strategist. Generate a premium monthly report.
User: ${p.name}, Level ${p.level || 1}, Total XP: ${p.totalXP || p.xp || 0}
Month XP: ${monthXP}
Completed goals: ${completedGoals}
${fa ? "Write in Persian." : "Write in English."}

Return ONLY valid JSON:
{
  "overallPerformance": 75,
  "goalCompletionRate": 60,
  "xpEarned": ${monthXP},
  "xpLost": 200,
  "rankProgress": "...",
  "streakStats": "...",
  "habitStats": "...",
  "studyStats": "...",
  "fitnessStats": "...",
  "sleepStats": "...",
  "aiSummary": "...",
  "mainAchievements": ["...", "..."],
  "areasForImprovement": ["...", "..."],
  "suggestedMonthlyFocus": "...",
  "motivationalMessage": "..."
}`;

    const text = await groq([{ role: "user", content: prompt }], true);
    res.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Ideal Self Score ─────────────────────────────────────────────
app.post("/api/ai/ideal-self-score", async (req, res) => {
  try {
    const { state, period = "today" } = req.body;
    const p = state?.profile || {};
    const lang = p.language || "fa";
    const fa = lang === "fa";
    const today = new Date().toISOString().split("T")[0];
    const tasks = state?.tasks || [];
    const doneTasks = tasks.filter((t: any) => t.status === "done");
    const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

    const prompt = `You are GH. Calculate the Ideal Self Score for ${period}.
User: ${p.name}, Level ${p.level || 1}
Task completion: ${completionRate}%
Done tasks: ${doneTasks.length}/${tasks.length}
XP: ${p.xp || 0}
${fa ? "Respond in Persian." : "Respond in English."}

Return ONLY valid JSON:
{
  "completionPercent": ${completionRate},
  "xpEarned": ${p.xp || 0},
  "potentialXP": ${(p.xp || 0) + 200},
  "missedXP": 200,
  "productivityScore": ${completionRate},
  "habitCompletion": 70,
  "studyProgress": 60,
  "healthScore": 65,
  "sleepScore": 70,
  "fitnessScore": 55,
  "whatPrevented": "...",
  "smallestImpactChange": "...",
  "encouragement": "..."
}`;

    const text = await groq([{ role: "user", content: prompt }], true);
    res.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

  // ── Static / Vite ──────────────────────────────────────────────

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server:{ middlewareMode:true }, appType:"spa" });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), "dist");
    app.use(express.static(dist));
    app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`✅ GH Planner v3 → http://0.0.0.0:${PORT}`));
}

start();

