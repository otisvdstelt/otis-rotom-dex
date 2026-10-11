// Rotom Dex's body, built from code to follow the anime and the Sun & Moon
// model sheet: a flat red tablet with an arrowhead of a head (a low roof
// running out to two pointed ears) on a narrower, boxier lower body; a fat
// cone of a spike on top; a pale screen low on the front with the eyes sitting
// on its upper edge and a dark dome between them; zigzag arms that end in big
// flared paddles; and two teardrop feet.
//
// Used twice: scripts/build-rotom.ts bakes these parts into
// public/assets/rotom_device.glb, and RotomModel builds them at runtime as the
// fallback when that file is missing. One source, so the two never drift apart.
//
// Units: the body is 3.0 wide (ear to ear) and 2.6 tall, centred near the
// origin, facing +Z. Arms and spike are modelled around their own joint so
// they can be posed; ROTOM_PART_PIVOT says where each joint sits on the body.
import { BufferAttribute, Color, ExtrudeGeometry, LatheGeometry, Path, Shape, ShapeGeometry, Vector2, Vector3, type BufferGeometry } from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ROTOM } from './rotomSpec.ts'

export { ROTOM }

export const ROTOM_PARTS = [
  'Body',
  'Spike',
  'ScreenFrame',
  'Screen',
  'Brow',
  'SpeakerHoles',
  'Feet',
  'ArmR',
  'ArmL',
  'HandR',
  'HandL',
  'BackBolts',
  'BackPort',
  'BackLens',
  'BackPupil',
  'BackButton',
] as const

export type RotomPart = (typeof ROTOM_PARTS)[number]

const ARM_PIVOT: [number, number, number] = [1.02, -0.42, -0.02]

const ARM_PIVOT_LEFT: [number, number, number] = [-ARM_PIVOT[0], ARM_PIVOT[1], ARM_PIVOT[2]]

/** Where a part hangs when it is modelled around its own joint instead of the body origin. */
export const ROTOM_PART_PIVOT: Partial<Record<RotomPart, [number, number, number]>> = {
  Spike: [0, 1.12, 0],
  ArmR: ARM_PIVOT,
  HandR: ARM_PIVOT,
  ArmL: ARM_PIVOT_LEFT,
  HandL: ARM_PIVOT_LEFT,
}

/** Centre of the paddle hand, in the arm's own space (right arm; mirror X for the left). */
export const HAND_CENTER: [number, number] = [1.38, -0.16]

/** Rotom Dex's body colour. The spike's vertex colours start from it, so it lives with the geometry. */
export const ROTOM_RED = '#de3b3d'

type Point = [number, number]

// ---------------------------------------------------------------- shape helpers

/** Polygon with every corner rounded off by `radius` (or one radius per corner). */
function roundedPolygon<T extends Shape | Path>(points: Point[], radius: number | number[], target: T): T {
  const n = points.length
  const corner = (i: number) => {
    const r = Array.isArray(radius) ? radius[i] : radius
    const c = new Vector2(...points[i])
    const toPrev = new Vector2(...points[(i - 1 + n) % n]).sub(c).normalize()
    const toNext = new Vector2(...points[(i + 1) % n]).sub(c).normalize()
    return { c, start: c.clone().addScaledVector(toPrev, r), end: c.clone().addScaledVector(toNext, r) }
  }
  const first = corner(0)
  target.moveTo(first.end.x, first.end.y)
  for (let k = 1; k <= n; k++) {
    const { c, start, end } = corner(k % n)
    target.lineTo(start.x, start.y)
    target.quadraticCurveTo(c.x, c.y, end.x, end.y)
  }
  return target
}

function roundedRect<T extends Shape | Path>(width: number, height: number, radius: number, cx: number, cy: number, target: T): T {
  const x = width / 2
  const y = height / 2
  return roundedPolygon(
    [
      [cx - x, cy + y],
      [cx + x, cy + y],
      [cx + x, cy - y],
      [cx - x, cy - y],
    ],
    radius,
    target,
  )
}

const mirrorX = (points: Point[]): Point[] => points.map(([x, y]) => [-x, y] as Point).reverse()

/**
 * The front face of the body: a low, nearly straight roof that rounds over a
 * shoulder and drops to a sharp ear tip on each side, a cut back in under
 * the ear, then nearly straight sides down to a flat bottom with rounded
 * corners. (The bevel added when it is extruded pushes the silhouette out a
 * little further.)
 */
