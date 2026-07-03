import XCTest
import Foundation
@testable import DX1Core

/// Replays tools/golden-master/scenarios against the Swift FMEngine and
/// asserts parity with the Float32 renders dumped from the UNMODIFIED web
/// worklet (render-golden.mjs). Run `node render-golden.mjs` first.
final class GoldenMasterTests: XCTestCase {

    // MARK: - Paths / fixtures

    static var goldenDir: URL {
        // .../Yamaha DX1/native-ios/DX1Core/Tests/DX1CoreTests/GoldenMasterTests.swift
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()  // -> DX1CoreTests
            .deletingLastPathComponent()  // -> Tests
            .deletingLastPathComponent()  // -> DX1Core
            .deletingLastPathComponent()  // -> native-ios
            .deletingLastPathComponent()  // -> Yamaha DX1
            .appendingPathComponent("tools/golden-master/golden")
    }

    struct PresetDump: Decodable {
        let FACTORY_PRESETS: [Patch]
        let INIT_VOICE: Patch
    }

    struct Event: Decodable {
        let atSample: Int
        let msg: Msg
    }

    struct Msg: Decodable {
        let type: String
        let note: Int?
        let velocity: Double?
        let semitones: Double?
        let value: Double?
        let on: Bool?
    }

    struct FunctionMsg: Decodable {
        let portamento: Double?
        let polyphony: Int?
        let mono: Bool?
    }

    struct Scenario: Decodable {
        let name: String
        let sampleRate: Double
        let blockSize: Int
        let totalSamples: Int
        let seed: UInt32
        let events: [Event]
        let file: String
        let peak: Double
        let rms: Double
        let function: FunctionMsg?
        // patch spec kept as raw JSON — resolved via resolvePatch
    }

    static var presets: PresetDump!
    static var manifest: [Scenario] = []
    static var rawManifest: [[String: Any]] = []

    override class func setUp() {
        super.setUp()
        let dec = JSONDecoder()
        guard let presetData = try? Data(contentsOf: goldenDir.appendingPathComponent("presets.json")),
              let manifestData = try? Data(contentsOf: goldenDir.appendingPathComponent("manifest.json"))
        else { return }
        presets = try? dec.decode(PresetDump.self, from: presetData)
        manifest = (try? dec.decode([Scenario].self, from: manifestData)) ?? []
        rawManifest = (try? JSONSerialization.jsonObject(with: manifestData) as? [[String: Any]]) ?? []
    }

    /// Resolve the scenario patch spec ('init' | 'preset:NAME' | {base, overrides, ops})
    /// exactly like render-golden.mjs resolvePatch.
    static func resolvePatch(_ spec: Any) throws -> Patch {
        if let s = spec as? String {
            if s == "init" { return presets.INIT_VOICE }
            if s.hasPrefix("preset:") {
                let name = String(s.dropFirst("preset:".count))
                guard let p = presets.FACTORY_PRESETS.first(where: { $0.name == name }) else {
                    throw NSError(domain: "golden", code: 1,
                                  userInfo: [NSLocalizedDescriptionKey: "unknown preset \(name)"])
                }
                return p
            }
        }
        guard let obj = spec as? [String: Any], let base = obj["base"] else {
            throw NSError(domain: "golden", code: 2,
                          userInfo: [NSLocalizedDescriptionKey: "bad patch spec"])
        }
        let basePatch = try resolvePatch(base)
        // merge via JSON dictionaries so override keys apply generically
        var dict = try JSONSerialization.jsonObject(
            with: JSONEncoder().encode(basePatch)) as! [String: Any]
        if let overrides = obj["overrides"] as? [String: Any] {
            for (k, v) in overrides { dict[k] = v }
        }
        if let opsOverrides = obj["ops"] as? [[String: Any]] {
            var ops = dict["ops"] as! [[String: Any]]
            for o in opsOverrides {
                let idx = o["index"] as! Int
                for (k, v) in (o["overrides"] as? [String: Any]) ?? [:] { ops[idx][k] = v }
            }
            dict["ops"] = ops
        }
        return try JSONDecoder().decode(
            Patch.self, from: JSONSerialization.data(withJSONObject: dict))
    }

    static func runScenario(_ scenario: Scenario, patchSpec: Any, blockSize: Int? = nil) throws -> [Float] {
        let engine = FMEngine(sampleRate: scenario.sampleRate)
        var rng = SeededRandom(seed: scenario.seed)
        engine.random = { rng.next() }
        engine.setPatch(try resolvePatch(patchSpec))
        if let f = scenario.function {
            engine.setFunction(portamento: f.portamento, polyphony: f.polyphony, mono: f.mono)
        }
        let block = blockSize ?? scenario.blockSize
        let total = scenario.totalSamples
        var out = [Float](repeating: 0, count: total)
        var events = scenario.events.sorted { $0.atSample < $1.atSample }
        var evIdx = 0
        var s = 0
        out.withUnsafeMutableBufferPointer { buf in
            while s < total {
                while evIdx < events.count && events[evIdx].atSample <= s {
                    apply(events[evIdx].msg, to: engine)
                    evIdx += 1
                }
                let n = min(block, total - s)
                engine.render(into: UnsafeMutableBufferPointer(rebasing: buf[s..<(s + n)]))
                s += n
            }
        }
        return out
    }

