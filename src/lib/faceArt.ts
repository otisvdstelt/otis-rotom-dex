// Rotom's expressions as drawings. Shared by scripts/build-faces.mjs, which
// bakes them into the textures the 3D Rotom Dex wears, and by the Rotom Phone,
// which draws them straight into the page. Free of three.js and React.

export const EYE_KEYS = ['idle', 'blink', 'scan', 'success', 'error', 'sleep'] as const
export const FACE_KEYS = ['idle', 'talk', 'scan', 'success', 'error'] as const
export type EyeKey = (typeof EYE_KEYS)[number]
export type FaceKey = (typeof FACE_KEYS)[number]

export const FACE_INK = '#1c1e2e'
export const FACE_IRIS = '#2f55c6'
export const FACE_SKIN = '#6fc6f2'
export const FACE_MOUTH = '#27314f'
/** The dark dome between the eyes. */
export const FACE_BROW = '#23263a'

const line = (d: string, width: number, color = FACE_MOUTH) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`

/**
 * Mouths, as SVG markup in model units around the mouth's centre (y down).
 * Wrap one in `<g transform="translate(x y) scale(pixelsPerUnit)">` to place it.
 */
export const MOUTHS: Record<FaceKey, string> = {
  // A small, easy smile.
  idle: line('M-0.11 -0.02 Q0 0.085 0.11 -0.02', 0.024),
  // Open mid-word: alternated with the other mouths while Rotom talks.
  talk: `<ellipse cx="0" cy="0.03" rx="0.075" ry="0.092" fill="${FACE_MOUTH}"/><ellipse cx="0" cy="0.08" rx="0.047" ry="0.034" fill="#f08aa8"/>`,
  // Concentrating: a little buzzing zigzag.
  scan: line('M-0.12 0.035 L-0.06 -0.01 L0 0.035 L0.06 -0.01 L0.12 0.035', 0.024),
  // The compact grin: a white crescent with fine lines for teeth.
  success:
    `<path d="M-0.25 -0.08 Q0 0 0.25 -0.08 Q0.22 0.135 0 0.135 Q-0.22 0.135 -0.25 -0.08 Z" fill="#ffffff" stroke="${FACE_MOUTH}" stroke-width="0.02" stroke-linejoin="round"/>` +
    line('M-0.1 -0.044 V0.114 M0 -0.038 V0.13 M0.1 -0.044 V0.114', 0.014),
  // A wobbling frown.
  error: line('M-0.13 0.05 Q-0.085 -0.025 -0.04 0.035 T0.05 0.035 T0.14 0.025', 0.024),
}

/** A bead of sweat for the error face, in model units around its own centre. */
export const SWEAT = `<path d="M0 -0.07 Q0.06 0.035 0 0.07 Q-0.06 0.035 0 -0.07 Z" fill="#ffffff" stroke="#3f97cc" stroke-width="0.012"/>`

/** Half-size of one eye, in model units, and the tilt of its top away from the nose. */
export const EYE_SHAPE = { radiusX: 0.2, radiusY: 0.29, tiltDegrees: 10 }

/**
 * One eye (the left one; mirror it for the right), in model units around its
 * own centre, y down, before the tilt is applied.
 */
export function eyeDrawing(key: EyeKey, irisFill: string = FACE_IRIS): string {
  const { radiusX: rx, radiusY: ry } = EYE_SHAPE
  // The white, its outline, and the seam that runs across the middle.
  const white =
    `<ellipse cx="0" cy="0" rx="${rx}" ry="${ry}" fill="#ffffff" stroke="${FACE_INK}" stroke-width="0.022"/>` +
    `<path d="M${-rx + 0.015} 0 H${rx - 0.015}" stroke="${FACE_INK}" stroke-width="0.01"/>`
  switch (key) {
    // Open, looking straight ahead.
    case 'idle':
      return `${white}<ellipse cx="0" cy="0" rx="0.118" ry="0.19" fill="${irisFill}" stroke="#1f3f9f" stroke-width="0.012"/>`
    // Shut for an instant: the iris closes down to the seam.
    case 'blink':
      return `${white}${line('M-0.13 0 H0.13', 0.03, FACE_IRIS)}`
    // Focused: the iris opens into a targeting ring.
    case 'scan':
      return `${white}<ellipse cx="0" cy="0" rx="0.108" ry="0.176" fill="#eaf2ff" stroke="${FACE_IRIS}" stroke-width="0.036"/><ellipse cx="0" cy="0" rx="0.037" ry="0.06" fill="${FACE_IRIS}"/>`
    // Squeezed shut with joy.
    case 'success':
      return `${white}${line('M-0.115 0.08 Q0 -0.19 0.115 0.08', 0.05, FACE_IRIS)}`
    // Scrunched ">  <".
    case 'error':
      return `${white}${line('M-0.092 -0.128 L0.096 0 L-0.092 0.128', 0.05, FACE_IRIS)}`
    // Asleep: the lids rest low and heavy.
    case 'sleep':
      return `${white}${line('M-0.125 -0.02 Q0 0.13 0.125 -0.02', 0.042, '#6f84c4')}`
  }
}
