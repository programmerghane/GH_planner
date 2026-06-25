import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// ─── Supabase Client ─────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

async function supabaseRequest(method: string, path: string, body?: any) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": method === "POST" ? "return=representation" : "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error: ${err}`);
  }
  return res.json();
}

// ─── Groq AI ────────────────────────────────────────────────────
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
  if (!res.ok) throw new Error(`Groq error: ${await res.text()}`);
  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content || "";
}

function generateId() { return Math.random().toString(36).slice(2, 10); }
function hashPassword(p: string) { return Buffer.from(p).toString("base64"); }

const DEFAULT_TRACKERS = [
  { id: "sleep", name: "ردیاب خواب", emoji: "🌙", color: "#6366f1", unit: "ساعت", category: "سلامتی", inputType: "number", minVal: 0, maxVal: 24, targetVal: 8 },
  { id: "study", name: "جلسه مطالعه", emoji: "📚", color: "#10b981", unit: "ساعت", category: "آموزش", inputType: "number", minVal: 0, maxVal: 24, targetVal: 6 },
  { id: "water", name: "مصرف آب", emoji: "💧", color: "#3b82f6", unit: "لیوان", category: "سلامتی", inputType: "number", minVal: 0, maxVal: 20, targetVal: 8 },
  { id: "mood", name: "حال و روز", emoji: "😊", color: "#f59e0b", unit: "امتیاز", category: "سلامت روان", inputType: "range", minVal: 1, maxVal: 10, targetVal: 7 },
  { id: "workout", name: "تمرین ورزشی", emoji: "💪", color: "#ef4444", unit: "دقیقه", category: "تناسب اندام", inputType: "number", minVal: 0, maxVal: 300, targetVal: 45 },
];

function defaultState(userId: string, name: string, lang = "fa", extra = {}) {
  return {
    tasks: [], goals: [], habits: [],
    trackerTypes: DEFAULT_TRACKERS,
    trackerEntries: [], notes: [], journalEntries: [],
    profile: {
      id: userId, name,
      avatar: "", level: 1, xp: 0, rank: "Beginner",
      streakCount: 0, longestStreak: 0, freezeTokens: 0,
      productivityScore: 0, lifeScore: 0,
      joinedDate: new Date().toISOString(),
      language: lang, ...extra,
    },
    achievements: [], activityLogs: [], countdowns: [],
  };
}

const PORT = parseInt(process.env.PORT || "3000", 10);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  // ─── State API ───────────────────────────────────────────────
  app.get("/api/state", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(400).json({ success: false });
    try {
      const rows = await supabaseRequest("GET", `/gh_users?id=eq.${userId}&select=state`);
      if (rows?.length > 0) return res.json({ success: true, state: rows[0].state });
      res.json({ success: false, error: "Not found" });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/state", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(400).json({ success: false });
    try {
      await supabaseRequest("PATCH", `/gh_users?id=eq.${userId}`, { state: req.body.state });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── Auth APIs ───────────────────────────────────────────────
  app.post("/api/auth/guest", async (req, res) => {
    const userId = "guest_" + generateId();
    const { lang = "fa" } = req.body;
    const state = defaultState(userId, lang === "fa" ? "مهمان" : "Guest", lang, { isGuest: true });
    try {
      await supabaseRequest("POST", "/gh_users", { id: userId, state });
      res.json({ success: true, userId, profile: state.profile, state });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name, lang = "fa" } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: "Email and password required" });
    try {
      // Check if email exists
      const existing = await supabaseRequest("GET", `/gh_users?email=eq.${encodeURIComponent(email)}&select=id`);
      if (existing?.length > 0) return res.status(409).json({ success: false, error: "Email already registered" });

      const userId = "user_" + generateId();
      const state = defaultState(userId, name || email.split("@")[0], lang, { email });
      await supabaseRequest("POST", "/gh_users", {
        id: userId, email, password_hash: hashPassword(password), state,
      });
      res.json({ success: true, userId, profile: state.profile, state });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const rows = await supabaseRequest("GET", `/gh_users?email=eq.${encodeURIComponent(email)}&select=id,password_hash,state`);
      if (!rows?.length) return res.status(401).json({ success: false, error: "Invalid credentials" });
      const user = rows[0];
      if (user.password_hash !== hashPassword(password)) return res.status(401).json({ success: false, error: "Invalid credentials" });
      res.json({ success: true, userId: user.id, profile: user.state?.profile, state: user.state });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/auth/send-otp", (req, res) => {
    res.json({ success: true, message: "OTP: 1234 (demo)" });
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    const { phone, otp } = req.body;
    if (otp !== "1234") return res.status(400).json({ success: false, error: "Invalid OTP" });
    try {
      const rows = await supabaseRequest("GET", `/gh_users?phone=eq.${encodeURIComponent(phone)}&select=id,state`);
      if (rows?.length > 0) {
        return res.json({ success: true, userId: rows[0].id, profile: rows[0].state?.profile, state: rows[0].state });
      }
      const userId = "user_" + generateId();
      const state = defaultState(userId, phone, "fa", { phone });
      await supabaseRequest("POST", "/gh_users", { id: userId, phone, state });
      res.json({ success: true, userId, profile: state.profile, state });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/auth/complete-onboarding", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(400).json({ success: false });
    try {
      const rows = await supabaseRequest("GET", `/gh_users?id=eq.${userId}&select=state`);
      if (!rows?.length) return res.status(404).json({ success: false });
      const state = rows[0].state;
      state.profile = { ...state.profile, ...req.body.profileUpdates };
      await supabaseRequest("PATCH", `/gh_users?id=eq.${userId}`, { state });
      res.json({ success: true, profile: state.profile });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/auth/social-login", (req, res) => {
    res.json({ success: false, error: "Social login not available" });
  });

  app.post("/api/auth/link", (req, res) => { res.json({ success: true }); });
  app.post("/api/auth/unlink", (req, res) => { res.json({ success: true }); });
  app.post("/api/auth/toggle-2fa", (req, res) => { res.json({ success: true }); });
  app.post("/api/auth/toggle-biometrics", (req, res) => { res.json({ success: true }); });
  app.post("/api/auth/revoke-session", (req, res) => { res.json({ success: true }); });

  // ─── GH AI (Groq) ───────────────────────────────────────────
  app.post("/api/gemini/briefing", async (req, res) => {
    try {
      const state = req.body.state;
      const profile = state?.profile || {};
      const lang = profile.language || "fa";
      const langInst = lang === "fa" ? "پاسخ را به فارسی بنویس." : "Reply in English.";
      const prompt = `You are GH AI. Generate a daily briefing.
