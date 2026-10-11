import { AdditiveBlending, BackSide, Color, DataTexture, NearestFilter, RedFormat, ShaderMaterial, Vector2 } from 'three'

/**
 * Three hard light bands instead of a smooth falloff. MeshToonMaterial looks
 * up `dot(normal, light)` remapped to 0..1 in this strip, so the texels are:
 * facing away, grazing away, grazing toward, facing the light.
 */
export const toonGradient = (() => {
  const texture = new DataTexture(new Uint8Array([0, 0, 150, 255]), 4, 1, RedFormat)
  texture.minFilter = NearestFilter
  texture.magFilter = NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
})()

const resolution = new Vector2(1, 1)

// Both effects below are inverted hulls: the model's back faces pushed outward
// along the normal in clip space, so the line keeps a constant pixel width
// however far away Rotom floats or however hard it shakes.
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

/** The ink line round every part, as in the anime's linework. */
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

/**
 * The glow of the Rotom inside: a second, wider hull of pure light just
 * outside the ink line. Its colour and strength are set every frame by the
 * emotion engine; values above 1 are picked up by the bloom pass.
 */
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

/** Keeps both hulls a steady weight as the canvas resizes. Call once per frame. */
export function setOutlineResolution(width: number, height: number) {
  resolution.set(width, height)
  const ink = Math.min(5, Math.max(2, Math.min(width, height) * 0.0036))
  inkOutline.uniforms.thickness.value = ink
  plasmaAura.uniforms.thickness.value = ink * 3.2
}
