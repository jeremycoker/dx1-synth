/// Yamaha DX-series 6-operator phase-modulation FM engine.
/// 1:1 port of `class FmProcessor` in public/worklet/fm-processor.js.
/// The render API is shaped like an AUv3 render block so a future AUv3
/// extension can wrap it without a rewrite.
///
/// Render-thread rules: no allocation, no locks. `opOut` is preallocated
/// (the JS version allocates it per process() call — same values, hoisted).

import Foundation

public final class FMEngine {
    public let sr: Double
    public private(set) var patch: Patch?
    public let voices: [Voice]
    public var maxVoices = 16
    var noteCounter = 0
    var lastNote = -1
    public var pitchBend: Double = 0   // semitones
    public var modWheel: Double = 0    // 0..1
    public var sustain = false
    public var portamento: Double = 0  // seconds
    var lfoPhase: Double = 0
    var lfoSH: Double = 0              // sample & hold value
    public var masterGain: Double = 1.0
    public var mono = false

    /// Injectable RNG (S&H LFO). Defaults to system random; golden-master
    /// tests inject a SeededRandom matched with the Node harness.
    public var random: () -> Double = { Double.random(in: 0..<1) }

    private var opOut = [Float](repeating: 0, count: DX.NUM_OPS)
    private static let PMS_TABLE: [Double] = [0, 0.075, 0.15, 0.3, 0.6, 1.2, 2.4, 4.8]

    public init(sampleRate: Double) {
        self.sr = sampleRate
        var vs: [Voice] = []
        vs.reserveCapacity(32)
        for _ in 0..<32 { vs.append(Voice()) }
        self.voices = vs
    }

    // MARK: - Control (mirrors handleMessage cases)

    public func setPatch(_ p: Patch) {
        patch = p
    }

    public func noteOn(note: Int, velocity: Double) {
        guard let patch else { return }
        if mono {
            for v in voices where v.active {
                v.down = false
                v.noteOff(patch: patch, sr: sr)
            }
        }
        // find free voice or steal oldest
        var voice: Voice? = nil
        var oldest: Voice? = nil
        var oldestAge = Int.max
        var activeCount = 0
        for v in voices {
            if !v.active {
                if voice == nil { voice = v }
            } else {
                activeCount += 1
                if v.age < oldestAge { oldestAge = v.age; oldest = v }
            }
        }
        if voice == nil || activeCount >= maxVoices { voice = oldest ?? voices[0] }
        let chosen = voice!
        chosen.age = noteCounter
        noteCounter += 1
        chosen.sustained = false
        chosen.noteOn(note: note, velocity: velocity, patch: patch, sr: sr,
                      lastNote: lastNote, portamentoSec: portamento)
        if patch.lfoSync { lfoPhase = 0 }
        lastNote = note
    }

    public func noteOff(note: Int) {
        guard let patch else { return }
        for v in voices {
            if v.active && v.down && v.note == note {
                v.down = false
                if sustain { v.sustained = true }
                else { v.noteOff(patch: patch, sr: sr) }
            }
        }
    }

    public func setSustain(_ on: Bool) {
        sustain = on
        if !on, let patch {
            for v in voices {
                if v.active && !v.down && v.sustained {
                    v.sustained = false
                    v.noteOff(patch: patch, sr: sr)
                }
            }
        }
    }

    public func allNotesOff() {
        for v in voices { v.active = false; v.down = false }
    }

    public func setFunction(portamento: Double? = nil, polyphony: Int? = nil, mono: Bool? = nil) {
        if let portamento { self.portamento = portamento }
        if let polyphony { self.maxVoices = polyphony }
        if let mono { self.mono = mono }
    }

    // MARK: - LFO

