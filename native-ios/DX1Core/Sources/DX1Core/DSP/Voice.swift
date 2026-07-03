/// One polyphonic voice — 1:1 port of `class Voice` in fm-processor.js.
/// Number-type mirroring is deliberate and load-bearing for golden-master
/// parity: JS Float32Array-backed state is `Float` here, plain JS numbers
/// are `Double`, and all arithmetic is done in Double (as JS does) with
/// results stored back at Float precision where JS stores into a Float32Array.

import Foundation

public final class Voice {
    public var active = false
    public var note = 60
    public var velocity: Double = 1
    public var age = 0
    public var down = false // key held
    public var sustained = false
    var wasActive = false

    var phases = [Double](repeating: 0, count: DX.NUM_OPS)      // 0..1 phase (JS Float64Array)
    var out1 = [Float](repeating: 0, count: DX.NUM_OPS)         // previous output
    var out2 = [Float](repeating: 0, count: DX.NUM_OPS)         // output before that
    var baseFreq = [Float](repeating: 0, count: DX.NUM_OPS)     // per-op frequency (Hz), pre-bend
    var fixed = [UInt8](repeating: 0, count: DX.NUM_OPS)
    // EG state per op
    var egStage = [Int8](repeating: 0, count: DX.NUM_OPS)       // 0,1,2 = key-on segs, 3 = release, 4 = done
    var egLevel = [Float](repeating: 0, count: DX.NUM_OPS)      // current level, DX 0-99 domain
    var egInc = [Float](repeating: 0, count: DX.NUM_OPS)        // per-sample linear increment
    var opLevelOff = [Float](repeating: 0, count: DX.NUM_OPS)   // scaling + velocity offset (level units)
    var rateAdj = [Float](repeating: 0, count: DX.NUM_OPS)      // rate scaling adjustment
    // Pitch EG
    var pegStage = 0
    var pegLevel: Double = 50
    var lfoDelayT: Double = 0   // seconds since key-on (for LFO delay)
    var glideFrom: Double = 0   // semitone offset gliding to 0
    var glideRate: Double = 0   // offset decay per sample

    public init() {}

    func noteOn(note: Int, velocity: Double, patch: Patch, sr: Double, lastNote: Int, portamentoSec: Double) {
        active = true
        down = true
        self.note = note
        self.velocity = velocity
        lfoDelayT = 0
        pegStage = 0
        pegLevel = patch.pitchEgLevels[3] // EG starts from L4
        // Portamento glide
        if portamentoSec > 0.005 && lastNote >= 0 && lastNote != note {
            glideFrom = Double(lastNote - note)
            glideRate = 1 / (portamentoSec * sr)
        } else {
            glideFrom = 0
        }
        let transpose = patch.transpose - 24 // 24 = C3 center
        for i in 0..<DX.NUM_OPS {
            let op = patch.ops[i]
            // frequency
            if op.freqMode == 1 {
                fixed[i] = 1
                baseFreq[i] = Float(
                    pow(10, op.freqCoarse.truncatingRemainder(dividingBy: 4))
                        * pow(10, op.freqFine / 100)
                        * pow(2, (op.detune - 7) * 1.5 / 1200)
                )
            } else {
                fixed[i] = 0
                let coarse = op.freqCoarse == 0 ? 0.5 : op.freqCoarse
                let ratio = coarse * (1 + op.freqFine / 100)
                let noteFreq = 440 * pow(2, (Double(note) + transpose - 69) / 12)
                baseFreq[i] = Float(noteFreq * ratio * pow(2, (op.detune - 7) * 1.5 / 1200))
            }
            if patch.oscKeySync || !wasActive { phases[i] = 0 }
            out1[i] = 0
            out2[i] = 0
            // level scaling + velocity offset (computed once per note)
            let scaleOff = scalingOffset(
                note: note, breakpoint: op.breakpoint,
                leftDepth: op.scaleLeftDepth, rightDepth: op.scaleRightDepth,
                leftCurve: op.scaleLeftCurve, rightCurve: op.scaleRightCurve
            )
            let velOff = op.velSens * (velocity - 1) * 14 // up to -14 levels per sens step
            opLevelOff[i] = Float(scaleOff + velOff)
            // rate scaling
            rateAdj[i] = Float((op.rateScaling * max(0, Double(note - 21))) / 12)
            // EG: start at level 0 (from silence), head to L1
            egStage[i] = 0
            egLevel[i] = 0
            egInc[i] = computeInc(op: op, stage: 0, sr: sr, opIdx: i)
        }
        wasActive = true
    }

    func computeInc(op: OperatorParams, stage: Int, sr: Double, opIdx: Int) -> Float {
        let rate = min(99, op.egRates[stage] + Double(rateAdj[opIdx]))
        let t = rateToFullTime(rate)
        return Float(99 / (t * sr))
    }

    func noteOff(patch: Patch, sr: Double) {
        down = false
        for i in 0..<DX.NUM_OPS {
            if egStage[i] < 3 {
                egStage[i] = 3
                egInc[i] = computeInc(op: patch.ops[i], stage: 3, sr: sr, opIdx: i)
            }
        }
        pegStage = 3
    }
}
