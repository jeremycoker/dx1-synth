import XCTest
@testable import DX1Core

final class PresetCodableTests: XCTestCase {

    func testFactoryBankShape() {
        XCTAssertEqual(FACTORY_PRESETS.count, 17)
        for patch in FACTORY_PRESETS {
            XCTAssertEqual(patch.ops.count, 6, "\(patch.name) must have 6 ops")
            XCTAssertEqual(patch.pitchEgRates.count, 4)
            XCTAssertEqual(patch.pitchEgLevels.count, 4)
            XCTAssert((1...32).contains(patch.algorithm), "\(patch.name) algorithm out of range")
            XCTAssert((0...7).contains(patch.feedback), "\(patch.name) feedback out of range")
            for op in patch.ops {
                XCTAssertEqual(op.egRates.count, 4)
                XCTAssertEqual(op.egLevels.count, 4)
            }
        }
        XCTAssertEqual(FACTORY_PRESETS[0].name, "E.PIANO 1")
        XCTAssertEqual(FACTORY_PRESETS[16].name, "INIT VOICE")
    }

    func testSpotCheckValuesAgainstWebSource() {
        // E.PIANO 1: op2 (index 1) breakpoint 48, scaleRightDepth 50, curve 1, coarse 14
        let ep = FACTORY_PRESETS[0]
        XCTAssertEqual(ep.algorithm, 5)
        XCTAssertEqual(ep.feedback, 6)
        XCTAssertEqual(ep.ops[1].breakpoint, 48)
        XCTAssertEqual(ep.ops[1].scaleRightDepth, 50)
        XCTAssertEqual(ep.ops[1].scaleRightCurve, 1)
        XCTAssertEqual(ep.ops[1].freqCoarse, 14)
        XCTAssertEqual(ep.ops[5].detune, 0)

        // BASS 1: transpose 12, algorithm 16, op1 coarse 0 fine 50 (0.5 ratio + fine)
        let bass = FACTORY_PRESETS[6]
        XCTAssertEqual(bass.name, "BASS 1")
        XCTAssertEqual(bass.algorithm, 16)
        XCTAssertEqual(bass.transpose, 12)
        XCTAssertEqual(bass.ops[0].freqCoarse, 0)
        XCTAssertEqual(bass.ops[0].freqFine, 50)

        // BRASS 1: pitch EG
        let brass = FACTORY_PRESETS[10]
        XCTAssertEqual(brass.name, "BRASS 1")
        XCTAssertEqual(brass.pitchEgRates, [84, 95, 95, 60])
        XCTAssertEqual(brass.pitchEgLevels, [48, 50, 50, 50])

        // INIT VOICE defaults
        let initVoice = FACTORY_PRESETS[16]
        XCTAssertEqual(initVoice.ops[0].outputLevel, 99)
        XCTAssertEqual(initVoice.ops[1].outputLevel, 0)
        XCTAssertEqual(initVoice.ops[0].detune, 7)
        XCTAssertEqual(initVoice.lfoSpeed, 35)
        XCTAssertTrue(initVoice.oscKeySync)
        XCTAssertTrue(initVoice.lfoSync)
    }

    func testCodableRoundTrip() throws {
        let encoder = JSONEncoder()
        let decoder = JSONDecoder()
        for patch in FACTORY_PRESETS {
            let data = try encoder.encode(patch)
            let decoded = try decoder.decode(Patch.self, from: data)
            XCTAssertEqual(decoded, patch, "\(patch.name) round-trip mismatch")
        }
    }

