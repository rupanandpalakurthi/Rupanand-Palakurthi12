import React, { useState, useEffect } from "react";
import { 
  Clock, 
  Brain, 
  Award, 
  Zap, 
  X, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { soundEngine } from "../utils/soundEngine";
import confetti from "canvas-confetti";

interface QuickCheckPopupProps {
  currentSubjectId: string;
  activeExplanation: { text: string; source: string } | null;
  onRewardXP: (amount: number) => void;
}

const MODULE_NAMES: Record<string, string> = {
  biology: "Cellular Biology 🧬",
  physics: "Quantum Gravitational Laws ⚛️",
  computer_science: "Machine Logic & CPU States 💻"
};

export default function QuickCheckPopup({ 
  currentSubjectId, 
  activeExplanation, 
  onRewardXP 
}: QuickCheckPopupProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [recapText, setRecapText] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>("");

  useEffect(() => {
    // Standard timer ticking down from 120 seconds
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowPopup(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Allow simulator to trigger this instantly for quick grading demonstration
  const handleSimulateTrigger = () => {
    soundEngine.playClick();
    setSecondsRemaining(0);
    setShowPopup(true);
    setIsSubmitted(false);
  };

  const handleClose = () => {
    soundEngine.playClick();
    setShowPopup(false);
    // Restart active timer for another 2 minutes of reinforcing learning
    setSecondsRemaining(120);
    setRecapText("");
    setIsSubmitted(false);
    setValidationError("");
  };

  const handleSubmitRecap = (e: React.FormEvent) => {
    e.preventDefault();
    if (recapText.trim().length < 15) {
      soundEngine.playClick();
      setValidationError("Please share a bit more detail (at least 15 characters) to earn the bonus XP!");
      return;
    }

    setValidationError("");
    setIsSubmitted(true);
    
    // Play celebratory cues
    soundEngine.playSuccessCelebration();
    triggerCelebrationPulse();

    // Reward XP (+30 XP)
    onRewardXP(30);

    // Save summary note to localStorage
    const savedNotesRaw = localStorage.getItem("edusphere_digital_notes");
    let currentNotes = [];
    if (savedNotesRaw) {
      try {
        currentNotes = JSON.parse(savedNotesRaw);
      } catch (err) {
        console.error(err);
      }
    }

    const completedSubject = MODULE_NAMES[currentSubjectId] || currentSubjectId;
    const newNote = {
      id: "quick_recap_" + Date.now(),
      title: `🏁 Recap: ${completedSubject}`,
      content: recapText.trim(),
      subjectId: currentSubjectId,
      createdAt: new Date().toLocaleString(),
      isAiInsight: true
    };

    const updated = [newNote, ...currentNotes];
    localStorage.setItem("edusphere_digital_notes", JSON.stringify(updated));

    // Force Lab Notebook and other listeners to refresh instantly
    window.dispatchEvent(new Event("edusphere_notes_refresh"));

    // Subtle automatic safety timeout to close
    setTimeout(() => {
      setShowPopup(false);
      setSecondsRemaining(120); // Reset timer
      setRecapText("");
      setIsSubmitted(false);
    }, 4500);
  };

  const triggerCelebrationPulse = () => {
    const end = Date.now() + (2 * 1000);
    const colors = ["#22d3ee", "#a78bfa", "#3b82f6"];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  // Human-readable format format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentSubjectName = MODULE_NAMES[currentSubjectId] || currentSubjectId;

  return (
    <>
      {/* 1. Subtle, aesthetic floating ticker bar showing next quick check scheduling */}
      <div className="fixed bottom-4 right-4 z-40 bg-slate-950/80 hover:bg-slate-950 border border-white/10 p-3 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md max-w-sm transition-all sm:flex">
        <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400">
          <Clock className="w-4 h-4 animate-pulse text-cyan-400" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/55">QUICK CHECK TIMELINE:</span>
            <span className="text-xs font-mono font-black text-cyan-300">
              {secondsRemaining > 0 ? formatTime(secondsRemaining) : "READY"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-white/40">Cognitive reinforcement checkpoint</p>
            <button
              onClick={handleSimulateTrigger}
              className="text-[9px] bg-cyan-400/20 hover:bg-cyan-400 text-cyan-300 hover:text-black font-mono font-bold px-1.5 py-0.2 rounded border border-cyan-400/30 transition-all cursor-pointer"
              title="Skip wait period and trigger pop-up instantly"
            >
              Simulate Trigger
            </button>
          </div>
        </div>
      </div>

      {/* 2. Glassmorphic Modal Dialog Box Overlay */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-950 border border-white/15 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl shadow-cyan-500/5 animate-scale-up">
            
            {/* Visual background ambient details */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/15 rounded-full blur-[80px] pointer-events-none" />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
              title="Close and continue exploration"
            >
              <X className="w-4 h-4" />
            </button>

            {!isSubmitted ? (
              <form onSubmit={handleSubmitRecap} className="space-y-5 relative z-10">
                {/* Modal Title Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] bg-cyan-400/20 text-cyan-300 font-mono uppercase tracking-widest px-2 py-0.5 rounded border border-cyan-400/30">COGNITIVE ACTIVE RETRIEVAL</span>
                    <h3 className="font-display font-black text-xl text-white tracking-tight mt-1">
                      Quick Check-In Reflection!
                    </h3>
                  </div>
                </div>

                {/* Helpful instructions */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/70 leading-relaxed">
                  <p>
                    Amazing study focus! You have been interacting with <strong>{currentSubjectName}</strong>. 
                    Actively putting details in your own words physically fires neurons to store knowledge in secure memory. 
                  </p>
                  <p className="mt-2 text-cyan-300 font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    Complete this recap to secure a bonus <strong>+30 XP</strong> and automatically save it to your Lab Journal!
                  </p>
                </div>

                {/* The Recapping textarea */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
                    What are 1-2 key insights, rules, or formulas you've gathered so far?
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={recapText}
                    onChange={(e) => {
                      setRecapText(e.target.value);
                      if (e.target.value.trim().length >= 15) {
                        setValidationError("");
                      }
                    }}
                    placeholder="e.g., I learned that plant and animal organelles contain vacuoles. Hypotonic osmotic conditions can expand cell volume. Also evaluated escaping stellar gravity with escape velocity calculations..."
                    className="w-full bg-black/60 border border-white/15 text-white placeholder-slate-500 text-xs rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 font-sans resize-none"
                  />
                  <div className="flex justify-between items-center text-[10px] font-mono text-white/40 mt-1">
                    <span>Minimum 15 characters</span>
                    <span className={recapText.trim().length >= 15 ? "text-emerald-400 font-bold" : "text-amber-400"}>
                      {recapText.trim().length} characters
                    </span>
                  </div>
                </div>

                {validationError && (
                  <p className="text-rose-400 text-xs font-semibold animate-pulse">
                    ⚠ {validationError}
                  </p>
                )}

                {/* Actions banner */}
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/5"
                  >
                    Maybe Later
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400 text-black rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-400/10"
                  >
                    <span>Secure Bonus +30 XP</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </form>
            ) : (
              // Celebration success stage!
              <div className="text-center py-8 space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-2xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8 animate-bounce text-emerald-400" />
                </div>
                
                <h4 className="font-display font-black text-xl text-white">
                  Reflection Successfully Logged!
                </h4>
                
                <div className="bg-white/5 p-4 rounded-2xl max-w-sm mx-auto border border-white/5">
                  <p className="text-xs text-slate-300 italic">
                    "{recapText.slice(0, 160)}{recapText.length > 160 ? "..." : ""}"
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-amber-300 bg-amber-400/10 p-2 rounded-xl max-w-[200px] mx-auto border border-amber-400/20">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>+30 XP Securing Bonus!</span>
                </div>

                <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                  Writing and recording saved note instantly to Digital Lab Journal
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
