/// 8-line feedback delay network reverb with Householder feedback matrix.
/// Replaces the web app's generated-impulse ConvolverNode. Tuned against the
/// web IR's character: decay seconds = 0.6 + size * 3.4 (same mapping as
/// effectsChain.ts), with a one-pole lowpass in the loop mirroring the IR's
/// lp coefficient (0.35) warmth. Documented fallback: swap for
/// AVAudioUnitReverb at the app layer if the ear check fails.

import Foundation

public final class FDNReverb {
    private static let LINE_COUNT = 8
    // mutually prime delay lengths (samples @48k reference, scaled by sr)
    private static let BASE_LENGTHS: [Double] = [1687, 1889, 2129, 2311, 2531, 2789, 3049, 3323]

    private var lines: [[Float]]
    private var lengths: [Int]
    private var writeIdx: [Int]
    private var lpState: [Float]
    private var lpInput: Float = 0
    private var decayGain: Float = 0
    private var outputGain: Float = 1
    private let sr: Double
    /// input color lowpass — mirrors the web IR generator's `lp += (n-lp)*0.35`
    /// (a stationary spectral tint applied to the noise BEFORE the envelope)
    private let inputColor: Float = 0.35
    /// mild loop damping only — the web IR has no progressive damping, so a
    /// strong loop lowpass would make the FDN decay much faster than the IR
    private let loopDamp: Float = 0.85

    public init(sampleRate: Double, size: Double) {
        self.sr = sampleRate
        let scale = sampleRate / 48000.0
        self.lengths = FDNReverb.BASE_LENGTHS.map { max(2, Int($0 * scale)) }
        self.lines = lengths.map { [Float](repeating: 0, count: $0) }
        self.writeIdx = [Int](repeating: 0, count: FDNReverb.LINE_COUNT)
        self.lpState = [Float](repeating: 0, count: FDNReverb.LINE_COUNT)
        setSize(size)
    }

    /// size 0-1 -> IR seconds 0.6..4.0 (same mapping as the web convolver IR).
    /// Tuned against the web app's normalized ConvolverNode response:
    ///   web EDC: T20 = 0.57 x irSeconds, T30 = 0.72 x irSeconds
    ///   exponential FDN with RT60 = 1.575 x irSeconds gives T20 -8% / T30 +9%.
    /// outputGain calibrated so impulse energy matches the normalized IR
    /// (E_web = 0.131 / 0.322 / 0.559 at size 0.1 / 0.5 / 1.0).
    public func setSize(_ size: Double) {
        let clamped = min(1, max(0, size))
        let irSeconds = 0.6 + clamped * 3.4
        // The web IR envelope (1-t/T)^2.2 is NOT exponential: its T20/T30 ratio
        // is ~0.795 vs 2/3 for an exponential tail. 1.72 centers the FDN's T20
        // (slightly short) and T30 (slightly long) errors inside +/-15%.
        let rt60 = irSeconds * 1.72
        // RT60-style per-line gain from the mean delay length
        let meanDelay = Double(lengths.reduce(0, +)) / Double(lengths.count) / sr
        decayGain = Float(pow(10.0, -3.0 * meanDelay / rt60))
        outputGain = Float(FDNReverb.calibratedGain(size: clamped))
    }

    /// Fitted in ReverbFidelityTests so FDN impulse energy tracks the web
    /// convolver's normalized energy across the size range.
    /// Quadratic through sqrt(E_web/E_fdn) at sizes 0.1/0.5/1.0
    /// (0.7432 / 0.8772 / 0.9590 measured with rt60 factor 1.72).
    static func calibratedGain(size: Double) -> Double {
        0.7001 + 0.4493 * size - 0.1904 * size * size
    }

    /// Process one input sample; returns (left, right).
    @inline(__always)
    public func process(_ input: Float) -> (Float, Float) {
        // gentle input color like the IR's lowpassed noise
        lpInput += (input - lpInput) * inputColor

        var outs = [Float](repeating: 0, count: FDNReverb.LINE_COUNT)
        var sum: Float = 0
        for i in 0..<FDNReverb.LINE_COUNT {
            let v = lines[i][writeIdx[i]]
            outs[i] = v
            sum += v
        }
        // Householder: y_i = x_i - (2/N) * sum(x)
        let h = sum * (2.0 / Float(FDNReverb.LINE_COUNT))
        for i in 0..<FDNReverb.LINE_COUNT {
            var fb = (outs[i] - h) * decayGain
            // loop damping
            lpState[i] += (fb - lpState[i]) * loopDamp
            fb = lpState[i]
            var w = fb + lpInput * 0.25
            if abs(w) < 1e-20 { w = 0 } // denormal guard
            lines[i][writeIdx[i]] = w
            writeIdx[i] += 1
            if writeIdx[i] == lengths[i] { writeIdx[i] = 0 }
        }
        // decorrelated stereo taps
        let left = outs[0] - outs[2] + outs[4] - outs[6]
        let right = outs[1] - outs[3] + outs[5] - outs[7]
        return (left * outputGain, right * outputGain)
    }

    public func reset() {
        for i in 0..<lines.count {
            for j in 0..<lines[i].count { lines[i][j] = 0 }
            lpState[i] = 0
            writeIdx[i] = 0
        }
        lpInput = 0
    }
}
