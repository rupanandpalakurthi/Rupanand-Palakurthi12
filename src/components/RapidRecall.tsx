import React, { useState, useEffect } from "react";
import { SUBJECTS, MatchingPair } from "../data";
import { 
  Sparkles, 
  HelpCircle, 
  RotateCw, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  Heart, 
  RotateCcw,
  Volume2
} from "lucide-react";
import { soundEngine } from "../utils/soundEngine";

interface RapidRecallProps {
  currentSubjectId: string;
  onRewardXP: (amount: number) => void;
}

export default function RapidRecall({ currentSubjectId, onRewardXP }: RapidRecallProps) {
  const [activeSubject, setActiveSubject] = useState<string>("all");
  const [deck, setDeck] = useState<(MatchingPair & { subjectId: string; mastered: boolean })[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState<{ mastered: number; reviewed: number }>({ mastered: 0, reviewed: 0 });

  // Load and combine vocabulary deck when subject or available list changes
  useEffect(() => {
    setActiveSubject(currentSubjectId);
  }, [currentSubjectId]);

  useEffect(() => {
    buildDeck();
  }, [activeSubject]);

  const buildDeck = () => {
    let items: (MatchingPair & { subjectId: string; mastered: boolean })[] = [];
    
    if (activeSubject === "all") {
      Object.keys(SUBJECTS).forEach((subjId) => {
        SUBJECTS[subjId].matchingPairs.forEach((pair) => {
          items.push({ ...pair, subjectId: subjId, mastered: false });
        });
      });
    } else if (SUBJECTS[activeSubject]) {
      SUBJECTS[activeSubject].matchingPairs.forEach((pair) => {
        items.push({ ...pair, subjectId: activeSubject, mastered: false });
      });
    }

    // Shuffle the deck for active recall training!
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setFlippedCards({});
    setScore({ mastered: 0, reviewed: 0 });
  };

  const handleNext = () => {
    soundEngine.playClick();
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((p) => p + 1);
    } else {
      // Loop around
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    soundEngine.playClick();
    if (currentIndex > 0) {
      setCurrentIndex((p) => p - 1);
    } else {
      setCurrentIndex(deck.length - 1);
    }
  };

  // Flip manually on click for touch screen compliance
  const handleToggleFlip = (cardId: string) => {
    soundEngine.playClick();
    setFlippedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const markMastered = (index: number) => {
    if (deck[index]?.mastered) return;
    
    soundEngine.playSuccess();
    
    const updatedDeck = [...deck];
    updatedDeck[index].mastered = true;
    setDeck(updatedDeck);

    setScore(prev => ({
      mastered: prev.mastered + 1,
      reviewed: prev.reviewed + 1
    }));

    // Award +5 XP for active recall memorization
    onRewardXP(5);
  };

  const markStudyAgain = () => {
    soundEngine.playClick();
    setScore(prev => ({
      ...prev,
      reviewed: prev.reviewed + 1
    }));
    
    // Push card to the end of the line so they can try again
    const updatedDeck = [...deck];
    const currentCard = updatedDeck[currentIndex];
    
    if (updatedDeck.length > 1) {
      // Move to end
      updatedDeck.splice(currentIndex, 1);
      updatedDeck.push(currentCard);
      setDeck(updatedDeck);
      setFlippedCards(prev => ({ ...prev, [currentCard.id]: false }));
    }
  };

  const handleResetSession = () => {
    soundEngine.playSuccessCelebration();
    buildDeck();
  };

  const activeCard = deck[currentIndex];
  const progressPercent = deck.length > 0 ? ((currentIndex + 1) / deck.length) * 100 : 0;

  const getSubjectColor = (subjId: string) => {
    switch (subjId) {
      case "biology": return "from-cyan-500/10 to-teal-500/10 border-cyan-400/30 text-cyan-300";
      case "physics": return "from-purple-500/10 to-pink-500/10 border-purple-400/30 text-purple-300";
      case "computer_science": return "from-pink-500/10 to-rose-500/10 border-pink-400/30 text-pink-300";
      default: return "from-slate-500/10 to-slate-700/10 border-white/10 text-slate-300";
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
      {/* Glow highlight anchors */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/10">
            <RotateCw className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="font-display font-black text-white text-sm sm:text-base tracking-wide flex items-center gap-1.5">
              Rapid Recall Flashcards <span className="text-[10px] bg-amber-400/20 text-amber-300 font-mono uppercase tracking-wide px-2 py-0.5 rounded border border-amber-500/30 font-bold">SPACED REPETITION</span>
            </h3>
            <p className="text-[11px] text-white/50">Active recall study engine to preserve complex core terminological logic</p>
          </div>
        </div>

        {/* Level Filters inside widget */}
        <div className="flex items-center gap-1.5 self-start sm:self-center bg-black/40 p-1.5 rounded-xl border border-white/5">
          <button
            onClick={() => { soundEngine.playClick(); setActiveSubject("all"); }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubject === "all" ? "bg-amber-400 text-black shadow-md font-extrabold" : "text-slate-400 hover:text-white"
            }`}
          >
            All Subjects
          </button>
          <button
            onClick={() => { soundEngine.playClick(); setActiveSubject("biology"); }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubject === "biology" ? "bg-cyan-400 text-black shadow-md font-extrabold" : "text-slate-400 hover:text-white"
            }`}
          >
            Bio
          </button>
          <button
            onClick={() => { soundEngine.playClick(); setActiveSubject("physics"); }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubject === "physics" ? "bg-purple-400 text-black shadow-md font-extrabold" : "text-slate-400 hover:text-white"
            }`}
          >
            Physics
          </button>
          <button
            onClick={() => { soundEngine.playClick(); setActiveSubject("computer_science"); }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubject === "computer_science" ? "bg-pink-400 text-black shadow-md font-extrabold" : "text-slate-400 hover:text-white"
            }`}
          >
            CS
          </button>
        </div>
      </div>

      {deck.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-white/5 bg-black/20 text-white/30 flex flex-col items-center justify-center relative z-10">
          <BookOpen className="w-8 h-8 opacity-20 mb-2.5 text-orange-400" />
          <p className="text-xs font-semibold">Vocabulary Deck Empty</p>
          <p className="text-[10px] text-white/20 mt-1">Please select a valid module subject filter above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          
          {/* LEFT Display Column: Interactive Double-Sided Flashcard */}
          <div className="col-span-1 lg:col-span-7 flex flex-col items-center">
            
            <p className="text-[10px] font-mono text-white/40 uppercase mb-3 tracking-widest">
              Hover card to FLIP 3D or Click to hold
            </p>

            {/* FLIP CARD WRAPPER WITH PERSPECTIVE */}
            {activeCard && (
              <div 
                onClick={() => handleToggleFlip(activeCard.id)}
                className="w-full max-w-md h-64 [perspective:1200px] cursor-pointer group"
              >
                {/* INNER CARD ROTATOR */}
                <div 
                  className={`w-full h-full relative transition-transform duration-700 [transform-style:preserve-3d] ${
                    flippedCards[activeCard.id] 
                      ? "[transform:rotateY(180deg)]" 
                      : "group-hover:[transform:rotateY(180deg)]"
                  }`}
                >
                  
                  {/* FRONT SIDE (Term Concept card) */}
                  <div className="absolute inset-0 w-full h-full rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-black border-2 border-white/10 group-hover:border-orange-500/40 transition-colors shadow-2xl flex flex-col justify-between [backface-visibility:hidden] overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-xl" />
                    
                    {/* Active Header inside front */}
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[9.5px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> CONCEPT INQUIRY
                      </span>
                      <span className={`text-[8.5px] border px-1.5 py-0.2 rounded font-black uppercase font-mono tracking-wider ${getSubjectColor(activeCard.subjectId).split(" ").slice(2).join(" ")}`}>
                        {activeCard.subjectId.replace("_", " ")}
                      </span>
                    </div>

                    {/* Centered Large Term display */}
                    <div className="text-center my-auto px-4">
                      <h4 className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight leading-tight">
                        {activeCard.term}
                      </h4>
                      <p className="text-[10px] text-white/35 mt-3 uppercase tracking-wider font-mono">
                        Hold or hover to reveal explanation
                      </p>
                    </div>

                    {/* Card Footer indications */}
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>CARD {currentIndex + 1} OF {deck.length}</span>
                      <span className="text-orange-400">FLIP ➔</span>
                    </div>
                  </div>

                  {/* BACK SIDE (Definition solution) */}
                  <div className="absolute inset-0 w-full h-full rounded-3xl p-6 bg-gradient-to-tr from-slate-950 to-orange-950/20 border-2 border-orange-500/30 shadow-2xl flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-orange-400/5 rounded-full blur-xl" />

                    {/* Active Header inside back */}
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[9.5px] font-mono tracking-widest text-orange-400 uppercase flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" /> DEFINITIVE DECRYPT
                      </span>
                      <span className={`text-[8.5px] border px-1.5 py-0.2 rounded font-bold uppercase font-mono tracking-wider ${getSubjectColor(activeCard.subjectId).split(" ").slice(2).join(" ")}`}>
                        {activeCard.subjectId.replace("_", " ")}
                      </span>
                    </div>

                    {/* Centered Large explanation text */}
                    <div className="text-center my-auto px-1">
                      <p className="text-base text-white/90 leading-relaxed font-sans font-medium">
                        "{activeCard.definition}"
                      </p>
                    </div>

                    {/* Card Footer indications */}
                    <div className="flex justify-between items-center text-[10px] text-orange-300 font-mono">
                      <span>SOLVED CORE MEANING</span>
                      <span className="text-white/40">➔ TAP TO FRONT</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Navigation click deck controls */}
            <div className="flex items-center gap-4 mt-5">
              <button
                onClick={handlePrev}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all text-sm cursor-pointer"
                title="Previous card"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="text-xs font-mono font-semibold text-white/50 bg-black/35 py-1.5 px-3 rounded-lg border border-white/5">
                {currentIndex + 1} / {deck.length} CONCEPT CARDS
              </div>

              <button
                onClick={handleNext}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all text-sm cursor-pointer"
                title="Next card"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* RIGHT Display Column: Interactive review status scoring, XP multipliers & Stats */}
          <div className="col-span-1 lg:col-span-5 space-y-4">
            
            {/* Action Scoring controls */}
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-3.5 text-left">
              <span className="text-[10px] font-mono text-white/45 block uppercase tracking-wide">
                Evaluation Panel
              </span>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Try to state the concept translation inside your thoughts or aloud before flipping! Mark card performance below:
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={markStudyAgain}
                  className="py-2.5 px-3 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-300 hover:text-red-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Reshuffles current card to the backend of rotation for repetition"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Study Again</span>
                </button>
                
                <button
                  onClick={() => markMastered(currentIndex)}
                  disabled={deck[currentIndex]?.mastered}
                  className={`py-2.5 px-3 border text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    deck[currentIndex]?.mastered
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 opacity-60 cursor-not-allowed"
                      : "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20 text-emerald-300 hover:text-emerald-200"
                  }`}
                  title="Award +5 XP and complete concept record"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{deck[currentIndex]?.mastered ? "Mastered" : "Got It! (+5 XP)"}</span>
                </button>
              </div>
            </div>

            {/* Scoreboard panel progress metrics */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3.5 text-left">
              <div className="flex items-center justify-between text-[10px] font-mono text-white/45 uppercase tracking-wide">
                <span>RECALL PERFORMANCE metrics</span>
                <span className="text-orange-300 font-bold">
                  {Math.round((score.mastered / (score.reviewed || 1)) * 100)}% Accuracy
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5 text-center">
                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[9px] text-white/40 font-mono block uppercase">Mastered</span>
                  <span className="text-xl font-display font-black text-emerald-400">
                    {score.mastered}
                  </span>
                </div>
                
                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[9px] text-white/40 font-mono block uppercase">Total Reviewed</span>
                  <span className="text-xl font-display font-black text-slate-300">
                    {score.reviewed}
                  </span>
                </div>
              </div>

              {/* Progress bar and timeline marker */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-white/35 font-mono">
                  <span>SESSION STUDY METRICS</span>
                  <span>{currentIndex + 1} / {deck.length} DECK SLOTS</span>
                </div>
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-rose-400 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Reset Session control */}
              <button
                onClick={handleResetSession}
                className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 hover:text-white rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer border border-white/5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reshuffle & Restart Active Deck</span>
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
