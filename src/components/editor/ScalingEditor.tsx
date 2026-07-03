/** Keyboard level scaling: breakpoint, left/right depth, left/right curve. */

import { DataSlider } from '../panel/DataSlider';
import { MembraneButton } from '../panel/MembraneButton';
import { useSynthState, useSynthDispatch } from '../../state/PatchContext';
import { breakpointName, CURVE_NAMES } from '../../engine/conversions';
import type { ScaleCurve } from '../../engine/types';

export function ScalingEditor({ op }: { op: number }) {
  const { patch } = useSynthState();
  const dispatch = useSynthDispatch();
  const o = patch.ops[op];
  const set = (key: keyof typeof o, value: number) =>
    dispatch({ type: 'SET_OP_PARAM', op, key, value });

  const CurveRow = ({ side, cur, keyName }: { side: string; cur: ScaleCurve; keyName: 'scaleLeftCurve' | 'scaleRightCurve' }) => (
    <div className="flex items-center gap-1">
      <div className="w-20 shrink-0 text-[10px] uppercase tracking-wider text-neutral-400 font-panel">{side} curve</div>
      {CURVE_NAMES.map((name, i) => (
        <MembraneButton key={name} active={cur === i} onClick={() => set(keyName, i)} className="flex-1">
          {name}
        </MembraneButton>
      ))}
    </div>
  );

  return (
    <div className="dx-panel-inset p-3 flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-widest text-dx-blue-bright font-panel mb-1">
        OP{op + 1} — Keyboard Level Scaling
      </div>
      <DataSlider label="Breakpoint" value={o.breakpoint} min={0} max={99}
        onChange={v => set('breakpoint', v)} display={breakpointName} />
      <DataSlider label="L Depth" value={o.scaleLeftDepth} min={0} max={99} onChange={v => set('scaleLeftDepth', v)} />
      <DataSlider label="R Depth" value={o.scaleRightDepth} min={0} max={99} onChange={v => set('scaleRightDepth', v)} />
      <CurveRow side="L" cur={o.scaleLeftCurve} keyName="scaleLeftCurve" />
      <CurveRow side="R" cur={o.scaleRightCurve} keyName="scaleRightCurve" />
    </div>
  );
}
