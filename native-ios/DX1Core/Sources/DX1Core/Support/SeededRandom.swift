/// mulberry32 PRNG — bit-exact match of the JS implementation in
/// tools/golden-master/render-golden.mjs, used to make S&H LFO renders
/// deterministic across both engines.
public struct SeededRandom {
    private var state: UInt32

    public init(seed: UInt32) {
        self.state = seed
    }

    /// Returns a Double in [0, 1), identical sequence to JS mulberry32.
    public mutating func next() -> Double {
        state = state &+ 0x6D2B79F5
        let a = state
        var t = (a ^ (a >> 15)) &* (1 | a)
        t = (t &+ ((t ^ (t >> 7)) &* (61 | t))) ^ t
        return Double(t ^ (t >> 14)) / 4294967296.0
    }
}
