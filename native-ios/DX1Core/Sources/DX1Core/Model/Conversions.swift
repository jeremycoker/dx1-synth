/// DX parameter -> human-readable / DSP value conversions (UI display helpers).
/// Verbatim port of the web app's `src/engine/conversions.ts`.

import Foundation

/// EG rate 0-99 -> approximate seconds to traverse full level range
public func rateToSeconds(_ rate: Double) -> Double {
    pow(2, (64 - rate) / 6) * 0.028
}

/// DX output level 0-99 -> dB relative to full scale (~0.75 dB per step)
public func levelToDb(_ level: Double) -> Double {
    (level - 99) * 0.75
}

/// Operator frequency description for LED/LCD display
public func describeFrequency(mode: Int, coarse: Double, fine: Double) -> String {
    if mode == 1 {
        let hz = pow(10, coarse.truncatingRemainder(dividingBy: 4)) * pow(10, fine / 100)
        return hz >= 1000
            ? String(format: "%.2fkHz", hz / 1000)
            : String(format: "%.2fHz", hz)
    }
    let ratio = (coarse == 0 ? 0.5 : coarse) * (1 + fine / 100)
    return String(format: "x%.2f", ratio)
}

/// LFO speed 0-99 -> Hz (approximation of DX7 LFO table: ~0.06 Hz .. ~47 Hz)
public func lfoSpeedToHz(_ speed: Double) -> Double {
    if speed <= 0 { return 0.062 }
    return 0.062 * pow(2, speed / 11)
}

public let NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

/// MIDI note -> name like C3 (Yamaha convention: middle C / MIDI 60 = C3)
public func noteName(_ midi: Int) -> String {
    "\(NOTE_NAMES[midi % 12])\(midi / 12 - 2)"
}

/// Scaling breakpoint 0-99 -> note name (39 = C3 = MIDI 60)
public func breakpointName(_ bp: Int) -> String {
    noteName(bp + 21)
}

public let CURVE_NAMES = ["-LIN", "-EXP", "+EXP", "+LIN"]
public let LFO_WAVE_NAMES = ["TRIANGL", "SAW DWN", "SAW UP", "SQUARE", "SINE", "S/HOLD"]
