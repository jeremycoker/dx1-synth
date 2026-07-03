import AVFoundation

enum AudioSessionManager {
    /// Playback category, low-latency buffer. Call before starting the engine.
    static func configure() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playback, mode: .default)
            // ~5.3 ms at 48 kHz; the HW may round up
            try session.setPreferredIOBufferDuration(256.0 / 48_000.0)
            try session.setActive(true)
        } catch {
            print("AudioSession configuration failed: \(error)")
        }
    }
}
