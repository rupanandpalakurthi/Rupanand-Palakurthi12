import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Trash2, 
  Sparkles, 
  Edit3, 
  Save, 
  X, 
  Search, 
  BookOpen, 
  Check, 
  Download, 
  FileDown, 
  HelpCircle,
  Clock
} from "lucide-react";
import { soundEngine } from "../utils/soundEngine";

interface Note {
  id: string;
  title: string;
  content: string;
  subjectId: string;
  createdAt: string;
  isAiInsight?: boolean;
}

interface DigitalNotepadProps {
  currentSubjectId: string;
  activeAiExplanation: { text: string; source: string } | null;
  onActivityComplete?: (xp: number) => void;
}

const SUBJECT_LABELS: Record<string, string> = {
  all: "All Subjects",
  biology: "Cell Biology 🧬",
  physics: "Quantum Physics ⚛️",
  computer_science: "Machine Logic 💻",
};

export default function DigitalNotepad({ 
  currentSubjectId, 
  activeAiExplanation, 
  onActivityComplete 
}: DigitalNotepadProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  
  // Note Creator form states
  const [isCreating, setIsCreating] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteSubject, setNoteSubject] = useState(currentSubjectId);
  
  // Note edit state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Load notes from localStorage on component mount
  const loadNotes = () => {
    const savedNotes = localStorage.getItem("edusphere_digital_notes");
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error("Failed to parse saved notes", e);
      }
    } else {
      // Seed some helpful initial tutorial notes
      const seedNotes: Note[] = [
        {
          id: "seed-1",
          title: "Osmosis Definition 🧪",
          content: "Osmosis is the net movement of water molecules across a semipermeable membrane from a region of higher water potential to a region of lower water potential. Hypertonic = salty outside, cells shrink! Hypotonic = salty inside, cells swell!",
          subjectId: "biology",
          createdAt: new Date().toLocaleString(),
          isAiInsight: false
        },
        {
          id: "seed-2",
          title: "Escape Velocity Formula 🌌",
          content: "To escape planetary gravity completely: v = sqrt(2GM/r). If a star's radius shrinks below its gravitational event horizon radius, the escape speed exceeds the velocity of light, forming a Black Hole!",
          subjectId: "physics",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toLocaleString(),
          isAiInsight: true
        }
      ];
      setNotes(seedNotes);
      localStorage.setItem("edusphere_digital_notes", JSON.stringify(seedNotes));
    }
  };

  useEffect(() => {
    loadNotes();

    const handleNotesRefresh = () => {
      loadNotes();
    };

    window.addEventListener("edusphere_notes_refresh", handleNotesRefresh);
    return () => {
      window.removeEventListener("edusphere_notes_refresh", handleNotesRefresh);
    };
  }, []);

  // Sync selected subject with active screen category
  useEffect(() => {
    setNoteSubject(currentSubjectId);
  }, [currentSubjectId]);

  const saveNotesToStorage = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem("edusphere_digital_notes", JSON.stringify(updatedNotes));
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    soundEngine.playSuccess();
    
    const newNote: Note = {
      id: "note_" + Date.now(),
      title: noteTitle.trim(),
      content: noteContent.trim(),
      subjectId: noteSubject,
      createdAt: new Date().toLocaleString(),
      isAiInsight: false
    };

    const updated = [newNote, ...notes];
    saveNotesToStorage(updated);

    // Reset Form
    setNoteTitle("");
    setNoteContent("");
    setIsCreating(false);

    // Reward active user experience
    if (onActivityComplete) {
      onActivityComplete(5); // +5 XP for active synthesis/jotting notes!
    }
  };

  // Easily import current active AI explanation as a high-value note!
  const handleImportAiInsight = () => {
    if (!activeAiExplanation) return;
    soundEngine.playSuccessCelebration();

    const cleanTitle = `ROBY Insight: ${activeAiExplanation.source.replace("#", "")}`;
    const newNote: Note = {
      id: "note_ai_" + Date.now(),
      title: cleanTitle,
      content: activeAiExplanation.text,
      subjectId: currentSubjectId,
      createdAt: new Date().toLocaleString(),
      isAiInsight: true
    };

    const updated = [newNote, ...notes];
    saveNotesToStorage(updated);

    if (onActivityComplete) {
      onActivityComplete(10); // Reward 10 XP points for active cognitive mapping!
    }
  };

  const handleDeleteNote = (id: string) => {
    soundEngine.playClick();
    const filtered = notes.filter(n => n.id !== id);
    saveNotesToStorage(filtered);
    
    if (editingNoteId === id) {
      setEditingNoteId(null);
    }
  };

  const startEditing = (note: Note) => {
    soundEngine.playClick();
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim() || !editContent.trim()) return;
    soundEngine.playSuccess();

    const updated = notes.map(note => {
      if (note.id === id) {
        return {
          ...note,
          title: editTitle.trim(),
          content: editContent.trim()
        };
      }
      return note;
    });

    saveNotesToStorage(updated);
    setEditingNoteId(null);
  };

  const handleCancelEdit = () => {
    soundEngine.playClick();
    setEditingNoteId(null);
  };

  // Download notepad contents as a text file for complete offline review!
  const handleExportTextFile = () => {
    soundEngine.playSuccessCelebration();
    const formattedText = notes.map(n => (
      `========================================\n` +
      `TITLE: ${n.title}\n` +
      `SUBJECT: ${SUBJECT_LABELS[n.subjectId] || n.subjectId}\n` +
      `DATE: ${n.createdAt}\n` +
      `TYPE: ${n.isAiInsight ? "ROBY AI Assistant Insight" : "Custom User Entry"}\n` +
      `========================================\n` +
      `${n.content}\n\n`
    )).join("\n");

    const element = document.createElement("a");
    const file = new Blob([formattedText], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = "BrightMind_My_Study_Notes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Filter notes based on subject and text keyword matches
  const filteredNotes = notes.filter(note => {
    const matchesSubject = selectedFilter === "all" || note.subjectId === selectedFilter;
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="glass-card rounded-3xl p-6 relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
      {/* Glow decorative assets */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/10">
            <FileText className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-display font-black text-white text-sm sm:text-base tracking-wide flex items-center gap-1.5">
              Digital Lab Notebook <span className="text-[10px] bg-cyan-400/20 text-cyan-300 font-mono uppercase tracking-wide px-2 py-0.5 rounded border border-cyan-400/30">Offline Storage</span>
            </h3>
            <p className="text-[11px] text-white/50">Save formulas, record cellular structures and preserve tutor insights</p>
          </div>
        </div>

        {/* Global Export File action button */}
        {notes.length > 0 && (
          <button
            onClick={handleExportTextFile}
            className="self-start sm:self-center px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-400/30 text-[11px] font-bold text-cyan-300 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Download notes to physical device as Text File"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Notes (.txt)</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* LEFT COLUMN: Controls, Custom note form & Search */}
        <div className="col-span-1 lg:col-span-5 space-y-4">
          
          {/* Direct AI Insight Capture Banner */}
          {activeAiExplanation ? (
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-cyan-950/30 via-purple-950/20 to-transparent border border-cyan-400/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl" />
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
                  <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-cyan-200">Captured Active AI Explanation!</h4>
                  <p className="text-[11px] text-white/60 line-clamp-2 mt-1 italic">
                    "{activeAiExplanation.text}"
                  </p>
                  <p className="text-[9.5px] text-cyan-400 font-mono mt-1.5 uppercase">
                    From: {activeAiExplanation.source}
                  </p>
                  
                  <button
                    onClick={handleImportAiInsight}
                    className="mt-3 px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 font-extrabold text-[10px] text-black tracking-wide flex items-center gap-1 transition-all rounded-lg cursor-pointer shadow-lg"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                    <span>Save to Notepad (+10 XP)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-white/40">
              <p>🤖 Active tutorial insight not detected yet.</p>
              <p className="text-[10px] text-white/35 mt-1">Select any hotspot or interact with the simulator above to load capture-ready smart content.</p>
            </div>
          )}

          {/* New Custom Notes Creator Toggle or Form */}
          {isCreating ? (
            <form onSubmit={handleCreateNote} className="space-y-3 bg-black/30 border border-white/10 p-4 rounded-2xl animate-fade-in text-left">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-white tracking-wide">Add Custom Note</span>
                <button 
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setIsCreating(false);
                  }}
                  className="p-1 rounded bg-white/5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-white/40 uppercase">Note Title</label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value.slice(0, 50))}
                  placeholder="e.g., Hypotonic vs Hypertonic"
                  className="w-full bg-black/40 border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/20"
                />
              </div>

              {/* Content textarea */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-white/40 uppercase">Insight Content</label>
                <textarea
                  required
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Draft your synthesized conclusions, formulas, or logical notes..."
                  className="w-full bg-black/40 border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/20 resize-none font-sans"
                />
              </div>

              {/* Subject selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-white/40 uppercase">Module Category</label>
                <select
                  value={noteSubject}
                  onChange={(e) => setNoteSubject(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-xs text-white/80 rounded-xl px-2.5 py-2 outline-none focus:border-cyan-400/60"
                >
                  <option value="biology">Cell Biology 🧬</option>
                  <option value="physics">Quantum Physics ⚛️</option>
                  <option value="computer_science">Machine Logic 💻</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Save Note (+5 XP)</span>
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsCreating(true);
              }}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs text-slate-300 hover:text-white font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border-dashed"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Draft Custom Insights & Notes</span>
            </button>
          )}

          {/* Filtering & Live Search Controls */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
            <span className="text-[10px] font-mono text-white/40 block uppercase tracking-wide">Filter & Query Notes</span>
            
            {/* Search Input bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes content..."
                className="w-full bg-black/40 border border-white/10 text-white text-[11px] rounded-xl pl-9 pr-3 py-2 outline-none focus:border-cyan-400/40"
              />
            </div>

            {/* Subject Selector Tabs */}
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(SUBJECT_LABELS).map(([id, label]) => {
                const isSelected = selectedFilter === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedFilter(id);
                    }}
                    className={`p-1.5 rounded-lg text-[10px] text-center border font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500/15 border-cyan-400 text-cyan-300"
                        : "bg-black/35 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {label.split(" ").slice(0, 2).join(" ")}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Scrolled Notes Deck */}
        <div className="col-span-1 lg:col-span-7 space-y-3 scrollbar-thin max-h-[460px] overflow-y-auto pr-1">
          {filteredNotes.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-white/5 bg-black/20 text-white/30 flex flex-col items-center justify-center">
              <BookOpen className="w-8 h-8 opacity-20 mb-2.5 text-cyan-400" />
              <p className="text-xs font-semibold">No custom notes cataloged matching this filter.</p>
              <p className="text-[10px] text-white/20 mt-1">Start drafting custom findings or load AI-guided highlights into your catalog.</p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isEditing = editingNoteId === note.id;

              return (
                <div 
                  key={note.id}
                  className={`p-4 rounded-2xl border transition-all text-left relative group ${
                    note.isAiInsight 
                      ? "bg-gradient-to-r from-purple-950/20 via-slate-900/40 to-black/30 border-purple-500/25" 
                      : "bg-white/5 border-white/5 hover:border-white/15"
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value.slice(0, 50))}
                        className="w-full bg-black/60 border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-cyan-400"
                      />
                      <textarea
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-400 font-sans resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={handleCancelEdit}
                          className="px-2.5 py-1 text-[10px] bg-white/5 border border-white/10 text-slate-300 rounded hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(note.id)}
                          className="px-2.5 py-1 text-[10px] bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded cursor-pointer"
                        >
                          Save Updates
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Note Header bar info */}
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-display font-bold text-white text-xs sm:text-sm tracking-wide">
                              {note.title}
                            </h4>
                            {note.isAiInsight && (
                              <span className="text-[8.5px] bg-purple-950 text-purple-300 border border-purple-500/20 px-1.5 py-0.2 rounded font-black uppercase tracking-wider flex items-center gap-0.5">
                                <Sparkles className="w-2 h-2 text-yellow-300 animate-pulse" /> AI INSIGHT
                              </span>
                            )}
                            <span className="text-[9px] bg-white/5 border border-white/10 text-white/40 px-1.5 py-0.2 rounded font-mono uppercase tracking-wider">
                              {note.subjectId}
                            </span>
                          </div>
                          
                          {/* Date and time */}
                          <p className="text-[9.5px] text-white/35 font-mono flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-white/20" />
                            <span>{note.createdAt}</span>
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/5 opacity-40 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => startEditing(note)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
                            title="Edit Note text"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                            title="Delete this note permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content text */}
                      <p className="text-[11.5px] text-white/85 leading-relaxed mt-2.5 whitespace-pre-wrap font-sans">
                        {note.content}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
