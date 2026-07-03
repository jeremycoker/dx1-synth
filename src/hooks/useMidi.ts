/** Wires Web MIDI to the synth engine. */

import { useEffect, useState, useRef } from 'react';
import { initMidi } from '../midi/webMidi';
import { synthEngine } from '../engine/synthEngine';
import { useSynthState } from '../state/PatchContext';

export function useMidi(noteOn: (n: number, v: number) => void, noteOff: (n: number) => void) {
  const [devices, setDevices] = useState<string[]>([]);
  const { fn } = useSynthState();
  const bendRange = useRef(fn.pitchBendRange);
  bendRange.current = fn.pitchBendRange;

  useEffect(() => {
    let cancelled = false;
    initMidi({
      noteOn,
      noteOff,
      pitchBend: v => synthEngine.pitchBend(v * bendRange.current),
      modWheel: v => synthEngine.modWheel(v),
      sustain: on => synthEngine.sustain(on),
    })
      .then(names => { if (!cancelled) setDevices(names); })
      .catch(() => { /* MIDI unavailable — on-screen keyboard still works */ });
    return () => { cancelled = true; };
  }, [noteOn, noteOff]);

  return { devices };
}