    func testDecodeWebExportedJson() throws {
        // A patch JSON exactly as the web app would serialize it (types.ts key names).
        let json = """
        {
          "name": "WEB TEST",
          "algorithm": 5,
          "feedback": 6,
          "oscKeySync": true,
          "transpose": 24,
          "pitchEgRates": [99, 99, 99, 99],
          "pitchEgLevels": [50, 50, 50, 50],
          "lfoSpeed": 34,
          "lfoDelay": 33,
          "lfoPmd": 0,
          "lfoAmd": 5,
          "lfoSync": true,
          "lfoWave": 4,
          "lfoPitchModSens": 3,
          "ops": [
            {"enabled": true, "egRates": [96, 25, 25, 67], "egLevels": [99, 75, 0, 0],
             "breakpoint": 39, "scaleLeftDepth": 0, "scaleRightDepth": 0,
             "scaleLeftCurve": 0, "scaleRightCurve": 0, "rateScaling": 3,
             "amSens": 0, "velSens": 2, "outputLevel": 99,
             "freqMode": 0, "freqCoarse": 1, "freqFine": 0, "detune": 7},
            {"enabled": true, "egRates": [95, 50, 35, 78], "egLevels": [99, 75, 0, 0],
             "breakpoint": 48, "scaleLeftDepth": 0, "scaleRightDepth": 50,
             "scaleLeftCurve": 0, "scaleRightCurve": 1, "rateScaling": 3,
             "amSens": 0, "velSens": 7, "outputLevel": 58,
             "freqMode": 0, "freqCoarse": 14, "freqFine": 0, "detune": 7},
            {"enabled": true, "egRates": [99, 99, 99, 99], "egLevels": [99, 99, 99, 0],
             "breakpoint": 39, "scaleLeftDepth": 0, "scaleRightDepth": 0,
             "scaleLeftCurve": 0, "scaleRightCurve": 0, "rateScaling": 0,
             "amSens": 0, "velSens": 0, "outputLevel": 0,
             "freqMode": 0, "freqCoarse": 1, "freqFine": 0, "detune": 7},
            {"enabled": true, "egRates": [99, 99, 99, 99], "egLevels": [99, 99, 99, 0],
             "breakpoint": 39, "scaleLeftDepth": 0, "scaleRightDepth": 0,
             "scaleLeftCurve": 0, "scaleRightCurve": 0, "rateScaling": 0,
             "amSens": 0, "velSens": 0, "outputLevel": 0,
             "freqMode": 0, "freqCoarse": 1, "freqFine": 0, "detune": 7},
            {"enabled": true, "egRates": [99, 99, 99, 99], "egLevels": [99, 99, 99, 0],
             "breakpoint": 39, "scaleLeftDepth": 0, "scaleRightDepth": 0,
             "scaleLeftCurve": 0, "scaleRightCurve": 0, "rateScaling": 0,
             "amSens": 0, "velSens": 0, "outputLevel": 0,
             "freqMode": 0, "freqCoarse": 1, "freqFine": 0, "detune": 7},
            {"enabled": false, "egRates": [99, 99, 99, 99], "egLevels": [99, 99, 99, 0],
             "breakpoint": 39, "scaleLeftDepth": 0, "scaleRightDepth": 0,
             "scaleLeftCurve": 0, "scaleRightCurve": 0, "rateScaling": 0,
             "amSens": 0, "velSens": 0, "outputLevel": 0,
             "freqMode": 1, "freqCoarse": 3, "freqFine": 12, "detune": 0}
          ]
        }
        """
        let patch = try JSONDecoder().decode(Patch.self, from: Data(json.utf8))
        XCTAssertEqual(patch.name, "WEB TEST")
        XCTAssertEqual(patch.ops[1].scaleRightCurve, 1)
        XCTAssertEqual(patch.ops[5].enabled, false)
        XCTAssertEqual(patch.ops[5].freqMode, 1)
        XCTAssertEqual(patch.ops[5].freqFine, 12)
    }

    func testConversions() {
        // rateToSeconds(64) = 0.028
        XCTAssertEqual(rateToSeconds(64), 0.028, accuracy: 1e-9)
        // levelToDb
        XCTAssertEqual(levelToDb(99), 0, accuracy: 1e-9)
        XCTAssertEqual(levelToDb(0), -74.25, accuracy: 1e-9)
        // describeFrequency: ratio mode coarse 0 -> 0.5
        XCTAssertEqual(describeFrequency(mode: 0, coarse: 0, fine: 0), "x0.50")
        XCTAssertEqual(describeFrequency(mode: 0, coarse: 14, fine: 0), "x14.00")
        // fixed mode: coarse 3 fine 0 -> 1000 Hz -> kHz display
        XCTAssertEqual(describeFrequency(mode: 1, coarse: 3, fine: 0), "1.00kHz")
        // lfoSpeedToHz
        XCTAssertEqual(lfoSpeedToHz(0), 0.062, accuracy: 1e-9)
        XCTAssertEqual(lfoSpeedToHz(11), 0.124, accuracy: 1e-9)
        // note names (MIDI 60 = C3, Yamaha convention)
        XCTAssertEqual(noteName(60), "C3")
        XCTAssertEqual(noteName(21), "A-1")
        XCTAssertEqual(breakpointName(39), "C3")
    }

    func testAlgorithmTables() {
        XCTAssertEqual(ALGORITHMS.count, 32)
        for (i, alg) in ALGORITHMS.enumerated() {
            XCTAssertEqual(alg.mods.count, 6, "alg \(i + 1)")
            XCTAssertFalse(alg.carriers.isEmpty, "alg \(i + 1)")
            XCTAssert((0..<6).contains(alg.fbOp), "alg \(i + 1)")
            XCTAssert((0..<6).contains(alg.fbSrc), "alg \(i + 1)")
            // modulators always have a higher index than the op they modulate
            for (op, mods) in alg.mods.enumerated() {
                for m in mods { XCTAssertGreaterThan(m, op, "alg \(i + 1): op \(op) modulated by \(m)") }
            }
        }
        // alg 32: all carriers, no modulation
        XCTAssertEqual(ALGORITHMS[31].carriers, [0, 1, 2, 3, 4, 5])
        // algs 4 & 6 have fbSrc != fbOp
        XCTAssertEqual(ALGORITHMS[3].fbOp, 5); XCTAssertEqual(ALGORITHMS[3].fbSrc, 3)
        XCTAssertEqual(ALGORITHMS[5].fbOp, 5); XCTAssertEqual(ALGORITHMS[5].fbSrc, 4)
    }

    func testAlgorithmLayoutProducesPositionsForAllOps() {
        for algIndex in 1...32 {
            let layout = algorithmLayout(algIndex)
            XCTAssertEqual(layout.count, 6, "alg \(algIndex)")
            let alg = ALGORITHMS[algIndex - 1]
            for c in alg.carriers {
                XCTAssertEqual(layout[c].row, 0, "alg \(algIndex): carrier \(c) must be row 0")
            }
        }
    }
}
