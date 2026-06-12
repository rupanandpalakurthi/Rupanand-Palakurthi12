import { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Activity, ShieldAlert, Cpu, Orbit, Sparkles } from "lucide-react";

interface SimulationBoxProps {
  subjectId: string;
  onExplainAI: (prompt: string) => Promise<void>;
  onActivityComplete: (xpPoints: number) => void;
}

export default function SimulationBox({ subjectId, onExplainAI, onActivityComplete }: SimulationBoxProps) {
  const [isExplaining, setIsExplaining] = useState(false);

  // --- BIOLOGY SIMULATION STATE ---
  const [pHValue, setPHValue] = useState(7);
  const [osmosisConcentration, setOsmosisConcentration] = useState(0.5); // isotonic
  const [cellState, setCellState] = useState<"normal" | "swollen" | "shriveled" | "lysed">("normal");

  // Determine cell biological status depending on pH and osmosis
  useEffect(() => {
    if (osmosisConcentration < 0.25) {
      if (pHValue < 3.5 || pHValue > 11.5) {
        setCellState("lysed"); // burst
      } else {
        setCellState("swollen"); // Hypotonic swelling
      }
    } else if (osmosisConcentration > 0.75) {
      setCellState("shriveled"); // Hypertonic shrinking
    } else {
      setCellState("normal"); // Balanced state
    }
  }, [pHValue, osmosisConcentration]);

  // Return colored beaker fluid codes
  const getPHColor = (val: number) => {
    // interpolation from acidic red, neutral green/teal, and alkaline purple
    if (val < 7) {
      const ratio = val / 7;
      const r = Math.round(239 - ratio * 180); // 239 down to 59
      const g = Math.round(68 + ratio * 150); // 68 up to 218
      const b = Math.round(68 + ratio * 100);  // 68 up to 168
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const ratio = (val - 7) / 7;
      const r = Math.round(59 + ratio * 100);  // 59 up to 159
      const g = Math.round(218 - ratio * 160); // 218 down to 58
      const b = Math.round(168 + ratio * 87);  // 168 up to 255
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  // --- PHYSICS SIMULATION STATE ---
  const [starMass, setStarMass] = useState(10); // Standard mass scaling
  const [orbitalRadius, setOrbitalRadius] = useState(120); // Orbit radius distance
  const [isOrbiting, setIsOrbiting] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);

  // Render gravity orbits dynamic elements inside 2D canvas
  useEffect(() => {
    if (subjectId !== "physics" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;

    const draw = () => {
      // Clean frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw orbit path line
      ctx.strokeStyle = "rgba(168, 85, 247, 0.15)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, orbitalRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw gravitational potential lines (ripple layers)
      ctx.strokeStyle = "rgba(34, 211, 238, 0.1)";
      ctx.beginPath();
      ctx.arc(cx, cy, orbitalRadius * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      // Draw central massive Sun
      const sunRadius = 15 + starMass * 1.5;
      const sunGradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, sunRadius);
      sunGradient.addColorStop(0, "#fff7ed");
      sunGradient.addColorStop(0.3, "#fbe58a");
      sunGradient.addColorStop(1, "transparent");
      ctx.fillStyle = sunGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, sunRadius + 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(cx, cy, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      // Math calculates current orbit speed depending on starMass and Radius (V = sqrt(GM/R))
      const gravitationalConstant = 5;
      const orbitalSpeed = Math.sqrt((gravitationalConstant * starMass) / orbitalRadius) * 0.5;

      if (isOrbiting) {
        angleRef.current += orbitalSpeed;
      }

      // Planet Position coordinates
      const px = cx + Math.cos(angleRef.current) * orbitalRadius;
      const py = cy + Math.sin(angleRef.current) * orbitalRadius;

      // Draw Planet velocity vector indicator arrow
      const vx = -Math.sin(angleRef.current) * 40;
      const vy = Math.cos(angleRef.current) * 40;
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + vx, py + vy);
      ctx.stroke();

      // Draw planet velocity arrow head
      ctx.fillStyle = "#22d3ee";
      ctx.beginPath();
      ctx.arc(px + vx, py + vy, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw Planet gravity pull vector indicator arrow
      const px_dir = cx - px;
      const py_dir = cy - py;
      const pullLen = Math.min(60, starMass * 3.5);
      const pullRatio = pullLen / orbitalRadius;
      ctx.strokeStyle = "#ec4899";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + px_dir * pullRatio, py + py_dir * pullRatio);
      ctx.stroke();

      // Draw orbiting blue planet sphere
      ctx.fillStyle = "#3b82f6";
      ctx.shadowColor = "#3b82f6";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // Draw simple planetary atmosphere outline
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(px, py, 13, 0, Math.PI * 2);
      ctx.stroke();

      // Display kinetic telemetry descriptors
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "10px JetBrains Mono";
      ctx.fillText(`Gravitational Pull: ${(starMass / Math.pow(orbitalRadius/100, 2)).toFixed(1)} N`, 12, 20);
      ctx.fillText(`Orbit Speed: ${(orbitalSpeed * 60).toFixed(1)} km/s`, 12, 35);

      animFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [subjectId, starMass, orbitalRadius, isOrbiting]);

  // --- COMPUTER SCIENCE SIMULATION STATE ---
  const [binaryBits, setBinaryBits] = useState<number[]>([0, 1, 0, 0, 0, 0, 0, 1]); // default 'A' is 65 (01000001)

  // Gate Inputs
  const [gateA, setGateA] = useState(1);
  const [gateB, setGateB] = useState(0);
  const [gateOperator, setGateOperator] = useState<"AND" | "OR" | "XOR" | "NAND">("AND");
  const [gateOutput, setGateOutput] = useState(0);

  // Recalculate Logic Gates Output
  useEffect(() => {
    let result = 0;
    if (gateOperator === "AND") result = gateA && gateB;
    else if (gateOperator === "OR") result = gateA || gateB;
    else if (gateOperator === "XOR") result = gateA !== gateB ? 1 : 0;
    else if (gateOperator === "NAND") result = (gateA && gateB) ? 0 : 1;
    setGateOutput(result);
  }, [gateA, gateB, gateOperator]);

  const toggleBit = (idx: number) => {
    const nextArr = [...binaryBits];
    nextArr[idx] = nextArr[idx] === 0 ? 1 : 0;
    setBinaryBits(nextArr);
    onActivityComplete(5); // Grant small energy burst for exploration!
  };

  const calculateDecimal = () => {
    let total = 0;
    binaryBits.forEach((bit, idx) => {
      if (bit === 1) {
        total += Math.pow(2, 7 - idx); // 128, 64, 32, 16, 8, 4, 2, 1
      }
    });
    return total;
  };

  const getBitChar = (dec: number) => {
    if (dec >= 32 && dec <= 126) {
      return `'${String.fromCharCode(dec)}'`;
    }
    return "Control Code";
  };

  // --- COMMON AI EXPLAIN TRIGGER ---
  const triggerSimulationAIExplanation = async () => {
    setIsExplaining(true);
    let prompt = "";
    if (subjectId === "biology") {
      prompt = `A curious student is running our cell beaker simulation. Current settings: Molecular environmental pH is ${pHValue} and osmotic cellular intensity is ${osmosisConcentration.toFixed(2)}. This results in a cell status of "${cellState}". Explain the biology of pH and osmotic stress in this context. Use interactive analogies!`;
    } else if (subjectId === "physics") {
      prompt = `A student is utilizing the Gravity Planetary orbit lab. The star mass is ${starMass} solar units and the orbital radius distance is ${orbitalRadius} pixels. Explain the relationship between gravitational pull, escape speed, and orbits with these parameters in Physics. Keep it energetic!`;
    } else {
      prompt = `A student is testing binary bit registers and logic circuits. The 8-bit array is [${binaryBits.join(", ")}] totaling to ${calculateDecimal()}. In the Logic Gate board, switch A is ${gateA}, switch B is ${gateB}, and the operator is ${gateOperator} producing output ${gateOutput}. Explain how transistors combine binary bits to calculate complex files or codes in computers.`;
    }

    try {
      await onExplainAI(prompt);
      onActivityComplete(15); // Grant premium level activation energy points!
    } catch (e) {
      console.error(e);
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col h-full relative">
      
      {/* Module Title */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/10">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white tracking-wide text-sm sm:text-base">Module 2: Real-time Sim Lab</h3>
            <p className="text-[11px] text-white/50">Interact with sliding components & vector graphs</p>
          </div>
        </div>

        {/* Explain with AI widget button */}
        <button
          onClick={triggerSimulationAIExplanation}
          disabled={isExplaining}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400 text-white flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-lg shadow-cyan-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>{isExplaining ? "Explaining..." : "Explain with AI"}</span>
        </button>
      </div>

      {/* RENDER BIOLOGY pH & OSMOSIS LABORATORY */}
      {subjectId === "biology" && (
        <div className="flex-1 flex flex-col md:flex-row gap-6 items-center">
          
          {/* Beaker Representation container */}
          <div className="w-full md:w-1/2 flex flex-col items-center">
            
            <div className="relative w-44 h-56 border-x-4 border-b-4 border-white/20 rounded-b-3xl bg-slate-900/40 p-1 flex flex-col justify-end overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
              
              {/* Beaker scale markers */}
              <div className="absolute left-3 top-6 h-40 flex flex-col justify-between text-[9px] font-mono text-white/30 border-l border-white/10 pl-1 pointer-events-none z-10">
                <span>500ml</span>
                <span>400ml</span>
                <span>300ml</span>
                <span>200ml</span>
                <span>100ml</span>
              </div>

              {/* Bubbling Fluid Liquid content */}
              <div
                className="w-full rounded-b-2xl transition-all duration-700 relative flex items-center justify-center p-4 overflow-hidden"
                style={{
                  height: "75%",
                  backgroundColor: getPHColor(pHValue),
                  boxShadow: `0 0 40px ${getPHColor(pHValue)}44, inset 0 20px 30px rgba(255,255,255,0.2)`
                }}
              >
                {/* Microscopic Cell floating in fluid */}
                <div
                  className={`border-2 transition-all duration-700 flex flex-col items-center justify-center ${
                    cellState === "lysed"
                      ? "w-28 h-6 rounded-full border-dashed border-red-500/60 bg-red-950/25 animate-pulse text-[10px] text-red-300 font-bold"
                      : cellState === "shriveled"
                      ? "w-11 h-11 rounded-3xl border-purple-400 bg-purple-900/60 scale-90 rotate-12"
                      : cellState === "swollen"
                      ? "w-24 h-24 rounded-full border-cyan-300 bg-cyan-950/50 scale-110"
                      : "w-16 h-16 rounded-full border-teal-300 bg-teal-900/40"
                  }`}
                  style={{
                    boxShadow: "0 0 20px rgba(255,255,255,0.15)"
                  }}
                >
                  {cellState !== "lysed" ? (
                    <>
                      {/* Inside Nucleus bubble inside Cell */}
                      <span className="w-5 h-5 rounded-full bg-purple-500/80 animate-pulse border border-purple-400" />
                      <span className="text-[8px] uppercase tracking-widest font-mono text-white/80 mt-1 font-bold">
                        {cellState}
                      </span>
                    </>
                  ) : (
                    <span>🧬 Lysis Burst!</span>
                  )}
                </div>

                {/* Chemical bubbles rising */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.2)_10%,transparent_80%)] opacity-60">
                  <div className="absolute w-2 h-2 rounded-full bg-white/20 bottom-2 left-10 animate-ping"></div>
                  <div className="absolute w-1.5 h-1.5 rounded-full bg-white/30 bottom-1 right-12 animate-bounce"></div>
                </div>
              </div>

            </div>

            {/* Cell status badge indicators */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                pHValue < 5.5 
                  ? "bg-red-950 text-red-400 border border-red-500/20" 
                  : pHValue > 8.5 
                  ? "bg-purple-950 text-purple-300 border border-purple-500/20" 
                  : "bg-emerald-950 text-emerald-300 border border-emerald-500/20"
              }`}>
                {pHValue < 5.5 ? "🔴 Highly Acidic" : pHValue > 8.5 ? "🟣 Highly Alkaline" : "🟢 Healthy Neutral pH"}
              </span>

              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                cellState === "lysed"
                  ? "bg-red-900/60 text-white animate-pulse"
                  : cellState === "swollen"
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-500/20"
                  : cellState === "shriveled"
                  ? "bg-orange-950 text-orange-400 border border-orange-500/20"
                  : "bg-teal-950 text-teal-300 border border-teal-500/20"
              }`}>
                Cellular Osmosis: {cellState}
              </span>
            </div>
          </div>

          {/* Interactive Lab parameters sliders controls */}
          <div className="w-full md:w-1/2 space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-white/80">Acidity Beaker environment (pH: {pHValue})</label>
                <span className="text-xs font-mono font-bold text-cyan-300">{pHValue === 7 ? "Neutral (Pure Water)" : pHValue < 7 ? `Acidic` : `Alkaline`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="14"
                step="1"
                value={pHValue}
                onChange={(e) => {
                  setPHValue(Number(e.target.value));
                  onActivityComplete(1); // grant XP
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] font-mono text-white/30 mt-1">
                <span className="text-red-400 font-bold">0 (Acid)</span>
                <span>7 (Neutral)</span>
                <span className="text-purple-400 font-bold">14 (Base)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-white/80">Active Osmosis salinity content (H₂O ratio: {osmosisConcentration.toFixed(2)})</label>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {osmosisConcentration < 0.35 ? "Pure Water (Hypotonic)" : osmosisConcentration > 0.65 ? "Salty (Hypertonic)" : "Balanced (Isotonic)"}
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.95"
                step="0.05"
                value={osmosisConcentration}
                onChange={(e) => {
                  setOsmosisConcentration(Number(e.target.value));
                  onActivityComplete(1);
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-400 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] font-mono text-white/30 mt-1">
                <span>Distilled Water (Pure)</span>
                <span>Isotonic</span>
                <span>Highly Saline (Salt-dense)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 text-[11px] text-white/70 leading-relaxed font-sans mt-2">
              <span className="font-semibold text-cyan-300 block mb-1">💡 Biologist Observation Room:</span>
              Placing living animal cells in pure distilled water (hypotonic) causes water to rush inward via osmosis, swelling the membrane until it ultimately ruptures, termed **cell lysis**! Acidic or base pH speeds up this destruction.
            </div>
          </div>

        </div>
      )}

      {/* RENDER PHYSICS ORBIT SIMULATION */}
      {subjectId === "physics" && (
        <div className="flex-1 flex flex-col md:flex-row gap-6 items-center">
          
          {/* Gravitational Sandbox canvas */}
          <div className="w-full md:w-1/2 flex flex-col items-center">
            <div className="relative border border-white/10 rounded-xl overflow-hidden bg-slate-950/80 shadow-2xl">
              <canvas
                ref={canvasRef}
                width={260}
                height={260}
                className="block"
              />
              
              {/* Play Pause button on Canvas overlay */}
              <div className="absolute bottom-2 right-2 flex gap-1.5">
                <button
                  onClick={() => setIsOrbiting(!isOrbiting)}
                  className="p-1 px-2.5 rounded-md bg-slate-900/80 border border-white/15 hover:bg-slate-800 transition-all text-[9.5px] text-white font-mono flex items-center gap-1 cursor-pointer"
                >
                  <Play className={`w-3 h-3 ${isOrbiting ? "text-cyan-400 fill-cyan-400" : "text-white"}`} />
                  <span>{isOrbiting ? "PAUSE" : "START"}</span>
                </button>
                <button
                  onClick={() => {
                    angleRef.current = 0;
                    setStarMass(10);
                    setOrbitalRadius(120);
                  }}
                  className="p-1 rounded-md bg-slate-900/80 border border-white/15 hover:bg-slate-800 transition-all text-white cursor-pointer"
                  title="Reset Kepler Orbit Parameters"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Kepler physics controls parameters sliders */}
          <div className="w-full md:w-1/2 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-white/80">Mass of Central Star (Sun: {starMass}x)</label>
                <span className="text-xs font-mono font-bold text-amber-300">Gravity strength multiplier</span>
              </div>
              <input
                type="range"
                min="4"
                max="24"
                step="1"
                value={starMass}
                onChange={(e) => {
                  setStarMass(Number(e.target.value));
                  onActivityComplete(1);
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] font-mono text-white/30 mt-1">
                <span>Dwarf Star</span>
                <span>Main Sequence</span>
                <span className="text-amber-400">Super Giant Sun</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-white/80">Orbital Distance Radii (r: {orbitalRadius}px)</label>
                <span className="text-xs font-mono font-bold text-purple-300">Planet Spacing</span>
              </div>
              <input
                type="range"
                min="65"
                max="125"
                step="5"
                value={orbitalRadius}
                onChange={(e) => {
                  setOrbitalRadius(Number(e.target.value));
                  onActivityComplete(1);
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] font-mono text-white/30 mt-1">
                <span className="text-red-400">Danger Zone (Close)</span>
                <span>Optimized Path</span>
                <span>Outer Reaches</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 text-[11px] text-white/70 leading-relaxed font-sans">
              <span className="font-semibold text-purple-300 block mb-1">🪐 Physics Gravity Vector Room:</span>
              Vector arrows represent gravity dragging the planet inward (**Pink Arrow**) and kinetic tangential inert velocity (**Cyan Arrow**). In stable Kepler Orbits, these balances prevent the planet from crashing or sliding off!
            </div>
          </div>

        </div>
      )}

      {/* RENDER COMPUTER SCIENCE BINARY GATEWAYS SIMULATION */}
      {subjectId === "computer_science" && (
        <div className="flex-1 flex flex-col gap-6">

          {/* Part 1: Interactive Binary Bits Switches */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono tracking-wider text-pink-400 font-bold uppercase block mb-3">
              🔋 Part 1: 8-Bit Machine Code Translator
            </span>

            <div className="grid grid-cols-8 gap-2 items-center justify-items-center mb-4">
              {binaryBits.map((bit, idx) => {
                const weight = Math.pow(2, 7 - idx);
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5 w-full">
                    {/* Weight placeholder */}
                    <span className="text-[9px] font-mono text-white/32">{weight}</span>
                    <button
                      onClick={() => toggleBit(idx)}
                      className={`w-full py-2.5 rounded-lg font-mono font-bold text-[14px] border transition-all ${
                        bit === 1
                          ? "bg-gradient-to-t from-pink-500 to-rose-400 text-white border-pink-400 scale-105 shadow-[0_0_10px_rgba(236,72,153,0.3)]"
                          : "bg-slate-900 text-slate-400 border-white/5 hover:border-white/10"
                      }`}
                    >
                      {bit}
                    </button>
                    <span className="text-[8px] font-mono text-white/40">{bit === 1 ? "ON" : "OFF"}</span>
                  </div>
                );
              })}
            </div>

            {/* Decimal Translation Readouts */}
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[9px] font-mono text-white/40 block">DECIMAL VALUE</span>
                  <span className="font-mono font-bold text-white text-[16px] text-pink-400">{calculateDecimal()}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-white/40 block">ASCII CHARACTER</span>
                  <span className="font-mono font-bold text-white text-[16px] text-cyan-300">{getBitChar(calculateDecimal())}</span>
                </div>
              </div>
              <p className="text-[9.5px] text-white/40 max-w-[50%] text-right leading-tight">
                Computers combine clusters of these 8 switches (Bytes) to represent every character typing on your chat board!
              </p>
            </div>
          </div>

          {/* Part 2: Interactive Electronic Gate module */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="w-full sm:w-2/5 flex flex-col justify-between">
              <span className="text-[10px] font-mono tracking-wider text-cyan-400 font-bold uppercase block mb-3">
                🔌 Part 2: Logic Gates Circuit board
              </span>

              {/* Switches A & B */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/80 font-semibold">Tether Input Switch A</span>
                  <button
                    onClick={() => {
                      setGateA(gateA === 0 ? 1 : 0);
                      onActivityComplete(2);
                    }}
                    className={`px-3 py-1 rounded-md font-mono text-xs font-bold border ${
                      gateA === 1 ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40" : "bg-slate-800 text-slate-400 border-white/5"
                    }`}
                  >
                    {gateA === 1 ? "ON (1)" : "OFF (0)"}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/80 font-semibold">Tether Input Switch B</span>
                  <button
                    onClick={() => {
                      setGateB(gateB === 0 ? 1 : 0);
                      onActivityComplete(2);
                    }}
                    className={`px-3 py-1 rounded-md font-mono text-xs font-bold border ${
                      gateB === 1 ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40" : "bg-slate-800 text-slate-400 border-white/5"
                    }`}
                  >
                    {gateB === 1 ? "ON (1)" : "OFF (0)"}
                  </button>
                </div>
              </div>
            </div>

            {/* Circuit operator dropdown selector and neon lights vector wireframe */}
            <div className="flex-1 flex items-center justify-center p-2 gap-3">
              
              {/* Gate Operator Selection dropdown */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-white/45 mb-1 text-center">GATE SELECT</span>
                <select
                  value={gateOperator}
                  onChange={(e) => {
                    setGateOperator(e.target.value as any);
                    onActivityComplete(3);
                  }}
                  className="bg-slate-900 border border-white/10 text-cyan-300 py-1.5 px-3 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="AND">AND GATE</option>
                  <option value="OR">OR GATE</option>
                  <option value="XOR">XOR GATE</option>
                  <option value="NAND">NAND GATE</option>
                </select>
              </div>

              {/* Arrow transition circuit graphic */}
              <div className="text-[18px]">⚡</div>

              {/* Calculated output lamp */}
              <div className="text-center">
                <span className="text-[9px] font-mono text-white/45 mb-1 block">OUTPUT RESULT</span>
                <div
                  className={`w-14 py-2 font-mono font-bold text-xs rounded-lg border transition-all text-center ${
                    gateOutput === 1
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {gateOutput === 1 ? "TRUE (1)" : "FALSE (0)"}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
