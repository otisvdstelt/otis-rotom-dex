import type { EyeKey } from './faceArt'

/** Eye image path, kept apart so the phone avoids loading three.js */
export const eyeTextureUrl = (key: EyeKey): string => `${import.meta.env.BASE_URL}textures/eyes_${key}.png`
