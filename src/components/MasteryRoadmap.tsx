import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  BookOpen, 
  Compass, 
  Award, 
  ChevronRight, 
  TrendingUp, 
  Activity, 
  Lock, 
  HelpCircle,
  Brain,
  Zap,
  Star
} from "lucide-react";

interface MasteryRoadmapProps {
  subjectId: string;
  energyPoints: number; // passed to cause reactive re-renders when user earns XP
}

interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  requirement: string;
  xpReward: number;
  status: "locked" | "current" | "completed" | "mastered";
  progressValue: string; // e.g. "2/4 explored", "completed", "80%"
}

export default function MasteryRoadmap({ subjectId, energyPoints }: MasteryRoadmapProps) {
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [overallProgress, setOverallProgress] = useState<number>(0);

  useEffect(() => {
    // 1. Fetch current hotspots stats
    const exploredKey = `edusphere_hotspots_${subjectId}`;
    const exploredHotspots: string[] = JSON.parse(localStorage.getItem(exploredKey) || "[]");
    
    // Total possible hotspots count per subject
    const maxHotspots = subjectId === "biology" ? 4 : 3;
    const exploredCount = exploredHotspots.length;
    
    const step1Completed = exploredCount > 0;
    const step1Status = step1Completed ? "completed" : "current";
    const step1Progress = `${exploredCount}/${maxHotspots} explored`;

    // 2. Fetch simulation activity
    const simCompletedRaw = localStorage.getItem(`edusphere_sim_${subjectId}`);
    const step2Completed = simCompletedRaw === "completed";
    let step2Status: "locked" | "current" | "completed" = "locked";
    
    if (step1Completed) {
      step2Status = step2Completed ? "completed" : "current";
    }
    const step2Progress = step2Completed ? "Active & Verified" : "Not yet tested";

    // 3. Fetch diagnostic quiz score
    const quizScoreRaw = localStorage.getItem(`edusphere_quiz_${subjectId}_score`);
    const quizCompleted = quizScoreRaw !== null;
    const quizScore = quizCompleted ? Number(quizScoreRaw) : 0;
    
    let step3Status: "locked" | "current" | "completed" | "mastered" = "locked";
    if (step2Completed) {
      if (quizCompleted) {
        step3Status = quizScore >= 80 ? "mastered" : "completed";
      } else {
        step3Status = "current";
      }
    }
    const step3Progress = quizCompleted ? `Accuracy: ${quizScore}%` : "Awaiting assessment";

    // Load subject-specific details
    const roadmapDetails: Record<string, { s1: string[], s2: string[], s3: string[] }> = {
      biology: {
        s1: ["Holographic Cell Core", "Examine cellular organelles inside the 3D animal envelope.", "Inspect at least 1 3D organelle"],
        s2: ["Microfluid Incubator Sim", "Simulate hypotonic osmosis & pH variations in live beaker culture.", "Trigger simulation controls"],
        s3: ["BioGenetics Mastery evaluation", "Complete the comprehensive interactive cellular biology quiz with high accuracy.", "Score 80% or higher"]
      },
      physics: {
        s1: ["Gravitational Sphere Projector", "Observe key gravity hotspots and orbit pathways.", "Inspect at least 1 orbit vector"],
        s2: ["Gravity Vector Simulator", "Adjust star solar mass & radial distances to render orbital mathematical limits.", "Move slider or run orbits"],
        s3: ["Cosmic Orbits evaluation", "Beat the physical motion & escape velocity evaluation quiz.", "Score 80% or higher"]
      },
      computer_science: {
        s1: ["System Logic Probe", "Inspect CPU registers, logic gates, and bit nodes on board.", "Inspect at least 1 microprocessor hotspot"],
        s2: ["Boolean Gate Logic Circuit", "Toggle logic bit switches to evaluate custom digital outputs.", "Trigger active gate selectors"],
        s3: ["Machine Code evaluation", "Master electronic logic and transistor switching evaluation quiz.", "Score 80% or higher"]
      }
    };

    const details = roadmapDetails[subjectId] || roadmapDetails.biology;

    const computedSteps: RoadmapStep[] = [
      {
        id: "intro",
        title: details.s1[0],
        description: details.s1[1],
        requirement: details.s1[2],
        xpReward: 15,
        status: step1Status as any,
        progressValue: step1Progress
      },
      {
        id: "dive",
        title: details.s2[0],
        description: details.s2[1],
        requirement: details.s2[2],
        xpReward: 25,
        status: step2Status as any,
        progressValue: step2Progress
      },
      {
        id: "challenge",
        title: details.s3[0],
        description: details.s3[1],
        requirement: details.s3[2],
        xpReward: 50,
        status: step3Status as any,
        progressValue: step3Progress
      }
    ];

    setSteps(computedSteps);

    // Compute overall subject progress % (0 to 100)
    let progressSum = 0;
    if (step1Completed) progressSum += 33;
    if (step2Completed) progressSum += 33;
    if (quizCompleted) {
      progressSum += quizScore >= 80 ? 34 : 20; // boost for mastering!
    }
    setOverallProgress(progressSum);

  }, [subjectId, energyPoints]);

  return (
    <div className="glass-card rounded-3xl p-6 relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
      {/* Visual background atmospheric lights */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header telemetry and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/10">
            <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '24s' }} />
          </div>
          <div>
            <h3 className="font-display font-black text-white text-sm sm:text-base tracking-wide flex items-center gap-1.5">
              Subject Mastery Roadmap <span className="text-[10px] bg-purple-400/20 text-purple-300 font-mono uppercase tracking-wide px-2 py-0.5 rounded border border-purple-500/30">MODULE PROGRESS</span>
            </h3>
            <p className="text-[11px] text-white/50">Follow the path of scientific enlightenment step-by-step</p>
          </div>
        </div>

        {/* Visual progress loader */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-white/40 block font-mono">SUBJECT COMPLETION</span>
            <span className="font-mono text-xs font-black text-purple-300">{overallProgress}%</span>
          </div>
          <div className="w-24 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-700" 
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main interactive roadmap steps list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        
        {/* Connection pipeline line overlay underneath cards for desktop layout */}
        <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-transparent z-0" />

        {steps.map((step, idx) => {
          const isLocked = step.status === "locked";
          const isCurrent = step.status === "current";
          const isCompleted = step.status === "completed" || step.status === "mastered";
          const isMastered = step.status === "mastered";

          // Icon indicators mapping
          let indicatorIcon = <Circle className="w-4 h-4 text-white/20" />;
          let indicatorStyle = "border-white/10 text-white/30 bg-white/5";
          
          if (isCompleted) {
            indicatorIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-950/40" />;
            indicatorStyle = "border-emerald-500/40 text-emerald-400 bg-emerald-950/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
          } else if (isMastered) {
            indicatorIcon = <Star className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />;
            indicatorStyle = "border-amber-400/50 text-amber-300 bg-amber-950/30 shadow-[0_0_12px_rgba(245,158,11,0.3)]";
          } else if (isCurrent) {
            indicatorIcon = <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />;
            indicatorStyle = "border-cyan-400/40 text-cyan-300 bg-cyan-950/30 shadow-[0_0_12px_rgba(34,211,238,0.25)]";
          } else {
            indicatorIcon = <Lock className="w-4 h-4 text-white/30" />;
            indicatorStyle = "border-white/5 text-white/30 bg-black/35 opacity-40";
          }

          return (
            <div 
              key={step.id} 
              className={`relative z-10 flex flex-col justify-between p-5 rounded-2xl transition-all border ${
                isCurrent 
                  ? "bg-gradient-to-tr from-cyan-950/30 via-slate-900/30 to-purple-950/15 border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.1)] scale-[1.01]" 
                  : isLocked 
                  ? "bg-black/25 border-white/5 opacity-60" 
                  : "bg-white/5 border-white/10 shadow-sm hover:border-white/20"
              }`}
            >
              <div className="space-y-3">
                
                {/* Step identifier bubble */}
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-mono font-bold tracking-widest text-white/40 uppercase block">
                    STAGE 0{idx + 1}
                  </span>
                  
                  {/* Visual Step Level Marker Icon */}
                  <div className={`p-1 px-2.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5 transition-colors ${indicatorStyle}`}>
                    {indicatorIcon}
                    <span className="uppercase tracking-wider">
                      {isMastered ? "Mastered" : step.status}
                    </span>
                  </div>
                </div>

                {/* Step details */}
                <div>
                  <h4 className="font-display font-black text-white text-xs sm:text-sm tracking-wide leading-snug">
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-white/50 leading-relaxed mt-1">
                    {step.description}
                  </p>
                </div>

              </div>

              {/* Requirement & Active telemetry info */}
              <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                
                {/* Goals */}
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-white/30 uppercase">REQUIREMENT:</span>
                  <span className="text-white/70 max-w-[70%] text-right truncate" title={step.requirement}>
                    {step.requirement}
                  </span>
                </div>

                {/* Live Status Tracker */}
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-white/30 uppercase">LIVE PROGRESS:</span>
                  <span className={`font-semibold ${
                    isCompleted || isMastered 
                      ? "text-emerald-400" 
                      : isCurrent 
                      ? "text-cyan-300 animate-pulse" 
                      : "text-white/30"
                  }`}>
                    {step.progressValue}
                  </span>
                </div>

                {/* XP rewards metrics */}
                <div className="flex items-center justify-between mt-1 text-[9.5px]">
                  <span className="text-white/30 uppercase font-mono">BONUS XP:</span>
                  <span className="font-bold text-amber-300 font-mono flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" /> +{step.xpReward} XP
                  </span>
                </div>

              </div>

            </div>
          );
        })}

      </div>

      {/* Gamification progress helper description */}
      <div className="mt-4 p-3 bg-white/5 rounded-2xl border border-white/10 text-xs flex justify-between items-center">
        <span className="text-cyan-300 font-medium flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Complete all steps to master <strong>{subjectId === "biology" ? "Cell Biology" : subjectId === "physics" ? "Quantum Physics" : "Machine Logic"}</strong>!</span>
        </span>
        <span className="text-[10px] text-white/30 font-mono">Real-time dynamic telemetry index</span>
      </div>

    </div>
  );
}
