import { Html, Line, useGLTF, useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import {
  AdditiveBlending,
  Box3,
  Color,
  MathUtils,
  MeshBasicMaterial,
  MeshToonMaterial,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector3,
  type BufferGeometry,
  type Group,
  type Material,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
  type Texture,
} from 'three'
import type { Line2 } from 'three-stdlib'
import { EYE_TEXTURES, FACE_TEXTURES, ROTOM_ASSET_URL } from '../lib/assets'
import { EMOTION_COLOR, type RotomEmotion } from '../lib/emotion'
import { pickExpression, type RotomPower } from '../lib/expression'
import { FACE_BROW, type EyeKey, type FaceKey } from '../lib/faceArt'
import { lookTarget } from '../lib/look'
import { buildRotomGeometries, ROTOM, ROTOM_PART_PIVOT, ROTOM_PARTS, ROTOM_RED, type RotomPart } from '../lib/rotomGeometry'
import { inkOutline, plasmaAura, toonGradient } from '../lib/toon'

// ------------------------------------------------------------ materials

const toon = (color: string) => new MeshToonMaterial({ color, gradientMap: toonGradient })

// One Rotom lives for the whole session, so its materials are module singletons.
const materials = {
  red: toon(ROTOM_RED),
  /** Feet, hand bosses and the mouldings on the back: the same plastic, a shade deeper. */
  redDeep: toon('#b9272e'),
  /** The spike takes its red-to-magenta gradient from vertex colours. */
  spike: new MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: toonGradient }),
  ink: new MeshBasicMaterial({ color: '#1c1e2e' }),
  /** The display itself; unlit, because a screen is its own light. */
  screen: new MeshBasicMaterial({ color: '#f4f7ff' }),
  /** The dome between the eyes: part of the display, dark until Rotom's face rises into it. */
  brow: new MeshBasicMaterial({ color: FACE_BROW }),
  white: toon('#ffffff'),
  pupil: new MeshBasicMaterial({ color: '#2f55c6' }),
}

const PART_MATERIAL: Record<RotomPart, Material> = {
  Body: materials.red,
  Spike: materials.spike,
  ScreenFrame: materials.ink,
  Screen: materials.screen,
  Brow: materials.brow,
  SpeakerHoles: materials.ink,
  Feet: materials.redDeep,
  ArmR: materials.red,
  ArmL: materials.red,
  HandR: materials.red,
  HandL: materials.red,
  HandSensor: materials.redDeep,
  BackBolts: materials.redDeep,
  BackPort: materials.redDeep,
  BackLens: materials.white,
  BackPupil: materials.pupil,
  BackButton: materials.redDeep,
}

// Flat inlays read better without an ink line round them.
const NO_OUTLINE: ReadonlySet<RotomPart> = new Set(['ScreenFrame', 'Screen', 'Brow', 'SpeakerHoles', 'BackPupil'])
// The big shapes that carry the glow of the Rotom inside.
const HAS_AURA: ReadonlySet<RotomPart> = new Set(['Body', 'Spike', 'ArmR', 'ArmL', 'Feet'])
const SPIKE_PARTS: RotomPart[] = ['Spike']
const RIGHT_ARM_PARTS: RotomPart[] = ['ArmR', 'HandR']
const LEFT_ARM_PARTS: RotomPart[] = ['ArmL', 'HandL', 'HandSensor']
const MOVING: ReadonlySet<RotomPart> = new Set([...SPIKE_PARTS, ...RIGHT_ARM_PARTS, ...LEFT_ARM_PARTS])

const SCREEN_WHITE = new Color('#f4f7ff')

// ------------------------------------------------------------ props

/** What Rotom shows on its own screen instead of its face. */
export interface RotomScreen {
  /** The interface to display. Rendered as real HTML, mapped onto the screen in 3D. */
  content: ReactNode
  /** False while Rotom's face has the screen (idle chatter, scanning, errors). */
  visible: boolean
  /** Size of the content, in CSS pixels, and how many of those make one model unit. */
  width: number
  height: number
  pixelsPerUnit: number
}

