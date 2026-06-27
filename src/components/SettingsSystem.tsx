import React, { useState, useEffect } from "react";
import { Settings, Sliders, Palette, ShieldCheck, Download, Upload, RefreshCw, Moon, User, KeyRound, Smartphone, Monitor, Shield, LogOut, CheckCircle, Fingerprint, Mail, Phone, Link2, Trash2 } from "lucide-react";
import { AppState } from "../types";
import { PREMIUM_THEMES, Theme } from "../lib/themes";
import { t, toPersianDigits } from "../lib/i18n";

interface SettingsSystemProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  activeTheme: Theme;
  onSelectTheme: (theme: Theme) => void;
  onUpdateAccentColor: (color: string) => void;
  onLogOut?: () => void;
}

export default function SettingsSystem({
  state,
  onUpdateState,
  activeTheme,
  onSelectTheme,
  onUpdateAccentColor,
  onLogOut,
}: SettingsSystemProps) {
  const lang = state.profile?.language || "fa";
  const usePersianNums = state.profile?.usePersianNumerals !== false;
  const isRTL = lang === "fa";

  const [accentPicker, setAccentPicker] = useState(activeTheme.primary);
  const [syncStatus, setSyncStatus] = useState(isRTL ? "متصل" : "Connected");

  const [is2FAEnabled, setIs2FAEnabled] = useState(state.profile?.twoFactorEnabled || false);
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(state.profile?.biometricsEnabled || false);
  const [linkedAccounts, setLinkedAccounts] = useState<string[]>(state.profile?.linkedAccounts || ["email"]);
  const [sessions, setSessions] = useState([
    { id: "sess_1", device: "Chrome / Windows 11", location: isRTL ? "تهران، ایران" : "Tehran, Iran", lastActive: isRTL ? "هم‌اکنون (فعال)" : "Just now (Current)", isCurrent: true },
    { id: "sess_2", device: "iPhone 15 Pro", location: isRTL ? "کرج، ایران" : "Karaj, Iran", lastActive: isRTL ? "۲ ساعت پیش" : "2 hours ago", isCurrent: false },
    { id: "sess_3", device: "Safari / macOS", location: isRTL ? "اصفهان، ایران" : "Isfahan, Iran", lastActive: isRTL ? "دیروز" : "Yesterday", isCurrent: false }
  ]);

  const toggle2FA = async () => {
    const newVal = !is2FAEnabled;
    setIs2FAEnabled(newVal);
    onUpdateState({
      ...state,
      profile: {
        ...state.profile,
        twoFactorEnabled: newVal
      } as any
    });
    try {
      const userId = localStorage.getItem("gh_planner_user_id");
      await fetch("/api/auth/toggle-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId || "" },
        body: JSON.stringify({ enabled: newVal })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBiometrics = async () => {
    const newVal = !isBiometricsEnabled;
    setIsBiometricsEnabled(newVal);
    onUpdateState({
      ...state,
      profile: {
        ...state.profile,
        biometricsEnabled: newVal
      } as any
    });
    try {
      const userId = localStorage.getItem("gh_planner_user_id");
      await fetch("/api/auth/toggle-biometrics", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId || "" },
        body: JSON.stringify({ enabled: newVal })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const linkGoogle = async () => {
    try {
      const userId = localStorage.getItem("gh_planner_user_id");
      const res = await fetch("/api/auth/link", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId || "" },
        body: JSON.stringify({ provider: "google", identifier: "commander.mohammad.google@gmail.com" })
      });
      if (res.ok) {
        const updatedProfile = await res.json();
        setLinkedAccounts(updatedProfile.linkedAccounts);
        onUpdateState({
          ...state,
          profile: {
            ...state.profile,
            linkedAccounts: updatedProfile.linkedAccounts
          } as any
        });
        alert(isRTL ? "حساب گوگل با موفقیت به شناسه شما متصل شد!" : "Google Account successfully linked!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const unlinkGoogle = async () => {
    try {
      const userId = localStorage.getItem("gh_planner_user_id");
      const res = await fetch("/api/auth/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId || "" },
        body: JSON.stringify({ provider: "google" })
      });
      if (res.ok) {
        const updatedProfile = await res.json();
        setLinkedAccounts(updatedProfile.linkedAccounts);
        onUpdateState({
          ...state,
          profile: {
            ...state.profile,
            linkedAccounts: updatedProfile.linkedAccounts
          } as any
        });
        alert(isRTL ? "اتصال حساب گوگل با موفقیت قطع شد." : "Google Account unlinked.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const linkPhone = async () => {
    const phoneNumber = prompt(isRTL ? "لطفا شماره تلفن خود را وارد کنید:" : "Please enter your phone number:");
    if (!phoneNumber) return;
    try {
      const userId = localStorage.getItem("gh_planner_user_id");
      const res = await fetch("/api/auth/link", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId || "" },
        body: JSON.stringify({ provider: "phone", identifier: phoneNumber })
      });
      if (res.ok) {
        const updatedProfile = await res.json();
        setLinkedAccounts(updatedProfile.linkedAccounts);
        onUpdateState({
          ...state,
          profile: {
            ...state.profile,
            linkedAccounts: updatedProfile.linkedAccounts
          } as any
        });
        alert(isRTL ? "شماره تلفن همراه شما با موفقیت متصل شد!" : "Phone number linked successfully!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const unlinkPhone = async () => {
    try {
      const userId = localStorage.getItem("gh_planner_user_id");
      const res = await fetch("/api/auth/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId || "" },
        body: JSON.stringify({ provider: "phone" })
      });
      if (res.ok) {
        const updatedProfile = await res.json();
        setLinkedAccounts(updatedProfile.linkedAccounts);
        onUpdateState({
          ...state,
          profile: {
            ...state.profile,
            linkedAccounts: updatedProfile.linkedAccounts
          } as any
        });
        alert(isRTL ? "اتصال شماره تلفن همراه با موفقیت قطع شد." : "Phone number unlinked.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const revokeSession = async (sessId: string) => {
    try {
      const userId = localStorage.getItem("gh_planner_user_id");
      await fetch("/api/auth/revoke-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId || "" },
        body: JSON.stringify({ sessionId: sessId })
      });
      setSessions(prev => prev.filter(s => s.id !== sessId));
      alert(isRTL ? "نشست مورد نظر با موفقیت لغو شد." : "Session successfully revoked.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportData = () => {
    const raw = JSON.stringify(state, null, 2);
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gh_planner_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.profile && parsed.tasks) {
          onUpdateState(parsed);
          alert(isRTL ? "داده‌های پشتیبان با موفقیت بازیابی شدند!" : "Backup state imported successfully!");
        } else {
          alert(isRTL ? "فرمت فایل نامعتبر است." : "Invalid backup file format. Must be a GH Planner backup.");
        }
      } catch (err) {
        alert(isRTL ? "خطا در خواندن فایل JSON." : "Failed to parse backup JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleSyncNow = async () => {
    setSyncStatus(isRTL ? "در حال همگام‌سازی..." : "Syncing...");
    try {
      const response = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (!response.ok) throw new Error("Sync disconnected");
      setTimeout(() => {
        setSyncStatus(isRTL ? "همگام‌سازی موفقیت‌آمیز" : "Synchronized");
      }, 1000);
    } catch (err) {
      setSyncStatus(isRTL ? "ذخیره‌سازی آفلاین انجام شد" : "Offline Draft Saved");
    }
  };

  const handleLanguageChange = (newLang: "fa" | "en") => {
    onUpdateState({
      ...state,
      profile: {
        ...state.profile,
        language: newLang,
      },
    });
  };

  const handleNumeralsChange = (usePersian: boolean) => {
    onUpdateState({
      ...state,
      profile: {
        ...state.profile,
        usePersianNumerals: usePersian,
      },
    });
  };

  return (
    <div className={`space-y-6 max-w-5xl mx-auto text-right ${isRTL ? "font-sans" : ""}`}>
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-indigo-400" />
            {t("settings", lang)}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isRTL
              ? "شخصی‌سازی محیط کاربری، پیکربندی تقویم شمسی، نمایش اعداد و مدیریت نسخه‌های پشتیبان."
              : "Personalize your workspace aesthetics, configure regional calendars, manage secrets, and control backups."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column Theme Catalog Selector */}
        <div className="lg:col-span-2 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
            <Palette className="w-4 h-4 text-indigo-400" />
            <span>{t("themeCustomization", lang)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {PREMIUM_THEMES.map((theme) => {
              const isSelected = activeTheme.id === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    onSelectTheme(theme);
                    setAccentPicker(theme.primary);
                  }}
                  className={`p-4 rounded-xl border text-right flex flex-col justify-between h-28 relative overflow-hidden transition-all duration-150 ${
                    isSelected
                      ? "border-indigo-500 shadow-lg shadow-indigo-500/5 bg-slate-800/80"
                      : "border-slate-800 bg-slate-950/40 hover:bg-slate-900/40 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-center w-full z-10">
                    <span className="text-xs font-bold text-slate-200">
                      {theme.name}
                    </span>
                    {theme.isDark ? (
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Palette className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </div>

                  <div className="flex gap-2 items-center mt-4 z-10">
                    <span
                      className="w-3.5 h-3.5 rounded-full inline-block"
                      style={{ backgroundColor: theme.primary }}
                    ></span>
                    <span
                      className="w-3.5 h-3.5 rounded-full inline-block"
                      style={{ backgroundColor: theme.accent }}
                    ></span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {theme.isDark ? (isRTL ? "پوسته تیره" : "Dark theme") : (isRTL ? "پوسته روشن" : "Light theme")}
                    </span>
                  </div>

                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-tr opacity-15 rounded-full filter blur-md translate-x-8 translate-y-8" style={{ backgroundImage: `linear-gradient(to top right, ${theme.primary}, ${theme.accent})` }}></div>
                </button>
              );
            })}
          </div>

          {/* Color accent Picker */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              {t("accentColor", lang)}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 p-0.5 cursor-pointer"
                value={accentPicker}
                onChange={(e) => {
                  setAccentPicker(e.target.value);
                  onUpdateAccentColor(e.target.value);
                }}
              />
              <span className="text-xs font-mono text-slate-400 uppercase">
                {accentPicker}
              </span>
            </div>
          </div>
        </div>

        {/* Account Security, Sessions, and Linking Section */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-6 text-right">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
            <Shield className="w-4.5 h-4.5 text-indigo-400" />
            <span>{isRTL ? "امنیت حساب و اتصال دستگاه‌ها" : "Account Security & Device Linking"}</span>
          </div>

          {/* Sub-section 1: Account Linking */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 justify-start">
              <Link2 className="w-4 h-4 text-indigo-400" />
              {isRTL ? "روش‌های اتصال حساب کاربری" : "Linked Authentication Methods"}
            </h4>
            <p className="text-[11px] text-slate-500">
              {isRTL 
                ? "می‌توانید چند روش ورود را به یک شناسه متصل کنید تا در زمان‌های مختلف به راحتی وارد شوید." 
                : "Link multiple signing methods to securely enter your dashboard via different lines."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Email provider */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex flex-col justify-between h-28">
                <div className="flex items-center gap-2 justify-between">
                  <span className="text-[10px] text-slate-500 uppercase">{isRTL ? "پست الکترونیکی" : "Email Address"}</span>
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-xs font-bold text-slate-300 truncate mt-2 font-mono">
                  mhmdrdaqan8@gmail.com
                </p>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md self-start mt-2">
                  {isRTL ? "پیش‌فرض فعال" : "Primary"}
                </span>
              </div>

              {/* Google provider */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex flex-col justify-between h-28">
                <div className="flex items-center gap-2 justify-between">
                  <span className="text-[10px] text-slate-500 uppercase">{isRTL ? "اتصال گوگل" : "Google Sign-In"}</span>
                  <User className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-xs font-bold text-slate-300 truncate mt-2 font-mono font-sans">
                  {linkedAccounts.includes("google") ? "commander.mohammad.google@gmail.com" : (isRTL ? "متصل نیست" : "Not Linked")}
                </p>
                {linkedAccounts.includes("google") ? (
                  <button
                    onClick={unlinkGoogle}
                    className="text-[10px] text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded-md self-start mt-2 cursor-pointer transition-all"
                  >
                    {isRTL ? "قطع اتصال" : "Unlink"}
                  </button>
                ) : (
                  <button
                    onClick={linkGoogle}
                    className="text-[10px] text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded-md self-start mt-2 cursor-pointer transition-all"
                  >
                    {isRTL ? "اتصال حساب" : "Link Google"}
                  </button>
                )}
              </div>

              {/* Phone provider */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex flex-col justify-between h-28">
                <div className="flex items-center gap-2 justify-between">
                  <span className="text-[10px] text-slate-500 uppercase">{isRTL ? "تایید پیامکی (OTP)" : "SMS OTP Lock"}</span>
                  <Phone className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xs font-bold text-slate-300 truncate mt-2 font-mono">
                  {linkedAccounts.includes("phone") ? "+98 912 •••• 53" : (isRTL ? "متصل نیست" : "Not Linked")}
                </p>
                {linkedAccounts.includes("phone") ? (
                  <button
                    onClick={unlinkPhone}
                    className="text-[10px] text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded-md self-start mt-2 cursor-pointer transition-all"
                  >
                    {isRTL ? "قطع اتصال" : "Unlink"}
                  </button>
                ) : (
                  <button
                    onClick={linkPhone}
                    className="text-[10px] text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-md self-start mt-2 cursor-pointer transition-all"
                  >
                    {isRTL ? "اتصال موبایل" : "Link Phone"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sub-section 2: 2FA & Biometric Lock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-850">
            {/* 2FA Switch */}
            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-200">{isRTL ? "ورود دو مرحله‌ای (2FA)" : "Two-Factor Verification (2FA)"}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isRTL ? "امنیت فوق‌العاده با تایید رمز یکبار مصرف" : "Request OTP token code even after regular password checks"}
                </p>
              </div>
              <button
                onClick={toggle2FA}
                className={`w-10 h-6 rounded-full p-1 transition-all ${is2FAEnabled ? "bg-indigo-600" : "bg-slate-800"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-all ${isRTL ? (is2FAEnabled ? "translate-x-0" : "-translate-x-4") : (is2FAEnabled ? "translate-x-4" : "translate-x-0")}`} />
              </button>
            </div>

            {/* Biometrics Switch */}
            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-200">{isRTL ? "قفل امنیتی بیومتریک" : "Biometric Quick Access"}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isRTL ? "استفاده از اثر انگشت یا تشخیص چهره دستگاه" : "Fast verification using fingerprint/face unlock components"}
                </p>
              </div>
              <button
                onClick={toggleBiometrics}
                className={`w-10 h-6 rounded-full p-1 transition-all ${isBiometricsEnabled ? "bg-indigo-600" : "bg-slate-800"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-all ${isRTL ? (isBiometricsEnabled ? "translate-x-0" : "-translate-x-4") : (isBiometricsEnabled ? "translate-x-4" : "translate-x-0")}`} />
              </button>
            </div>
          </div>

          {/* Sub-section 3: Active Device Sessions */}
          <div className="space-y-3 pt-4 border-t border-slate-850">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 justify-start">
              <Monitor className="w-4 h-4 text-indigo-400" />
              {isRTL ? "نشست‌های فعال و امنیت دستگاه‌ها" : "Active Device Sessions"}
            </h4>

            <div className="space-y-2">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400">
                      {sess.device.includes("iPhone") ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-200">{sess.device}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        {sess.location} • {sess.lastActive}
                      </p>
                    </div>
                  </div>

                  {sess.isCurrent ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                      {isRTL ? "نشست فعلی" : "Current Session"}
                    </span>
                  ) : (
                    <button
                      onClick={() => revokeSession(sess.id)}
                      className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                      title={isRTL ? "لغو نشست" : "Revoke Session"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Destructive zone: Sign out */}
          <div className="pt-4 border-t border-slate-850 flex justify-end">
            {onLogOut && (
              <button
                onClick={() => {
                  if (confirm(isRTL ? "آیا مایلید از حساب کاربری خود خارج شوید؟" : "Are you sure you want to sign out?")) {
                    onLogOut();
                  }
                }}
                className="bg-rose-600/10 hover:bg-rose-600/25 text-rose-400 hover:text-rose-300 border border-rose-500/30 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                {isRTL ? "خروج ایمن از پایگاه زیستی جی‌اچ" : "Secure Sign Out of GH OS"}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Synchronization, backing, regional choices */}
        <div className="space-y-6">
          {/* Default Language selection & Numerals */}
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>{t("systemLanguage", lang)}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">
                  {isRTL ? "انتخاب زبان واسط کاربری" : "Select UI Language"}
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                  value={lang}
                  onChange={(e) => handleLanguageChange(e.target.value as any)}
                >
                  <option value="fa">{t("farsi", lang)}</option>
                  <option value="en">{t("english", lang)}</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">
                  {t("numeralPreference", lang)}
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="numeralSys"
                      checked={usePersianNums}
                      onChange={() => handleNumeralsChange(true)}
                      className="text-indigo-600 focus:ring-0 bg-slate-950 border-slate-800"
                    />
                    <span>{t("usePersianNumerals", lang)}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="numeralSys"
                      checked={!usePersianNums}
                      onChange={() => handleNumeralsChange(false)}
                      className="text-indigo-600 focus:ring-0 bg-slate-950 border-slate-800"
                    />
                    <span>{t("useEnglishNumerals", lang)}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Cloud Sync simulated dash */}
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isRTL ? "موتور همگام‌سازی ابری" : "Cloud Sync Engine"}</span>
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">{isRTL ? "وضعیت اتصال" : "Sync Status"}</span>
                <span className="font-mono font-bold text-emerald-400">
                  {syncStatus}
                </span>
              </div>

              <button
                onClick={handleSyncNow}
                className="w-full bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {isRTL ? "همگام‌سازی دستی پایگاه‌داده" : "Force Sync database"}
              </button>
            </div>
          </div>

          {/* Backups Export/Import */}
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>{t("exportBackup", lang)}</span>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t("exportBackupDesc", lang)}
              </p>

              <button
                onClick={handleExportData}
                className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-xs font-semibold py-2 rounded-xl transition-all border border-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {t("exportBtn", lang)}
              </button>

              <p className="text-[11px] text-slate-400 leading-relaxed mt-2 pt-2 border-t border-slate-850">
                {t("importBackupDesc", lang)}
              </p>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <button className="w-full bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {t("importBtn", lang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
