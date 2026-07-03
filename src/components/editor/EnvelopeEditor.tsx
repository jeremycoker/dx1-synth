/** 4-rate / 4-level EG editor with a live SVG curve preview. */

import { DataSlider } from '../panel/DataSlider';
import { useSynthState, useSynthDispatch } from '../../state/PatchContext';
import { rateToSeconds } from '../../engine/conversions';

function EgCurve({ rates, levels }: { rates: number[]; levels: number[] }) {
  // piecewise time-proportional sketch: key-on L0->L1->L2->L3(sustain), key-off ->L4
  const W = 200, H = 56;
  const segT = (r: number, from: number, to: number) =>
    Math.max(0.015, (rateToSeconds(r) * Math.abs(to - from)) / 99);
  const pts: [number, number][] = [];
  let lvl = levels[3];
  let t = 0;
  pts.push([0, lvl]);
  for (let s = 0; s < 3; s++) {
    t += segT(rates[s], lvl, levels[s]);
    lvl = levels[s];
    pts.push([t, lvl]);
  }
  const sustainT = t + 0.25; // visual hold
  pts.push([sustainT, lvl]);
  const endT = sustainT + segT(rates[3], lvl, levels[3]);
  pts.push([endT, levels[3]]);
  const total = Math.max(0.001, endT);
  const path = pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${(x / total) * (W - 4) + 2} ${H - 4 - (y / 99) * (H - 8)}`)
    .join(' ');
  return (
    <svg width={W} height={H} className="dx-panel-inset w-full">
      <path d={path} fill="none" stroke="#8aff9a" strokeWidth={1.6} />
    </svg>
  );
}

export function EnvelopeEditor({ op }: { op: number }) {
  const { patch } = useSynthState();
  const dispatch = useSynthDispatch();
  const o = patch.ops[op];

  const setEg = (which: 'egRates' | 'egLevels', index: number, value: number) =>
    dispatch({ type: 'SET_OP_EG', op, which, index, value });

  return (
    <div className="dx-panel-inset p-3 flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-widest text-dx-blue-bright font-panel mb-1">
        OP{op + 1} — Envelope Generator
      </div>
      <EgCurve rates={o.egRates} levels={o.egLevels} />
      <div className="grid grid-cols-2 gap-x-3">
        <div>
          {([0, 1, 2, 3] as const).map(i => (
            <DataSlider key={i} label={`Rate ${i + 1}`} value={o.egRates[i]} min={0} max={99}
              onChange={v => setEg('egRates', i, v)} compact />
          ))}
        </div>
        <div>
          {([0, 1, 2, 3] as const).map(i => (
            <DataSlider key={i} label={`Level ${i + 1}`} value={o.egLevels[i]} min={0} max={99}
              onChange={v => setEg('egLevels', i, v)} compact />
          ))}
        </div>
      </div>
    </div>
  );
}
