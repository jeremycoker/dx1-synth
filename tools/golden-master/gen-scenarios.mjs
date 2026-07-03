/**
 * Generates scenarios.json for render-golden.mjs.
 * Patch spec format (mirrored by the Swift test suite):
 *   'init' | 'preset:NAME' | { base, overrides?, ops?: [{ index, overrides }] }
 * All event times are in samples and must be block-aligned (blockSize 128).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SR = 44100;
const BLOCK = 128;

const scenarios = [];

// --- 32 algorithm routing/feedback scenarios --------------------------------
// Distinct coarse ratios per op so wrong routing is audible in the spectrum.
const ALG_LEVELS = [99, 80, 70, 60, 75, 65];
const ALG_COARSE = [1, 2, 3, 1, 2, 5];
for (let alg = 1; alg <= 32; alg++) {
  scenarios.push({
    name: `alg_${String(alg).padStart(2, '0')}`,
    sampleRate: SR,
    blockSize: BLOCK,
    totalSamples: 33024, // ~0.75 s
    seed: 1000 + alg,
    patch: {
      base: 'init',
      overrides: { algorithm: alg, feedback: 5, name: `ALG ${alg}` },
      ops: ALG_LEVELS.map((lvl, i) => ({
        index: i,
        overrides: { outputLevel: lvl, freqCoarse: ALG_COARSE[i] },
      })),
    },
    events: [
      { atSample: 0, msg: { type: 'noteOn', note: 60, velocity: 1 } },
      { atSample: 22016, msg: { type: 'noteOff', note: 60 } },
    ],
  });
}

// --- 17 factory presets ------------------------------------------------------
const PRESET_NAMES = [
  'E.PIANO 1', 'FULLTINES', 'WURLI EP', 'TUB BELLS', 'VIBES', 'MARIMBA',
  'BASS 1', 'SOLIDBASS', 'CLAV 1', 'HARPSICH',
  'BRASS 1', 'STRINGS 1', 'GLASS PAD', 'PIPES 1', 'FLUTE 1', 'SYN-LEAD',
  'INIT VOICE',
];
for (const name of PRESET_NAMES) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  scenarios.push({
    name: `preset_${slug}`,
    sampleRate: SR,
    blockSize: BLOCK,
    totalSamples: 88064, // ~2 s
    seed: 42,
    patch: `preset:${name}`,
    events: [
      { atSample: 0, msg: { type: 'noteOn', note: 60, velocity: 0.8 } },
      { atSample: 44032, msg: { type: 'noteOff', note: 60 } },
    ],
  });
}

// --- behavioural scenarios ----------------------------------------------------
scenarios.push({
  name: 'chord_velocity',
  sampleRate: SR, blockSize: BLOCK, totalSamples: 88064, seed: 7,
  patch: 'preset:E.PIANO 1',
  events: [
    { atSample: 0, msg: { type: 'noteOn', note: 48, velocity: 0.5 } },
    { atSample: 2560, msg: { type: 'noteOn', note: 60, velocity: 0.8 } },
    { atSample: 5120, msg: { type: 'noteOn', note: 64, velocity: 1 } },
    { atSample: 7680, msg: { type: 'noteOn', note: 67, velocity: 0.3 } },
    { atSample: 44032, msg: { type: 'noteOff', note: 48 } },
    { atSample: 44032, msg: { type: 'noteOff', note: 60 } },
    { atSample: 46080, msg: { type: 'noteOff', note: 64 } },
    { atSample: 48128, msg: { type: 'noteOff', note: 67 } },
  ],
});

scenarios.push({
  name: 'pitch_bend',
  sampleRate: SR, blockSize: BLOCK, totalSamples: 44032, seed: 7,
  patch: 'init',
  events: [
    { atSample: 0, msg: { type: 'noteOn', note: 60, velocity: 1 } },
    { atSample: 12800, msg: { type: 'pitchBend', semitones: 2 } },
    { atSample: 25600, msg: { type: 'pitchBend', semitones: -1.5 } },
    { atSample: 35840, msg: { type: 'noteOff', note: 60 } },
  ],
});

scenarios.push({
  name: 'mod_wheel',
  sampleRate: SR, blockSize: BLOCK, totalSamples: 66048, seed: 7,
  patch: 'preset:BRASS 1',
  events: [
    { atSample: 0, msg: { type: 'noteOn', note: 55, velocity: 0.9 } },
    { atSample: 12800, msg: { type: 'modWheel', value: 0.7 } },
    { atSample: 44032, msg: { type: 'noteOff', note: 55 } },
  ],
});

scenarios.push({
  name: 'sustain_pedal',
  sampleRate: SR, blockSize: BLOCK, totalSamples: 66048, seed: 7,
  patch: 'preset:E.PIANO 1',
  events: [
    { atSample: 0, msg: { type: 'noteOn', note: 60, velocity: 0.8 } },
    { atSample: 6400, msg: { type: 'sustain', on: true } },
    { atSample: 12800, msg: { type: 'noteOff', note: 60 } },
    { atSample: 44032, msg: { type: 'sustain', on: false } },
  ],
});

scenarios.push({
  name: 'voice_stealing',
  sampleRate: SR, blockSize: BLOCK, totalSamples: 44032, seed: 7,
  patch: 'preset:STRINGS 1',
  function: { polyphony: 2 },
  events: [
    { atSample: 0, msg: { type: 'noteOn', note: 60, velocity: 0.8 } },
    { atSample: 2560, msg: { type: 'noteOn', note: 64, velocity: 0.8 } },
    { atSample: 5120, msg: { type: 'noteOn', note: 67, velocity: 0.8 } }, // steals note 60
    { atSample: 30720, msg: { type: 'noteOff', note: 64 } },
    { atSample: 30720, msg: { type: 'noteOff', note: 67 } },
  ],
});

scenarios.push({
  name: 'mono_portamento',
  sampleRate: SR, blockSize: BLOCK, totalSamples: 66048, seed: 7,
  patch: 'preset:SYN-LEAD',
  function: { mono: true, portamento: 0.2 },
  events: [
    { atSample: 0, msg: { type: 'noteOn', note: 48, velocity: 1 } },
    { atSample: 12800, msg: { type: 'noteOn', note: 60, velocity: 1 } },
    { atSample: 44032, msg: { type: 'noteOff', note: 60 } },
  ],
});

scenarios.push({
  name: 'sh_lfo_seeded',
  sampleRate: SR, blockSize: BLOCK, totalSamples: 66048, seed: 12345,
  patch: {
    base: 'init',
    overrides: {
      name: 'S&H TEST', lfoWave: 5, lfoSpeed: 60, lfoDelay: 0,
      lfoAmd: 60, lfoPmd: 40, lfoPitchModSens: 5,
    },
    ops: [{ index: 0, overrides: { amSens: 3 } }],
  },
  events: [
    { atSample: 0, msg: { type: 'noteOn', note: 60, velocity: 1 } },
    { atSample: 44032, msg: { type: 'noteOff', note: 60 } },
  ],
});

scenarios.push({
  name: 'fixed_freq_op',
  sampleRate: SR, blockSize: BLOCK, totalSamples: 44032, seed: 7,
  patch: {
    base: 'init',
    overrides: { name: 'FIXED TEST', algorithm: 5, feedback: 4 },
    ops: [
      { index: 0, overrides: { outputLevel: 99 } },
      { index: 1, overrides: { outputLevel: 70, freqMode: 1, freqCoarse: 2, freqFine: 30 } },
      { index: 2, overrides: { outputLevel: 90 } },
      { index: 3, overrides: { outputLevel: 60, freqCoarse: 7 } },
    ],
  },
  events: [
    { atSample: 0, msg: { type: 'noteOn', note: 52, velocity: 0.9 } },
    { atSample: 30720, msg: { type: 'noteOff', note: 52 } },
  ],
});

scenarios.push({
  name: 'osc_free_running',
  // oscKeySync=false + polyphony 1 => voice reuse keeps oscillator phase
  sampleRate: SR, blockSize: BLOCK, totalSamples: 44032, seed: 7,
  patch: {
    base: 'init',
    overrides: { name: 'FREE OSC', oscKeySync: false, algorithm: 5, feedback: 3 },
    ops: [
      { index: 0, overrides: { outputLevel: 99 } },
      { index: 1, overrides: { outputLevel: 75, freqCoarse: 2 } },
      { index: 2, overrides: { outputLevel: 90 } },
    ],
  },
  function: { polyphony: 1 },
  events: [
    { atSample: 0, msg: { type: 'noteOn', note: 60, velocity: 1 } },
    { atSample: 6400, msg: { type: 'noteOff', note: 60 } },
    { atSample: 12800, msg: { type: 'noteOn', note: 62, velocity: 1 } },
    { atSample: 19200, msg: { type: 'noteOff', note: 62 } },
    { atSample: 25600, msg: { type: 'noteOn', note: 55, velocity: 0.6 } },
    { atSample: 35840, msg: { type: 'noteOff', note: 55 } },
  ],
});

scenarios.push({
  name: 'porta_downward',
  // glide from a higher note down (positive glideFrom branch)
  sampleRate: SR, blockSize: BLOCK, totalSamples: 66048, seed: 7,
  patch: 'preset:SYN-LEAD',
  function: { mono: true, portamento: 0.35 },
  events: [
    { atSample: 0, msg: { type: 'noteOn', note: 72, velocity: 1 } },
    { atSample: 12800, msg: { type: 'noteOn', note: 48, velocity: 1 } },
    { atSample: 44032, msg: { type: 'noteOff', note: 48 } },
  ],
});

scenarios.push({
  name: 'scaling_curves',
  // all four scaling curves, notes far left/right of breakpoint C3
  sampleRate: SR, blockSize: BLOCK, totalSamples: 66048, seed: 7,
  patch: {
    base: 'init',
    overrides: { name: 'SCALE TEST', algorithm: 32, feedback: 0 },
    ops: [
      { index: 0, overrides: { outputLevel: 90, scaleLeftDepth: 60, scaleRightDepth: 60, scaleLeftCurve: 0, scaleRightCurve: 3 } },
      { index: 1, overrides: { outputLevel: 90, scaleLeftDepth: 80, scaleRightDepth: 80, scaleLeftCurve: 1, scaleRightCurve: 2, freqCoarse: 2 } },
      { index: 2, overrides: { outputLevel: 90, scaleLeftDepth: 99, scaleRightDepth: 99, scaleLeftCurve: 3, scaleRightCurve: 0, freqCoarse: 3 } },
      { index: 3, overrides: { outputLevel: 90, scaleLeftDepth: 40, scaleRightDepth: 40, scaleLeftCurve: 2, scaleRightCurve: 1, freqCoarse: 4 } },
    ],
  },
  events: [
    { atSample: 0, msg: { type: 'noteOn', note: 24, velocity: 1 } },
    { atSample: 12800, msg: { type: 'noteOff', note: 24 } },
    { atSample: 19200, msg: { type: 'noteOn', note: 96, velocity: 1 } },
    { atSample: 32000, msg: { type: 'noteOff', note: 96 } },
    { atSample: 38400, msg: { type: 'noteOn', note: 108, velocity: 1 } },
    { atSample: 51200, msg: { type: 'noteOff', note: 108 } },
  ],
});

for (const [wave, waveName] of [[1, 'sawdn'], [2, 'sawup'], [3, 'square']]) {
  scenarios.push({
    name: `lfo_wave_${waveName}`,
    sampleRate: SR, blockSize: BLOCK, totalSamples: 44032, seed: 7,
    patch: {
      base: 'init',
      overrides: {
        name: `LFO ${wave}`, lfoWave: wave, lfoSpeed: 55, lfoDelay: 0,
        lfoAmd: 50, lfoPmd: 35, lfoPitchModSens: 4, lfoSync: false,
      },
      ops: [{ index: 0, overrides: { amSens: 3 } }],
    },
    events: [
      { atSample: 0, msg: { type: 'noteOn', note: 60, velocity: 1 } },
      { atSample: 32000, msg: { type: 'noteOff', note: 60 } },
    ],
  });
}

scenarios.push({
  name: 'op_disabled',
  sampleRate: SR, blockSize: BLOCK, totalSamples: 44032, seed: 7,
  patch: {
    base: 'preset:E.PIANO 1',
    overrides: { name: 'OP OFF' },
    ops: [
      { index: 1, overrides: { enabled: false } },
      { index: 4, overrides: { enabled: false } },
    ],
  },
  events: [
    { atSample: 0, msg: { type: 'noteOn', note: 60, velocity: 0.8 } },
    { atSample: 30720, msg: { type: 'noteOff', note: 60 } },
  ],
});

scenarios.push({
  name: 'rate_scaling_high_note',
  sampleRate: SR, blockSize: BLOCK, totalSamples: 44032, seed: 7,
  patch: {
    base: 'init',
    overrides: { name: 'RS TEST', algorithm: 5, feedback: 4 },
    ops: [
      { index: 0, overrides: { outputLevel: 99, rateScaling: 7, egRates: [80, 40, 30, 60], egLevels: [99, 70, 0, 0] } },
      { index: 1, overrides: { outputLevel: 80, rateScaling: 7, egRates: [80, 40, 30, 60], egLevels: [99, 50, 0, 0], freqCoarse: 3 } },
      { index: 2, overrides: { outputLevel: 95, rateScaling: 0, egRates: [80, 40, 30, 60], egLevels: [99, 70, 0, 0] } },
    ],
  },
  events: [
    { atSample: 0, msg: { type: 'noteOn', note: 108, velocity: 1 } },
    { atSample: 12800, msg: { type: 'noteOff', note: 108 } },
    { atSample: 19200, msg: { type: 'noteOn', note: 36, velocity: 1 } },
    { atSample: 32000, msg: { type: 'noteOff', note: 36 } },
  ],
});

scenarios.push({
  name: 'block_invariance_ref',
  sampleRate: SR, blockSize: BLOCK, totalSamples: 22016, seed: 7,
  patch: 'preset:TUB BELLS',
  events: [
    { atSample: 0, msg: { type: 'noteOn', note: 72, velocity: 0.7 } },
    { atSample: 12800, msg: { type: 'noteOff', note: 72 } },
  ],
});

fs.writeFileSync(
  path.join(__dirname, 'scenarios.json'),
  JSON.stringify(scenarios, null, 2)
);
console.log(`${scenarios.length} scenarios written`);
