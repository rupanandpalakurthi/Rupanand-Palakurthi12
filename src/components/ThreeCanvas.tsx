import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface ThreeCanvasProps {
  subjectId: string;
  activeHotspotId: string | null;
  onHotspotClick: (hotspotId: string) => void;
}

export default function ThreeCanvas({ subjectId, activeHotspotId, onHotspotClick }: ThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Group references to dynamically animate meshes
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const biologyElements = useRef<{
    nucleus: THREE.Mesh;
    nucleolus: THREE.Mesh;
    mitochondria: THREE.Mesh[];
    membrane: THREE.LineSegments;
  } | null>(null);

  const physicsElements = useRef<{
    sun: THREE.Mesh;
    planet: THREE.Mesh;
    moon: THREE.Mesh;
    orbitLine: THREE.Line;
    planetGroup: THREE.Group;
  } | null>(null);

  const csElements = useRef<{
    lattice: THREE.GridHelper;
    bits: THREE.Mesh[];
    cores: THREE.Mesh[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    setIsLoading(true);

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // transparent background to blend with our gorgeous gradient backgrounds
    sceneRef.current = scene;

    // 2. Camera setup
    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 400;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 6.5);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Clear previous elements
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 15;
    controls.minDistance = 3;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0xa855f7, 2, 50); // Purple point light
    mainLight.position.set(5, 5, 5);
    scene.add(mainLight);

    const cyanLight = new THREE.PointLight(0x22d3ee, 2, 50); // Cyan point light
    cyanLight.position.set(-5, -5, 5);
    scene.add(cyanLight);

    const centralLight = new THREE.PointLight(0xffffff, 1.5, 10);
    centralLight.position.set(0, 0, 0);
    scene.add(centralLight);

    // 6. Define the master group to rotate and translate coordinates
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // 7. BUILD MESH ARCHITECTURE BASED ON ACTIVE SUBJECT
    if (subjectId === "biology") {
      // Biology: Animal Cell
      // Brain: Nucleus in center
      const nucleusGeo = new THREE.SphereGeometry(1.1, 32, 32);
      const nucleusMat = new THREE.MeshPhongMaterial({
        color: 0xa855f7, // glowing purple
        emissive: 0x4c1d95,
        shininess: 100,
        bumpScale: 0.05,
        transparent: true,
        opacity: 0.9,
      });
      const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
      modelGroup.add(nucleus);

      // Inner Nucleolus
      const nucleolusGeo = new THREE.SphereGeometry(0.4, 16, 16);
      const nucleolusMat = new THREE.MeshPhongMaterial({
        color: 0xec4899, // magenta
        emissive: 0x831843,
        transparent: false,
      });
      const nucleolus = new THREE.Mesh(nucleolusGeo, nucleolusMat);
      nucleus.add(nucleolus);

      // Powerhouse: Mitochondria
      const mitoGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.7, 16);
      const capTop = new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const capBot = new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);

      const mitoMat = new THREE.MeshPhongMaterial({
        color: 0x10b981, // emerald green
        emissive: 0x064e3b,
        shininess: 80,
      });

      // Construct a full pill capsule mitochondria
      const mitos: THREE.Mesh[] = [];
      const createMito = (pos: THREE.Vector3, rot: THREE.Euler) => {
        const singleMitoGroup = new THREE.Mesh(mitoGeo, mitoMat);
        const top = new THREE.Mesh(capTop, mitoMat);
        top.position.y = 0.35;
        const bot = new THREE.Mesh(capBot, mitoMat);
        bot.position.y = -0.35;
        singleMitoGroup.add(top, bot);
        singleMitoGroup.position.copy(pos);
        singleMitoGroup.rotation.copy(rot);
        modelGroup.add(singleMitoGroup);
        mitos.push(singleMitoGroup);
      };

      createMito(new THREE.Vector3(1.8, 0.8, -0.2), new THREE.Euler(0.5, 0.5, 1.2));
      createMito(new THREE.Vector3(-1.6, 0.9, 0.4), new THREE.Euler(1.2, -0.3, 0.5));
      createMito(new THREE.Vector3(0.5, -1.8, 0.6), new THREE.Euler(-0.4, 1.4, -0.8));

      // Cellular Outer Membrane (Stylized wireframe sphere)
      const membraneGeo = new THREE.SphereGeometry(2.4, 18, 12);
      const membraneWire = new THREE.WireframeGeometry(membraneGeo);
      const membraneMat = new THREE.LineBasicMaterial({
        color: 0x22d3ee, // cyan boundary
        transparent: true,
        opacity: 0.15,
      });
      const membrane = new THREE.LineSegments(membraneWire, membraneMat);
      modelGroup.add(membrane);

      // Lysosomes and Ribosomes scattered (tiny particles)
      const particleGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const particleMat = new THREE.MeshPhongMaterial({ color: 0xfdba74 }); // pastel orange
      for (let i = 0; i < 20; i++) {
        const ribo = new THREE.Mesh(particleGeo, particleMat);
        // Random spherical coordinates
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const radius = 1.3 + Math.random() * 0.9;
        ribo.position.x = radius * Math.sin(phi) * Math.cos(theta);
        ribo.position.y = radius * Math.sin(phi) * Math.sin(theta);
        ribo.position.z = radius * Math.cos(phi);
        modelGroup.add(ribo);
      }

      biologyElements.current = { nucleus, nucleolus, mitochondria: mitos, membrane };

    } else if (subjectId === "physics") {
      // Physics: Stellar Gravity System
      // Center Sun
      const sunGeo = new THREE.SphereGeometry(0.9, 32, 32);
      const sunMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24, // glowing golden sun
      });
      const sun = new THREE.Mesh(sunGeo, sunMat);
      modelGroup.add(sun);

      // Corona outer aura
      const coronaGeo = new THREE.SphereGeometry(1.02, 16, 16);
      const coronaMat = new THREE.MeshPhongMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        transparent: true,
        opacity: 0.35,
        wireframe: true,
      });
      const corona = new THREE.Mesh(coronaGeo, coronaMat);
      sun.add(corona);

      // Planet Orbit Rotator Group
      const planetGroup = new THREE.Group();
      modelGroup.add(planetGroup);

      // Blue planet
      const planetGeo = new THREE.SphereGeometry(0.38, 24, 24);
      const planetMat = new THREE.MeshPhongMaterial({
        color: 0x3b82f6,
        emissive: 0x1e3a8a,
        shininess: 90,
      });
      const planet = new THREE.Mesh(planetGeo, planetMat);
      planet.position.x = 2.2;
      planetGroup.add(planet);

      // Tiny Planet Moon
      const moonGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const moonMat = new THREE.MeshPhongMaterial({
        color: 0x94a3b8,
        shininess: 10,
      });
      const moon = new THREE.Mesh(moonGeo, moonMat);
      moon.position.x = 0.58;
      planet.add(moon);

      // Perfect Torus Orbit Line
      const orbitGeo = new THREE.RingGeometry(2.18, 2.22, 64);
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLine.rotation.x = Math.PI / 2;
      modelGroup.add(orbitLine);

      // Space Force Vector Ring arrows
      const helperGroup = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const theta = (i / 8) * Math.PI * 2;
        const arrowDir = new THREE.Vector3(-Math.cos(theta), 0, -Math.sin(theta)).normalize();
        const arrowOrigin = new THREE.Vector3(Math.cos(theta) * 2.2, 0, Math.sin(theta) * 2.2);
        const arrow = new THREE.ArrowHelper(arrowDir, arrowOrigin, 0.45, 0x22d3ee, 0.15, 0.1);
        helperGroup.add(arrow);
      }
      modelGroup.add(helperGroup);

      physicsElements.current = { sun, planet, moon, orbitLine, planetGroup };

    } else {
      // Computer Science: Floating Bytes and Circuits
      // 3D wire lattice
      const lattice = new THREE.GridHelper(5, 12, 0x22d3ee, 0x1e1548);
      lattice.position.y = -1.2;
      modelGroup.add(lattice);

      // CPU central processor block
      const cpuGeo = new THREE.BoxGeometry(1.6, 0.4, 1.6);
      const cpuMat = new THREE.MeshPhongMaterial({
        color: 0xec4899,
        emissive: 0x500730,
        shininess: 90,
      });
      const cpu = new THREE.Mesh(cpuGeo, cpuMat);
      cpu.position.y = -0.3;
      modelGroup.add(cpu);

      // CPU decorative neon bands
      const cpuBandGeo = new THREE.BoxGeometry(1.68, 0.08, 1.68);
      const cpuBandMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
      const cpuBand = new THREE.Mesh(cpuBandGeo, cpuBandMat);
      cpuBand.position.y = -0.3;
      modelGroup.add(cpuBand);

      // Generate floating blocks representing 3D Bits (0 and 1)
      const bits: THREE.Mesh[] = [];
      const bitGeo1 = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const bitGeo0 = new THREE.TorusGeometry(0.18, 0.06, 8, 16);

      const neonCyan = new THREE.MeshPhongMaterial({ color: 0x22d3ee, emissive: 0x083344 });
      const neonPurple = new THREE.MeshPhongMaterial({ color: 0xa855f7, emissive: 0x2e1065 });

      for (let i = 0; i < 6; i++) {
        // Create 3 representation of Bit 1 (cubes)
        const element = i % 2 === 0 ? new THREE.Mesh(bitGeo1, neonCyan) : new THREE.Mesh(bitGeo0, neonPurple);
        element.position.set(
          (Math.random() - 0.5) * 4.2,
          0.4 + Math.random() * 1.5,
          (Math.random() - 0.5) * 4.2
        );
        modelGroup.add(element);
        bits.push(element);
      }

      // Logic network lines
      const circuitGroup = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const points = [
          new THREE.Vector3((Math.random() - 0.5) * 2, -1, (Math.random() - 0.5) * 2),
          new THREE.Vector3((Math.random() - 0.5) * 1, -0.3, (Math.random() - 0.5) * 1),
          new THREE.Vector3((Math.random() - 0.5) * 2, 0.8, (Math.random() - 0.5) * 2),
        ];
        const lineGeo = new THREE.SplineCurve(points.map(p => new THREE.Vector2(p.x, p.y)));
        const geomPoints = lineGeo.getPoints(20);
        const circuitMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.5 });
        const geom = new THREE.BufferGeometry().setFromPoints(geomPoints.map(p => new THREE.Vector3(p.x, p.y, (Math.random() - 0.5) * 2)));
        const circuitLine = new THREE.Line(geom, circuitMat);
        circuitGroup.add(circuitLine);
      }
      modelGroup.add(circuitGroup);

      csElements.current = { lattice, bits, cores: [cpu] };
    }

    // Highlighting selection logic when a hotspot changes
    setIsLoading(false);

    // 8. Animation Loop
    let lastTime = 0;
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // 1. Slow cosmic background rotation on the outer master group
      if (modelGroup) {
        modelGroup.rotation.y += 0.08 * delta;
      }

      // 2. Animate specific subject structures
      if (subjectId === "biology" && biologyElements.current) {
        const { nucleus, membrane } = biologyElements.current;
        // Breathing animation
        const breath = Math.sin(time * 0.0015) * 0.04;
        nucleus.scale.set(1 + breath, 1 + breath, 1 + breath);
        membrane.rotation.x += 0.03 * delta;
        membrane.rotation.y -= 0.05 * delta;

        // Mitochondria tumbling
        biologyElements.current.mitochondria.forEach((mito, idx) => {
          mito.rotation.x += 0.2 * delta * (idx % 2 === 0 ? 1 : -1);
          mito.rotation.z += 0.1 * delta;
        });

      } else if (subjectId === "physics" && physicsElements.current) {
        const { planetGroup, moon, sun } = physicsElements.current;
        // Speed up Sun's inner corona
        sun.rotation.y += 0.3 * delta;

        // Standard gravity orbital speed
        planetGroup.rotation.y += 0.54 * delta; // Planet revolves around the star
        moon.rotation.y += 2.2 * delta; // Moon revolves around the planet

      } else if (subjectId === "computer_science" && csElements.current) {
        const { bits, cores } = csElements.current;
        // Float the CPU core
        cores[0].position.y = -0.3 + Math.sin(time * 0.002) * 0.06;

        // Float and rotate binary bits
        bits.forEach((bit, idx) => {
          bit.rotation.y += 0.6 * delta;
          bit.rotation.x += 0.3 * delta * (idx % 2 === 0 ? 1 : -1);
          bit.position.y += Math.sin(time * 0.0015 + idx) * 0.004;
        });
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // 9. Resize handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    // Use ResizeObserver for accurate sizing inside flex containers
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
      }
    };
  }, [subjectId]);

  // Handle focusing when active hotspot gets adjusted
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current || !activeHotspotId) return;

    // Define coordinate zooms target based on hotspot identifier
    let targetX = 0, targetY = 0, targetZ = 0;
    if (activeHotspotId === "nucleus" || activeHotspotId === "sun") {
      targetX = 0; targetY = 0; targetZ = 4.0;
    } else if (activeHotspotId === "mitochondria" || activeHotspotId === "planet") {
      targetX = 1.6; targetY = 0.6; targetZ = 4.5;
    } else if (activeHotspotId === "ribosome" || activeHotspotId === "gravity") {
      targetX = -1.2; targetY = -0.5; targetZ = 4.8;
    } else {
      targetX = 1.0; targetY = 1.0; targetZ = 4.5;
    }

    // Move camera to coordinates inside scene comfortably
    const cam = cameraRef.current;
    cam.position.set(targetX, targetY, targetZ);
    controlsRef.current.target.set(targetX * 0.2, targetY * 0.2, 0);
  }, [activeHotspotId]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-950/20 rounded-2xl overflow-hidden group">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-20 space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin"></div>
          <p className="font-display text-sm tracking-wide text-cyan-300">Initializing 3D Universe...</p>
        </div>
      )}

      {/* Touch instruction overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/25 flex items-center gap-2 pointer-events-none text-xs text-white/90 font-display shadow-md">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span>Drag to rotate, scroll to zoom</span>
      </div>

      {/* Model Canvas container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" id="canvas-container-box" />

      {/* Overlay hotspots indicator */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap gap-2 justify-center">
        {subjectId === "biology" && (
          <>
            <button
              onClick={() => onHotspotClick("nucleus")}
              className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                activeHotspotId === "nucleus"
                  ? "bg-purple-500/30 text-white border-purple-400 font-semibold scale-105 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                  : "bg-white/10 backdrop-blur-md text-purple-300 border-white/20 hover:bg-white/20 hover:border-white/30"
              }`}
            >
              🧬 Center Nucleus
            </button>
            <button
              onClick={() => onHotspotClick("mitochondria")}
              className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                activeHotspotId === "mitochondria"
                  ? "bg-emerald-500/30 text-white border-emerald-400 font-semibold scale-105 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : "bg-white/10 backdrop-blur-md text-emerald-300 border-white/20 hover:bg-white/20 hover:border-white/30"
              }`}
            >
              🔋 Mitochondria
            </button>
            <button
              onClick={() => onHotspotClick("ribosome")}
              className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                activeHotspotId === "ribosome"
                  ? "bg-orange-500/30 text-white border-orange-400 font-semibold scale-105 shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                  : "bg-white/10 backdrop-blur-md text-orange-300 border-white/20 hover:bg-white/20 hover:border-white/30"
              }`}
            >
              🏭 Ribosomes
            </button>
            <button
              onClick={() => onHotspotClick("membrane")}
              className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                activeHotspotId === "membrane"
                  ? "bg-cyan-500/30 text-white border-cyan-400 font-semibold scale-105 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                  : "bg-white/10 backdrop-blur-md text-cyan-300 border-white/20 hover:bg-white/20 hover:border-white/30"
              }`}
            >
              🛡️ Lipid Membrane
            </button>
          </>
        )}

        {subjectId === "physics" && (
          <>
            <button
              onClick={() => onHotspotClick("sun")}
              className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                activeHotspotId === "sun"
                  ? "bg-amber-500/30 text-white border-amber-400 font-semibold scale-105 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  : "bg-white/10 backdrop-blur-md text-amber-300 border-white/20 hover:bg-white/20 hover:border-white/30"
              }`}
            >
              ☀️ Massive Sun
            </button>
            <button
              onClick={() => onHotspotClick("planet")}
              className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                activeHotspotId === "planet"
                  ? "bg-blue-500/30 text-white border-blue-400 font-semibold scale-105 shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                  : "bg-white/10 backdrop-blur-md text-blue-300 border-white/20 hover:bg-white/20 hover:border-white/30"
              }`}
            >
              🪐 Planet & Moon
            </button>
            <button
              onClick={() => onHotspotClick("gravity")}
              className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                activeHotspotId === "gravity"
                  ? "bg-cyan-500/30 text-white border-cyan-400 font-semibold scale-105 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                  : "bg-white/10 backdrop-blur-md text-cyan-300 border-white/20 hover:bg-white/20 hover:border-white/30"
              }`}
            >
              🏹 Gravity Vectors
            </button>
          </>
        )}

        {subjectId === "computer_science" && (
          <>
            <button
              onClick={() => onHotspotClick("bit")}
              className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                activeHotspotId === "bit"
                  ? "bg-cyan-500/30 text-white border-cyan-400 font-semibold scale-105 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                  : "bg-white/10 backdrop-blur-md text-cyan-300 border-white/20 hover:bg-white/20 hover:border-white/30"
              }`}
            >
              💾 Toggle Bits
            </button>
            <button
              onClick={() => onHotspotClick("cpu")}
              className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                activeHotspotId === "cpu"
                  ? "bg-pink-500/30 text-white border-pink-400 font-semibold scale-105 shadow-[0_0_12px_rgba(236,72,153,0.4)]"
                  : "bg-white/10 backdrop-blur-md text-pink-300 border-white/20 hover:bg-white/20 hover:border-white/30"
              }`}
            >
              🧠 Central CPU
            </button>
            <button
              onClick={() => onHotspotClick("logic_gate")}
              className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                activeHotspotId === "logic_gate"
                  ? "bg-purple-500/30 text-white border-purple-400 font-semibold scale-105 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                  : "bg-white/10 backdrop-blur-md text-purple-300 border-white/20 hover:bg-white/20 hover:border-white/30"
              }`}
            >
              🔌 Logic Flow Gates
            </button>
          </>
        )}
      </div>
    </div>
  );
}
