/** Function params: mono/poly, polyphony, bend range, portamento, transpose, voice name, master vol. */

import { DataSlider } from '../panel/DataSlider';
import { MembraneButton } from '../panel/MembraneButton';
import { useSynthState, useSynthDispatch } from '../../state/PatchContext';
import { noteName } from '../../engine/conversions';

export function FunctionEditor() {
  const { patch, fn } = useSynthState();
  const dispatch = useSynthDispatch();

  return (
    <div className="dx-panel-inset p-3 flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-widest text-dx-blue-bright font-panel mb-1">Function</div>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-20 shrink-0 text-[10px] uppercase tracking-wider text-neutral-400 font-panel">Voice Name</div>
        <input
          className="dx-lcd px-2 py-1 text-sm flex-1 min-w-0 outline-none"
          value={patch.name}
          maxLength={10}
          onChange={e => dispatch({ type: 'SET_PATCH_PARAM', key: 'name', value: e.target.value.toUpperCase() })}
        />
      </div>
      <div className="flex gap-1.5 mb-1">
        <MembraneButton active={!fn.mono} onClick={() => dispatch({ type: 'SET_FUNCTION', key: 'mono', value: false })}>Poly</MembraneButton>
        <MembraneButton active={fn.mono} onClick={() => dispatch({ type: 'SET_FUNCTION', key: 'mono', value: true })}>Mono</MembraneButton>
      </div>
      <DataSlider label="Poly Voices" value={fn.polyphony} min={1} max={32}
        onChange={v => dispatch({ type: 'SET_FUNCTION', key: 'polyphony', value: v })} />
      <DataSlider label="Bend Range" value={fn.pitchBendRange} min={0} max={12}
        onChange={v => dispatch({ type: 'SET_FUNCTION', key: 'pitchBendRange', value: v })} />
      <DataSlider label="Portamento" value={Math.round(fn.portamento * 20)} min={0} max={99}
        onChange={v => dispatch({ type: 'SET_FUNCTION', key: 'portamento', value: v / 20 })}
        display={v => `${(v / 20).toFixed(1)}s`} />
      <DataSlider label="Transpose" value={patch.transpose} min={0} max={48}
        onChange={v => dispatch({ type: 'SET_PATCH_PARAM', key: 'transpose', value: v })}
        display={v => noteName(v + 36)} />
      <DataSlider label="Master Vol" value={Math.round(fn.masterVolume * 99)} min={0} max={99}
        onChange={v => dispatch({ type: 'SET_FUNCTION', key: 'masterVolume', value: v / 99 })} />
    </div>
  );
}
