import { ROTOM } from './rotomSpec'

/** Camera vertical field of view in degrees */
export const CAMERA_FOV = 32

/** Wide shows all of Rotom, close brings the screen up to the viewer */
export type Shot = 'wide' | 'close'

export interface ShotFrame {
  /** Screen pixels per model unit */
  pixelsPerUnit: number
  /** Camera aim height in model units */
  targetY: number
}

export interface Framing {
  wide: ShotFrame
  close: ShotFrame
  /** Visible screen size in CSS pixels in the close shot */
  screen: { width: number; height: number; pixelsPerUnit: number }
}

// Close shot keeps the screen and eyes in view
const CLOSE = { top: ROTOM.brow.top + 0.12, bottom: ROTOM.screen.y - ROTOM.screen.height / 2 - 0.06, width: ROTOM.screen.width + 0.14 }

/** Both camera shots for a viewport, leaving room for the HUD */
export function computeFraming(width: number, height: number, top: number, bottom: number): Framing {
  const available = Math.max(160, height - top - bottom)
  const middle = top + available / 2

  const frame = (regionTop: number, regionBottom: number, regionWidth: number): ShotFrame => {
    const pixelsPerUnit = Math.min(width / regionWidth, available / (regionTop - regionBottom))
    // Center the region in the free area
    return { pixelsPerUnit, targetY: (regionTop + regionBottom) / 2 + (middle - height / 2) / pixelsPerUnit }
  }

  // On narrow windows let the hands crop instead of shrinking Rotom
  const wideWidth = width < 640 ? 4.4 : ROTOM.bounds.width
  const wide = frame(ROTOM.bounds.top, ROTOM.bounds.bottom, wideWidth)
  const close = frame(CLOSE.top, CLOSE.bottom, CLOSE.width)

  return {
    wide,
    close,
    screen: { width: ROTOM.screen.width * close.pixelsPerUnit, height: (ROTOM.screen.height - ROTOM.eyeOverlap) * close.pixelsPerUnit, pixelsPerUnit: close.pixelsPerUnit },
  }
}

/** Title bar height of the 3D screen */
export function screenTitleBar(pixelsPerUnit: number): { height: number; gap: number } {
  return { height: Math.max(22, pixelsPerUnit * 0.07), gap: ROTOM.screen.width * pixelsPerUnit }
}
