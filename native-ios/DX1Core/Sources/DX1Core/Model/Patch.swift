/// DX voice parameter model. Shapes and JSON keys match the web app's
/// `src/engine/types.ts` exactly, so patches are interchangeable between
/// the web emulator and the native app (Codable <-> JSON).

import Foundation

/// Keyboard level scaling curve: 0 = -LIN, 1 = -EXP, 2 = +EXP, 3 = +LIN
public typealias ScaleCurve = Int

/// LFO wave: 0=TRI 1=SAW DN 2=SAW UP 3=SQUARE 4=SINE 5=S&H
public typealias LfoWave = Int

public struct OperatorParams: Codable, Equatable, Sendable {
    public var enabled: Bool
    public var egRates: [Double]      // R1-R4, 0-99
    public var egLevels: [Double]     // L1-L4, 0-99
    public var breakpoint: Double     // 0-99 (39 = C3)
    public var scaleLeftDepth: Double // 0-99
    public var scaleRightDepth: Double // 0-99
    public var scaleLeftCurve: ScaleCurve
    public var scaleRightCurve: ScaleCurve
    public var rateScaling: Double    // 0-7
    public var amSens: Double         // 0-3
    public var velSens: Double        // 0-7
    public var outputLevel: Double    // 0-99
    public var freqMode: Int          // 0=ratio 1=fixed
    public var freqCoarse: Double     // 0-31
    public var freqFine: Double       // 0-99
    public var detune: Double         // 0-14 (7 = center)

    public init(
        enabled: Bool,
        egRates: [Double],
        egLevels: [Double],
        breakpoint: Double,
        scaleLeftDepth: Double,
        scaleRightDepth: Double,
        scaleLeftCurve: ScaleCurve,
        scaleRightCurve: ScaleCurve,
        rateScaling: Double,
        amSens: Double,
        velSens: Double,
        outputLevel: Double,
        freqMode: Int,
        freqCoarse: Double,
        freqFine: Double,
        detune: Double
    ) {
        self.enabled = enabled
        self.egRates = egRates
        self.egLevels = egLevels
        self.breakpoint = breakpoint
        self.scaleLeftDepth = scaleLeftDepth
        self.scaleRightDepth = scaleRightDepth
        self.scaleLeftCurve = scaleLeftCurve
        self.scaleRightCurve = scaleRightCurve
        self.rateScaling = rateScaling
        self.amSens = amSens
        self.velSens = velSens
        self.outputLevel = outputLevel
        self.freqMode = freqMode
        self.freqCoarse = freqCoarse
        self.freqFine = freqFine
        self.detune = detune
    }
}

public struct Patch: Codable, Equatable, Sendable {
    public var name: String           // up to 10 chars, like the hardware
    public var algorithm: Int         // 1-32
    public var feedback: Int          // 0-7
    public var oscKeySync: Bool
    public var transpose: Double      // 0-48 (24 = C3)
    public var pitchEgRates: [Double]  // R1-R4, 0-99
    public var pitchEgLevels: [Double] // L1-L4, 50 = center pitch
    public var lfoSpeed: Double       // 0-99
    public var lfoDelay: Double       // 0-99
    public var lfoPmd: Double         // 0-99
    public var lfoAmd: Double         // 0-99
    public var lfoSync: Bool
    public var lfoWave: LfoWave
    public var lfoPitchModSens: Int   // 0-7
    public var ops: [OperatorParams]  // exactly 6, OP1...OP6

    public init(
        name: String,
        algorithm: Int,
        feedback: Int,
        oscKeySync: Bool,
        transpose: Double,
        pitchEgRates: [Double],
        pitchEgLevels: [Double],
        lfoSpeed: Double,
        lfoDelay: Double,
        lfoPmd: Double,
        lfoAmd: Double,
        lfoSync: Bool,
        lfoWave: LfoWave,
        lfoPitchModSens: Int,
        ops: [OperatorParams]
    ) {
        self.name = name
        self.algorithm = algorithm
        self.feedback = feedback
        self.oscKeySync = oscKeySync
        self.transpose = transpose
        self.pitchEgRates = pitchEgRates
        self.pitchEgLevels = pitchEgLevels
        self.lfoSpeed = lfoSpeed
        self.lfoDelay = lfoDelay
        self.lfoPmd = lfoPmd
        self.lfoAmd = lfoAmd
        self.lfoSync = lfoSync
        self.lfoWave = lfoWave
        self.lfoPitchModSens = lfoPitchModSens
        self.ops = ops
    }
}

/// Performance/function parameters (not stored per-voice on the hardware)
public struct FunctionParams: Codable, Equatable, Sendable {
    public var polyphony: Int        // max voices (DX1: 32 across dual channels)
    public var mono: Bool
    public var pitchBendRange: Double // semitones 0-12
    public var portamento: Double    // seconds 0-5
    public var masterVolume: Double  // 0-1

    public init(polyphony: Int, mono: Bool, pitchBendRange: Double, portamento: Double, masterVolume: Double) {
        self.polyphony = polyphony
        self.mono = mono
        self.pitchBendRange = pitchBendRange
        self.portamento = portamento
        self.masterVolume = masterVolume
    }

    public static let `default` = FunctionParams(
        polyphony: 16, mono: false, pitchBendRange: 2, portamento: 0, masterVolume: 0.8
    )
}

public struct EffectsParams: Codable, Equatable, Sendable {
    public var delayTime: Double     // seconds
    public var delayFeedback: Double // 0-0.9
    public var delayMix: Double      // 0-1
    public var reverbSize: Double    // 0-1
    public var reverbMix: Double     // 0-1

    public init(delayTime: Double, delayFeedback: Double, delayMix: Double, reverbSize: Double, reverbMix: Double) {
        self.delayTime = delayTime
        self.delayFeedback = delayFeedback
        self.delayMix = delayMix
        self.reverbSize = reverbSize
        self.reverbMix = reverbMix
    }

    /// Mirrors DEFAULT_EFFECTS in the web app's effectsChain.ts
    public static let `default` = EffectsParams(
        delayTime: 0.28, delayFeedback: 0.25, delayMix: 0.0, reverbSize: 0.5, reverbMix: 0.18
    )
}
