/** Factory bank + user bank (localStorage) with save/export/import. */

import { useState, useRef } from 'react';
import { useSynthState, useSynthDispatch } from '../state/PatchContext';
import { FACTORY_PRESETS } from '../presets/factoryPresets';
import { loadUserBank, savePatchToBank, deletePatchFromBank, exportPatchJson, importPatchJson } from '../state/storage';
import type { Patch } from '../engine/types';

export function PresetBrowser() {
  const { patch, presetIndex } = useSynthState();
  const dispatch = useSynthDispatch();
  const [userBank, setUserBank] = useState<Patch[]>(loadUserBank);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = (p: Patch, idx: number) => dispatch({ type: 'LOAD_PATCH', patch: p, presetIndex: idx });

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const p = await importPatchJson(file);
      setUserBank(savePatchToBank(p));
      dispatch({ type: 'LOAD_PATCH', patch: p });
    } catch (e) {
      alert(`Import failed: ${e instanceof Error ? e.message : e}`);
    }
  };

  return (
    <div className="dx-panel-inset p-3 flex flex-col gap-2 h-full">
      <div className="text-[10px] uppercase tracking-widest text-dx-blue-bright font-panel">Voice Memory</div>

      <div className="text-[9px] uppercase tracking-widest text-neutral-500 font-panel">Internal (Factory)</div>
      <div className="dx-scroll overflow-y-auto max-h-40 flex flex-col gap-0.5 pr-1">
        {FACTORY_PRESETS.map((p, i) => (
          <button key={i}
            className={`dx-btn text-left px-2 py-1 text-[11px] font-panel ${presetIndex === i ? 'dx-btn-active' : ''}`}
            onClick={() => load(p, i)}>
            <span className="text-neutral-500 mr-1.5">{String(i + 1).padStart(2, '0')}</span>{p.name}
          </button>
        ))}
      </div>

      <div className="text-[9px] uppercase tracking-widest text-neutral-500 font-panel mt-1">Cartridge (User)</div>
      <div className="dx-scroll overflow-y-auto max-h-32 flex flex-col gap-0.5 pr-1">
        {userBank.length === 0 && <div className="text-[10px] text-neutral-600 font-panel px-1">empty — save a voice</div>}
        {userBank.map((p, i) => (
          <div key={i} className="flex gap-0.5">
            <button className="dx-btn text-left px-2 py-1 text-[11px] font-panel flex-1"
              onClick={() => load(p, -1)}>
              {p.name}
            </button>
            <button className="dx-btn px-1.5 text-[10px]" title="Delete"
              onClick={() => setUserBank(deletePatchFromBank(p.name))}>✕</button>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mt-auto pt-2">
        <button className="dx-btn dx-btn-blue px-2 py-1 text-[10px] font-panel flex-1"
          onClick={() => setUserBank(savePatchToBank(patch))}>
          Store
        </button>
        <button className="dx-btn px-2 py-1 text-[10px] font-panel flex-1"
          onClick={() => exportPatchJson(patch)}>
          Export
        </button>
        <button className="dx-btn px-2 py-1 text-[10px] font-panel flex-1"
          onClick={() => fileRef.current?.click()}>
          Import
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden"
          onChange={e => { void onImport(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
    </div>
  );
}
