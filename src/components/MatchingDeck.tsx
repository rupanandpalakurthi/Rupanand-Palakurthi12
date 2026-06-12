import React, { useState, useEffect } from "react";
import { MatchingPair } from "../data";
import { Sparkles, HelpCircle, Check, HelpCircle as HelpIcon, RotateCcw } from "lucide-react";
import { soundEngine } from "../utils/soundEngine";

interface MatchingDeckProps {
  subjectId: string;
  pairs: MatchingPair[];
  onActivityComplete: (xpPoints: number) => void;
}

export default function MatchingDeck({ subjectId, pairs, onActivityComplete }: MatchingDeckProps) {
  // Current active selections for click-to-pair
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  
  // High-fidelity matches trackers
  // Keys are term IDs, values are definition IDs that they got matched with
  const [currentMatches, setCurrentMatches] = useState<Record<string, string>>({});
  const [shuffledDefs, setShuffledDefs] = useState<MatchingPair[]>([]);
  const [feedback, setFeedback] = useState<Record<string, "correct" | "incorrect" | "default">>({});
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize and shuffle definitions
  useEffect(() => {
    resetGame();
  }, [subjectId, pairs]);

  const resetGame = () => {
    setSelectedTermId(null);
    setCurrentMatches({});
    setFeedback({});
    setIsCompleted(false);

    // Shuffle definitions independently to avoid giving away matches
    const shuffled = [...pairs].sort(() => Math.random() - 0.5);
    setShuffledDefs(shuffled);
  };

  // Click-to-pair handler
  const handleTermClick = (termId: string) => {
    // If already correctly matched, ignore
    if (feedback[termId] === "correct") return;
    setSelectedTermId(termId === selectedTermId ? null : termId);
    
    // Play option selection click
    soundEngine.playClick();
  };

  const handleDefinitionClick = (defId: string) => {
    if (!selectedTermId) return;
    
    // Play option selection click
    soundEngine.playClick();
    
    evaluateMatch(selectedTermId, defId);
  };

  // Evaluation core rule
  const evaluateMatch = (termId: string, defId: string) => {
    const termObj = pairs.find(p => p.id === termId);
    const defObj = pairs.find(p => p.id === defId);

    if (!termObj || !defObj) return;

    // Is it a correct conceptual match?
    const isCorrect = termObj.term === defObj.term;

    if (isCorrect) {
      const nextMatches = { ...currentMatches, [termId]: defId };
      const nextFeedback = { ...feedback, [termId]: "correct" as const };
      
      setCurrentMatches(nextMatches);
      setFeedback(nextFeedback);
      setSelectedTermId(null);
      onActivityComplete(10); // Reward 10 XP points! (plays standard success sound in parent)

      // Check if all 4 matched
      if (Object.keys(nextMatches).length === pairs.length) {
        setIsCompleted(true);
        onActivityComplete(30); // Award complete game completion bonus XP points! (plays success celebration)
        localStorage.setItem(`edusphere_matching_${subjectId}`, "completed");
      }
    } else {
      // Flash red temporarily
      setFeedback(prev => ({ ...prev, [termId]: "incorrect" as const }));
      setSelectedTermId(null);
      
      // Play a quick subtle click as negative feedback
      soundEngine.playClick();
      
      // Clear incorrect flash after simple timing
      setTimeout(() => {
        setFeedback(prev => ({ ...prev, [termId]: "default" as const }));
      }, 1500);
    }
  };

  // --- HTML5 DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, termId: string) => {
    if (feedback[termId] === "correct") {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", termId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required to allow drop!
  };

  const handleDrop = (e: React.DragEvent, defId: string) => {
    e.preventDefault();
    const termId = e.dataTransfer.getData("text/plain");
    if (!termId) return;

    evaluateMatch(termId, defId);
  };

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col h-full relative">
      
      {/* Module Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white tracking-wide text-sm sm:text-base">Interactive Match Constructor</h3>
            <p className="text-[11px] text-white/50">Drag terms OR click to pair them together</p>
          </div>
        </div>

        <button 
          onClick={resetGame} 
          className="p-1 px-2.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white border border-white/5 transition-all flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Deck</span>
        </button>
      </div>

      {isCompleted ? (
        /* SUCCESS CELEBRATION CARD */
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center text-2xl shadow-xl animate-pulse">
            ✓
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">Interactive Completed</span>
            <h4 className="font-display font-bold text-white text-base sm:text-lg mt-0.5">Fabulous matching accuracy!</h4>
            <p className="text-xs text-white/50 max-w-[80%] mx-auto mt-1 leading-relaxed">
              Your mechanical terms and scientific explanations are perfectly integrated! Experience is acquired.
            </p>
          </div>
        </div>
      ) : (
        /* GAME WORKSPACE */
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Column 1: Match Words / Terms */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-pink-400 font-bold block mb-2 text-center">
              Scientific Terms
            </span>
            {pairs.map((item) => {
              const isMatched = feedback[item.id] === "correct";
              const isSelected = selectedTermId === item.id;
              const isFailed = feedback[item.id] === "incorrect";

              let cardStyle = "bg-slate-900/60 border-white/5 hover:border-cyan-500/30 text-white cursor-grab active:cursor-grabbing";
              if (isMatched) {
                cardStyle = "bg-emerald-950/40 border-emerald-500/30 text-emerald-400/80 cursor-default opacity-85 select-none";
              } else if (isFailed) {
                cardStyle = "bg-red-950/60 border-red-500/60 text-red-300 animate-shake";
              } else if (isSelected) {
                cardStyle = "bg-cyan-950 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/20";
              }

              return (
                <div
                  key={item.id}
                  draggable={!isMatched}
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onClick={() => handleTermClick(item.id)}
                  className={`p-3.5 rounded-xl border transition-all text-xs font-semibold flex items-center justify-between select-none ${cardStyle}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white/20 select-none">⋮⋮</span>
                    <span>{item.term}</span>
                  </div>
                  {isMatched && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
              );
            })}
          </div>

          {/* Column 2: Definition Targets */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold block mb-2 text-center">
              Scientific Definitions
            </span>
            {shuffledDefs.map((def) => {
              // Find if any term has matched this definition
              const matchingTermKey = Object.keys(currentMatches).find(
                key => currentMatches[key] === def.id
              );
              const isMatched = !!matchingTermKey;
              
              let slotStyle = "bg-slate-950/50 border-white/5 hover:bg-slate-900/40";
              if (isMatched) {
                slotStyle = "bg-emerald-950/20 border-emerald-500/20 text-emerald-300/85";
              } else if (selectedTermId) {
                slotStyle = "bg-slate-900/60 border-cyan-400/20 hover:border-cyan-400 cursor-pointer animate-pulse";
              }

              return (
                <div
                  key={def.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, def.id)}
                  onClick={() => handleDefinitionClick(def.id)}
                  className={`p-3 rounded-xl border min-h-[50px] transition-all text-[11px] leading-relaxed flex items-center gap-2.5 ${slotStyle}`}
                >
                  <div className={`p-1.5 rounded-md text-xs shrink-0 flex items-center justify-center ${
                    isMatched ? "bg-emerald-950 text-emerald-300" : "bg-slate-900 text-slate-500"
                  }`}>
                    {isMatched ? <Check className="w-3.5 h-3.5" /> : <HelpIcon className="w-3.5 h-3.5" />}
                  </div>
                  <p className="flex-1 font-sans">{def.definition}</p>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Touch usability helper tip */}
      {!isCompleted && (
        <p className="text-[10px] text-white/30 text-center mt-4 italic font-sans">
          💡 Tips: On mobile, simply tap a word inside 'Terms' list first, then tap its partner in 'Definitions'!
        </p>
      )}

    </div>
  );
}
