import { useState, useEffect } from "react";
import { 
  Dna, 
  Orbit, 
  Cpu, 
  Zap, 
  Award, 
  TrendingUp, 
  HelpCircle, 
  ChevronRight, 
  GraduationCap,
  Sparkles,
  RefreshCw,
  Info,
  Volume2,
  VolumeX,
  ArrowUpRight,
  LogOut,
  LogIn,
  User,
  Check,
  Database,
  ShieldAlert,
  Activity,
  Mail
} from "lucide-react";
import { SUBJECTS, SubjectData } from "./data";
import ThreeCanvas from "./components/ThreeCanvas";
import AITutorBox from "./components/AITutorBox";
import SimulationBox from "./components/SimulationBox";
import QuizCard from "./components/QuizCard";
import MatchingDeck from "./components/MatchingDeck";
import LeaderboardWidget from "./components/LeaderboardWidget";
import MasteryRoadmap from "./components/MasteryRoadmap";
import StreakCounter from "./components/StreakCounter";
import { soundEngine } from "./utils/soundEngine";
import DigitalNotepad from "./components/DigitalNotepad";
import QuickCheckPopup from "./components/QuickCheckPopup";
import RapidRecall from "./components/RapidRecall";
import LoginPage from "./components/LoginPage";
import { auth, googleProvider } from "./utils/firebase";
import { signOut, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./utils/firebase";
import confetti from "canvas-confetti";

export default function App() {
  // State for volume controller
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getMuteState());

  // Interactive Pilot authentication states  
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("edusphere_logged_in") === "true";
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("edusphere_username") || "Guest Explorer";
  });
  const [userRole, setUserRole] = useState<string>(() => {
    return localStorage.getItem("edusphere_user_role") || "biology";
  });

  const handleLoginSuccess = (name: string, role: string) => {
    localStorage.setItem("edusphere_logged_in", "true");
    localStorage.setItem("edusphere_username", name);
    localStorage.setItem("edusphere_user_role", role);
    setIsLoggedIn(true);
    setUserName(name);
    setUserRole(role);
    
    // Auto switch subject to match their selected discipline role if possible!
    if (role === "biology" || role === "physics" || role === "computer_science") {
      setActiveSubjectId(role);
      localStorage.setItem("edusphere_active_subject", role);
    }
    
    // Statically increment energy points if logging for the first time
    const playedBefore = localStorage.getItem("edusphere_has_logged_before");
    if (!playedBefore) {
      localStorage.setItem("edusphere_has_logged_before", "true");
      // Give initial energy boost
      setEnergyPoints((prev) => {
        const nextVal = prev + 50;
        localStorage.setItem("edusphere_energy_score", String(nextVal));
        return nextVal;
      });
      soundEngine.playSuccessCelebration();
    }
  };

  // Dropdown visibility for the Connected Pilot details
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState<boolean>(false);
  const [linkingError, setLinkingError] = useState<string | null>(null);

  // Custom in-app confirmation modals
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Custom interactive editable states for profile card
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editRole, setEditRole] = useState<string>("biology");

  const handleLinkGoogleAccount = async () => {
    setIsLinkingGoogle(true);
    setLinkingError(null);
    soundEngine.playClick();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const displayName = user.displayName || user.email?.split("@")[0] || "Scholar Cadet";
      
      const userRef = doc(db, "users", user.uid);
      let finalXP = energyPoints;
      let finalStreak = streak;

      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const cloudData = userSnap.data();
          finalXP = cloudData.energyPoints ?? finalXP;
          finalStreak = cloudData.streak ?? finalStreak;
          setEnergyPoints(finalXP);
          setStreak(finalStreak);
          localStorage.setItem("edusphere_energy_score", String(finalXP));
          localStorage.setItem("edusphere_streak_count", String(finalStreak));
        } else {
          await setDoc(userRef, {
            userId: user.uid,
            name: displayName,
            role: userRole,
            energyPoints: finalXP,
            streak: finalStreak,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (dbErr) {
        console.warn("Firestore sync warning on link:", dbErr);
      }

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.3 },
        colors: ["#22d3ee", "#a855f7", "#34d399"]
      });

      setUserName(displayName);
      localStorage.setItem("edusphere_logged_in", "true");
      localStorage.setItem("edusphere_username", displayName);
      localStorage.setItem("edusphere_firebase_uid", user.uid);
      soundEngine.playSuccessCelebration();
    } catch (err: any) {
      console.error("Google account link error:", err);
      const isUnauthDomain = err.code === "auth/unauthorized-domain" || 
                             (err.message && err.message.includes("unauthorized-domain"));
      if (isUnauthDomain) {
        setLinkingError("auth/unauthorized-domain");
      } else {
        setLinkingError(err.message || "Credential link revoked or closed.");
      }
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleLogout = () => {
    soundEngine.playClick();
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    soundEngine.playClick();
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase Auth sign out error:", err);
    }
    localStorage.setItem("edusphere_logged_in", "false");
    localStorage.removeItem("edusphere_firebase_uid");
    setIsLoggedIn(false);
    setShowProfileMenu(false);
    setShowLogoutModal(false);
  };

  // State 1: Active Subject (biology | physics | computer_science)
  const [activeSubjectId, setActiveSubjectId] = useState<string>("biology");
  
  // State 2: Active Hotspot selected inside 3D viewer
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>("nucleus");

  // State 3: Cumulative XP Energy score parameters
  const [energyPoints, setEnergyPoints] = useState<number>(35); // starts with some welcome energy
  
  // State 4: Current active AI explanations
  const [activeExplanation, setActiveExplanation] = useState<{ text: string; source: string } | null>(null);

  // State 5: Daily Streak tracker count
  const [streak, setStreak] = useState<number>(() => Number(localStorage.getItem("edusphere_streak_count") || "1"));

  // State 6: Friend Challenge active data status
  const [activeChallenge, setActiveChallenge] = useState<{
    subjectId: string;
    challengerName: string;
    scoreToBeat: number;
  } | null>(null);

  // State 7: Active Challenge completion status
  const [challengeResult, setChallengeResult] = useState<{
    userScore: number;
    challengerScore: number;
    challengedSubjectId: string;
    status: "won" | "lost" | "tied";
  } | null>(null);

  // Parse Friend Challenge parameters directly on startup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const subj = params.get("challengeSubj");
      const challenger = params.get("challenger");
      const scoreStr = params.get("challengerScore");
      
      if (subj && challenger && scoreStr !== null) {
        const score = parseInt(scoreStr, 10) || 0;
        setActiveChallenge({
          subjectId: subj,
          challengerName: decodeURIComponent(challenger),
          scoreToBeat: score
        });
        
        // Auto navigate to the challenged science module!
        if (SUBJECTS[subj]) {
          setActiveSubjectId(subj);
          localStorage.setItem("edusphere_active_subject", subj);
        }
      }
    }
  }, []);

  // Load configuration and matching stats from localStorage
  useEffect(() => {
    const savedSubject = localStorage.getItem("edusphere_active_subject");
    if (savedSubject && SUBJECTS[savedSubject]) {
      setActiveSubjectId(savedSubject);
    }
    const savedEnergy = localStorage.getItem("edusphere_energy_score");
    if (savedEnergy) {
      setEnergyPoints(Number(savedEnergy));
    }
  }, []);

  // Listen to Firebase Auth state change and sync
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsLoggedIn(true);
        const name = user.displayName || user.email?.split("@")[0] || "Scholar Cadet";
        setUserName(name);
        localStorage.setItem("edusphere_logged_in", "true");
        localStorage.setItem("edusphere_username", name);
        localStorage.setItem("edusphere_firebase_uid", user.uid);
      } else {
        const hasFirebaseUid = localStorage.getItem("edusphere_firebase_uid");
        if (hasFirebaseUid) {
          localStorage.setItem("edusphere_logged_in", "false");
          localStorage.removeItem("edusphere_firebase_uid");
          setIsLoggedIn(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const activeSubject: SubjectData = SUBJECTS[activeSubjectId];

  // Handle switching subject
  const handleSubjectChange = (id: string) => {
    if (!SUBJECTS[id]) return;
    setActiveSubjectId(id);
    localStorage.setItem("edusphere_active_subject", id);
    
    // Play subtle audio click
    soundEngine.playClick();
    
    // Auto reset/focus active topic hotspot corresponding to subject defaults
    const defaultHotspot = SUBJECTS[id].hotspots[0]?.id || null;
    setActiveHotspotId(defaultHotspot);
    setActiveExplanation(null);
  };

  // Trigger real-time explain call toward the proxy Gemini server API
  const handleAskAIQuery = async (query: string, specificTopic?: string) => {
    try {
      const response = await fetch("/api/ai/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: activeSubjectId,
          topic: specificTopic || activeHotspotId || activeSubjectId,
          customQuestion: query,
        }),
      });

      const data = await response.json();
      setActiveExplanation({
        text: data.text,
        source: data.source,
      });

      // Boost energy score for posing deep questions
      incrementEnergyPoints(12);

    } catch (err) {
      console.error(err);
      setActiveExplanation({
        text: `🚀 **BrightMind Offline Companion active:** Sorry, we're having trouble reaching the main network. Double check your internet! \n\nNonetheless, **"${query}"** represents one of the pillars of science! Use our visual simulation lab below to explore its parameters in real-time.`,
        source: "Local Cache Database"
      });
    }
  };

  // Click on hotspots inside Three.js
  const handleHotspotSelect = (hotspotId: string) => {
    setActiveHotspotId(hotspotId);
    
    // Play subtle audio click
    soundEngine.playClick();
    
    // Save explored hotspots key based on subject
    try {
      const exploredKey = `edusphere_hotspots_${activeSubjectId}`;
      const currentExploredRaw = localStorage.getItem(exploredKey);
      const currentExplored: string[] = currentExploredRaw ? JSON.parse(currentExploredRaw) : [];
      if (!currentExplored.includes(hotspotId)) {
        currentExplored.push(hotspotId);
        localStorage.setItem(exploredKey, JSON.stringify(currentExplored));
      }
    } catch (e) {
      console.error("Error storing hotspot progress", e);
    }

    // Auto load a quick explanation of that hotspot via ROBY
    const hotspotObj = activeSubject.hotspots.find(h => h.id === hotspotId);
    if (hotspotObj) {
      handleAskAIQuery(`Briefly explain ${hotspotObj.label} in ${activeSubject.name} context.`, hotspotId);
    }
  };

  // Award XP points and save to localStorage
  const incrementEnergyPoints = (amount: number) => {
    // Play dynamic audio indicators
    if (amount >= 30) {
      soundEngine.playSuccessCelebration();
    } else if (amount > 0) {
      soundEngine.playSuccess();
    }

    setEnergyPoints((prev) => {
      const nextVal = prev + amount;
      localStorage.setItem("edusphere_energy_score", String(nextVal));
      return nextVal;
    });
  };

  // Get active student badge text
  const getStudentRank = () => {
    if (energyPoints < 80) return { rank: "🌟 Novice Explorer", desc: "Keep exploring the 3D models and labs!" };
    if (energyPoints < 160) return { rank: "🚀 Space Cadet", desc: "Fantastic curiosity index! You're mastering science rules." };
    return { rank: "🏆 Cosmos Scholar", desc: "Ultimate academic mastery unlocked via dynamic logic!" };
  };

  const currentRank = getStudentRank();

  // Reset progress parameters
  const handleResetProgress = () => {
    soundEngine.playClick();
    setShowResetModal(true);
  };

  const confirmResetProgress = () => {
    soundEngine.playClick();
    setEnergyPoints(35);
    setActiveExplanation(null);
    localStorage.clear();
    setActiveSubjectId("biology");
    setShowResetModal(false);
  };

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0A051E] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden flex flex-col">
      
      {/* FROSTED GLASS GRADIENT LIGHT ORBS */}
      <div className="absolute inset-0 w-full h-full opacity-35 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-5%] left-[-10%] w-[55%] h-[45%] bg-cyan-500 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-[15%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[40%] left-[30%] w-[35%] h-[35%] bg-pink-500/25 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '14s' }} />
      </div>

      {/* CORE WORKSPACE LIMITER */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10 space-y-6 flex-1 flex flex-col justify-between">
        
        {/* HEADER CONTROL BAR */}
        <header className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl relative z-50">
          
          {/* Logo Name block */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/10 shrink-0">
              <GraduationCap className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-white tracking-tight text-base sm:text-lg">BrightMind AI</h1>
                <span className="text-[10px] tracking-wider font-mono font-bold bg-gradient-to-r from-cyan-400 to-purple-400 text-transparent bg-clip-text">LEARN IN 3D</span>
              </div>
              <p className="text-[11px] text-white/50">Next-Gen Science & Informatics Visual Sandbox</p>
            </div>
          </div>

          {/* Center Space: Subject selection segment */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 backdrop-blur-md p-1 rounded-xl w-full md:w-auto overflow-x-auto justify-center">
            <button
              onClick={() => handleSubjectChange("biology")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubjectId === "biology"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                  : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Dna className="w-3.5 h-3.5" />
              <span>Biology</span>
            </button>
            <button
              onClick={() => handleSubjectChange("physics")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubjectId === "physics"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-400/30"
                  : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Orbit className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
              <span>Physics</span>
            </button>
            <button
              onClick={() => handleSubjectChange("computer_science")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubjectId === "computer_science"
                  ? "bg-pink-500/20 text-pink-300 border border-pink-400/30"
                  : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Computer Science</span>
            </button>
          </div>

          {/* Right Space: Gamification parameters telemetry */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 justify-end relative">
            
            {/* Active Connected User Profile indicator */}
            <div className="relative">
              <button 
                onClick={() => {
                  soundEngine.playClick();
                  setShowProfileMenu(!showProfileMenu);
                }}
                className={`flex items-center gap-2 bg-white/5 hover:bg-white/10 border ${showProfileMenu ? 'border-cyan-400/60 bg-white/10 shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 'border-white/10'} px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition-all duration-200`}
                title="View Academic Portal Session"
              >
                <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center text-[10px] text-white select-none font-bold">
                  {userName.charAt(0).toUpperCase() || "P"}
                </span>
                <div className="text-left hidden sm:block">
                  <p className="text-[10.5px] text-white/90 leading-3 truncate max-w-[85px] font-bold">{userName}</p>
                  <p className="text-[8.5px] text-cyan-400/80 font-mono tracking-wide uppercase mt-0.5">
                    {userRole === "biology" ? "Bio Cadet" : userRole === "physics" ? "Quantum Cmd" : "Neural Sage"}
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
              </button>

              {/* DROPDOWN OPTIONS DECK */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-80 bg-[#0F0A2A] border border-white/15 rounded-2xl p-4 shadow-[0_15px_50px_rgba(0,0,0,0.85)] z-50 animate-fade-in text-left">
                  
                  {/* Profile Header w/ Edit trigger */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 ml-0.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center text-white text-sm font-black shrink-0 shadow-inner">
                        {userName.charAt(0).toUpperCase() || "P"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate max-w-[130px]">{userName}</p>
                        <p className="text-[9.5px] text-cyan-400/80 font-mono capitalize truncate mt-0.5">
                          {userRole === "biology" ? "Bio Cadet" : userRole === "physics" ? "Quantum Cmd" : "Neural Sage"}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setEditName(userName);
                        setEditRole(userRole);
                        setIsEditingProfile(!isEditingProfile);
                      }}
                      className={`text-[9px] font-mono font-bold tracking-wider px-2 py-1 rounded transition-all cursor-pointer border ${
                        isEditingProfile 
                          ? "bg-rose-500/10 text-rose-300 border-rose-500/25 hover:bg-rose-500/20" 
                          : "bg-cyan-500/10 text-cyan-300 border-cyan-500/25 hover:bg-cyan-500/20"
                      }`}
                    >
                      {isEditingProfile ? "Cancel" : "Change Details"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    
                    {/* INLINE PROFILE EDIT FORM */}
                    {isEditingProfile && (
                      <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-3 space-y-3 animate-fade-in">
                        <p className="text-[9px] font-mono uppercase text-cyan-300 tracking-wider font-semibold">Modify Session Profile</p>
                        
                        <div className="space-y-1">
                          <label className="text-[8.5px] font-mono text-white/40 block">Change Username / Codename</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value.substring(0, 24))}
                            className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-2 text-white outline-none focus:border-cyan-400 font-semibold"
                            placeholder="e.g. AstroScholar"
                            style={{ height: "30px", fontSize: "11px" }}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8.5px] font-mono text-white/40 block">Assigned Discipline Stream</label>
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-2 text-white outline-none focus:border-cyan-400 font-semibold text-xs cursor-pointer"
                            style={{ height: "30px" }}
                          >
                            <option value="biology">🧬 Bioluminescent Cadet</option>
                            <option value="physics">⚛️ Quantum Commander</option>
                            <option value="computer_science">💻 Neuromorphic Sage</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const trimmedName = editName.trim();
                            if (!trimmedName) {
                              alert("Nickname cannot be empty!");
                              return;
                            }
                            soundEngine.playSuccess();
                            setUserName(trimmedName);
                            setUserRole(editRole);
                            localStorage.setItem("edusphere_username", trimmedName);
                            localStorage.setItem("edusphere_user_role", editRole);
                            
                            // switch default subject viewport
                            if (editRole === "biology" || editRole === "physics" || editRole === "computer_science") {
                              setActiveSubjectId(editRole);
                              localStorage.setItem("edusphere_active_subject", editRole);
                            }
                            
                            setIsEditingProfile(false);
                            
                            confetti({
                              particleCount: 80,
                              spread: 50,
                              origin: { y: 0.3 }
                            });
                          }}
                          className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 text-black py-1 px-2.5 rounded-lg text-[10px] font-extrabold cursor-pointer border-none shadow transition-all hover:brightness-110 active:scale-95 text-center block select-none"
                          style={{ height: "28px" }}
                        >
                          Confirm & Apply Changes
                        </button>
                      </div>
                    )}

                    {/* Database status and cloud synchronization index */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono uppercase text-white/40 tracking-wider font-semibold">Cerebral Anchor</span>
                        <span className="text-[9.5px] font-mono text-cyan-400 font-bold flex items-center gap-1">
                          <Database className="w-2.5 h-2.5" />
                          Firestore Active
                        </span>
                      </div>

                      {auth.currentUser ? (
                        <div className="space-y-1">
                          <p className="text-[10.5px] text-emerald-300 font-medium flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />
                            Synced with Google
                          </p>
                          <p className="text-[9px] text-white/45 font-mono truncate pl-5">
                            <Mail className="w-2.5 h-2.5 inline mr-1" /> {auth.currentUser.email}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[10.5px] text-amber-300 font-medium flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                            Guest Account State
                          </p>
                          <p className="text-[9px] text-white/45 leading-relaxed font-mono">
                            Your scores and streaks are currently cached locally.
                          </p>
                          
                          {/* ELEVATE GUEST TO REAL GOOGLE AUTH */}
                          <button
                            type="button"
                            onClick={handleLinkGoogleAccount}
                            disabled={isLinkingGoogle}
                            className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-[10.5px] py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isLinkingGoogle ? (
                              <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-3 h-3" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114c-4.78 0-8.67-4.014-8.67-8.8c0-4.785 3.89-8.8 8.67-8.8c2.253 0 4.153.843 5.61 2.21l3.203-3.203C18.17 1.085 15.42 0 12.24 0C5.46 0 0 5.46 0 12.24s5.46 12.24 12.24 12.24c6.88 0 11.23-4.8 11.23-11.23c0-.734-.06-1.424-.19-1.97H12.24z"/>
                              </svg>
                            )}
                            {isLinkingGoogle ? "Connecting Linkbox..." : "Link Google Account"}
                          </button>
                          {linkingError && (
                            linkingError === "auth/unauthorized-domain" ? (
                              <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-2.5 mt-2 space-y-2 text-[10px] text-left">
                                <div className="flex items-center gap-1.5 text-amber-400 font-bold shrink-0">
                                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Domain Unauthorized</span>
                                </div>
                                <p className="text-white/70 leading-relaxed text-[9.5px]">
                                  Please add the following hostname to your <a href="https://console.firebase.google.com/project/rajuc8-b0b28/authentication/providers" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300 font-semibold transition-colors">Firebase Console Auth Settings ↗</a> (Settings tab &rarr; Authorized domains):
                                </p>
                                <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg p-1.5 justify-between">
                                  <span className="font-mono text-[8.5px] text-cyan-200 select-all truncate">
                                    {window.location.hostname}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(window.location.hostname);
                                      alert("Copied: " + window.location.hostname);
                                    }}
                                    className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300 text-[8px] px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer transition-colors"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[8.5px] text-rose-400 line-clamp-2 font-mono mt-1 text-center font-semibold">
                                ⚠️ {linkingError}
                              </p>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stats metrics */}
                    <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-2 font-semibold font-sans">
                        <span className="text-[8.5px] block text-white/40 font-mono">Streak</span>
                        <span className="text-rose-400 flex items-center gap-1 mt-0.5">🔥 {streak} Days</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-2 font-semibold font-sans">
                        <span className="text-[8.5px] block text-white/40 font-mono">Accumulated</span>
                        <span className="text-amber-400 flex items-center gap-1 mt-0.5">⚡ {energyPoints} XP</span>
                      </div>
                    </div>

                    {/* System state / Active session controllers */}
                    <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left bg-rose-500/10 hover:bg-rose-500/15 text-rose-300 hover:text-rose-200 text-[10.5px] font-semibold py-2 px-3 rounded-lg border border-rose-500/25 transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <span className="flex items-center gap-1.5">
                          <LogOut className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          Log Out (Change profile)
                        </span>
                        <span className="text-[8px] font-mono opacity-50 font-bold">Disconnect</span>
                      </button>

                      <button
                        onClick={() => {
                          soundEngine.playClick();
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-center hover:bg-white/5 text-white/50 hover:text-white text-[9.5px] font-mono py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Dismiss Portal View
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Global Audio Volume Controller */}
            <button
              onClick={() => {
                const isNowMuted = soundEngine.toggleMute();
                setIsMuted(isNowMuted);
                if (!isNowMuted) {
                  soundEngine.playClick();
                }
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isMuted 
                  ? "bg-slate-900/60 border-slate-700/50 text-slate-400 hover:text-slate-300" 
                  : "bg-cyan-500/10 border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/15"
              }`}
              title={isMuted ? "Unmute Sound Feedback" : "Mute Sound Feedback"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
            </button>

            {/* Daily Streak Flame Indicator */}
            <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/25 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-300 shadow-sm" title="Your consecutive study streak">
              <span className="animate-bounce">🔥</span>
              <span>{streak} Day Streak</span>
            </div>

            {/* Energy Meter Fill stats */}
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                <span className="font-mono text-xs text-white/50">Energy Meter:</span>
                <span className="font-mono text-sm font-bold text-amber-300">{energyPoints} XP</span>
              </div>
              <p className="text-[10px] text-white/40">{currentRank.rank}</p>
            </div>

            {/* Micro progress line */}
            <div className="w-16 h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (energyPoints / 250) * 100)}%` }}
              />
            </div>

            {/* Reset progress stats tool button */}
            <button
              onClick={handleResetProgress}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-all border border-white/5"
              title="Reset metrics"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

          </div>
        </header>

        {/* INCOMING ACTIVE CHALLENGE BANNER */}
        {activeChallenge && (
          <section className="bg-gradient-to-r from-cyan-950 via-purple-950/80 to-slate-950 border-2 border-cyan-400/80 p-5 rounded-3xl relative overflow-hidden shadow-[0_0_25px_rgba(34,211,238,0.2)] animate-fade-in z-20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              
              <div className="flex items-start md:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center text-2xl animate-pulse">
                  ⚔️
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-display font-black tracking-wide text-white uppercase flex items-center gap-2">
                    Friend Challenge Engaged! <span className="text-[10px] bg-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/40">Active Encounter</span>
                  </h3>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                    Pilot <strong className="text-cyan-300 font-extrabold">{activeChallenge.challengerName}</strong> has challenged you to beat their score of <strong className="text-purple-300 font-black">{activeChallenge.scoreToBeat}%</strong> accuracy on the <span className="text-pink-300 font-bold">{activeChallenge.subjectId === "biology" ? "Cell Biology" : activeChallenge.subjectId === "physics" ? "Astronomy Gravity" : "Machine Logic"} Quiz</span>!
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-white/50 font-mono">
                    <span>⚔️ Combat Goal: Get higher than {activeChallenge.scoreToBeat}% Accuracy</span>
                    <span>•</span>
                    <span className="text-amber-300 font-bold">🏆 Victory Loot: +50 XP bonus energy points!</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 justify-end">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    const quizElement = document.getElementById("quiz-section-anchor");
                    if (quizElement) {
                      quizElement.scrollIntoView({ behavior: "smooth", block: "center" });
                    } else {
                      window.scrollTo({ top: 1800, behavior: "smooth" });
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-tr from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black font-extrabold text-xs rounded-xl shadow-lg cursor-pointer transition-all flex items-center gap-2"
                >
                  <span>Attempt Quiz Now</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveChallenge(null);
                    setChallengeResult(null);
                    window.history.replaceState({}, document.title, window.location.pathname);
                  }}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/75 text-xs rounded-xl border border-white/10 transition-all cursor-pointer"
                >
                  Dismiss Challenge
                </button>
              </div>

            </div>
          </section>
        )}

        {/* CHALLENGE COMPLETION RESULT STATUS OVERLAY */}
        {challengeResult && (
          <section className={`border-2 p-5 rounded-3xl relative overflow-hidden shadow-2xl animate-fade-in z-20 ${
            challengeResult.status === "won"
              ? "bg-gradient-to-r from-emerald-950 via-teal-950/80 to-slate-950 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.25)]"
              : challengeResult.status === "tied"
                ? "bg-gradient-to-r from-slate-900 via-cyan-950/70 to-slate-950 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.25)]"
                : "bg-gradient-to-r from-red-950 via-rose-950/70 to-slate-950 border-rose-500/80 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
          }`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-3xl shrink-0">
                  {challengeResult.status === "won" ? "🏆" : challengeResult.status === "tied" ? "🤝" : "💫"}
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-display font-black tracking-wide text-white uppercase flex items-center gap-2">
                    {challengeResult.status === "won" 
                      ? "Victory! Challenge Mastered! 🎉" 
                      : challengeResult.status === "tied" 
                        ? "Incredible! Scientific Standoff! 🤝" 
                        : "Challenge Attempt Completed! 💫"}
                  </h3>
                  <p className="text-xs text-slate-205 mt-1 leading-relaxed">
                    {challengeResult.status === "won" ? (
                      <>
                        You scored <strong className="text-emerald-300 font-extrabold">{challengeResult.userScore}%</strong> and defeated <strong className="text-cyan-300 font-extrabold">{activeChallenge?.challengerName || "your friend"}</strong>'s mark of {challengeResult.challengerScore}%! Secure customized <strong className="text-amber-300 font-extrabold">+50 XP Victory Loot</strong>!
                      </>
                    ) : challengeResult.status === "tied" ? (
                      <>
                        You matched <strong className="text-cyan-300 font-extrabold">{activeChallenge?.challengerName || "your friend"}</strong>'s mark of {challengeResult.challengerScore}% with your own score of <strong className="text-cyan-300 font-extrabold">{challengeResult.userScore}%</strong>! Secure <strong className="text-amber-300 font-extrabold">+25 XP tie loot</strong>!
                      </>
                    ) : (
                      <>
                        You scored <strong className="text-rose-300 font-extrabold">{challengeResult.userScore}%</strong>. <strong className="text-cyan-300 font-extrabold">{activeChallenge?.challengerName || "your friend"}</strong> holds the high claim at {challengeResult.challengerScore}%. Earn <strong className="text-amber-300 font-extrabold">+10 XP effort bonus</strong> and try again!
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setChallengeResult(null);
                    setActiveChallenge(null);
                    window.history.replaceState({}, document.title, window.location.pathname);
                  }}
                  className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer box-shadow-md"
                >
                  Claim Rewards & Clear Challenge
                </button>
              </div>

            </div>
          </section>
        )}

        {/* WELCOME ACTIVE HERO BAR */}
        <section className={`rounded-3xl p-6 bg-gradient-to-r ${activeSubject.bannerGradient} relative overflow-hidden shadow-2xl`}>
          
          {/* Cybernetic code grid texture overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950/20 to-transparent" />

          <div className="max-w-2xl relative z-10 space-y-2">
            <span className="px-3 py-1 rounded-full bg-black/35 backdrop-blur-md text-[10px] font-extrabold tracking-widest uppercase text-white border border-white/10">
              {activeSubject.badgeText}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
              {activeSubject.tagline}
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-sans font-medium">
              {activeSubject.description}
            </p>
          </div>

          <div className="absolute bottom-4 right-6 text-white/15 text-[64px] font-mono leading-none font-black opacity-10 uppercase select-none pointer-events-none">
            {activeSubject.id.substring(0, 4)}
          </div>
        </section>

        {/* MASTERY ROADMAP PROGRESS PATH */}
        <section className="relative z-10">
          <MasteryRoadmap subjectId={activeSubjectId} energyPoints={energyPoints} />
        </section>

        {/* SECTION 1: 3D MODEL VIEWPORT AND ROBY TUTOR (Side-by-Side Bento Grid) */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Column A (Col-span 3): The Three.js interactive viewport with hotspot buttons */}
          <div className="lg:col-span-3 flex flex-col glass-card rounded-3xl p-6 relative">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[10.5px] font-mono font-bold uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                <Orbit className="w-3.5 h-3.5 animate-spin" /> Module 1: 3D Holographic Explorer
              </span>
              
              {/* Reset view helper */}
              <p className="text-[10px] text-white/40">Hold mouse click to rotate model</p>
            </div>

            <div className="flex-1 w-full min-h-[380px] rounded-xl overflow-hidden relative">
              <ThreeCanvas 
                subjectId={activeSubjectId}
                activeHotspotId={activeHotspotId}
                onHotspotClick={handleHotspotSelect}
              />
            </div>

            {/* Dynamic visual parameters telemetry tracker */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-mono bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
              <div>
                <span className="text-white/40 block">RENDER STATUS</span>
                <span className="text-emerald-400 font-bold">🟢 WEBG_ACTV</span>
              </div>
              <div>
                <span className="text-white/40 block">VIRTUAL COORDINATES</span>
                <span className="text-cyan-300 font-bold">
                  {activeHotspotId === "nucleus" || activeHotspotId === "sun" ? "0, 0, 0" : "1.8, 0.8, -0.5"}
                </span>
              </div>
              <div className="truncate">
                <span className="text-white/40 block">ACTIVE HOTSPOT</span>
                <span className="text-purple-300 font-bold uppercase truncate">
                  {activeHotspotId || "Global Target"}
                </span>
              </div>
            </div>

          </div>

          {/* Column B (Col-span 2): Roby animated chat companion and explanations box */}
          <div className="lg:col-span-2">
            <AITutorBox 
              subjectId={activeSubjectId}
              activeExplanation={activeExplanation}
              onAskAI={(q) => handleAskAIQuery(q)}
              mascotGreeting={activeSubject.mascotGreeting}
            />
          </div>

        </section>

        {/* SECTION 2: INTERACTIVE SIMULATION LAB (Full width Bento module) */}
        <section>
          <SimulationBox 
            subjectId={activeSubjectId}
            onExplainAI={(prompt) => handleAskAIQuery(prompt)}
            onActivityComplete={(xp) => {
              incrementEnergyPoints(xp);
              // Save simulation completed status
              localStorage.setItem(`edusphere_sim_${activeSubjectId}`, "completed");
            }}
          />
        </section>

        {/* SECTION 3: REVIEWS & GAMIFICATION MATRIX: QUIZ & TERMS MATCHING DECK */}
        <section id="quiz-section-anchor" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
          
          {/* Left panel: Playful AI Multiple Choice quiz diagnostic */}
          <div>
            <QuizCard 
              subjectId={activeSubjectId}
              questions={activeSubject.quizQuestions}
              onScoreEarned={(score) => {
                // We reward score points to final XP
                incrementEnergyPoints(score);
                // Save quiz completion status with score
                localStorage.setItem(`edusphere_quiz_${activeSubjectId}_score`, String(score));

                // Process active challenge outcome
                if (activeChallenge && activeSubjectId === activeChallenge.subjectId) {
                  const nextStatus = score > activeChallenge.scoreToBeat 
                    ? "won" 
                    : score === activeChallenge.scoreToBeat 
                      ? "tied" 
                      : "lost";
                  
                  setChallengeResult({
                    userScore: score,
                    challengerScore: activeChallenge.scoreToBeat,
                    challengedSubjectId: activeChallenge.subjectId,
                    status: nextStatus
                  });

                  if (nextStatus === "won") {
                    incrementEnergyPoints(50); // Extra 50 XP award for beating challenger
                  } else if (nextStatus === "tied") {
                    incrementEnergyPoints(25); // Extra 25 XP award for tie match
                  } else {
                    incrementEnergyPoints(10); // 10 XP award for efforts
                  }
                }
              }}
              onActivityComplete={incrementEnergyPoints}
            />
          </div>

          {/* Right panel: Active Vocabulary Term matching matrix constructor */}
          <div>
            <MatchingDeck 
              subjectId={activeSubjectId}
              pairs={activeSubject.matchingPairs}
              onActivityComplete={incrementEnergyPoints}
            />
          </div>

        </section>

        {/* SECTION 4: RAPID RECALL ACTIVE FLASHCARDS */}
        <section className="relative z-10">
          <RapidRecall 
            currentSubjectId={activeSubjectId} 
            onRewardXP={incrementEnergyPoints} 
          />
        </section>

        {/* COMPREHENSIVE DIGITAL LAB NOTEBOOK */}
        <section className="relative z-10">
          <DigitalNotepad 
            currentSubjectId={activeSubjectId} 
            activeAiExplanation={activeExplanation} 
            onActivityComplete={incrementEnergyPoints} 
          />
        </section>

        {/* COMPREHENSIVE DAILY STREAK TRACKER */}
        <section className="relative z-10">
          <StreakCounter onStreakUpdate={(newStreak) => setStreak(newStreak)} />
        </section>

        {/* COMPETITIVE LEARNING LEADERBOARD */}
        <section className="relative z-10">
          <LeaderboardWidget userXP={energyPoints} />
        </section>

        {/* ACTIVE COGNITIVE REINFORCEMENT POP-UP */}
        <QuickCheckPopup 
          currentSubjectId={activeSubjectId}
          activeExplanation={activeExplanation}
          onRewardXP={incrementEnergyPoints}
        />

      </div>

      {/* FOOTER DESCRIPTIVE CARD */}
      <footer className="w-full bg-slate-950/95 border-t border-white/5 py-8 relative z-10 text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <p className="text-xs text-white/40 font-mono">
            🖥️ BrightMind AI — Designed with Next-Gen full-stack React + Express & Google Gemini AI API endpoints.
          </p>
          <div className="flex gap-4 items-center justify-center text-[11px] text-white/33 font-sans">
            <span>Client Platform: Chrome IFrame Sandbox</span>
            <span>•</span>
            <span>Version Status: v3.1-Production</span>
            <span>•</span>
            <span>Built by Google AI Studio Build</span>
          </div>
        </div>
      </footer>

      {/* CUSTOM IN-APP MODAL FOR LOGOUT CONFIRMATION */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999] p-4 animate-fade-in text-slate-100">
          <div className="w-full max-w-md bg-[#110A3A] border border-white/15 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300">
                <LogOut className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Disconnect Session?</h3>
                <p className="text-[10px] uppercase tracking-wider text-rose-300 font-mono font-bold">Cerebral Anchor Connection</p>
              </div>
            </div>
            <p className="text-xs text-white/75 leading-relaxed mb-6 text-left">
              Disconnect your cerebral link from the <strong className="text-cyan-300">BrightMind</strong> sandbox workspace? All progress remains stored securely on this browser.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setShowLogoutModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-white/50 hover:text-white transition-all cursor-pointer bg-white/5 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-rose-400 to-pink-500 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg shadow-rose-500/10"
              >
                Yes, Disconnect Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM IN-APP MODAL FOR RESET CONFIRMATION */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999] p-4 animate-fade-in text-slate-100">
          <div className="w-full max-w-md bg-[#110A3A] border border-white/15 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300">
                <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: "6s" }} />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Reset All Metrics?</h3>
                <p className="text-[10px] uppercase tracking-wider text-amber-300 font-mono font-bold">Progress Database Purge</p>
              </div>
            </div>
            <p className="text-xs text-white/75 leading-relaxed mb-6 text-left">
              Are you sure you want to reset all your mastered energy metrics and streak parameters back to default? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setShowResetModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-white/50 hover:text-white transition-all cursor-pointer bg-white/5 hover:bg-white/10"
              >
                Keep Progress
              </button>
              <button
                type="button"
                onClick={confirmResetProgress}
                className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