export interface RotomModelProps {
  emotion: RotomEmotion
  /** True while the speech engine is talking; the mouth moves along. */
  speaking: boolean
  /** Shrinks shakes, lunges and spins for people who asked for less motion. */
  reducedMotion: boolean
  /** True when Rotom is holding its screen up to be read: it steadies itself. */
  presenting: boolean
  /** Asleep, starting up, or awake. */
  power: RotomPower
  /** Wear the big grin instead of the resting smile. */
  grinning: boolean
  /** Counts cheers; each new value makes Rotom hop with its eyes squeezed shut. */
  cheer: number
  /** Called when Rotom's body is clicked or tapped (not dragged). */
  onPoke?: () => void
  screen: RotomScreen
  /** Extra objects attached to Rotom's body, such as its emotion light. */
  children?: ReactNode
}

type PartGeometries = Record<RotomPart, BufferGeometry>

// ------------------------------------------------------------ small pieces

function Part({ name, geometry }: { name: RotomPart; geometry: BufferGeometry }) {
  return (
    <>
      <mesh name={name} geometry={geometry} material={PART_MATERIAL[name]} castShadow receiveShadow />
      {HAS_AURA.has(name) && <mesh geometry={geometry} material={plasmaAura} renderOrder={-2} />}
      {!NO_OUTLINE.has(name) && <mesh geometry={geometry} material={inkOutline} renderOrder={-1} />}
    </>
  )
}

const sRGB = (loaded: Texture | Texture[] | Record<string, Texture>) => {
  for (const texture of Object.values(loaded as Record<string, Texture>)) {
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 8
  }
}

// ------------------------------------------------------------ face

interface FaceProps {
  emotion: RotomEmotion
  power: RotomPower
  speaking: boolean
  grinning: boolean
  cheer: number
  /** While data fills the screen, the mouth layer is hidden; the eyes stay. */
  screenBusy: boolean
}

/**
 * Rotom's face, in the two layers the real device has. The eyes are a plane
 * on the body that overlaps the top of the screen; the blue face and mouth
 * are a plane on the screen itself, rising into the dark dome between the
 * eyes. Both are unlit and swap their texture to match the emotion; the eyes
 * blink and the mouth moves with speech.
 */
