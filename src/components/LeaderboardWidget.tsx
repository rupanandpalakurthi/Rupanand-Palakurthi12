import React, { useState, useEffect } from "react";
import { Trophy, ShieldAlert, Sparkles, User, UserCheck, Flame, ArrowUpRight, Share2, Copy, Check, Users } from "lucide-react";
import { soundEngine } from "../utils/soundEngine";

interface LeaderboardWidgetProps {
  userXP: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  rankTitle: string;
  avatar: string;
  color: string;
  isUser?: boolean;
}

export default function LeaderboardWidget({ userXP }: LeaderboardWidgetProps) {
  const [userName, setUserName] = useState<string>("Guest Scholar");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>("");

  // Challenge a friend states
  const [showChallenge, setShowChallenge] = useState<boolean>(false);
  const [challengeSubject, setChallengeSubject] = useState<string>("biology");
  const [challengeCopied, setChallengeCopied] = useState<boolean>(false);

  useEffect(() => {
    const savedName = localStorage.getItem("edusphere_username");
    if (savedName) {
      setUserName(savedName);
      setTempName(savedName);
    } else {
      setTempName("Guest Scholar");
    }
  }, []);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    setUserName(tempName.trim());
    localStorage.setItem("edusphere_username", tempName.trim());
    setIsEditingName(false);
  };

  const getChallengeSubjectScore = (subj: string) => {
    return Number(localStorage.getItem(`edusphere_quiz_${subj}_score`) || "0");
  };

  const handleGenerateChallenge = () => {
    soundEngine.playSuccessCelebration();
    const score = getChallengeSubjectScore(challengeSubject);
    
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const link = `${origin}${pathname}?challengeSubj=${challengeSubject}&challenger=${encodeURIComponent(userName)}&challengerScore=${score}`;
    
    navigator.clipboard.writeText(link).then(() => {
      setChallengeCopied(true);
      setTimeout(() => setChallengeCopied(false), 3000);
    }).catch(err => {
      console.error("Could not copy link", err);
    });
  };

  // High-fidelity fictional leaderboards data
  const fictionalLeaders: LeaderboardEntry[] = [
    { id: "1", name: "AstroNova", xp: 340, rankTitle: "Cosmos Scholar", avatar: "🌌", color: "from-amber-400 to-orange-500" },
    { id: "2", name: "BioPioneer_A", xp: 280, rankTitle: "Cosmos Scholar", avatar: "🧬", color: "from-emerald-400 to-teal-500" },
    { id: "3", name: "QuantumKid", xp: 210, rankTitle: "Space Cadet", avatar: "⚛️", color: "from-purple-400 to-pink-500" },
    { id: "4", name: "CodeVortex", xp: 155, rankTitle: "Space Cadet", avatar: "💻", color: "from-blue-400 to-cyan-500" },
    { id: "5", name: "NebulaReader", xp: 110, rankTitle: "Novice Explorer", avatar: "🪐", color: "from-rose-400 to-pink-500" }
  ];

  // Dynamic user placement based on actual userXP
  const userEntry: LeaderboardEntry = {
    id: "user",
    name: `${userName} (You)`,
    xp: userXP,
    rankTitle: userXP >= 160 ? "Cosmos Scholar" : userXP >= 80 ? "Space Cadet" : "Novice Explorer",
    avatar: "🎓",
    color: "from-cyan-400 to-purple-500",
    isUser: true
  };

  // Combine lists and sort desc by XP score
  const combinedList = [...fictionalLeaders, userEntry].sort((a, b) => b.xp - a.xp);

  // Scroll smoothly to active interactive features
  const scrollToActivities = () => {
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  return (
    <div className="glass-card rounded-3xl p-6 backdrop-blur-xl border border-white/20 shadow-2xl relative text-left overflow-hidden max-w-4xl mx-auto my-6 animate-fade-in bg-white/5">
      {/* Background ambient pulse decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Widget Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center text-white shadow-lg">
            <Trophy className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-black text-white text-sm sm:text-base tracking-wide flex items-center gap-1.5">
              BrightMind Leaderboard <span className="text-[10px] bg-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/30">Mock Competition</span>
            </h3>
            <p className="text-[11px] text-white/50">Compete with global learner instances in real-time!</p>
          </div>
        </div>

        {/* User Alias Name customizer form */}
        <div className="flex items-center">
          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value.slice(0, 16))}
                placeholder="Enter pilot name..."
                className="bg-black/40 border border-white/20 text-white rounded-lg px-2.5 py-1 text-xs outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 font-semibold w-36"
                autoFocus
              />
              <button
                type="submit"
                className="px-2.5 py-1 text-[11px] bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-lg transition-colors cursor-pointer"
              >
                Save
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] hover:border-white/20 text-slate-300 hover:text-white rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Pilot Handle: <strong className="text-cyan-300 font-bold">{userName}</strong> ✏️</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Leaderboard Row list */}
      <div className="space-y-2.5">
        {combinedList.map((entry, index) => {
          const absoluteRank = index + 1;
          const isUser = entry.isUser;

          // Rank styling metrics
          let rankBadge = `${absoluteRank}`;
          let rankBadgeStyle = "bg-white/5 text-slate-400 border-white/10";
          
          if (absoluteRank === 1) {
            rankBadge = "🥇";
            rankBadgeStyle = "bg-amber-400/20 text-amber-300 border-amber-400/30 animate-bounce";
          } else if (absoluteRank === 2) {
            rankBadge = "🥈";
            rankBadgeStyle = "bg-slate-300/20 text-slate-200 border-slate-300/30";
          } else if (absoluteRank === 3) {
            rankBadge = "🥉";
            rankBadgeStyle = "bg-amber-600/20 text-amber-500 border-amber-600/30";
          }

          return (
            <div
              key={entry.id + (isUser ? "_user" : "")}
              className={`flex items-center justify-between p-3 rounded-xl transition-all border ${
                isUser
                  ? "bg-gradient-to-r from-cyan-500/15 via-purple-500/10 to-transparent border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)] scale-[1.01]"
                  : "bg-white/5 border-white/5 hover:border-white/15"
              }`}
            >
              {/* Left Segment: Position, Avatar, Name */}
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold font-mono border ${rankBadgeStyle}`}>
                  {rankBadge}
                </span>

                <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${entry.color} flex items-center justify-center text-lg select-none shadow-md`}>
                  {entry.avatar}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-semibold ${isUser ? "text-cyan-200 font-bold" : "text-white/90"}`}>
                      {entry.name}
                    </span>
                    {isUser && (
                      <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wide">
                        YOU
                      </span>
                    )}
                  </div>
                  <span className="text-[9.5px] text-white/40 block font-medium">
                    {entry.rankTitle}
                  </span>
                </div>
              </div>

              {/* Right Segment: Score / Fuel Tracker */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] text-white/30 uppercase tracking-wider block font-mono">ENERGY SCORE</span>
                  <span className={`font-mono text-sm font-bold ${isUser ? "text-cyan-300" : "text-white"}`}>
                    {entry.xp} XP
                  </span>
                </div>

                {isUser ? (
                  <button 
                    onClick={scrollToActivities}
                    className="p-1 px-2.5 rounded-lg bg-cyan-300 hover:bg-cyan-200 font-extrabold text-[10px] text-black tracking-wide flex items-center gap-1 transition-all cursor-pointer shadow-md"
                  >
                    <span>Fuel!</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/40 font-mono">
                    🤖
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Friend Challenge Setup Section Area */}
      <div className="mt-5 p-4 rounded-2xl bg-gradient-to-tr from-cyan-950/20 via-purple-950/10 to-transparent border border-cyan-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-300">
              <Share2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                Friend Challenge Launcher <span className="text-[9px] bg-purple-500/20 text-purple-300 font-mono tracking-wide px-1.5 py-0.2 rounded border border-purple-500/20 font-bold uppercase">Compare Scores</span>
              </h4>
              <p className="text-[11px] text-white/50">Invite a fellow explorer to attempt your quiz and try to outrank your accuracy!</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              soundEngine.playClick();
              setShowChallenge(!showChallenge);
            }}
            className="px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 font-extrabold text-[11px] text-black tracking-wide flex items-center gap-1.5 transition-all rounded-lg cursor-pointer shadow-lg shrink-0"
          >
            <Users className="w-3.5 h-3.5 stroke-[3px]" />
            <span>{showChallenge ? "Minimize Launcher" : "Setup Challenge Link"}</span>
          </button>
        </div>

        {/* Collapsible Panel */}
        {showChallenge && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-fade-in text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Select Quiz Topic</label>
                <select 
                  value={challengeSubject}
                  onChange={(e) => {
                    soundEngine.playClick();
                    setChallengeSubject(e.target.value);
                  }}
                  className="w-full bg-black/40 border border-white/15 text-xs text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                >
                  <option value="biology">Cell Biology Quiz 🧬</option>
                  <option value="physics">Quantum Gravity Quiz ⚛️</option>
                  <option value="computer_science">Machine Logic Quiz 💻</option>
                </select>
              </div>

              {/* Status display of score */}
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                <span className="text-[9.5px] font-mono text-white/40 uppercase tracking-wider block">Your Score to Beat</span>
                <span className="text-sm font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
                  {getChallengeSubjectScore(challengeSubject)}% Accuracy
                </span>
                <p className="text-[10px] text-white/40 mt-0.5">
                  {getChallengeSubjectScore(challengeSubject) === 0 
                    ? "Go take this quiz to set an active high score first!" 
                    : "Loaded from secure local device memory."}
                </p>
              </div>

            </div>

            {/* Launch URL display CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/5 justify-between">
              <div className="text-left overflow-hidden max-w-sm sm:max-w-xs md:max-w-md">
                <span className="text-[10px] font-mono text-white/35 block uppercase">GENERATED CHALLENGE ENCOUNTER</span>
                <p className="text-[10.5px] text-cyan-400 font-mono italic truncate">
                  ?challengeSubj={challengeSubject}&challenger={encodeURIComponent(userName)}&challengerScore={getChallengeSubjectScore(challengeSubject)}
                </p>
              </div>

              <button
                onClick={handleGenerateChallenge}
                className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md ${
                  challengeCopied
                    ? "bg-emerald-500 text-white shadow-emerald-500/15"
                    : "bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400 text-black shadow-cyan-400/10"
                }`}
              >
                {challengeCopied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3px]" />
                    <span>Encounter Copied! Ready to share</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Generate & Copy Challenge Link</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Motivational message banner */}
      <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between text-xs sm:text-xs">
        <span className="text-purple-300 font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Need more leverage? Earn 20 XP for every section of the companion diagnostic quiz solved!</span>
        </span>
        <button
          onClick={scrollToActivities}
          className="text-xs text-cyan-400 font-bold hover:underline transition-all whitespace-nowrap hidden sm:block cursor-pointer"
        >
          Explore Science Labs →
        </button>
      </div>

    </div>
  );
}
