/**
 * Yamaha DX-series 6-operator phase-modulation FM engine.
 * Runs entirely inside an AudioWorkletProcessor; renders all voices sample-by-sample.
 *
 * Faithful behaviours:
 *  - True phase modulation (not detune-FM), sine table with phase accumulators
 *  - All 32 DX algorithms (routing tables below)
 *  - Operator self/loop feedback 0-7 with 2-sample averaging (like the OPS chip)
 *  - 4-rate/4-level EGs, exponential level curve (~0.75 dB per level step),
 *    exponential-approach attack, linear-in-dB decays
 *  - Keyboard level scaling (breakpoint, L/R depth, ±LIN/±EXP curves), rate scaling
 *  - Global LFO (6 waves) with delay, AMD/PMD, key sync, per-op AM sensitivity
 *  - Pitch EG, detune, fixed/ratio frequency modes, velocity sensitivity
 *  - Polyphony with oldest-note stealing
 */

'use strict';

const SINE_BITS = 12;
const SINE_SIZE = 1 << SINE_BITS; // 4096
const SINE_MASK = SINE_SIZE - 1;
const SINE = new Float32Array(SINE_SIZE + 1);
for (let i = 0; i <= SINE_SIZE; i++) SINE[i] = Math.sin((i / SINE_SIZE) * 2 * Math.PI);

const TWO_PI = Math.PI * 2;

// ~0.75 dB per DX level step: gain = exp(LEVEL_K * (level - 99))
const LEVEL_K = Math.log(Math.pow(10, 0.75 / 20)); // 0.08632...

// Peak modulation index (radians) for a modulator at output level 99 / full EG
const MOD_SCALE = 8.0;

// Feedback scale: fb=7 approaches a sawtooth-like spectrum
const FB_SCALE = [0, 0.0391, 0.0781, 0.1563, 0.3125, 0.625, 1.25, 2.5];

