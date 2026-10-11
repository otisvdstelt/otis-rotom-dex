import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Color, MathUtils, Spherical, Vector2, Vector3, type PerspectiveCamera, type PointLight } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { EMOTION_COLOR, type RotomEmotion } from '../lib/emotion'
import type { RotomPower } from '../lib/expression'
import { CAMERA_FOV, type Framing, type Shot } from '../lib/framing'
import { lookTarget } from '../lib/look'
import { ROTOM } from '../lib/rotomSpec'
import { setOutlineResolution } from '../lib/toon'
import { RotomModel, type RotomScreen } from './RotomModel'
import { Backdrop } from './three/Backdrop'
import { PokeballLoader } from './three/PokeballLoader'

// ------------------------------------------------------------ lighting

/**
 * The light of Rotom's screen. It rides on the body, takes the emotion's
 * colour and pulses in character: a slow amber breath when idle, a cyan
 * strobe while scanning, steady green on success, a red hazard blink on
 * error. Asleep it is a faint ember; starting up, it sputters. (It sits just
 * proud of the glass: a light placed inside the casing would only ever
 * illuminate the inside of it.)
 */
function EmotionLight({ emotion, power }: { emotion: RotomEmotion; power: RotomPower }) {
  const light = useRef<PointLight>(null)
  const target = useMemo(() => new Color(), [])

  useFrame((state, delta) => {
    if (!light.current) return
    const t = state.clock.elapsedTime
    light.current.color.lerp(target.set(EMOTION_COLOR[emotion]), 1 - Math.exp(-delta * 8))
    const pulse = {
      IDLE: 2.4 + Math.sin(t * 1.6) * 0.8,
      SCANNING: 6 + 5 * Math.sin(t * 31) * Math.sin(t * 17.3),
      SUCCESS: 4.5,
      ERROR: Math.sin(t * 12) > 0 ? 9 : 1.2,
    }[emotion]
    const level = power === 'awake' ? pulse : power === 'waking' ? 5 * (0.5 + 0.5 * Math.sin(t * 31) * Math.sin(t * 17.3)) : 0.25
    light.current.intensity += (level - light.current.intensity) * Math.min(1, delta * 20)
  })

  return <pointLight ref={light} position={[0, ROTOM.screen.y + 0.4, ROTOM.frontZ + 0.9]} color={EMOTION_COLOR.IDLE} intensity={2.4} distance={7} decay={1.6} />
}

// ------------------------------------------------------------ camera

const REST = {
  // The wide shot sits a touch off-axis so the body reads as a solid object.
  wide: { theta: 0.14, phi: Math.PI / 2 - 0.05 },
  // The close shot is dead square, so the screen's contents are undistorted.
  close: { theta: 0, phi: Math.PI / 2 },
}

// Scratch values for the camera move (there is one camera).
const spherical = new Spherical()
const offset = new Vector3()

interface CameraRigProps {
  shot: Shot
  framing: Framing
}

/**
 * Moves the camera between the two shots. Each change of shot is one eased
 * move; once it lands (or the moment the user grabs the controls) the orbit
 * is theirs: all the way round Rotom, but never over the top or underneath.
 */
function CameraRig({ shot, framing }: CameraRigProps) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const height = useThree((s) => s.size.height)
  const controls = useRef<OrbitControlsImpl>(null)
  const move = useRef({ active: true, snap: true })

  // Distance at which one model unit covers the requested number of pixels.
  const distanceFor = (pixelsPerUnit: number) => height / (2 * Math.tan(MathUtils.degToRad(CAMERA_FOV / 2)) * pixelsPerUnit)
  const goal = {
    // In the close shot it is the screen plane, not the body centre, that must come out at 1:1.
    distance: distanceFor(framing[shot].pixelsPerUnit) + (shot === 'close' ? ROTOM.frontZ : 0),
    targetY: framing[shot].targetY,
    ...REST[shot],
  }
  const nearest = distanceFor(framing.close.pixelsPerUnit) * 0.8
  const farthest = distanceFor(framing.wide.pixelsPerUnit) * 1.4

  // A new shot, or a resized window, starts a fresh move.
  useEffect(() => {
    move.current.active = true
  }, [shot, goal.distance, goal.targetY])

  useEffect(() => {
    const orbit = controls.current
    if (!orbit) return
    const release = () => {
      move.current.active = false
    }
    orbit.addEventListener('start', release)
    return () => orbit.removeEventListener('start', release)
  }, [])

  useFrame((_, delta) => {
    const orbit = controls.current
    if (!orbit || !move.current.active) return
    const k = move.current.snap ? 1 : 1 - Math.exp(-delta * 5.5)

    spherical.setFromVector3(offset.copy(camera.position).sub(orbit.target))
    spherical.radius += (goal.distance - spherical.radius) * k
    spherical.theta += (goal.theta - spherical.theta) * k
    spherical.phi += (goal.phi - spherical.phi) * k
    orbit.target.set(orbit.target.x * (1 - k), orbit.target.y + (goal.targetY - orbit.target.y) * k, orbit.target.z * (1 - k))
    camera.position.setFromSpherical(spherical).add(orbit.target)
    camera.lookAt(orbit.target)

    move.current.snap = false
    const settled = Math.abs(spherical.radius - goal.distance) < 0.004 && Math.abs(orbit.target.y - goal.targetY) < 0.003 && Math.abs(spherical.theta - goal.theta) < 0.003
    if (settled) move.current.active = false
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.6}
      minDistance={nearest}
      maxDistance={farthest}
      // About 37° above and 23° below level: enough to peek, never enough to flip the view.
      minPolarAngle={Math.PI / 2 - 0.65}
      maxPolarAngle={Math.PI / 2 + 0.4}
    />
  )
}

