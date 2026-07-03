/// Factory bank — verbatim Swift port of the web app's `factoryPresets.ts`.
/// Op order in arrays: [OP1, OP2, OP3, OP4, OP5, OP6].

let E_PIANO_1: Patch = mkPatch(
    name: "E.PIANO 1",
    algorithm: 5,
    feedback: 6,
    lfoSpeed: 34, lfoDelay: 33, lfoPmd: 0, lfoAmd: 5,
    lfoWave: 4, lfoPitchModSens: 3,
    ops: [
        mkOp(egRates: [96, 25, 25, 67], egLevels: [99, 75, 0, 0],
             rateScaling: 3, velSens: 2, outputLevel: 99, freqCoarse: 1),
        mkOp(egRates: [95, 50, 35, 78], egLevels: [99, 75, 0, 0],
             breakpoint: 48, scaleRightDepth: 50, scaleRightCurve: 1,
             rateScaling: 3, velSens: 7, outputLevel: 58, freqCoarse: 14),
        mkOp(egRates: [95, 20, 20, 50], egLevels: [99, 95, 0, 0],
             rateScaling: 3, velSens: 2, outputLevel: 99, freqCoarse: 1),
        mkOp(egRates: [95, 29, 20, 50], egLevels: [99, 95, 0, 0],
             rateScaling: 3, velSens: 6, outputLevel: 89, freqCoarse: 1),
        mkOp(egRates: [95, 20, 20, 50], egLevels: [99, 95, 0, 0],
             rateScaling: 3, velSens: 0, outputLevel: 99, freqCoarse: 1),
        mkOp(egRates: [95, 29, 20, 50], egLevels: [99, 95, 0, 0],
             rateScaling: 3, velSens: 6, outputLevel: 79, freqCoarse: 1, detune: 0),
    ]
)

let FULLTINES: Patch = mkPatch(
    name: "FULLTINES",
    algorithm: 5,
    feedback: 5,
    lfoSpeed: 30, lfoDelay: 20, lfoAmd: 10, lfoWave: 4,
    ops: [
        mkOp(egRates: [96, 22, 22, 60], egLevels: [99, 85, 0, 0],
             rateScaling: 2, velSens: 3, outputLevel: 99, freqCoarse: 1, freqFine: 0),
        mkOp(egRates: [98, 60, 30, 70], egLevels: [99, 60, 0, 0],
             breakpoint: 48, scaleRightDepth: 40, scaleRightCurve: 1,
             rateScaling: 4, velSens: 7, outputLevel: 62, freqCoarse: 7, detune: 9),
        mkOp(egRates: [96, 20, 20, 55], egLevels: [99, 90, 0, 0],
             rateScaling: 2, velSens: 3, outputLevel: 99, freqCoarse: 1, freqFine: 1, detune: 5),
        mkOp(egRates: [97, 45, 25, 65], egLevels: [99, 70, 0, 0],
             rateScaling: 4, velSens: 6, outputLevel: 70, freqCoarse: 4),
        mkOp(egRates: [96, 20, 20, 55], egLevels: [99, 90, 0, 0],
             rateScaling: 2, velSens: 2, outputLevel: 98, freqCoarse: 1, freqFine: 0, detune: 9),
        mkOp(egRates: [97, 40, 22, 60], egLevels: [99, 80, 0, 0],
             rateScaling: 4, velSens: 6, outputLevel: 75, freqCoarse: 1, detune: 3),
    ]
)

let TUB_BELLS: Patch = mkPatch(
    name: "TUB BELLS",
    algorithm: 5,
    feedback: 7,
    lfoSpeed: 25, lfoDelay: 0, lfoAmd: 6, lfoWave: 4,
    ops: [
        mkOp(egRates: [95, 13, 20, 50], egLevels: [99, 92, 0, 0],
             rateScaling: 0, velSens: 2, outputLevel: 95, freqCoarse: 1, detune: 3),
        mkOp(egRates: [98, 12, 20, 50], egLevels: [99, 88, 0, 0],
             velSens: 5, outputLevel: 78, freqCoarse: 3, freqFine: 50, detune: 3),
        mkOp(egRates: [95, 13, 20, 50], egLevels: [99, 92, 0, 0],
             velSens: 2, outputLevel: 95, freqCoarse: 1, detune: 11),
        mkOp(egRates: [98, 12, 20, 50], egLevels: [99, 88, 0, 0],
             velSens: 5, outputLevel: 78, freqCoarse: 3, freqFine: 50, detune: 11),
        mkOp(egRates: [98, 12, 20, 50],
             outputLevel: 0, freqCoarse: 2),
        mkOp(egRates: [98, 25, 25, 60], egLevels: [99, 70, 0, 0],
             velSens: 6, outputLevel: 62, freqCoarse: 2, freqFine: 41, detune: 7),
    ]
)