function Face({ emotion, power, speaking, grinning, cheer, screenBusy }: FaceProps) {
  const eyeTextures = useTexture(EYE_TEXTURES, sRGB)
  const faceTextures = useTexture(FACE_TEXTURES, sRGB)
  const eyes = useRef<Mesh>(null)
  const eyeMaterial = useRef<MeshBasicMaterial>(null)
  const faceMaterial = useRef<MeshBasicMaterial>(null)
  const shown = useRef<{ eyes: EyeKey; face: FaceKey; emotion: RotomEmotion; since: number; cheer: number; cheerUntil: number; busy: boolean; busySince: number }>({
    eyes: 'sleep',
    face: 'idle',
    emotion,
    since: 0,
    cheer,
    cheerUntil: 0,
    busy: screenBusy,
    busySince: -10,
  })
  const pop = useRef(0)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const s = shown.current
    if (s.emotion !== emotion) {
      s.emotion = emotion
      s.since = t
      pop.current = 1
    }
    if (s.cheer !== cheer) {
      s.cheer = cheer
      s.cheerUntil = t + 1.3
      pop.current = 1
    }

    const next = pickExpression({ emotion, power, speaking, time: t, sinceEmotion: t - s.since, grinning, cheering: t < s.cheerUntil })

    if (eyeMaterial.current && next.eyes !== s.eyes) {
      s.eyes = next.eyes
      eyeMaterial.current.map = eyeTextures[next.eyes]
    }
    if (faceMaterial.current) {
      if (next.face !== s.face) {
        s.face = next.face
        faceMaterial.current.map = faceTextures[next.face]
      }
      // The face gives way to whatever the screen displays, but only once
      // that has faded in over it; and it is back the instant the screen
      // clears. The bare white screen never shows in between.
      if (s.busy !== screenBusy) {
        s.busy = screenBusy
        s.busySince = t
      }
      faceMaterial.current.visible = !screenBusy || t - s.busySince < SCREEN_FADE_SECONDS + 0.05
    }

    if (eyes.current) {
      // A new expression lands with a small pop.
      pop.current = Math.max(0, pop.current - delta * 5)
      eyes.current.scale.setScalar(1 + pop.current * 0.1)
      // The eyes drift toward the pointer a little.
      const follow = power === 'awake' && (emotion === 'IDLE' || emotion === 'SUCCESS') ? 1 : 0
      eyes.current.position.x += (lookTarget.x * 0.03 * follow - eyes.current.position.x) * Math.min(1, delta * 8)
      eyes.current.position.y += (ROTOM.eyes.y + lookTarget.y * 0.02 * follow - eyes.current.position.y) * Math.min(1, delta * 8)
    }
  })

  return (
    <>
      <mesh position={[0, ROTOM.face.y, ROTOM.frontZ + 0.009]} renderOrder={2}>
        <planeGeometry args={[ROTOM.face.width, ROTOM.face.height]} />
        <meshBasicMaterial ref={faceMaterial} map={faceTextures.idle} transparent depthWrite={false} />
      </mesh>
      <mesh ref={eyes} position={[0, ROTOM.eyes.y, ROTOM.frontZ + 0.014]} renderOrder={3}>
        <planeGeometry args={[ROTOM.eyes.width, ROTOM.eyes.height]} />
        <meshBasicMaterial ref={eyeMaterial} map={eyeTextures.sleep} transparent depthWrite={false} />
      </mesh>
    </>
  )
}

// ------------------------------------------------------------ the screen as a display

/** How long the screen's content takes to fade in. */
const SCREEN_FADE_SECONDS = 0.22
/** The top of the menus' title bar, and of the switched-off screen. */
const HEADER_MENU = new Color('#62caf2')
const HEADER_OFF = new Color('#5f7e77')

/**
 * The strip along the top of the screen that the bottoms of the eyes hang
 * over. The interface laid on the screen is HTML, which cannot pass behind
 * the eyes, so this strip continues its title bar in the 3D scene instead.
 */
