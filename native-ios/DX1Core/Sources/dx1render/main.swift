/// dx1render — offline CLI renderer for ear A/B against the web app.
/// Renders a short phrase for every factory preset through the FMEngine +
/// EffectsChain (default effects, like the web app on load) to stereo WAVs.
///
/// Usage: dx1render [outputDir]   (default ./renders)

import DX1Core
import Foundation

let sr: Double = 44100
let outDir = URL(fileURLWithPath: CommandLine.arguments.count > 1
    ? CommandLine.arguments[1] : "renders")
try FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

// phrase: rolled C-major chord, held, then released
let phrase: [(time: Double, note: Int, on: Bool)] = [
    (0.00, 48, true), (0.25, 60, true), (0.50, 64, true), (0.75, 67, true),
    (2.50, 48, false), (2.50, 60, false), (2.50, 64, false), (2.50, 67, false),
]
let totalSeconds = 4.5
let velocity = 0.8
let block = 128

for (i, patch) in FACTORY_PRESETS.enumerated() {
    let engine = FMEngine(sampleRate: sr)
    engine.setPatch(patch)
    let fx = EffectsChain(sampleRate: sr)
    fx.setMasterVolume(FunctionParams.default.masterVolume)

    let total = Int(totalSeconds * sr)
    var mono = [Float](repeating: 0, count: block)
    var left = [Float](repeating: 0, count: total)
    var right = [Float](repeating: 0, count: total)
    var events = phrase.map { (sample: Int($0.time * sr), note: $0.note, on: $0.on) }
        .sorted { $0.sample < $1.sample }
    var evIdx = 0

    var s = 0
    while s < total {
        while evIdx < events.count && events[evIdx].sample <= s {
            let e = events[evIdx]
            if e.on { engine.noteOn(note: e.note, velocity: velocity) }
            else { engine.noteOff(note: e.note) }
            evIdx += 1
        }
        let n = min(block, total - s)
        mono.withUnsafeMutableBufferPointer { buf in
            engine.render(into: UnsafeMutableBufferPointer(rebasing: buf[0..<n]))
        }
        for j in 0..<n {
            let (l, r) = fx.process(mono[j])
            left[s + j] = l
            right[s + j] = r
        }
        s += n
    }

    let safeName = patch.name.replacingOccurrences(of: "/", with: "-")
    let file = outDir.appendingPathComponent(
        String(format: "%02d %@.wav", i + 1, safeName))
    try WavWriter.write(url: file, sampleRate: sr, channels: [left, right])
    let peak = max(abs(left.min() ?? 0), left.max() ?? 0)
    print(String(format: "%2d  %-10@  peak %.4f  -> %@", i + 1, patch.name, peak, file.lastPathComponent))
}
print("\nDone. A/B these against the web app with the same phrase.")
