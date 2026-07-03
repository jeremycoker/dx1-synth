/** 6 operator buttons: LED = op enabled, click = select for editing, dbl-click/right side toggles on/off. */

import { MembraneButton } from './MembraneButton';
import { useSynthState, useSynthDispatch } from '../../state/PatchContext';

interface Props {
  selectedOp: number;
  onSelectOp: (op: number) => void;
}

export function OpStatusRow({ selectedOp, onSelectOp }: Props) {
  const { patch } = useSynthState();
  const dispatch = useSynthDispatch();

  return (
    <div className="flex items-center gap-2">
      <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-panel mr-1">Operator</div>
      {patch.ops.map((op, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <MembraneButton
            led
            active={op.enabled}
            blue={selectedOp === i}
            onClick={() => onSelectOp(i)}
            className="w-11"
            title={`Select OP${i + 1}`}
          >
            OP{i + 1}
          </MembraneButton>
          <button
            className="dx-btn px-1 text-[8px] font-panel"
            title={`Toggle OP${i + 1} on/off`}
            onClick={() => dispatch({ type: 'SET_OP_PARAM', op: i, key: 'enabled', value: !op.enabled })}
          >
            {op.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
      ))}
    </div>
  );
}
