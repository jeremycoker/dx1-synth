import XCTest
@testable import DX1Core

/// Asserts the FDN reverb tracks the web app's normalized ConvolverNode
/// response. Reference values measured from the web IR generator
/// (effectsChain.ts generateImpulse + WebAudio -58 dB RMS normalization):
///   size 0.1: E 0.1314  T20 0.534 s  T30 0.677 s
///   size 0.5: E 0.3215  T20 1.315 s  T30 1.655 s
///   size 1.0: E 0.5592  T20 2.296 s  T30 2.887 s
final class ReverbFidelityTests: XCTestCase {
    let sr: Double = 44100

    struct Measurement {
        let energy: Double
        let t20: Double
        let t30: Double
    }

    func measure(size: Double, seconds: Double) -> Measurement {
        let r = FDNReverb(sampleRate: sr, size: size)
        let total = Int(sr * seconds)
        var sq = [Double](repeating: 0, count: total)
        var energy: Double = 0
        for i in 0..<total {
            let (l, rr) = r.process(i == 0 ? 1 : 0)
            let e = Double(l * l) + Double(rr * rr)
            sq[i] = e
            energy += e
        }
        // Schroeder backward-integrated EDC
        var back = [Double](repeating: 0, count: total)
        var cum: Double = 0
        for i in stride(from: total - 1, through: 0, by: -1) {
            cum += sq[i]
            back[i] = cum
        }
        func timeTo(_ db: Double) -> Double {
            let target = back[0] * pow(10, db / 10)
            for i in 0..<total where back[i] <= target { return Double(i) / sr }
            return seconds
        }
        return Measurement(energy: energy, t20: timeTo(-20), t30: timeTo(-30))
    }

    func testDecayTimesAndEnergyMatchWebConvolver() {
        let refs: [(size: Double, e: Double, t20: Double, t30: Double)] = [
            (0.1, 0.1314, 0.534, 0.677),
            (0.5, 0.3215, 1.315, 1.655),
            (1.0, 0.5592, 2.296, 2.887),
        ]
        for ref in refs {
            let m = measure(size: ref.size, seconds: ref.t30 * 3 + 2)
            print(String(format: "FDN size %.1f: E %.4f (web %.4f)  T20 %.3f (web %.3f)  T30 %.3f (web %.3f)",
                         ref.size, m.energy, ref.e, m.t20, ref.t20, m.t30, ref.t30))
            // decay times within 15% of the web response
            XCTAssertEqual(m.t20, ref.t20, accuracy: ref.t20 * 0.15, "size \(ref.size) T20")
            XCTAssertEqual(m.t30, ref.t30, accuracy: ref.t30 * 0.15, "size \(ref.size) T30")
            // wet loudness within ~1.5 dB of the web response
            let dbErr = 10 * log10(m.energy / ref.e)
            XCTAssertEqual(dbErr, 0, accuracy: 1.5, "size \(ref.size) energy off by \(dbErr) dB")
        }
    }
}
