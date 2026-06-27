import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Mail,
  Lock,
  Phone,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Globe,
  Palette,
  Target,
  Clock,
  Bell,
  Fingerprint,
  Shield,
  Smartphone,
  Eye,
  EyeOff,
  User,
  RotateCw,
  AlertCircle,
  KeyRound,
  Link2,
} from "lucide-react";
import { AppState, UserProfile } from "../types";
import { PREMIUM_THEMES, Theme } from "../lib/themes";
import { toPersianDigits } from "../lib/i18n";

interface AuthSystemProps {
  onLoginSuccess: (userProfile: UserProfile, fullState?: any) => void;
  lang: "fa" | "en";
  setLang: (lang: "fa" | "en") => void;
}

const COUNTRIES = [
  { code: "+98", name: "ایران", flag: "🇮🇷" },
  { code: "+1", name: "USA / Canada", flag: "🇺🇸" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
];

const AI_PERSONALITIES = [
  { id: "elite_coach", nameFa: "مربی عملکرد الیت (سرسخت و نتیجه‌گرا)", nameEn: "Elite High-Performance Coach (Rigorous)", descFa: "تمرکز بر نظم آهنین، افزایش بازدهی و شکستن رکوردهای فردی.", descEn: "Focus on iron discipline, productivity maxing, and breaking records." },
  { id: "zen_guide", nameFa: "راهنمای ذهن‌آگاهی ذن (آرامش‌بخش)", nameEn: "Zen Mindfulness Guide (Calming)", descFa: "تمرکز بر تعادل کار و زندگی، کاهش استرس و سلامت روانی.", descEn: "Focus on work-life harmony, stress reduction, and emotional wellness." },
  { id: "analytical_twin", nameFa: "دوقلوی تحلیل‌گر عینی (داده‌محور)", nameEn: "Objective Data Twin (Analytical)", descFa: "تمرکز بر آمار، پیش‌بینی‌های ریاضی و شبیه‌سازی‌های رفتاری.", descEn: "Focus on charts, mathematical predictions, and behavioral simulation." },
];

const GOAL_OPTIONS = [
  { id: "g1", labelFa: "توسعه عمیق فردی و انضباط شخصی", labelEn: "Deep Personal Development & Discipline" },
  { id: "g2", labelFa: "ورزش منظم و تناسب اندام روزانه", labelEn: "Consistent Fitness & Daily Workouts" },
  { id: "g3", labelFa: "مدیریت خواب عالی و هیدراتاسیون بدن", labelEn: "Perfect Sleep Management & Hydration" },
  { id: "g4", labelFa: "مطالعه و پژوهش مداوم علمی", labelEn: "Continuous Academic Study & Research" },
  { id: "g5", labelFa: "ثبت روزانه احساسات و ذهن‌آگاهی", labelEn: "Mindful Journaling & Emotional Tracking" },
];

const INTEREST_OPTIONS = [
  { id: "tech", labelFa: "فناوری و کدنویسی", labelEn: "Technology & Code" },
  { id: "health", labelFa: "سلامتی و تغذیه", labelEn: "Health & Nutrition" },
  { id: "psychology", labelFa: "روانشناسی و بیولوژی", labelEn: "Psychology & Biology" },
  { id: "art", labelFa: "هنر و ادبیات", labelEn: "Art & Literature" },
  { id: "business", labelFa: "کسب‌وکار و کارآفرینی", labelEn: "Business & Career" },
];

export default function AuthSystem({ onLoginSuccess, lang, setLang }: AuthSystemProps) {
  const isRTL = lang === "fa";

  // Auth States
  const [mode, setMode] = useState<"welcome" | "email" | "phone" | "otp" | "onboarding">("welcome");
  const [authAction, setAuthAction] = useState<"login" | "register">("login");
  
  // Form values
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+98");
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(60);
  const [resendEnabled, setResendEnabled] = useState(false);

  // Link status tracking
  const [linkedAccounts, setLinkedAccounts] = useState({
    google: false,
    email: false,
    phone: false,
  });

  // Onboarding States
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(PREMIUM_THEMES[0]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedPersonality, setSelectedPersonality] = useState("elite_coach");
  const [wakeUpTime, setWakeUpTime] = useState("06:30");
  const [bedTime, setBedTime] = useState("23:00");
  const [notifications, setNotifications] = useState(true);
  const [usePersianNums, setUsePersianNums] = useState(true);
  const [userName, setUserName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);

  // OTP resend timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === "otp" && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setResendEnabled(true);
    }
    return () => clearInterval(interval);
  }, [mode, otpTimer]);

  const triggerNotification = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 5000);
  };

  // Google One-tap/OAuth Simulator
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // Fetch simulated OAuth popup URL or open simulated popup
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        "",
        "google_oauth",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (popup) {
        popup.document.write(`
          <html>
            <head>
              <title>Sign in with Google</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
              <style>body { font-family: 'Inter', sans-serif; }</style>
            </head>
            <body class="bg-slate-950 text-slate-200 flex flex-col items-center justify-center min-h-screen p-6 text-center select-none">
              <div class="w-12 h-12 mb-4 flex items-center justify-center bg-white rounded-full shadow-lg">
                <svg class="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <h2 class="text-lg font-semibold mb-1">Google Core Account Sync</h2>
              <p class="text-xs text-slate-400 mb-6 max-w-xs">AI Studio wishes to synchronize with your Google Identity Services securely.</p>
              
              <div class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3 mb-4 cursor-pointer hover:bg-slate-850 transition-colors" id="btn-user">
                <div class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white uppercase text-sm">
                  ${"mhmdrdaqan8".substring(0, 2)}
                </div>
                <div class="text-left flex-1">
                  <p class="text-sm font-semibold text-white">Commander Mohammad</p>
                  <p class="text-xs text-slate-400">mhmdrdaqan8@gmail.com</p>
                </div>
                <span class="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Active</span>
              </div>

              <p class="text-[10px] text-slate-500 max-w-xs leading-normal">By logging in, Google will share your profile name, picture, and email address safely with GH Life OS.</p>
              
              <script>
                document.getElementById('btn-user').addEventListener('click', () => {
                  window.opener.postMessage({
                    type: 'OAUTH_AUTH_SUCCESS',
                    payload: {
                      name: "محمد",
                      email: "mhmdrdaqan8@gmail.com",
                      avatar: ""
                    }
                  }, '*');
                  window.close();
                });
              </script>
            </body>
          </html>
        `);
      }

      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
          const userPayload = event.data.payload;
          setUserName(userPayload.name);
          setLinkedAccounts((prev) => ({ ...prev, google: true }));

          // Let's call the server login integration API
          const response = await fetch("/api/auth/social-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: "google",
              email: userPayload.email,
              name: userPayload.name,
              avatar: userPayload.avatar,
            }),
          });

          const resData = await response.json();
          if (resData.success) {
            setTempProfile(resData.profile);
            setLinkedAccounts(resData.profile.linkedAccounts || { google: true, email: false, phone: false });
            
            if (resData.profile.onboardingCompleted) {
              onLoginSuccess(resData.profile, resData.state);
            } else {
              setMode("onboarding");
              setOnboardingStep(1);
            }
          }
          setLoading(false);
          window.removeEventListener("message", handleMessage);
        }
      };
      window.addEventListener("message", handleMessage);
    } catch (err) {
      triggerNotification(isRTL ? "اتصال به حساب گوگل با خطا مواجه شد." : "Google Sync authentication failed.");
      setLoading(false);
    }
  };

  // Email Sign-In / Register Handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      triggerNotification(isRTL ? "لطفاً تمامی فیلدها را پر کنید." : "Please fill in all the required fields.");
      return;
    }
    if (password.length < 6) {
      triggerNotification(isRTL ? "کلمه عبور باید حداقل ۶ کاراکتر باشد." : "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch(`/api/auth/${authAction}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Save userId to localStorage for later use
        if (data.userId) localStorage.setItem("gh_planner_user_id", data.userId);
        setTempProfile({ ...data.profile, id: data.userId || data.profile?.id });
        setLinkedAccounts(data.profile.linkedAccounts || { google: false, email: true, phone: false });

        if (authAction === "register") {
          // Guide them through onboarding
          setMode("onboarding");
          setOnboardingStep(1);
        } else {
          // If onboarding is completed, proceed to App, else Onboarding
          if (data.profile.onboardingCompleted) {
            onLoginSuccess(data.profile, data.state);
          } else {
            setMode("onboarding");
            setOnboardingStep(1);
          }
        }
      } else {
        triggerNotification(data.error || (isRTL ? "نام کاربری یا رمز عبور اشتباه است." : "Invalid credential inputs."));
      }
    } catch (err) {
      triggerNotification(isRTL ? "خطایی رخ داد. مجددا تلاش کنید." : "Connection failed. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  // Mobile OTP Send Handler
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      triggerNotification(isRTL ? "شماره تلفن را وارد کنید." : "Phone number is required.");
      return;
    }

    setLoading(true);
    try {
      const fullPhone = countryCode + phone.replace(/^0+/, "");
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await response.json();
      if (data.success) {
        setMode("otp");
        setOtpTimer(60);
        setResendEnabled(false);
        // Display automatic code simulator for supreme speed
        setTimeout(() => {
          setOtpCode("129853");
          triggerNotification(isRTL ? "کد تایید پیامکی شبیه‌سازی و خودکار پر شد: ۱۲۹۸۵۳" : "Simulated SMS verification code received and autofilled: 129853");
        }, 1500);
      } else {
        triggerNotification(data.error || "Failed to send OTP code.");
      }
    } catch (err) {
      triggerNotification(isRTL ? "خطا در برقراری ارتباط." : "Failed to establish SMS gateway link.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;

    setLoading(true);
    try {
      const fullPhone = countryCode + phone.replace(/^0+/, "");
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, code: otpCode }),
      });

      const data = await response.json();
      if (data.success) {
        setTempProfile(data.profile);
        setLinkedAccounts(data.profile.linkedAccounts || { google: false, email: false, phone: true });

        if (data.profile.onboardingCompleted) {
          onLoginSuccess(data.profile, data.state);
        } else {
          setMode("onboarding");
          setOnboardingStep(1);
        }
      } else {
        triggerNotification(isRTL ? "کد تایید اشتباه است." : "Invalid SMS token.");
      }
    } catch (err) {
      triggerNotification("OTP link verify failed.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!resendEnabled) return;
    setOtpTimer(60);
    setResendEnabled(false);
    const fullPhone = countryCode + phone.replace(/^0+/, "");
    await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: fullPhone }),
    });
    setTimeout(() => {
      setOtpCode("129853");
    }, 1000);
  };

  // Bypass via Guest Mode
  const handleGuestSignIn = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.success) {
        setTempProfile(data.profile);
        setMode("onboarding");
        setOnboardingStep(1);
      }
    } catch (err) {
      triggerNotification("Failed to configure guest local state.");
    } finally {
      setLoading(false);
    }
  };

  // Onboarding complete triggers profile initialization on database
  const handleOnboardingComplete = async () => {
    setLoading(true);
    try {
      const finalProfile: UserProfile = {
        ...(tempProfile || {
          name: "فرمانده",
          avatar: "",
          level: 1,
          xp: 0,
          rank: "Beginner",
          streakCount: 0,
          longestStreak: 0,
          freezeTokens: 0,
          productivityScore: 0,
          lifeScore: 0,
          joinedDate: new Date().toISOString(),
        }),
        name: userName.trim() || tempProfile?.name || (isRTL ? "فرمانده" : "Commander"),
        themeId: selectedTheme.id,
        language: lang,
        usePersianNumerals: usePersianNums,
      };

      const response = await fetch("/api/auth/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: tempProfile?.id || localStorage.getItem("gh_planner_user_id") || "",
          profile: finalProfile,
          preferences: {
            selectedGoals,
            interests: selectedInterests,
            aiPersonality: selectedPersonality,
            wakeUpTime,
            bedTime,
            notificationsEnabled: notifications,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem("gh_planner_user_id", data.profile?.id || tempProfile?.id || "");
        onLoginSuccess(data.profile || finalProfile, data.state);
      } else {
        // Fallback: login without server if API fails
        onLoginSuccess(finalProfile);
      }
    } catch (err) {
      // Fallback: proceed anyway
      onLoginSuccess(finalProfile);
    } finally {
      setLoading(false);
    }
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* Dynamic Background glowing meshes */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl animate-pulse-glow"></div>
      </div>

      {/* Floating Language Switcher in Login Screen */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setLang(lang === "fa" ? "en" : "fa")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <Globe className="w-4 h-4 text-indigo-400 animate-spin-slow" />
          <span>{lang === "fa" ? "English" : "فارسی"}</span>
        </button>
      </div>

      {/* Main Glassmorphic Panel Card */}
      <div className="w-full max-w-xl z-10 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/80 shadow-2xl p-6 sm:p-8 relative">
        
        {/* Error Notification Toast */}
        {errorMsg && (
          <div className="absolute top-4 left-6 right-6 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2 animate-in slide-in-from-top-4 duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="flex-1">{errorMsg}</p>
          </div>
        )}

        {/* LOGO & HERO HEADING */}
        {mode !== "onboarding" && (
          <div className="text-center mb-8 pt-4">
            <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h1 className="text-2xl font-display font-extrabold text-white tracking-tight">
              {isRTL ? "سیستم‌عامل توسعه فردی لایف‌اواس" : "GH Planner Life OS"}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {isRTL
                ? "هسته‌ای هوشمند برای مهندسی نظم شخصی، بهره‌وری دانشگاهی و آرامش زیستی."
                : "The ultimate hyper-performance workspace to master habits, goals, and deep study."}
            </p>
          </div>
        )}

        {/* ================= MODE: WELCOME GATES ================= */}
        {mode === "welcome" && (
          <div className="space-y-4">
            {/* Google Identity Method */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-semibold py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-lg shadow-white/5 active:scale-98"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{isRTL ? "ورود با حساب کاربری گوگل" : "Continue with Google"}</span>
            </button>

            {/* Email Method Gate */}
            <button
              onClick={() => {
                setAuthAction("login");
                setMode("email");
              }}
              className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-850 text-slate-100 font-semibold py-3 px-4 rounded-xl border border-slate-800 transition-all cursor-pointer hover:border-slate-700 active:scale-98"
            >
              <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>{isRTL ? "ادامه با پست الکترونیکی (ایمیل)" : "Continue with Email Address"}</span>
            </button>

            {/* Mobile Gate */}
            <button
              onClick={() => setMode("phone")}
              className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-850 text-slate-100 font-semibold py-3 px-4 rounded-xl border border-slate-800 transition-all cursor-pointer hover:border-slate-700 active:scale-98"
            >
              <Phone className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{isRTL ? "ورود هوشمند پیامکی (شماره موبایل)" : "Continue with Mobile SMS OTP"}</span>
            </button>

            {/* Divider lines */}
            <div className="relative py-3 flex items-center justify-center">
              <div className="absolute inset-x-0 h-px bg-slate-800"></div>
              <span className="relative px-3 text-[10px] uppercase font-mono text-slate-500 bg-slate-950 rounded-full tracking-widest">
                {isRTL ? "یا ورود مهمان" : "or limited offline login"}
              </span>
            </div>

            {/* Guest button */}
            <button
              onClick={handleGuestSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all cursor-pointer py-1.5"
            >
              <span>{isRTL ? "شروع به کار سریع (بدون نیاز به ثبت نام)" : "Continue in Guest Mode (Offline)"}</span>
              {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* ================= MODE: EMAIL SIGN IN / REGISTER ================= */}
        {mode === "email" && (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="flex justify-between items-center pb-2">
              <button
                type="button"
                onClick={() => setMode("welcome")}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              </button>
              <span className="text-xs font-bold uppercase text-indigo-400 tracking-widest">
                {authAction === "login"
                  ? (isRTL ? "ورود به حساب کاربری" : "Sign In Portal")
                  : (isRTL ? "ایجاد حساب کاربری جدید" : "Register Credentials")}
              </span>
            </div>

            {/* Input Email */}
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-semibold text-slate-400 block">{isRTL ? "پست الکترونیکی (ایمیل)" : "Email address"}</label>
              <div className="relative">
                <Mail className="absolute top-3.5 right-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-3 px-10 text-right text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-semibold text-slate-400 block">{isRTL ? "کلمه عبور" : "Password"}</label>
              <div className="relative">
                <Lock className="absolute top-3.5 right-3.5 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-3 px-10 text-right text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Auth Form Actions */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/15 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              {loading ? (
                <RotateCw className="w-5 h-5 animate-spin" />
              ) : (
                <span>
                  {authAction === "login"
                    ? (isRTL ? "ورود امن به سیستم" : "Sign In securely")
                    : (isRTL ? "ثبت نهایی و ادامه" : "Register and continue")}
                </span>
              )}
            </button>

            {/* Forgot password link & register switcher */}
            <div className="flex justify-between items-center pt-2 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setAuthAction(authAction === "login" ? "register" : "login");
                }}
                className="text-indigo-400 hover:underline cursor-pointer"
              >
                {authAction === "login"
                  ? (isRTL ? "ایجاد حساب جدید؟" : "Create standard account?")
                  : (isRTL ? "ورود با رمز عبور موجود؟" : "Already have password?")}
              </button>

              {authAction === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    if (!email) {
                      triggerNotification(isRTL ? "لطفاً برای بازیابی رمز، ایمیل خود را ابتدا وارد کنید." : "Fill in your email to send password reset code.");
                      return;
                    }
                    triggerNotification(isRTL ? `ایمیل بازیابی رمز عبور شبیه‌سازی و به ${email} ارسال شد.` : `Simulated reset password link dispatched to ${email}`);
                  }}
                  className="text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {isRTL ? "فراموشی رمز عبور؟" : "Forgot Password?"}
                </button>
              )}
            </div>
          </form>
        )}

        {/* ================= MODE: PHONE SMS SIGN IN ================= */}
        {mode === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="flex justify-between items-center pb-2">
              <button
                type="button"
                onClick={() => setMode("welcome")}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              </button>
              <span className="text-xs font-bold uppercase text-emerald-400 tracking-widest">
                {isRTL ? "پیامک تایید هویت" : "Mobile SMS OTP Portal"}
              </span>
            </div>

            {/* Country Selector + Phone input in grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-1 space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block">{isRTL ? "کد کشور" : "Code"}</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-400 block">{isRTL ? "شماره تلفن همراه" : "Mobile phone"}</label>
                <input
                  type="tel"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-right text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="9123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Send OTP Actions */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-600/15 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              {loading ? (
                <RotateCw className="w-5 h-5 animate-spin" />
              ) : (
                <span>{isRTL ? "ارسال کد تایید پیامکی" : "Dispatch Verification SMS"}</span>
              )}
            </button>
          </form>
        )}

        {/* ================= MODE: ENTER VERIFICATION OTP ================= */}
        {mode === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="flex justify-between items-center pb-2">
              <button
                type="button"
                onClick={() => setMode("phone")}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              </button>
              <span className="text-xs font-bold uppercase text-emerald-400 tracking-widest">
                {isRTL ? "کد تایید را وارد کنید" : "Insert Verification Token"}
              </span>
            </div>

            <p className="text-xs text-slate-400 text-center">
              {isRTL
                ? `کد یکبار مصرف به شماره ${countryCode} ${phone} ارسال گردید.`
                : `Enter the 6-digit OTP code sent to ${countryCode} ${phone}`}
            </p>

            {/* Input code field */}
            <div className="space-y-1.5 text-center">
              <input
                type="text"
                maxLength={6}
                className="w-40 mx-auto tracking-[0.75em] bg-slate-950 border border-slate-800/80 rounded-xl py-3 px-4 text-center text-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
              />
            </div>

            {/* Confirm OTP Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-600/15 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              {loading ? (
                <RotateCw className="w-5 h-5 animate-spin" />
              ) : (
                <span>{isRTL ? "تایید نهایی شماره موبایل" : "Authorize and Login"}</span>
              )}
            </button>

            {/* Timer or resend triggers */}
            <div className="text-center pt-2">
              {resendEnabled ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer"
                >
                  {isRTL ? "ارسال مجدد پیامک کد تایید" : "Resend code"}
                </button>
              ) : (
                <span className="text-xs text-slate-500 font-mono">
                  {isRTL
                    ? `امکان ارسال مجدد پس از: ${toPersianDigits(otpTimer, usePersianNums)} ثانیه`
                    : `Resend SMS OTP buffer: ${otpTimer}s`}
                </span>
              )}
            </div>
          </form>
        )}

        {/* ================= MODE: FIRST TIME ONBOARDING WIZARD ================= */}
        {mode === "onboarding" && (
          <div className="space-y-6">
            
            {/* Header progress tracker */}
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
              <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest font-mono">
                {isRTL ? `مرحله ${toPersianDigits(onboardingStep, usePersianNums)} از ${toPersianDigits(6, usePersianNums)}` : `Step ${onboardingStep} of 6`}
              </span>
              <h2 className="text-base font-bold text-white">
                {isRTL ? "پیکربندی اولیه هسته لایف‌اواس" : "Ecosystem Initialization"}
              </h2>
            </div>

            {/* ONBOARDING STEP 1: GREETINGS & NAME & REGIONAL */}
            {onboardingStep === 1 && (
              <div className="space-y-4 text-right">
                <div className="text-center pb-2">
                  <User className="w-10 h-10 mx-auto text-indigo-400 animate-bounce mb-2" />
                  <h3 className="text-sm font-bold text-slate-200">{isRTL ? "شناسایی فرمانده کل سیستم" : "State your Identity Name"}</h3>
                  <p className="text-[11px] text-slate-400 leading-normal mt-1">{isRTL ? "نام یا عنوان مورد نظر خود را برای سفارشی‌سازی دستیار بنویسید." : "Customize how the AI Digital Twin should address you."}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">{isRTL ? "نام و نام خانوادگی / عنوان" : "Name / Title"}</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-right text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder={isRTL ? "مثال: مهران راد" : "Commander Mohammad"}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-slate-400 block">{isRTL ? "ترجیحات محلی و اعداد" : "Locale & Numerals"}</label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <input
                      type="checkbox"
                      checked={usePersianNums}
                      onChange={(e) => setUsePersianNums(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-800 cursor-pointer"
                    />
                    <span>{isRTL ? "نمایش اعداد با فرمت زیبای فارسی (۰۱۲۳)" : "Display Persian formatted numerals"}</span>
                  </label>
                </div>
              </div>
            )}

            {/* ONBOARDING STEP 2: THEME CATALOG CHOOSE */}
            {onboardingStep === 2 && (
              <div className="space-y-4 text-right">
                <div className="text-center pb-2">
                  <Palette className="w-10 h-10 mx-auto text-indigo-400 mb-2" />
                  <h3 className="text-sm font-bold text-slate-200">{isRTL ? "انتخاب پوسته و اتمسفر بصری" : "Aesthetic Workspace Atmosphere"}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">{isRTL ? "پوسته‌ای را انتخاب کنید که به شما انگیزه مطالعه عمیق بدهد." : "Toggle workspace themes. Instantly modifies colors in real-time."}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {PREMIUM_THEMES.map((theme) => {
                    const isSelected = selectedTheme.id === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme)}
                        className={`p-3 rounded-xl border text-right flex flex-col justify-between h-24 relative overflow-hidden transition-all duration-150 cursor-pointer ${
                          isSelected ? "border-indigo-500 bg-slate-800/80" : "border-slate-850 bg-slate-950/40 hover:bg-slate-900/40"
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-200">{theme.name}</span>
                        <div className="flex gap-2 items-center mt-3 z-10">
                          <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ backgroundColor: theme.primary }}></span>
                          <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ backgroundColor: theme.accent }}></span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ONBOARDING STEP 3: FOCUS GOALS CHOOSE */}
            {onboardingStep === 3 && (
              <div className="space-y-4 text-right">
                <div className="text-center pb-2">
                  <Target className="w-10 h-10 mx-auto text-indigo-400 mb-2" />
                  <h3 className="text-sm font-bold text-slate-200">{isRTL ? "اهداف میان‌مدت و اهرم‌های رشد" : "Select Growth Target Areas"}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">{isRTL ? "چه اهدافی را می‌خواهید با این سیستم مدیریت زیستی دنبال کنید؟" : "Select targets that align with your growth objectives."}</p>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {GOAL_OPTIONS.map((goal) => {
                    const isSelected = selectedGoals.includes(goal.id);
                    return (
                      <button
                        key={goal.id}
                        onClick={() => toggleGoal(goal.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-right text-xs transition-all cursor-pointer ${
                          isSelected ? "border-indigo-500 bg-indigo-500/10 text-slate-100" : "border-slate-850 bg-slate-950/40 text-slate-400"
                        }`}
                      >
                        <div className="w-4.5 h-4.5 rounded-md border border-slate-800 flex items-center justify-center bg-slate-950">
                          {isSelected && <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <span>{isRTL ? goal.labelFa : goal.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ONBOARDING STEP 4: INTERESTS & AI COACH */}
            {onboardingStep === 4 && (
              <div className="space-y-4 text-right">
                <div className="text-center pb-2">
                  <Sparkles className="w-10 h-10 mx-auto text-indigo-400 mb-2" />
                  <h3 className="text-sm font-bold text-slate-200">{isRTL ? "علایق و الگوریتم دوقلوی هوشمند" : "Intellectual Fields & Coach"}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">{isRTL ? "مربی هوشمند و حوزه‌های پژوهشی دلخواه خود را تعیین کنید." : "Select your interest topics and choose an AI Mentor persona."}</p>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {/* Interests selectors */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">{isRTL ? "علایق تحصیلی و پژوهشی" : "Core Interests"}</span>
                    <div className="flex flex-wrap gap-2">
                      {INTEREST_OPTIONS.map((interest) => {
                        const isSelected = selectedInterests.includes(interest.id);
                        return (
                          <button
                            key={interest.id}
                            onClick={() => toggleInterest(interest.id)}
                            className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all ${
                              isSelected ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-slate-850 bg-slate-950/40 text-slate-400"
                            }`}
                          >
                            {isRTL ? interest.labelFa : interest.labelEn}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Personality select */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">{isRTL ? "شخصیت و لحن گفتاری دستیار AI" : "AI Twin Personality Voice"}</span>
                    <div className="space-y-2">
                      {AI_PERSONALITIES.map((pers) => {
                        const isSelected = selectedPersonality === pers.id;
                        return (
                          <button
                            key={pers.id}
                            onClick={() => setSelectedPersonality(pers.id)}
                            className={`w-full p-2.5 rounded-xl border text-right text-xs transition-all cursor-pointer ${
                              isSelected ? "border-indigo-500 bg-indigo-500/5" : "border-slate-850 bg-slate-950/20"
                            }`}
                          >
                            <p className="font-bold text-slate-200">{isRTL ? pers.nameFa : pers.nameEn}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{isRTL ? pers.descFa : pers.descEn}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ONBOARDING STEP 5: BIOMETRICS & SCHEDULING TIME */}
            {onboardingStep === 5 && (
              <div className="space-y-4 text-right">
                <div className="text-center pb-2">
                  <Clock className="w-10 h-10 mx-auto text-indigo-400 mb-2" />
                  <h3 className="text-sm font-bold text-slate-200">{isRTL ? "بایوریتم و ریتم شبانه‌روزی" : "Circadian Rhythms & Timing"}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">{isRTL ? "تنظیم چرخه‌های طلایی خواب و بیداری برای بهینه‌سازی تحلیل‌ها." : "Establish sleep/wake schedules to align biology indicators."}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 block">{isRTL ? "زمان بیدارباش پیشنهادی" : "Wake-up target"}</label>
                    <input
                      type="time"
                      value={wakeUpTime}
                      onChange={(e) => setWakeUpTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-center text-xs text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 block">{isRTL ? "زمان خواب ایده‌آل" : "Bedtime target"}</label>
                    <input
                      type="time"
                      value={bedTime}
                      onChange={(e) => setBedTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-center text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-800 cursor-pointer"
                    />
                    <span>{isRTL ? "ارسال هشدارهای روزانه سلامتی و عادات" : "Enable notification push reminders"}</span>
                  </label>
                </div>
              </div>
            )}

            {/* ONBOARDING STEP 6: CELEBRATION */}
            {onboardingStep === 6 && (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-pulse">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">{isRTL ? "سیستم‌عامل آماده راه‌اندازی است!" : "System Initialized Successfully"}</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {isRTL
                    ? `تبریک ${userName || "فرمانده"}! هسته سیستم‌عامل با موفقیت تنظیم و هماهنگ شد. پکیج‌های ردیاب‌های روزانه خواب، ورزش، مطالعه و خلق‌وخوی شما با الگوریتم‌های هوش مصنوعی فعال شدند.`
                    : `Welcome, Commander ${userName || ""}! Your personal biological dashboard is fully compiled with sleep, sports, and cognitive trackers. Press below to launch.`}
                </p>

                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-right space-y-1.5 text-xs font-mono">
                  <p className="text-slate-400 flex justify-between">
                    <span>{isRTL ? "پوسته پیش‌فرض" : "Theme template"}</span>
                    <span className="text-white font-bold">{selectedTheme.name}</span>
                  </p>
                  <p className="text-slate-400 flex justify-between">
                    <span>{isRTL ? "مربی هوشمند" : "AI Mentor voice"}</span>
                    <span className="text-white font-bold">
                      {selectedPersonality === "elite_coach" ? (isRTL ? "مربی الیت" : "Elite Coach") : (isRTL ? "ذن مربی" : "Zen Mentor")}
                    </span>
                  </p>
                  <p className="text-slate-400 flex justify-between">
                    <span>{isRTL ? "بازه بیداری-خواب" : "Circadian cycles"}</span>
                    <span className="text-white font-bold">{wakeUpTime} - {bedTime}</span>
                  </p>
                </div>
              </div>
            )}

            {/* ONBOARDING NAVIGATION ACTION CONTROLS */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800/80">
              {onboardingStep > 1 ? (
                <button
                  onClick={() => setOnboardingStep((prev) => prev - 1)}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                  <span>{isRTL ? "قبلی" : "Previous"}</span>
                </button>
              ) : (
                <div />
              )}

              {onboardingStep < 6 ? (
                <button
                  onClick={() => {
                    if (onboardingStep === 1 && !userName.trim()) {
                      triggerNotification(isRTL ? "لطفاً ابتدا نام خود را وارد کنید." : "Provide your identity name to proceed.");
                      return;
                    }
                    setOnboardingStep((prev) => prev + 1);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/15 cursor-pointer flex items-center gap-1.5"
                >
                  <span>{isRTL ? "گام بعدی" : "Next step"}</span>
                  {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              ) : (
                <button
                  onClick={handleOnboardingComplete}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/15 cursor-pointer flex items-center gap-1.5 active:scale-98"
                >
                  {loading ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{isRTL ? "ورود به داشبورد اصلی سیستم" : "Boot up Ecosystem dashboard"}</span>
                      {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
