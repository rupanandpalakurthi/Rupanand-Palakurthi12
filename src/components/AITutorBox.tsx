import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Sparkles, AlertCircle, BookOpen, Volume2 } from "lucide-react";

interface AITutorBoxProps {
  subjectId: string;
  activeExplanation: { text: string; source: string } | null;
  onAskAI: (question: string) => Promise<void>;
  mascotGreeting: string;
}

export default function AITutorBox({ subjectId, activeExplanation, onAskAI, mascotGreeting }: AITutorBoxProps) {
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Custom non-blocking interactive alert states for iframe sandbox safety
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Typewriter effect state
  const [displayedText, setDisplayedText] = useState("");
  const textEndRef = useRef<HTMLDivElement>(null);

  // Suggested questions based on active subject context
  const suggestions: Record<string, string[]> = {
    biology: ["Explain photosynthesis", "What is rough ER?", "Why is cell division vital?"],
    physics: ["What is terminal velocity?", "How does Einstein relate to gravity?", "What is friction?"],
    computer_science: ["Explain CPU registers", "How do logic gates make processors?", "What is a binary byte?"]
  };

  // Animate explanation with typewriter pacing
  useEffect(() => {
    if (!activeExplanation) {
      setDisplayedText("");
      return;
    }

    setDisplayedText("");
    let currentIdx = 0;
    const txt = activeExplanation.text;
    
    // We speed up typing speed for longer paragraphs so the user experience stays snappy!
    const delay = txt.length > 200 ? 5 : 12;

    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + txt.charAt(currentIdx));
      currentIdx++;
      if (currentIdx >= txt.length) {
        clearInterval(timer);
      }
    }, delay);

    return () => clearInterval(timer);
  }, [activeExplanation]);

  // Scroll explanation to view
  useEffect(() => {
    if (textEndRef.current) {
      textEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayedText]);

  // Web Speech API / Mic handler
  const startSpeechRecognition = () => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showTemporaryAlert("Web Speech API is not supported in this browser version. Please type your query!");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          showTemporaryAlert("Microphone permission was denied. Enable permission in address bar to use voice input!");
        } else {
          showTemporaryAlert(`Voice Input: ${event.error}. Please try again helper!`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          // Auto trigger
          handleTriggerQuestion(transcript);
        }
      };

      recognition.start();
    } catch (e: any) {
      console.error(e);
      setIsListening(false);
    }
  };

  const showTemporaryAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => {
      setAlertMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleTriggerQuestion = async (text: string) => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAskAI(text);
      setInputText("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTriggerQuestion(inputText);
  };

  // Text reader utility
  const handleReadAloud = () => {
    const textToRead = activeExplanation?.text || mascotGreeting;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      // Clean markdown tags out
      const cleanText = textToRead.replace(/[#*`_🧬🔋🛡️🪐☀️🏹💾🧠🔌🔌🎉🏆💡]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.pitch = 1.15; // friendly tutor voice height
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } else {
      showTemporaryAlert("Speech synthesis is not supported on this device.");
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col h-full relative">
      
      {/* Dynamic Iframe Sandbox Friendly Notifications */}
      {alertMessage && (
        <div className="absolute top-4 left-4 right-4 z-20 bg-amber-950/90 border border-amber-500/40 text-amber-200 px-4 py-3 rounded-xl flex items-start gap-3 shadow-xl animate-fade-in text-xs">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">BrightMind AI Voice Companion</span>
            {alertMessage}
          </div>
          <button onClick={() => setAlertMessage(null)} className="text-amber-400 hover:text-white font-bold ml-2">×</button>
        </div>
      )}

      {/* Mascot Header Banner */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-4">
        {/* Animated Cyber Mascot (glowing float orb) */}
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 p-[2px] animate-orb-float shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-laser-pulse">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden relative">
              
              {/* SVG Glowing Face */}
              <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Antennas */}
                <circle cx="50" cy="18" r="6" fill="#22d3ee" className="animate-pulse" />
                <line x1="50" y1="18" x2="50" y2="35" stroke="#22d3ee" strokeWidth="3" />
                
                {/* Robot digital glass visor */}
                <rect x="20" y="38" width="60" height="30" rx="15" fill="#130e2e" stroke="#c084fc" strokeWidth="2" />
                
                {/* Interactive Blinking Robotic Eyes */}
                <circle cx="40" cy="53" r="5" fill="#22d3ee" className="animate-pulse">
                  <animate attributeName="cy" values="53;53;48;53;53" dur="5s" repeatCount="indefinite" />
                </circle>
                <circle cx="60" cy="53" r="5" fill="#22d3ee" className="animate-pulse">
                  <animate attributeName="cy" values="53;53;48;53;53" dur="5s" repeatCount="indefinite" />
                </circle>
                
                {/* Smiling mouth neon */}
                <path d="M42 63 Q50 67 58 63" stroke="#e879f9" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900" title="BrightMind Live online" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display font-bold text-white tracking-wide text-sm sm:text-base">ROBY — AI Tutor</h3>
            <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-widest bg-cyan-950 text-cyan-400 border border-cyan-500/20">
              {activeExplanation ? "Interactive Explained" : "Ready"}
            </span>
          </div>
          <p className="text-[11px] text-white/50 truncate">Powered by robust Gemini 3.5 AI</p>
        </div>

        {/* Listen Audio button */}
        <button
          onClick={handleReadAloud}
          className="p-2 rounded-lg bg-slate-800/60 text-cyan-300 hover:text-white border border-white/5 hover:border-cyan-500/20 transition-all flex items-center justify-center"
          title="Narrate Explanation"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* Primary chat workspace container */}
      <div className="flex-1 flex flex-col bg-slate-900/40 rounded-xl p-4 border border-white/5 overflow-y-auto max-h-[290px] min-h-[180px] mb-4">
        
        {/* Mascot Greeting Speech Balloon */}
        <div className="bg-slate-950/60 p-3 rounded-r-xl rounded-bl-xl border border-white/5 mb-4 text-xs leading-relaxed text-white/95 max-w-[90%] font-sans flex gap-2">
          <span className="text-base shrink-0">🛸</span>
          <p>{mascotGreeting}</p>
        </div>

        {/* Display Explanation dynamically */}
        {displayedText ? (
          <div className="border-t border-cyan-500/10 pt-3 animate-fade-in">
            <div className="flex items-center gap-2 mb-2 text-[10px] tracking-wider font-mono text-cyan-400 font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Response: {activeExplanation?.source}</span>
            </div>
            
            <div className="text-xs text-white/90 leading-relaxed font-sans prose-custom whitespace-pre-line">
              {displayedText}
            </div>
            <div ref={textEndRef} />
          </div>
        ) : isSubmitting ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase animate-pulse">Calculating via Google GenAI...</span>
          </div>
        ) : null}
      </div>

      {/* Suggested helper items */}
      <div className="mb-4">
        <span className="text-[10px] uppercase tracking-wider font-mono text-white/40 block mb-2 flex items-center gap-1.5 font-bold">
          <BookOpen className="w-3 h-3" /> Sample subjects topics
        </span>
        <div className="flex flex-wrap gap-1.5">
          {suggestions[subjectId]?.map((item) => (
            <button
              key={item}
              onClick={() => handleTriggerQuestion(item)}
              disabled={isSubmitting}
              className="px-2 py-1 text-[10.5px] rounded-lg bg-slate-900/60 hover:bg-cyan-950/40 text-cyan-300 border border-cyan-500/10 hover:border-cyan-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              🚀 "{item}"
            </button>
          ))}
        </div>
      </div>

      {/* Custom Questions Input block */}
      <form onSubmit={handleSubmit} className="relative mt-auto">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSubmitting || isListening}
            placeholder={isListening ? "Listening closely... Speak now!" : "Ask Roby ('Explain photosynthesis'...)"}
            className="w-full bg-slate-950/80 text-white rounded-xl py-3 pl-4 pr-24 border border-white/10 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all text-xs font-sans placeholder-white/30"
          />
          
          <div className="absolute right-2 flex items-center gap-1">
            {/* Input Speech recognition activator */}
            <button
              type="button"
              onClick={startSpeechRecognition}
              disabled={isSubmitting}
              className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                isListening 
                  ? "bg-red-500 text-white animate-pulse" 
                  : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-705"
              }`}
              title="Voice Input (Speech recognition)"
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !inputText.trim() || isListening}
              className="p-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 text-white hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
