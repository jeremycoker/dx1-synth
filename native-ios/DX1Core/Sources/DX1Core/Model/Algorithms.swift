/// The 32 DX algorithm routing tables. Verbatim port of the web app's
/// `src/engine/algorithms.ts` / worklet ALGORITHMS table.
/// Ops are 0-indexed (0 = OP1). `mods[i]` = ops that phase-modulate op i.
/// Rendering order 5..0 is valid: modulators always have a higher index than
/// the op they modulate; feedback uses previous samples.
/// `fbOp` receives feedback taken from `fbSrc`'s output (self except algs 4 & 6).

public struct Algorithm: Sendable {
    public let mods: [[Int]]
    public let carriers: [Int]
    public let fbOp: Int
    public let fbSrc: Int
}

public let ALGORITHMS: [Algorithm] = [
    Algorithm(mods: [[1], [], [3], [4], [5], []], carriers: [0, 2], fbOp: 5, fbSrc: 5),          // 1
    Algorithm(mods: [[1], [], [3], [4], [5], []], carriers: [0, 2], fbOp: 1, fbSrc: 1),          // 2
    Algorithm(mods: [[1], [2], [], [4], [5], []], carriers: [0, 3], fbOp: 5, fbSrc: 5),          // 3
    Algorithm(mods: [[1], [2], [], [4], [5], []], carriers: [0, 3], fbOp: 5, fbSrc: 3),          // 4
    Algorithm(mods: [[1], [], [3], [], [5], []], carriers: [0, 2, 4], fbOp: 5, fbSrc: 5),        // 5
    Algorithm(mods: [[1], [], [3], [], [5], []], carriers: [0, 2, 4], fbOp: 5, fbSrc: 4),        // 6
    Algorithm(mods: [[1], [], [3, 4], [], [5], []], carriers: [0, 2], fbOp: 5, fbSrc: 5),        // 7
    Algorithm(mods: [[1], [], [3, 4], [], [5], []], carriers: [0, 2], fbOp: 3, fbSrc: 3),        // 8
    Algorithm(mods: [[1], [], [3, 4], [], [5], []], carriers: [0, 2], fbOp: 1, fbSrc: 1),        // 9
    Algorithm(mods: [[1], [2], [], [4, 5], [], []], carriers: [0, 3], fbOp: 2, fbSrc: 2),        // 10
    Algorithm(mods: [[1], [2], [], [4, 5], [], []], carriers: [0, 3], fbOp: 5, fbSrc: 5),        // 11
    Algorithm(mods: [[1], [], [3, 4, 5], [], [], []], carriers: [0, 2], fbOp: 1, fbSrc: 1),      // 12
    Algorithm(mods: [[1], [], [3, 4, 5], [], [], []], carriers: [0, 2], fbOp: 5, fbSrc: 5),      // 13
    Algorithm(mods: [[1], [], [3], [4, 5], [], []], carriers: [0, 2], fbOp: 5, fbSrc: 5),        // 14
    Algorithm(mods: [[1], [], [3], [4, 5], [], []], carriers: [0, 2], fbOp: 1, fbSrc: 1),        // 15
    Algorithm(mods: [[1, 2, 4], [], [3], [], [5], []], carriers: [0], fbOp: 5, fbSrc: 5),        // 16
    Algorithm(mods: [[1, 2, 4], [], [3], [], [5], []], carriers: [0], fbOp: 1, fbSrc: 1),        // 17
    Algorithm(mods: [[1, 2, 3], [], [], [4], [5], []], carriers: [0], fbOp: 2, fbSrc: 2),        // 18
    Algorithm(mods: [[1], [2], [], [5], [5], []], carriers: [0, 3, 4], fbOp: 5, fbSrc: 5),       // 19
    Algorithm(mods: [[2], [2], [], [4, 5], [], []], carriers: [0, 1, 3], fbOp: 2, fbSrc: 2),     // 20
    Algorithm(mods: [[2], [2], [], [5], [5], []], carriers: [0, 1, 3, 4], fbOp: 2, fbSrc: 2),    // 21
    Algorithm(mods: [[1], [], [5], [5], [5], []], carriers: [0, 2, 3, 4], fbOp: 5, fbSrc: 5),    // 22
    Algorithm(mods: [[], [2], [], [5], [5], []], carriers: [0, 1, 3, 4], fbOp: 5, fbSrc: 5),     // 23
    Algorithm(mods: [[], [], [5], [5], [5], []], carriers: [0, 1, 2, 3, 4], fbOp: 5, fbSrc: 5),  // 24
    Algorithm(mods: [[], [], [], [5], [5], []], carriers: [0, 1, 2, 3, 4], fbOp: 5, fbSrc: 5),   // 25
    Algorithm(mods: [[], [2], [], [4, 5], [], []], carriers: [0, 1, 3], fbOp: 5, fbSrc: 5),      // 26
    Algorithm(mods: [[], [2], [], [4, 5], [], []], carriers: [0, 1, 3], fbOp: 2, fbSrc: 2),      // 27
    Algorithm(mods: [[1], [], [3], [4], [], []], carriers: [0, 2, 5], fbOp: 4, fbSrc: 4),        // 28
    Algorithm(mods: [[], [], [3], [], [5], []], carriers: [0, 1, 2, 4], fbOp: 5, fbSrc: 5),      // 29
    Algorithm(mods: [[], [], [3], [4], [], []], carriers: [0, 1, 2, 5], fbOp: 4, fbSrc: 4),      // 30
    Algorithm(mods: [[], [], [], [], [5], []], carriers: [0, 1, 2, 3, 4], fbOp: 5, fbSrc: 5),    // 31
    Algorithm(mods: [[], [], [], [], [], []], carriers: [0, 1, 2, 3, 4, 5], fbOp: 5, fbSrc: 5),  // 32
]

public struct AlgorithmNodePosition: Equatable, Sendable {
    public let col: Int
    public let row: Int
}

/// Compute stacked layout columns for drawing an algorithm diagram.
/// Returns for each op: (col, row) where row 0 = carriers (bottom).
/// Port of `algorithmLayout` in the web app's algorithms.ts.
public func algorithmLayout(_ algIndex: Int) -> [AlgorithmNodePosition] {
    let alg = ALGORITHMS[algIndex - 1]
    var pos = [AlgorithmNodePosition?](repeating: nil, count: 6)

    // row = distance up the modulation chain from a carrier
    func rowOf(_ op: Int) -> Int {
        for i in 0..<6 {
            if alg.mods[i].contains(op) { return rowOf(i) + 1 }
        }
        return 0
    }
    let rows = (0..<6).map(rowOf)

    // assign columns: carriers left-to-right, modulators above the op they modulate
    var nextCol = 0
    func assign(_ op: Int, _ col: Int) {
        pos[op] = AlgorithmNodePosition(col: col, row: rows[op])
        let children = alg.mods[op]
        for (i, m) in children.enumerated() {
            if pos[m] == nil { assign(m, col + i) }
        }
    }
    for c in alg.carriers {
        assign(c, nextCol)
        // advance past widest branch
        let maxCol = pos.compactMap { $0?.col }.max() ?? 0
        nextCol = max(nextCol + 1, maxCol + 1)
    }
    return pos.map { $0! }
}