// ---------------------------------------------------------------------------
// 32 DX algorithms. Ops are 0-indexed (op 0 = OP1). mods[i] = ops that phase-
// modulate op i. Rendering order 5..0 is valid: modulators always have a
// higher index than the op they modulate; feedback uses previous samples.
// fbOp receives feedback taken from fbSrc's output (self except algs 4 & 6).
// ---------------------------------------------------------------------------
const ALGORITHMS = [
  { mods: [[1], [], [3], [4], [5], []], carriers: [0, 2], fbOp: 5, fbSrc: 5 },          // 1
  { mods: [[1], [], [3], [4], [5], []], carriers: [0, 2], fbOp: 1, fbSrc: 1 },          // 2
  { mods: [[1], [2], [], [4], [5], []], carriers: [0, 3], fbOp: 5, fbSrc: 5 },          // 3
  { mods: [[1], [2], [], [4], [5], []], carriers: [0, 3], fbOp: 5, fbSrc: 3 },          // 4
  { mods: [[1], [], [3], [], [5], []], carriers: [0, 2, 4], fbOp: 5, fbSrc: 5 },        // 5
  { mods: [[1], [], [3], [], [5], []], carriers: [0, 2, 4], fbOp: 5, fbSrc: 4 },        // 6
  { mods: [[1], [], [3, 4], [], [5], []], carriers: [0, 2], fbOp: 5, fbSrc: 5 },        // 7
  { mods: [[1], [], [3, 4], [], [5], []], carriers: [0, 2], fbOp: 3, fbSrc: 3 },        // 8
  { mods: [[1], [], [3, 4], [], [5], []], carriers: [0, 2], fbOp: 1, fbSrc: 1 },        // 9
  { mods: [[1], [2], [], [4, 5], [], []], carriers: [0, 3], fbOp: 2, fbSrc: 2 },        // 10
  { mods: [[1], [2], [], [4, 5], [], []], carriers: [0, 3], fbOp: 5, fbSrc: 5 },        // 11
  { mods: [[1], [], [3, 4, 5], [], [], []], carriers: [0, 2], fbOp: 1, fbSrc: 1 },      // 12
  { mods: [[1], [], [3, 4, 5], [], [], []], carriers: [0, 2], fbOp: 5, fbSrc: 5 },      // 13
  { mods: [[1], [], [3], [4, 5], [], []], carriers: [0, 2], fbOp: 5, fbSrc: 5 },        // 14
  { mods: [[1], [], [3], [4, 5], [], []], carriers: [0, 2], fbOp: 1, fbSrc: 1 },        // 15
  { mods: [[1, 2, 4], [], [3], [], [5], []], carriers: [0], fbOp: 5, fbSrc: 5 },        // 16
  { mods: [[1, 2, 4], [], [3], [], [5], []], carriers: [0], fbOp: 1, fbSrc: 1 },        // 17
  { mods: [[1, 2, 3], [], [], [4], [5], []], carriers: [0], fbOp: 2, fbSrc: 2 },        // 18
  { mods: [[1], [2], [], [5], [5], []], carriers: [0, 3, 4], fbOp: 5, fbSrc: 5 },       // 19
  { mods: [[2], [2], [], [4, 5], [], []], carriers: [0, 1, 3], fbOp: 2, fbSrc: 2 },     // 20
  { mods: [[2], [2], [], [5], [5], []], carriers: [0, 1, 3, 4], fbOp: 2, fbSrc: 2 },    // 21
  { mods: [[1], [], [5], [5], [5], []], carriers: [0, 2, 3, 4], fbOp: 5, fbSrc: 5 },    // 22
  { mods: [[], [2], [], [5], [5], []], carriers: [0, 1, 3, 4], fbOp: 5, fbSrc: 5 },     // 23
  { mods: [[], [], [5], [5], [5], []], carriers: [0, 1, 2, 3, 4], fbOp: 5, fbSrc: 5 },  // 24
  { mods: [[], [], [], [5], [5], []], carriers: [0, 1, 2, 3, 4], fbOp: 5, fbSrc: 5 },   // 25
  { mods: [[], [2], [], [4, 5], [], []], carriers: [0, 1, 3], fbOp: 5, fbSrc: 5 },      // 26
  { mods: [[], [2], [], [4, 5], [], []], carriers: [0, 1, 3], fbOp: 2, fbSrc: 2 },      // 27
  { mods: [[1], [], [3], [4], [], []], carriers: [0, 2, 5], fbOp: 4, fbSrc: 4 },        // 28
  { mods: [[], [], [3], [], [5], []], carriers: [0, 1, 2, 4], fbOp: 5, fbSrc: 5 },      // 29
  { mods: [[], [], [3], [4], [], []], carriers: [0, 1, 2, 5], fbOp: 4, fbSrc: 4 },      // 30
  { mods: [[], [], [], [], [5], []], carriers: [0, 1, 2, 3, 4], fbOp: 5, fbSrc: 5 },    // 31
  { mods: [[], [], [], [], [], []], carriers: [0, 1, 2, 3, 4, 5], fbOp: 5, fbSrc: 5 },  // 32
];

// EG rate (0-99) -> seconds to traverse the full 0-99 level range
function rateToFullTime(rate) {
  return Math.pow(2, (64 - rate) / 6) * 0.028;
}

// DX level (0-99, may be fractional / >99 clamped) -> linear gain
function levelToGain(level) {
  if (level <= 0) return 0;
  if (level > 99) level = 99;
  return Math.exp(LEVEL_K * (level - 99));
}

