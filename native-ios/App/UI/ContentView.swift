import SwiftUI
import DX1Core

/// M2 placeholder panel: preset picker + volume + two octaves of keys.
/// The full skeuomorphic panel and UIKit keybed land in M3.
struct ContentView: View {
    @EnvironmentObject var audio: AudioEngineController

    var body: some View {
        VStack(spacing: 16) {
            header
            Spacer(minLength: 0)
            KeybedPlaceholderView(lowNote: 48, octaves: 2)
                .frame(maxHeight: 320)
                .padding(.horizontal, 12)
                .padding(.bottom, 16)
        }
        .background(Color(red: 0.10, green: 0.09, blue: 0.08))
    }

    private var header: some View {
        HStack(spacing: 20) {
            Text("YAMAHA DX1")
                .font(.system(size: 22, weight: .heavy, design: .serif))
                .foregroundColor(Color(red: 0.85, green: 0.75, blue: 0.55))

            Picker("Preset", selection: $audio.presetIndex) {
                ForEach(0..<audio.presetNames.count, id: \.self) { i in
                    Text(audio.presetNames[i]).tag(i)
                }
            }
            .pickerStyle(.menu)
            .tint(Color(red: 0.4, green: 0.9, blue: 0.6))

            HStack(spacing: 8) {
                Text("VOLUME")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.gray)
                Slider(value: $audio.masterVolume, in: 0...1)
                    .frame(width: 160)
            }

            Spacer()

            Text(audio.isRunning ? "AUDIO OK" : "AUDIO OFF")
                .font(.system(size: 11, weight: .bold, design: .monospaced))
                .foregroundColor(audio.isRunning ? .green : .red)
        }
        .padding(.horizontal, 20)
        .padding(.top, 16)
    }
}

/// Simple SwiftUI keybed — good enough for the M2 sound check.
struct KeybedPlaceholderView: View {
    @EnvironmentObject var audio: AudioEngineController
    let lowNote: Int
    let octaves: Int

    private static let blackInOctave: Set<Int> = [1, 3, 6, 8, 10]

    var body: some View {
        GeometryReader { geo in
            let whites = whiteNotes()
            let whiteW = geo.size.width / CGFloat(whites.count)
            ZStack(alignment: .topLeading) {
                HStack(spacing: 1) {
                    ForEach(whites, id: \.self) { note in
                        KeyView(note: note, isBlack: false)
                    }
                }
                ForEach(blackNotes(), id: \.self) { note in
                    KeyView(note: note, isBlack: true)
                        .frame(width: whiteW * 0.62, height: geo.size.height * 0.6)
                        .offset(x: blackOffset(note: note, whiteW: whiteW))
                }
            }
        }
    }

    private func whiteNotes() -> [Int] {
        (0...(octaves * 12)).map { lowNote + $0 }
            .filter { !Self.blackInOctave.contains($0 % 12) }
    }

    private func blackNotes() -> [Int] {
        (0..<(octaves * 12)).map { lowNote + $0 }
            .filter { Self.blackInOctave.contains($0 % 12) }
    }

    private func blackOffset(note: Int, whiteW: CGFloat) -> CGFloat {
        // count white keys strictly below this note
        let below = (lowNote..<note).filter { !Self.blackInOctave.contains($0 % 12) }.count
        return CGFloat(below) * whiteW - whiteW * 0.31
    }
}

struct KeyView: View {
    @EnvironmentObject var audio: AudioEngineController
    let note: Int
    let isBlack: Bool
    @State private var pressed = false

    var body: some View {
        RoundedRectangle(cornerRadius: 3)
            .fill(fillColor)
            .overlay(
                RoundedRectangle(cornerRadius: 3)
                    .stroke(Color.black.opacity(0.8), lineWidth: 1)
            )
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { _ in
                        if !pressed {
                            pressed = true
                            audio.noteOn(note, velocity: 0.8)
                        }
                    }
                    .onEnded { _ in
                        pressed = false
                        audio.noteOff(note)
                    }
            )
    }

    private var fillColor: Color {
        if pressed { return Color(red: 0.4, green: 0.85, blue: 0.6) }
        return isBlack ? Color(white: 0.12) : Color(white: 0.92)
    }
}
