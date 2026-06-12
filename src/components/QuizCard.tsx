import { useState, useEffect } from "react";
import { QuizQuestion } from "../data";
import { Award, CheckCircle2, XCircle, ChevronRight, HelpCircle, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { soundEngine } from "../utils/soundEngine";

interface QuizCardProps {
  subjectId: string;
  questions: QuizQuestion[];
  onScoreEarned: (score: number) => void;
  onActivityComplete: (xpPoints: number) => void;
}

export default function QuizCard({ subjectId, questions, onScoreEarned, onActivityComplete }: QuizCardProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answersLog, setAnswersLog] = useState<boolean[]>([]); // track which they got right
  const [scoreTracker, setScoreTracker] = useState(0);

  // Gemini specific reason for the active question
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [isLoadingReason, setIsLoadingReason] = useState(false);

  // Restart quiz when switching subjects
  useEffect(() => {
    setCurrentIdx(0);
    setSelectedOptionIdx(null);
    setIsSubmitted(false);
    setAnswersLog([]);
    setScoreTracker(0);
    setAiReasoning(null);
  }, [subjectId]);

  const activeQuestion = questions[currentIdx];

  const handleOptionSelect = (optionIdx: number) => {
    if (isSubmitted) return;
    setSelectedOptionIdx(optionIdx);
    
    // Play option selection click
    soundEngine.playClick();
  };

  const handleSubmitAnswer = () => {
    if (selectedOptionIdx === null || isSubmitted) return;

    const isCorrect = selectedOptionIdx === activeQuestion.correctAnswerIndex;
    const nextLog = [...answersLog];
    nextLog.push(isCorrect);
    setAnswersLog(nextLog);

    let nextScore = scoreTracker;
    if (isCorrect) {
      nextScore += 20; // 5 questions = 100 pts max!
      setScoreTracker(nextScore);
      onActivityComplete(10); // Reward active XP points (which plays standard success sound)
    } else {
      onActivityComplete(2); // Still reward 2 XP for effort (which also plays standard success sound)
    }

    setIsSubmitted(true);
    soundEngine.playClick();
  };

  const handleNextQuestion = () => {
    setAiReasoning(null);
    setSelectedOptionIdx(null);
    setIsSubmitted(false);
    
    // Play generic tap feedback
    soundEngine.playClick();

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Quiz completed! Fire score earned upward
      onScoreEarned(scoreTracker);
      
      // If score is high, unleash confetti!
      if (scoreTracker >= 80) {
        triggerConfettiBlast();
        onActivityComplete(40); // complete bonus XP! (which plays glorious celebration sweep)
      } else {
        // Play minor success sweep for effort
        soundEngine.playSuccess();
      }
      
      // Move pointer beyond questions length to show final stats card
      setCurrentIdx(questions.length);
    }
  };

  const triggerConfettiBlast = () => {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#22d3ee", "#a855f7", "#ec4899"]
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#22d3ee", "#a855f7", "#ec4899"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleFetchAIExplanation = async () => {
    if (selectedOptionIdx === null) return;
    setIsLoadingReason(true);
    setAiReasoning(null);

    const isCorrect = selectedOptionIdx === activeQuestion.correctAnswerIndex;

    try {
      const response = await fetch("/api/ai/quiz-reason", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: subjectId,
          question: activeQuestion.question,
          answerSelected: activeQuestion.options[selectedOptionIdx],
          correctAnswer: activeQuestion.options[activeQuestion.correctAnswerIndex],
          isCorrect,
        }),
      });

      const data = await response.json();
      setAiReasoning(data.text);
    } catch (err) {
      console.error(err);
      setAiReasoning("Failed to contact Roby tutor. Remember that the correct answer matches the basic laws of this scientific field!");
    } finally {
      setIsLoadingReason(false);
    }
  };

  const handleResetQuiz = () => {
    setCurrentIdx(0);
    setSelectedOptionIdx(null);
    setIsSubmitted(false);
    setAnswersLog([]);
    setScoreTracker(0);
    setAiReasoning(null);
  };

  // Check if we already finished
  const isQuizOver = currentIdx >= questions.length;

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col h-full relative">
      
      {/* Subject metadata header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/10">
            <Award className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white tracking-wide text-sm sm:text-base">Module 3: AI-Powered Quiz</h3>
            <p className="text-[11px] text-white/50">Solve and explore personalized correct reasons</p>
          </div>
        </div>

        {/* Progress pills indicator */}
        {!isQuizOver && (
          <span className="font-mono text-[11px] text-cyan-300 font-bold bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-500/20">
            QUESTION {currentIdx + 1} OF {questions.length}
          </span>
        )}
      </div>

      {/* QUIZ TERMINUS: OVERVIEW AND STATUS GRADES CARD */}
      {isQuizOver ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center space-y-4 animate-fade-in">
          
          <div className="relative">
            {/* Glowing Medal Aura */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-xl ${
              scoreTracker >= 80 
                ? "bg-amber-500/20 border border-amber-400 text-amber-300 animate-bounce" 
                : "bg-slate-800/80 border border-white/10 text-slate-300"
            }`}>
              {scoreTracker >= 80 ? "🏆" : "🌟"}
            </div>
            {scoreTracker >= 80 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-tr from-cyan-400 to-purple-500 text-white font-bold text-[8.5px] px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                Mastered
              </span>
            )}
          </div>

          <div>
            <h4 className="font-display font-bold text-white text-lg sm:text-xl">
              {scoreTracker >= 80 ? "Phenomenal Job, Science Master!" : "Great Effort, Space Explorer!"}
            </h4>
            <p className="text-xs text-white/55 mt-1 max-w-[80%] mx-auto">
              You completed the {subjectId === "biology" ? "BioCell" : subjectId === "physics" ? "AstroGravity" : "Binary Code"} diagnostic quiz.
            </p>
          </div>

          {/* Core Score tracker display */}
          <div className="py-2.5 px-6 rounded-2xl bg-slate-900/60 border border-white/5 inline-block">
            <span className="text-[10px] text-white/40 uppercase block mb-0.5 tracking-wider font-mono">QUIZ ACCURACY</span>
            <span className="text-[28px] font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              {scoreTracker}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 justify-center flex-wrap">
            {answersLog.map((isCorrect, idx) => (
              <span
                key={idx}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  isCorrect 
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30" 
                    : "bg-red-950 text-red-300 border border-red-500/30"
                }`}
              >
                {isCorrect ? "✓" : "✗"}
              </span>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={handleResetQuiz}
              className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-white font-semibold text-xs border border-white/10 transition-all flex items-center gap-2 mx-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Diagnostic Quiz</span>
            </button>
          </div>

        </div>
      ) : (
        /* ACTIVE QUESTION WORKSPACE */
        <div className="flex-1 flex flex-col justify-between">
          
          <div className="space-y-4">
            
            {/* Interactive Question Label */}
            <h4 className="text-xs sm:text-sm font-semibold text-white/95 leading-relaxed font-sans min-h-[44px]">
              {activeQuestion.question}
            </h4>

            {/* Interactive Multiple Choice options */}
            <div className="space-y-2.5">
              {activeQuestion.options.map((option, idx) => {
                
                // Color formatting depending on diagnostic submitted state
                let optionStyle = "bg-slate-900/40 border-white/5 text-white/80 hover:border-white/20";
                
                if (isSubmitted) {
                  if (idx === activeQuestion.correctAnswerIndex) {
                    optionStyle = "bg-emerald-950/60 border-emerald-400 text-emerald-300 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.2)]";
                  } else if (idx === selectedOptionIdx) {
                    optionStyle = "bg-red-950/60 border-red-500/60 text-red-300";
                  } else {
                    optionStyle = "bg-slate-950/20 border-white/5 text-white/40";
                  }
                } else if (idx === selectedOptionIdx) {
                  optionStyle = "bg-cyan-950/40 border-cyan-400/80 text-cyan-300 font-medium scale-[1.01]";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={isSubmitted}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex items-center justify-between cursor-pointer ${optionStyle}`}
                  >
                    <span>{option}</span>
                    
                    {/* Visual icons correct/wrong placeholders */}
                    {isSubmitted && idx === activeQuestion.correctAnswerIndex && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                    )}
                    {isSubmitted && idx === selectedOptionIdx && idx !== activeQuestion.correctAnswerIndex && (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* AI Generated Why this answer reasoning box */}
            {isSubmitted && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 text-xs animate-fade-in space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Roby's Micro Explanation
                  </span>
                  
                  {/* Ask Roby to generate a personalized reason button */}
                  {!aiReasoning && (
                    <button
                      onClick={handleFetchAIExplanation}
                      disabled={isLoadingReason}
                      className="text-[9.5px] bg-cyan-950 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-md font-bold hover:bg-cyan-900 transition-all cursor-pointer"
                    >
                      {isLoadingReason ? "Calculating..." : "✨ Why is this correct?"}
                    </button>
                  )}
                </div>

                {isLoadingReason ? (
                  <div className="py-2 flex items-center gap-2 text-white/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="font-mono tracking-wider animate-pulse text-[10px] uppercase">ROBY IS DRAFTING EXPLANATION...</span>
                  </div>
                ) : aiReasoning ? (
                  <p className="text-[11.5px] leading-relaxed text-slate-200">
                    {aiReasoning}
                  </p>
                ) : (
                  <p className="text-[11.5px] leading-relaxed text-white/60">
                    {activeQuestion.explanation}
                  </p>
                )}
              </div>
            )}

          </div>

          {/* Action validation buttons */}
          <div className="pt-5 border-t border-white/5 flex justify-end">
            {!isSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOptionIdx === null}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-450 hover:opacity-95 text-white text-xs font-semibold tracking-wide disabled:opacity-40 transition-all cursor-pointer shadow-lg shadow-pink-500/10"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold tracking-wide flex items-center gap-1.5 hover:gap-2.5 transition-all cursor-pointer"
              >
                <span>{currentIdx < questions.length - 1 ? "Next Question" : "Complete quiz"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
