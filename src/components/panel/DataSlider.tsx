/** Data-entry slider with -1/+1 nudge buttons, DX-style. */

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  display?: (v: number) => string;
  compact?: boolean;
}

export function DataSlider({ label, value, min, max, onChange, display, compact }: Props) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className={`flex items-center gap-1.5 ${compact ? '' : 'py-0.5'}`}>
      <div className="w-20 shrink-0 text-[10px] uppercase tracking-wider text-neutral-400 font-panel">{label}</div>
      <button className="dx-btn w-5 h-5 text-[10px] leading-none shrink-0" onClick={() => onChange(clamp(value - 1))}>-</button>
      <input
        type="range"
        className="dx-slider flex-1 min-w-0"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      <button className="dx-btn w-5 h-5 text-[10px] leading-none shrink-0" onClick={() => onChange(clamp(value + 1))}>+</button>
      <div className="dx-led px-1.5 py-0.5 text-[11px] w-14 text-right shrink-0">{display ? display(value) : value}</div>
    </div>
  );
}