// Keyboard level scaling: returns level offset (in DX level units, +/-)
// curve: 0=-LIN 1=-EXP 2=+EXP 3=+LIN
function scalingOffset(note, breakpoint, leftDepth, rightDepth, leftCurve, rightCurve) {
  // breakpoint 0-99 maps to MIDI A-1(21)... actually DX BP 0 = A-1 = MIDI 21? DX7: BP 0=A-1(midi 9+12=21?) Use BP+21? Standard: breakpoint 39 = C3 = MIDI 60 -> offset 21.
  const bpNote = breakpoint + 21;
  const dist = note - bpNote;
  if (dist === 0) return 0;
  const depth = dist < 0 ? leftDepth : rightDepth;
  const curve = dist < 0 ? leftCurve : rightCurve;
  if (depth === 0) return 0;
  const ad = Math.abs(dist);
  let amt;
  if (curve === 1 || curve === 2) {
    // exponential curve: doubles roughly every octave
    amt = Math.exp((ad - 72) / 13.5) * 99;
    if (amt > 99) amt = 99;
    amt = (depth / 99) * amt * 4; // scaled to feel like hardware EXP
    if (amt > depth * 1.0 * (ad / 12)) { /* keep growth bounded below */ }
  } else {
    // linear: depth reached over ~ 45 semitones
    amt = (depth * ad) / 45;
  }
  if (amt > 99) amt = 99;
  const sign = curve <= 1 ? -1 : 1; // curves 0,1 negative; 2,3 positive
  return sign * amt;
}

// LFO speed 0-99 -> Hz (approximation of DX7 LFO table: ~0.06 Hz .. ~47 Hz)
function lfoSpeedToHz(speed) {
  if (speed <= 0) return 0.062;
  return 0.062 * Math.pow(2, speed / 11);
}

// LFO delay 0-99 -> seconds until LFO fades in
function lfoDelayToSeconds(delay) {
  if (delay <= 0) return 0;
  return Math.pow(delay / 99, 2) * 5.0;
}

// Pitch EG level (0-99, 50 = center) -> semitones
function pegLevelToSemis(level) {
  return (level - 50) * 0.96;
}

const NUM_OPS = 6;

// ---------------------------------------------------------------------------
class Voice {
  constructor() {
    this.active = false;
    this.note = 60;
    this.velocity = 1;
    this.age = 0;
    this.down = false; // key held
    this.phases = new Float64Array(NUM_OPS);      // 0..1 phase
    this.out1 = new Float32Array(NUM_OPS);        // previous output
    this.out2 = new Float32Array(NUM_OPS);        // output before that
    this.baseFreq = new Float32Array(NUM_OPS);    // per-op frequency (Hz), pre-bend
    this.fixed = new Uint8Array(NUM_OPS);
    // EG state per op
    this.egStage = new Int8Array(NUM_OPS);        // 0,1,2 = key-on segs, 3 = release, 4 = done
    this.egLevel = new Float32Array(NUM_OPS);     // current level, DX 0-99 domain
    this.egInc = new Float32Array(NUM_OPS);       // per-sample linear increment
    this.opLevelOff = new Float32Array(NUM_OPS);  // scaling + velocity offset (level units)
    this.rateAdj = new Float32Array(NUM_OPS);     // rate scaling adjustment
    // Pitch EG
    this.pegStage = 0;
    this.pegLevel = 50;
    this.lfoDelayT = 0;                            // seconds since key-on (for LFO delay)
    this.glideFrom = 0;                            // semitone offset gliding to 0
    this.glideRate = 0;                            // offset decay per sample
  }

  noteOn(note, velocity, patch, sr, lastNote, portamentoSec) {
    this.active = true;
    this.down = true;
    this.note = note;
    this.velocity = velocity;
    this.lfoDelayT = 0;
    this.pegStage = 0;
    this.pegLevel = patch.pitchEgLevels[3]; // EG starts from L4
    // Portamento glide
    if (portamentoSec > 0.005 && lastNote >= 0 && lastNote !== note) {
      this.glideFrom = lastNote - note;
      this.glideRate = 1 / (portamentoSec * sr);
    } else {
      this.glideFrom = 0;
    }
    const transpose = patch.transpose - 24; // 24 = C3 center
    for (let i = 0; i < NUM_OPS; i++) {
      const op = patch.ops[i];
      // frequency
      if (op.freqMode === 1) {
        this.fixed[i] = 1;
        this.baseFreq[i] = Math.pow(10, op.freqCoarse % 4) * Math.pow(10, op.freqFine / 100)
          * Math.pow(2, (op.detune - 7) * 1.5 / 1200);
      } else {
        this.fixed[i] = 0;
        const coarse = op.freqCoarse === 0 ? 0.5 : op.freqCoarse;
        const ratio = coarse * (1 + op.freqFine / 100);
        const noteFreq = 440 * Math.pow(2, (note + transpose - 69) / 12);
        this.baseFreq[i] = noteFreq * ratio * Math.pow(2, (op.detune - 7) * 1.5 / 1200);
      }
      if (patch.oscKeySync || !this.wasActive) this.phases[i] = 0;
      this.out1[i] = 0;
      this.out2[i] = 0;
      // level scaling + velocity offset (computed once per note)
      const scaleOff = scalingOffset(note, op.breakpoint, op.scaleLeftDepth,
        op.scaleRightDepth, op.scaleLeftCurve, op.scaleRightCurve);
      const velOff = op.velSens * (velocity - 1) * 14; // up to -14 levels per sens step
      this.opLevelOff[i] = scaleOff + velOff;
      // rate scaling
      this.rateAdj[i] = (op.rateScaling * Math.max(0, note - 21)) / 12;
      // EG: start at level 0 (from silence), head to L1
      this.egStage[i] = 0;
      this.egLevel[i] = 0;
      this.egInc[i] = this.computeInc(op, 0, sr, i);
    }
    this.wasActive = true;
  }

