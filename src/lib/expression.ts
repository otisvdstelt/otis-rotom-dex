import type { RotomEmotion } from './emotion'
import type { EyeKey, FaceKey } from './faceArt'

/** Whether Rotom is on, every visit starts asleep */
export type RotomPower = 'asleep' | 'waking' | 'awake'

export interface ExpressionInput {
  emotion: RotomEmotion
  power: RotomPower
  /** True while speaking */
  speaking: boolean
  /** Running clock in seconds */
  time: number
  /** Seconds since the emotion changed */
  sinceEmotion: number
  /** Big grin instead of the resting smile */
  grinning: boolean
  /** Eyes squeezed shut with joy */
  cheering: boolean
}

/** Current eyes and mouth, shared by the 3D Dex and the phone */
export function pickExpression({ emotion, power, speaking, time: t, sinceEmotion, grinning, cheering }: ExpressionInput): { eyes: EyeKey; face: FaceKey } {
  if (power === 'asleep') return { eyes: 'sleep', face: 'idle' }
  // Booting eyes flicker between shut and a ring
  if (power === 'waking') return { eyes: Math.sin(t * 23) * Math.sin(t * 7.1) > 0.15 ? 'scan' : 'sleep', face: 'scan' }

  const phase = t % 4.6
  const blinking = phase < 0.13 || (Math.floor(t / 4.6) % 3 === 0 && phase > 0.3 && phase < 0.42)
  // Two rhythms so talking does not look mechanical
  const mouthOpen = speaking && Math.sin(t * 19) + Math.sin(t * 7.3) > 0

  switch (emotion) {
    case 'SCANNING':
      return { eyes: 'scan', face: 'scan' }
    case 'ERROR':
      return { eyes: 'error', face: mouthOpen ? 'talk' : 'error' }
    case 'SUCCESS':
      // Joyful squint while cheering
      return { eyes: sinceEmotion < 2.2 || cheering ? 'success' : blinking ? 'blink' : 'idle', face: mouthOpen ? 'talk' : 'success' }
    case 'IDLE':
      return { eyes: cheering ? 'success' : blinking ? 'blink' : 'idle', face: mouthOpen ? 'talk' : grinning || cheering ? 'success' : 'idle' }
  }
}
