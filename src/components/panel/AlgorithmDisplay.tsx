/** Graphical operator-stack diagram for the current algorithm (SVG). */

import { ALGORITHMS, algorithmLayout } from '../../engine/algorithms';

interface Props {
  algorithm: number; // 1-32
  opEnabled: boolean[];
  selectedOp: number;
  onSelectOp: (op: number) => void;
}

const CELL = 34;
const BOX = 24;

export function AlgorithmDisplay({ algorithm, opEnabled, selectedOp, onSelectOp }: Props) {
  const alg = ALGORITHMS[algorithm - 1];
  const layout = algorithmLayout(algorithm);
  const maxCol = Math.max(...layout.map(p => p.col));
  const maxRow = Math.max(...layout.map(p => p.row));
  const w = (maxCol + 1) * CELL + 12;
  const h = (maxRow + 1) * CELL + 16;

  const cx = (op: number) => layout[op].col * CELL + CELL / 2 + 6;
  const cy = (op: number) => h - (layout[op].row * CELL + CELL / 2 + 8);

  return (
    <div className="dx-panel-inset p-2 flex flex-col items-center">
      <svg width={w} height={h} className="max-w-full">
        {/* connections */}
        {alg.mods.map((ms, target) =>
          ms.map(src => (
            <line
              key={`${src}-${target}`}
              x1={cx(src)} y1={cy(src) + BOX / 2}
              x2={cx(target)} y2={cy(target) - BOX / 2}
              stroke="#5a8fc7" strokeWidth={1.5}
            />
          )),
        )}
        {/* feedback loop */}
        {(() => {
          const { fbOp, fbSrc } = alg;
          const x = cx(fbOp) + BOX / 2;
          const y1 = cy(fbSrc);
          const y0 = cy(fbOp);
          return (
            <path
              d={`M ${x} ${y1} h 8 V ${y0 - BOX / 2 - 4} H ${cx(fbOp)} V ${y0 - BOX / 2}`}
              fill="none" stroke="#ff2a1a" strokeWidth={1.2}
            />
          );
        })()}
        {/* carrier bus */}
        {alg.carriers.map(c => (
          <line key={`bus${c}`} x1={cx(c)} y1={cy(c) + BOX / 2} x2={cx(c)} y2={h - 2} stroke="#888" strokeWidth={1} />
        ))}
        <line x1={6} y1={h - 2} x2={w - 6} y2={h - 2} stroke="#888" strokeWidth={1.5} />
        {/* op boxes */}
        {layout.map((_, op) => {
          const isCarrier = alg.carriers.includes(op);
          const on = opEnabled[op];
          return (
            <g key={op} onClick={() => onSelectOp(op)} style={{ cursor: 'pointer' }}>
              <rect
                x={cx(op) - BOX / 2} y={cy(op) - BOX / 2} width={BOX} height={BOX} rx={3}
                fill={on ? (isCarrier ? '#3d6ea5' : '#2a2a2e') : '#151517'}
                stroke={selectedOp === op ? '#ff2a1a' : '#666'}
                strokeWidth={selectedOp === op ? 2 : 1}
                opacity={on ? 1 : 0.45}
              />
              <text
                x={cx(op)} y={cy(op) + 4} textAnchor="middle"
                fill={on ? '#e8e8e8' : '#555'} fontSize={12} fontFamily="monospace" fontWeight={700}
              >
                {op + 1}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="text-[9px] text-neutral-500 font-panel uppercase tracking-widest mt-1">
        Algorithm {algorithm} — blue = carrier, red loop = feedback
      </div>
    </div>
  );
}