    func lfoValue(wave: Int, phase: Double) -> Double {
        switch wave {
        case 0: // triangle
            return phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4
        case 1: return 1 - phase * 2               // saw down
        case 2: return phase * 2 - 1               // saw up
        case 3: return phase < 0.5 ? 1 : -1        // square
        case 4: return Double(DX.SINE[Int(phase * Double(DX.SINE_SIZE)) & DX.SINE_MASK]) // sine
        case 5: return lfoSH                       // sample & hold
        default: return 0
        }
    }

    // MARK: - Render

    public func render(into out: UnsafeMutableBufferPointer<Float>) {
        guard let patch else {
            for i in 0..<out.count { out[i] = 0 }
            return
        }

        let alg = ALGORITHMS[patch.algorithm - 1]
        let mods = alg.mods
        let carriers = alg.carriers
        let fbOp = alg.fbOp
        let fbSrc = alg.fbSrc
        let fbAmt = DX.FB_SCALE[patch.feedback]
        let carrierNorm = 1 / max(1, (Double(carriers.count)).squareRoot() * 1.2)
        let sr = self.sr
        let lfoHz = lfoSpeedToHz(patch.lfoSpeed)
        let lfoIncr = lfoHz / sr
        let lfoDelaySec = lfoDelayToSeconds(patch.lfoDelay)
        let pms = patch.lfoPitchModSens // 0-7
        let pmDepth = (patch.lfoPmd / 99 + modWheel) * FMEngine.PMS_TABLE[pms] // semitones
        let amDepth = patch.lfoAmd / 99 // 0..1
        let bend = pitchBend

        for s in 0..<out.count {
            // global LFO
            lfoPhase += lfoIncr
            if lfoPhase >= 1 {
                lfoPhase -= 1
                lfoSH = random() * 2 - 1
            }
            let lfoRaw = lfoValue(wave: patch.lfoWave, phase: lfoPhase)

            var mix: Double = 0
            for vi in 0..<voices.count {
                let v = voices[vi]
                if !v.active { continue }

                // ---- LFO fade-in for this voice
                v.lfoDelayT += 1 / sr
                let lfoAmt: Double = lfoDelaySec <= 0
                    ? 1
                    : min(1, max(0, (v.lfoDelayT - lfoDelaySec) / 0.3
                                    + (v.lfoDelayT >= lfoDelaySec ? 0.0001 : 0)))
                let lfo = lfoRaw * lfoAmt

                // ---- Pitch EG
                do {
                    let target = v.pegStage < 3 ? patch.pitchEgLevels[v.pegStage] : patch.pitchEgLevels[3]
                    let rate = v.pegStage < 4 ? patch.pitchEgRates[min(3, v.pegStage)] : 99
                    let inc = 99 / (rateToFullTime(rate) * sr)
                    if v.pegLevel < target {
                        v.pegLevel += inc
                        if v.pegLevel >= target {
                            v.pegLevel = target
                            if v.pegStage < 2 || v.pegStage == 3 {
                                v.pegStage = v.pegStage < 2 ? v.pegStage + 1 : 4
                            }
                        }
                    } else if v.pegLevel > target {
                        v.pegLevel -= inc
                        if v.pegLevel <= target {
                            v.pegLevel = target
                            if v.pegStage < 2 || v.pegStage == 3 {
                                v.pegStage = v.pegStage < 2 ? v.pegStage + 1 : 4
                            }
                        }
                    } else if v.pegStage < 2 {
                        v.pegStage += 1
                    }
                }
                let pegSemis = pegLevelToSemis(v.pegLevel)

                // ---- Portamento glide
                if v.glideFrom != 0 {
                    if v.glideFrom > 0 {
                        v.glideFrom -= v.glideRate * abs(v.glideFrom + 1)
                        if v.glideFrom < 0 { v.glideFrom = 0 }
                    } else {
                        v.glideFrom += v.glideRate * abs(v.glideFrom - 1)
                        if v.glideFrom > 0 { v.glideFrom = 0 }
                    }
                }

                let pitchMul = pow(2, (bend + pegSemis + lfo * pmDepth + v.glideFrom) / 12)

                // ---- render operators, highest index first
                var voiceOut: Double = 0
                var anyEgAlive = false
                for i in stride(from: DX.NUM_OPS - 1, through: 0, by: -1) {
                    let op = patch.ops[i]

                    // --- EG advance
                    var stage = Int(v.egStage[i])
                    if stage < 4 {
                        let target = stage < 3 ? op.egLevels[stage] : op.egLevels[3]
                        let lvl = Double(v.egLevel[i])
                        if lvl < target {
                            // rising: exponential approach for authentic snappy attack
                            let nl = lvl + Double(v.egInc[i]) * (1 + (target - lvl) * 0.06) * 4
                            v.egLevel[i] = Float(nl >= target ? target : nl)
                        } else if lvl > target {
                            // falling: linear in dB domain (exponential amplitude decay)
                            let nl = lvl - Double(v.egInc[i])
                            v.egLevel[i] = Float(nl <= target ? target : nl)
                        }
                        if Double(v.egLevel[i]) == target {
                            if stage < 2 {
                                stage += 1
                                v.egStage[i] = Int8(stage)
                                v.egInc[i] = v.computeInc(op: op, stage: stage, sr: sr, opIdx: i)
                            } else if stage == 3 {
                                v.egStage[i] = 4
                            }
                            // stage 2 sustains at L3 until noteOff
                        }
                        if stage < 3 || v.egLevel[i] > 0.01 { anyEgAlive = true }
                    }

                    if !op.enabled {
                        opOut[i] = 0
                        v.out2[i] = v.out1[i]
                        v.out1[i] = 0
                        continue
                    }

                    // --- effective level -> gain
                    let effLevel = Double(v.egLevel[i]) + op.outputLevel - 99 + Double(v.opLevelOff[i])
                    var gain = levelToGain(effLevel)
                    // per-op LFO amplitude modulation
                    if op.amSens > 0 && amDepth > 0 {
                        let am = 1 - (amDepth * (op.amSens / 3)) * (0.5 + 0.5 * lfo)
                        gain *= max(0, am)
                    }

                    // --- phase modulation input
                    var pm: Double = 0
                    let ml = mods[i]
                    for mIdx in 0..<ml.count { pm += Double(opOut[ml[mIdx]]) }
                    if i == fbOp && fbAmt > 0 {
                        pm += (Double(v.out1[fbSrc]) + Double(v.out2[fbSrc])) * 0.5 * fbAmt
                    }

                    // --- oscillator
                    let freq = v.fixed[i] != 0 ? Double(v.baseFreq[i]) : Double(v.baseFreq[i]) * pitchMul
                    v.phases[i] += freq / sr
                    if v.phases[i] >= 1 { v.phases[i] -= 1 }
                    let phi = v.phases[i] * DX.TWO_PI + pm * DX.MOD_SCALE
                    // table lookup with linear interpolation
                    var tpos = (phi / DX.TWO_PI) * Double(DX.SINE_SIZE)
                    tpos = tpos - (tpos / Double(DX.SINE_SIZE)).rounded(.down) * Double(DX.SINE_SIZE)
                    let ti = Int(tpos)
                    let frac = tpos - Double(ti)
                    let sig = (Double(DX.SINE[ti]) + (Double(DX.SINE[ti + 1]) - Double(DX.SINE[ti])) * frac) * gain

                    v.out2[i] = v.out1[i]
                    v.out1[i] = Float(sig)
                    opOut[i] = Float(sig)
                }

                for c in 0..<carriers.count { voiceOut += Double(opOut[carriers[c]]) }
                mix += voiceOut * carrierNorm

                if !anyEgAlive && !v.down { v.active = false }
            }

            out[s] = Float(mix * 0.35 * masterGain)
        }
    }

    /// Convenience for tests / offline rendering.
    public func render(frames: Int) -> [Float] {
        var buf = [Float](repeating: 0, count: frames)
        buf.withUnsafeMutableBufferPointer { render(into: $0) }
        return buf
    }
}
