/** Rotom emotion, follows the current lookup */
export type RotomEmotion = 'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'

/** Light colour per state, also used by the HUD */
export const EMOTION_COLOR: Record<RotomEmotion, string> = {
  IDLE: '#ffb547',
  SCANNING: '#2ff3ff',
  SUCCESS: '#3dff8a',
  ERROR: '#ff3b30',
}

export const EMOTION_LABEL: Record<RotomEmotion, string> = {
  IDLE: 'Standing by',
  SCANNING: 'Scanning',
  SUCCESS: 'Data found',
  ERROR: 'No data',
}