let BASS_1: Patch = mkPatch(
    name: "BASS 1",
    algorithm: 16,
    feedback: 7,
    transpose: 12,
    ops: [
        mkOp(egRates: [99, 40, 25, 75], egLevels: [99, 90, 0, 0],
             rateScaling: 1, velSens: 1, outputLevel: 99, freqCoarse: 0, freqFine: 50),
        mkOp(egRates: [99, 60, 30, 80], egLevels: [99, 60, 0, 0],
             rateScaling: 2, velSens: 5, outputLevel: 80, freqCoarse: 0, freqFine: 50),
        mkOp(egRates: [99, 55, 28, 80], egLevels: [99, 55, 0, 0],
             rateScaling: 2, velSens: 4, outputLevel: 76, freqCoarse: 0, freqFine: 50),
        mkOp(egRates: [99, 70, 35, 85], egLevels: [99, 40, 0, 0],
             rateScaling: 3, velSens: 5, outputLevel: 68, freqCoarse: 1),
        mkOp(egRates: [99, 50, 28, 80], egLevels: [99, 65, 0, 0],
             rateScaling: 2, velSens: 3, outputLevel: 82, freqCoarse: 1),
        mkOp(egRates: [99, 75, 40, 85], egLevels: [99, 30, 0, 0],
             rateScaling: 3, velSens: 6, outputLevel: 72, freqCoarse: 1),
    ]
)

let SOLID_BASS: Patch = mkPatch(
    name: "SOLIDBASS",
    algorithm: 1,
    feedback: 6,
    transpose: 12,
    ops: [
        mkOp(egRates: [99, 35, 22, 80], egLevels: [99, 92, 0, 0],
             rateScaling: 1, velSens: 2, outputLevel: 99, freqCoarse: 0, freqFine: 50),
        mkOp(egRates: [99, 65, 30, 85], egLevels: [99, 45, 0, 0],
             rateScaling: 3, velSens: 6, outputLevel: 85, freqCoarse: 0, freqFine: 50),
        mkOp(egRates: [99, 35, 22, 80], egLevels: [99, 92, 0, 0],
             rateScaling: 1, velSens: 2, outputLevel: 99, freqCoarse: 0, freqFine: 50, detune: 8),
        mkOp(egRates: [99, 70, 32, 85], egLevels: [99, 40, 0, 0],
             rateScaling: 3, velSens: 5, outputLevel: 78, freqCoarse: 1),
        mkOp(egRates: [99, 80, 40, 90], egLevels: [99, 25, 0, 0],
             rateScaling: 4, velSens: 5, outputLevel: 70, freqCoarse: 1),
        mkOp(egRates: [99, 85, 45, 90], egLevels: [99, 15, 0, 0],
             rateScaling: 4, velSens: 7, outputLevel: 64, freqCoarse: 1),
    ]
)

let BRASS_1: Patch = mkPatch(
    name: "BRASS 1",
    algorithm: 22,
    feedback: 7,
    pitchEgRates: [84, 95, 95, 60], pitchEgLevels: [48, 50, 50, 50],
    lfoSpeed: 37, lfoDelay: 40, lfoPmd: 8, lfoAmd: 0,
    lfoWave: 4, lfoPitchModSens: 3,
    ops: [
        mkOp(egRates: [72, 76, 20, 50], egLevels: [99, 88, 96, 0],
             rateScaling: 0, velSens: 2, outputLevel: 99, freqCoarse: 1),
        mkOp(egRates: [62, 51, 20, 50], egLevels: [99, 88, 96, 0],
             velSens: 2, outputLevel: 98, freqCoarse: 1, detune: 10),
        mkOp(egRates: [72, 76, 20, 50], egLevels: [99, 88, 96, 0],
             velSens: 2, outputLevel: 99, freqCoarse: 1, detune: 4),
        mkOp(egRates: [62, 51, 20, 50], egLevels: [99, 88, 96, 0],
             velSens: 2, outputLevel: 98, freqCoarse: 1, detune: 10),
        mkOp(egRates: [77, 76, 20, 50], egLevels: [99, 88, 96, 0],
             velSens: 2, outputLevel: 98, freqCoarse: 1, detune: 6),
        mkOp(egRates: [49, 99, 28, 68], egLevels: [98, 98, 91, 0],
             rateScaling: 2, velSens: 4, outputLevel: 78, freqCoarse: 1),
    ]
)

