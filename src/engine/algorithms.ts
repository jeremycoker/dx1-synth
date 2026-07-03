/**
 * The 32 DX algorithm routing tables (mirror of the worklet's table),
 * used by the UI to draw the algorithm diagram and show carrier/modulator roles.
 * Ops are 0-indexed (0 = OP1). mods[i] = ops that phase-modulate op i.
 */

export interface Algorithm {
  mods: number[][];
  carriers: number[];
  fbOp: number;
  fbSrc: number;
}

export const ALGORITHMS: Algorithm[] = [
  { mods: [[1], [], [3], [4], [5], []], carriers: [0, 2], fbOp: 5, fbSrc: 5 },
  { mods: [[1], [], [3], [4], [5], []], carriers: [0, 2], fbOp: 1, fbSrc: 1 },
  { mods: [[1], [2], [], [4], [5], []], carriers: [0, 3], fbOp: 5, fbSrc: 5 },
  { mods: [[1], [2], [], [4], [5], []], carriers: [0, 3], fbOp: 5, fbSrc: 3 },
  { mods: [[1], [], [3], [], [5], []], carriers: [0, 2, 4], fbOp: 5, fbSrc: 5 },
  { mods: [[1], [], [3], [], [5], []], carriers: [0, 2, 4], fbOp: 5, fbSrc: 4 },
  { mods: [[1], [], [3, 4], [], [5], []], carriers: [0, 2], fbOp: 5, fbSrc: 5 },
  { mods: [[1], [], [3, 4], [], [5], []], carriers: [0, 2], fbOp: 3, fbSrc: 3 },
  { mods: [[1], [], [3, 4], [], [5], []], carriers: [0, 2], fbOp: 1, fbSrc: 1 },
  { mods: [[1], [2], [], [4, 5], [], []], carriers: [0, 3], fbOp: 2, fbSrc: 2 },
  { mods: [[1], [2], [], [4, 5], [], []], carriers: [0, 3], fbOp: 5, fbSrc: 5 },
  { mods: [[1], [], [3, 4, 5], [], [], []], carriers: [0, 2], fbOp: 1, fbSrc: 1 },
  { mods: [[1], [], [3, 4, 5], [], [], []], carriers: [0, 2], fbOp: 5, fbSrc: 5 },
  { mods: [[1], [], [3], [4, 5], [], []], carriers: [0, 2], fbOp: 5, fbSrc: 5 },
  { mods: [[1], [], [3], [4, 5], [], []], carriers: [0, 2], fbOp: 1, fbSrc: 1 },
  { mods: [[1, 2, 4], [], [3], [], [5], []], carriers: [0], fbOp: 5, fbSrc: 5 },
  { mods: [[1, 2, 4], [], [3], [], [5], []], carriers: [0], fbOp: 1, fbSrc: 1 },
  { mods: [[1, 2, 3], [], [], [4], [5], []], carriers: [0], fbOp: 2, fbSrc: 2 },
  { mods: [[1], [2], [], [5], [5], []], carriers: [0, 3, 4], fbOp: 5, fbSrc: 5 },
  { mods: [[2], [2], [], [4, 5], [], []], carriers: [0, 1, 3], fbOp: 2, fbSrc: 2 },
  { mods: [[2], [2], [], [5], [5], []], carriers: [0, 1, 3, 4], fbOp: 2, fbSrc: 2 },
  { mods: [[1], [], [5], [5], [5], []], carriers: [0, 2, 3, 4], fbOp: 5, fbSrc: 5 },
  { mods: [[], [2], [], [5], [5], []], carriers: [0, 1, 3, 4], fbOp: 5, fbSrc: 5 },
  { mods: [[], [], [5], [5], [5], []], carriers: [0, 1, 2, 3, 4], fbOp: 5, fbSrc: 5 },
  { mods: [[], [], [], [5], [5], []], carriers: [0, 1, 2, 3, 4], fbOp: 5, fbSrc: 5 },
  { mods: [[], [2], [], [4, 5], [], []], carriers: [0, 1, 3], fbOp: 5, fbSrc: 5 },
  { mods: [[], [2], [], [4, 5], [], []], carriers: [0, 1, 3], fbOp: 2, fbSrc: 2 },
  { mods: [[1], [], [3], [4], [], []], carriers: [0, 2, 5], fbOp: 4, fbSrc: 4 },
  { mods: [[], [], [3], [], [5], []], carriers: [0, 1, 2, 4], fbOp: 5, fbSrc: 5 },
  { mods: [[], [], [3], [4], [], []], carriers: [0, 1, 2, 5], fbOp: 4, fbSrc: 4 },
  { mods: [[], [], [], [], [5], []], carriers: [0, 1, 2, 3, 4], fbOp: 5, fbSrc: 5 },
  { mods: [[], [], [], [], [], []], carriers: [0, 1, 2, 3, 4, 5], fbOp: 5, fbSrc: 5 },
];

/** Compute stacked layout columns for drawing an algorithm diagram.
 *  Returns for each op: { col, row } where row 0 = carriers (bottom). */
export function algorithmLayout(algIndex: number): { col: number; row: number }[] {
  const alg = ALGORITHMS[algIndex - 1];
  const pos: { col: number; row: number }[] = new Array(6);
  // row = distance up the modulation chain from a carrier
  const rowOf = (op: number): number => {
    for (let i = 0; i < 6; i++) {
      if (alg.mods[i].includes(op)) return rowOf(i) + 1;
    }
    return 0;
  };
  const rows = [0, 1, 2, 3, 4, 5].map(rowOf);
  // assign columns: carriers left-to-right, modulators above the op they modulate
  let nextCol = 0;
  const assign = (op: number, col: number) => {
    pos[op] = { col, row: rows[op] };
    const children = alg.mods[op];
    children.forEach((m, i) => {
      if (!pos[m]) assign(m, col + i);
    });
  };
  for (const c of alg.carriers) {
    assign(c, nextCol);
    // advance past widest branch
    nextCol = Math.max(nextCol + 1, Math.max(...pos.filter(Boolean).map(p => p.col)) + 1);
  }
  return pos;
}
