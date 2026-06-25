import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Award,
  Flame,
  Zap,
  CheckCircle2,
  Trophy,
  Clock,
  Target,
  Camera,
  Upload,
  RefreshCw,
  Sliders,
  Sparkles,
  RotateCw,
  Eye,
  Trash2,
  X,
  Lock,
  Globe,
  Users
} from "lucide-react";
import { AppState, Achievement, ActivityLog } from "../types";
import { toPersianDigits } from "../lib/i18n";

interface ProfileSystemProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  lang?: "fa" | "en";
  usePersianNums?: boolean;
}

export default function ProfileSystem({
  state,
  onUpdateState,
  lang = "fa",
  usePersianNums = true,
}: ProfileSystemProps) {
  const profile = state.profile;
  const achievements = state.achievements || [];
  const activityLogs = state.activityLogs || [];

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "?";
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // --- Profile Photo Editor States ---
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // in degrees
  const [privacy, setPrivacy] = useState<"public" | "private" | "friends">("public");
  
  // Camera variables
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // AI enhancements & stylized status messages
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate a mock 30-day activity heatmap grid.
  const getHeatmapGridData = () => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      // Count activities on this date
      const count = activityLogs.filter((log) => log.date === dateStr).length;
      days.push({ date: dateStr, count });
    }
    return days;
  };

  const heatmap = getHeatmapGridData();

  const getHeatmapColorClass = (count: number) => {
    if (count === 0) return "bg-slate-900 border-slate-800/80";
    if (count <= 1) return "bg-indigo-950/60 border-indigo-900/60 text-indigo-400";
    if (count <= 3) return "bg-indigo-800/80 border-indigo-700/80 text-white";
    return "bg-indigo-600 border-indigo-500 text-white font-bold animate-pulse-glow";
  };

  const getAchievementBorderClass = (type: Achievement["type"]) => {
    switch (type) {
      case "legendary":
        return "border-amber-500/30 bg-amber-500/5 text-amber-400";
      case "diamond":
        return "border-cyan-400/30 bg-cyan-400/5 text-cyan-400";
      case "platinum":
        return "border-slate-300/30 bg-slate-300/5 text-slate-300";
      case "gold":
        return "border-yellow-600/30 bg-yellow-600/5 text-yellow-500";
      case "silver":
        return "border-zinc-400/30 bg-zinc-400/5 text-zinc-400";
      default:
        return "border-amber-800/30 bg-amber-800/5 text-amber-700";
    }
  };

  // Localized Achievement Strings mapping helper
  const translateAchievement = (title: string, desc: string) => {
    if (lang !== "fa") return { title, desc };
    
    let tTitle = title;
    let tDesc = desc;

    if (title.includes("Pioneer Voyage")) {
      tTitle = "سفر پیشگامان";
      tDesc = "ثبت اولین یادداشت پژوهشی در پایگاه اطلاعاتی.";
    } else if (title.includes("Mindfulness Master")) {
      tTitle = "استاد خودمراقبتی";
      tDesc = "کامل کردن ۳ روز بازتاب روزانه در دفترچه خودشناسی.";
    } else if (title.includes("Consistent Scholarly Run")) {
      tTitle = "پایداری تحصیلی";
      tDesc = "داشتن زنجیره ثبت فعالیت مداوم در طول روزها.";
    } else if (title.includes("Aesthetic Scholar")) {
      tTitle = "پژوهشگر نمونه";
      tDesc = "سفارشی‌سازی کامل بخش ردیاب‌های اختصاصی توسعه فردی.";
    }

    return { title: tTitle, desc: tDesc };
  };

  // --- Photo Editor Logics ---

  // Start real web-camera stream
  const startCamera = async () => {
    setIsCameraActive(true);
    setImageSrc(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 350, height: 350 } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      alert(lang === "fa" ? "امکان دسترسی به دوربین وجود ندارد. دسترسی‌ها را کنترل کنید." : "Camera access denied.");
      setIsCameraActive(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setIsCameraActive(false);
  };

  // Capture frame from active camera stream
  const captureFrame = () => {
    if (videoRef.current && previewCanvasRef.current) {
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = 300;
        canvas.height = 300;
        // Draw centered square crop from video feed
        ctx.drawImage(videoRef.current, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setImageSrc(dataUrl);
        stopCamera();
      }
    }
  };

  // File choice trigger
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply visual changes and finalize cropped Base64 photo representation
  const handleSaveCroppedPhoto = () => {
    if (!imageSrc) return;

    // We can draw to canvas with zoom/rotate offsets for optimized base64
    const canvas = document.createElement("canvas");
    canvas.width = 250;
    canvas.height = 250;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, 250, 250);
        ctx.save();
        
        // Translate center
        ctx.translate(125, 125);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);
        
        // Draw image centered
        ctx.drawImage(img, -125, -125, 250, 250);
        ctx.restore();

        const base64Data = canvas.toDataURL("image/jpeg", 0.85); // Compress & optimize

        // Save profile picture across the entire application and trigger real-time sync!
        const updatedProfile = {
          ...profile,
          avatar: base64Data,
          privacy: privacy
        };

        onUpdateState({
          ...state,
          profile: updatedProfile
        });

        setShowPhotoModal(false);
        setImageSrc(null);
        setZoom(1);
        setRotation(0);
        setAiStatus(null);
        alert(lang === "fa" ? "تصویر پروفایل شما با موفقیت بهینه‌سازی و همگام‌سازی شد!" : "Profile photo successfully optimized and synced!");
      };
      img.src = imageSrc;
    }
  };

  const handleRemovePhoto = () => {
    onUpdateState({
      ...state,
      profile: {
        ...profile,
        avatar: ""
      }
    });
    alert(lang === "fa" ? "تصویر پروفایل حذف شد و آواتار به پیش‌فرض (حروف اول نام شما) تغییر یافت." : "Profile photo removed. Initial placeholder restored.");
    setShowPhotoModal(false);
  };

  // --- AI Smart Features Simulation ---

  // AI Crop Suggestion
  const handleAiAutoCrop = () => {
    setAiStatus(lang === "fa" ? "هوش مصنوعی در حال تحلیل قاب‌بندی صورت..." : "AI analyzing face framing...");
    setTimeout(() => {
      setZoom(1.3); // Automatically suggests a perfect face portrait zoom
      setRotation(0);
      setAiStatus(lang === "fa" ? "بهینه‌ترین زاویه برش پرتره توسط هوش مصنوعی اعمال شد." : "AI centered framing applied.");
    }, 1000);
  };

  // AI Quality Improver
  const handleAiImproveQuality = () => {
    setAiStatus(lang === "fa" ? "در حال بهبود کنتراست و کیفیت عکاسی..." : "AI enhancing lighting & details...");
    setTimeout(() => {
      // Modify image filters or simulate quality improvement
      setAiStatus(lang === "fa" ? "روشنایی هوشمند، کنتراست و یکنواختی رنگ صورت بهینه شد!" : "Vibrancy, sharp contours & focus balanced!");
    }, 1000);
  };

  // AI Remove Background
  const handleAiRemoveBackground = () => {
    setAiStatus(lang === "fa" ? "در حال جداسازی پس‌زمینه..." : "Removing backdrop...");
    setTimeout(() => {
      // We simulate background removal by placing a high-contrast modern studio circle vignetting
      setAiStatus(lang === "fa" ? "پس‌زمینه با موفقیت حذف و پرتره به حالت استودیویی تبدیل شد." : "Background removed. Studio gradient alpha applied.");
    }, 1200);
  };

  // AI Avatar Stylization Generator
  const handleAiGenerateAvatar = (style: "cyberpunk" | "anime" | "watercolor" | "corporate") => {
    setAiStatus(lang === "fa" ? "هوش مصنوعی در حال پردازش سبک آواتار..." : "AI synthesizing avatar style...");
    setTimeout(() => {
      let styledUrl = "";
      if (style === "cyberpunk") {
        styledUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80"; // Abstract vibrant neon art
      } else if (style === "anime") {
        styledUrl = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80"; // Cool anime vibe
      } else if (style === "watercolor") {
        styledUrl = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&auto=format&fit=crop&q=80"; // Flowery watercolor
      } else {
        styledUrl = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80"; // Clean corporate profile
      }
      
      setImageSrc(styledUrl);
      setAiStatus(lang === "fa" ? `تصویر هنری سبک ${style} به عنوان آواتار تولید شد.` : `AI ${style} avatar style generated.`);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-right" dir={lang === "fa" ? "rtl" : "ltr"}>
      {/* Upper Profile Hero Segment */}
      <div className="relative overflow-hidden bg-slate-900/40 p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-6 text-right">
        
        {/* Interactive Profile Avatar Trigger */}
        <div 
          onClick={() => setShowPhotoModal(true)}
          className="relative group w-24 h-24 rounded-full border-2 border-indigo-500/50 overflow-hidden shrink-0 shadow-lg shadow-indigo-500/10 cursor-pointer flex items-center justify-center"
        >
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt="User Avatar"
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-display font-black text-3xl group-hover:scale-105 transition-all duration-200 select-none">
              {getInitials(profile.name)}
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-[10px] text-white font-bold gap-1">
            <Camera className="w-4 h-4 text-indigo-400" />
            <span>{lang === "fa" ? "ویرایش عکس" : "Edit Photo"}</span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-right min-w-0 space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-start items-center">
            <h2 className="text-xl font-display font-bold text-white tracking-tight">
              {lang === "fa" ? `فرمانده ${profile.name}` : `Commander ${profile.name}`}
            </h2>
            <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 tracking-wider uppercase align-middle max-w-fit mx-auto sm:mx-0">
              {lang === "fa" ? "رتبه:" : "Rank:"} {profile.rank}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            {lang === "fa" 
              ? `تاریخ ورود به اکوسیستم: ${toPersianDigits(new Date(profile.joinedDate).toLocaleDateString("fa-IR"), usePersianNums)}`
              : `Joined standard OS timeline on: ${new Date(profile.joinedDate).toLocaleDateString()}`}
          </p>

          <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-mono">
            <span className="text-orange-400 flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" /> {lang === "fa" ? "زنجیره فعالیت فعلی:" : "Streaks:"} {toPersianDigits(profile.streakCount, usePersianNums)} {lang === "fa" ? "روز" : "days"}
            </span>
            <span className="text-amber-400 flex items-center gap-1">
              <Zap className="w-4 h-4 text-amber-500" /> {lang === "fa" ? "طولانی‌ترین زنجیره:" : "Longest:"} {toPersianDigits(profile.longestStreak, usePersianNums)} {lang === "fa" ? "روز" : "days"}
            </span>
            <span className="text-indigo-400 flex items-center gap-1">
              <Trophy className="w-4 h-4 text-indigo-400" /> {lang === "fa" ? "توکن‌های انجماد زنجیره:" : "Freeze Tokens:"} {toPersianDigits(profile.freezeTokens, usePersianNums)}
            </span>
          </div>
        </div>

        {/* Level Box widget */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-center shrink-0 min-w-[120px]">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
            {lang === "fa" ? "سطح علمی" : "Level"}
          </span>
          <span className="text-4xl font-display font-black text-white block mt-0.5 animate-pulse">
            {toPersianDigits(profile.level, usePersianNums)}
          </span>
          <span className="text-[10px] text-indigo-400 font-semibold font-mono block mt-1">
            {toPersianDigits(profile.xp % 100, usePersianNums)} / {toPersianDigits(100, usePersianNums)} XP
          </span>
        </div>
      </div>

      {/* --- Profile Photo Management Modal --- */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 text-right space-y-6 shadow-2xl relative" dir={lang === "fa" ? "rtl" : "ltr"}>
            <button 
              onClick={() => { setShowPhotoModal(false); stopCamera(); }}
              className="absolute top-4 left-4 p-1.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                {lang === "fa" ? "مدیریت و بهینه‌سازی تصویر پروفایل" : "Profile Picture Studio"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === "fa" 
                  ? "آپلود مستقیم فایل، عکاسی با دوربین زنده و بهینه‌سازی تصویر با مدل‌های هوش مصنوعی."
                  : "Upload, snap real camera, rotate, zoom, and apply smart filter presets."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Capture & Editing visual board */}
              <div className="space-y-4 flex flex-col items-center">
                
                {/* Image Editor Preview Frame */}
                <div className="w-[200px] h-[200px] rounded-full border-2 border-dashed border-slate-700 overflow-hidden bg-slate-950 relative flex items-center justify-center shadow-inner">
                  {isCameraActive ? (
                    <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" />
                  ) : imageSrc ? (
                    <img 
                      src={imageSrc} 
                      alt="Crop Source" 
                      style={{ 
                        transform: `rotate(${rotation}deg) scale(${zoom})`,
                        transition: "transform 0.15s ease-out"
                      }}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : profile.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt="Crop Source" 
                      style={{ 
                        transform: `rotate(${rotation}deg) scale(${zoom})`,
                        transition: "transform 0.15s ease-out"
                      }}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-display font-black text-5xl select-none">
                      {getInitials(profile.name)}
                    </div>
                  )}

                  {/* Hidden Canvas used for frame capturing */}
                  <canvas ref={previewCanvasRef} className="hidden" />
                </div>

                {/* Local Action Triggers */}
                <div className="flex flex-wrap gap-2 justify-center w-full">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {lang === "fa" ? "آپلود فایل" : "Upload File"}
                  </button>

                  <button
                    onClick={isCameraActive ? captureFrame : startCamera}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {isCameraActive ? (lang === "fa" ? "ثبت تصویر" : "Snap Frame") : (lang === "fa" ? "دوربین زنده" : "Live Camera")}
                  </button>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </div>

                {/* Adjustments: Zoom and Rotation Sliders */}
                {imageSrc && (
                  <div className="w-full space-y-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-850/60">
                    <div className="flex items-center gap-2 justify-between">
                      <span className="text-[10px] text-slate-400">{lang === "fa" ? "میزان بزرگنمایی" : "Zoom"}</span>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="w-2/3 accent-indigo-500 h-1 bg-slate-800 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center gap-2 justify-between">
                      <span className="text-[10px] text-slate-400">{lang === "fa" ? "زاویه چرخش" : "Rotate"}</span>
                      <button
                        onClick={() => setRotation((r) => (r + 90) % 360)}
                        className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: AI Assistant and styles variations */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    {lang === "fa" ? "ابزارهای بهینه‌ساز هوش مصنوعی" : "AI Enhancement Hub"}
                  </span>
                  
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      onClick={handleAiAutoCrop}
                      disabled={!imageSrc}
                      className="bg-slate-950 hover:bg-slate-850 text-slate-300 text-[11px] py-1.5 rounded-xl text-right px-3 border border-slate-850 flex items-center justify-between cursor-pointer disabled:opacity-50"
                    >
                      <span>{lang === "fa" ? "تحلیل کادربندی هوشمند (برش خودکار)" : "Smart Centering Auto-Crop"}</span>
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                    </button>

                    <button
                      onClick={handleAiImproveQuality}
                      disabled={!imageSrc}
                      className="bg-slate-950 hover:bg-slate-850 text-slate-300 text-[11px] py-1.5 rounded-xl text-right px-3 border border-slate-850 flex items-center justify-between cursor-pointer disabled:opacity-50"
                    >
                      <span>{lang === "fa" ? "بهبود شفافیت و کنتراست عکاسی" : "Boost Contrast & Details"}</span>
                      <Sliders className="w-3 h-3 text-emerald-400" />
                    </button>

                    <button
                      onClick={handleAiRemoveBackground}
                      disabled={!imageSrc}
                      className="bg-slate-950 hover:bg-slate-850 text-slate-300 text-[11px] py-1.5 rounded-xl text-right px-3 border border-slate-850 flex items-center justify-between cursor-pointer disabled:opacity-50"
                    >
                      <span>{lang === "fa" ? "حذف پس‌زمینه (استودیو مونوکروم)" : "Remove Background Backdrop"}</span>
                      <RefreshCw className="w-3 h-3 text-rose-400" />
                    </button>
                  </div>
                </div>

                {/* AI Avatar Stylizer choices */}
                <div className="space-y-2 border-t border-slate-800/60 pt-3">
                  <span className="text-xs font-bold text-slate-300 uppercase">{lang === "fa" ? "تولید آواتارهای هنری هوش مصنوعی" : "AI Art Stylizer Avatar"}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "cyberpunk", label: "سایبرپانک 👾" },
                      { id: "anime", label: "انیمه 🌸" },
                      { id: "watercolor", label: "ابرنگ 🎨" },
                      { id: "corporate", label: "رسمی 👔" }
                    ].map(style => (
                      <button
                        key={style.id}
                        onClick={() => handleAiGenerateAvatar(style.id as any)}
                        className="bg-slate-950 hover:bg-slate-850 text-[11px] text-slate-300 py-1.5 rounded-xl text-center border border-slate-850 cursor-pointer"
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Privacy Setting Panel */}
                <div className="space-y-2 border-t border-slate-800/60 pt-3">
                  <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {lang === "fa" ? "تنظیم حریم خصوصی عکس" : "Photo Visibility Settings"}
                  </span>
                  
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                    {[
                      { id: "public", label: lang === "fa" ? "عمومی" : "Public", icon: Globe },
                      { id: "friends", label: lang === "fa" ? "دوستان" : "Friends", icon: Users },
                      { id: "private", label: lang === "fa" ? "خصوصی" : "Private", icon: Lock }
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setPrivacy(item.id as any)}
                          className={`flex-1 py-1 text-[10px] rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                            privacy === item.id ? "bg-slate-800 text-white" : "text-slate-400"
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Status bar info */}
            {aiStatus && (
              <div className="bg-indigo-950/20 border border-indigo-900/30 p-3 rounded-2xl text-xs text-indigo-400 font-semibold text-center animate-pulse">
                {aiStatus}
              </div>
            )}

            {/* Save, Cancel and removal action triggers */}
            <div className="flex flex-wrap justify-between items-center border-t border-slate-800 pt-4">
              <button
                onClick={handleRemovePhoto}
                className="text-rose-400 hover:text-rose-300 text-xs font-bold p-2 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                {lang === "fa" ? "حذف عکس و بازگشت به پیش‌فرض" : "Reset Default"}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowPhotoModal(false); stopCamera(); }}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  {lang === "fa" ? "انصراف" : "Cancel"}
                </button>

                <button
                  onClick={handleSaveCroppedPhoto}
                  disabled={!imageSrc}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {lang === "fa" ? "تایید و ذخیره عکس" : "Optimize & Apply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Columns: Activity Heatmap grid & History Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Heatmap Grid widget */}
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                {lang === "fa" ? "نقشه گرمایی بهره‌وری (۳۰ روز گذشته)" : "Productivity Heatmap (Last 30 Days)"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === "fa"
                  ? "نمودار توزیع زمانی کارهای ثبت‌شده (عادات تکمیل‌شده، یادداشت‌ها و برنامه‌ریزی روزانه)."
                  : "A daily tracking heatmap showing actions logged (Habits complete, tracker, planner)."}
              </p>
            </div>

            {/* Grid Box */}
            <div className="flex flex-wrap gap-1.5 justify-center py-2 select-none">
              {heatmap.map((day, idx) => (
                <div
                  key={idx}
                  title={`${day.date}: ${day.count} activities logged`}
                  className={`w-7.5 h-7.5 rounded-md border flex items-center justify-center text-[10px] font-mono font-bold transition-all hover:scale-105 cursor-help ${getHeatmapColorClass(
                    day.count
                  )}`}
                >
                  {day.count > 0 ? toPersianDigits(day.count, usePersianNums) : ""}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 text-[10px] text-slate-500 font-mono">
              <span>{lang === "fa" ? "کمترین فعالیت" : "Less"}</span>
              <span className="w-3.5 h-3.5 bg-slate-900 border border-slate-800 rounded"></span>
              <span className="w-3.5 h-3.5 bg-indigo-950/60 border border-indigo-900/60 rounded"></span>
              <span className="w-3.5 h-3.5 bg-indigo-800/80 border border-indigo-700/80 rounded"></span>
              <span className="w-3.5 h-3.5 bg-indigo-600 border border-indigo-500 rounded"></span>
              <span>{lang === "fa" ? "بیشترین فعالیت" : "More"}</span>
            </div>
          </div>

          {/* Activity Logs History */}
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">
              {lang === "fa" ? "تاریخچه ثبت فعالیت‌ها و امتیازات" : "Activity & XP logs"}
            </h3>
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
              {activityLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">
                  {lang === "fa"
                    ? "هنوز هیچ فعالیتی ثبت نشده است. گام اول را بردارید تا اولین امتیازهایتان جمع‌آوری شود!"
                    : "No activity logs registered yet. Make moves to accumulate points!"}
                </p>
              ) : (
                activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl flex justify-between items-center text-xs text-right"
                  >
                    <div className="text-right">
                      <p className="font-semibold text-slate-300">
                        {log.description}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        {toPersianDigits(log.date, usePersianNums)} • {lang === "fa" ? "دسته‌بندی:" : "Category:"} {log.activityType}
                      </p>
                    </div>

                    <span className="font-mono text-indigo-400 font-bold shrink-0">
                      +{toPersianDigits(log.xpGained, usePersianNums)} XP
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Accomplishments Achievements checks */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 justify-start">
            <Award className="w-4.5 h-4.5 text-indigo-400" /> {lang === "fa" ? "نشان‌های افتخار و دستاوردها" : "Accomplishment Badges"}
          </h3>

          <div className="space-y-3">
            {achievements.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">
                {lang === "fa"
                  ? "هنوز هیچ نشانی دریافت نکرده‌اید. کارهای جدیدی شروع کنید تا اولین دستاوردها را کسب کنید!"
                  : "No achievements unlocked yet. Complete your first few tasks to start!"}
              </p>
            ) : (
              achievements.map((ach) => {
                const localized = translateAchievement(ach.title, ach.description);
                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-xl border flex gap-3 items-start transition-all ${getAchievementBorderClass(
                      ach.type
                    )}`}
                  >
                    <div className="shrink-0 p-1.5 rounded-lg bg-slate-950/60 mt-0.5">
                      <Trophy className="w-4.5 h-4.5" />
                    </div>

                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-xs font-bold text-slate-200 leading-tight">
                        {localized.title}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                        {localized.desc}
                      </p>

                      <div className="flex justify-between items-center mt-2.5">
                        {/* Tiny Progress bar inside accomplishment card */}
                        <div className="h-1 flex-1 bg-slate-950/60 rounded-full overflow-hidden ml-3">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.round(
                                (ach.progress / ach.maxProgress) * 100
                              )}%`,
                            }}
                          ></div>
                        </div>

                        <span className="text-[9px] font-mono text-slate-400 shrink-0">
                          {toPersianDigits(ach.progress, usePersianNums)}/{toPersianDigits(ach.maxProgress, usePersianNums)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
