import { ScreenQuad } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, Vector2, Vector3, type ShaderMaterial } from 'three'
import { EMOTION_COLOR, type RotomEmotion } from '../../lib/emotion'
import type { RotomPower } from '../../lib/expression'

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`

// Anime title card sky, measured from Rotom position so the sun sits behind it
const fragmentShader = /* glsl */ `
  uniform vec2 uResolution;
  uniform vec2 uCenter;
  uniform float uUnit;
  uniform float uTime;
  uniform vec3 uSkyTop;
  uniform vec3 uSkyMid;
  uniform vec3 uSkyLow;
  uniform vec3 uMood;
  uniform float uScan;
  uniform float uAlarm;
  uniform float uGloom;
  uniform float uBurst;
  uniform float uPower;

  // Crisp disc, 1 inside and 0 outside
  float disc(float r, float radius) {
    return 1.0 - smoothstep(radius - 0.012, radius + 0.012, r);
  }

  void main() {
    vec2 frag = gl_FragCoord.xy;
    vec2 uv = frag / uResolution;
    vec2 p = (frag - uCenter) / uUnit;
    float r = length(p);
    float angle = atan(p.y, p.x);

    vec3 color = mix(uSkyLow, uSkyMid, smoothstep(0.0, 0.5, uv.y));
    color = mix(color, uSkyTop, smoothstep(0.4, 1.0, uv.y));

    // Error turns the sky red
    color = mix(color, color * vec3(1.0, 0.32, 0.42) + vec3(0.1, 0.0, 0.02), uGloom * 0.6);

    // Rotating burst wedges
    float wedge = smoothstep(-0.04, 0.04, sin(angle * 14.0 + uTime * 0.07));
    float reach = smoothstep(2.4, 3.4, r) * (1.0 - smoothstep(5.0, 9.5, r));
    color += vec3(0.5, 0.75, 1.0) * wedge * reach * (0.06 + 0.08 * uBurst);

    // Flat mood sun with a saturated ring and pale centre
    color += vec3(0.05) * disc(r, 3.35);
    color += (vec3(0.06) + uMood * 0.06) * disc(r, 2.9);
    color = mix(color, mix(uMood, vec3(1.0), 0.08), disc(r, 2.45) * 0.95);
    color = mix(color, mix(uMood, vec3(1.0), 0.74), disc(r, 2.14));

    // Scanning rings
    float rings = smoothstep(0.07, 0.0, abs(fract(r * 0.55 - uTime * 1.5) - 0.5)) * smoothstep(2.3, 2.6, r) * (1.0 - smoothstep(4.0, 7.5, r));
    color += mix(uMood, vec3(1.0), 0.3) * rings * uScan * 0.4;

    // Success shockwave
    float wave = smoothstep(0.5, 0.0, abs(r - 2.4 - uBurst * 7.0)) * (1.0 - uBurst) * step(0.001, uBurst);
    color += mix(uMood, vec3(1.0), 0.5) * wave * 0.8;

    // Error hazard stripes
    float stripes = step(0.5, fract((frag.x + frag.y) / (uResolution.y / 16.0) - uTime * 0.6));
    float rim = smoothstep(3.2, 6.5, r);
    color = mix(color, uMood * 0.75, stripes * rim * uAlarm * 0.45);

    // Halftone dots near the bottom
    vec2 grid = mat2(0.7071, -0.7071, 0.7071, 0.7071) * frag / (uResolution.y / 72.0);
    float dotSize = smoothstep(0.95, 0.1, uv.y) * smoothstep(2.6, 5.0, r) * 0.44;
    float dots = 1.0 - smoothstep(dotSize - 0.04, dotSize + 0.04, length(fract(grid) - 0.5));
    color = mix(color, color * 0.78 + uSkyTop * 0.1, dots);

    // Night while asleep, dim moon and stars
    vec3 night = color * vec3(0.13, 0.16, 0.36) + vec3(0.012, 0.016, 0.05);
    float cell = uResolution.y / 20.0;
    vec2 tile = floor(frag / cell);
    float seed = fract(sin(dot(tile, vec2(127.1, 311.7))) * 43758.5453);
    vec2 offset = fract(frag / cell) - 0.5 - (vec2(fract(seed * 13.3), fract(seed * 7.7)) - 0.5) * 0.7;
    float star = step(0.8, seed) * smoothstep(0.075, 0.02, length(offset)) * (0.55 + 0.45 * sin(uTime * 1.7 + seed * 40.0));
    night += vec3(0.8, 0.86, 1.0) * star * smoothstep(3.3, 3.8, r) * smoothstep(0.1, 0.5, uv.y);
    color = mix(night, color, uPower);

    // Stay under the bloom threshold
    gl_FragColor = vec4(min(color, vec3(0.92)), 1.0);
  }