function bodyShape(): Shape {
  const s = new Shape()
  s.moveTo(0, 1.16)
  s.bezierCurveTo(0.42, 1.16, 0.8, 1.0, 1.06, 0.84) // roof
  s.bezierCurveTo(1.24, 0.72, 1.37, 0.58, 1.41, 0.42) // shoulder, down to the ear's tip
  s.quadraticCurveTo(1.27, 0.13, 0.98, 0.0) // the cut back in under the ear
  s.lineTo(0.93, -1.04) // side, tapering a little
  s.quadraticCurveTo(0.92, -1.27, 0.68, -1.27) // bottom corner
  s.lineTo(-0.68, -1.27)
  s.quadraticCurveTo(-0.92, -1.27, -0.93, -1.04)
  s.lineTo(-0.98, 0.0)
  s.quadraticCurveTo(-1.27, 0.13, -1.41, 0.42)
  s.bezierCurveTo(-1.37, 0.58, -1.24, 0.72, -1.06, 0.84)
  s.bezierCurveTo(-0.8, 1.0, -0.42, 1.16, 0, 1.16)
  return s
}

/**
 * The spike's silhouette, from its foot (buried in the crown) to its tip, as
 * [radius, height] pairs: a fat cone that flares where it meets the head.
 */
const SPIKE_PROFILE: Point[] = [
  [0.37, -0.22],
  [0.345, 0],
  [0.3, 0.12],
  [0.25, 0.35],
  [0.2, 0.59],
  [0.15, 0.84],
  [0.1, 1.09],
  [0.055, 1.32],
  [0.022, 1.5],
  [0, 1.57],
]

/** A foot: a teardrop hanging from the body by its point. [radius, height] pairs, top to bottom. */
const FOOT_PROFILE: Point[] = [
  [0, 0.26],
  [0.07, 0.16],
  [0.15, 0.04],
  [0.215, -0.1],
  [0.23, -0.22],
  [0.19, -0.33],
  [0.1, -0.4],
  [0, -0.42],
]

/**
 * One arm, from the shoulder outward: a thin strut that kicks up to a peak,
 * jogs back down, and opens into a big paddle that flares toward its far
 * end. Together they read as a lightning bolt.
 */
const ARM_OUTLINE: Point[] = [
  [0, 0.06],
  [0.4, 0.1],
  [0.56, 0.2],
  [0.66, -0.02],
  [2.06, 0.5],
  [2.23, 0.14],
  [1.92, -0.74],
  [0.6, -0.76],
  [0.54, -0.16],
  [0.36, -0.06],
  [0, -0.06],
]
const ARM_CORNERS = [0.03, 0.05, 0.06, 0.04, 0.14, 0.15, 0.17, 0.14, 0.05, 0.04, 0.03]

/** Lightning-bolt panel moulded into the back (right side as seen from behind; mirrored for the left). */
const BACK_BOLT: Point[] = [
  [0.36, 0.74],
  [0.92, 0.74],
  [0.84, 0.1],
  [1.0, 0.1],
  [0.8, -0.92],
  [0.46, -0.92],
  [0.58, -0.2],
  [0.4, -0.2],
]

// ---------------------------------------------------------------- geometry helpers

/**
 * Recomputes normals so bevels and curved walls shade smoothly while flat
 * front/back faces stay flat and real corners stay crisp. Cel shading shows
 * every normal error as a wrong band, so this matters more than usual.
 */
function shadeSmooth(geometry: BufferGeometry, creaseDegrees = 38): BufferGeometry {
  const g = geometry.index ? geometry.toNonIndexed() : geometry
  g.deleteAttribute('normal')
  const pos = g.getAttribute('position')
  const cos = Math.cos((creaseDegrees * Math.PI) / 180)
  const a = new Vector3()
  const b = new Vector3()
  const c = new Vector3()
  const faces: { normal: Vector3; area: number; cap: boolean }[] = []
  const byPosition = new Map<string, number[]>()
  const key = (v: Vector3) => `${Math.round(v.x * 1e4)},${Math.round(v.y * 1e4)},${Math.round(v.z * 1e4)}`

  for (let f = 0; f < pos.count / 3; f++) {
    a.fromBufferAttribute(pos, f * 3)
    b.fromBufferAttribute(pos, f * 3 + 1)
    c.fromBufferAttribute(pos, f * 3 + 2)
    const normal = new Vector3().subVectors(c, b).cross(new Vector3().subVectors(a, b))
    const area = normal.length()
    normal.normalize()
    faces.push({ normal, area, cap: Math.abs(normal.z) > 0.9999 })
    for (const v of [a, b, c]) {
      const k = key(v)
      const list = byPosition.get(k)
      if (list) list.push(f)
      else byPosition.set(k, [f])
    }
  }

  const normals = new Float32Array(pos.count * 3)
  const sum = new Vector3()
  for (let f = 0; f < pos.count / 3; f++) {
    for (let i = 0; i < 3; i++) {
      a.fromBufferAttribute(pos, f * 3 + i)
      sum.set(0, 0, 0)
      if (faces[f].cap) {
        sum.copy(faces[f].normal)
      } else {
        for (const other of byPosition.get(key(a)) ?? []) {
          if (faces[other].cap || faces[other].normal.dot(faces[f].normal) < cos) continue
          sum.addScaledVector(faces[other].normal, faces[other].area)
        }
      }
      sum.normalize().toArray(normals, (f * 3 + i) * 3)
    }
  }
  g.setAttribute('normal', new BufferAttribute(normals, 3))
  return g
}

