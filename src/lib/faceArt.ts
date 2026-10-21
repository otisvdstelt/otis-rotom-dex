// Rotom face drawings, shared by the face baking script and the phone. No three.js or React

export const EYE_KEYS = ['idle', 'blink', 'scan', 'success', 'error', 'sleep'] as const
export const FACE_KEYS = ['idle', 'talk', 'scan', 'success', 'error'] as const
export type EyeKey = (typeof EYE_KEYS)[number]
export type FaceKey = (typeof FACE_KEYS)[number]

export const FACE_INK = '#1c1e2e'
export const FACE_IRIS = '#2f55c6'
export const FACE_SKIN = '#6fc6f2'
export const FACE_MOUTH = '#27314f'
/** Dark dome between the eyes */
export const FACE_BROW = '#23263a'

const line = (d: string, width: number, color = FACE_MOUTH) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`

/** Mouth SVG in model units around its centre */
export const MOUTHS: Record<FaceKey, string> = {
  // Small smile
  idle: line('M-0.11 -0.02 Q0 0.085 0.11 -0.02', 0.024),
  // Open, alternated while talking
  talk: `<ellipse cx="0" cy="0.03" rx="0.075" ry="0.092" fill="${FACE_MOUTH}"/><ellipse cx="0" cy="0.08" rx="0.047" ry="0.034" fill="#f08aa8"/>`,
  // Concentrating zigzag
  scan: line('M-0.12 0.035 L-0.06 -0.01 L0 0.035 L0.06 -0.01 L0.12 0.035', 0.024),
  // Grin with teeth lines
  success:
    `<path d="M-0.25 -0.08 Q0 0 0.25 -0.08 Q0.22 0.135 0 0.135 Q-0.22 0.135 -0.25 -0.08 Z" fill="#ffffff" stroke="${FACE_MOUTH}" stroke-width="0.02" stroke-linejoin="round"/>` +
    line('M-0.1 -0.044 V0.114 M0 -0.038 V0.13 M0.1 -0.044 V0.114', 0.014),
  // Wobbly frown
  error: line('M-0.13 0.05 Q-0.085 -0.025 -0.04 0.035 T0.05 0.035 T0.14 0.025', 0.024),
}

/** Sweat bead for the error face */
export const SWEAT = `<path d="M0 -0.07 Q0.06 0.035 0 0.07 Q-0.06 0.035 0 -0.07 Z" fill="#ffffff" stroke="#3f97cc" stroke-width="0.012"/>`

/** Eye half size and tilt in model units */
export const EYE_SHAPE = { radiusX: 0.2, radiusY: 0.29, tiltDegrees: 10 }

/** Left eye in model units, mirror for the right */
export function eyeDrawing(key: EyeKey, irisFill: string = FACE_IRIS): string {
  const { radiusX: rx, radiusY: ry } = EYE_SHAPE
  // White, outline and seam
  const white =
    `<ellipse cx="0" cy="0" rx="${rx}" ry="${ry}" fill="#ffffff" stroke="${FACE_INK}" stroke-width="0.022"/>` +
    `<path d="M${-rx + 0.015} 0 H${rx - 0.015}" stroke="${FACE_INK}" stroke-width="0.01"/>`
  switch (key) {
    // Open
    case 'idle':
      return `${white}<ellipse cx="0" cy="0" rx="0.118" ry="0.19" fill="${irisFill}" stroke="#1f3f9f" stroke-width="0.012"/>`
    // Blink
    case 'blink':
      return `${white}${line('M-0.13 0 H0.13', 0.03, FACE_IRIS)}`
    // Focused targeting ring
    case 'scan':
      return `${white}<ellipse cx="0" cy="0" rx="0.108" ry="0.176" fill="#eaf2ff" stroke="${FACE_IRIS}" stroke-width="0.036"/><ellipse cx="0" cy="0" rx="0.037" ry="0.06" fill="${FACE_IRIS}"/>`
    // Joyful squint
    case 'success':
      return `${white}${line('M-0.115 0.08 Q0 -0.19 0.115 0.08', 0.05, FACE_IRIS)}`
    // Scrunched
    case 'error':
      return `${white}${line('M-0.092 -0.128 L0.096 0 L-0.092 0.128', 0.05, FACE_IRIS)}`
    // Asleep
    case 'sleep':
      return `${white}${line('M-0.125 -0.02 Q0 0.13 0.125 -0.02', 0.042, '#6f84c4')}`
  }
}
