// Bakes the procedural Rotom body into a Draco compressed GLB. Run with npm run rotom
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Document, NodeIO } from '@gltf-transform/core'
import { KHRDracoMeshCompression } from '@gltf-transform/extensions'
import { draco } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import { buildRotomGeometries, ROTOM_PART_PIVOT, ROTOM_PARTS, type RotomPart } from '../src/lib/rotomGeometry.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Placeholder materials, the app swaps in cel shaded ones
const MATERIALS = {
  red: { color: [0.72, 0.06, 0.06], emissive: [0, 0, 0] },
  redDeep: { color: [0.5, 0.03, 0.04], emissive: [0, 0, 0] },
  screen: { color: [0.93, 0.95, 1], emissive: [0.3, 0.32, 0.36] },
  dark: { color: [0.03, 0.03, 0.05], emissive: [0, 0, 0] },
  white: { color: [1, 1, 1], emissive: [0, 0, 0] },
  blue: { color: [0.03, 0.09, 0.55], emissive: [0, 0, 0] },
} as const

const PART_MATERIAL: Record<RotomPart, keyof typeof MATERIALS> = {
  Body: 'red',
  Spike: 'red',
  ScreenFrame: 'dark',
  Screen: 'screen',
  Brow: 'dark',
  SpeakerHoles: 'dark',
  Feet: 'redDeep',
  ArmR: 'red',
  ArmL: 'red',
  HandR: 'red',
  HandL: 'red',
  BackBolts: 'redDeep',
  BackPort: 'redDeep',
  BackLens: 'white',
  BackPupil: 'blue',
  BackButton: 'redDeep',
}

const doc = new Document()
doc.getRoot().getAsset().generator = 'rotom-dex build-rotom.ts'
const buffer = doc.createBuffer()
const scene = doc.createScene('RotomDevice')

const materials = Object.fromEntries(
  Object.entries(MATERIALS).map(([name, m]) => [
    name,
    doc
      .createMaterial(name)
      .setBaseColorFactor([m.color[0], m.color[1], m.color[2], 1])
      .setEmissiveFactor([m.emissive[0], m.emissive[1], m.emissive[2]])
      .setMetallicFactor(0)
      .setRoughnessFactor(0.6),
  ]),
)

const geometries = buildRotomGeometries()
let triangles = 0

for (const name of ROTOM_PARTS) {
  const geometry = geometries[name]
  const index = geometry.getIndex()
  if (!index) throw new Error(`${name} has no index buffer`)
  triangles += index.count / 3

  const primitive = doc
    .createPrimitive()
    .setMaterial(materials[PART_MATERIAL[name]])
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(index.array)).setBuffer(buffer))
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(geometry.getAttribute('position').array)).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(geometry.getAttribute('normal').array)).setBuffer(buffer))
  const uv = geometry.getAttribute('uv')
  if (uv) {
    primitive.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(uv.array)).setBuffer(buffer))
  }
  // Spike gradient lives in the vertex colours
  const color = geometry.getAttribute('color')
  if (color) {
    primitive.setAttribute('COLOR_0', doc.createAccessor().setType('VEC3').setArray(new Float32Array(color.array)).setBuffer(buffer))
  }

  const node = doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(primitive))
  const pivot = ROTOM_PART_PIVOT[name]
  if (pivot) node.setTranslation(pivot)
  scene.addChild(node)
}

const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'draco3d.decoder': await draco3d.createDecoderModule(),
})
const uncompressed = (await io.writeBinary(doc)).byteLength
await doc.transform(draco({ method: 'edgebreaker', quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }))
const glb = await io.writeBinary(doc)

const out = resolve(root, 'public/assets/rotom_device.glb')
await mkdir(dirname(out), { recursive: true })
await writeFile(out, glb)
console.log(
  `rotom_device.glb  ${ROTOM_PARTS.length} meshes, ${Math.round(triangles)} triangles, ` +
    `${(uncompressed / 1024).toFixed(0)} KB -> ${(glb.byteLength / 1024).toFixed(0)} KB with Draco`,
)
