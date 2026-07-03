/** Red 7-seg style LED readout (e.g. algorithm number, data value). */

interface Props {
  value: string | number;
  digits?: number;
  label?: string;
  className?: string;
}

export function LedDisplay({ value, digits = 2, label, className = '' }: Props) {
  const text = String(value).padStart(digits, ' ');
  return (
    <div className={`flex flex-col items-center gap-0.5 ${className}`}>
      <div className="dx-led relative px-2 py-0.5 text-xl whitespace-pre">
        {/* unlit segment ghost */}
        <span className="dx-led-dim absolute inset-0 px-2 py-0.5" aria-hidden>{'8'.repeat(text.length)}</span>
        <span className="relative">{text}</span>
      </div>
      {label && <div className="text-[9px] tracking-widest text-neutral-400 font-panel uppercase">{label}</div>}
    </div>
  );
}
