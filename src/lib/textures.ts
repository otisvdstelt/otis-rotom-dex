import type { EyeKey } from './faceArt'

/** Where an eye image lives. Kept apart from assets.ts so the Rotom Phone can use it without loading three.js. */
export const eyeTextureUrl = (key: EyeKey): string => `${import.meta.env.BASE_URL}textures/eyes_${key}.png`
