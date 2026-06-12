import React, { useState, useEffect, useRef } from "react";
import { 
  User, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Dices, 
  Cpu, 
  Dna, 
  Orbit, 
  Sparkles, 
  Activity, 
  Compass, 
  Atom, 
  Terminal, 
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { soundEngine } from "../utils/soundEngine";
import confetti from "canvas-confetti";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../utils/firebase";

interface LoginPageProps {
  onLoginSuccess: (name: string, role: string) => void;
}

const DYNAMIC_CODENAMES = [
  "AstroCadet", "QuantumCadet", "HelixWeaver", "CyberVanguard", "BioCorePilot", 
  "NeuralCenturion", "ChronosTech", "CosmoLogic", "AetherMind", "TeslaScribe",
  "VectorVoyager", "GeneSentinel", "SiliconGhost", "QuarkMechanic", "OrionScholar"
];

const SCIENCE_CLASSES = [
  { id: "biology", title: "Bioluminescent Cadet 🧬", desc: "Specializes in genetics, cytoplasmic visual analysis, & ecosystem grids.", gradient: "border-cyan-400/30 text-cyan-300 bg-cyan-950/20 shadow-cyan-500/5", glowColor: "cyan" },
  { id: "physics", title: "Quantum Commander ⚛️", desc: "Specializes in cosmic gravity, speed parameters, & kinetic energy loops.", gradient: "border-purple-400/30 text-purple-300 bg-purple-950/20 shadow-purple-500/5", glowColor: "purple" },
  { id: "computer_science", title: "Neuromorphic Sage 💻", desc: "Specializes in digital logic layers, recursive state trees, & AI diagnostics.", gradient: "border-pink-400/30 text-pink-300 bg-pink-950/20 shadow-pink-500/5", glowColor: "pink" }
];

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  // Input states
  const [nameInput, setNameInput] = useState<string>(() => localStorage.getItem("edusphere_username") || "");
  const [passcodeInput, setPasscodeInput] = useState<string>("SecurityKey_01");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<string>("biology");
  
  // Interactive coordinate states
  const [mouseCoord, setMouseCoord] = useState({ x: 0, y: 0 });
  const [isHoveringScanner, setIsHoveringScanner] = useState<boolean>(false);
  
  // Simulated Biometric Scan states
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanSubtext, setScanSubtext] = useState<string>("Awaiting thumbprint link");
  
  // Starfield backdrop
  const [stars, setStars] = useState<{ x: number; y: number; size: number; alpha: number }[]>([]);

  // Google Sign-In interactive state controllers
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Sound Synth Helper for the scanning sequence
  const playPulseSound = (frequency: number, duration: number, type: OscillatorType = "sine") => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      if (soundEngine.getMuteState()) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      // Sweep or pulse effect
      if (type === "sawtooth") {
        osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context block safeguard
    }
  };

  // Generate beautiful persistent background stars
  useEffect(() => {
    const arr = [];
    for (let i = 0; i < 60; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.2
      });
    }
    setStars(arr);
  }, []);

  // Handle cursor tracking telemetry
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setMouseCoord({ x, y });
  };

  const rollRandomCodename = () => {
    soundEngine.playClick();
    const randomIndex = Math.floor(Math.random() * DYNAMIC_CODENAMES.length);
    const classSuff = selectedClass === "biology" ? "Bio" : selectedClass === "physics" ? "Helix" : "Logic";
    const customSuffix = Math.floor(100 + Math.random() * 900);
    setNameInput(`${DYNAMIC_CODENAMES[randomIndex]}_${classSuff}${customSuffix}`);
  };

  // Compute password complexity
  const getPasswordStrength = () => {
    if (passcodeInput.length === 0) return { score: 0, text: "No Passkey", color: "bg-red-500/25 border-red-500/10 text-red-400" };
    if (passcodeInput.length < 5) return { score: 1, text: "Low Entropy", color: "bg-orange-500/20 border-orange-500/30 text-orange-400" };
    if (passcodeInput.length < 10) return { score: 2, text: "Secure Cypher", color: "bg-cyan-500/20 border-cyan-500/30 text-cyan-300" };
    return { score: 3, text: "Quantum Grade Matrix Lock 🔒", color: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" };
  };

  const strength = getPasswordStrength();

  // Biometric scanner loop
  const triggerScienceScan = () => {
    if (isScanning) return;
    if (!nameInput.trim()) {
      soundEngine.playClick();
      alert("Please designate a Pilot Codename or roll one dynamically first! 🎲");
      return;
    }

    soundEngine.playClick();
    setIsScanning(true);
    setScanProgress(0);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      interval = setInterval(() => {
        setScanProgress((prev) => {
          const nextVal = prev + Math.floor(Math.random() * 8) + 4;
          
          // Sound intervals based on scan checkpoints
          if (nextVal % 20 < 5) {
            playPulseSound(200 + (nextVal * 4), 0.15, "triangle");
          }

          if (nextVal >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            soundEngine.playSuccessCelebration();
            
            // Pop confetti!
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.8 },
              colors: ["#22d3ee", "#a855f7", "#ec4899"]
            });

            // Delay actual entry point a bit to let confetti pop
            setTimeout(() => {
              onLoginSuccess(nameInput.trim(), selectedClass);
            }, 600);

            return 100;
          }

          // Trigger narrative changes as scanner maps identity
          if (nextVal < 25) {
            setScanSubtext("Reading cerebral neuro-link alpha waves... 🧠");
          } else if (nextVal < 50) {
            setScanSubtext("Calibrating 3D visual renderer buffers... 🧬");
          } else if (nextVal < 75) {
            setScanSubtext(`Granting ${selectedClass.toUpperCase()} scientific clearance level 4... 🏷️`);
          } else {
            setScanSubtext("Synchronizing sandbox security state, almost in... ⚙️");
          }

          return nextVal;
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanning, nameInput, selectedClass]);

  // Handle instant Guest access
  const handleGuestEntry = () => {
    soundEngine.playSuccess();
    onLoginSuccess("Guest Explorer", "biology");
  };

  // Google Sign-In with real-time Firestore sync
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    soundEngine.playClick();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const displayName = user.displayName || user.email?.split("@")[0] || "Scholar Cadet";
      soundEngine.playSuccessCelebration();
      
      const userRef = doc(db, "users", user.uid);
      
      let finalXP = Number(localStorage.getItem("edusphere_energy_score") || "100");
      let finalStreak = Number(localStorage.getItem("edusphere_streak_count") || "1");
      
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const cloudData = userSnap.data();
          finalXP = cloudData.energyPoints ?? finalXP;
          finalStreak = cloudData.streak ?? finalStreak;
        } else {
          // Sync new pilot to Firestore
          await setDoc(userRef, {
            userId: user.uid,
            name: displayName,
            role: selectedClass,
            energyPoints: finalXP,
            streak: finalStreak,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (dbErr) {
        console.warn("Firestore database sync message:", dbErr);
      }

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.8 },
        colors: ["#22d3ee", "#a855f7", "#34d399"]
      });

      localStorage.setItem("edusphere_logged_in", "true");
      localStorage.setItem("edusphere_username", displayName);
      localStorage.setItem("edusphere_user_role", selectedClass);
      localStorage.setItem("edusphere_firebase_uid", user.uid);

      setTimeout(() => {
        onLoginSuccess(displayName, selectedClass);
      }, 700);

    } catch (error: any) {
      console.error("Google authentication failure:", error);
      const isUnauthDomain = error.code === "auth/unauthorized-domain" || 
                             (error.message && error.message.includes("unauthorized-domain"));
      
      if (isUnauthDomain) {
        setGoogleError("auth/unauthorized-domain");
      } else {
        setGoogleError(error.message || "Credential link revoked or closed.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#07031A] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 select-none relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* GLOWING DUSTS */}
      {stars.map((star, idx) => (
        <div 
          key={idx}
          className="absolute bg-white rounded-full pointer-events-none"
          style={{
            top: `${star.y}%`,
            left: `${star.x}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.alpha,
            boxShadow: star.size > 1.5 ? "0 0 8px rgba(255, 255, 255, 0.4)" : "none",
            animation: `star-twinkle ${3 + (idx % 4)}s ease-in-out infinite`
          }}
        />
      ))}

      {/* AMBIENT GLOW VECTORS */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* CORE LOGIN COMPASS BOX */}
      <div className="w-full max-w-2xl bg-slate-950/75 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(34,211,238,0.1)] relative z-10 space-y-6 flex flex-col animate-fade-in">
        
        {/* HUD WATERMARK & TELEMETRY */}
        <div className="flex justify-between items-center text-[10px] font-mono text-cyan-400/55 tracking-widest uppercase border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>BrightMind Connection Interface</span>
          </div>
          <div className="hidden sm:block">
            <span>Grid Context Tracker: X:{mouseCoord.x} Y:{mouseCoord.y}</span>
          </div>
        </div>

        {/* LOGO GREETING HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-cyan-400/20 via-purple-500/20 to-pink-500/20 border border-white/15 shadow-lg shadow-cyan-400/5 animate-orb-float">
            <Atom className="w-10 h-10 text-cyan-300 animate-spin" style={{ animationDuration: '15s' }} />
          </div>
          <h1 className="text-2xl sm:text-3.5xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-slate-200">
            Cerebral Sandbox Portal
          </h1>
          <p className="text-xs sm:text-sm text-white/50 max-w-md mx-auto leading-relaxed">
            Synchronize your academic profile credentials to pilot 3D molecular pathways, quantum nodes, and custom science matrices.
          </p>
        </div>

        {/* TWO FOOT CHANNELS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* LEFT CHANNEL: PROFILE IDENTIFIERS */}
          <div className="space-y-4">
            
            {/* 1. CODENAME INPUT */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/80 flex items-center justify-between">
                <span>Pilot Name Codenames</span>
                <span className="text-[9px] text-white/35">stored locally</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
                  <User className="w-4 h-4" />
                </span>
                <input 
                  type="text"
                  placeholder="e.g. AstroNova"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value.substring(0, 26));
                  }}
                  className="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-12 py-2.5 text-xs text-slate-100 tracking-wide outline-none focus:border-cyan-400 transition-all font-semibold"
                />
                
                {/* Randomizer dice controller */}
                <button
                  onClick={rollRandomCodename}
                  type="button"
                  title="Roll random scientific codename"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-200 cursor-pointer p-1.5 rounded-lg hover:bg-white/5 transition-all"
                >
                  <Dices className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. SECURITY CRYPT KEY PASSCODE */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/80 flex items-center justify-between">
                <span>System Security Cypher</span>
                <span className="text-[9px] text-white/35">Minimum 4 chars</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Cypher key to bind metrics"
                  value={passcodeInput}
                  onChange={(e) => {
                    setPasscodeInput(e.target.value.substring(0, 32));
                  }}
                  className="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-12 py-2.5 text-xs text-slate-100 tracking-wide outline-none focus:border-cyan-400 transition-all font-mono"
                />
                
                {/* Visibility toggler */}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setShowPassword(!showPassword);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1.5 rounded-lg transition-all"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Security strength gauge */}
              <div className="pt-1.5 space-y-1 pointer-events-none">
                <div className="flex justify-between items-center text-[9px] font-mono text-white/45">
                  <span>Cypher Strength rating:</span>
                  <span className="font-bold tracking-tight">{strength.text}</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                  <div className={`h-full flex-1 transition-all ${strength.score >= 1 ? "bg-orange-400" : "bg-white/5"}`} />
                  <div className={`h-full flex-1 transition-all ${strength.score >= 2 ? "bg-cyan-400" : "bg-white/5"}`} />
                  <div className={`h-full flex-1 transition-all ${strength.score >= 3 ? "bg-emerald-400" : "bg-white/5"}`} />
                </div>
              </div>
            </div>

            {/* GOOGLE SIGN IN OPTION */}
            <div className="space-y-2.5">
              <div className="relative flex py-1.5 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 text-[9px] font-mono uppercase tracking-widest text-white/35">Or Connect Securely</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full bg-slate-900/60 hover:bg-slate-800/80 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2.5 border border-white/10 hover:border-cyan-400/40 transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(34,211,238,0.15)] cursor-pointer text-center relative group overflow-hidden"
              >
                {isGoogleLoading ? (
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4.5 h-4.5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-.1.8 1.1 1.6l1.6 1.07l1.04-.6a11.94 11.94 0 0 0 3.8-3.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.8-2.94c-1.12.75-2.56 1.2-4.16 1.2c-3.2 0-5.91-2.16-6.87-5.07L1.24 17.5l.48.97A11.97 11.97 0 0 0 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.13 14.28a7.18 7.18 0 0 1 0-4.56L1.24 6.74a11.94 11.94 0 0 0 0 10.51l3.89-2.97z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0A11.97 11.97 0 0 0 1.24 6.74l3.89 2.97c.96-2.9 3.67-5.06 6.87-5.06z"
                    />
                  </svg>
                )}
                <span className="group-hover:text-cyan-200 transition-colors">
                  {isGoogleLoading ? "Connecting Client Portal..." : "Continue with Google"}
                </span>
              </button>
              {googleError && (
                googleError === "auth/unauthorized-domain" ? (
                  <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-3.5 space-y-3 shadow-lg text-left select-text relative overflow-hidden animate-fade-in text-xs">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-pulse" />
                    
                    <div className="flex items-start gap-2 text-amber-300 font-bold">
                      <ShieldAlert className="w-4 h-4 shrink-0 stroke-[2] mt-0.5 text-amber-400" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wide font-mono">Firebase Authorization Guard</p>
                        <p className="text-[12px] mt-0.5 text-white font-semibold">unauthorized-domain</p>
                      </div>
                    </div>

                    <p className="text-white/70 text-[10.5px] leading-relaxed">
                      This domain is not yet authorized in Firebase Console &rarr; Auth &rarr; Settings for project <code className="text-cyan-300 bg-white/5 px-1 rounded font-mono font-bold">rajuc8-b0b28</code>.
                    </p>

                    <ol className="list-decimal pl-4 space-y-1 text-white/80 text-[10px]">
                      <li>
                        Go to <a href="https://console.firebase.google.com/project/rajuc8-b0b28/authentication/providers" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline font-semibold transition-colors">Firebase Console Auth Settings ↗</a>
                      </li>
                      <li>
                        Select the <span className="font-semibold text-white">Settings</span> tab, then click <span className="font-semibold text-white">Authorized domains</span>.
                      </li>
                      <li>
                        Add the hostname(s) shown below:
                      </li>
                    </ol>

                    <div className="space-y-1.5 mt-2">
                      <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg p-1.5 justify-between">
                        <span className="font-mono text-[9px] text-cyan-200 select-all truncate">
                          {window.location.hostname}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.hostname);
                            alert("Copied: " + window.location.hostname);
                          }}
                          className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300 text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer transition-colors"
                        >
                          Copy
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg p-1.5 justify-between">
                        <span className="font-mono text-[9px] text-cyan-200 select-all truncate">
                          ais-pre-qvrkfoks5f3nyfrh6iwvnj-548525680831.asia-east1.run.app
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText("ais-pre-qvrkfoks5f3nyfrh6iwvnj-548525680831.asia-east1.run.app");
                            alert("Copied: ais-pre-qvrkfoks5f3nyfrh6iwvnj-548525680831.asia-east1.run.app");
                          }}
                          className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300 text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <p className="text-[9px] text-white/45 italic font-mono text-center">
                      Tip: Refresh this applet tab after saving configurations.
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-red-400 text-center font-mono animate-pulse">
                    ⚠️ Connection Link: {googleError}
                  </p>
                )
              )}
            </div>

            {/* QUICK TELEMETRY BULLET DETAILS */}
            <div className="bg-black/40 border border-white/5 p-3 rounded-2xl space-y-1 text-[11px] text-white/45 text-left font-mono">
              <span className="text-cyan-400 fill-cyan-400 font-bold block mb-1">⚡ PILOT PRIVACY METRICS:</span>
              <p>• Data encrypted locally utilizing secure storage</p>
              <p>• Interactive sound responses dynamic synthesized</p>
              <p>• XP synchronization auto-persists to profile badge</p>
            </div>

          </div>

          {/* RIGHT CHANNEL: SCIENCE DISCIPLINE CLASS */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/80 block text-left">
              Select Scientific Focus
            </span>

            <div className="space-y-2.5">
              {SCIENCE_CLASSES.map((scClass) => (
                <button
                  key={scClass.id}
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedClass(scClass.id);
                  }}
                  type="button"
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    selectedClass === scClass.id
                      ? `${scClass.gradient} border-l-4 border-l-cyan-400 ring-2 ring-cyan-400/20`
                      : "border-white/10 hover:border-white/15 bg-white/2 hover:bg-white/5"
                  }`}
                >
                  <div className="relative z-10">
                    <h3 className={`text-xs font-bold tracking-wider ${selectedClass === scClass.id ? "text-cyan-200" : "text-white/65"}`}>
                      {scClass.title}
                    </h3>
                    <p className="text-[10px] text-white/45 mt-1 leading-relaxed leading-normal line-clamp-2">
                      {scClass.desc}
                    </p>
                  </div>
                  {/* Backdrop animated scan line purely inside the active class */}
                  {selectedClass === scClass.id && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
                  )}
                </button>
              ))}
            </div>

          </div>

        </div>

        {/* INTERACTIVE BIOMETRIC LINKSCANNER TERMINAL CONTROL */}
        <div className="pt-4 border-t border-white/10 text-center">
          
          {/* RETINAL THUMB SCANNER ACTIVE INTERACTION TRIGGER AREA */}
          <div className="max-w-md mx-auto relative group">
            
            {/* Ambient pulse shadow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/5 to-purple-400/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-80" />
            
            <button
              onClick={triggerScienceScan}
              disabled={isScanning}
              onMouseEnter={() => {
                setIsHoveringScanner(true);
                playPulseSound(150, 0.08, "sine");
              }}
              onMouseLeave={() => setIsHoveringScanner(false)}
              className={`w-full relative overflow-hidden p-6 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                isScanning 
                  ? "bg-cyan-950/20 border-cyan-400/80 pointer-events-none" 
                  : "bg-gradient-to-b from-slate-900/80 to-slate-950/80 border-cyan-400/30 hover:border-cyan-400/80"
              }`}
            >
              
              {/* Spinning biometric compass lines */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <Compass className={`w-14 h-14 ${isScanning ? "text-fuchsia-400 animate-spin" : isHoveringScanner ? "text-cyan-300 animate-pulse" : "text-white/30"}`} style={{ animationDuration: isScanning ? '2.5s' : '4s' }} />
                
                {/* Embedded status icon */}
                <span className="absolute text-xl">
                  {isScanning ? "🎯" : "🌀"}
                </span>

                {/* Simulated Laser scanner horizontal line */}
                {isScanning && (
                  <div 
                    className="absolute left-0 right-0 h-[3px] bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,1)]"
                    style={{
                      animation: "scanline 1.6s ease-in-out infinite",
                    }}
                  />
                )}
              </div>

              {/* Progress dynamic percentage bars */}
              {isScanning ? (
                <div className="w-full space-y-1.5 px-6 animate-fade-in">
                  <div className="flex justify-between items-center text-[10px] font-mono text-cyan-300">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 animate-pulse text-purple-400" />
                      <span>{scanSubtext}</span>
                    </span>
                    <span className="font-extrabold">{scanProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 transition-all duration-100"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-xs font-bold text-white group-hover:text-cyan-300 tracking-wide transition-colors block">
                    Tap to Scan Biometric Passkey & Login
                  </span>
                  <span className="text-[10px] text-white/40 block mt-0.5 font-mono">
                    Verifies fingerprint integrity to establish visual workspace
                  </span>
                </div>
              )}
            </button>
          </div>

        </div>

        {/* BOTTOM BYPASS ACTION ROW */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-4 border-t border-white/5 text-xs text-white/40">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span>BrightMind Version 1.4 PRO</span>
          </div>
          
          <button
            onClick={handleGuestEntry}
            className="hover:text-cyan-400 font-bold tracking-wider hover:underline transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
          >
            <span>Bypass scanning (Guest Access)</span>
            <ArrowRight className="w-3 h-3 text-cyan-400" />
          </button>
        </div>

      </div>

      {/* Decorative interactive mouse cursor feedback display (only present if hovering) */}
      {isHoveringScanner && (
        <div className="absolute top-4 left-4 bg-slate-950/90 border border-cyan-400/20 text-[9px] font-mono text-cyan-300/80 px-2.5 py-1.5 rounded-lg select-none pointer-events-none hidden md:block">
          STATUS: SEED PULSE ENGACHED • LATENCY: 2MS
        </div>
      )}
    </div>
  );
}