// ------------------------------------------------------------ per-frame housekeeping

/** Keeps the line weights and Rotom's gaze in step with the canvas and pointer. */
function FrameSync() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const buffer = useMemo(() => new Vector2(), [])
  const projected = useMemo(() => new Vector3(), [])
  const pointer = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY }
    }
    const onLeave = () => {
      pointer.current = null
    }
    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  useFrame(() => {
    gl.getDrawingBufferSize(buffer)
    setOutlineResolution(buffer.x, buffer.y)

    if (!pointer.current) {
      lookTarget.x = 0
      lookTarget.y = 0
      return
    }
    // Pointer position relative to Rotom's eyes on screen, in half-viewport units.
    const rect = gl.domElement.getBoundingClientRect()
    projected.set(0, ROTOM.eye.y, 0).project(camera)
    const eyesX = rect.left + (projected.x * 0.5 + 0.5) * rect.width
    const eyesY = rect.top + (-projected.y * 0.5 + 0.5) * rect.height
    lookTarget.x = MathUtils.clamp((pointer.current.x - eyesX) / (window.innerWidth * 0.4), -1, 1)
    lookTarget.y = MathUtils.clamp(-(pointer.current.y - eyesY) / (window.innerHeight * 0.4), -1, 1)
  })
  return null
}

// ------------------------------------------------------------ the viewport

export interface RotomCanvasProps {
  emotion: RotomEmotion
  power: RotomPower
  speaking: boolean
  /** Wear the big grin instead of the resting smile. */
  grinning: boolean
  /** Counts cheers; each new value makes Rotom hop. */
  cheer: number
  reducedMotion: boolean
  /** Rotom was clicked or tapped. */
  onPoke: () => void
  /** Which of the two camera shots to hold. */
  shot: Shot
  framing: Framing
  /** What Rotom's screen displays. */
  screen: RotomScreen
}

/**
 * The 3D viewport: sky, lights, camera controls and Rotom. Rotom is wrapped in
 * Suspense, so a spinning Poké Ball holds the stage while its assets load.
 */
export default function RotomCanvas({ emotion, power, speaking, grinning, cheer, reducedMotion, onPoke, shot, framing, screen }: RotomCanvasProps) {
  return (
    <Canvas shadows="percentage" flat dpr={[1, 2]} gl={{ antialias: false, powerPreference: 'high-performance' }} camera={{ fov: CAMERA_FOV, near: 0.4, far: 90, position: [2, 1.4, 16] }} style={{ touchAction: 'none' }}>
      <Backdrop emotion={emotion} power={power} />

      {/*
        Cel lighting, in three's physical units (a lit surface shows
        albedo * light / PI). The cool ambient sets the shadow tone, the warm
        key adds the lit band, and together they land on each part's true colour.
      */}
      <ambientLight color="#e4e6ff" intensity={Math.PI * 0.64} />
      <directionalLight color="#fff4dc" intensity={Math.PI * 0.42} position={[3.5, 6, 6]} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0006} shadow-normalBias={0.04}>
        <orthographicCamera attach="shadow-camera" args={[-5, 5, 5, -5, 1, 26]} />
      </directionalLight>

      <Suspense fallback={<PokeballLoader />}>
        <RotomModel emotion={emotion} power={power} speaking={speaking} grinning={grinning} cheer={cheer} reducedMotion={reducedMotion} presenting={shot === 'close'} onPoke={onPoke} screen={screen}>
          <EmotionLight emotion={emotion} power={power} />
        </RotomModel>
      </Suspense>

      <CameraRig shot={shot} framing={framing} />
      <FrameSync />

      {/* Only values brighter than white bloom: the plasma aura and the sparks. */}
      <EffectComposer multisampling={4} enableNormalPass={false}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.03} intensity={0.85} radius={0.72} />
      </EffectComposer>
    </Canvas>
  )
}
