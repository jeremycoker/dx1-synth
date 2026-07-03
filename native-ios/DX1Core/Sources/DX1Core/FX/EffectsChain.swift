/// Effects chain — same topology as the web app's effectsChain.ts:
///
///   input ─────────────────────────────► master (dry)
///   input ─► delay(fb loop) ─► delayWet ─► master
///   input ─► reverb ─► reverbWet ─► master        (also delayWet ─► reverb)
///   master(gain = masterVolume) ─► output
///
/// Mono in, stereo out (reverb provides the width, like the stereo IR).
/// Wet gains + master volume are smoothed like WebAudio setTargetAtTime.

import Foundation

public final class EffectsChain {
    private let delay: DelayLine
    private let reverb: FDNReverb
    private let sr: Double

    private var delayWet: Double
    private var targetDelayWet: Double
    private var reverbWet: Double
    private var targetReverbWet: Double
    private var masterVolume: Double = 0.8
    private var targetMasterVolume: Double = 0.8
    private var currentSize: Double
    private let wetSmooth: Double   // tau 0.05 (fx params)
    private let volSmooth: Double   // tau 0.02 (master volume)

    public init(sampleRate: Double, params: EffectsParams = .default) {
        self.sr = sampleRate
        self.delay = DelayLine(sampleRate: sampleRate,
                               delayTime: params.delayTime,
                               feedback: params.delayFeedback)
        self.reverb = FDNReverb(sampleRate: sampleRate, size: params.reverbSize)
        self.delayWet = params.delayMix
        self.targetDelayWet = params.delayMix
        self.reverbWet = params.reverbMix
        self.targetReverbWet = params.reverbMix
        self.currentSize = params.reverbSize
        self.wetSmooth = 1 - exp(-1 / (0.05 * sampleRate))
        self.volSmooth = 1 - exp(-1 / (0.02 * sampleRate))
    }

    public func update(_ fx: EffectsParams) {
        delay.setDelayTime(fx.delayTime)
        delay.setFeedback(fx.delayFeedback)
        targetDelayWet = fx.delayMix
        targetReverbWet = fx.reverbMix
        // regenerate decay only when size changes meaningfully (like the web IR)
        if abs(fx.reverbSize - currentSize) > 0.04 {
            currentSize = fx.reverbSize
            reverb.setSize(fx.reverbSize)
        }
    }

    public func setMasterVolume(_ v: Double) {
        targetMasterVolume = v
    }

    /// Process one mono input sample into a stereo pair.
    @inline(__always)
    public func process(_ input: Float) -> (Float, Float) {
        delayWet += (targetDelayWet - delayWet) * wetSmooth
        reverbWet += (targetReverbWet - reverbWet) * wetSmooth
        masterVolume += (targetMasterVolume - masterVolume) * volSmooth

        let delayed = delay.process(input) * Float(delayWet)
        let reverbIn = input + delayed
        let (rl, rr) = reverb.process(reverbIn)

        let mono = input + delayed
        let left = (mono + rl * Float(reverbWet)) * Float(masterVolume)
        let right = (mono + rr * Float(reverbWet)) * Float(masterVolume)
        return (left, right)
    }

    /// Block variant for the audio render callback.
    public func process(input: UnsafeBufferPointer<Float>,
                        outL: UnsafeMutableBufferPointer<Float>,
                        outR: UnsafeMutableBufferPointer<Float>) {
        for i in 0..<input.count {
            let (l, r) = process(input[i])
            outL[i] = l
            outR[i] = r
        }
    }

    public func reset() {
        delay.reset()
        reverb.reset()
    }
}
