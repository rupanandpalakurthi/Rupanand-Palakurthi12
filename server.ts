import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Predefined fallback explanations for offline / missing-API-key mode
const FALLBACK_EXPLANATIONS: Record<string, string> = {
  nucleus: "🧬 **The Nucleus (Cell Control Center):** Think of the nucleus as the 'Brain' of the cell! It lives right in the center and holds all the DNA instructions. It tells every other organelle exactly what to do, what proteins to make, and when to divide. Without it, the cell wouldn't know how to function!",
  mitochondria: "🔋 **The Mitochondria (The Cell Generator):** This is the ultimate power generator! They take nutrients from the food you eat and turn them into chemical energy (ATP) that your cell can use to move, grow, and explore. It is literally the 'Powerhouse' of the cell!",
  ribosome: "🏭 **The Ribosome (The Protein Factory):** Ribosomes are tiny but super hardworking machines! They read molecular recipes and build proteins, which are the essential bricks used to build muscles, heal scrapes, and keep the cell structurally strong.",
  sun: "☀️ **The Sun (Our Solar Anchor):** A massive ball of hot plasma at the center of our solar system! It contains 99.8% of all the solar system's mass. Its super-strong gravity keeps all the planets orbiting in perfect paths, and its light powers all life on Earth!",
  planet: "🪐 **Planets (Cosmic Drifters):** Planets are large spherical bodies orbiting the Sun. They clear their own orbital paths of debris. They rotate on their axes while travelling at blazing speeds through outer space!",
  gravity: "🪐 **Gravity (The Invisible Tug of War):** Gravity is the magic invisible force that pulls objects toward each other! The heavier an object is, the stronger its pull. That is why the massive Earth keeps your feet glued to the ground, and why the moon orbits Earth!",
  friction: "🚗 **Friction (The Motion Breaker):** Friction is the resistive force that happens when two surfaces rub together. It slows moving things down and generates heat. It's the reason why your bike brakes work and why your hands feel warm when rubbed together!",
  bit: "💾 **The Bit (Binary Basis):** A bit is the smallest, most fundamental unit of computer data! It is a tiny light switch inside a computer chip that can only be either **0 (OFF / False)** or **1 (ON / True)**. Everything else—games, videos, and photos—is made of billions of these bits!",
  cpu: "🧠 **The CPU (The Processor Brain):** The Central Processing Unit is where the magic happens! It performs millions of rapid calculations every single second by combining bits through tiny electric paths called logic gates.",
  logic_gate: "🔌 **Logic Gates (The Digital Sorters):** Logic gates are decision-makers for electricity! They receive ON or OFF signals (like AND, OR, NOT) and produce a output signal based on strict mathematical logic.",
  binary: "🔢 **Binary Language (Digital Code):** Computers don't speak English or Spanish. They speak Binary, which uses only zeros and ones! Every letter you type and every pixel you see is represented by a unique sequence of bits (like 'A' being 01000001)."
};

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize Gemini Client: ", err);
    return null;
  }
}

// 1. Endpoint for custom explained topics
app.post("/api/ai/explain", async (req: Request, res: Response) => {
  const { subject, topic, customQuestion } = req.body;
  const topicName = topic ? String(topic).toLowerCase().trim() : "";
  const query = customQuestion ? String(customQuestion).trim() : "";

  const finalQuery = query || `Explain ${topic || subject} in a fun, educational, and engaging way.`;

  console.log(`[EduSphere API] Explain Request - Topic: "${topic}", Question: "${query}"`);

  // Try to use Gemini
  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are EduSphere AI, a friendly, hyper-energetic, and smart 3D science assistant.
Provide a high-energy, kid-friendly, yet deeply educational explanation.
Use exciting analogies, bullet points, emoji characters, and clear formatting.
Maximum length: 180 words. Keep it highly readable with spacing.
Target: "${finalQuery}" under subject context: "${subject || "general science"}".`,
      });

      if (response && response.text) {
        return res.json({
          source: "Gemini AI Live",
          text: response.text,
        });
      }
    } catch (error: any) {
      console.error("Gemini Live Error:", error);
    }
  }

  // Fallback to preloaded text if available
  const keys = Object.keys(FALLBACK_EXPLANATIONS);
  const matchedKey = keys.find(k => topicName.includes(k) || k.includes(topicName));
  const fallbackText = matchedKey 
    ? FALLBACK_EXPLANATIONS[matchedKey]
    : `🌟 **EduSphere Discovery Mode Active:** Here is a fascinating exploration into **"${topic || subject}"**! \n\nScience is all about exploring questions. This concept is vital because it explains the basic rules of our universe. \n\n• **Fun Analogy:** Imagine it as a puzzle piece where everything fits together perfectly.\n• **Key Takeaway:** Always ask 'Why' and 'How'! \n\n*(Note: Connect your Gemini API Key in Settings to get real-time live answers to any question!)*`;

  return res.json({
    source: "EduSphere Offline Database",
    text: fallbackText,
  });
});

// 2. Endpoint for Quiz Hints and "Why this answer?"
app.post("/api/ai/quiz-reason", async (req: Request, res: Response) => {
  const { subject, question, answerSelected, correctAnswer, isCorrect } = req.body;

  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are EduSphere AI, the educational bot.
Analyze this quiz response for a curious student:
Subject: ${subject}
Question: "${question}"
Student selected: "${answerSelected}"
Correct Answer is: "${correctAnswer}"
Is Student Correct: ${isCorrect ? "YES" : "NO"}

Provide a short, 2-3 sentence enthusiastic explanation of WHY this answer is correct in a friendly, supportive tone. Encourage them! Use emojis. Max 80 words.`,
      });

      if (response && response.text) {
        return res.json({
          source: "Gemini AI Live",
          text: response.text,
        });
      }
    } catch (e) {
      console.error("Quiz explanation error:", e);
    }
  }

  // Predefined feedback fallback
  let fallbackReason = "";
  if (isCorrect) {
    fallbackReason = `🎉 **Super job!** You nailed it. "${correctAnswer}" is absolutely correct because it forms the biological, physical, or logical core of this concept. Keep up the amazing work!`;
  } else {
    fallbackReason = `💡 **Awesome effort!** The correct answer is actually **"${correctAnswer}"**. Don't worry, every mistake is a step closer to mastering science! Let's examine this concept again in the 3D Explorer.`;
  }

  return res.json({
    source: "EduSphere Offline Database",
    text: fallbackReason,
  });
});

// Serve static assets or mount Vite hot-reload middleware
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduSphere AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
