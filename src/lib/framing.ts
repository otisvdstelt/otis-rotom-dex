import { ROTOM } from './rotomSpec'

/** Vertical field of view of the scene camera, in degrees. */
export const CAMERA_FOV = 32

/**
 * "wide" shows all of Rotom; "close" brings its screen up to the viewer, with
 * the eyes peeking over the top edge, the way it holds itself up to a trainer.
 */
export type Shot = 'wide' | 'close'

export interface ShotFrame {
  /** Screen pixels covered by one model unit at Rotom's distance. */
  pixelsPerUnit: number
  /** Height (in model units) of the point the camera should aim at. */
  targetY: number
}

export interface Framing {
  wide: ShotFrame
  close: ShotFrame
  /**
   * Size of what Rotom's screen displays (the screen below the strip the eyes
   * hang over), in CSS pixels, when it is seen in the close shot at 1:1.
   */
  screen: { width: number; height: number; pixelsPerUnit: number }
}

// What must stay in view for the close shot: the screen and the eyes above it.
const CLOSE = { top: ROTOM.brow.top + 0.12, bottom: ROTOM.screen.y - ROTOM.screen.height / 2 - 0.06, width: ROTOM.screen.width + 0.14 }

/**
 * Works out both camera shots for a viewport, leaving `top` and `bottom`
 * pixels clear for the HUD. Pure maths, so the HTML on Rotom's screen and the
 * 3D camera always agree on how big that screen is.
 */
export function computeFraming(width: number, height: number, top: number, bottom: number): Framing {
  const available = Math.max(160, height - top - bottom)
  const middle = top + available / 2

  const frame = (regionTop: number, regionBottom: number, regionWidth: number): ShotFrame => {
    const pixelsPerUnit = Math.min(width / regionWidth, available / (regionTop - regionBottom))
    // Aim so the middle of the region lands in the middle of the free area.
    return { pixelsPerUnit, targetY: (regionTop + regionBottom) / 2 + (middle - height / 2) / pixelsPerUnit }
  }

  // On a narrow window the wide shot lets the hands run off the sides rather than shrinking Rotom to a speck.
  const wideWidth = width < 640 ? 4.4 : ROTOM.bounds.width
  const wide = frame(ROTOM.bounds.top, ROTOM.bounds.bottom, wideWidth)
  const close = frame(CLOSE.top, CLOSE.bottom, CLOSE.width)

  return {
    wide,
    close,
    screen: { width: ROTOM.screen.width * close.pixelsPerUnit, height: (ROTOM.screen.height - ROTOM.eyeOverlap) * close.pixelsPerUnit, pixelsPerUnit: close.pixelsPerUnit },
  }
}

/**
 * The title bar of what the 3D Rotom Dex's screen shows. The strip the eyes
 * hang over is drawn by the 3D scene in the same colour, so the bar itself
 * only needs room for its title.
 */
export function screenTitleBar(pixelsPerUnit: number): { height: number; gap: number } {
  return { height: Math.max(22, pixelsPerUnit * 0.07), gap: ROTOM.screen.width * pixelsPerUnit }
}
