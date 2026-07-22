// DEEP DIVE — Web Audio API 8-bit sound synthesizer.
// Every sound is synthesized in real time with OscillatorNode/GainNode — no
// external media assets. All nodes are tracked and disposed to avoid leaks.

type NoteName = "C4" | "E4" | "G4" | "C5" | "G4b" | "E5" | "G5";

const NOTE_FREQ: Record<NoteName, number> = {
  C4: 261.63,
  E4: 329.63,
  G4: 392.0,
  C5: 523.25,
  G4b: 392.0,
  E5: 659.25,
  G5: 783.99,
};

export class GameAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientTargetGain = 0.05;
  private feverNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private feverTimer: ReturnType<typeof setTimeout> | null = null;
  private feverTempoScale = 1;
  private disposed = false;

  private ensureContext(): AudioContext | null {
    if (this.disposed) return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.35;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /** Must be called from a user-gesture handler (button click/pointerdown) to satisfy autoplay policies. */
  unlock() {
    this.ensureContext();
    this.startAmbientDrone();
  }

  /** Continuous low sine-wave ambient drone that can be "ducked" to silence for cinematic beats. */
  private startAmbientDrone() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.ambientOsc) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 55;
    gain.gain.value = this.ambientTargetGain;
    osc.connect(gain).connect(this.masterGain);
    osc.start();
    this.ambientOsc = osc;
    this.ambientGain = gain;
  }

  /** [Stage 1: Total Eclipse] instantly silence the ambient drone. */
  duckAmbient() {
    if (!this.ctx || !this.ambientGain) return;
    this.ambientGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
  }

  /** Restore the ambient drone after the eclipse beat passes. */
  unduckAmbient() {
    if (!this.ctx || !this.ambientGain) return;
    this.ambientGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(this.ambientTargetGain, this.ctx.currentTime + 0.3);
  }

  /** [Item Pick Sound] 2-tone arpeggio pitch rise 400Hz -> 800Hz over 0.1s */
  playItemPickup() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  /** [Crash Sound] low-frequency decaying crunch 150Hz -> 40Hz on Game Over */
  playCrash() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.5);

    // Noise burst layered on top for a "crunch" texture
    const bufferSize = Math.floor(ctx.sampleRate * 0.3);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    noise.connect(noiseGain).connect(this.masterGain);
    noise.start(now);
  }

  /** [FEVER EXPIRATION TICK] triangle 1200Hz, 0.05s metallic pulse */
  playTick() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  /** [NEW RECORD FANFARE] ascending perfect-interval chords with vibrato, ~1.5s, fires once */
  playNewRecordFanfare() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const sequence: NoteName[] = ["G4", "C5", "E5", "G5"];
    const noteDuration = 0.28;

    sequence.forEach((note, i) => {
      const startTime = now + i * noteDuration;
      const freq = NOTE_FREQ[note];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, startTime);

      // Vibrato via a fast LFO modulating detune
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 6;
      lfoGain.gain.value = 8;
      lfo.connect(lfoGain).connect(osc.detune);
      lfo.start(startTime);
      lfo.stop(startTime + noteDuration + 0.6);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.28, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + (i === sequence.length - 1 ? 0.9 : noteDuration));

      osc.connect(gain).connect(this.masterGain!);
      osc.start(startTime);
      osc.stop(startTime + (i === sequence.length - 1 ? 1.0 : noteDuration + 0.02));
    });
  }

  /** [RAINBOW FEVER LOOP] 140 BPM major arpeggio square-wave loop, tempo can be scaled down near expiry */
  startFeverLoop() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.stopFeverLoop();
    this.feverTempoScale = 1;

    const pattern: NoteName[] = ["C4", "E4", "G4", "C5"];
    let step = 0;

    const scheduleNext = () => {
      if (this.disposed || !this.ctx || !this.masterGain) return;
      const beatDuration = (60 / 140) * this.feverTempoScale;
      const note = pattern[step % pattern.length];
      const freq = NOTE_FREQ[note];
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + beatDuration * 0.9);
      osc.connect(gain).connect(this.masterGain);
      osc.start(now);
      osc.stop(now + beatDuration);

      this.feverNodes.push({ osc, gain });
      // Trim old finished nodes occasionally
      if (this.feverNodes.length > 16) this.feverNodes.splice(0, 8);

      step++;
      this.feverTimer = setTimeout(scheduleNext, beatDuration * 1000);
    };

    scheduleNext();
  }

  /** Slows the fever loop tempo as expiry approaches (factor > 1 = slower). */
  setFeverTempoScale(factor: number) {
    this.feverTempoScale = factor;
  }

  stopFeverLoop() {
    if (this.feverTimer) {
      clearTimeout(this.feverTimer);
      this.feverTimer = null;
    }
    this.feverNodes.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(this.ctx?.currentTime ?? 0);
        osc.stop();
      } catch {
        // already stopped
      }
    });
    this.feverNodes = [];
  }

  dispose() {
    this.disposed = true;
    this.stopFeverLoop();
    if (this.ambientOsc) {
      try {
        this.ambientOsc.stop();
      } catch {
        // already stopped
      }
      this.ambientOsc = null;
      this.ambientGain = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.masterGain = null;
    }
  }
}
