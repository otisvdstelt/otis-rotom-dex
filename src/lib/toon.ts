import { AdditiveBlending, BackSide, Color, DataTexture, NearestFilter, RedFormat, ShaderMaterial, Vector2 } from 'three'

/** Three hard light bands for the toon material */
export const toonGradient = (() => {
  const texture = new DataTexture(new Uint8Array([0, 0, 150, 255]), 4, 1, RedFormat)
  texture.minFilter = NearestFilter
  texture.magFilter = NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
})()

const resolution = new Vector2(1, 1)

// Inverted hulls pushed out in clip space, so lines keep a fixed pixel width
const hullVertexShader = /* glsl */ `
  uniform float thickness;
  uniform vec2 resolution;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    vec2 direction = (projectionMatrix * vec4(normalMatrix * normal, 0.0)).xy;
    float len = length(direction);
    if (len > 1e-6) {
      gl_Position.xy += direction / len * thickness / resolution * gl_Position.w * 2.0;
    }
  }
`

/** Ink outline */
export const inkOutline = new ShaderMaterial({
  name: 'InkOutline',
  side: BackSide,
  uniforms: {
    thickness: { value: 3 },
    resolution: { value: resolution },
    color: { value: new Color('#22090c') },
  },
  vertexShader: hullVertexShader,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    void main() {
      gl_FragColor = vec4(color, 1.0);
    }
  `,
})

/** Outer glow hull, colour set every frame, values above 1 bloom */
export const plasmaAura = new ShaderMaterial({
  name: 'PlasmaAura',
  side: BackSide,
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  uniforms: {
    thickness: { value: 9 },
    resolution: { value: resolution },
    color: { value: new Color('#7fe7ff') },
    strength: { value: 0 },
  },
  vertexShader: hullVertexShader,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform float strength;
    void main() {
      gl_FragColor = vec4(color * strength, 1.0);
    }
  `,
})

/** Keeps hull widths steady on resize, call once per frame */
export function setOutlineResolution(width: number, height: number) {
  resolution.set(width, height)
  const ink = Math.min(5, Math.max(2, Math.min(width, height) * 0.0036))
  inkOutline.uniforms.thickness.value = ink
  plasmaAura.uniforms.thickness.value = ink * 3.2
}
