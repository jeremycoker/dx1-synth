/** Web MIDI input: note on/off, velocity, mod wheel (CC1), sustain (CC64), pitch bend. */

export interface MidiHandlers {
  noteOn: (note: number, velocity: number) => void;
  noteOff: (note: number) => void;
  pitchBend: (normalized: number) => void; // -1..1
  modWheel: (value: number) => void;       // 0..1
  sustain: (on: boolean) => void;
}

export async function initMidi(handlers: MidiHandlers): Promise<string[]> {
  if (!navigator.requestMIDIAccess) return [];
  const access = await navigator.requestMIDIAccess();
  const names: string[] = [];

  const attach = (input: MIDIInput) => {
    names.push(input.name || 'MIDI Input');
    input.onmidimessage = (e: MIDIMessageEvent) => {
      const data = e.data;
      if (!data || data.length < 2) return;
      const status = data[0] & 0xf0;
      switch (status) {
        case 0x90:
          if (data[2] > 0) handlers.noteOn(data[1], data[2] / 127);
          else handlers.noteOff(data[1]);
          break;
        case 0x80:
          handlers.noteOff(data[1]);
          break;
        case 0xb0:
          if (data[1] === 1) handlers.modWheel(data[2] / 127);
          else if (data[1] === 64) handlers.sustain(data[2] >= 64);
          break;
        case 0xe0: {
          const raw = (data[2] << 7) | data[1];
          handlers.pitchBend((raw - 8192) / 8192);
          break;
        }
      }
    };
  };

  access.inputs.forEach(attach);
  access.onstatechange = (e) => {
    const port = e.port;
    if (port && port.type === 'input' && port.state === 'connected') {
      attach(port as MIDIInput);
    }
  };
  return names;
}
