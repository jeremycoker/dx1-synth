/** Algorithm 1-32 selector + feedback 0-7 + osc key sync. */

import { DataSlider } from '../panel/DataSlider';
import { MembraneButton } from '../panel/MembraneButton';
import { useSynthState, useSynthDispatch } from '../../state/PatchContext';

export function AlgorithmSelector() {
  const { patch } = useSynthState();
  const dispatch = useSynthDispatch();

  return (
    <div className="dx-panel-inset p-3 flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-widest text-dx-blue-bright font-panel mb-1">Algorithm</div>
      <DataSlider label="Algorithm" value={patch.algorithm} min={1} max={32}
        onChange={v => dispatch({ type: 'SET_PATCH_PARAM', key: 'algorithm', value: v })} />
      <DataSlider label="Feedback" value={patch.feedback} min={0} max={7}
        onChange={v => dispatch({ type: 'SET_PATCH_PARAM', key: 'feedback', value: v })} />
      <div className="flex items-center gap-2 mt-1">
        <div className="w-20 shrink-0 text-[10px] uppercase tracking-wider text-neutral-400 font-panel">Osc Sync</div>
        <MembraneButton led active={patch.oscKeySync}
          onClick={() => dispatch({ type: 'SET_PATCH_PARAM', key: 'oscKeySync', value: !patch.oscKeySync })}>
          Key Sync
        </MembraneButton>
      </div>
    </div>
  );
}