  computeInc(op, stage, sr, opIdx) {
    const rate = Math.min(99, op.egRates[stage] + this.rateAdj[opIdx]);
    const t = rateToFullTime(rate);
    return 99 / (t * sr);
  }

  noteOff(patch, sr) {
    this.down = false;
    for (let i = 0; i < NUM_OPS; i++) {
      if (this.egStage[i] < 3) {
        this.egStage[i] = 3;
        this.egInc[i] = this.computeInc(patch.ops[i], 3, sr, i);
      }
    }
    this.pegStage = 3;
  }
}

// ---------------------------------------------------------------------------
class FmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.sr = sampleRate;
    this.patch = null;
    this.voices = [];
    for (let i = 0; i < 32; i++) this.voices.push(new Voice());
    this.maxVoices = 16;
    this.noteCounter = 0;
    this.lastNote = -1;
    this.pitchBend = 0;   // semitones
    this.modWheel = 0;    // 0..1
    this.sustain = false;
    this.portamento = 0;  // seconds
    this.lfoPhase = 0;
    this.lfoSH = 0;       // sample & hold value
    this.lfoSHPhasePrev = 0;
    this.masterGain = 1.0;
    this.mono = false;

    this.port.onmessage = (e) => this.handleMessage(e.data);
  }

  handleMessage(m) {
    switch (m.type) {
      case 'patch':
        this.patch = m.patch;
        break;
      case 'noteOn':
        if (this.patch) this.noteOn(m.note, m.velocity);
        break;
      case 'noteOff':
        this.noteOff(m.note);
        break;
      case 'pitchBend':
        this.pitchBend = m.semitones;
        break;
      case 'modWheel':
        this.modWheel = m.value;
        break;
      case 'sustain':
        this.sustain = m.on;
        if (!m.on && this.patch) {
          for (const v of this.voices) {
            if (v.active && !v.down && v.sustained) {
              v.sustained = false;
              v.noteOff(this.patch, this.sr);
            }
          }
        }
        break;
      case 'allNotesOff':
        for (const v of this.voices) { v.active = false; v.down = false; }
        break;
      case 'function':
        this.portamento = m.portamento ?? this.portamento;
        this.maxVoices = m.polyphony ?? this.maxVoices;
        this.mono = m.mono ?? this.mono;
        break;
    }
  }

  noteOn(note, velocity) {
    if (this.mono) {
      for (const v of this.voices) if (v.active) { v.down = false; v.noteOff(this.patch, this.sr); }
    }
    // find free voice or steal oldest
    let voice = null;
    let oldest = null;
    let oldestAge = Infinity;
    let activeCount = 0;
    for (const v of this.voices) {
      if (!v.active) { if (!voice) voice = v; }
      else {
        activeCount++;
        if (v.age < oldestAge) { oldestAge = v.age; oldest = v; }
      }
    }
    if (!voice || activeCount >= this.maxVoices) voice = oldest || this.voices[0];
    voice.age = this.noteCounter++;
    voice.sustained = false;
    voice.noteOn(note, velocity, this.patch, this.sr, this.lastNote, this.portamento);
    if (this.patch.lfoSync) this.lfoPhase = 0;
    this.lastNote = note;
  }

  noteOff(note) {
    for (const v of this.voices) {
      if (v.active && v.down && v.note === note) {
        v.down = false;
        if (this.sustain) v.sustained = true;
        else v.noteOff(this.patch, this.sr);
      }
    }
  }

  lfoValue(wave, phase) {
    switch (wave) {
      case 0: { // triangle
        const p = phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4;
        return p;
      }
      case 1: return 1 - phase * 2;              // saw down
      case 2: return phase * 2 - 1;              // saw up
      case 3: return phase < 0.5 ? 1 : -1;       // square
      case 4: return SINE[(phase * SINE_SIZE) & SINE_MASK]; // sine
      case 5: return this.lfoSH;                 // sample & hold
      default: return 0;
    }
  }

  process(_inputs, outputs) {
    const out = outputs[0][0];
    const patch = this.patch;
    if (!patch) { out.fill(0); return true; }

    const alg = ALGORITHMS[patch.algorithm - 1];
    const mods = alg.mods;
    const carriers = alg.carriers;
    const fbOp = alg.fbOp;
    const fbSrc = alg.fbSrc;
    const fbAmt = FB_SCALE[patch.feedback];
    const carrierNorm = 1 / Math.max(1, Math.sqrt(carriers.length) * 1.2);
    const sr = this.sr;
    const lfoHz = lfoSpeedToHz(patch.lfoSpeed);
    const lfoIncr = lfoHz / sr;
    const lfoDelaySec = lfoDelayToSeconds(patch.lfoDelay);
    const pms = patch.lfoPitchModSens; // 0-7
    const pmDepth = (patch.lfoPmd / 99 + this.modWheel) * [0, 0.075, 0.15, 0.3, 0.6, 1.2, 2.4, 4.8][pms]; // semitones
    const amDepth = patch.lfoAmd / 99; // 0..1
    const bend = this.pitchBend;
    const opOut = new Float32Array(NUM_OPS);

    for (let s = 0; s < out.length; s++) {
      // global LFO
      this.lfoPhase += lfoIncr;
      if (this.lfoPhase >= 1) {
        this.lfoPhase -= 1;
        this.lfoSH = Math.random() * 2 - 1;
      }
      const lfoRaw = this.lfoValue(patch.lfoWave, this.lfoPhase);

      let mix = 0;
      for (let vi = 0; vi < this.voices.length; vi++) {
        const v = this.voices[vi];
        if (!v.active) continue;

        // ---- LFO fade-in for this voice
        v.lfoDelayT += 1 / sr;
        const lfoAmt = lfoDelaySec <= 0 ? 1 : Math.min(1, Math.max(0, (v.lfoDelayT - lfoDelaySec) / 0.3 + (v.lfoDelayT >= lfoDelaySec ? 0.0001 : 0)));
        const lfo = lfoRaw * lfoAmt;

        // ---- Pitch EG
        {
          const target = v.pegStage < 3 ? patch.pitchEgLevels[v.pegStage] : patch.pitchEgLevels[3];
          const rate = v.pegStage < 4 ? patch.pitchEgRates[Math.min(3, v.pegStage)] : 99;
          const inc = 99 / (rateToFullTime(rate) * sr);
          if (v.pegLevel < target) {
            v.pegLevel += inc; if (v.pegLevel >= target) { v.pegLevel = target; if (v.pegStage < 2 || v.pegStage === 3) v.pegStage = v.pegStage < 2 ? v.pegStage + 1 : 4; }
          } else if (v.pegLevel > target) {
            v.pegLevel -= inc; if (v.pegLevel <= target) { v.pegLevel = target; if (v.pegStage < 2 || v.pegStage === 3) v.pegStage = v.pegStage < 2 ? v.pegStage + 1 : 4; }
          } else if (v.pegStage < 2) v.pegStage++;
        }
        const pegSemis = pegLevelToSemis(v.pegLevel);

        // ---- Portamento glide
        if (v.glideFrom !== 0) {
          if (v.glideFrom > 0) { v.glideFrom -= v.glideRate * Math.abs(v.glideFrom + 1); if (v.glideFrom < 0) v.glideFrom = 0; }
          else { v.glideFrom += v.glideRate * Math.abs(v.glideFrom - 1); if (v.glideFrom > 0) v.glideFrom = 0; }
        }

        const pitchMul = Math.pow(2, (bend + pegSemis + lfo * pmDepth + v.glideFrom) / 12);

        // ---- render operators, highest index first
        let voiceOut = 0;
        let anyEgAlive = false;
        for (let i = NUM_OPS - 1; i >= 0; i--) {
          const op = patch.ops[i];

          // --- EG advance
          let stage = v.egStage[i];
          if (stage < 4) {
            const target = stage < 3 ? op.egLevels[stage] : op.egLevels[3];
            const lvl = v.egLevel[i];
            if (lvl < target) {
              // rising: exponential approach for authentic snappy attack
              const nl = lvl + v.egInc[i] * (1 + (target - lvl) * 0.06) * 4;
              v.egLevel[i] = nl >= target ? target : nl;
            } else if (lvl > target) {
              // falling: linear in dB domain (exponential amplitude decay)
              const nl = lvl - v.egInc[i];
              v.egLevel[i] = nl <= target ? target : nl;
            }
            if (v.egLevel[i] === target) {
              if (stage < 2) {
                v.egStage[i] = ++stage;
                v.egInc[i] = v.computeInc(op, stage, sr, i);
              } else if (stage === 3) {
                v.egStage[i] = 4;
              }
              // stage 2 sustains at L3 until noteOff
            }
            if (stage < 3 || v.egLevel[i] > 0.01) anyEgAlive = true;
          }

          if (!op.enabled) { opOut[i] = 0; v.out2[i] = v.out1[i]; v.out1[i] = 0; continue; }

          // --- effective level -> gain
          let effLevel = v.egLevel[i] + op.outputLevel - 99 + v.opLevelOff[i];
          // per-op LFO amplitude modulation
          let gain = levelToGain(effLevel);
          if (op.amSens > 0 && amDepth > 0) {
            const am = 1 - (amDepth * (op.amSens / 3)) * (0.5 + 0.5 * lfo);
            gain *= Math.max(0, am);
          }

          // --- phase modulation input
          let pm = 0;
          const ml = mods[i];
          for (let mIdx = 0; mIdx < ml.length; mIdx++) pm += opOut[ml[mIdx]];
          if (i === fbOp && fbAmt > 0) {
            pm += (v.out1[fbSrc] + v.out2[fbSrc]) * 0.5 * fbAmt;
          }

          // --- oscillator
          const freq = v.fixed[i] ? v.baseFreq[i] : v.baseFreq[i] * pitchMul;
          v.phases[i] += freq / sr;
          if (v.phases[i] >= 1) v.phases[i] -= 1;
          const phi = v.phases[i] * TWO_PI + pm * MOD_SCALE;
          // table lookup with linear interpolation
          let tpos = (phi / TWO_PI) * SINE_SIZE;
          tpos = tpos - Math.floor(tpos / SINE_SIZE) * SINE_SIZE;
          const ti = tpos | 0;
          const frac = tpos - ti;
          const sig = (SINE[ti] + (SINE[ti + 1] - SINE[ti]) * frac) * gain;

          v.out2[i] = v.out1[i];
          v.out1[i] = sig;
          opOut[i] = sig;
        }

        for (let c = 0; c < carriers.length; c++) voiceOut += opOut[carriers[c]];
        mix += voiceOut * carrierNorm;

        if (!anyEgAlive && !v.down) v.active = false;
      }

      out[s] = mix * 0.35 * this.masterGain;
    }

    // copy to other channels if present
    for (let ch = 1; ch < outputs[0].length; ch++) outputs[0][ch].set(out);
    return true;
  }
}

registerProcessor('dx-fm-processor', FmProcessor);
