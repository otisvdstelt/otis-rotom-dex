/** Rotom's core system emotion. It mirrors the life cycle of the current lookup. */
export type RotomEmotion = 'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'

/** The colour Rotom's lights take in each state; the HUD's status chip uses the same ones. */
export const EMOTION_COLOR: Record<RotomEmotion, string> = {
  IDLE: '#ffb547', // soft amber
  SCANNING: '#2ff3ff', // electric cyan
  SUCCESS: '#3dff8a', // neon green
  ERROR: '#ff3b30', // hazard red
}

export const EMOTION_LABEL: Record<RotomEmotion, string> = {
  IDLE: 'Standing by',
  SCANNING: 'Scanning',
  SUCCESS: 'Data found',
  ERROR: 'No data',
}
