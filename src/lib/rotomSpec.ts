// Rotom Dex measurements in model units, free of three.js
export const ROTOM = {
  frontZ: 0.27,
  backZ: -0.27,
  /** The display */
  screen: { width: 1.66, height: 1.26, y: -0.5, radius: 0.08 },
  /** Strip at the top of the screen covered by the eyes, drawn by the 3D scene */
  eyeOverlap: 0.11,
  /** Dark dome between the eyes */
  brow: { halfWidth: 0.36, top: 0.6 },
  /** Eye artwork plane */
  eyes: { width: 1.9, height: 0.95, y: 0.42 },
  /** Eye centres and size */
  eye: { x: 0.5, y: 0.33, radiusX: 0.2, radiusY: 0.29 },
  /** Face artwork plane, the screen plus the brow */
  face: { width: 1.66, height: 1.8, y: -0.23 },
  /** Whole character bounds for the wide shot */
  bounds: { width: 6.9, top: 2.78, bottom: -1.9 },
} as const

/** Texture pixels per model unit */
export const ARTWORK_SCALE = 400
