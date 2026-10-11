import type { RotomEmotion } from './emotion'
import type { EyeKey, FaceKey } from './faceArt'

/** Whether Rotom is switched on. Every visit starts with it asleep. */
export type RotomPower = 'asleep' | 'waking' | 'awake'

export interface ExpressionInput {
  emotion: RotomEmotion
  power: RotomPower
  /** True while the speech engine is talking. */
  speaking: boolean
  /** A running clock, in seconds. */
  time: number
  /** Seconds since the emotion last changed. */
  sinceEmotion: number
  /** Show the big grin instead of the resting smile (a greeting, a change of screen). */
  grinning: boolean
  /** Squeeze the eyes shut with joy (a cheer, being poked). */
  cheering: boolean
}

/**
 * Which eyes and which mouth Rotom wears right now. Shared by the 3D Rotom Dex
 * and the Rotom Phone so the two always pull the same faces.
 */
export function pickExpression({ emotion, power, speaking, time: t, sinceEmotion, grinning, cheering }: ExpressionInput): { eyes: EyeKey; face: FaceKey } {
  if (power === 'asleep') return { eyes: 'sleep', face: 'idle' }
  // Booting: the eyes flicker between shut and a targeting ring.
  if (power === 'waking') return { eyes: Math.sin(t * 23) * Math.sin(t * 7.1) > 0.15 ? 'scan' : 'sleep', face: 'scan' }

  const phase = t % 4.6
  const blinking = phase < 0.13 || (Math.floor(t / 4.6) % 3 === 0 && phase > 0.3 && phase < 0.42)
  // Two overlapping rhythms, so talking never looks like a metronome.
  const mouthOpen = speaking && Math.sin(t * 19) + Math.sin(t * 7.3) > 0

  switch (emotion) {
    case 'SCANNING':
      return { eyes: 'scan', face: 'scan' }
    case 'ERROR':
      return { eyes: 'error', face: mouthOpen ? 'talk' : 'error' }
    case 'SUCCESS':
      // Eyes squeezed shut with joy while it cheers, then back to normal while you read.
      return { eyes: sinceEmotion < 2.2 || cheering ? 'success' : blinking ? 'blink' : 'idle', face: mouthOpen ? 'talk' : 'success' }
    case 'IDLE':
      return { eyes: cheering ? 'success' : blinking ? 'blink' : 'idle', face: mouthOpen ? 'talk' : grinning || cheering ? 'success' : 'idle' }
  }
}
