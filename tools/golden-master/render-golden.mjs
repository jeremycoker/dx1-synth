/**
 * Golden-master renderer for the native Swift port.
 *
 * Loads the UNMODIFIED web worklet (public/worklet/fm-processor.js) inside a
 * Node shim of the AudioWorklet environment, drives it with deterministic
 * scenarios (scenarios.json), and dumps raw Float32 renders + a manifest.
 * The Swift DX1Core test suite replays the same scenarios and asserts parity.
 *
 * Determinism: Math.random is replaced with seeded mulberry32 (the Swift side
 * implements the identical PRNG). A fresh processor + PRNG per scenario.
 *
 * Usage: node render-golden.mjs   (writes into ./golden/)
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');
const outDir = path.join(__dirname, 'golden');
fs.mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------------------
// mulberry32 — must match DX1Core/Sources/DX1Core/Support/SeededRandom.swift
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Dump factory presets from the web app's TypeScript source (ground truth)
// via esbuild, so the Swift preset port can be verified value-by-value.
const require_ = createRequire(import.meta.url);
const esbuild = require_(path.join(projectRoot, 'node_modules', 'esbuild'));

async function dumpPresets() {
  const entry = `
    import { FACTORY_PRESETS } from './src/presets/factoryPresets';
    import { INIT_VOICE, DEFAULT_FUNCTION } from './src/presets/initVoice';
    globalThis.__DUMP = { FACTORY_PRESETS, INIT_VOICE, DEFAULT_FUNCTION };
  `;
  const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: projectRoot, loader: 'ts' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'neutral',
  });
  const ctx = { globalThis: {} };
  vm.createContext(ctx);
  vm.runInContext(result.outputFiles[0].text, ctx);
  const dump = ctx.globalThis.__DUMP;
  fs.writeFileSync(path.join(outDir, 'presets.json'), JSON.stringify(dump, null, 2));
  return dump;
}

// ---------------------------------------------------------------------------
// AudioWorklet environment shim, then evaluate fm-processor.js verbatim.
function loadProcessorClass(sampleRate, random) {
  const source = fs.readFileSync(
    path.join(projectRoot, 'public', 'worklet', 'fm-processor.js'), 'utf8');
  let ProcessorClass = null;
  const sandbox = {
    sampleRate,
    currentTime: 0,
    AudioWorkletProcessor: class {
      constructor() { this.port = { onmessage: null, postMessage() {} }; }
    },
    registerProcessor: (_name, cls) => { ProcessorClass = cls; },
    Math: Object.create(Math),
    Float32Array, Float64Array, Uint8Array, Int8Array, Infinity,
  };
  sandbox.Math.random = random;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  if (!ProcessorClass) throw new Error('fm-processor.js did not register a processor');
  return ProcessorClass;
}

// ---------------------------------------------------------------------------
// Patch spec: 'init' | 'preset:NAME' | { base, overrides?, ops?: [{index, overrides}] }
// Mirrored by the Swift golden-master test suite.
function resolvePatch(spec, presets) {
  if (spec === 'init') return presets.INIT_VOICE;
  if (typeof spec === 'string' && spec.startsWith('preset:')) {
    const name = spec.slice('preset:'.length);
    const p = presets.FACTORY_PRESETS.find(x => x.name === name);
    if (!p) throw new Error(`unknown preset ${name}`);
    return p;
  }
  const base = structuredClone(resolvePatch(spec.base, presets));
  Object.assign(base, spec.overrides ?? {});
  for (const o of spec.ops ?? []) Object.assign(base.ops[o.index], o.overrides);
  return base;
}

// ---------------------------------------------------------------------------
function runScenario(scenario, presets) {
  const sr = scenario.sampleRate;
  const blockSize = scenario.blockSize;
  const totalSamples = scenario.totalSamples;
  const random = mulberry32(scenario.seed >>> 0);
  const Processor = loadProcessorClass(sr, random);
  const proc = new Processor();

  const patch = resolvePatch(scenario.patch, presets);

  const events = [{ atSample: 0, msg: { type: 'patch', patch } }];
  if (scenario.function) {
    events.push({ atSample: 0, msg: { type: 'function', ...scenario.function } });
  }
  for (const e of scenario.events) {
    if (e.atSample % blockSize !== 0) {
      throw new Error(`${scenario.name}: event at ${e.atSample} not block-aligned`);
    }
    events.push({ atSample: e.atSample, msg: e.msg });
  }
  events.sort((a, b) => a.atSample - b.atSample);

  const out = new Float32Array(totalSamples);
  let evIdx = 0;
  for (let s = 0; s < totalSamples; s += blockSize) {
    while (evIdx < events.length && events[evIdx].atSample <= s) {
      proc.handleMessage(events[evIdx].msg);
      evIdx++;
    }
    const block = new Float32Array(blockSize);
    proc.process([], [[block]]);
    out.set(block.subarray(0, Math.min(blockSize, totalSamples - s)), s);
  }
  return out;
}

function stats(buf) {
  let peak = 0, sumSq = 0;
  for (let i = 0; i < buf.length; i++) {
    const a = Math.abs(buf[i]);
    if (a > peak) peak = a;
    sumSq += buf[i] * buf[i];
  }
  return { peak, rms: Math.sqrt(sumSq / buf.length) };
}

// ---------------------------------------------------------------------------
const presets = await dumpPresets();
const scenarios = JSON.parse(fs.readFileSync(path.join(__dirname, 'scenarios.json'), 'utf8'));

const manifest = [];
for (const scenario of scenarios) {
  const buf = runScenario(scenario, presets);
  const file = `${scenario.name}.f32`;
  fs.writeFileSync(path.join(outDir, file), Buffer.from(buf.buffer));
  const { peak, rms } = stats(buf);
  manifest.push({ ...scenario, file, peak, rms });
  console.log(`${scenario.name.padEnd(28)} peak ${peak.toFixed(5)}  rms ${rms.toFixed(5)}`);
}
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\n${manifest.length} golden masters written to ${outDir}`);
