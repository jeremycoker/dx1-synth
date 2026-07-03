/**
 * Yamaha DX1 Web Synthesizer Emulator.
 * Layout mirrors the 1983 hardware: displays on top, editing panel in the
 * middle, full keyboard with performance wheels at the bottom.
 */

import { useState } from 'react';
import { PatchProvider, useSynthState } from './state/PatchContext';
import { useSynth } from './hooks/useSynth';
import { useMidi } from './hooks/useMidi';
import { Keyboard } from './components/Keyboard';
import { Wheels } from './components/panel/Wheels';
import { LcdDisplay } from './components/panel/LcdDisplay';
import { LedDisplay } from './components/panel/LedDisplay';
import { AlgorithmDisplay } from './components/panel/AlgorithmDisplay';
import { OpStatusRow } from './components/panel/OpStatusRow';
import { PresetBrowser } from './components/PresetBrowser';
import { OperatorEditor } from './components/editor/OperatorEditor';
import { EnvelopeEditor } from './components/editor/EnvelopeEditor';
import { ScalingEditor } from './components/editor/ScalingEditor';
import { AlgorithmSelector } from './components/editor/AlgorithmSelector';
import { LfoEditor } from './components/editor/LfoEditor';
import { PitchEgEditor } from './components/editor/PitchEgEditor';
import { FunctionEditor } from './components/editor/FunctionEditor';
import { EffectsPanel } from './components/editor/EffectsPanel';
import { describeFrequency } from './engine/conversions';

function Synth() {
  const { patch } = useSynthState();
  const { noteOn, noteOff, ensureAudio, audioReady, audioError } = useSynth();
  const { devices } = useMidi(noteOn, noteOff);
  const [selectedOp, setSelectedOp] = useState(0);

  const selOp = patch.ops[selectedOp];

  return (
    <div className="min-h-screen flex flex-col items-center p-3 gap-2" onPointerDown={() => void ensureAudio()}>
      {audioError && (
        <div className="w-full max-w-[1400px] bg-red-950 border border-red-600 text-red-200 text-sm px-4 py-2 rounded font-panel">
          AUDIO ERROR: {audioError}
        </div>
      )}
      {!audioReady && !audioError && (
        <div className="w-full max-w-[1400px] bg-neutral-900 border border-dx-blue text-dx-blue-bright text-sm px-4 py-2 rounded font-panel">
          Click anywhere / press a key to power on the audio engine
        </div>
      )}

      <div className="dx-wood rounded-lg p-3 w-full max-w-[1400px] shadow-2xl">
        <div className="dx-panel-surface rounded p-4 flex flex-col gap-3">

          {/* ---- top strip: branding + LED/LCD displays ---- */}
          <div className="flex items-end gap-5 flex-wrap">
            <div className="font-panel">
              <div className="text-2xl font-bold tracking-[0.3em] text-neutral-200">YAMAHA</div>
              <div className="text-[10px] tracking-[0.35em] text-neutral-400">
                DIGITAL PROGRAMMABLE ALGORITHM SYNTHESIZER <span className="text-dx-blue-bright font-bold text-sm">DX1</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 pb-0.5">
              <div className={`dx-dot-led ${audioReady ? 'on' : ''}`} />
              <div className="text-[8px] uppercase tracking-widest text-neutral-500 font-panel">Power</div>
            </div>
            <div className="flex-1" />
            <LedDisplay value={patch.algorithm} label="Algorithm" />
            <LedDisplay value={patch.feedback} digits={1} label="Feedback" />
            <LedDisplay value={selectedOp + 1} digits={1} label="Operator" />
            <LcdDisplay
              line1={`VOICE ${patch.name}`}
              line2={`OP${selectedOp + 1} ${describeFrequency(selOp.freqMode, selOp.freqCoarse, selOp.freqFine)} LVL${String(selOp.outputLevel).padStart(3, ' ')}`}
              chars={26}
            />
            <div className="text-[9px] font-panel text-neutral-500 self-center">
              MIDI: {devices.length ? devices.join(', ') : 'none'}
            </div>
          </div>

          {/* ---- main editing panel ---- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[190px_1fr_1fr_1fr] gap-2">
            {/* left: voice memory */}
            <PresetBrowser />

            {/* column: algorithm + diagram + effects */}
            <div className="flex flex-col gap-2">
              <AlgorithmDisplay
                algorithm={patch.algorithm}
                opEnabled={patch.ops.map(o => o.enabled)}
                selectedOp={selectedOp}
                onSelectOp={setSelectedOp}
              />
              <AlgorithmSelector />
              <EffectsPanel />
            </div>

            {/* column: selected operator */}
            <div className="flex flex-col gap-2">
              <div className="dx-panel-inset px-3 py-2">
                <OpStatusRow selectedOp={selectedOp} onSelectOp={setSelectedOp} />
              </div>
              <OperatorEditor op={selectedOp} />
              <ScalingEditor op={selectedOp} />
            </div>

            {/* column: EG + LFO + pitch EG + function */}
            <div className="flex flex-col gap-2">
              <EnvelopeEditor op={selectedOp} />
              <LfoEditor />
              <PitchEgEditor />
              <FunctionEditor />
            </div>
          </div>

          {/* ---- keyboard + wheels ---- */}
          <div className="flex items-end gap-2 pt-3">
            <Wheels />
            <div className="flex-1">
              <Keyboard noteOn={noteOn} noteOff={noteOff} />
            </div>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-neutral-600 font-panel pb-2">
        6-operator phase-modulation FM · 32 algorithms · {patch.name} — edits are live while notes play
      </div>
    </div>
  );
}

export default function App() {
  return (
    <PatchProvider>
      <Synth />
    </PatchProvider>
  );
}
