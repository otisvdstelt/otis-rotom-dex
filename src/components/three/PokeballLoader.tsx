import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { BackSide, type Group } from 'three'
import { toonGradient } from '../../lib/toon'

/** A spinning, hopping cel-shaded Poké Ball shown while Rotom's model and face load. */
export function PokeballLoader() {
  const ball = useRef<Group>(null)
  useFrame((state, delta) => {
    if (!ball.current) return
    const t = state.clock.elapsedTime
    ball.current.rotation.y += delta * 3.2
    ball.current.rotation.z = Math.sin(t * 3) * 0.22
    ball.current.position.y = Math.abs(Math.sin(t * 3)) * 0.35 - 0.1
  })
  return (
    <group ref={ball} scale={0.8}>
      <mesh>
        <sphereGeometry args={[1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshToonMaterial color="#ee2b33" gradientMap={toonGradient} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshToonMaterial color="#f6f7fb" gradientMap={toonGradient} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[1.015, 1.015, 0.16, 40, 1, true]} />
        <meshBasicMaterial color="#12141a" />
      </mesh>
      <mesh position-z={0.99} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.3, 0.3, 0.12, 28]} />
        <meshBasicMaterial color="#12141a" />
      </mesh>
      <mesh position-z={1.04} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.17, 0.17, 0.1, 28]} />
        <meshToonMaterial color="#f6f7fb" gradientMap={toonGradient} />
      </mesh>
      {/* Ink outline: a slightly larger shell seen from the inside. */}
      <mesh scale={1.06}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial color="#070b24" side={BackSide} />
      </mesh>
    </group>
  )
}
