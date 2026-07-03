/** DX parameter -> human-readable / DSP value conversions (UI display helpers). */

/** EG rate 0-99 -> approximate seconds to traverse full level range */
export function rateToSeconds(rate: number): number {
  return Math.pow(2, (64 - rate) / 6) * 0.028;
}

/** DX output level 0-99 -> dB relative to full scale (~0.75 dB per step) */
export function levelToDb(level: number): number {
  return (level - 99) * 0.75;
}

/** Operator frequency description for LED/LCD display */
export function describeFrequency(mode: 0 | 1, coarse: number, fine: number): string {
  if (mode === 1) {
    const hz = Math.pow(10, coarse % 4) * Math.pow(10, fine / 100);
    return hz >= 1000 ? `${(hz / 1000).toFixed(2)}kHz` : `${hz.toFixed(2)}Hz`;
  }
  const ratio = (coarse === 0 ? 0.5 : coarse) * (1 + fine / 100);
  return `x${ratio.toFixed(2)}`;
}

/** LFO speed 0-99 -> Hz */
export function lfoSpeedToHz(speed: number): number {
  if (speed <= 0) return 0.062;
  return 0.062 * Math.pow(2, speed / 11);
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** MIDI note -> name like C3 (Yamaha convention: middle C / MIDI 60 = C3) */
export function noteName(midi: number): string {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 2}`;
}

/** Scaling breakpoint 0-99 -> note name (39 = C3 = MIDI 60) */
export function breakpointName(bp: number): string {
  return noteName(bp + 21);
}

export const CURVE_NAMES = ['-LIN', '-EXP', '+EXP', '+LIN'];
export const LFO_WAVE_NAMES = ['TRIANGL', 'SAW DWN', 'SAW UP', 'SQUARE', 'SINE', 'S/HOLD'];
