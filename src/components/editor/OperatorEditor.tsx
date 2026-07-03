/** Frequency (mode/coarse/fine/detune), output level, velocity, AMS, rate scaling for one op. */

import { DataSlider } from '../panel/DataSlider';
import { MembraneButton } from '../panel/MembraneButton';
import { useSynthState, useSynthDispatch } from '../../state/PatchContext';
import { describeFrequency } from '../../engine/conversions';

export function OperatorEditor({ op }: { op: number }) {
  const { patch } = useSynthState();
  const dispatch = useSynthDispatch();
  const o = patch.ops[op];
  const set = (key: keyof typeof o, value: number | boolean) =>
    dispatch({ type: 'SET_OP_PARAM', op, key, value });

  return (
    <div className="dx-panel-inset p-3 flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] uppercase tracking-widest text-dx-blue-bright font-panel">
          OP{op + 1} — Oscillator / Output
        </div>
        <div className="dx-lcd px-2 py-0.5 text-[11px]">
          {describeFrequency(o.freqMode, o.freqCoarse, o.freqFine)}
        </div>
      </div>
      <div className="flex gap-1.5 mb-1">
        <MembraneButton active={o.freqMode === 0} onClick={() => set('freqMode', 0)}>Ratio</MembraneButton>
        <MembraneButton active={o.freqMode === 1} onClick={() => set('freqMode', 1)}>Fixed</MembraneButton>
      </div>
      <DataSlider label="Coarse" value={o.freqCoarse} min={0} max={31} onChange={v => set('freqCoarse', v)} />
      <DataSlider label="Fine" value={o.freqFine} min={0} max={99} onChange={v => set('freqFine', v)} />
      <DataSlider label="Detune" value={o.detune} min={0} max={14} onChange={v => set('detune', v)}
        display={v => String(v - 7)} />
      <DataSlider label="Out Level" value={o.outputLevel} min={0} max={99} onChange={v => set('outputLevel', v)} />
      <DataSlider label="Velocity" value={o.velSens} min={0} max={7} onChange={v => set('velSens', v)} />
      <DataSlider label="AM Sens" value={o.amSens} min={0} max={3} onChange={v => set('amSens', v)} />
      <DataSlider label="Rate Scal" value={o.rateScaling} min={0} max={7} onChange={v => set('rateScaling', v)} />
    </div>
  );
}
