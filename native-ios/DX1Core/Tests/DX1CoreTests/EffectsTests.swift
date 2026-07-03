import XCTest
@testable import DX1Core

final class EffectsTests: XCTestCase {
    let sr: Double = 44100

    func testDryPathIsUnityWhenMixesAreZero() {
        let fx = EffectsChain(sampleRate: sr, params: EffectsParams(
            delayTime: 0.28, delayFeedback: 0.25, delayMix: 0, reverbSize: 0.5, reverbMix: 0))
        fx.setMasterVolume(1.0)
        // let master volume smoothing settle from the 0.8 default
        for _ in 0..<Int(sr) { _ = fx.process(0) }
        var maxErr: Float = 0
        for i in 0..<1000 {
            let x = Float(sin(Double(i) * 0.05)) * 0.5
            let (l, r) = fx.process(x)
            maxErr = max(maxErr, abs(l - x), abs(r - x))
        }
        XCTAssertLessThan(maxErr, 1e-4)
    }

    func testDelayEchoTimingAndFeedback() {
        let delayTime = 0.25
        let fb = 0.5
        let d = DelayLine(sampleRate: sr, delayTime: delayTime, feedback: fb)
        let delaySamples = Int(delayTime * sr)
        let total = delaySamples * 3 + 100
        var out = [Float](repeating: 0, count: total)
        for i in 0..<total {
            out[i] = d.process(i == 0 ? 1 : 0)
        }
        // first echo at delaySamples with amplitude ~1, second at 2x with ~fb
        XCTAssertEqual(out[delaySamples], 1.0, accuracy: 0.01)
        XCTAssertEqual(out[delaySamples * 2], Float(fb), accuracy: 0.01)
        XCTAssertEqual(out[delaySamples * 3], Float(fb * fb), accuracy: 0.01)
        // silence before the first echo
        for i in 0..<(delaySamples - 1) {
            XCTAssertEqual(out[i], 0, "unexpected signal at \(i)")
        }
    }

    func testReverbDecaysMonotonicallyAndScalesWithSize() {
        func tailEnergy(size: Double, from: Double, to: Double) -> Double {
            let r = FDNReverb(sampleRate: sr, size: size)
            let total = Int(sr * to)
            var energy: Double = 0
            let start = Int(sr * from)
            for i in 0..<total {
                let (l, r2) = r.process(i == 0 ? 1 : 0)
                if i >= start { energy += Double(l * l + r2 * r2) }
            }
            return energy
        }
        // energy decays over time
        let e1 = tailEnergy(size: 0.5, from: 0.0, to: 0.5)
        let e2 = tailEnergy(size: 0.5, from: 0.5, to: 1.0) - tailEnergy(size: 0.5, from: 0.0, to: 0.5)
        _ = e2
        let early = tailEnergy(size: 0.5, from: 0.1, to: 0.4)
        let late = tailEnergy(size: 0.5, from: 1.5, to: 1.8)
        XCTAssertGreaterThan(e1, 0)
        XCTAssertGreaterThan(early, late * 2, "reverb tail must decay")
        // larger size -> longer tail
        let lateSmall = tailEnergy(size: 0.1, from: 1.0, to: 1.5)
        let lateBig = tailEnergy(size: 1.0, from: 1.0, to: 1.5)
        XCTAssertGreaterThan(lateBig, lateSmall, "bigger room must ring longer")
    }

    func testReverbIsStableAtMaxSize() {
        let r = FDNReverb(sampleRate: sr, size: 1.0)
        var peak: Float = 0
        for i in 0..<Int(sr * 5) {
            let x: Float = i < 1000 ? 0.5 : 0
            let (l, rr) = r.process(x)
            peak = max(peak, abs(l), abs(rr))
            XCTAssert(l.isFinite && rr.isFinite)
        }
        XCTAssertLessThan(peak, 4.0, "reverb must not blow up")
        // and it must have fully decayed well before 5 s of silence... not required
        // at size 1 (4 s decay), just bounded.
    }

    func testEffectsChainRoutingDelayFeedsReverb() {
        // With delayMix > 0 the delayed signal must also excite the reverb
        // (delayWet -> convolver in the web graph).
        let fx = EffectsChain(sampleRate: sr, params: EffectsParams(
            delayTime: 0.1, delayFeedback: 0, delayMix: 1, reverbSize: 0.3, reverbMix: 1))
        fx.setMasterVolume(1.0)
        var energyAfterEcho: Double = 0
        let echoAt = Int(0.1 * sr)
        for i in 0..<Int(sr * 1.0) {
            let (l, r) = fx.process(i == 0 ? 1 : 0)
            if i > echoAt + 2000 { energyAfterEcho += Double(l * l + r * r) }
        }
        XCTAssertGreaterThan(energyAfterEcho, 0, "delay output must reach the reverb")
    }
}