    static func apply(_ msg: Msg, to engine: FMEngine) {
        switch msg.type {
        case "noteOn": engine.noteOn(note: msg.note!, velocity: msg.velocity!)
        case "noteOff": engine.noteOff(note: msg.note!)
        case "pitchBend": engine.pitchBend = msg.semitones!
        case "modWheel": engine.modWheel = msg.value!
        case "sustain": engine.setSustain(msg.on!)
        case "allNotesOff": engine.allNotesOff()
        default: XCTFail("unknown message type \(msg.type)")
        }
    }

    static func loadGolden(_ file: String) throws -> [Float] {
        let data = try Data(contentsOf: goldenDir.appendingPathComponent(file))
        return data.withUnsafeBytes { raw in
            Array(raw.bindMemory(to: Float32.self))
        }
    }

    // MARK: - Tests

    func testGoldenFixturesPresent() throws {
        XCTAssertNotNil(Self.presets, "run `node tools/golden-master/render-golden.mjs` first")
        XCTAssertFalse(Self.manifest.isEmpty, "manifest.json missing/empty")
        XCTAssertEqual(Self.manifest.count, Self.rawManifest.count)
    }

    func testMulberry32MatchesJs() {
        var rng = SeededRandom(seed: 12345)
        let expected = [
            0.97972826776094735, 0.30675226449966431, 0.48420542152598500,
            0.81793441250920296, 0.50942836934700608,
        ]
        for e in expected {
            XCTAssertEqual(rng.next(), e, accuracy: 1e-16)
        }
    }

    func testFactoryPresetsMatchWebDump() throws {
        try XCTSkipIf(Self.presets == nil, "golden fixtures not rendered")
        XCTAssertEqual(Self.presets.FACTORY_PRESETS.count, FACTORY_PRESETS.count)
        for (web, swift) in zip(Self.presets.FACTORY_PRESETS, FACTORY_PRESETS) {
            XCTAssertEqual(web, swift, "preset \(web.name) differs from web source")
        }
        XCTAssertEqual(Self.presets.INIT_VOICE, INIT_VOICE)
    }

    func testAllGoldenMasters() throws {
        try XCTSkipIf(Self.presets == nil, "golden fixtures not rendered")
        let tolerance: Float = 1e-4
        var report: [(String, Float)] = []
        for (i, scenario) in Self.manifest.enumerated() {
            let patchSpec = Self.rawManifest[i]["patch"]!
            let rendered = try Self.runScenario(scenario, patchSpec: patchSpec)
            let golden = try Self.loadGolden(scenario.file)
            XCTAssertEqual(rendered.count, golden.count, scenario.name)

            var maxDiff: Float = 0
            var maxIdx = 0
            var sumSq: Double = 0
            var peak: Float = 0
            for j in 0..<golden.count {
                let d = abs(rendered[j] - golden[j])
                if d > maxDiff { maxDiff = d; maxIdx = j }
                sumSq += Double(rendered[j]) * Double(rendered[j])
                peak = max(peak, abs(rendered[j]))
            }
            let rms = (sumSq / Double(golden.count)).squareRoot()
            report.append((scenario.name, maxDiff))
            XCTAssertLessThan(
                maxDiff, tolerance,
                "\(scenario.name): max diff \(maxDiff) at sample \(maxIdx)")
            XCTAssertEqual(Double(peak), scenario.peak, accuracy: 1e-4, "\(scenario.name) peak")
            XCTAssertEqual(rms, scenario.rms, accuracy: 1e-4, "\(scenario.name) rms")
        }
        let worst = report.max { $0.1 < $1.1 }!
        print("golden-master parity: \(report.count) scenarios, worst max-diff \(worst.1) (\(worst.0))")
    }

    func testBlockSizeInvariance() throws {
        try XCTSkipIf(Self.presets == nil, "golden fixtures not rendered")
        guard let idx = Self.manifest.firstIndex(where: { $0.name == "block_invariance_ref" }) else {
            return XCTFail("block_invariance_ref scenario missing")
        }
        let scenario = Self.manifest[idx]
        let patchSpec = Self.rawManifest[idx]["patch"]!
        let ref = try Self.runScenario(scenario, patchSpec: patchSpec)
        for block in [64, 256, 512] {
            let alt = try Self.runScenario(scenario, patchSpec: patchSpec, blockSize: block)
            XCTAssertEqual(alt, ref, "render must be invariant to block size \(block)")
        }
    }

    func testVoiceStealingOldestNote() throws {
        try XCTSkipIf(Self.presets == nil, "golden fixtures not rendered")
        let engine = FMEngine(sampleRate: 44100)
        engine.setPatch(Self.presets.INIT_VOICE)
        engine.setFunction(polyphony: 2)
        engine.noteOn(note: 60, velocity: 1)
        engine.noteOn(note: 64, velocity: 1)
        engine.noteOn(note: 67, velocity: 1) // steals voice of note 60 (oldest)
        let activeNotes = Set(engine.voices.filter { $0.active }.map { $0.note })
        XCTAssertEqual(activeNotes, [64, 67])
    }
}
