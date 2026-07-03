/** Worklet lifecycle + message protocol. Singleton audio engine. */

import type { Patch, FunctionParams, EffectsParams } from './types';
import { EffectsChain } from './effectsChain';

type EngineStatus = 'idle' | 'starting' | 'running' | 'error';

export class SynthEngine {
  private ctx: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private effects: EffectsChain | null = null;
  private pendingPatch: Patch | null = null;
  private pendingFunction: FunctionParams | null = null;
  private pendingEffects: EffectsParams | null = null;
  private queue: unknown[] = [];
  private starting: Promise<void> | null = null;

  status: EngineStatus = 'idle';
  lastError = '';
  onStatusChange: ((status: EngineStatus, error: string) => void) | null = null;

  private setStatus(s: EngineStatus, err = ''): void {
    this.status = s;
    this.lastError = err;
    this.onStatusChange?.(s, err);
  }

  /** Must be called from a user gesture the first time. */
  async start(): Promise<void> {
    if (this.starting) {
      // context can be suspended if the tab lost the audio permission — nudge it
      if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
      return this.starting;
    }
    this.setStatus('starting');
    this.starting = this.init().then(
      () => this.setStatus('running'),
      (e) => {
        this.starting = null; // allow retry on next gesture
        const msg = e instanceof Error ? e.message : String(e);
        this.setStatus('error', msg);
        throw e;
      },
    );
    return this.starting;
  }

  private async init(): Promise<void> {
    const ctx = new AudioContext({ latencyHint: 'interactive' });
    if (!ctx.audioWorklet) {
      throw new Error(
        'AudioWorklet unavailable — this page must be opened over HTTPS (or on localhost). ' +
        `Use https://${location.hostname}:5000 and accept the certificate warning.`,
      );
    }
    await ctx.audioWorklet.addModule('/worklet/fm-processor.js');
    const node = new AudioWorkletNode(ctx, 'dx-fm-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });
    node.onprocessorerror = () => this.setStatus('error', 'FM processor crashed — reload the page.');
    const effects = new EffectsChain(ctx);
    node.connect(effects.input);
    effects.output.connect(ctx.destination);
    this.ctx = ctx;
    this.node = node;
    this.effects = effects;
    if (this.pendingPatch) this.post({ type: 'patch', patch: this.pendingPatch });
    if (this.pendingFunction) this.sendFunction(this.pendingFunction);
    if (this.pendingEffects) this.effects.update(this.pendingEffects);
    for (const msg of this.queue) this.post(msg);
    this.queue = [];
    await ctx.resume();
  }

  private post(msg: unknown): void {
    if (!this.node) {
      // buffer note/control messages that arrive while the worklet is loading
      this.queue.push(msg);
      if (this.queue.length > 64) this.queue.shift();
      return;
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
    this.node.port.postMessage(msg);
  }

  sendPatch(patch: Patch): void {
    this.pendingPatch = patch;
    if (this.node) this.post({ type: 'patch', patch });
  }

  sendFunction(fn: FunctionParams): void {
    this.pendingFunction = fn;
    if (!this.node) return;
    this.post({
      type: 'function',
      portamento: fn.portamento,
      polyphony: fn.mono ? 1 : fn.polyphony,
      mono: fn.mono,
    });
    this.effects?.setMasterVolume(fn.masterVolume);
  }

  sendEffects(fx: EffectsParams): void {
    this.pendingEffects = fx;
    this.effects?.update(fx);
  }

  noteOn(note: number, velocity: number): void {
    this.post({ type: 'noteOn', note, velocity });
  }

  noteOff(note: number): void {
    this.post({ type: 'noteOff', note });
  }

  pitchBend(semitones: number): void {
    this.post({ type: 'pitchBend', semitones });
  }

  modWheel(value: number): void {
    this.post({ type: 'modWheel', value });
  }

  sustain(on: boolean): void {
    this.post({ type: 'sustain', on });
  }

  allNotesOff(): void {
    this.post({ type: 'allNotesOff' });
  }
}

export const synthEngine = new SynthEngine();