let STRINGS_1: Patch = mkPatch(
    name: "STRINGS 1",
    algorithm: 2,
    feedback: 7,
    lfoSpeed: 32, lfoDelay: 45, lfoPmd: 15, lfoAmd: 0,
    lfoWave: 4, lfoPitchModSens: 2,
    ops: [
        mkOp(egRates: [45, 30, 20, 40], egLevels: [99, 95, 95, 0],
             velSens: 1, outputLevel: 99, freqCoarse: 1),
        mkOp(egRates: [40, 30, 20, 40], egLevels: [99, 90, 90, 0],
             velSens: 2, outputLevel: 78, freqCoarse: 1, detune: 9),
        mkOp(egRates: [45, 30, 20, 40], egLevels: [99, 95, 95, 0],
             velSens: 1, outputLevel: 99, freqCoarse: 1, freqFine: 1, detune: 5),
        mkOp(egRates: [45, 35, 20, 40], egLevels: [99, 90, 90, 0],
             velSens: 2, outputLevel: 62, freqCoarse: 3),
        mkOp(egRates: [45, 35, 20, 40], egLevels: [99, 90, 90, 0],
             velSens: 2, outputLevel: 70, freqCoarse: 1, detune: 10),
        mkOp(egRates: [45, 35, 20, 40], egLevels: [99, 90, 90, 0],
             velSens: 3, outputLevel: 55, freqCoarse: 2, detune: 4),
    ]
)

let MARIMBA: Patch = mkPatch(
    name: "MARIMBA",
    algorithm: 5,
    feedback: 3,
    ops: [
        mkOp(egRates: [99, 45, 30, 70], egLevels: [99, 60, 0, 0],
             rateScaling: 4, velSens: 3, outputLevel: 99, freqCoarse: 1),
        mkOp(egRates: [99, 70, 40, 80], egLevels: [99, 30, 0, 0],
             rateScaling: 5, velSens: 6, outputLevel: 55, freqCoarse: 4),
        mkOp(egRates: [99, 50, 32, 70], egLevels: [99, 50, 0, 0],
             rateScaling: 4, velSens: 3, outputLevel: 90, freqCoarse: 1, detune: 9),
        mkOp(egRates: [99, 85, 50, 90], egLevels: [99, 10, 0, 0],
             rateScaling: 6, velSens: 7, outputLevel: 48, freqCoarse: 10),
        mkOp(outputLevel: 0, freqCoarse: 1, freqFine: 2),
        mkOp(outputLevel: 0, freqCoarse: 13),
    ]
)

let FLUTE_1: Patch = mkPatch(
    name: "FLUTE 1",
    algorithm: 8,
    feedback: 4,
    pitchEgRates: [90, 99, 99, 99], pitchEgLevels: [52, 50, 50, 50],
    lfoSpeed: 40, lfoDelay: 55, lfoPmd: 10, lfoAmd: 8,
    lfoWave: 4, lfoPitchModSens: 2,
    ops: [
        mkOp(egRates: [70, 30, 20, 55], egLevels: [99, 97, 97, 0],
             velSens: 1, outputLevel: 99, freqCoarse: 1),
        mkOp(egRates: [85, 40, 20, 60], egLevels: [99, 80, 80, 0],
             velSens: 3, outputLevel: 50, freqCoarse: 2),
        mkOp(egRates: [65, 30, 20, 55], egLevels: [99, 95, 95, 0],
             velSens: 1, outputLevel: 88, freqCoarse: 1, detune: 8),
        mkOp(egRates: [90, 40, 20, 60], egLevels: [99, 85, 85, 0],
             velSens: 2, outputLevel: 58, freqCoarse: 1),
        mkOp(egRates: [80, 40, 20, 60], egLevels: [99, 80, 80, 0],
             amSens: 2, outputLevel: 40, freqCoarse: 4),
        mkOp(egRates: [99, 40, 20, 60], egLevels: [99, 80, 80, 0],
             amSens: 3, outputLevel: 46, freqCoarse: 0, freqFine: 50),
    ]
)

