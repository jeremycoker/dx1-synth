/// Feedback delay — port of the web EffectsChain's DelayNode + feedback GainNode
/// loop (delay -> delayFb -> delay). Fractional read with linear interpolation,
/// parameters smoothed like WebAudio setTargetAtTime.

import Foundation

public final class DelayLine {
    private var buffer: [Float]
    private var writeIdx = 0
    private let sr: Double

    /// smoothed parameters (WebAudio setTargetAtTime, timeConstant 0.05)
    private var delaySamples: Double
    private var targetDelaySamples: Double
    private var feedback: Double
    private var targetFeedback: Double
    private let smoothCoeff: Double

    public init(sampleRate: Double, maxDelaySeconds: Double = 2.0,
                delayTime: Double, feedback: Double) {
        self.sr = sampleRate
        self.buffer = [Float](repeating: 0, count: Int(sampleRate * maxDelaySeconds) + 2)
        self.delaySamples = delayTime * sampleRate
        self.targetDelaySamples = self.delaySamples
        self.feedback = feedback
        self.targetFeedback = feedback
        // per-sample coefficient equivalent to setTargetAtTime(tau = 0.05 s)
        self.smoothCoeff = 1 - exp(-1 / (0.05 * sampleRate))
    }

    public func setDelayTime(_ seconds: Double) {
        targetDelaySamples = min(Double(buffer.count - 2), max(0, seconds * sr))
    }

    public func setFeedback(_ fb: Double) {
        targetFeedback = min(0.9, fb)
    }

    /// Process one sample: returns the delay line output (pre-wet-gain).
    @inline(__always)
    public func process(_ input: Float) -> Float {
        delaySamples += (targetDelaySamples - delaySamples) * smoothCoeff
        feedback += (targetFeedback - feedback) * smoothCoeff

        let n = buffer.count
        var readPos = Double(writeIdx) - delaySamples
        if readPos < 0 { readPos += Double(n) }
        let i0 = Int(readPos) % n
        let i1 = (i0 + 1) % n
        let frac = Float(readPos - Double(Int(readPos)))
        let out = buffer[i0] + (buffer[i1] - buffer[i0]) * frac

        var w = input + out * Float(feedback)
        // denormal guard (Linux/x86 test-host performance; inaudible)
        if abs(w) < 1e-20 { w = 0 }
        buffer[writeIdx] = w
        writeIdx += 1
        if writeIdx == n { writeIdx = 0 }
        return out
    }

    public func reset() {
        for i in 0..<buffer.count { buffer[i] = 0 }
    }
}