User: ${profile.name}, Level ${profile.level}
Tasks: ${JSON.stringify((state?.tasks || []).slice(0, 5).map((t: any) => t.title))}
${langInst}
Return ONLY valid JSON: {"summary":"...","mostImportantTask":"...","productivityAdvice":"...","freeTimeAdvice":"...","warning":"..."}`;
      const text = await callGroq([{ role: "user", content: prompt }], true);
      res.json(JSON.parse(text));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, chatHistory = [], state } = req.body;
      const lang = state?.profile?.language || "fa";
      const system = `You are GH — AI Life Coach. User: ${state?.profile?.name}, Level: ${state?.profile?.level}.
${lang === "fa" ? "همیشه به فارسی روان پاسخ بده." : "Reply in English."}`;
      const messages = [
        { role: "system", content: system },
        ...chatHistory.slice(-6).map((m: any) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })),
        { role: "user", content: message },
      ];
      const reply = await callGroq(messages);
      res.json({ reply });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/gemini/planner", async (req, res) => {
    try {
      const { tasks = [], userContext = "", language = "fa" } = req.body;
      const prompt = `Schedule these tasks. ${language === "fa" ? "فیلد aiSuggestion به فارسی." : ""}
Tasks: ${JSON.stringify(tasks.slice(0, 10).map((t: any) => ({ id: t.id, title: t.title, priority: t.priority })))}
Return ONLY JSON array: [{"taskId":"...","timeBlock":"Morning|Afternoon|Evening","aiScore":80,"aiSuggestion":"..."}]`;
      const text = await callGroq([{ role: "user", content: prompt }], true);
      const clean = text.replace(/```json|```/g, "").trim();
      let parsed = JSON.parse(clean);
      if (!Array.isArray(parsed)) parsed = parsed.tasks || parsed.schedule || [];
      res.json(parsed);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/gemini/notes", async (req, res) => {
    try {
      const { content, action } = req.body;
      const prompts: Record<string, string> = {
        summarize: "خلاصه این یادداشت را به فارسی بنویس:",
        flashcards: 'Create 3 flashcards. Return ONLY JSON: [{"question":"...","answer":"..."}]',
        quiz: 'Create 3 MCQ. Return ONLY JSON: [{"question":"...","options":["..."],"correctIndex":0}]',
        proofread: "ویرایش و گسترش بده:",
      };
      const result = await callGroq([{ role: "user", content: `${prompts[action] || prompts.proofread}\n\n${content}` }], action === "flashcards" || action === "quiz");
      res.json({ result });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Static Files ─────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`✅ GH Planner on http://0.0.0.0:${PORT}`));
}

startServer();
