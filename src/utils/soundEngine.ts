// Web Audio API Synthesizer Sound Engine for EduSphere AI
// Programmatic real-time sound effects that bypass audio file hosting dependencies

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check local storage setting for user audio preference
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("edusphere_audio_muted");
      this.isMuted = savedMute === "true";
    }
  }

  // Dual initialization to comply with browser user-interaction policies
  private init() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    // resume context if suspended (browser security policy)
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem("edusphere_audio_muted", String(this.isMuted));
    return this.isMuted;
  }

  public getMuteState(): boolean {
    return this.isMuted;
  }

  // 1. SUBTLE SCI-FI CLICK
  public playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // High-pitched sine transient
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // 2. ASCENDING SUCCESS CHIME
  public playSuccess() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 -> E5 -> G5 -> C6 arpeggio

    notes.forEach((freq, index) => {
      const noteTime = now + index * 0.08;
      
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteTime);
      
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.06, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);
      
      osc.start(noteTime);
      osc.stop(noteTime + 0.3);
    });
  }

  // 3. SUCCESS CELEBRATION CHORD CASCADE
  public playSuccessCelebration() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Multi-voice pentatonic chord configuration for ultimate success feel: C5, E5, G5, A5, C6, E6
    const frequencies = [523.25, 659.25, 783.99, 880.00, 1046.50, 1318.51];

    frequencies.forEach((freq, index) => {
      // Stagger slightly for a sweeping harp-like chord cascade
      const noteDelay = index * 0.05;
      const termTime = now + noteDelay;

      const osc = this.ctx!.createOscillator();
      const wave = this.ctx!.createGain();

      osc.connect(wave);
      wave.connect(this.ctx!.destination);

      // Warm triangle wave paired with crisp sine harmonics
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, termTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.005, termTime + 0.8);

      wave.gain.setValueAtTime(0.001, termTime);
      wave.gain.linearRampToValueAtTime(0.04, termTime + 0.08);
      wave.gain.exponentialRampToValueAtTime(0.001, termTime + 0.7);

      osc.start(termTime);
      osc.stop(termTime + 0.82);
    });
  }
}

export const soundEngine = new SoundEngine();
