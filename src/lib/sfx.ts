// Rotom's non-verbal sounds, synthesised with Web Audio so there is nothing to
// download. The "BZZZT!" that opens every report is the buzz() here: speech
// engines spell that word out letter by letter, a real buzz sounds right.

type AudioContextCtor = typeof AudioContext

let context: AudioContext | null = null

/** The page's one audio context (null where Web Audio is missing). Rotom's voice is mixed through it too. */
export function audio(): AudioContext | null {
  try {
    const Ctor: AudioContextCtor | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
    if (!Ctor) return null
    context ??= new Ctor()
    if (context.state === 'suspended') void context.resume()
    return context
  } catch {
    return null
  }
}

interface Tone {
  type: OscillatorType
  /** Frequency at the start and end of the tone, in Hz. */
  from: number
  to: number
  /** Seconds after "now" that the tone starts. */
  at: number
  duration: number
  gain: number
}

function play(tones: Tone[], level = 1) {
  const ctx = audio()
  if (!ctx || level <= 0) return
  const now = ctx.currentTime
  for (const tone of tones) {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    const start = now + tone.at
    oscillator.type = tone.type
    oscillator.frequency.setValueAtTime(tone.from, start)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, tone.to), start + tone.duration)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(tone.gain * level, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration)
    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start(start)
    oscillator.stop(start + tone.duration + 0.03)
  }
}

export const sfx = {
  /** Call from a click or key press so the browser allows sound afterwards. */
  unlock: () => void audio(),

  /** The electric "BZZZT!": two detuned saws grinding against each other. `level` follows the voice's volume. */
  buzz: (level = 1) =>
    play(
      [
      { type: 'sawtooth', from: 180, to: 120, at: 0, duration: 0.24, gain: 0.05 },
      { type: 'sawtooth', from: 187, to: 131, at: 0, duration: 0.24, gain: 0.05 },
      { type: 'square', from: 720, to: 540, at: 0.02, duration: 0.18, gain: 0.012 },
      ],
      level,
    ),

  /** A rising run of blips as a scan starts. */
  scan: () => play([0, 1, 2, 3].map((i) => ({ type: 'square' as const, from: 620 + i * 140, to: 660 + i * 140, at: i * 0.07, duration: 0.05, gain: 0.022 }))),

  /** Two bright notes: found it. */
  success: () =>
    play([
      { type: 'triangle', from: 880, to: 880, at: 0, duration: 0.09, gain: 0.05 },
      { type: 'triangle', from: 1318, to: 1318, at: 0.09, duration: 0.16, gain: 0.05 },
    ]),

  /** A sagging double honk: nothing found. */
  error: () =>
    play([
      { type: 'square', from: 220, to: 150, at: 0, duration: 0.16, gain: 0.035 },
      { type: 'square', from: 190, to: 110, at: 0.19, duration: 0.24, gain: 0.035 },
    ]),

  /** Switching on: a charge winding up, then three rising chimes. */
  powerOn: () =>
    play([
      { type: 'sawtooth', from: 70, to: 520, at: 0, duration: 0.62, gain: 0.035 },
      { type: 'square', from: 140, to: 1040, at: 0, duration: 0.62, gain: 0.01 },
      { type: 'triangle', from: 660, to: 660, at: 0.66, duration: 0.09, gain: 0.05 },
      { type: 'triangle', from: 880, to: 880, at: 0.76, duration: 0.09, gain: 0.05 },
      { type: 'triangle', from: 1320, to: 1320, at: 0.86, duration: 0.2, gain: 0.05 },
    ]),

  /** Switching off: the charge running down. */
  powerOff: () => play([{ type: 'sawtooth', from: 420, to: 60, at: 0, duration: 0.5, gain: 0.03 }]),

  /** A startled chirp when Rotom is poked. */
  poke: () =>
    play([
      { type: 'square', from: 780, to: 1180, at: 0, duration: 0.07, gain: 0.03 },
      { type: 'square', from: 1180, to: 940, at: 0.07, duration: 0.08, gain: 0.03 },
    ]),

  /** A key cap going down. */
  tap: () => play([{ type: 'square', from: 900, to: 760, at: 0, duration: 0.04, gain: 0.018 }]),
}
