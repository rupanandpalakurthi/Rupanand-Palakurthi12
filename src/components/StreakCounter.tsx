import React, { useState, useEffect } from "react";
import { Flame, Calendar, Award, RotateCcw, Sparkles, Check } from "lucide-react";

interface StreakCounterProps {
  onStreakUpdate?: (streak: number) => void;
}

export default function StreakCounter({ onStreakUpdate }: StreakCounterProps) {
  const [streak, setStreak] = useState<number>(1);
  const [lastActiveDate, setLastActiveDate] = useState<string>("");
  const [unlockedStreakBonus, setUnlockedStreakBonus] = useState<boolean>(false);
  const [weeklyStatus, setWeeklyStatus] = useState<boolean[]>([false, false, false, false, false, false, false]); // Mon-Sun activity status

  useEffect(() => {
    // 1. Get current date strings
    const todayStr = getLocalDateString(new Date());
    const yesterdayStr = getLocalDateString(getYesterdayDate());

    // 2. Load streak state from localStorage
    const storedStreak = localStorage.getItem("edusphere_streak_count");
    const storedLastDate = localStorage.getItem("edusphere_streak_last_date");
    const storedWeekly = localStorage.getItem("edusphere_streak_weekly_history");

    let currentStreak = 1;

    if (storedLastDate) {
      if (storedLastDate === todayStr) {
        // Already active today, maintain current streak
        currentStreak = storedStreak ? parseInt(storedStreak, 10) : 1;
      } else if (storedLastDate === yesterdayStr) {
        // Active yesterday! Increment streak
        currentStreak = storedStreak ? parseInt(storedStreak, 10) + 1 : 2;
        // Trigger a fun milestone reward bonus
        if (currentStreak % 3 === 0) {
          setUnlockedStreakBonus(true);
        }
      } else {
        // Broken streak! Reset to 1
        currentStreak = 1;
      }
    } else {
      // First time explorer
      currentStreak = 1;
    }

    // 3. Save computed values
    localStorage.setItem("edusphere_streak_count", String(currentStreak));
    localStorage.setItem("edusphere_streak_last_date", todayStr);
    setStreak(currentStreak);
    setLastActiveDate(todayStr);

    if (onStreakUpdate) {
      onStreakUpdate(currentStreak);
    }

    // 4. Update the current day's position in this week's tracker grid
    let currentWeeklyArr = [true, false, false, false, false, false, false]; // Default starting layout
    if (storedWeekly) {
      try {
        currentWeeklyArr = JSON.parse(storedWeekly);
      } catch (e) {
        console.error("Error parsing weekly history", e);
      }
    }

    // Mark current week-day (0-6 index, Mon=0, Sun=6)
    const dayIndex = getDayOfWeekIndex();
    currentWeeklyArr[dayIndex] = true;
    localStorage.setItem("edusphere_streak_weekly_history", JSON.stringify(currentWeeklyArr));
    setWeeklyStatus(currentWeeklyArr);

  }, []);

  // Helpful helpers for calculating consecutive dates
  const getLocalDateString = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split("T")[0]; // returns "YYYY-MM-DD" safely
  };

  const getYesterdayDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  };

  const getDayOfWeekIndex = () => {
    const d = new Date();
    const day = d.getDay(); // Sunday is 0, Monday is 1...
    return day === 0 ? 6 : day - 1; // Translate Mon=0, Tue=1, ..., Sun=6
  };

  const daysOfWeekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Mock-increment streak for presentation testing
  const handleSimulateActiveDay = () => {
    const nextStreak = streak + 1;
    setStreak(nextStreak);
    localStorage.setItem("edusphere_streak_count", String(nextStreak));
    
    // Toggle next index in weekly activity list
    const updatedWeekly = [...weeklyStatus];
    const randomIndex = updatedWeekly.findIndex(val => !val);
    if (randomIndex !== -1) {
      updatedWeekly[randomIndex] = true;
    } else {
      // populate all
      for (let i = 0; i < 7; i++) updatedWeekly[i] = true;
    }
    setWeeklyStatus(updatedWeekly);
    localStorage.setItem("edusphere_streak_weekly_history", JSON.stringify(updatedWeekly));

    if (onStreakUpdate) {
      onStreakUpdate(nextStreak);
    }
  };

  const streakGoal = 7;
  const progressPercent = Math.min(100, (streak / streakGoal) * 100);

  return (
    <div className="glass-card rounded-3xl p-6 backdrop-blur-xl border border-white/20 shadow-2xl relative text-left overflow-hidden bg-white/5">
      {/* Absolute decorative gradient highlights */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Widget Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Flame className="w-5 h-5 text-orange-200 fill-orange-500 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-black text-white text-sm sm:text-base tracking-wide flex items-center gap-1.5">
              Daily Streak Tracker <span className="text-[10px] bg-amber-400/20 text-amber-300 font-mono uppercase tracking-wide px-2 py-0.5 rounded border border-amber-500/30">ENGAGEMENT LOCK</span>
            </h3>
            <p className="text-[11px] text-white/50">Engage daily to maximize cognitive memory preservation and active XP multipliers!</p>
          </div>
        </div>

        {/* Presentation simulator tool */}
        <button
          onClick={handleSimulateActiveDay}
          className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[10.5px] text-slate-300 hover:text-white rounded-lg flex items-center gap-1 transition-all cursor-pointer"
          title="Simulate daily attendance increment"
        >
          <span>🔥 Simulate Active Day</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left display column: Big Flame and consecutive counter */}
        <div className="col-span-1 lg:col-span-4 flex items-center justify-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-orange-500/20 rounded-full blur-xl animate-pulse" />
            <span className="text-[48px] animate-bounce select-none">🔥</span>
          </div>
          
          <div className="text-left">
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono block">STREAK VELOCITY</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-orange-400 to-amber-300">
                {streak}
              </span>
              <span className="text-xs text-white/60 font-medium">consecutive days</span>
            </div>
            <p className="text-[10px] text-white/55 mt-0.5">
              {streak >= 3 ? "⚡ 1.5x Multiplier Active!" : "🏁 Complete 3 days for multipliers!"}
            </p>
          </div>
        </div>

        {/* Right display column: Weekly checkmark checkboxes grid */}
        <div className="col-span-1 lg:col-span-8 space-y-4">
          <div>
            <div className="flex justify-between text-[10.5px] text-white/40 font-mono mb-1.5">
              <span>WEEKLY PARTICIPATION MATRIX</span>
              <span className="text-orange-300 font-bold">{weeklyStatus.filter(Boolean).length} / 7 DAYS ACTIVE</span>
            </div>
            
            {/* Days grid row */}
            <div className="grid grid-cols-7 gap-1.5">
              {daysOfWeekLabels.map((lbl, idx) => {
                const isActive = weeklyStatus[idx];
                const isTodayIndex = idx === getDayOfWeekIndex();

                return (
                  <div 
                    key={lbl} 
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      isActive 
                        ? "bg-gradient-to-tr from-rose-950/40 to-orange-950/20 border-orange-500/30 text-orange-300" 
                        : isTodayIndex
                        ? "bg-slate-900/40 border-cyan-400 text-cyan-300 animate-pulse"
                        : "bg-black/30 border-white/5 text-slate-500"
                    }`}
                  >
                    <span className="text-[9.5px] font-mono tracking-widest block uppercase font-bold mb-1.5">
                      {lbl}
                    </span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                      isActive 
                        ? "bg-orange-500/20 border-orange-400/30 text-orange-200" 
                        : "bg-black/30 border-white/10 text-transparent"
                    }`}>
                      {isActive ? <Check className="w-3 h-3 text-orange-400" /> : "•"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goal indicator micro progress progressbar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[9.5px] font-mono text-white/40">
              <span className="uppercase">MILESTONE TO NEXT GRADE:</span>
              <span className="text-white/60 font-semibold">{streak} / {streakGoal} DAYS</span>
            </div>
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
              <div 
                className="h-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

        </div>
      </div>

      {unlockedStreakBonus && (
        <div className="mt-4 p-3 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-400/20 rounded-xl flex items-center gap-2.5 text-xs animate-fade-in">
          <Award className="w-5 h-5 text-amber-300 shrink-0 animate-bounce" />
          <p className="text-amber-200 leading-normal">
            🎉 <strong>Mastery Consistency Unlocked!</strong> You reached a {streak}-day milestone. Extra <strong>+15 XP</strong> streak bonus applied towards your current rank!
          </p>
        </div>
      )}
    </div>
  );
}