`


/** Full screen sky, the sun follows Rotom in the mood colour */
export function Backdrop({ emotion, power }: { emotion: RotomEmotion; power: RotomPower }) {
  const material = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uResolution: { value: new Vector2(1, 1) },
      uCenter: { value: new Vector2(0, 0) },
      uUnit: { value: 100 },
      uTime: { value: 0 },
      uSkyTop: { value: new Color('#0b1f9c') },
      uSkyMid: { value: new Color('#1657e6') },
      uSkyLow: { value: new Color('#2bb1ff') },
      uMood: { value: new Color(EMOTION_COLOR.IDLE) },
      uScan: { value: 0 },
      uAlarm: { value: 0 },
      uGloom: { value: 0 },
      uBurst: { value: 0 },
      uPower: { value: 0 },
    }),
    [],
  )
  const mood = useMemo(() => new Color(), [])
  const origin = useMemo(() => new Vector3(), [])
  const above = useMemo(() => new Vector3(), [])
  const burst = useRef({ emotion, startedAt: -10 })

  useFrame((state, delta) => {
    const m = material.current
    if (!m) return
    const u = m.uniforms
    const t = state.clock.elapsedTime
    const ease = 1 - Math.exp(-delta * 6)

    const resolution = u.uResolution.value as Vector2
    state.gl.getDrawingBufferSize(resolution)
    // Rotom screen position and pixels per unit
    origin.set(0, 0, 0).project(state.camera)
    above.copy(state.camera.up).project(state.camera)
    ;(u.uCenter.value as Vector2).set((origin.x * 0.5 + 0.5) * resolution.x, (origin.y * 0.5 + 0.5) * resolution.y)
    u.uUnit.value = Math.max(1, Math.hypot((above.x - origin.x) * 0.5 * resolution.x, (above.y - origin.y) * 0.5 * resolution.y))

    u.uTime.value = t
    // Day rises fast on wake, night falls slowly
    const powerTarget = power === 'awake' ? 1 : power === 'waking' ? 0.45 : 0
    u.uPower.value += (powerTarget - u.uPower.value) * (1 - Math.exp(-delta * (power === 'asleep' ? 2 : 4)))
    ;(u.uMood.value as Color).lerp(mood.set(EMOTION_COLOR[emotion]), ease)
    u.uScan.value += ((emotion === 'SCANNING' ? 1 : 0) - u.uScan.value) * ease
    u.uGloom.value += ((emotion === 'ERROR' ? 1 : 0) - u.uGloom.value) * ease
    // Alarm blinks
    const alarmTarget = emotion === 'ERROR' ? 0.55 + 0.45 * Math.sign(Math.sin(t * 9)) : 0
    u.uAlarm.value += (alarmTarget - u.uAlarm.value) * Math.min(1, delta * 18)

    // Shockwave once per success
    if (burst.current.emotion !== emotion) burst.current = { emotion, startedAt: emotion === 'SUCCESS' ? t : -10 }
    const progress = (t - burst.current.startedAt) / 0.9
    u.uBurst.value = progress >= 0 && progress < 1 ? progress : 0
  })

  return (
    <ScreenQuad renderOrder={-1000} frustumCulled={false}>
      <shaderMaterial ref={material} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} depthTest={false} depthWrite={false} />
    </ScreenQuad>
  )
}
