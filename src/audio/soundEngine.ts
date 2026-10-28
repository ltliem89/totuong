import { AnimalId, BrushToolId } from "../data/statuesData";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicTimer: number | null = null;
  private noteStep: number = 0;
  private lastStrokeSoundTime: number = 0;
  private customAudioElement: HTMLAudioElement | null = null;
  private currentSpeechAudio: HTMLAudioElement | null = null;

  private ensureContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopMusic();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (this.currentSpeechAudio) {
        this.currentSpeechAudio.pause();
      }
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getMusicPlaying(): boolean {
    return this.isMusicPlaying;
  }

  // Play xylophone note when selecting a color (pentatonic scale)
  public playColorPick(index: number) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0, 2093.0, 2349.32];
    const freq = pentatonic[index % pentatonic.length];
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.01, now + 0.18);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.29);
  }

  // Play brush stroke sound while painting on the 3D statue
  public playBrushStroke(tool: BrushToolId) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const nowMs = performance.now();
    if (nowMs - this.lastStrokeSoundTime < 95) return;
    this.lastStrokeSoundTime = nowMs;

    const now = ctx.currentTime;

    if (tool === "star") {
      const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
      const f = freqs[Math.floor(Math.random() * freqs.length)];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 1.25, now + 0.14);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
      return;
    }

    if (tool === "eraser" || tool === "erase_part") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(310, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.095);
      return;
    }

    // Soft filtered noise / gentle tone for smooth, crayon, spray
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tool === "crayon" ? "triangle" : "sine";
    const baseFreq = tool === "spray" ? 680 + Math.random() * 220 : 380 + Math.random() * 160;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.15, now + 0.08);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  // Juicy pop when filling a body part or discovering a new part
  public playPartFillSound() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      const t = now + idx * 0.045;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  // Cute synthesized animal sounds
  public playAnimalSound(animalId: AnimalId) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (animalId === "duck") {
      // Two cheerful quacks
      [0, 0.22].forEach((offset) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(420, now + offset);
        osc.frequency.exponentialRampToValueAtTime(270, now + offset + 0.14);

        filter.type = "bandpass";
        filter.frequency.setValueAtTime(950, now + offset);
        filter.Q.setValueAtTime(3.5, now + offset);

        gain.gain.setValueAtTime(0.22, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.17);
      });
    } else if (animalId === "bear") {
      // Cute warm teddy hum
      [0, 0.25].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        const startF = i === 0 ? 190 : 230;
        osc.frequency.setValueAtTime(startF, now + offset);
        osc.frequency.exponentialRampToValueAtTime(startF * 0.85, now + offset + 0.2);
        gain.gain.setValueAtTime(0.24, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.23);
      });
    } else if (animalId === "rabbit") {
      // Bouncy boing-boing
      [0, 0.18].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now + offset);
        osc.frequency.exponentialRampToValueAtTime(760, now + offset + 0.14);
        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.17);
      });
    } else if (animalId === "cat") {
      // Sweet meow glide
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.14);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.36);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.39);
    } else if (animalId === "elephant") {
      // Cute baby elephant trumpet
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, now);

      osc.frequency.setValueAtTime(290, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.42);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    }
  }

  public playVictoryFanfare() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const melody = [
      { f: 523.25, t: 0, d: 0.15 },
      { f: 659.25, t: 0.15, d: 0.15 },
      { f: 783.99, t: 0.3, d: 0.15 },
      { f: 1046.5, t: 0.45, d: 0.45 },
      { f: 783.99, t: 0.9, d: 0.15 },
      { f: 1046.5, t: 1.08, d: 0.6 },
    ];
    melody.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(0.22, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    });
  }

  // Cheerful procedural nursery xylophone music loop
  public toggleMusic(): boolean {
    if (this.isMusicPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  public startMusic() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.isMusicPlaying = true;
    if (this.customAudioElement) {
      this.customAudioElement.loop = true;
      this.customAudioElement.volume = 0.35;
      this.customAudioElement.play().catch(() => {});
      return;
    }

    if (this.musicTimer) window.clearInterval(this.musicTimer);

    // Cheerful C-major pentatonic nursery rhyme pattern
    const pattern = [
      523.25, 659.25, 783.99, 659.25,
      880.0, 783.99, 659.25, 523.25,
      587.33, 659.25, 783.99, 880.0,
      1046.5, 783.99, 659.25, 523.25,
    ];
    const bassPattern = [
      261.63, 0, 392.0, 0,
      220.0, 0, 329.63, 0,
      293.66, 0, 392.0, 0,
      261.63, 0, 261.63, 0,
    ];

    this.musicTimer = window.setInterval(() => {
      if (!this.isMusicPlaying || this.isMuted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const idx = this.noteStep % pattern.length;
      const melFreq = pattern[idx];
      const bassFreq = bassPattern[idx];
      this.noteStep++;

      // Melody marimba
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(melFreq, now);
      gain.gain.setValueAtTime(0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.34);

      // Soft bass pluck
      if (bassFreq > 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = "triangle";
        bOsc.frequency.setValueAtTime(bassFreq, now);
        bGain.gain.setValueAtTime(0.04, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        bOsc.connect(bGain);
        bGain.connect(this.ctx.destination);
        bOsc.start(now);
        bOsc.stop(now + 0.42);
      }
    }, 360);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.customAudioElement) {
      this.customAudioElement.pause();
    }
  }

  public playCustomLyriaAudio(audioUrl: string) {
    this.stopMusic();
    if (this.customAudioElement) {
      this.customAudioElement.pause();
    }
    this.customAudioElement = new Audio(audioUrl);
    this.customAudioElement.loop = true;
    this.customAudioElement.volume = 0.45;
    this.isMusicPlaying = true;
    if (!this.isMuted) {
      this.customAudioElement.play().catch(() => {});
    }
  }

  // Instant Vietnamese + English pronunciation via Web Speech API
  public speakVi(textVi: string, textEn?: string) {
    if (this.isMuted) return;
    if (!("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterVi = new SpeechSynthesisUtterance(textVi);
      utterVi.lang = "vi-VN";
      utterVi.rate = 0.92;
      utterVi.pitch = 1.15;

      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find((v) => v.lang.toLowerCase().includes("vi"));
      if (viVoice) utterVi.voice = viVoice;

      if (textEn) {
        utterVi.onend = () => {
          if (this.isMuted) return;
          const utterEn = new SpeechSynthesisUtterance(textEn);
          utterEn.lang = "en-US";
          utterEn.rate = 0.88;
          utterEn.pitch = 1.1;
          window.speechSynthesis.speak(utterEn);
        };
      }

      window.speechSynthesis.speak(utterVi);
    } catch {
      // Ignore speech synthesis errors on restricted browsers
    }
  }

  // High-quality server TTS via gemini-3.8-flash-lite-tts with fallback to speakVi
  public async speakWithTeacherTTS(textVi: string) {
    if (this.isMuted) return;
    try {
      const response = await fetch("/api/tts/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textVi }),
      });
      const data = await response.json();
      if (data.ok && data.audioBase64) {
        if (this.currentSpeechAudio) {
          this.currentSpeechAudio.pause();
        }
        const audio = new Audio(`data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`);
        this.currentSpeechAudio = audio;
        await audio.play();
        return;
      }
    } catch {
      // Fallback to browser TTS
    }
    this.speakVi(textVi);
  }
}

export const soundEngine = new SoundEngine();