function ScreenHeader({ visible, power }: { visible: boolean; power: RotomPower }) {
  const material = useRef<MeshBasicMaterial>(null)
  const geometry = useMemo(() => {
    const { screen: plate, eyeOverlap } = ROTOM
    const half = plate.width / 2
    const top = plate.y + plate.height / 2
    const r = plate.radius
    const s = new Shape()
    s.moveTo(-half, top - eyeOverlap)
    s.lineTo(-half, top - r)
    s.quadraticCurveTo(-half, top, -half + r, top)
    s.lineTo(half - r, top)
    s.quadraticCurveTo(half, top, half, top - r)
    s.lineTo(half, top - eyeOverlap)
    s.closePath()
    return new ShapeGeometry(s, 8)
  }, [])

  useFrame((_, delta) => {
    const m = material.current
    if (!m) return
    // In step with the content below it: in softly, out at once.
    m.opacity = visible ? Math.min(1, m.opacity + delta / SCREEN_FADE_SECONDS) : 0
    m.visible = m.opacity > 0.01
    m.color.copy(power === 'awake' ? HEADER_MENU : HEADER_OFF)
  })

  return (
    <mesh geometry={geometry} position={[0, 0, ROTOM.frontZ + 0.008]} renderOrder={1}>
      <meshBasicMaterial ref={material} transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

/** How far one notch of a line-based mouse wheel scrolls, in pixels. */
const WHEEL_LINE = 34

/**
 * Whatever Rotom is showing on its screen: live HTML, laid onto the screen in
 * 3D so it tilts, bobs and lunges with the body. It covers the screen below
 * the strip the eyes hang over.
 */
function ScreenDisplay({ screen, facing, presenting }: { screen: RotomScreen; facing: { current: boolean }; presenting: boolean }) {
  const frame = useRef<HTMLDivElement>(null)
  const canvas = useThree((s) => s.gl.domElement)
  const { screen: plate, eyeOverlap } = ROTOM
  const unit = screen.pixelsPerUnit

  useFrame(() => {
    // Hidden from behind: HTML has no back face, so without this it would show through the body.
    if (frame.current) frame.current.style.visibility = facing.current ? 'visible' : 'hidden'
  })

  // While Rotom holds its screen up, the wheel scrolls that screen from
  // anywhere over the scene, not only from right on top of it. (Seen from a
  // distance, the wheel still zooms the camera.)
  const listening = screen.visible && presenting
  useEffect(() => {
    if (!listening) return
    const onWheel = (event: WheelEvent) => {
      if (event.target !== canvas || event.ctrlKey) return
      const scroller = frame.current?.querySelector<HTMLElement>('.dex-scroll')
      if (!scroller) return
      event.preventDefault()
      event.stopPropagation()
      scroller.scrollTop += event.deltaMode === 1 ? event.deltaY * WHEEL_LINE : event.deltaMode === 2 ? event.deltaY * scroller.clientHeight : event.deltaY
    }
    window.addEventListener('wheel', onWheel, { capture: true, passive: false })
    return () => window.removeEventListener('wheel', onWheel, { capture: true })
  }, [listening, canvas])

  return (
    <Html transform position={[0, plate.y - eyeOverlap / 2, ROTOM.frontZ + 0.012]} distanceFactor={400 / unit} zIndexRange={[5, 0]} pointerEvents={screen.visible ? 'auto' : 'none'}>
      <div
        ref={frame}
        style={{
          width: screen.width,
          height: screen.height,
          borderRadius: `0 0 ${plate.radius * unit}px ${plate.radius * unit}px`,
          overflow: 'hidden',
          opacity: screen.visible ? 1 : 0,
          // Content appears softly but clears at once, so Rotom's face can flash up between screens.
          transition: screen.visible ? `opacity ${SCREEN_FADE_SECONDS * 1000}ms ease-out` : 'none',
        }}
        aria-hidden={!screen.visible}
        // Scrolling and dragging on the display belong to the display, not to the camera.
        onWheel={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {screen.content}
      </div>
    </Html>
  )
}

// ------------------------------------------------------------ electricity

const ARC_SEGMENTS = 9
const ARC_PATHS: [Vector3, Vector3][] = [
  [new Vector3(0, 2.66, 0), new Vector3(1.52, 0.46, 0.05)],
  [new Vector3(0, 2.66, 0), new Vector3(-1.52, 0.46, 0.05)],
  [new Vector3(1.5, 0.42, 0.05), new Vector3(2.7, -0.3, 0.1)],
  [new Vector3(-1.5, 0.42, 0.05), new Vector3(-2.7, -0.3, 0.1)],
]
const ARC_COLOR = new Color(1.6, 2.6, 3.2)
const ARC_START = Array.from({ length: ARC_SEGMENTS + 1 }, () => [0, 0, 0] as [number, number, number])

/** Jagged sparks that jump from the spike to the ears and hands while Rotom is computing or starting up. */
function ElectricArcs({ active }: { active: boolean }) {
  const lines = useRef<(Line2 | null)[]>([])
  const nextStrike = useRef(0)
  const scratch = useMemo(() => new Vector3(), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!active) {
      for (const line of lines.current) if (line) line.visible = false
      return
    }
    if (t < nextStrike.current) return
    nextStrike.current = t + 0.05 + Math.random() * 0.05

    lines.current.forEach((line, index) => {
      if (!line) return
      line.visible = Math.random() > 0.4
      if (!line.visible) return
      const [from, to] = ARC_PATHS[index]
      const positions: number[] = []
      for (let i = 0; i <= ARC_SEGMENTS; i++) {
        const k = i / ARC_SEGMENTS
        // Largest wander mid-span, pinned at both ends.
        const wander = Math.sin(k * Math.PI) * 0.26
        scratch.lerpVectors(from, to, k)
        positions.push(scratch.x + (Math.random() - 0.5) * wander, scratch.y + (Math.random() - 0.5) * wander, scratch.z + (Math.random() - 0.5) * wander * 0.5)
      }
      line.geometry.setPositions(positions)
    })
  })

  return (
    <>
      {ARC_PATHS.map((_, index) => (
        <Line
          key={index}
          ref={(line) => {
            lines.current[index] = line as Line2 | null
          }}
          points={ARC_START}
          color={ARC_COLOR}
          lineWidth={2.5}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          visible={false}
          frustumCulled={false}
        />
      ))}
    </>
  )
}

// ------------------------------------------------------------ the rig and its emotion engine

const EMOTIONS: RotomEmotion[] = ['IDLE', 'SCANNING', 'SUCCESS', 'ERROR']
const SUCCESS_MOVE_SECONDS = 1.15
const HOP_SECONDS = 0.5
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

// Scratch values for the frame loop (there is only ever one Rotom).
const mood = new Color(EMOTION_COLOR.IDLE)
const moodTarget = new Color()
const towardCamera = new Vector3()
const forward = new Vector3()
const worldPosition = new Vector3()

/** How hard the error shake is, `since` seconds after the error: a long first fit, then short relapses. */
function errorShake(since: number): number {
  if (since < 1.2) return 1
  if (since < 1.6) return 1 - (since - 1.2) / 0.4
  return (since - 1.6) % 3.4 > 2.95 ? 0.7 : 0
}

interface RigProps extends RotomModelProps {
  /** Named parts, when the model provides them. */
  parts: PartGeometries | null
  /** Any other model, shown whole (no moving arms). */
  custom?: Object3D
}

function RotomRig({ parts, custom, emotion, speaking, reducedMotion, presenting, power, grinning, cheer, onPoke, screen, children }: RigProps) {
  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const armL = useRef<Group>(null)
  const armR = useRef<Group>(null)
  const spike = useRef<Group>(null)

  // Each emotion's influence, 0..1. They cross-fade, so changing state never snaps the pose.
  const weights = useRef<Record<RotomEmotion, number>>({ IDLE: 1, SCANNING: 0, SUCCESS: 0, ERROR: 0 })
  const cue = useRef({ emotion, startedAt: 0 })
  const look = useRef({ yaw: 0, pitch: 0 })
  const steady = useRef(0)
  /** 1 while asleep, 0 once awake; and how strongly the start-up jolt is running. */
  const slumber = useRef(power === 'asleep' ? 1 : 0)
  const boot = useRef(0)
  /** Small jumps: one when it wakes, one each time it cheers. */
  const hop = useRef({ power, cheer, startedAt: -10 })
  /** Whether the screen is turned toward the viewer; read by the HTML display. */
  const facing = useRef(true)

  // The pointer cursor shown over Rotom must not outlive it.
  useEffect(
    () => () => {
      document.body.style.cursor = ''
    },
    [],
  )

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()
    if (cue.current.emotion !== emotion) cue.current = { emotion, startedAt: t }
    const since = t - cue.current.startedAt

    const w = weights.current
    const blend = 1 - Math.exp(-delta * 9)
    for (const key of EMOTIONS) w[key] += ((key === emotion ? 1 : 0) - w[key]) * blend

    // Power: asleep it hangs limp; starting up it crackles; then it is itself.
    slumber.current += ((power === 'asleep' ? 1 : power === 'waking' ? 0.45 : 0) - slumber.current) * (1 - Math.exp(-delta * 5))
    boot.current += ((power === 'waking' ? 1 : 0) - boot.current) * (1 - Math.exp(-delta * 10))
    const asleep = slumber.current
    const awake = 1 - asleep
    const booting = boot.current
    if (hop.current.power !== power || hop.current.cheer !== cheer) {
      const jump = (hop.current.power === 'waking' && power === 'awake') || hop.current.cheer !== cheer
      hop.current = { power, cheer, startedAt: jump ? t : hop.current.startedAt }
    }
    const hopProgress = (t - hop.current.startedAt) / HOP_SECONDS
    const hopping = hopProgress >= 0 && hopProgress < 1 ? Math.sin(Math.PI * hopProgress) : 0

    // While it holds its screen up to be read, Rotom keeps nearly still.
    steady.current += ((presenting ? 1 : 0) - steady.current) * Math.min(1, delta * 4)
    const drift = (1 - steady.current * 0.8) * awake
    // It may still bob, but it must not tilt: the screen has to stay square to be read.
    const turn = (1 - steady.current * 0.97) * awake

    const calm = reducedMotion ? 0.2 : 1
    const shake = emotion === 'ERROR' ? errorShake(since) * calm : 0
    // Two unrelated frequencies multiplied: an irregular electrical flicker.
    const flicker = 0.5 + 0.5 * Math.sin(t * 31) * Math.sin(t * 17.3)
    // Scanning and starting up share the same electric jitter.
    const charge = Math.min(1, w.SCANNING * awake + booting)

    // IDLE: a slow float with a lazy tilt.
    const idleY = Math.sin(t * 2) * 0.15 * drift
    const idleTilt = Math.sin(t * 0.9 + 1) * 0.07 * turn
    // SCANNING: fast, small, never-repeating jitter on every axis.
    const jitterX = (Math.sin(t * 61) * 0.022 + Math.sin(t * 97) * 0.014) * calm
    const jitterY = (Math.sin(t * 71) * 0.02 + Math.sin(t * 113) * 0.012) * calm
    const tremor = Math.sin(t * 53) * 0.03 * calm
    // SUCCESS: after the lunge, a higher, bouncier float.
    const joyY = (0.06 + Math.sin(t * 3.2) * 0.18) * drift
    const joyTilt = Math.sin(t * 1.6) * 0.09 * turn
    // ERROR: violent left-right shake, then a slump.
    const shakeX = Math.sin(t * 40) * 0.1 * shake
    // ASLEEP: hanging low, nodding forward, breathing slowly.
    const sleepY = -0.34 + Math.sin(t * 0.9) * 0.035

    // Glance toward the pointer when relaxed and not being read.
    const attention = (w.IDLE + w.SUCCESS * 0.6) * turn
    look.current.yaw += (MathUtils.clamp(lookTarget.x, -1, 1) * 0.3 * attention - look.current.yaw) * Math.min(1, delta * 4)
    look.current.pitch += (MathUtils.clamp(-lookTarget.y, -1, 1) * 0.16 * attention - look.current.pitch) * Math.min(1, delta * 4)

    // SUCCESS one-shot: lunge at the viewer while spinning once, then settle.
    let lunge = 0
    let spin = 0
    let pop = 1
    if (emotion === 'SUCCESS' && since < SUCCESS_MOVE_SECONDS) {
      const p = since / SUCCESS_MOVE_SECONDS
      lunge = Math.sin(Math.PI * p) * (reducedMotion ? 0.25 : 1.3)
      spin = reducedMotion ? 0 : Math.PI * 2 * easeInOutCubic(p)
      pop = 1 + Math.sin(Math.PI * p) * 0.08
    }

    if (root.current) {
      towardCamera.copy(state.camera.position).normalize()
      root.current.position.set(
        charge * jitterX + w.ERROR * shakeX + towardCamera.x * lunge,
        w.IDLE * idleY + charge * jitterY + w.SUCCESS * joyY + w.ERROR * awake * (-0.14 + Math.sin(t * 1.3) * 0.04) + asleep * sleepY + hopping * 0.32 * calm + towardCamera.y * lunge,
        towardCamera.z * lunge,
      )
      root.current.rotation.set(
        look.current.pitch + charge * (0.06 + Math.sin(t * 43) * 0.02 * calm) + w.ERROR * awake * 0.16 + asleep * 0.2,
        look.current.yaw + charge * Math.sin(t * 37) * 0.045 * calm + spin,
        w.IDLE * idleTilt + charge * tremor + w.SUCCESS * joyTilt + w.ERROR * Math.sin(t * 40) * 0.035 * shake + asleep * 0.07,
      )
      root.current.scale.setScalar(pop + hopping * 0.05)

      // Is the screen turned toward the camera?
      root.current.getWorldDirection(forward)
      root.current.getWorldPosition(worldPosition)
      facing.current = forward.dot(towardCamera.copy(state.camera.position).sub(worldPosition).normalize()) > 0.2
    }
    // Breathing: quick and shallow awake, slow and deep asleep.
    if (body.current) body.current.scale.set(1, 1 + Math.sin(t * 2) * 0.01 * (w.IDLE + w.SUCCESS) * drift + Math.sin(t * 0.9) * 0.014 * asleep, 1)

    // Arms. At rest they are held out, paddles a little raised, as in the
    // anime. Idle sways them, scanning lifts and trembles them, success throws
    // them up, error and sleep let them hang.
    const arm = (phase: number) =>
      awake *
        (w.IDLE * Math.sin(t * 2 + phase) * 0.1 +
          w.SCANNING * (0.3 + Math.sin(t * 47 + phase) * 0.05 * calm) +
          w.SUCCESS * (0.5 + Math.sin(t * 10 + phase) * 0.18) +
          w.ERROR * (-0.62 + Math.sin(t * 40) * 0.06 * shake)) +
      asleep * (-0.86 + Math.sin(t * 0.9 + phase) * 0.02) +
      booting * Math.sin(t * 47 + phase) * 0.07 * calm +
      hopping * 0.35
    if (armR.current) {
      armR.current.rotation.z = arm(0.6)
      armR.current.rotation.y = Math.sin(t * 2.3) * 0.14 * w.IDLE * awake
    }
    if (armL.current) {
      armL.current.rotation.z = -arm(1.9)
      armL.current.rotation.y = -Math.sin(t * 2.3 + 0.7) * 0.14 * w.IDLE * awake
    }
    if (spike.current) {
      spike.current.rotation.z =
        awake * (w.IDLE * Math.sin(t * 1.7) * 0.05 + w.SUCCESS * Math.sin(t * 11) * 0.09 + w.ERROR * 0.2) + charge * Math.sin(t * 51) * 0.05 * calm + asleep * 0.14
    }

    // The glow of the Rotom inside takes the emotion's colour. Asleep, there is none.
    mood.lerp(moodTarget.set(EMOTION_COLOR[emotion]), 1 - Math.exp(-delta * 8))
    const alarm = Math.sin(t * 12) > 0 ? 1 : 0.15
    ;(plasmaAura.uniforms.color.value as Color).copy(mood)
    plasmaAura.uniforms.strength.value =
      awake * (w.IDLE * (0.3 + 0.1 * Math.sin(t * 2)) + w.SCANNING * (1.5 + 1.3 * flicker) + w.SUCCESS * (0.9 + 0.25 * Math.sin(t * 8)) + w.ERROR * 1.4 * alarm) +
      booting * (0.6 + 1.6 * flicker) +
      hopping * 0.8
    // The screen's white picks up a breath of that colour when something is happening.
    materials.screen.color.copy(SCREEN_WHITE).lerp(mood, 0.14 * charge * (0.5 + flicker) + 0.1 * w.ERROR * alarm)
  })

  const jointed = (ref: RefObject<Group | null>, names: RotomPart[], geometries: PartGeometries) => (
    <group ref={ref} position={ROTOM_PART_PIVOT[names[0]]}>
      {names.map((name) => (
        <Part key={name} name={name} geometry={geometries[name]} />
      ))}
    </group>
  )

  return (
    <group
      ref={root}
      // A click that was not the end of a drag is a poke.
      onClick={(event) => {
        if (event.delta > 4 || !onPoke) return
        event.stopPropagation()
        onPoke()
      }}
      onPointerOver={() => {
        if (onPoke) document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = ''
      }}
    >
      <group ref={body}>
        {parts
          ? ROTOM_PARTS.filter((name) => !MOVING.has(name)).map((name) => <Part key={name} name={name} geometry={parts[name]} />)
          : custom && <primitive object={custom} />}

        {parts && (
          <>
            {jointed(spike, SPIKE_PARTS, parts)}
            {jointed(armR, RIGHT_ARM_PARTS, parts)}
            {jointed(armL, LEFT_ARM_PARTS, parts)}
            <ElectricArcs active={power === 'waking' || (power === 'awake' && emotion === 'SCANNING')} />
          </>
        )}

        {/* A missing face image must not take the whole body down with it. */}
        <AssetBoundary fallback={null}>
          <Suspense fallback={null}>
            <Face emotion={emotion} power={power} speaking={speaking} grinning={grinning} cheer={cheer} screenBusy={screen.visible} />
          </Suspense>
        </AssetBoundary>
        <ScreenHeader visible={screen.visible} power={power} />
        <ScreenDisplay screen={screen} facing={facing} presenting={presenting} />

        {children}
      </group>
    </group>
  )
}

