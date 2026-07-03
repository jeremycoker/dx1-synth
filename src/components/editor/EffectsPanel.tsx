/** Modern additions: delay + reverb sends and master polish. */

import { DataSlider } from '../panel/DataSlider';
import { useSynthState, useSynthDispatch } from '../../state/PatchContext';

export function EffectsPanel() {
  const { fx } = useSynthState();
  const dispatch = useSynthDispatch();
  const set = (key: keyof typeof fx, value: number) => dispatch({ type: 'SET_EFFECTS', key, value });

  return (
    <div className="dx-panel-inset p-3 flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-widest text-dx-blue-bright font-panel mb-1">Effects (Modern)</div>
      <DataSlider label="Dly Time" value={Math.round(fx.delayTime * 100)} min={2} max={150}
        onChange={v => set('delayTime', v / 100)} display={v => `${(v * 10).toFixed(0)}ms`} />
      <DataSlider label="Dly Fdbk" value={Math.round(fx.delayFeedback * 99)} min={0} max={89}
        onChange={v => set('delayFeedback', v / 99)} />
      <DataSlider label="Dly Mix" value={Math.round(fx.delayMix * 99)} min={0} max={99}
        onChange={v => set('delayMix', v / 99)} />
      <DataSlider label="Rev Size" value={Math.round(fx.reverbSize * 99)} min={0} max={99}
        onChange={v => set('reverbSize', v / 99)} />
      <DataSlider label="Rev Mix" value={Math.round(fx.reverbMix * 99)} min={0} max={99}
        onChange={v => set('reverbMix', v / 99)} />
    </div>
  );
}
