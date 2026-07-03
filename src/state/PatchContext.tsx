import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { Patch, OperatorParams, FunctionParams, EffectsParams } from '../engine/types';
import { FACTORY_PRESETS } from '../presets/factoryPresets';
import { DEFAULT_FUNCTION } from '../presets/initVoice';
import { DEFAULT_EFFECTS } from '../engine/effectsChain';

export interface SynthState {
  patch: Patch;
  fn: FunctionParams;
  fx: EffectsParams;
  presetIndex: number; // -1 = edited/custom
}

export type SynthAction =
  | { type: 'LOAD_PATCH'; patch: Patch; presetIndex?: number }
  | { type: 'SET_PATCH_PARAM'; key: keyof Patch; value: Patch[keyof Patch] }
  | { type: 'SET_OP_PARAM'; op: number; key: keyof OperatorParams; value: OperatorParams[keyof OperatorParams] }
  | { type: 'SET_OP_EG'; op: number; which: 'egRates' | 'egLevels'; index: number; value: number }
  | { type: 'SET_PITCH_EG'; which: 'pitchEgRates' | 'pitchEgLevels'; index: number; value: number }
  | { type: 'SET_FUNCTION'; key: keyof FunctionParams; value: FunctionParams[keyof FunctionParams] }
  | { type: 'SET_EFFECTS'; key: keyof EffectsParams; value: number };

function reducer(state: SynthState, action: SynthAction): SynthState {
  switch (action.type) {
    case 'LOAD_PATCH':
      return { ...state, patch: action.patch, presetIndex: action.presetIndex ?? -1 };
    case 'SET_PATCH_PARAM':
      return { ...state, presetIndex: -1, patch: { ...state.patch, [action.key]: action.value } };
    case 'SET_OP_PARAM': {
      const ops = state.patch.ops.map((op, i) =>
        i === action.op ? { ...op, [action.key]: action.value } : op) as Patch['ops'];
      return { ...state, presetIndex: -1, patch: { ...state.patch, ops } };
    }
    case 'SET_OP_EG': {
      const ops = state.patch.ops.map((op, i) => {
        if (i !== action.op) return op;
        const arr = [...op[action.which]] as [number, number, number, number];
        arr[action.index] = action.value;
        return { ...op, [action.which]: arr };
      }) as Patch['ops'];
      return { ...state, presetIndex: -1, patch: { ...state.patch, ops } };
    }
    case 'SET_PITCH_EG': {
      const arr = [...state.patch[action.which]] as [number, number, number, number];
      arr[action.index] = action.value;
      return { ...state, presetIndex: -1, patch: { ...state.patch, [action.which]: arr } };
    }
    case 'SET_FUNCTION':
      return { ...state, fn: { ...state.fn, [action.key]: action.value } };
    case 'SET_EFFECTS':
      return { ...state, fx: { ...state.fx, [action.key]: action.value } };
    default:
      return state;
  }
}

const initialState: SynthState = {
  patch: FACTORY_PRESETS[0],
  fn: DEFAULT_FUNCTION,
  fx: DEFAULT_EFFECTS,
  presetIndex: 0,
};

const StateCtx = createContext<SynthState>(initialState);
const DispatchCtx = createContext<Dispatch<SynthAction>>(() => {});

export function PatchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export const useSynthState = () => useContext(StateCtx);
export const useSynthDispatch = () => useContext(DispatchCtx);
