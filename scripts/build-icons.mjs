// Builds the home screen icons from the favicon
import { mkdirSync, readFileSync } from 'node:fs'
import sharp from 'sharp'

const favicon = readFileSync('public/favicon.svg', 'utf8')
const drawing = favicon.slice(favicon.indexOf('>') + 1, favicon.lastIndexOf('</svg>'))

// Centered small enough to survive a round maskable crop
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b2478"/>
      <stop offset="1" stop-color="#2a5fc0"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#sky)"/>
  <circle cx="50" cy="54" r="33" fill="#ffd83d"/>
  <g transform="translate(18 17)">${drawing}</g>
</svg>`

mkdirSync('public/icons', { recursive: true })
const sizes = { 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512 }
for (const [file, size] of Object.entries(sizes)) {
  await sharp(Buffer.from(icon), { density: 72 * (size / 100) * 4 })
    .resize(size, size)
    .png()
    .toFile(`public/icons/${file}`)
  console.log(`public/icons/${file}  ${size}x${size}`)
}
