/// Lock-free single-producer / single-consumer command ring for
/// UI-thread -> render-thread communication. POD payloads only:
/// no allocation, no locks, no ARC traffic on the consumer (render) side.

import Atomics

/// Plain-old-data command. Fits the whole M2 control surface; richer
/// whole-patch updates use the triple-buffer path (M4).
public struct EngineCommand: Sendable {
    public enum Kind: UInt8, Sendable {
        case noteOn        // a = MIDI note, b = velocity 0-1
        case noteOff       // a = MIDI note
        case setPreset     // a = factory preset index
        case allNotesOff
        case sustain       // a = 0/1
        case masterVolume  // b = 0-1
        case pitchBend     // b = semitones
        case modWheel      // b = 0-1
    }

    public var kind: Kind
    public var a: Int32
    public var b: Float

    public init(_ kind: Kind, a: Int32 = 0, b: Float = 0) {
        self.kind = kind
        self.a = a
        self.b = b
    }
}

/// Fixed-capacity SPSC ring. `push` is called from the UI thread,
/// `pop` from the audio render thread only.
public final class CommandQueue: @unchecked Sendable {
    private let capacity: Int
    private let mask: Int
    private let buffer: UnsafeMutablePointer<EngineCommand>
    private let head = ManagedAtomic<Int>(0)   // consumer index
    private let tail = ManagedAtomic<Int>(0)   // producer index

    /// - Parameter capacity: must be a power of two.
    public init(capacity: Int = 256) {
        precondition(capacity > 0 && (capacity & (capacity - 1)) == 0,
                     "capacity must be a power of two")
        self.capacity = capacity
        self.mask = capacity - 1
        self.buffer = UnsafeMutablePointer<EngineCommand>.allocate(capacity: capacity)
        buffer.initialize(repeating: EngineCommand(.allNotesOff), count: capacity)
    }

    deinit {
        buffer.deinitialize(count: capacity)
        buffer.deallocate()
    }

    /// UI thread. Returns false if the ring is full (command dropped).
    @discardableResult
    public func push(_ cmd: EngineCommand) -> Bool {
        let t = tail.load(ordering: .relaxed)
        let h = head.load(ordering: .acquiring)
        if t - h >= capacity { return false }
        buffer[t & mask] = cmd
        tail.store(t + 1, ordering: .releasing)
        return true
    }

    /// Render thread. Returns nil when empty.
    public func pop() -> EngineCommand? {
        let h = head.load(ordering: .relaxed)
        let t = tail.load(ordering: .acquiring)
        if h == t { return nil }
        let cmd = buffer[h & mask]
        head.store(h + 1, ordering: .releasing)
        return cmd
    }
}
