/** Modern additions: feedback delay + generated-impulse convolution reverb + master gain. */

import type { EffectsParams } from './types';

export const DEFAULT_EFFECTS: EffectsParams = {
  delayTime: 0.28,
  delayFeedback: 0.25,
  delayMix: 0.0,
  reverbSize: 0.5,
  reverbMix: 0.18,
};

export class EffectsChain {
  readonly input: GainNode;
  readonly output: GainNode;
  private delay: DelayNode;
  private delayFb: GainNode;
  private delayWet: GainNode;
  private convolver: ConvolverNode;
  private reverbWet: GainNode;
  private master: GainNode;
  private ctx: AudioContext;
  private currentSize = -1;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.master = ctx.createGain();

    // dry path
    this.input.connect(this.master);

    // delay path
    this.delay = ctx.createDelay(2.0);
    this.delayFb = ctx.createGain();
    this.delayWet = ctx.createGain();
    this.input.connect(this.delay);
    this.delay.connect(this.delayFb);
    this.delayFb.connect(this.delay);
    this.delay.connect(this.delayWet);
    this.delayWet.connect(this.master);

    // reverb path
    this.convolver = ctx.createConvolver();
    this.reverbWet = ctx.createGain();
    this.input.connect(this.convolver);
    this.delayWet.connect(this.convolver);
    this.convolver.connect(this.reverbWet);
    this.reverbWet.connect(this.master);

    this.master.connect(this.output);
    this.update(DEFAULT_EFFECTS);
  }

  update(fx: EffectsParams): void {
    const t = this.ctx.currentTime;
    this.delay.delayTime.setTargetAtTime(fx.delayTime, t, 0.05);
    this.delayFb.gain.setTargetAtTime(Math.min(0.9, fx.delayFeedback), t, 0.05);
    this.delayWet.gain.setTargetAtTime(fx.delayMix, t, 0.05);
    this.reverbWet.gain.setTargetAtTime(fx.reverbMix, t, 0.05);
    // regenerate IR only when size changes meaningfully
    if (Math.abs(fx.reverbSize - this.currentSize) > 0.04) {
      this.currentSize = fx.reverbSize;
      this.convolver.buffer = this.generateImpulse(0.6 + fx.reverbSize * 3.4);
    }
  }

  setMasterVolume(v: number): void {
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
  }

  /** Exponentially decaying noise burst with gentle lowpass color. */
  private generateImpulse(seconds: number): AudioBuffer {
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * seconds);
    const buf = this.ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const env = Math.pow(1 - i / len, 2.2);
        const n = (Math.random() * 2 - 1) * env;
        lp += (n - lp) * 0.35; // one-pole lowpass for warmth
        data[i] = lp;
      }
    }
    return buf;
  }
}
