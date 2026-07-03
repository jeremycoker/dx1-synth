/** Pitch bend (springs back to center) + mod wheel, like the DX1's left cheek block. */

import { useRef, useState } from 'react';
import { synthEngine } from '../../engine/synthEngine';
import { useSynthState } from '../../state/PatchContext';

function Wheel({ label, value, onChange, onRelease }: {
  label: string; value: number; onChange: (v: number) => void; onRelease?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = (clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const t = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    onChange(t);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={ref}
        className="dx-panel-inset relative w-8 h-28 cursor-ns-resize"
        style={{ touchAction: 'none' }}
        onPointerDown={e => {
          e.preventDefault();
          dragging.current = true;
          update(e.clientY);
          const move = (ev: PointerEvent) => dragging.current && update(ev.clientY);
          const up = () => {
            dragging.current = false;
            onRelease?.();
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
          };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', up);
          window.addEventListener('pointercancel', up);
        }}
      >
        <div
          className="absolute left-0.5 right-0.5 h-3 rounded-sm"
          style={{
            top: `${(1 - value) * 88}%`,
            transition: 'top 70ms linear',
            background: 'linear-gradient(180deg,#4b4b52,#202024 50%,#2c2c31)',
            border: '1px solid #000',
            boxShadow: '0 1px 3px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        />
      </div>
      <div className="text-[8px] uppercase tracking-widest text-neutral-400 font-panel">{label}</div>
    </div>
  );
}

export function Wheels() {
  const [bend, setBend] = useState(0.5);
  const [mod, setMod] = useState(0);
  const { fn } = useSynthState();

  return (
    <div className="flex gap-2 items-end px-2">
      <Wheel
        label="Pitch"
        value={bend}
        onChange={v => { setBend(v); synthEngine.pitchBend((v * 2 - 1) * fn.pitchBendRange); }}
        onRelease={() => { setBend(0.5); synthEngine.pitchBend(0); }}
      />
      <Wheel
        label="Mod"
        value={mod}
        onChange={v => { setMod(v); synthEngine.modWheel(v); }}
      />
    </div>
  );
}
