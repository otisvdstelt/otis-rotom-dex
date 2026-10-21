// Bakes the faces from faceArt.ts into public textures. Run with npm run faces.
// Eye images sit on the body, face images show on the screen. Edit faceArt.ts to redraw
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { EYE_KEYS, EYE_SHAPE, FACE_KEYS, FACE_SKIN, MOUTHS, SWEAT, eyeDrawing } from '../src/lib/faceArt.ts'
import { ARTWORK_SCALE, ROTOM } from '../src/lib/rotomSpec.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const S = ARTWORK_SCALE

// Eyes

const EYES = { width: ROTOM.eyes.width * S, height: ROTOM.eyes.height * S }
/** Model coordinates to eye plane pixels */
const eyeX = (x) => EYES.width / 2 + x * S
const eyeY = (y) => EYES.height / 2 + (ROTOM.eyes.y - y) * S

const eyes = (key) => {
  const one = (side) =>
    `<g transform="translate(${eyeX(side * ROTOM.eye.x)} ${eyeY(ROTOM.eye.y)}) rotate(${side * EYE_SHAPE.tiltDegrees}) scale(${-side * S} ${S})">${eyeDrawing(key, 'url(#iris)')}</g>`
  return `${one(-1)}${one(1)}`
}

// Screen face

const FACE = { width: ROTOM.face.width * S, height: ROTOM.face.height * S }
const faceX = (x) => FACE.width / 2 + x * S
const faceY = (y) => FACE.height / 2 + (ROTOM.face.y - y) * S

const screenTop = ROTOM.screen.y + ROTOM.screen.height / 2
/** Head and mouth position in model units */
const HEAD = { y: -0.16, radiusX: 0.69, radiusY: 0.5 }
const MOUTH_Y = -0.15

// Clip the face to the screen and dome
const display = `
  <clipPath id="display">
    <rect x="0" y="${faceY(screenTop)}" width="${FACE.width}" height="${ROTOM.screen.height * S}" rx="${ROTOM.screen.radius * S}"/>
    <path d="M${faceX(-ROTOM.brow.halfWidth)} ${faceY(screenTop) + 1} A${ROTOM.brow.halfWidth * S} ${(ROTOM.brow.top - screenTop) * S} 0 0 1 ${faceX(ROTOM.brow.halfWidth)} ${faceY(screenTop) + 1} Z"/>
  </clipPath>`

// Blue head rising into the dome, tail toward the bottom right
const skin = `
  <path d="M${faceX(0.34)} ${faceY(-0.48)} L${faceX(0.92)} ${faceY(-1.24)}" stroke="${FACE_SKIN}" stroke-width="${0.22 * S}" stroke-linecap="round"/>
  <ellipse cx="${faceX(0)}" cy="${faceY(HEAD.y)}" rx="${HEAD.radiusX * S}" ry="${HEAD.radiusY * S}" fill="${FACE_SKIN}"/>`

const face = (key) => `
  <g clip-path="url(#display)">
    ${skin}
    <g transform="translate(${faceX(0)} ${faceY(MOUTH_Y)}) scale(${S})">${MOUTHS[key]}</g>
    ${key === 'error' ? `<g transform="translate(${faceX(0.4)} ${faceY(-0.02)}) scale(${S})">${SWEAT}</g>` : ''}
  </g>`

// Output

const svg = ({ width, height }, content) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="iris" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2646b0"/>
      <stop offset="1" stop-color="#4f7fe4"/>
    </linearGradient>
    ${display}
  </defs>
  ${content}
</svg>`

const outDir = resolve(root, 'public/textures')
await mkdir(outDir, { recursive: true })

for (const [prefix, size, keys, draw] of [
  ['eyes', EYES, EYE_KEYS, eyes],
  ['face', FACE, FACE_KEYS, face],
]) {
  for (const key of keys) {
    const png = await sharp(Buffer.from(svg(size, draw(key)))).png({ compressionLevel: 9 }).toBuffer()
    await writeFile(resolve(outDir, `${prefix}_${key}.png`), png)
    console.log(`${prefix}_${key}.png  ${size.width}x${size.height}  ${(png.byteLength / 1024).toFixed(1)} KB`)
  }
}