let GLASS_PAD: Patch = mkPatch(
    name: "GLASS PAD",
    algorithm: 19,
    feedback: 6,
    lfoSpeed: 28, lfoDelay: 30, lfoPmd: 12, lfoAmd: 0,
    lfoWave: 4, lfoPitchModSens: 2,
    ops: [
        mkOp(egRates: [40, 25, 20, 35], egLevels: [99, 95, 95, 0],
             velSens: 1, outputLevel: 99, freqCoarse: 1),
        mkOp(egRates: [35, 25, 20, 40], egLevels: [99, 85, 85, 0],
             velSens: 3, outputLevel: 60, freqCoarse: 5),
        mkOp(egRates: [40, 25, 20, 40], egLevels: [99, 85, 85, 0],
             velSens: 2, outputLevel: 55, freqCoarse: 2),
        mkOp(egRates: [38, 25, 20, 35], egLevels: [99, 95, 95, 0],
             velSens: 1, outputLevel: 92, freqCoarse: 2, detune: 10),
        mkOp(egRates: [42, 25, 20, 35], egLevels: [99, 95, 95, 0],
             velSens: 1, outputLevel: 90, freqCoarse: 1, freqFine: 0, detune: 4),
        mkOp(egRates: [45, 30, 20, 45], egLevels: [99, 80, 80, 0],
             velSens: 4, outputLevel: 52, freqCoarse: 7),
    ]
)

let HARPSICH: Patch = mkPatch(
    name: "HARPSICH",
    algorithm: 5,
    feedback: 7,
    ops: [
        mkOp(egRates: [99, 30, 25, 80], egLevels: [99, 80, 0, 0],
             rateScaling: 3, velSens: 2, outputLevel: 95, freqCoarse: 2),
        mkOp(egRates: [99, 45, 30, 85], egLevels: [99, 55, 0, 0],
             rateScaling: 4, velSens: 4, outputLevel: 68, freqCoarse: 6),
        mkOp(egRates: [99, 32, 25, 80], egLevels: [99, 78, 0, 0],
             rateScaling: 3, velSens: 2, outputLevel: 92, freqCoarse: 1),
        mkOp(egRates: [99, 50, 32, 85], egLevels: [99, 45, 0, 0],
             rateScaling: 4, velSens: 4, outputLevel: 60, freqCoarse: 8),
        mkOp(egRates: [99, 55, 35, 85], egLevels: [99, 40, 0, 0],
             rateScaling: 4, velSens: 3, outputLevel: 55, freqCoarse: 4),
        mkOp(outputLevel: 0, freqCoarse: 1),
    ]
)

let PIPES_1: Patch = mkPatch(
    name: "PIPES 1",
    algorithm: 32,
    feedback: 2,
    lfoSpeed: 30, lfoDelay: 0, lfoAmd: 4, lfoWave: 4,
    ops: [
        mkOp(egRates: [75, 20, 20, 60], egLevels: [99, 99, 99, 0],
             outputLevel: 96, freqCoarse: 0, freqFine: 50),
        mkOp(egRates: [75, 20, 20, 60], egLevels: [99, 99, 99, 0],
             outputLevel: 92, freqCoarse: 1),
        mkOp(egRates: [72, 20, 20, 60], egLevels: [99, 99, 99, 0],
             outputLevel: 84, freqCoarse: 2, detune: 8),
        mkOp(egRates: [70, 20, 20, 60], egLevels: [99, 99, 99, 0],
             outputLevel: 74, freqCoarse: 4, detune: 6),
        mkOp(egRates: [68, 20, 20, 60], egLevels: [99, 99, 99, 0],
             outputLevel: 60, freqCoarse: 8),
        mkOp(egRates: [70, 20, 20, 60], egLevels: [99, 99, 99, 0],
             outputLevel: 55, freqCoarse: 3, detune: 9),
    ]
)

let SYN_LEAD: Patch = mkPatch(
    name: "SYN-LEAD",
    algorithm: 18,
    feedback: 7,
    lfoSpeed: 36, lfoDelay: 50, lfoPmd: 20,
    lfoWave: 0, lfoPitchModSens: 3,
    ops: [
        mkOp(egRates: [90, 30, 20, 60], egLevels: [99, 95, 95, 0],
             velSens: 2, outputLevel: 99, freqCoarse: 1),
        mkOp(egRates: [85, 30, 20, 60], egLevels: [99, 90, 90, 0],
             velSens: 3, outputLevel: 80, freqCoarse: 1, detune: 10),
        mkOp(egRates: [85, 30, 20, 60], egLevels: [99, 88, 88, 0],
             velSens: 3, outputLevel: 76, freqCoarse: 1, detune: 4),
        mkOp(egRates: [80, 35, 22, 60], egLevels: [99, 85, 85, 0],
             velSens: 3, outputLevel: 65, freqCoarse: 2),
        mkOp(egRates: [80, 40, 25, 65], egLevels: [99, 75, 75, 0],
             velSens: 4, outputLevel: 55, freqCoarse: 3),
        mkOp(egRates: [80, 45, 28, 65], egLevels: [99, 70, 70, 0],
             velSens: 4, outputLevel: 50, freqCoarse: 1),
    ]
)

