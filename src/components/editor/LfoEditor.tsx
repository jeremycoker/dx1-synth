/** LFO: wave, speed, delay, PMD, AMD, key sync, pitch mod sensitivity. */

import { DataSlider } from '../panel/DataSlider';
import { MembraneButton } from '../panel/MembraneButton';
import { useSynthState, useSynthDispatch } from '../../state/PatchContext';
import { LFO_WAVE_NAMES, lfoSpeedToHz } from '../../engine/conversions';
import type { LfoWave } from '../../engine/types';

export function LfoEditor() {
  const { patch } = useSynthState();
  const dispatch = useSynthDispatch();
  const set = (key: 'lfoSpeed' | 'lfoDelay' | 'lfoPmd' | 'lfoAmd' | 'lfoPitchModSens', value: number) =>
    dispatch({ type: 'SET_PATCH_PARAM', key, value });

  return (
    <div className="dx-panel-inset p-3 flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-widest text-dx-blue-bright font-panel mb-1">LFO</div>
      <div className="grid grid-cols-3 gap-1 mb-1">
        {LFO_WAVE_NAMES.map((name, i) => (
          <MembraneButton key={name} active={patch.lfoWave === i}
            onClick={() => dispatch({ type: 'SET_PATCH_PARAM', key: 'lfoWave', value: i as LfoWave })}>
            {name}
          </MembraneButton>
        ))}
      </div>
      <DataSlider label="Speed" value={patch.lfoSpeed} min={0} max={99} onChange={v => set('lfoSpeed', v)}
        display={v => `${lfoSpeedToHz(v).toFixed(1)}Hz`} />
      <DataSlider label="Delay" value={patch.lfoDelay} min={0} max={99} onChange={v => set('lfoDelay', v)} />
      <DataSlider label="PMD" value={patch.lfoPmd} min={0} max={99} onChange={v => set('lfoPmd', v)} />
      <DataSlider label="AMD" value={patch.lfoAmd} min={0} max={99} onChange={v => set('lfoAmd', v)} />
      <DataSlider label="P Mod Sens" value={patch.lfoPitchModSens} min={0} max={7} onChange={v => set('lfoPitchModSens', v)} />
      <div className="flex items-center gap-2 mt-1">
        <div className="w-20 shrink-0 text-[10px] uppercase tracking-wider text-neutral-400 font-panel">Key Sync</div>
        <MembraneButton led active={patch.lfoSync}
          onClick={() => dispatch({ type: 'SET_PATCH_PARAM', key: 'lfoSync', value: !patch.lfoSync })}>
          Sync
        </MembraneButton>
      </div>
    </div>
  );
}
