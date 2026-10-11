import { useGLTF } from '@react-three/drei'
import { EYE_KEYS, FACE_KEYS, type EyeKey, type FaceKey } from './faceArt'
import { eyeTextureUrl } from './textures'

const base = import.meta.env.BASE_URL

// Decode Draco with the copy in /public/draco instead of a third-party CDN.
useGLTF.setDecoderPath(`${base}draco/`)

/** Rotom Dex's body. Swap this file for another model and the app will still load it. */
export const ROTOM_ASSET_URL = `${base}assets/rotom_device.glb`

/** The eyes, one image per expression. */
export const EYE_TEXTURES = Object.fromEntries(EYE_KEYS.map((key) => [key, eyeTextureUrl(key)])) as Record<EyeKey, string>

/** Rotom's blue face and mouth as drawn on its screen, one image per expression. */
export const FACE_TEXTURES = Object.fromEntries(FACE_KEYS.map((key) => [key, `${base}textures/face_${key}.png`])) as Record<FaceKey, string>
