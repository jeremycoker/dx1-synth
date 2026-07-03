/** Wires PatchContext state to the audio engine; exposes note-play helpers. */

import { useEffect, useCallback, useState } from 'react';
import { synthEngine } from '../engine/synthEngine';
import { useSynthState } from '../state/PatchContext';

export function useSynth() {
  const { patch, fn, fx } = useSynthState();
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState('');

  useEffect(() => {
    synthEngine.onStatusChange = (status, error) => {
      setAudioReady(status === 'running');
      setAudioError(status === 'error' ? error : '');
    };
    return () => { synthEngine.onStatusChange = null; };
  }, []);

  // Push state changes to the engine (messages are queued until start)
  useEffect(() => { synthEngine.sendPatch(patch); }, [patch]);
  useEffect(() => { synthEngine.sendFunction(fn); }, [fn]);
  useEffect(() => { synthEngine.sendEffects(fx); }, [fx]);

  const ensureAudio = useCallback(async () => {
    try {
      await synthEngine.start();
    } catch {
      /* surfaced via onStatusChange */
    }
  }, []);

  const noteOn = useCallback((note: number, velocity: number) => {
    void ensureAudio();
    synthEngine.noteOn(note, Math.max(0.05, Math.min(1, velocity)));
  }, [ensureAudio]);

  const noteOff = useCallback((note: number) => {
    synthEngine.noteOff(note);
  }, []);

  return { audioReady, audioError, ensureAudio, noteOn, noteOff };
}