// ------------------------------------------------------------ sources for the body

/**
 * Someone dropped a different model in place of rotom_device.glb. Cel-shade it
 * and scale it to Rotom's height; the face and screen are laid over its front.
 */
function adoptForeignModel(scene: Object3D): Object3D {
  const convert = (material: Material) => {
    const source = material as MeshStandardMaterial
    return new MeshToonMaterial({ color: source.color, map: source.map ?? null, gradientMap: toonGradient, transparent: source.transparent, opacity: source.opacity, side: source.side })
  }
  scene.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh) return
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material)
    mesh.castShadow = true
  })
  scene.updateMatrixWorld(true)
  const box = new Box3().setFromObject(scene)
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())
  const scale = 2.6 / Math.max(size.y, 1e-4)
  scene.scale.setScalar(scale)
  // Sit its front face where Rotom's own would be.
  scene.position.set(-center.x * scale, -center.y * scale, ROTOM.frontZ - box.max.z * scale)
  return scene
}

/** The model file, when it loads. */
function RotomFromAsset(props: RotomModelProps) {
  const gltf = useGLTF(ROTOM_ASSET_URL)

  const prepared = useMemo(() => {
    const nodes = gltf.nodes as Record<string, Mesh | undefined>
    if (ROTOM_PARTS.every((name) => nodes[name]?.geometry)) {
      return { parts: Object.fromEntries(ROTOM_PARTS.map((name) => [name, nodes[name]!.geometry])) as PartGeometries, custom: undefined }
    }
    return { parts: null, custom: adoptForeignModel(gltf.scene) }
  }, [gltf])

  return <RotomRig {...props} {...prepared} />
}

/** The same body built from code, for when the model file is missing or broken. */
function RotomFromPrimitives(props: RotomModelProps) {
  const parts = useMemo(() => buildRotomGeometries(), [])
  return <RotomRig {...props} parts={parts} />
}

class AssetBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('[Rotom Dex] An asset failed to load; using the built-in fallback.', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/**
 * Rotom Dex. Loads its body from /assets/rotom_device.glb and, if that file is
 * missing, builds the same body from Three.js primitives. Either way the
 * emotion engine in RotomRig animates it, swaps its face, and lays the
 * interface onto its screen.
 */
export function RotomModel(props: RotomModelProps) {
  return (
    <AssetBoundary fallback={<RotomFromPrimitives {...props} />}>
      <RotomFromAsset {...props} />
    </AssetBoundary>
  )
}
