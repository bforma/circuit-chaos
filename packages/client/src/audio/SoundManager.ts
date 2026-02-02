/**
 * Sound Manager for Circuit Chaos
 *
 * Uses Web Audio API to synthesize high-quality game sounds.
 * Techniques used: layered oscillators, FM synthesis, filters, ADSR envelopes
 */

type SoundName =
  | 'robotMove'
  | 'robotRotate'
  | 'robotPushed'
  | 'robotDestroyed'
  | 'conveyor'
  | 'gear'
  | 'laserFire'
  | 'laserHit'
  | 'checkpoint'
  | 'energy'
  | 'cardPlace'
  | 'cardRemove'
  | 'submit'
  | 'gameStart'
  | 'gameWin'
  | 'registerStart'
  | 'click'
  | 'error';

interface SoundConfig {
  volume: number;
  enabled: boolean;
}

class SoundManagerClass {
  private audioContext: AudioContext | null = null;
  private config: SoundConfig = {
    volume: 0.7,
    enabled: true,
  };

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  setVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getVolume(): number {
    return this.config.volume;
  }

  async resume() {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  play(name: SoundName) {
    if (!this.config.enabled) return;
    this.resume();

    switch (name) {
      case 'robotMove':
        this.playRobotMove();
        break;
      case 'robotRotate':
        this.playRobotRotate();
        break;
      case 'robotPushed':
        this.playRobotPushed();
        break;
      case 'robotDestroyed':
        this.playRobotDestroyed();
        break;
      case 'conveyor':
        this.playConveyor();
        break;
      case 'gear':
        this.playGear();
        break;
      case 'laserFire':
        this.playLaserFire();
        break;
      case 'laserHit':
        this.playLaserHit();
        break;
      case 'checkpoint':
        this.playCheckpoint();
        break;
      case 'energy':
        this.playEnergy();
        break;
      case 'cardPlace':
        this.playCardPlace();
        break;
      case 'cardRemove':
        this.playCardRemove();
        break;
      case 'submit':
        this.playSubmit();
        break;
      case 'gameStart':
        this.playGameStart();
        break;
      case 'gameWin':
        this.playGameWin();
        break;
      case 'registerStart':
        this.playRegisterStart();
        break;
      case 'click':
        this.playClick();
        break;
      case 'error':
        this.playError();
        break;
    }
  }

  // === Helper Methods ===

  private vol(v: number): number {
    return v * this.config.volume;
  }

  private createNoise(duration: number): AudioBufferSourceNode {
    const ctx = this.getContext();
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    return noise;
  }

  private createPinkNoise(duration: number): AudioBufferSourceNode {
    const ctx = this.getContext();
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    return noise;
  }

  // === Robot Sounds ===

  private playRobotMove() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Rapid stepper clicks
    for (let i = 0; i < 6; i++) {
      const clickTime = now + i * 0.025;
      const step = ctx.createOscillator();
      step.type = 'square';
      step.frequency.value = 1200 + (i % 2) * 200;

      const stepGain = ctx.createGain();
      stepGain.gain.setValueAtTime(this.vol(0.12), clickTime);
      stepGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.015);

      const stepFilter = ctx.createBiquadFilter();
      stepFilter.type = 'bandpass';
      stepFilter.frequency.value = 2000;
      stepFilter.Q.value = 3;

      step.connect(stepFilter);
      stepFilter.connect(stepGain);
      stepGain.connect(ctx.destination);

      step.start(clickTime);
      step.stop(clickTime + 0.02);
    }

    // Motor hum undertone
    const hum = ctx.createOscillator();
    hum.type = 'sawtooth';
    hum.frequency.value = 100;

    const humGain = ctx.createGain();
    humGain.gain.setValueAtTime(this.vol(0.06), now);
    humGain.gain.linearRampToValueAtTime(this.vol(0.04), now + 0.12);
    humGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    const humFilter = ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.value = 200;

    hum.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(ctx.destination);

