/// Preset construction helpers — Swift port of the web app's `initVoice.ts`
/// mkOp / mkPatch (defaults = INIT VOICE operator / patch).

/// Build an operator from partial values (defaults = INIT VOICE operator).
public func mkOp(
    enabled: Bool = true,
    egRates: [Double] = [99, 99, 99, 99],
    egLevels: [Double] = [99, 99, 99, 0],
    breakpoint: Double = 39, // C3
    scaleLeftDepth: Double = 0,
    scaleRightDepth: Double = 0,
    scaleLeftCurve: ScaleCurve = 0,
    scaleRightCurve: ScaleCurve = 0,
    rateScaling: Double = 0,
    amSens: Double = 0,
    velSens: Double = 0,
    outputLevel: Double = 0,
    freqMode: Int = 0,
    freqCoarse: Double = 1,
    freqFine: Double = 0,
    detune: Double = 7
) -> OperatorParams {
    OperatorParams(
        enabled: enabled,
        egRates: egRates,
        egLevels: egLevels,
        breakpoint: breakpoint,
        scaleLeftDepth: scaleLeftDepth,
        scaleRightDepth: scaleRightDepth,
        scaleLeftCurve: scaleLeftCurve,
        scaleRightCurve: scaleRightCurve,
        rateScaling: rateScaling,
        amSens: amSens,
        velSens: velSens,
        outputLevel: outputLevel,
        freqMode: freqMode,
        freqCoarse: freqCoarse,
        freqFine: freqFine,
        detune: detune
    )
}

public func mkPatch(
    name: String = "INIT VOICE",
    algorithm: Int = 1,
    feedback: Int = 0,
    oscKeySync: Bool = true,
    transpose: Double = 24,
    pitchEgRates: [Double] = [99, 99, 99, 99],
    pitchEgLevels: [Double] = [50, 50, 50, 50],
    lfoSpeed: Double = 35,
    lfoDelay: Double = 0,
    lfoPmd: Double = 0,
    lfoAmd: Double = 0,
    lfoSync: Bool = true,
    lfoWave: LfoWave = 0,
    lfoPitchModSens: Int = 3,
    ops: [OperatorParams]? = nil
) -> Patch {
    Patch(
        name: name,
        algorithm: algorithm,
        feedback: feedback,
        oscKeySync: oscKeySync,
        transpose: transpose,
        pitchEgRates: pitchEgRates,
        pitchEgLevels: pitchEgLevels,
        lfoSpeed: lfoSpeed,
        lfoDelay: lfoDelay,
        lfoPmd: lfoPmd,
        lfoAmd: lfoAmd,
        lfoSync: lfoSync,
        lfoWave: lfoWave,
        lfoPitchModSens: lfoPitchModSens,
        ops: ops ?? [
            mkOp(outputLevel: 99),
            mkOp(), mkOp(), mkOp(), mkOp(), mkOp(),
        ]
    )
}

public let INIT_VOICE: Patch = mkPatch()