let CLAV_1: Patch = mkPatch(
    name: "CLAV 1",
    algorithm: 3,
    feedback: 6,
    ops: [
        mkOp(egRates: [99, 40, 24, 75], egLevels: [99, 75, 0, 0],
             rateScaling: 2, velSens: 3, outputLevel: 99, freqCoarse: 1),
        mkOp(egRates: [99, 60, 30, 80], egLevels: [99, 50, 0, 0],
             rateScaling: 3, velSens: 6, outputLevel: 74, freqCoarse: 3),
        mkOp(egRates: [99, 80, 40, 85], egLevels: [99, 20, 0, 0],
             rateScaling: 4, velSens: 7, outputLevel: 52, freqCoarse: 7),
        mkOp(egRates: [99, 42, 24, 75], egLevels: [99, 72, 0, 0],
             rateScaling: 2, velSens: 3, outputLevel: 95, freqCoarse: 1, detune: 9),
        mkOp(egRates: [99, 65, 32, 80], egLevels: [99, 40, 0, 0],
             rateScaling: 3, velSens: 6, outputLevel: 66, freqCoarse: 4),
        mkOp(egRates: [99, 85, 45, 88], egLevels: [99, 12, 0, 0],
             rateScaling: 5, velSens: 7, outputLevel: 48, freqCoarse: 9),
    ]
)

let VIBES: Patch = mkPatch(
    name: "VIBES",
    algorithm: 5,
    feedback: 4,
    lfoSpeed: 45, lfoDelay: 0, lfoAmd: 35, lfoWave: 4,
    ops: [
        mkOp(egRates: [99, 22, 20, 55], egLevels: [99, 90, 0, 0],
             rateScaling: 2, amSens: 2, velSens: 3, outputLevel: 99, freqCoarse: 1),
        mkOp(egRates: [99, 55, 32, 75], egLevels: [99, 35, 0, 0],
             rateScaling: 4, velSens: 6, outputLevel: 52, freqCoarse: 4),
        mkOp(egRates: [99, 24, 20, 55], egLevels: [99, 88, 0, 0],
             rateScaling: 2, amSens: 2, velSens: 3, outputLevel: 94, freqCoarse: 1, detune: 9),
        mkOp(egRates: [99, 80, 45, 88], egLevels: [99, 8, 0, 0],
             rateScaling: 5, velSens: 7, outputLevel: 44, freqCoarse: 10),
        mkOp(outputLevel: 0, freqCoarse: 1),
        mkOp(outputLevel: 0, freqCoarse: 1),
    ]
)

let WURLI: Patch = mkPatch(
    name: "WURLI EP",
    algorithm: 5,
    feedback: 5,
    lfoSpeed: 42, lfoDelay: 0, lfoAmd: 20, lfoWave: 4,
    ops: [
        mkOp(egRates: [96, 24, 22, 62], egLevels: [99, 80, 0, 0],
             rateScaling: 2, amSens: 1, velSens: 3, outputLevel: 99, freqCoarse: 1),
        mkOp(egRates: [97, 45, 28, 70], egLevels: [99, 55, 0, 0],
             rateScaling: 3, velSens: 6, outputLevel: 76, freqCoarse: 1),
        mkOp(egRates: [96, 24, 22, 62], egLevels: [99, 78, 0, 0],
             rateScaling: 2, amSens: 1, velSens: 3, outputLevel: 96, freqCoarse: 1, freqFine: 1, detune: 8),
        mkOp(egRates: [98, 70, 38, 80], egLevels: [99, 25, 0, 0],
             rateScaling: 4, velSens: 7, outputLevel: 58, freqCoarse: 5),
        mkOp(outputLevel: 0, freqCoarse: 1),
        mkOp(outputLevel: 0, freqCoarse: 1),
    ]
)

public let FACTORY_PRESETS: [Patch] = [
    E_PIANO_1, FULLTINES, WURLI, TUB_BELLS, VIBES, MARIMBA,
    BASS_1, SOLID_BASS, CLAV_1, HARPSICH,
    BRASS_1, STRINGS_1, GLASS_PAD, PIPES_1, FLUTE_1, SYN_LEAD,
    INIT_VOICE,
]
