import AVFoundation
import Combine
import DX1Core

/// Owns the AVAudioEngine graph and the render kernel. All control flows
/// from the UI through the lock-free CommandQueue; the render closure never
/// locks or allocates.
final class AudioEngineController: ObservableObject {
    @Published var presetIndex: Int = 0 {
        didSet { commands.push(EngineCommand(.setPreset, a: Int32(presetIndex))) }
    }
    @Published var masterVolume: Double = 0.8 {
        didSet { commands.push(EngineCommand(.masterVolume, b: Float(masterVolume))) }
    }
    @Published private(set) var isRunning = false

    let presetNames: [String] = FACTORY_PRESETS.map { $0.name }

    private let avEngine = AVAudioEngine()
    private let commands = CommandQueue()
    private var kernel: RenderKernel?
    private var sourceNode: AVAudioSourceNode?

    func start() {
        guard !isRunning else { return }
        AudioSessionManager.configure()

        let sampleRate = avEngine.outputNode.outputFormat(forBus: 0).sampleRate
        let sr = sampleRate > 0 ? sampleRate : 48_000
        guard let format = AVAudioFormat(standardFormatWithSampleRate: sr, channels: 2) else { return }

        let kernel = RenderKernel(sampleRate: sr, commands: commands)
        self.kernel = kernel

        // The closure captures `kernel` once (single retain at setup);
        // per-callback work is allocation- and lock-free.
        let node = AVAudioSourceNode(format: format) { _, _, frameCount, audioBufferList -> OSStatus in
            let abl = UnsafeMutableAudioBufferListPointer(audioBufferList)
            let n = Int(frameCount)
            guard abl.count >= 2,
                  let lRaw = abl[0].mData,
                  let rRaw = abl[1].mData else { return noErr }
            let l = lRaw.bindMemory(to: Float.self, capacity: n)
            let r = rRaw.bindMemory(to: Float.self, capacity: n)
            kernel.render(outL: UnsafeMutableBufferPointer(start: l, count: n),
                          outR: UnsafeMutableBufferPointer(start: r, count: n))
            return noErr
        }
        sourceNode = node
        avEngine.attach(node)
        avEngine.connect(node, to: avEngine.mainMixerNode, format: format)

        do {
            try avEngine.start()
            isRunning = true
        } catch {
            print("AVAudioEngine start failed: \(error)")
        }
    }

    // MARK: - Play surface

    func noteOn(_ note: Int, velocity: Double) {
        commands.push(EngineCommand(.noteOn, a: Int32(note), b: Float(velocity)))
    }

    func noteOff(_ note: Int) {
        commands.push(EngineCommand(.noteOff, a: Int32(note)))
    }

    func allNotesOff() {
        commands.push(EngineCommand(.allNotesOff))
    }
}

/// Everything the audio render thread touches. Created once at engine start
/// with the hardware sample rate.
final class RenderKernel {
    private let engine: FMEngine
    private let fx: EffectsChain
    private let commands: CommandQueue
    private var mono = [Float](repeating: 0, count: 4096)

    init(sampleRate: Double, commands: CommandQueue) {
        self.engine = FMEngine(sampleRate: sampleRate)
        self.fx = EffectsChain(sampleRate: sampleRate, params: .default)
        self.commands = commands
        engine.setPatch(FACTORY_PRESETS[0])
        fx.setMasterVolume(0.8)
    }

    private func drainCommands() {
        while let c = commands.pop() {
            switch c.kind {
            case .noteOn: engine.noteOn(note: Int(c.a), velocity: Double(c.b))
            case .noteOff: engine.noteOff(note: Int(c.a))
            case .setPreset:
                let i = Int(c.a)
                if i >= 0 && i < FACTORY_PRESETS.count {
                    engine.allNotesOff()
                    engine.setPatch(FACTORY_PRESETS[i])
                }
            case .allNotesOff: engine.allNotesOff()
            case .sustain: engine.setSustain(c.a != 0)
            case .masterVolume: fx.setMasterVolume(Double(c.b))
            case .pitchBend: engine.pitchBend = Double(c.b)
            case .modWheel: engine.modWheel = Double(c.b)
            }
        }
    }

    func render(outL: UnsafeMutableBufferPointer<Float>,
                outR: UnsafeMutableBufferPointer<Float>) {
        drainCommands()
        let frames = outL.count
        var done = 0
        while done < frames {
            let n = min(frames - done, mono.count)
            mono.withUnsafeMutableBufferPointer { mb in
                let chunk = UnsafeMutableBufferPointer<Float>(rebasing: mb[0..<n])
                engine.render(into: chunk)
                for i in 0..<n {
                    let (l, r) = fx.process(chunk[i])
                    outL[done + i] = l
                    outR[done + i] = r
                }
            }
            done += n
        }
    }
}
