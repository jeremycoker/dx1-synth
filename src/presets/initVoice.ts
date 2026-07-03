import type { OperatorParams, Patch, FunctionParams } from '../engine/types';

/** Build an operator from partial values (defaults = INIT VOICE operator). */
export function mkOp(p: Partial<OperatorParams> = {}): OperatorParams {
  return {
    enabled: true,
    egRates: [99, 99, 99, 99],
    egLevels: [99, 99, 99, 0],
    breakpoint: 39, // C3
    scaleLeftDepth: 0,
    scaleRightDepth: 0,
    scaleLeftCurve: 0,
    scaleRightCurve: 0,
    rateScaling: 0,
    amSens: 0,
    velSens: 0,
    outputLevel: 0,
    freqMode: 0,
    freqCoarse: 1,
    freqFine: 0,
    detune: 7,
    ...p,
  };
}

export function mkPatch(p: Partial<Patch> & { ops?: Patch['ops'] }): Patch {
  return {
    name: 'INIT VOICE',
    algorithm: 1,
    feedback: 0,
    oscKeySync: true,
    transpose: 24,
    pitchEgRates: [99, 99, 99, 99],
    pitchEgLevels: [50, 50, 50, 50],
    lfoSpeed: 35,
    lfoDelay: 0,
    lfoPmd: 0,
    lfoAmd: 0,
    lfoSync: true,
    lfoWave: 0,
    lfoPitchModSens: 3,
    ops: [
      mkOp({ outputLevel: 99 }),
      mkOp(), mkOp(), mkOp(), mkOp(), mkOp(),
    ],
    ...p,
  };
}

export const INIT_VOICE: Patch = mkPatch({});

export const DEFAULT_FUNCTION: FunctionParams = {
  polyphony: 16,
  mono: false,
  pitchBendRange: 2,
  portamento: 0,
  masterVolume: 0.8,
};