interface ExtrudeOptions {
  /** Thickness of the flat-sided middle, not counting the bevels. */
  depth: number
  /** Bevel radius. It rounds the edge and widens the outline by the same amount. */
  bevel: number
  /** Z of the finished front face. */
  frontZ: number
  bevelSegments?: number
  curveSegments?: number
}

function extrude(shape: Shape, { depth, bevel, frontZ, bevelSegments = 3, curveSegments = 10 }: ExtrudeOptions): BufferGeometry {
  const g = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments,
    curveSegments,
  })
  g.translate(0, 0, frontZ - depth - bevel)
  g.deleteAttribute('uv')
  return shadeSmooth(g)
}

/** Paper-thin inlay lying on a surface. */
function inlay(shape: Shape, z: number, curveSegments = 10): BufferGeometry {
  const g = new ShapeGeometry(shape, curveSegments)
  g.translate(0, 0, z)
  g.deleteAttribute('uv')
  return g
}

/** A low dome on the XY plane, optionally stretched into an oval. */
function dome(radius: number, height: number, baseZ: number, x: number, y: number, stretchX = 1, radialSegments = 26): BufferGeometry {
  const steps = 6
  const points = [new Vector2(radius, 0)]
  for (let i = 1; i <= steps; i++) {
    const t = (i / steps) * (Math.PI / 2)
    points.push(new Vector2(Math.cos(t) * radius, Math.sin(t) * height))
  }
  const g = new LatheGeometry(points, radialSegments)
  g.rotateX(Math.PI / 2)
  g.scale(stretchX, 1, 1)
  g.translate(x, y, baseZ)
  g.deleteAttribute('uv')
  return g
}

/** Spins a [radius, height] profile round the Y axis, then flattens it front to back. */
function revolve(profile: Point[], flatten: number, radialSegments = 22): BufferGeometry {
  // Lathe wants the profile bottom-up for outward-facing walls.
  const points = [...profile].sort((a, b) => a[1] - b[1]).map(([r, y]) => new Vector2(r, y))
  const g = new LatheGeometry(points, radialSegments)
  g.scale(1, 1, flatten)
  g.deleteAttribute('uv')
  return g
}

/** Turns a part built on the front face around so it sits on the back. */
const toBack = (g: BufferGeometry): BufferGeometry => g.rotateY(Math.PI)

const merged = (parts: BufferGeometry[]): BufferGeometry => {
  const g = mergeGeometries(parts)
  if (!g) throw new Error('Could not merge Rotom geometry parts')
  return g
}

/** Paints a vertical gradient into vertex colours, from `from` at the lowest Y to `to` at the highest. */
function gradeByHeight(g: BufferGeometry, from: string, to: string, bias = 1.6): BufferGeometry {
  g.computeBoundingBox()
  const { min, max } = g.boundingBox!
  const pos = g.getAttribute('position')
  const colors = new Float32Array(pos.count * 3)
  const low = new Color(from)
  const high = new Color(to)
  const mixed = new Color()
  for (let i = 0; i < pos.count; i++) {
    const t = Math.pow((pos.getY(i) - min.y) / (max.y - min.y), bias)
    mixed.copy(low).lerp(high, t).toArray(colors, i * 3)
  }
  g.setAttribute('color', new BufferAttribute(colors, 3))
  return g
}

// ---------------------------------------------------------------- the build

