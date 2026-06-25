import React, { useState, useEffect } from "react";
import { Search, Plus, Calendar, FileText, CheckCircle, Target, Award, Sparkles, X } from "lucide-react";
import { AppState, Task, Goal, Note } from "../types";
import { toPersianDigits } from "../lib/i18n";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onAddTask: (title: string) => void;
  onAddNote: (title: string) => void;
  onAddGoal: (title: string) => void;
  onNavigate: (tab: string) => void;
  lang?: "fa" | "en";
  usePersianNums?: boolean;
}

export default function CommandPalette({
  isOpen,
  onClose,
  state,
  onAddTask,
  onAddNote,
  onAddGoal,
  onNavigate,
  lang = "fa",
  usePersianNums = true,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    type: 'task' | 'goal' | 'note' | 'action';
    title: string;
    subtitle: string;
    action?: () => void;
  }[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const isFa = lang === "fa";
    if (!query) {
      // Default shortcuts
      setResults([
        {
          type: "action",
          title: isFa ? "ایجاد وظیفه جدید" : "Create a new Task",
          subtitle: isFa ? "افزودن سریع کارهای روزمره" : "Quickly insert a scheduled activity",
          action: () => {
            const title = prompt(isFa ? "عنوان وظیفه را وارد کنید:" : "Enter task title:");
            if (title) onAddTask(title);
            onClose();
          },
        },
        {
          type: "action",
          title: isFa ? "ایجاد یادداشت پژوهشی پیش‌نویس" : "Draft a new Note",
          subtitle: isFa ? "نگارش یادداشت‌های فکری و فرمول‌ها" : "Create a rich text research note",
          action: () => {
            const title = prompt(isFa ? "عنوان یادداشت را وارد کنید:" : "Enter note title:");
            if (title) onAddNote(title);
            onClose();
          },
        },
        {
          type: "action",
          title: isFa ? "فرموله‌سازی هدف جدید" : "Formulate a new Goal",
          subtitle: isFa ? "تنظیم اهداف بلندمدت و هفتگی" : "Establish long-term milestones",
          action: () => {
            const title = prompt(isFa ? "عنوان هدف را وارد کنید:" : "Enter goal title:");
            if (title) onAddGoal(title);
            onClose();
          },
        },
        {
          type: "action",
          title: isFa ? "تغییر بخش به برنامه‌ریز هوشمند" : "Switch to Planner System",
          subtitle: isFa ? "مشاهده بازه‌های زمانی روز" : "Go to Daily schedule blocks",
          action: () => {
            onNavigate("planner");
            onClose();
          },
        },
        {
          type: "action",
          title: isFa ? "مشورت با هوش مصنوعی جمینی" : "Consult Digital Twin Coach",
          subtitle: isFa ? "گفتگو و تحلیل شرایط با مربی رشد فردی" : "Interact with server-side AI Coach",
          action: () => {
            onNavigate("ai");
            onClose();
          },
        },
      ]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const matches: typeof results = [];

    // Search Tasks
    state.tasks.forEach((task) => {
      if (task.title.toLowerCase().includes(lowerQuery) || (task.description && task.description.toLowerCase().includes(lowerQuery))) {
        matches.push({
          type: "task",
          title: task.title,
          subtitle: isFa 
            ? `وظیفه • اولویت: ${task.priority === "critical" ? "بحرانی" : task.priority === "high" ? "بالا" : "متوسط"} • وضعیت: ${task.status === "done" ? "انجام‌شده" : "در انتظار"}`
            : `Task • Priority: ${task.priority} • Status: ${task.status}`,
          action: () => {
            onNavigate("planner");
            onClose();
          },
        });
      }
    });

    // Search Goals
    state.goals.forEach((goal) => {
      if (goal.title.toLowerCase().includes(lowerQuery) || (goal.description && goal.description.toLowerCase().includes(lowerQuery))) {
        matches.push({
          type: "goal",
          title: goal.title,
          subtitle: isFa 
            ? `هدف • دسته‌بندی: ${goal.category} • پیشرفت: ${toPersianDigits(goal.progress, usePersianNums)}٪`
            : `Goal • Category: ${goal.category} • Progress: ${goal.progress}%`,
          action: () => {
            onNavigate("planner");
            onClose();
          },
        });
      }
    });

    // Search Notes
    state.notes.forEach((note) => {
      if (note.title.toLowerCase().includes(lowerQuery) || note.content.toLowerCase().includes(lowerQuery)) {
        matches.push({
          type: "note",
          title: note.title,
          subtitle: isFa 
            ? `یادداشت • پوشه: ${note.folder} • برچسب‌ها: ${note.tags.join("، ")}`
            : `Note • Folder: ${note.folder} • Tags: ${note.tags.join(", ")}`,
          action: () => {
            onNavigate("notes");
            onClose();
          },
        });
      }
    });

    // Add option to create instant task
    matches.push({
      type: "action",
      title: isFa ? `ایجاد سریع وظیفه: "${query}"` : `Create Task: "${query}"`,
      subtitle: isFa ? "برای زمان‌بندی فوری کلیک کنید" : "Press to instantly schedule this task",
      action: () => {
        onAddTask(query);
        onClose();
      },
    });

    setResults(matches);
  }, [query, state, onAddTask, onAddNote, onAddGoal, onNavigate, onClose, lang, usePersianNums]);

  if (!isOpen) return null;

  const isFa = lang === "fa";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/65 backdrop-blur-xs" dir={isFa ? "rtl" : "ltr"}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className={`flex items-center px-4 py-3 border-b border-slate-800 ${isFa ? "flex-row-reverse" : ""}`}>
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            className="flex-1 bg-transparent border-0 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-0 px-3 text-right"
            placeholder={isFa ? "دستور یا واژه‌ای را برای جستجو وارد کنید..." : "Type a command or search anything (tasks, notes, goals)..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {results.length > 0 ? (
            results.map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                className={`w-full flex items-center px-4 py-3 text-right hover:bg-slate-800/80 transition-colors duration-100 group cursor-pointer ${isFa ? "flex-row-reverse" : ""}`}
              >
                <div className={`p-2 rounded-lg bg-slate-800 group-hover:bg-slate-700 text-indigo-400 ${isFa ? "ml-3" : "mr-3"}`}>
                  {item.type === "task" && <CheckCircle className="w-4 h-4" />}
                  {item.type === "goal" && <Target className="w-4 h-4" />}
                  {item.type === "note" && <FileText className="w-4 h-4" />}
                  {item.type === "action" && <Plus className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm font-medium text-slate-200 truncate">{item.title}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                </div>
                <span className="text-[10px] text-slate-500 bg-slate-800/40 px-2 py-0.5 rounded-md font-mono shrink-0">
                  {isFa ? "ورود" : "Enter"}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-slate-400">
              <Sparkles className="w-8 h-8 text-slate-500 mx-auto mb-2 animate-bounce" />
              <p className="text-sm">{isFa ? "هیچ نتیجه‌ای یافت نشد." : "No results matched your search query"}</p>
            </div>
          )}
        </div>
        <div className={`flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 ${isFa ? "flex-row-reverse" : ""}`}>
          <span>{isFa ? "جستجوی همه‌جانبه در هسته مرکزی سیستم" : "Search everything in your Life Operating System"}</span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded-sm">ESC</span>
        </div>
      </div>
    </div>
  );
}
