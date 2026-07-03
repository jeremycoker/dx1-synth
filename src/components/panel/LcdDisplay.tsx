/** 40-char green-on-dark LCD, 2 lines like the DX1's voice/function displays. */

interface Props {
  line1: string;
  line2?: string;
  chars?: number;
  className?: string;
}

export function LcdDisplay({ line1, line2 = '', chars = 24, className = '' }: Props) {
  const pad = (s: string) => (s.length > chars ? s.slice(0, chars) : s.padEnd(chars, ' '));
  return (
    <div className={`dx-lcd px-3 py-1.5 text-sm whitespace-pre leading-snug ${className}`}>
      <div>{pad(line1)}</div>
      {line2 !== undefined && <div>{pad(line2)}</div>}
    </div>
  );
}
