import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// ─── Groq AI Client ───────────────────────────────────────────────
async function callGroq(messages: { role: string; content: string }[], json = false): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is missing");

  const body: any = {
    model: "llama-3.3-70b-versatile",
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  };
  if (json) body.response_format = { type: "json_object" };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content || "";
}

const DB_FILE = path.join(process.cwd(), "db.json");

const DEFAULT_TRACKERS = [
  { id: "sleep", name: "ردیاب خواب", description: "اندازه‌گیری میزان و کیفیت خواب هر شب", emoji: "🌙", color: "#6366f1", unit: "ساعت", category: "سلامتی", inputType: "number", minVal: 0, maxVal: 24, targetVal: 8 },
  { id: "study", name: "جلسه مطالعه", description: "ردیابی ساعات مطالعه عمیق و کدنویسی", emoji: "📚", color: "#10b981", unit: "ساعت", category: "آموزش", inputType: "number", minVal: 0, maxVal: 24, targetVal: 6 },
  { id: "water", name: "مصرف آب", description: "ردیابی مصرف روزانه آب بدن", emoji: "💧", color: "#3b82f6", unit: "لیوان", category: "سلامتی", inputType: "number", minVal: 0, maxVal: 20, targetVal: 8 },
  { id: "mood", name: "حال و روز", description: "ردیابی وضعیت احساسی روزانه", emoji: "😊", color: "#f59e0b", unit: "امتیاز", category: "سلامت روان", inputType: "range", minVal: 1, maxVal: 10, targetVal: 7 },
  { id: "workout", name: "تمرین ورزشی", description: "ردیابی دقایق ورزش روزانه", emoji: "💪", color: "#ef4444", unit: "دقیقه", category: "تناسب اندام", inputType: "number", minVal: 0, maxVal: 300, targetVal: 45 },
];

function readDB(): Record<string, any> {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf-8")); } catch { return {}; }
}

function writeDB(data: Record<string, any>) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function readState(userId?: string): any {
  const db = readDB();
  if (userId && db[userId]) return db[userId];
  const firstKey = Object.keys(db)[0];
  return firstKey ? db[firstKey] : null;
}

function writeState(userId: string, state: any) {
  const db = readDB();
  db[userId] = state;
  writeDB(db);
}

function generateId() { return Math.random().toString(36).slice(2, 10); }

