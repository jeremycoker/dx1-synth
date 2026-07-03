/** DX voice parameter model. Shapes match the worklet message format exactly. */

export type EgRates = [number, number, number, number];
export type EgLevels = [number, number, number, number];

/** 0=-LIN 1=-EXP 2=+EXP 3=+LIN */
export type ScaleCurve = 0 | 1 | 2 | 3;

/** 0=TRI 1=SAW DN 2=SAW UP 3=SQUARE 4=SINE 5=S&H */
export type LfoWave = 0 | 1 | 2 | 3 | 4 | 5;

export interface OperatorParams {
  enabled: boolean;
  egRates: EgRates;      // R1-R4, 0-99
  egLevels: EgLevels;    // L1-L4, 0-99
  breakpoint: number;    // 0-99 (39 = C3)
  scaleLeftDepth: number;  // 0-99
  scaleRightDepth: number; // 0-99
  scaleLeftCurve: ScaleCurve;
  scaleRightCurve: ScaleCurve;
  rateScaling: number;   // 0-7
  amSens: number;        // 0-3
  velSens: number;       // 0-7
  outputLevel: number;   // 0-99
  freqMode: 0 | 1;       // 0=ratio 1=fixed
  freqCoarse: number;    // 0-31
  freqFine: number;      // 0-99
  detune: number;        // 0-14 (7 = center)
}

export interface Patch {
  name: string;          // up to 10 chars, like the hardware
  algorithm: number;     // 1-32
  feedback: number;      // 0-7
  oscKeySync: boolean;
  transpose: number;     // 0-48 (24 = C3)
  pitchEgRates: EgRates;
  pitchEgLevels: EgLevels; // 50 = center pitch
  lfoSpeed: number;      // 0-99
  lfoDelay: number;      // 0-99
  lfoPmd: number;        // 0-99
  lfoAmd: number;        // 0-99
  lfoSync: boolean;
  lfoWave: LfoWave;
  lfoPitchModSens: number; // 0-7
  ops: [OperatorParams, OperatorParams, OperatorParams, OperatorParams, OperatorParams, OperatorParams];
}

/** Performance/function parameters (not stored per-voice on the hardware) */
export interface FunctionParams {
  polyphony: number;       // max voices (DX1: 32 across dual channels)
  mono: boolean;
  pitchBendRange: number;  // semitones 0-12
  portamento: number;      // seconds 0-5 (hardware: time 0-99)
  masterVolume: number;    // 0-1
}

export interface EffectsParams {
  delayTime: number;     // seconds
  delayFeedback: number; // 0-0.9
  delayMix: number;      // 0-1
  reverbSize: number;    // 0-1
  reverbMix: number;     // 0-1
}
