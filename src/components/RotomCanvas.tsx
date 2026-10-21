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

// Lighting

/** Screen light in the emotion colour, pulsing per state. Sits just outside the glass */
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

// Camera

const REST = {
  // Wide shot slightly off axis for depth
  wide: { theta: 0.14, phi: Math.PI / 2 - 0.05 },
  // Close shot square so the screen is undistorted
  close: { theta: 0, phi: Math.PI / 2 },
}

// Scratch values for the camera move
const spherical = new Spherical()
const offset = new Vector3()

interface CameraRigProps {
  shot: Shot
  framing: Framing
}

/** Eases between shots, then hands orbit control to the user without flipping */
function CameraRig({ shot, framing }: CameraRigProps) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const height = useThree((s) => s.size.height)
  const controls = useRef<OrbitControlsImpl>(null)
  const move = useRef({ active: true, snap: true })

  // Distance where one model unit covers the wanted pixels
  const distanceFor = (pixelsPerUnit: number) => height / (2 * Math.tan(MathUtils.degToRad(CAMERA_FOV / 2)) * pixelsPerUnit)
  const goal = {
    // Close shot measures at the screen plane
    distance: distanceFor(framing[shot].pixelsPerUnit) + (shot === 'close' ? ROTOM.frontZ : 0),
    targetY: framing[shot].targetY,
    ...REST[shot],
  }
  const nearest = distanceFor(framing.close.pixelsPerUnit) * 0.8
  const farthest = distanceFor(framing.wide.pixelsPerUnit) * 1.4

  // New shot or resize starts a fresh move
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
      // Limit tilt so the view never flips
      minPolarAngle={Math.PI / 2 - 0.65}
      maxPolarAngle={Math.PI / 2 + 0.4}
    />
  )
}

// Per frame upkeep

/** Keeps line widths and gaze in sync with canvas and pointer */
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
    // Pointer offset from the eyes in half viewport units
    const rect = gl.domElement.getBoundingClientRect()
    projected.set(0, ROTOM.eye.y, 0).project(camera)
    const eyesX = rect.left + (projected.x * 0.5 + 0.5) * rect.width
    const eyesY = rect.top + (-projected.y * 0.5 + 0.5) * rect.height
    lookTarget.x = MathUtils.clamp((pointer.current.x - eyesX) / (window.innerWidth * 0.4), -1, 1)
    lookTarget.y = MathUtils.clamp(-(pointer.current.y - eyesY) / (window.innerHeight * 0.4), -1, 1)
  })
  return null
}

// Viewport

export interface RotomCanvasProps {
  emotion: RotomEmotion
  power: RotomPower
  speaking: boolean
  /** Big grin instead of the resting smile */
  grinning: boolean
  /** Cheer counter, each change makes Rotom hop */
  cheer: number
  reducedMotion: boolean
  onPoke: () => void
  /** Camera shot to hold */
  shot: Shot
  framing: Framing
  /** What the screen displays */
  screen: RotomScreen
}

/** 3D viewport with sky, lights, controls and Rotom, a Poké Ball shows while loading */
export default function RotomCanvas({ emotion, power, speaking, grinning, cheer, reducedMotion, onPoke, shot, framing, screen }: RotomCanvasProps) {
  return (
    <Canvas shadows="percentage" flat dpr={[1, 2]} gl={{ antialias: false, powerPreference: 'high-performance' }} camera={{ fov: CAMERA_FOV, near: 0.4, far: 90, position: [2, 1.4, 16] }} style={{ touchAction: 'none' }}>
      <Backdrop emotion={emotion} power={power} />

      {/* Cool ambient sets shadows, warm key adds the lit band */}
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

      {/* Only values above white bloom */}
      <EffectComposer multisampling={4} enableNormalPass={false}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.03} intensity={0.85} radius={0.72} />
      </EffectComposer>
    </Canvas>
  )
}
