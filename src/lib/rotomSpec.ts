// Rotom Dex's key measurements, in model units (see rotomGeometry.ts). Kept free
// of three.js so the interface can lay itself out before the 3D code has loaded.
export const ROTOM = {
  frontZ: 0.27,
  backZ: -0.27,
  /** The display. Its top edge passes behind the bottom of the eyes, as on the real device. */
  screen: { width: 1.66, height: 1.26, y: -0.5, radius: 0.08 },
  /**
   * How far down the bottoms of the eyes reach over the top of the screen.
   * That strip is drawn by the 3D scene, never by the HTML laid on the
   * screen, which starts just below it.
   */
  eyeOverlap: 0.11,
  /** The dark dome between the eyes. Its base lies on the screen's top edge; Rotom's face rises into it. */
  brow: { halfWidth: 0.36, top: 0.6 },
  /** The plane the eye artwork is mapped to. */
  eyes: { width: 1.9, height: 0.95, y: 0.42 },
  /** Eye centres and size. */
  eye: { x: 0.5, y: 0.33, radiusX: 0.2, radiusY: 0.29 },
  /** The plane Rotom's own face is mapped to: the screen plus the brow above it. */
  face: { width: 1.66, height: 1.8, y: -0.23 },
  /** Whole character including arms held out and the spike; used to frame the wide shot. */
  bounds: { width: 6.9, top: 2.78, bottom: -1.9 },
} as const

/** Texture pixels per model unit in the eye and face artwork. */
export const ARTWORK_SCALE = 400
