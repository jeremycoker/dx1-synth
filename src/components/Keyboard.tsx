/**
 * 61-key velocity-sensitive keyboard (C1..C6, MIDI 36-96).
 * - Click vertical position = velocity (lower on key = harder)
 * - Mouse drag glides across keys
 * - Computer keyboard: A-row = white keys, W-row = black keys (Z/X octave shift)
 */

import { useEffect, useRef, useState, useCallback } from 'react';

const LOW_NOTE = 36;
const NUM_KEYS = 61;
const BLACK = new Set([1, 3, 6, 8, 10]);

const QWERTY_MAP: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
  k: 12, o: 13, l: 14, p: 15, ';': 16,
};

interface Props {
  noteOn: (note: number, velocity: number) => void;
  noteOff: (note: number) => void;
}

export function Keyboard({ noteOn, noteOff }: Props) {
  const [held, setHeld] = useState<Set<number>>(new Set());
  const [octaveShift, setOctaveShift] = useState(0);
  const mouseNote = useRef<number | null>(null);
  const mouseDown = useRef(false);
  const heldRef = useRef(held);
  heldRef.current = held;

  const press = useCallback((note: number, velocity: number) => {
    setHeld(prev => {
      if (prev.has(note)) return prev;
      const next = new Set(prev);
      next.add(note);
      return next;
    });
    if (!heldRef.current.has(note)) noteOn(note, velocity);
  }, [noteOn]);

  const release = useCallback((note: number) => {
    setHeld(prev => {
      if (!prev.has(note)) return prev;
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
    noteOff(note);
  }, [noteOff]);

  // ---- computer keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === 'z') { setOctaveShift(o => Math.max(-2, o - 1)); return; }
      if (k === 'x') { setOctaveShift(o => Math.min(2, o + 1)); return; }
      const semis = QWERTY_MAP[k];
      if (semis !== undefined) press(60 + octaveShift * 12 + semis, 0.8);
    };
    const up = (e: KeyboardEvent) => {
      const semis = QWERTY_MAP[e.key.toLowerCase()];
      if (semis !== undefined) release(60 + octaveShift * 12 + semis);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [press, release, octaveShift]);

  // ---- pointer (mouse + touch) release anywhere
  useEffect(() => {
    const up = () => {
      mouseDown.current = false;
      if (mouseNote.current !== null) { release(mouseNote.current); mouseNote.current = null; }
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [release]);

  const velocityFromEvent = (e: React.PointerEvent, el: HTMLElement): number => {
    const rect = el.getBoundingClientRect();
    const y = (e.clientY - rect.top) / rect.height;
    return 0.25 + Math.max(0, Math.min(1, y)) * 0.75;
  };

  const onKeyDown = (note: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    // release capture so pointerenter fires on neighboring keys during glide
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    mouseDown.current = true;
    mouseNote.current = note;
    press(note, velocityFromEvent(e, e.currentTarget as HTMLElement));
  };

  const onKeyEnter = (note: number) => (e: React.PointerEvent) => {
    if (!mouseDown.current) return;
    if (mouseNote.current !== null && mouseNote.current !== note) release(mouseNote.current);
    mouseNote.current = note;
    press(note, velocityFromEvent(e, e.currentTarget as HTMLElement));
  };

  // Build key layout
  const whites: number[] = [];
  for (let i = 0; i < NUM_KEYS; i++) {
    const note = LOW_NOTE + i;
    if (!BLACK.has(note % 12)) whites.push(note);
  }
  const whiteW = 100 / whites.length;

  return (
    <div>
      <div className="text-right text-[10px] text-neutral-400 font-panel pb-0.5 pr-1">
        QWERTY: A-row plays, Z/X octave ({octaveShift >= 0 ? '+' : ''}{octaveShift})
      </div>
      <div className="overflow-x-auto dx-scroll">
      <div className="dx-keybed relative select-none w-full min-w-[860px]" style={{ height: '170px', touchAction: 'none' }}>
        {/* white keys */}
        <div className="absolute inset-0 flex">
          {whites.map(note => (
            <div
              key={note}
              onPointerDown={onKeyDown(note)}
              onPointerEnter={onKeyEnter(note)}
              className={`dx-key-white relative flex-1 ${held.has(note) ? 'dx-key-white-down' : ''}`}
            />
          ))}
        </div>
        {/* black keys */}
        {Array.from({ length: NUM_KEYS }, (_, i) => LOW_NOTE + i)
          .filter(n => BLACK.has(n % 12))
          .map(note => {
            const whitesBefore = whites.filter(w => w < note).length;
            const left = whitesBefore * whiteW - whiteW * 0.3;
            return (
              <div
                key={note}
                onPointerDown={onKeyDown(note)}
                onPointerEnter={onKeyEnter(note)}
                className={`dx-key-black absolute top-0 ${held.has(note) ? 'dx-key-black-down' : ''}`}
                style={{ left: `${left}%`, width: `${whiteW * 0.62}%`, height: '62%' }}
              />
            );
          })}
      </div>
      </div>
    </div>
  );
}
