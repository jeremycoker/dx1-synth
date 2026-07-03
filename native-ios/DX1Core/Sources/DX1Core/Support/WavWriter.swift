/// Minimal 16-bit PCM WAV writer for offline renders (dx1render ear checks).

import Foundation

public enum WavWriter {
    public static func write(url: URL, sampleRate: Double, channels: [[Float]]) throws {
        precondition(!channels.isEmpty)
        let numChannels = channels.count
        let frames = channels[0].count
        precondition(channels.allSatisfy { $0.count == frames })

        let bytesPerSample = 2
        let dataSize = frames * numChannels * bytesPerSample
        let byteRate = Int(sampleRate) * numChannels * bytesPerSample

        var data = Data(capacity: 44 + dataSize)
        func append(_ s: String) { data.append(contentsOf: s.utf8) }
        func appendU32(_ v: UInt32) { withUnsafeBytes(of: v.littleEndian) { data.append(contentsOf: $0) } }
        func appendU16(_ v: UInt16) { withUnsafeBytes(of: v.littleEndian) { data.append(contentsOf: $0) } }

        append("RIFF"); appendU32(UInt32(36 + dataSize)); append("WAVE")
        append("fmt "); appendU32(16); appendU16(1) // PCM
        appendU16(UInt16(numChannels)); appendU32(UInt32(sampleRate))
        appendU32(UInt32(byteRate)); appendU16(UInt16(numChannels * bytesPerSample)); appendU16(16)
        append("data"); appendU32(UInt32(dataSize))

        for f in 0..<frames {
            for ch in 0..<numChannels {
                let clamped = max(-1, min(1, channels[ch][f]))
                let s = Int16(clamping: Int(Double(clamped) * 32767.0))
                withUnsafeBytes(of: s.littleEndian) { data.append(contentsOf: $0) }
            }
        }
        try data.write(to: url)
    }
}
