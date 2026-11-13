/**
 * Motor de Audio Sintético Realista para Vehículo Solar (100% Offline)
 * Utiliza la Web Audio API nativa para generar sonido procedimental en tiempo real:
 * - Inversor trifásico y motor BLDC (armónicos de alta frecuencia y tono fundamental)
 * - Viento aerodinámico y flujo turbulento según velocidad
 * - Fricción de rodadura y chirrido de neumáticos en curvas
 * - Silbido de freno regenerativo
 * - Clics metálicos de ensamble mecánico
 */

export class SolarVehicleAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Nodos de Motor / Inversor
    this.motorOsc = null;
    this.motorInverterOsc = null;
    this.motorGain = null;
    this.motorFilter = null;

    // Nodos de Viento Aerodinámico
    this.windNode = null;
    this.windGain = null;
    this.windFilter = null;

    // Nodos de Rodadura / Neumáticos
    this.tireNode = null;
    this.tireGain = null;
    this.tireScreechGain = null;
    this.tireScreechOsc = null;

    // Nodo de Regeneración
    this.regenOsc = null;
    this.regenGain = null;

    this.masterGain = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);

      this.setupMotorSynth();
      this.setupWindSynth();
      this.setupTireSynth();
      this.setupRegenSynth();

      this.isInitialized = true;
    } catch (e) {
      console.warn("[Audio] Web Audio API no disponible o bloqueada:", e);
    }
  }

  setupMotorSynth() {
    // 1. Tono fundamental del rotor BLDC
    this.motorOsc = this.ctx.createOscillator();
    this.motorOsc.type = "sawtooth";
    this.motorOsc.frequency.value = 40;

    // 2. Silbido de conmutación PWM del inversor trifásico (~12 kHz modificado)
    this.motorInverterOsc = this.ctx.createOscillator();
    this.motorInverterOsc.type = "sine";
    this.motorInverterOsc.frequency.value = 600;

    this.motorFilter = this.ctx.createBiquadFilter();
    this.motorFilter.type = "lowpass";
    this.motorFilter.frequency.value = 400;
    this.motorFilter.Q.value = 3.0;

    this.motorGain = this.ctx.createGain();
    this.motorGain.gain.value = 0.0;

    this.motorOsc.connect(this.motorFilter);
    this.motorInverterOsc.connect(this.motorFilter);
    this.motorFilter.connect(this.motorGain);
    this.motorGain.connect(this.masterGain);

    this.motorOsc.start();
    this.motorInverterOsc.start();
  }

  setupWindSynth() {
    // Ruido blanco procedural para viento
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.windNode = this.ctx.createBufferSource();
    this.windNode.buffer = noiseBuffer;
    this.windNode.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = "bandpass";
    this.windFilter.frequency.value = 300;
    this.windFilter.Q.value = 1.2;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.0;

    this.windNode.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    this.windNode.start();
  }

  setupTireSynth() {
    // Ruido rosa de rodadura
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.4;
    }

    this.tireNode = this.ctx.createBufferSource();
    this.tireNode.buffer = buffer;
    this.tireNode.loop = true;

    const tireFilter = this.ctx.createBiquadFilter();
    tireFilter.type = "lowpass";
    tireFilter.frequency.value = 350;

    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.value = 0.0;

    this.tireNode.connect(tireFilter);
    tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.masterGain);
    this.tireNode.start();

    // Chirrido de neumático al derrapar
    this.tireScreechOsc = this.ctx.createOscillator();
    this.tireScreechOsc.type = "triangle";
    this.tireScreechOsc.frequency.value = 950;

    this.tireScreechGain = this.ctx.createGain();
    this.tireScreechGain.gain.value = 0.0;

    this.tireScreechOsc.connect(this.tireScreechGain);
    this.tireScreechGain.connect(this.masterGain);
    this.tireScreechOsc.start();
  }

  setupRegenSynth() {
    this.regenOsc = this.ctx.createOscillator();
    this.regenOsc.type = "sine";
    this.regenOsc.frequency.value = 1800;

    this.regenGain = this.ctx.createGain();
    this.regenGain.gain.value = 0.0;

    this.regenOsc.connect(this.regenGain);
    this.regenGain.connect(this.masterGain);
    this.regenOsc.start();
  }

  update(telemetry, lateralSlip = 0) {
    if (!this.isInitialized || this.isMuted) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const speed = telemetry.speedKmh || 0;
    const rpm = telemetry.motorRpm || 0;
    const power = telemetry.motorPowerW || 0;
    const isRegen = telemetry.regenActive;

    const now = this.ctx.currentTime;

    // 1. Modulación del motor eléctrico
    const targetFreq = 45 + (rpm * 0.32);
    this.motorOsc.frequency.setTargetAtTime(Math.min(targetFreq, 1400), now, 0.05);

    // Inversor
    const invFreq = 500 + (rpm * 0.45);
    this.motorInverterOsc.frequency.setTargetAtTime(invFreq, now, 0.05);
    this.motorFilter.frequency.setTargetAtTime(300 + (rpm * 0.6), now, 0.05);

    const loadFactor = Math.min(1.0, power / 3500);
    const targetMotorGain = Math.min(0.25, 0.02 + (rpm > 50 ? 0.06 + loadFactor * 0.16 : 0));
    this.motorGain.gain.setTargetAtTime(targetMotorGain, now, 0.08);

    // 2. Modulación del viento
    const windVol = Math.pow(Math.min(1.0, speed / 110), 1.8) * 0.28;
    this.windGain.gain.setTargetAtTime(windVol, now, 0.08);
    this.windFilter.frequency.setTargetAtTime(250 + (speed * 12), now, 0.08);

    // 3. Modulación de rodadura y derrape
    const tireVol = Math.min(0.22, (speed / 100) * 0.18);
    this.tireGain.gain.setTargetAtTime(tireVol, now, 0.08);

    const screechVol = Math.min(0.35, Math.max(0, (lateralSlip - 0.4) * 0.6));
    this.tireScreechGain.gain.setTargetAtTime(screechVol, now, 0.04);
    if (screechVol > 0.02) {
      this.tireScreechOsc.frequency.setTargetAtTime(800 + Math.random() * 300, now, 0.02);
    }

    // 4. Modulación de freno regenerativo
    if (isRegen && speed > 5) {
      const regenVol = Math.min(0.22, (telemetry.regenPowerW / 2000) * 0.2);
      this.regenGain.gain.setTargetAtTime(regenVol, now, 0.05);
      this.regenOsc.frequency.setTargetAtTime(1400 + (speed * 18), now, 0.05);
    } else {
      this.regenGain.gain.setTargetAtTime(0.0, now, 0.08);
    }
  }

  playAssemblyClick() {
    if (!this.isInitialized) this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }
}

export const vehicleAudio = new SolarVehicleAudio();
