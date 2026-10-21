import { useGLTF } from '@react-three/drei'
import { EYE_KEYS, FACE_KEYS, type EyeKey, type FaceKey } from './faceArt'
import { eyeTextureUrl } from './textures'

const base = import.meta.env.BASE_URL

// Use the local Draco decoder instead of a CDN
useGLTF.setDecoderPath(`${base}draco/`)

/** Rotom Dex body model */
export const ROTOM_ASSET_URL = `${base}assets/rotom_device.glb`

/** Eye images, one per expression */
export const EYE_TEXTURES = Object.fromEntries(EYE_KEYS.map((key) => [key, eyeTextureUrl(key)])) as Record<EyeKey, string>

/** Face and mouth images, one per expression */
export const FACE_TEXTURES = Object.fromEntries(FACE_KEYS.map((key) => [key, `${base}textures/face_${key}.png`])) as Record<FaceKey, string>