    hum.start(now);
    hum.stop(now + 0.2);
  }

  private playRobotRotate() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Servo motor with pitch wobble
    const servo = ctx.createOscillator();
    servo.type = 'sawtooth';
    servo.frequency.setValueAtTime(250, now);
    servo.frequency.linearRampToValueAtTime(200, now + 0.05);
    servo.frequency.linearRampToValueAtTime(180, now + 0.12);

    // LFO for mechanical wobble
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 30;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 15;
    lfo.connect(lfoGain);
    lfoGain.connect(servo.frequency);

    const servoGain = ctx.createGain();
    servoGain.gain.setValueAtTime(0, now);
    servoGain.gain.linearRampToValueAtTime(this.vol(0.1), now + 0.015);
    servoGain.gain.linearRampToValueAtTime(this.vol(0.08), now + 0.1);
    servoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 2;

    servo.connect(filter);
    filter.connect(servoGain);
    servoGain.connect(ctx.destination);

    // Mechanical click at end
    const click = ctx.createOscillator();
    click.type = 'triangle';
    click.frequency.value = 800;

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0, now);
    clickGain.gain.setValueAtTime(this.vol(0.15), now + 0.11);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    click.connect(clickGain);
    clickGain.connect(ctx.destination);

    lfo.start(now);
    lfo.stop(now + 0.15);
    servo.start(now);
    servo.stop(now + 0.15);
    click.start(now);
    click.stop(now + 0.15);
  }

  private playRobotPushed() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Heavy metallic impact
    const impact = ctx.createOscillator();
    impact.type = 'sine';
    impact.frequency.setValueAtTime(200, now);
    impact.frequency.exponentialRampToValueAtTime(50, now + 0.08);

    const impactGain = ctx.createGain();
    impactGain.gain.setValueAtTime(this.vol(0.4), now);
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    impact.connect(impactGain);
    impactGain.connect(ctx.destination);

    // Metallic resonance (FM synthesis)
    const carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = 180;

    const modulator = ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.value = 280;

    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(150, now);
    modGain.gain.exponentialRampToValueAtTime(10, now + 0.2);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    const carrierGain = ctx.createGain();
    carrierGain.gain.setValueAtTime(this.vol(0.15), now);
    carrierGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.2);

    carrier.connect(filter);
    filter.connect(carrierGain);
    carrierGain.connect(ctx.destination);

    // Noise burst for texture
    const noise = this.createNoise(0.1);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.vol(0.15), now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 800;
    noiseFilter.Q.value = 1;

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    impact.start(now);
    impact.stop(now + 0.2);
    modulator.start(now);
    modulator.stop(now + 0.3);
    carrier.start(now);
    carrier.stop(now + 0.3);
    noise.start(now);
  }

  private playRobotDestroyed() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Explosion bass
    const bass = ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(100, now);
    bass.frequency.exponentialRampToValueAtTime(25, now + 0.4);

    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(this.vol(0.5), now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    bass.connect(bassGain);
    bassGain.connect(ctx.destination);

    // Explosion crunch (distorted)
    const crunch = ctx.createOscillator();
    crunch.type = 'sawtooth';
    crunch.frequency.setValueAtTime(80, now);
    crunch.frequency.exponentialRampToValueAtTime(30, now + 0.3);

    const distortion = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * 3);
    }
    distortion.curve = curve;

    const crunchGain = ctx.createGain();
    crunchGain.gain.setValueAtTime(this.vol(0.3), now);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    const crunchFilter = ctx.createBiquadFilter();
    crunchFilter.type = 'lowpass';
    crunchFilter.frequency.value = 600;

    crunch.connect(distortion);
    distortion.connect(crunchFilter);
    crunchFilter.connect(crunchGain);
    crunchGain.connect(ctx.destination);

    // Debris/shrapnel (filtered noise)
    const debris = this.createPinkNoise(0.6);
    const debrisGain = ctx.createGain();
    debrisGain.gain.setValueAtTime(this.vol(0.25), now + 0.02);
    debrisGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    const debrisFilter = ctx.createBiquadFilter();
    debrisFilter.type = 'bandpass';
    debrisFilter.frequency.setValueAtTime(2000, now);
    debrisFilter.frequency.exponentialRampToValueAtTime(400, now + 0.4);
    debrisFilter.Q.value = 0.7;

    debris.connect(debrisFilter);
    debrisFilter.connect(debrisGain);
    debrisGain.connect(ctx.destination);

    // High metallic ping (robot parts flying)
    [0.05, 0.12, 0.2].forEach((delay, i) => {
      const ping = ctx.createOscillator();
      ping.type = 'sine';
      ping.frequency.value = 1200 + i * 400;

      const pingGain = ctx.createGain();
      pingGain.gain.setValueAtTime(this.vol(0.08), now + delay);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);

      ping.connect(pingGain);
      pingGain.connect(ctx.destination);

      ping.start(now + delay);
      ping.stop(now + delay + 0.2);
    });

    bass.start(now);
    bass.stop(now + 0.6);
    crunch.start(now);
    crunch.stop(now + 0.5);
    debris.start(now);
  }

  // === Board Element Sounds ===

  private playConveyor() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Low rumble
    const rumble = ctx.createOscillator();
    rumble.type = 'sawtooth';
    rumble.frequency.value = 55;

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0, now);
    rumbleGain.gain.linearRampToValueAtTime(this.vol(0.1), now + 0.05);
    rumbleGain.gain.linearRampToValueAtTime(this.vol(0.08), now + 0.2);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 150;

    rumble.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);

    // Mechanical rhythm
    for (let i = 0; i < 4; i++) {
      const clickTime = now + i * 0.07;
      const tick = ctx.createOscillator();
      tick.type = 'square';
      tick.frequency.value = 400 + (i % 2) * 100;

      const tickGain = ctx.createGain();
      tickGain.gain.setValueAtTime(this.vol(0.06), clickTime);
      tickGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.02);

      const tickFilter = ctx.createBiquadFilter();
      tickFilter.type = 'bandpass';
      tickFilter.frequency.value = 1000;
      tickFilter.Q.value = 5;

      tick.connect(tickFilter);
      tickFilter.connect(tickGain);
      tickGain.connect(ctx.destination);

      tick.start(clickTime);
      tick.stop(clickTime + 0.03);
    }

    rumble.start(now);
    rumble.stop(now + 0.4);
  }

  private playGear() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Gear clicking sequence
    const clickTimes = [0, 0.04, 0.09, 0.15];

    clickTimes.forEach((delay, i) => {
      const clickTime = now + delay;

      // Primary click
      const click = ctx.createOscillator();
      click.type = 'triangle';
      click.frequency.value = 600 + (i % 2) * 200;

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(this.vol(0.2), clickTime);
      clickGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.03);

      click.connect(clickGain);
      clickGain.connect(ctx.destination);

      click.start(clickTime);
      click.stop(clickTime + 0.04);

      // Resonant body
      const body = ctx.createOscillator();
      body.type = 'sine';
      body.frequency.value = 150;

      const bodyGain = ctx.createGain();
      bodyGain.gain.setValueAtTime(this.vol(0.08), clickTime);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.06);

      body.connect(bodyGain);
      bodyGain.connect(ctx.destination);

      body.start(clickTime);
      body.stop(clickTime + 0.08);
    });

    // Mechanical whir undertone
    const whir = ctx.createOscillator();
    whir.type = 'sawtooth';
    whir.frequency.value = 120;

    const whirGain = ctx.createGain();
    whirGain.gain.setValueAtTime(0, now);
    whirGain.gain.linearRampToValueAtTime(this.vol(0.04), now + 0.02);
    whirGain.gain.linearRampToValueAtTime(this.vol(0.03), now + 0.15);
    whirGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    const whirFilter = ctx.createBiquadFilter();
    whirFilter.type = 'bandpass';
    whirFilter.frequency.value = 300;
    whirFilter.Q.value = 2;

    whir.connect(whirFilter);
    whirFilter.connect(whirGain);
    whirGain.connect(ctx.destination);

    whir.start(now);
    whir.stop(now + 0.22);
  }

  private playLaserFire() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Main beam - sweeping sine
    const beam = ctx.createOscillator();
    beam.type = 'sine';
    beam.frequency.setValueAtTime(1800, now);
    beam.frequency.exponentialRampToValueAtTime(400, now + 0.25);

    const beamGain = ctx.createGain();
    beamGain.gain.setValueAtTime(this.vol(0.25), now);
    beamGain.gain.setValueAtTime(this.vol(0.2), now + 0.15);
    beamGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    beam.connect(beamGain);
    beamGain.connect(ctx.destination);

    // Harmonic overtone
    const overtone = ctx.createOscillator();
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(2700, now);
    overtone.frequency.exponentialRampToValueAtTime(600, now + 0.25);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(this.vol(0.1), now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    overtone.connect(overtoneGain);
    overtoneGain.connect(ctx.destination);

    // Energy crackle (modulated noise)
    const crackle = this.createNoise(0.3);
    const crackleGain = ctx.createGain();
    crackleGain.gain.setValueAtTime(this.vol(0.08), now);
    crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    const crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.value = 3000;

    crackle.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(ctx.destination);

    // Initial pulse
    const pulse = ctx.createOscillator();
    pulse.type = 'square';
    pulse.frequency.value = 800;

    const pulseGain = ctx.createGain();
    pulseGain.gain.setValueAtTime(this.vol(0.15), now);
    pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    pulse.connect(pulseGain);
    pulseGain.connect(ctx.destination);

    beam.start(now);
    beam.stop(now + 0.35);
    overtone.start(now);
    overtone.stop(now + 0.3);
    crackle.start(now);
    pulse.start(now);
    pulse.stop(now + 0.04);
  }

  private playLaserHit() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Electric zap
    const zap = ctx.createOscillator();
    zap.type = 'sawtooth';
    zap.frequency.setValueAtTime(600, now);
    zap.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    const zapGain = ctx.createGain();
    zapGain.gain.setValueAtTime(this.vol(0.3), now);
    zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    const zapFilter = ctx.createBiquadFilter();
    zapFilter.type = 'lowpass';
    zapFilter.frequency.setValueAtTime(4000, now);
    zapFilter.frequency.exponentialRampToValueAtTime(500, now + 0.1);

    zap.connect(zapFilter);
    zapFilter.connect(zapGain);
    zapGain.connect(ctx.destination);

    // Spark crackle
    const spark = this.createNoise(0.15);
    const sparkGain = ctx.createGain();
    sparkGain.gain.setValueAtTime(this.vol(0.2), now);
    sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    const sparkFilter = ctx.createBiquadFilter();
    sparkFilter.type = 'bandpass';
    sparkFilter.frequency.value = 2500;
    sparkFilter.Q.value = 1;

    spark.connect(sparkFilter);
    sparkFilter.connect(sparkGain);
    sparkGain.connect(ctx.destination);

    // Impact thud
    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(150, now);
    thud.frequency.exponentialRampToValueAtTime(60, now + 0.08);

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(this.vol(0.2), now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    thud.connect(thudGain);
    thudGain.connect(ctx.destination);

    zap.start(now);
    zap.stop(now + 0.2);
    spark.start(now);
    thud.start(now);
    thud.stop(now + 0.12);
  }

  // === Achievement Sounds ===

  private playCheckpoint() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Bright ascending arpeggio with harmonics
    const notes = [
      { freq: 523.25, time: 0 },      // C5
      { freq: 659.25, time: 0.08 },   // E5
      { freq: 783.99, time: 0.16 },   // G5
      { freq: 1046.50, time: 0.24 },  // C6
    ];

    notes.forEach(({ freq, time }) => {
      const noteTime = now + time;

      // Main tone
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      // Subtle shimmer (slightly detuned)
      const shimmer = ctx.createOscillator();
      shimmer.type = 'sine';
      shimmer.frequency.value = freq * 1.003;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(this.vol(0.25), noteTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

      const shimmerGain = ctx.createGain();
      shimmerGain.gain.setValueAtTime(0, noteTime);
      shimmerGain.gain.linearRampToValueAtTime(this.vol(0.08), noteTime + 0.01);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.45);
      shimmer.start(noteTime);
      shimmer.stop(noteTime + 0.4);
    });

    // Sparkle effect
    for (let i = 0; i < 5; i++) {
      const sparkTime = now + 0.1 + i * 0.06;
      const sparkle = ctx.createOscillator();
      sparkle.type = 'sine';
      sparkle.frequency.value = 2000 + Math.random() * 2000;

      const sparkGain = ctx.createGain();
      sparkGain.gain.setValueAtTime(this.vol(0.04), sparkTime);
      sparkGain.gain.exponentialRampToValueAtTime(0.001, sparkTime + 0.08);

      sparkle.connect(sparkGain);
      sparkGain.connect(ctx.destination);

      sparkle.start(sparkTime);
      sparkle.stop(sparkTime + 0.1);
    }
  }

  private playEnergy() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Rising power tone
    const power = ctx.createOscillator();
    power.type = 'sine';
    power.frequency.setValueAtTime(300, now);
    power.frequency.exponentialRampToValueAtTime(800, now + 0.2);
    power.frequency.setValueAtTime(800, now + 0.25);

    const powerGain = ctx.createGain();
    powerGain.gain.setValueAtTime(0, now);
    powerGain.gain.linearRampToValueAtTime(this.vol(0.2), now + 0.05);
    powerGain.gain.setValueAtTime(this.vol(0.2), now + 0.2);
    powerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    power.connect(powerGain);
    powerGain.connect(ctx.destination);

    // Harmonic shimmer
    const shimmer = ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(600, now);
    shimmer.frequency.exponentialRampToValueAtTime(1600, now + 0.2);

    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(0, now);
    shimmerGain.gain.linearRampToValueAtTime(this.vol(0.1), now + 0.05);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);

    // Electric crackle
    const crackle = this.createNoise(0.25);
    const crackleGain = ctx.createGain();
    crackleGain.gain.setValueAtTime(0, now);
    crackleGain.gain.linearRampToValueAtTime(this.vol(0.06), now + 0.05);
    crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    const crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.value = 4000;

    crackle.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(ctx.destination);

    power.start(now);
    power.stop(now + 0.4);
    shimmer.start(now);
    shimmer.stop(now + 0.35);
    crackle.start(now);
  }

  private playGameWin() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Victory fanfare melody
    const melody = [
      { freq: 523.25, time: 0, dur: 0.12 },      // C5
      { freq: 659.25, time: 0.12, dur: 0.12 },   // E5
      { freq: 783.99, time: 0.24, dur: 0.12 },   // G5
      { freq: 1046.50, time: 0.36, dur: 0.35 },  // C6 (hold)
      { freq: 783.99, time: 0.8, dur: 0.12 },    // G5
      { freq: 1046.50, time: 0.92, dur: 0.5 },   // C6 (final hold)
    ];

    melody.forEach(({ freq, time, dur }) => {
      const noteTime = now + time;

      // Main tone (triangle for warmth)
      const main = ctx.createOscillator();
      main.type = 'triangle';
      main.frequency.value = freq;

      // Octave doubling for richness
      const octave = ctx.createOscillator();
      octave.type = 'sine';
      octave.frequency.value = freq * 2;

      // Fifth harmony
      const fifth = ctx.createOscillator();
      fifth.type = 'sine';
      fifth.frequency.value = freq * 1.5;

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0, noteTime);
      mainGain.gain.linearRampToValueAtTime(this.vol(0.25), noteTime + 0.02);
      mainGain.gain.setValueAtTime(this.vol(0.25), noteTime + dur - 0.05);
      mainGain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur + 0.1);

      const octaveGain = ctx.createGain();
      octaveGain.gain.setValueAtTime(0, noteTime);
      octaveGain.gain.linearRampToValueAtTime(this.vol(0.08), noteTime + 0.02);
      octaveGain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

      const fifthGain = ctx.createGain();
      fifthGain.gain.setValueAtTime(0, noteTime);
      fifthGain.gain.linearRampToValueAtTime(this.vol(0.05), noteTime + 0.02);
      fifthGain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

      main.connect(mainGain);
      mainGain.connect(ctx.destination);
      octave.connect(octaveGain);
      octaveGain.connect(ctx.destination);
      fifth.connect(fifthGain);
      fifthGain.connect(ctx.destination);

      main.start(noteTime);
      main.stop(noteTime + dur + 0.15);
      octave.start(noteTime);
      octave.stop(noteTime + dur + 0.05);
      fifth.start(noteTime);
      fifth.stop(noteTime + dur + 0.05);
    });

    // Triumphant cymbal swell
    const cymbal = this.createPinkNoise(1.5);
    const cymbalGain = ctx.createGain();
    cymbalGain.gain.setValueAtTime(0, now);
    cymbalGain.gain.linearRampToValueAtTime(this.vol(0.08), now + 0.3);
    cymbalGain.gain.setValueAtTime(this.vol(0.08), now + 0.8);
    cymbalGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    const cymbalFilter = ctx.createBiquadFilter();
    cymbalFilter.type = 'highpass';
    cymbalFilter.frequency.value = 3000;

    cymbal.connect(cymbalFilter);
    cymbalFilter.connect(cymbalGain);
    cymbalGain.connect(ctx.destination);

    cymbal.start(now);
  }

  // === UI Sounds ===

  private playCardPlace() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Satisfying click/snap
    const click = ctx.createOscillator();
    click.type = 'triangle';
    click.frequency.setValueAtTime(2000, now);
    click.frequency.exponentialRampToValueAtTime(800, now + 0.03);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(this.vol(0.2), now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    click.connect(clickGain);
    clickGain.connect(ctx.destination);

    // Subtle thud for weight
    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.value = 150;

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(this.vol(0.1), now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    thud.connect(thudGain);
    thudGain.connect(ctx.destination);

    // Noise for paper texture
    const noise = this.createNoise(0.04);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.vol(0.08), now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 2000;

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    click.start(now);
    click.stop(now + 0.08);
    thud.start(now);
    thud.stop(now + 0.06);
    noise.start(now);
  }

  private playCardRemove() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Soft lift/slide
    const slide = ctx.createOscillator();
    slide.type = 'sine';
    slide.frequency.setValueAtTime(600, now);
    slide.frequency.exponentialRampToValueAtTime(1200, now + 0.04);

    const slideGain = ctx.createGain();
    slideGain.gain.setValueAtTime(this.vol(0.1), now);
    slideGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    slide.connect(slideGain);
    slideGain.connect(ctx.destination);

    // Light noise
    const noise = this.createNoise(0.03);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.vol(0.05), now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 3000;

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    slide.start(now);
    slide.stop(now + 0.06);
    noise.start(now);
  }

  private playSubmit() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Positive confirmation - two-tone chime
    const notes = [
      { freq: 880, time: 0 },    // A5
      { freq: 1174.66, time: 0.08 }, // D6
    ];

    notes.forEach(({ freq, time }) => {
      const noteTime = now + time;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.vol(0.25), noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.18);
    });

    // Subtle confirmation click
    const click = ctx.createOscillator();
    click.type = 'square';
    click.frequency.value = 4000;

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(this.vol(0.05), now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'highpass';
    clickFilter.frequency.value = 3000;

    click.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(ctx.destination);

    click.start(now);
    click.stop(now + 0.02);
  }

  private playGameStart() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Epic startup fanfare
    const notes = [
      { freq: 261.63, time: 0, dur: 0.15 },      // C4
      { freq: 329.63, time: 0.1, dur: 0.15 },    // E4
      { freq: 392.00, time: 0.2, dur: 0.15 },    // G4
      { freq: 523.25, time: 0.3, dur: 0.4 },     // C5 (hold)
    ];

    notes.forEach(({ freq, time, dur }) => {
      const noteTime = now + time;

      // Rich sawtooth tone
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, noteTime);
      filter.frequency.exponentialRampToValueAtTime(800, noteTime + dur);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(this.vol(0.18), noteTime + 0.02);
      gain.gain.setValueAtTime(this.vol(0.18), noteTime + dur - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur + 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + dur + 0.15);
    });

    // Engine rev effect
    const rev = ctx.createOscillator();
    rev.type = 'sawtooth';
    rev.frequency.setValueAtTime(50, now);
    rev.frequency.exponentialRampToValueAtTime(150, now + 0.4);
    rev.frequency.exponentialRampToValueAtTime(80, now + 0.6);

    const revGain = ctx.createGain();
    revGain.gain.setValueAtTime(0, now);
    revGain.gain.linearRampToValueAtTime(this.vol(0.1), now + 0.1);
    revGain.gain.linearRampToValueAtTime(this.vol(0.12), now + 0.35);
    revGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    const revFilter = ctx.createBiquadFilter();
    revFilter.type = 'lowpass';
    revFilter.frequency.value = 300;

    rev.connect(revFilter);
    revFilter.connect(revGain);
    revGain.connect(ctx.destination);

    rev.start(now);
    rev.stop(now + 0.65);
  }

  private playRegisterStart() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Clean notification ping
    const ping = ctx.createOscillator();
    ping.type = 'sine';
    ping.frequency.value = 880;

    const pingGain = ctx.createGain();
    pingGain.gain.setValueAtTime(this.vol(0.18), now);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    ping.connect(pingGain);
    pingGain.connect(ctx.destination);

    // Subtle harmonic
    const harmonic = ctx.createOscillator();
    harmonic.type = 'sine';
    harmonic.frequency.value = 1320; // Fifth

    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(this.vol(0.06), now);
    harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    harmonic.connect(harmonicGain);
    harmonicGain.connect(ctx.destination);

    ping.start(now);
    ping.stop(now + 0.15);
    harmonic.start(now);
    harmonic.stop(now + 0.1);
  }

  private playClick() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Soft, satisfying UI click
    const click = ctx.createOscillator();
    click.type = 'sine';
    click.frequency.setValueAtTime(1800, now);
    click.frequency.exponentialRampToValueAtTime(1200, now + 0.02);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(this.vol(0.12), now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    click.connect(clickGain);
    clickGain.connect(ctx.destination);

    // Tiny noise for texture
    const noise = this.createNoise(0.015);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.vol(0.03), now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 5000;

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    click.start(now);
    click.stop(now + 0.05);
    noise.start(now);
  }

  private playError() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Negative buzz/warning
    const buzz = ctx.createOscillator();
    buzz.type = 'sawtooth';
    buzz.frequency.value = 130;

    const buzzGain = ctx.createGain();
    buzzGain.gain.setValueAtTime(0, now);
    buzzGain.gain.linearRampToValueAtTime(this.vol(0.2), now + 0.01);
    buzzGain.gain.setValueAtTime(this.vol(0.2), now + 0.12);
    buzzGain.gain.linearRampToValueAtTime(0, now + 0.15);
    buzzGain.gain.linearRampToValueAtTime(this.vol(0.2), now + 0.18);
    buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    const buzzFilter = ctx.createBiquadFilter();
    buzzFilter.type = 'lowpass';
    buzzFilter.frequency.value = 400;

    buzz.connect(buzzFilter);
    buzzFilter.connect(buzzGain);
    buzzGain.connect(ctx.destination);

    // Dissonant overtone
    const discord = ctx.createOscillator();
    discord.type = 'square';
    discord.frequency.value = 185; // Tritone-ish

    const discordGain = ctx.createGain();
    discordGain.gain.setValueAtTime(0, now);
    discordGain.gain.linearRampToValueAtTime(this.vol(0.06), now + 0.01);
    discordGain.gain.setValueAtTime(this.vol(0.06), now + 0.12);
    discordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    const discordFilter = ctx.createBiquadFilter();
    discordFilter.type = 'lowpass';
    discordFilter.frequency.value = 600;

    discord.connect(discordFilter);
    discordFilter.connect(discordGain);
    discordGain.connect(ctx.destination);

    buzz.start(now);
    buzz.stop(now + 0.28);
    discord.start(now);
    discord.stop(now + 0.22);
  }
}

// Singleton instance
export const SoundManager = new SoundManagerClass();
