/// DSP constants and parameter curves — 1:1 port of the top of
/// public/worklet/fm-processor.js. Do not "improve": golden-master parity
/// with the web engine depends on these exact formulas.

import Foundation

public enum DX {
    public static let SINE_BITS = 12
    public static let SINE_SIZE = 1 << SINE_BITS // 4096
    public static let SINE_MASK = SINE_SIZE - 1

    /// Sine table with linear-interpolation guard sample, Float32 like the
    /// worklet's Float32Array.
    public static let SINE: [Float] = {
        var t = [Float](repeating: 0, count: SINE_SIZE + 1)
        for i in 0...SINE_SIZE {
            t[i] = Float(sin((Double(i) / Double(SINE_SIZE)) * 2 * Double.pi))
        }
        return t
    }()

    public static let TWO_PI = Double.pi * 2

    /// ~0.75 dB per DX level step: gain = exp(LEVEL_K * (level - 99))
    public static let LEVEL_K = log(pow(10.0, 0.75 / 20)) // 0.08632...

    /// Peak modulation index (radians) for a modulator at output level 99 / full EG
    public static let MOD_SCALE = 8.0

    /// Feedback scale: fb=7 approaches a sawtooth-like spectrum
    public static let FB_SCALE: [Double] = [0, 0.0391, 0.0781, 0.1563, 0.3125, 0.625, 1.25, 2.5]

    public static let NUM_OPS = 6
}

/// EG rate (0-99) -> seconds to traverse the full 0-99 level range
@inlinable
public func rateToFullTime(_ rate: Double) -> Double {
    pow(2, (64 - rate) / 6) * 0.028
}

/// DX level (0-99, may be fractional / >99 clamped) -> linear gain
@inlinable
public func levelToGain(_ level: Double) -> Double {
    if level <= 0 { return 0 }
    let l = level > 99 ? 99 : level
    return exp(DX.LEVEL_K * (l - 99))
}

/// Keyboard level scaling: returns level offset (in DX level units, +/-)
/// curve: 0=-LIN 1=-EXP 2=+EXP 3=+LIN
public func scalingOffset(
    note: Int, breakpoint: Double,
    leftDepth: Double, rightDepth: Double,
    leftCurve: Int, rightCurve: Int
) -> Double {
    let bpNote = breakpoint + 21
    let dist = Double(note) - bpNote
    if dist == 0 { return 0 }
    let depth = dist < 0 ? leftDepth : rightDepth
    let curve = dist < 0 ? leftCurve : rightCurve
    if depth == 0 { return 0 }
    let ad = abs(dist)
    var amt: Double
    if curve == 1 || curve == 2 {
        // exponential curve: doubles roughly every octave
        amt = exp((ad - 72) / 13.5) * 99
        if amt > 99 { amt = 99 }
        amt = (depth / 99) * amt * 4 // scaled to feel like hardware EXP
    } else {
        // linear: depth reached over ~ 45 semitones
        amt = (depth * ad) / 45
    }
    if amt > 99 { amt = 99 }
    let sign: Double = curve <= 1 ? -1 : 1 // curves 0,1 negative; 2,3 positive
    return sign * amt
}

/// LFO delay 0-99 -> seconds until LFO fades in
@inlinable
public func lfoDelayToSeconds(_ delay: Double) -> Double {
    if delay <= 0 { return 0 }
    return pow(delay / 99, 2) * 5.0
}

/// Pitch EG level (0-99, 50 = center) -> semitones
@inlinable
public func pegLevelToSemis(_ level: Double) -> Double {
    (level - 50) * 0.96
}