/** Every part of Rotom Dex as an indexed geometry, keyed by part name. */
export function buildRotomGeometries(): Record<RotomPart, BufferGeometry> {
  const { frontZ, screen, brow } = ROTOM

  // The tablet body: thin, with softly rounded edges.
  const body = extrude(bodyShape(), { depth: 0.3, bevel: 0.1, frontZ, bevelSegments: 5, curveSegments: 18 })

  // The spike. The anime tints its tip from red toward magenta.
  const spike = gradeByHeight(revolve(SPIKE_PROFILE, 0.56, 26), ROTOM_RED, '#f070b8', 2.4)

  // Screen: a dark hairline frame and the pale display inside it (0..1 UVs).
  const screenTop = screen.y + screen.height / 2
  const frameShape = roundedRect(screen.width + 0.08, screen.height + 0.08, screen.radius + 0.03, 0, screen.y, new Shape())
  frameShape.holes.push(roundedRect(screen.width, screen.height, screen.radius, 0, screen.y, new Path()))
  const screenFrame = inlay(frameShape, frontZ + 0.004, 8)

  const screenGeometry = new ShapeGeometry(roundedRect(screen.width, screen.height, screen.radius, 0, screen.y, new Shape()), 8)
  {
    const pos = screenGeometry.getAttribute('position')
    const uv = screenGeometry.getAttribute('uv')
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, pos.getX(i) / screen.width + 0.5, (pos.getY(i) - screen.y) / screen.height + 0.5)
    }
    screenGeometry.translate(0, 0, frontZ + 0.006)
  }

  // The dark dome between the eyes, standing on the screen's top edge.
  const browShape = new Shape()
  browShape.moveTo(-brow.halfWidth, screenTop)
  browShape.absellipse(0, screenTop, brow.halfWidth, brow.top - screenTop, Math.PI, 0, true, 0)
  browShape.closePath()
  const browGeometry = inlay(browShape, frontZ + 0.005, 20)

  // Two speaker holes on each cheek.
  const speakerHoles = merged(
    [
      [1.04, 0.68],
      [1.1, 0.34],
    ].flatMap(([x, y]) => [inlay(new Shape().absarc(x, y, 0.042, 0, Math.PI * 2, false), frontZ + 0.004, 10), inlay(new Shape().absarc(-x, y, 0.042, 0, Math.PI * 2, false), frontZ + 0.004, 10)]),
  )

  // Two teardrop feet hanging under the body, toes turned out a little.
  const feet = merged(
    [-1, 1].map((side) => {
      const g = revolve(FOOT_PROFILE, 0.8, 20)
      g.scale(0.9, 0.9, 0.9)
      g.rotateZ(side * 0.22)
      g.translate(side * 0.6, -1.5, 0)
      return g
    }),
  )

  // Arms, each around its shoulder joint.
  const armOptions: ExtrudeOptions = { depth: 0.08, bevel: 0.05, frontZ: 0.09, bevelSegments: 3, curveSegments: 6 }
  const armR = extrude(roundedPolygon(ARM_OUTLINE, ARM_CORNERS, new Shape()), armOptions)
  const armL = extrude(roundedPolygon(mirrorX(ARM_OUTLINE), [...ARM_CORNERS].reverse(), new Shape()), armOptions)

  // The oval boss on each hand, front and back, in that arm's own space.
  const [hx, hy] = HAND_CENTER
  const handR = merged([dome(0.17, 0.05, 0.09, hx, hy, 1.65), toBack(dome(0.17, 0.05, 0.09, -hx, hy, 1.65))])
  const handL = merged([dome(0.17, 0.05, 0.09, -hx, hy, 1.65), toBack(dome(0.17, 0.05, 0.09, hx, hy, 1.65))])

  // Back: two moulded lightning bolts, the camera port between them, a small button.
  const boltOptions: ExtrudeOptions = { depth: 0.012, bevel: 0.014, frontZ: frontZ + 0.03, bevelSegments: 2, curveSegments: 4 }
  const backBolts = toBack(merged([extrude(roundedPolygon(BACK_BOLT, 0.04, new Shape()), boltOptions), extrude(roundedPolygon(mirrorX(BACK_BOLT), 0.04, new Shape()), boltOptions)]))
  const backPort = toBack(
    extrude(
      roundedPolygon(
        [
          [-0.3, 0.86],
          [0.3, 0.86],
          [0.22, 0.38],
          [-0.22, 0.38],
        ],
        0.06,
        new Shape(),
      ),
      { depth: 0.02, bevel: 0.016, frontZ: frontZ + 0.04, bevelSegments: 2, curveSegments: 6 },
    ),
  )
  const backLens = toBack(dome(0.15, 0.05, frontZ + 0.04, 0, 0.62))
  const backPupil = toBack(dome(0.075, 0.02, frontZ + 0.082, 0, 0.62, 1, 16))
  const backButton = toBack(dome(0.12, 0.05, frontZ, 0, -0.9))

  const parts: Record<RotomPart, BufferGeometry> = {
    Body: body,
    Spike: spike,
    ScreenFrame: screenFrame,
    Screen: screenGeometry,
    Brow: browGeometry,
    SpeakerHoles: speakerHoles,
    Feet: feet,
    ArmR: armR,
    ArmL: armL,
    HandR: handR,
    HandL: handL,
    BackBolts: backBolts,
    BackPort: backPort,
    BackLens: backLens,
    BackPupil: backPupil,
    BackButton: backButton,
  }

  for (const name of ROTOM_PARTS) {
    const indexed = mergeVertices(parts[name], 1e-5)
    indexed.computeBoundingBox()
    indexed.computeBoundingSphere()
    parts[name] = indexed
  }
  return parts
}