const PORT = parseInt(process.env.PORT || "3000", 10);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  // ─── State API ───────────────────────────────────────────────────
  app.get("/api/state", (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    const state = readState(userId);
    if (state) return res.json({ success: true, state });
    res.json({ success: false, error: "No state found" });
  });

  app.post("/api/state", (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(400).json({ success: false, error: "User ID required" });
    writeState(userId, req.body.state);
    res.json({ success: true });
  });

  // ─── Auth APIs ───────────────────────────────────────────────────
  app.post("/api/auth/guest", (req, res) => {
    const userId = "guest_" + generateId();
    const { lang = "fa" } = req.body;
    const defaultState = {
      tasks: [], goals: [], habits: [],
      trackerTypes: DEFAULT_TRACKERS,
      trackerEntries: [], notes: [], journalEntries: [],
      profile: {
        id: userId, name: lang === "fa" ? "مهمان" : "Guest",
        avatar: "", level: 1, xp: 0, rank: "Beginner",
        streakCount: 0, longestStreak: 0, freezeTokens: 0,
        productivityScore: 0, lifeScore: 0,
        joinedDate: new Date().toISOString(),
        language: lang, isGuest: true,
      },
      achievements: [], activityLogs: [], countdowns: [],
    };
    writeState(userId, defaultState);
    res.json({ success: true, userId, profile: defaultState.profile, state: defaultState });
  });

  app.post("/api/auth/register", (req, res) => {
    const db = readDB();
    const { email, password, name, lang = "fa" } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: "Email and password required" });

    const exists = Object.values(db).find((u: any) => u.profile?.email === email);
    if (exists) return res.status(409).json({ success: false, error: "Email already registered" });

    const userId = "user_" + generateId();
    const defaultState = {
      tasks: [], goals: [], habits: [],
      trackerTypes: DEFAULT_TRACKERS,
      trackerEntries: [], notes: [], journalEntries: [],
      profile: {
        id: userId, name: name || email.split("@")[0],
        email, password,
        avatar: "", level: 1, xp: 0, rank: "Beginner",
        streakCount: 0, longestStreak: 0, freezeTokens: 0,
        productivityScore: 0, lifeScore: 0,
        joinedDate: new Date().toISOString(),
        language: lang, isGuest: false,
      },
      achievements: [], activityLogs: [], countdowns: [],
    };
    writeState(userId, defaultState);
    res.json({ success: true, userId, profile: defaultState.profile, state: defaultState });
  });

  app.post("/api/auth/login", (req, res) => {
    const db = readDB();
    const { email, password } = req.body;
    const entry = Object.entries(db).find(([, u]: any) => u.profile?.email === email && u.profile?.password === password);
    if (!entry) return res.status(401).json({ success: false, error: "Invalid credentials" });
    const [userId, state] = entry;
    res.json({ success: true, userId, profile: (state as any).profile, state });
  });

  app.post("/api/auth/send-otp", (req, res) => {
    res.json({ success: true, message: "OTP sent (demo mode)" });
  });

  app.post("/api/auth/verify-otp", (req, res) => {
    const { phone, otp } = req.body;
    if (otp !== "1234") return res.status(400).json({ success: false, error: "Invalid OTP" });
    const db = readDB();
    const entry = Object.entries(db).find(([, u]: any) => u.profile?.phone === phone);
    if (entry) {
      const [userId, state] = entry;
      return res.json({ success: true, userId, profile: (state as any).profile, state });
    }
    const userId = "user_" + generateId();
    const defaultState = {
      tasks: [], goals: [], habits: [],
      trackerTypes: DEFAULT_TRACKERS,
      trackerEntries: [], notes: [], journalEntries: [],
      profile: {
        id: userId, name: phone, phone,
        avatar: "", level: 1, xp: 0, rank: "Beginner",
        streakCount: 0, longestStreak: 0, freezeTokens: 0,
        productivityScore: 0, lifeScore: 0,
        joinedDate: new Date().toISOString(), language: "fa",
      },
      achievements: [], activityLogs: [], countdowns: [],
    };
    writeState(userId, defaultState);
    res.json({ success: true, userId, profile: defaultState.profile, state: defaultState });
  });

  app.post("/api/auth/complete-onboarding", (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(400).json({ success: false });
    const state = readState(userId);
    if (!state) return res.status(404).json({ success: false });
    const { profileUpdates } = req.body;
    state.profile = { ...state.profile, ...profileUpdates };
    writeState(userId, state);
    res.json({ success: true, profile: state.profile });
  });

  app.post("/api/auth/social-login", (req, res) => {
    res.json({ success: false, error: "Social login not available in this deployment" });
  });

  app.post("/api/auth/link", (req, res) => { res.json({ success: true }); });
  app.post("/api/auth/unlink", (req, res) => { res.json({ success: true }); });
  app.post("/api/auth/toggle-2fa", (req, res) => { res.json({ success: true }); });
  app.post("/api/auth/toggle-biometrics", (req, res) => { res.json({ success: true }); });
  app.post("/api/auth/revoke-session", (req, res) => { res.json({ success: true }); });

  // ─── GH AI APIs (Groq powered) ───────────────────────────────────
  app.post("/api/gemini/briefing", async (req, res) => {
    try {
      const state = req.body.state || readState();
      const profile = state?.profile || {};
      const pendingTasks = state?.tasks?.filter((t: any) => t.status !== "done") || [];
      const goals = state?.goals || [];
      const lang = profile.language || "fa";
      const langInstruction = lang === "fa"
        ? "تمام متن‌های JSON را فقط به فارسی بنویس. لحن گرم، حرفه‌ای و انگیزه‌بخش داشته باش."
        : "Write all JSON text values in English.";

      const prompt = `You are GH — the AI core of a Life Operating System called GH Planner.
Generate a daily briefing for the user.
User: ${profile.name}, Level ${profile.level}, XP: ${profile.xp}
Pending tasks: ${JSON.stringify(pendingTasks.slice(0, 5).map((t: any) => ({ title: t.title, priority: t.priority })))}
Goals: ${JSON.stringify(goals.slice(0, 3).map((g: any) => ({ title: g.title, progress: g.progress })))}
${langInstruction}
Return ONLY valid JSON: {"summary":"...","mostImportantTask":"...","productivityAdvice":"...","freeTimeAdvice":"...","warning":"..."}`;

      const text = await callGroq([{ role: "user", content: prompt }], true);
      res.json(JSON.parse(text));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, chatHistory = [], state } = req.body;
      const appState = state || readState();
      const lang = appState?.profile?.language || "fa";
      const langInstruction = lang === "fa"
        ? "مهم: همیشه به فارسی روان و گرم پاسخ بده. مثل یک مربی الیت باش."
        : "Reply in English as an elite performance coach.";

      const systemMsg = `You are GH — AI Digital Twin and Life Coach in GH Planner.
User: ${appState?.profile?.name}, Level ${appState?.profile?.level}
Tasks: ${JSON.stringify(appState?.tasks?.slice(0, 5).map((t: any) => t.title))}
Goals: ${JSON.stringify(appState?.goals?.slice(0, 3).map((g: any) => g.title))}
${langInstruction}`;

      const messages = [
        { role: "system", content: systemMsg },
        ...chatHistory.slice(-6).map((m: any) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })),
        { role: "user", content: message },
      ];

      const reply = await callGroq(messages);
      res.json({ reply });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/gemini/planner", async (req, res) => {
    try {
      const { tasks = [], userContext = "", language = "fa" } = req.body;
      const langInstruction = language === "fa"
        ? "فیلد aiSuggestion را به فارسی بنویس."
        : "Write aiSuggestion in English.";

      const prompt = `You are GH Smart Planner. Schedule these tasks optimally.
Tasks: ${JSON.stringify(tasks.map((t: any) => ({ id: t.id, title: t.title, priority: t.priority, energy: t.energy, estimatedTime: t.estimatedTime })))}
User request: "${userContext}"
${langInstruction}
Return ONLY valid JSON array: [{"taskId":"...","timeBlock":"Morning|Afternoon|Evening|Night","aiScore":85,"aiSuggestion":"..."}]`;

      const text = await callGroq([{ role: "user", content: prompt }], true);
      const clean = text.replace(/```json|```/g, "").trim();
      // Handle both array and object with array
      let parsed = JSON.parse(clean);
      if (!Array.isArray(parsed)) parsed = parsed.tasks || parsed.schedule || [];
      res.json(parsed);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/gemini/notes", async (req, res) => {
    try {
      const { content, action } = req.body;
      const prompts: Record<string, string> = {
        summarize: "خلاصه این یادداشت را به صورت bullet points مفید و ساختاریافته به فارسی بنویس:",
        flashcards: 'Create 3 study flashcards. Return ONLY JSON array: [{"question":"...","answer":"..."}]',
        quiz: 'Create 3 MCQ questions. Return ONLY JSON array: [{"question":"...","options":["..."],"correctIndex":0}]',
        proofread: "این متن را ویرایش، اصلاح و گسترش بده:",
      };
      const systemPrompt = prompts[action] || prompts.proofread;
      const result = await callGroq([{ role: "user", content: `${systemPrompt}\n\n${content}` }], action === "flashcards" || action === "quiz");
      res.json({ result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Static Files (Production) ────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ GH Planner server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
