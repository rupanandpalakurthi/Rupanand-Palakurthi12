export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface MatchingPair {
  id: string;
  term: string;
  definition: string;
}

export interface Hotspot {
  id: string;
  label: string;
  description: string;
  position: [number, number, number]; // 3D coordinates in the Three.js model scene
}

export interface SubjectData {
  id: string;
  name: string;
  colorName: string; // cyan, purple, pink
  badgeText: string;
  tagline: string;
  description: string;
  mascotGreeting: string;
  bannerGradient: string;
  hotspots: Hotspot[];
  quizQuestions: QuizQuestion[];
  matchingPairs: MatchingPair[];
}

export const SUBJECTS: Record<string, SubjectData> = {
  biology: {
    id: "biology",
    name: "Biology",
    colorName: "cyan",
    badgeText: "🧬 BioCell Explorer v2.5",
    tagline: "Cellular Structure & Organelles",
    description: "Zoom micro-cosmically inside a eukaryotic animal cell! Hover, rotate, and select organelles to unleash interactive AI definitions.",
    mascotGreeting: "Hi there, futuristic biologist! Cellular structures are the bricks of all living things. Click on the cell nucleus inside to see live DNA plans!",
    bannerGradient: "from-cyan-400 via-teal-400 to-indigo-600",
    hotspots: [
      { id: "nucleus", label: "Nucleus 🧬", description: "The brain! Houses genetic DNA instructions and serves as the command headquarters.", position: [0, 0, 0] },
      { id: "mitochondria", label: "Mitochondria 🔋", description: "The cell powerhouse! Synthesizes high-energy ATP molecules from sugars.", position: [1.8, 0.8, -0.5] },
      { id: "ribosome", label: "Ribosome 🏭", description: "The protein factory! Tiny granules translating messenger RNA into vital proteins.", position: [-1.2, -1.2, 0.8] },
      { id: "membrane", label: "Membrane 🛡️", description: "The gatekeeper! Double-lipid envelope regulating whatever passes inside or out.", position: [0, -2.2, 1.5] }
    ],
    quizQuestions: [
      {
        id: 1,
        question: "Which cellular organelle is famously termed the 'Powerhouse of the Cell'?",
        options: ["Nucleus", "Ribosome", "Mitochondria", "Lysosome"],
        correctAnswerIndex: 2,
        explanation: "Mitochondria act as power stations by burning sugar molecules to yield ATP (Adenosine Triphosphate) energy!"
      },
      {
        id: 2,
        question: "What contains the primary genetic instructions (DNA) of a eukaryotic cell?",
        options: ["Cytoplasm", "Nucleus", "Ribosome", "Golgi Apparatus"],
        correctAnswerIndex: 1,
        explanation: "The Nucleus contains chromosomes and runs the genetic operations as the command center."
      },
      {
        id: 3,
        question: "What is the primary product synthesized by ribosomes?",
        options: ["Oxygen", "Proteins", "Glucose", "Lipids"],
        correctAnswerIndex: 1,
        explanation: "Ribosomes translate genetics to join amino acids and assemble beautiful complex proteins."
      },
      {
        id: 4,
        question: "What cellular boundary decides which substances enter or exit the cell?",
        options: ["Cell Membrane", "Nuclear Envelope", "Vacuole", "Mitochondria Surface"],
        correctAnswerIndex: 0,
        explanation: "The lipid double membrane acts as a smart semi-permeable boundary or gatekeeper."
      },
      {
        id: 5,
        question: "Rough Endoplasmic Reticulum looks bumpy because it is studded with which organelle?",
        options: ["Mitochondria", "Lysosomes", "Ribosomes", "Chloroplasts"],
        correctAnswerIndex: 2,
        explanation: "Ribosomes stick to the surface of Rough ER, giving it a bumpy texture as they manufacture proteins."
      }
    ],
    matchingPairs: [
      { id: "bio-1", term: "Nucleus", definition: "Holds genetic DNA plans as cell control center" },
      { id: "bio-2", term: "Mitochondria", definition: "Powerhouse of cell, generates ATP fuel cells" },
      { id: "bio-3", term: "Ribosome", definition: "Hardworking organelle which synthesizes proteins" },
      { id: "bio-4", term: "Cell Membrane", definition: "The smart semi-permeable gatekeeper boundary" }
    ]
  },
  physics: {
    id: "physics",
    name: "Physics",
    colorName: "purple",
    badgeText: "🪐 AstroGravity Sim v3.0",
    tagline: "Gravity, Orbits, & Kinetic Energy",
    description: "Travel to orbit! Command gravity with real physical mass sliders and adjust proximity to see objects accelerate in mathematical vectors.",
    mascotGreeting: "Welcome, cosmic mechanic! Gravity curves space itself. Drag the mass sliders below to witness how orbits bend. Watch high gravity capture everything!",
    bannerGradient: "from-purple-500 via-pink-500 to-indigo-700",
    hotspots: [
      { id: "sun", label: "Massive Star (Sun) ☀️", description: "Primary gravity anchors! Composing over 99.8% of orbit weight.", position: [0, 0, 0] },
      { id: "planet", label: "Orbiter Planet 🪐", description: "A planetary projectile travelling with linear speed kept in balance by gravity.", position: [1.9, 0, 1.2] },
      { id: "gravity", label: "Gravity Force Vectors 🏹", description: "The gravitational field lines dragging mass inwards proportionally to 1/r².", position: [0.9, 0.2, 0.4] }
    ],
    quizQuestions: [
      {
        id: 1,
        question: "What happens to the gravitational attraction between two stars if you slide their mass higher?",
        options: ["Attraction decreases", "Attraction increases", "Stays exactly equal", "Reverses into push"],
        correctAnswerIndex: 1,
        explanation: "Newton's standard Gravitational Law tells us pull is directly proportional to the product of both star masses!"
      },
      {
        id: 2,
        question: "If distance between two orbiting bodies is doubled, gravity goes down by what factor?",
        options: ["Halved (1/2)", "Unaffected", "Reduced to a quarter (1/4)", "Vanishes to complete zero"],
        correctAnswerIndex: 2,
        explanation: "Gravity obeys the Inverse-Square Law. Double the distance (2x) yields (1/2)² or 1/4th the pulling force."
      },
      {
        id: 3,
        question: "Why does an satellite not fall directly into the planet it orbits?",
        options: ["Space has complete zero gravity", "High horizontal orbit speed keeps it 'falling around' the planet", "Engine boosters constantly shove it upwards", "Planets actively push satellites away"],
        correctAnswerIndex: 1,
        explanation: "An orbit is a continuous free fall! The satellite travels horizontally so fast that as it falls, the planet curves underneath it."
      },
      {
        id: 4,
        question: "Which famous physicist formulated the Law of Universal Gravitation inside of a classic apple Orchard?",
        options: ["Albert Einstein", "Isaac Newton", "Niels Bohr", "Galileo Galilei"],
        correctAnswerIndex: 1,
        explanation: "Isaac Newton mathematical rules united planetary motions with falling orchard fruits under one master dynamic in 1687."
      },
      {
        id: 5,
        question: "What is the fast celestial velocity called that allows a spacecraft to break completely free of gravity?",
        options: ["Linear speed", "Terminal velocity", "Escape velocity", "Speed of sound"],
        correctAnswerIndex: 2,
        explanation: "Escape velocity is the minimum launch speed required for non-propelled projectiles to leave a gravitational well forever."
      }
    ],
    matchingPairs: [
      { id: "phys-1", term: "Gravity", definition: "Attractive pull relative to the product of masses" },
      { id: "phys-2", term: "Orbit", definition: "Horizontal free-fall pathway curved around stars" },
      { id: "phys-3", term: "Newton", definition: "Defined absolute gravitation rules of motion" },
      { id: "phys-4", term: "Escape Velocity", definition: "Speed required to break free of planet pull" }
    ]
  },
  computer_science: {
    id: "computer_science",
    name: "Computer Science",
    colorName: "pink",
    badgeText: "💻 Digital Logic Core v1.1",
    tagline: "Binary, Bits & Machine Circuits",
    description: "Explore the computer architecture! Toggle logic bits, play logic gate circuits, and witness how switches create digital calculations.",
    mascotGreeting: "Hello, digital architect! Computers don't speak human alphabets; they speak binary! Toggle the binary switches to see decimal values translate dynamically.",
    bannerGradient: "from-pink-500 via-rose-400 to-orange-500",
    hotspots: [
      { id: "bit", label: "Binary Bits 💾", description: "The smallest digital atoms! Expressing either 0 (OFF) or 1 (ON).", position: [-0.6, 0.8, 0.8] },
      { id: "cpu", label: "ALU Calculator Unit 🧠", description: "Performs logical and math transformations inside the processor core.", position: [0.6, -0.4, -0.6] },
      { id: "logic_gate", label: "Neon Logic Gates 🔌", description: "Combining electronic streams (AND, OR, NOT) to filter byte pathways.", position: [1.2, 1.2, 0] }
    ],
    quizQuestions: [
      {
        id: 1,
        question: "What are the only two numeric digits used in standard binary machine code?",
        options: ["1 and 2", "0 and 1", "0 and 9", "Bit and Byte"],
        correctAnswerIndex: 1,
        explanation: "Machine circuits run on binary transistors which represent either completely OFF (0) or completely ON (1) electric statuses."
      },
      {
        id: 2,
        question: "How many distinct bits are stored together to create one standard Byte?",
        options: ["4 bits", "16 bits", "8 bits", "1024 bits"],
        correctAnswerIndex: 2,
        explanation: "It takes exactly 8 binary bits grouped together to represent a standard byte, enough for 256 alphanumeric characters."
      },
      {
        id: 3,
        question: "If a byte reads binary '0000 0101', what does it represent in standard decimal values?",
        options: ["5", "3", "10", "1"],
        correctAnswerIndex: 0,
        explanation: "Starting from right to left, place weights (1, 2, 4, 8...). The bits enabled are at positions 1 and 4, which yields 1 + 4 = 5."
      },
      {
        id: 4,
        question: "Which electronic logic gate outputs TRUE only when BOTH incoming source inputs are ON (1)?",
        options: ["OR Gate", "NOT Gate", "AND Gate", "XOR Gate"],
        correctAnswerIndex: 2,
        explanation: "The AND Gate is an electronic conjunction; BOTH input A and input B must be TRUE to output an enabled signal."
      },
      {
        id: 5,
        question: "What is the electronic processor component that acts like a microscopic traffic switch for electricity?",
        options: ["Capacitor", "Transistor", "Resistor", "Inductor"],
        correctAnswerIndex: 1,
        explanation: "A transistor behaves exactly like a mechanical light switch but is controlled electrically, switching ON or OFF in nanoseconds."
      }
    ],
    matchingPairs: [
      { id: "cs-1", term: "Bit", definition: "Singular electrical value either OFF (0) or ON (1)" },
      { id: "cs-2", term: "Byte", definition: "Pack of 8 bits representing standard symbols" },
      { id: "cs-3", term: "AND Gate", definition: "Outputs truth ONLY if both inputs are enabled" },
      { id: "cs-4", term: "Transistor", definition: "Microscopic switch underlying computer chips" }
    ]
  }
};
