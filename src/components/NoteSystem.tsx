import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  FileText,
  Sparkles,
  Search,
  Tag,
  ChevronRight,
  HelpCircle,
  Award,
} from "lucide-react";
import { Note, AppState } from "../types";
import { toPersianDigits } from "../lib/i18n";

interface NoteSystemProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  onAddXP: (xp: number, type: string, desc: string) => void;
  lang?: "fa" | "en";
  usePersianNums?: boolean;
}

export default function NoteSystem({
  state,
  onUpdateState,
  onAddXP,
  lang = "fa",
  usePersianNums = true,
}: NoteSystemProps) {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("All");

  // Editorial states
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteTags, setNoteTags] = useState("");
  const [noteFolder, setNoteFolder] = useState("Study");

  // AI Generated assets
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [flashcards, setFlashcards] = useState<{ question: string; answer: string }[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<{ question: string; options: string[]; correctIndex: number }[]>([]);
  
  // Quiz taking state
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [idx: number]: number }>({});
  const [revealedFlashcardIdx, setRevealedFlashcardIdx] = useState<number | null>(null);

  const handleCreateNote = () => {
    const isFa = lang === "fa";
    const newNote: Note = {
      id: "note_" + Math.random().toString(36).substring(2, 9),
      title: isFa ? "یادداشت پژوهشی بدون عنوان" : "Untitled Research Draft",
      content: isFa ? "جزئیات یادداشت جدید خود را اینجا بنویسید..." : "Type your research draft details here...",
      tags: [isFa ? "پیش‌نویس" : "Draft"],
      folder: isFa ? "عمومی" : "General",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onUpdateState({
      ...state,
      notes: [newNote, ...state.notes],
    });
    setActiveNoteId(newNote.id);
    setNoteTitle(newNote.title);
    setNoteContent(newNote.content);
    setNoteTags(isFa ? "پیش‌نویس" : "Draft");
    setNoteFolder(isFa ? "عمومی" : "General");

    onAddXP(15, "note", "Drafted a research note");
  };

  const handleSaveNote = () => {
    if (!activeNoteId) return;

    const updated = state.notes.map((n) => {
      if (n.id === activeNoteId) {
        return {
          ...n,
          title: noteTitle.trim() || (lang === "fa" ? "بدون عنوان" : "Untitled Note"),
          content: noteContent,
          tags: noteTags.split(",").map((t) => t.trim()).filter(Boolean),
          folder: noteFolder,
          updatedAt: new Date().toISOString(),
        };
      }
      return n;
    });

    onUpdateState({
      ...state,
      notes: updated,
    });
    alert(lang === "fa" ? "یادداشت شما با موفقیت ذخیره شد!" : "Note saved successfully!");
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = state.notes.filter((n) => n.id !== noteId);
    onUpdateState({
      ...state,
      notes: updated,
    });
    if (activeNoteId === noteId) {
      setActiveNoteId(null);
      setNoteTitle("");
      setNoteContent("");
    }
  };

  // AI Integrations calls to server-side helper
  const handleAIAction = async (action: "summarize" | "flashcards" | "quiz") => {
    if (!noteContent.trim()) {
      alert(
        lang === "fa"
          ? "لطفا ابتدا مقداری محتوا داخل یادداشت بنویسید!"
          : "Please write some content inside the note first!"
      );
      return;
    }

    setAiLoading(true);
    setAiSummary("");
    setFlashcards([]);
    setQuizQuestions([]);
    setQuizScore(null);
    setUserAnswers({});

    try {
      const response = await fetch("/api/gemini/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent, action }),
      });

      if (!response.ok) throw new Error("Notes helper service failed");
      const data = await response.json();

      if (action === "summarize") {
        setAiSummary(data.result);
        onAddXP(20, "note", "Summarized note with Gemini AI");
      } else if (action === "flashcards") {
        // Parse the flashcards JSON
        const parsed = JSON.parse(data.result);
        setFlashcards(parsed);
        onAddXP(30, "note", "Generated flashcards for study");
      } else if (action === "quiz") {
        // Parse MCQ Quiz JSON
        const parsed = JSON.parse(data.result);
        setQuizQuestions(parsed);
        onAddXP(35, "note", "Generated mock preparation quiz");
      }
    } catch (err) {
      console.error(err);
      alert(
        lang === "fa"
          ? "خطا در برقراری ارتباط با سرور هوش مصنوعی جمینی. لطفا تنظیمات > کلیدهای مخفی را بررسی کنید."
          : "Failed to parse response or contact Gemini server. Ensure Settings > Secrets."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectNote = (note: Note) => {
    setActiveNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteTags(note.tags.join(", "));
    setNoteFolder(note.folder);
    
    // Clear AI values on switch
    setAiSummary("");
    setFlashcards([]);
    setQuizQuestions([]);
    setQuizScore(null);
  };

  const handleSolveQuiz = () => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) {
        score += 1;
      }
    });
    setQuizScore(score);
    // Award bonus XP for perfect score!
    if (score === quizQuestions.length) {
      onAddXP(50, "quiz", "Passed practice quiz with 100%");
    } else {
      onAddXP(20, "quiz", "Completed practice quiz");
    }
  };

  const folders = lang === "fa"
    ? ["همه", "مطالعه", "شخصی", "برنامه‌نویسی", "اهداف", "عمومی"]
    : ["All", "Study", "Personal", "Code", "Goals", "General"];

  const filteredNotes = state.notes.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Support English or Persian folder name matches
    let matchesFolder = false;
    if (selectedFolder === "All" || selectedFolder === "همه") {
      matchesFolder = true;
    } else {
      // Map folders between languages if needed
      const folderIdx = folders.indexOf(selectedFolder);
      const enFolders = ["All", "Study", "Personal", "Code", "Goals", "General"];
      const targetFolderEn = folderIdx !== -1 ? enFolders[folderIdx] : selectedFolder;
      
      matchesFolder = n.folder === selectedFolder || n.folder === targetFolderEn;
    }

    return matchesSearch && matchesFolder;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir={lang === "fa" ? "rtl" : "ltr"}>
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 text-right">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2.5 justify-start">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            {lang === "fa" ? "یادداشت‌های پژوهشی و کوییز هوشمند" : "Study Notes & AI Quiz"}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {lang === "fa"
              ? "فایل‌های پژوهشی خود را ذخیره کنید و اجازه دهید هوش مصنوعی جمینی خلاصه، فلش‌کارت و آزمون‌های چندگزینه‌ای را آماده کند."
              : "Store research files, and let Gemini compile high-impact summaries, flashcards, and MCQ exams."}
          </p>
        </div>

        <button
          onClick={handleCreateNote}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all duration-150 flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {lang === "fa" ? "ایجاد یادداشت جدید" : "Create Draft Note"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Side: Note List & Folders */}
        <div className="space-y-4">
          {/* Folders filter selection */}
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 space-y-2 text-right">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              {lang === "fa" ? "پوشه‌ها" : "Folders"}
            </h4>
            <div className="space-y-1">
              {folders.map((f, idx) => {
                // Map folders back to find actual counts if name is in Persian
                const enFolders = ["All", "Study", "Personal", "Code", "Goals", "General"];
                const fEn = lang === "fa" ? enFolders[idx] : f;
                const count = fEn === "All"
                  ? state.notes.length
                  : state.notes.filter((n) => n.folder === fEn || n.folder === f).length;

                return (
                  <button
                    key={f}
                    onClick={() => setSelectedFolder(f)}
                    className={`w-full text-right text-xs px-3 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                      selectedFolder === f
                        ? "bg-slate-800 text-white font-semibold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <span>{f}</span>
                    <span className="text-[10px] bg-slate-950/40 px-2 py-0.5 rounded-full font-mono">
                      {toPersianDigits(count, usePersianNums)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search bar and list */}
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 space-y-3 text-right">
            <div className="relative">
              <Search className={`absolute ${lang === "fa" ? "right-3" : "left-3"} top-2.5 w-4 h-4 text-slate-500`} />
              <input
                type="text"
                placeholder={lang === "fa" ? "جستجوی یادداشت‌ها..." : "Search notes content..."}
                className={`w-full bg-slate-950 border border-slate-800 rounded-xl ${lang === "fa" ? "pr-9 pl-3" : "pl-9 pr-3"} py-1.5 text-xs text-slate-200 focus:outline-none text-right`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">
                  {lang === "fa" ? "هیچ یادداشتی یافت نشد." : "No research notes."}
                </p>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`p-3 rounded-xl border text-right cursor-pointer transition-all duration-150 relative ${
                      activeNoteId === note.id
                        ? "bg-slate-800/80 border-indigo-500/40"
                        : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/40"
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-200 truncate text-right">
                      {note.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-1 text-right">
                      {note.content.substring(0, 60)}
                    </p>
                    <div className="flex gap-1.5 mt-2 flex-wrap justify-start">
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-md font-mono">
                        {note.folder}
                      </span>
                      {note.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Note Editor & AI Assistant Box */}
        <div className="md:col-span-2 space-y-6 text-right">
          {activeNoteId ? (
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
              {/* Editors top row controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <input
                  type="text"
                  className="bg-transparent border-0 font-display font-bold text-lg text-white focus:outline-none focus:ring-0 flex-1 min-w-[200px] text-right"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                />

                <div className="flex items-center gap-2">
                  <select
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300 text-right"
                    value={noteFolder}
                    onChange={(e) => setNoteFolder(e.target.value)}
                  >
                    <option value="Study">{lang === "fa" ? "مطالعه" : "Study"}</option>
                    <option value="Personal">{lang === "fa" ? "شخصی" : "Personal"}</option>
                    <option value="Code">{lang === "fa" ? "برنامه‌نویسی" : "Code"}</option>
                    <option value="Goals">{lang === "fa" ? "اهداف" : "Goals"}</option>
                    <option value="General">{lang === "fa" ? "عمومی" : "General"}</option>
                  </select>

                  <button
                    onClick={handleSaveNote}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-xl transition-all duration-150 cursor-pointer"
                  >
                    {lang === "fa" ? "ذخیره یادداشت" : "Save Changes"}
                  </button>

                  <button
                    onClick={() => handleDeleteNote(activeNoteId)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tag Editor row */}
              <div className="flex items-center gap-2 text-xs bg-slate-950/40 p-2 rounded-xl border border-slate-800/60 justify-start">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder={lang === "fa" ? "برچسب‌ها (جداشده با ویرگول ، مانند: زیست‌شناسی، مغز)" : "Tags (separated by comma, e.g. chemistry, chapter4)"}
                  className="flex-1 bg-transparent border-0 text-slate-300 placeholder-slate-500 text-xs focus:outline-none text-right"
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                />
              </div>

              {/* Editable Text Area */}
              <textarea
                className="w-full min-h-[180px] bg-transparent border-0 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:ring-0 resize-none text-right"
                placeholder={lang === "fa" ? "شروع به نوشتن جزئیات یادداشت کنید. مطالب پژوهشی، خلاصه جلسات و فرمول‌ها را وارد کنید..." : "Start drafting notes details. Write equations, research content, and details..."}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />

              {/* AI Suite triggers */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3 text-right">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 justify-start">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>{lang === "fa" ? "ابزارهای هوشمند مطالعه با جمینی" : "Interactive AI Study Tools"}</span>
                </div>

                <div className="flex flex-wrap gap-2 justify-start">
                  <button
                    onClick={() => handleAIAction("summarize")}
                    disabled={aiLoading}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    {lang === "fa" ? "خلاصه‌سازی متن" : "Summarize text"}
                  </button>
                  <button
                    onClick={() => handleAIAction("flashcards")}
                    disabled={aiLoading}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    {lang === "fa" ? "تولید فلش‌کارت" : "Generate Flashcards"}
                  </button>
                  <button
                    onClick={() => handleAIAction("quiz")}
                    disabled={aiLoading}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    {lang === "fa" ? "تولید آزمون تستی" : "Generate Exam Quiz"}
                  </button>
                </div>

                {aiLoading && (
                  <p className="text-xs text-indigo-400 animate-pulse mt-2 flex items-center gap-1.5 justify-start">
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                    {lang === "fa" ? "هوش مصنوعی جمینی در حال تحلیل محتوا... لطفا صبور باشید." : "Gemini AI analyzing content... please wait."}
                  </p>
                )}

                {/* AI Summary result */}
                {aiSummary && (
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-right space-y-2 animate-in fade-in">
                    <p className="text-xs font-semibold text-slate-300">
                      {lang === "fa" ? "خلاصه تولیدشده توسط هوش مصنوعی" : "AI Generated Summary"}
                    </p>
                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap text-right">
                      {aiSummary}
                    </div>
                  </div>
                )}

                {/* Flashcards View */}
                {flashcards.length > 0 && (
                  <div className="space-y-2 animate-in fade-in text-right">
                    <p className="text-xs font-semibold text-slate-300">
                      {lang === "fa" ? `فلش‌کارت‌های مطالعه (${toPersianDigits(flashcards.length, usePersianNums)})` : `Study Flashcards (${flashcards.length})`}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {flashcards.map((card, idx) => {
                        const isRevealed = revealedFlashcardIdx === idx;
                        return (
                          <div
                            key={idx}
                            onClick={() =>
                              setRevealedFlashcardIdx(
                                isRevealed ? null : idx
                              )
                            }
                            className="p-4 rounded-xl border bg-slate-950/60 hover:bg-slate-950 border-slate-800 text-center cursor-pointer min-h-[100px] flex flex-col justify-between items-center transition-all"
                          >
                            <span className="text-[9px] uppercase tracking-widest text-slate-500">
                              {isRevealed ? (lang === "fa" ? "پاسخ" : "Answer") : (lang === "fa" ? "پرسش" : "Question")}
                            </span>
                            <p className="text-xs text-slate-200 font-semibold mt-1 text-center">
                              {isRevealed ? card.answer : card.question}
                            </p>
                            <span className="text-[9px] text-indigo-400 font-mono mt-2">
                              {lang === "fa" ? "لمس برای چرخش" : "Tap to flip"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Interactive Practice Quiz */}
                {quizQuestions.length > 0 && (
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-right space-y-4 animate-in fade-in">
                    <div className="flex justify-between items-center gap-4">
                      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                        {lang === "fa" ? "حالت کوییز آزمایشی" : "Practice Quiz Mode"}
                      </p>
                      {quizScore !== null && (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg font-mono">
                          {lang === "fa" ? "امتیاز کسب‌شده:" : "Score:"} {toPersianDigits(quizScore, usePersianNums)} / {toPersianDigits(quizQuestions.length, usePersianNums)}
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      {quizQuestions.map((q, qIdx) => (
                        <div key={qIdx} className="space-y-1.5 text-right">
                          <p className="text-xs font-semibold text-slate-200">
                            {lang === "fa" ? "سوال" : "Q"}{toPersianDigits(qIdx + 1, usePersianNums)}: {q.question}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {q.options.map((opt, oIdx) => {
                              const isSelected = userAnswers[qIdx] === oIdx;
                              return (
                                <button
                                  key={oIdx}
                                  onClick={() =>
                                    setUserAnswers({
                                      ...userAnswers,
                                      [qIdx]: oIdx,
                                    })
                                  }
                                  className={`text-right text-xs px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-indigo-600 border-indigo-500 text-white"
                                      : "bg-slate-900 border-slate-800/80 text-slate-300 hover:bg-slate-800"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleSolveQuiz}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      {lang === "fa" ? "ثبت و تصحیح پاسخ‌ها" : "Grade Quiz Answers"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-2 animate-pulse" />
              <h3 className="text-slate-300 text-sm font-semibold">
                {lang === "fa" ? "هیچ یادداشت پژوهشی انتخاب نشده است" : "No active research note selected"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === "fa"
                  ? "یکی از پیش‌نویس‌ها را از ستون کناری انتخاب کنید یا یک یادداشت جدید بسازید."
                  : "Select a draft from the side listing or formulate a new research file."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
