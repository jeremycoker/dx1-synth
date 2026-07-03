/** Pitch EG: 4 rates / 4 levels (50 = center pitch). */

import { DataSlider } from '../panel/DataSlider';
import { useSynthState, useSynthDispatch } from '../../state/PatchContext';

export function PitchEgEditor() {
  const { patch } = useSynthState();
  const dispatch = useSynthDispatch();

  return (
    <div className="dx-panel-inset p-3 flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-widest text-dx-blue-bright font-panel mb-1">Pitch EG</div>
      <div className="grid grid-cols-2 gap-x-3">
        <div>
          {([0, 1, 2, 3] as const).map(i => (
            <DataSlider key={i} label={`Rate ${i + 1}`} value={patch.pitchEgRates[i]} min={0} max={99}
              onChange={v => dispatch({ type: 'SET_PITCH_EG', which: 'pitchEgRates', index: i, value: v })} compact />
          ))}
        </div>
        <div>
          {([0, 1, 2, 3] as const).map(i => (
            <DataSlider key={i} label={`Level ${i + 1}`} value={patch.pitchEgLevels[i]} min={0} max={99}
              onChange={v => dispatch({ type: 'SET_PITCH_EG', which: 'pitchEgLevels', index: i, value: v })} compact />
          ))}
        </div>
      </div>
    </div>
  );
}
