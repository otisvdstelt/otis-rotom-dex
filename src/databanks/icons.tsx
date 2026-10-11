// The databanks' menu icons: small flat drawings of things from the Pokémon
// world, inked like everything else on Rotom's screen. Each is drawn on a
// 32 x 32 grid.
import type { ReactNode } from 'react'

export type DatabankIcon = (props: { className?: string }) => ReactNode

const INK = '#25305a'
const RED = '#e8332f'

function Drawing({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      {children}
    </svg>
  )
}

/** Pokémon: Pikachu's face. */
export const PokemonIcon: DatabankIcon = ({ className }) => (
  <Drawing className={className}>
    <path d="M9.5 13.5 L5 2.5 L14 9.5 Z" fill="#ffd83d" />
    <path d="M22.5 13.5 L27 2.5 L18 9.5 Z" fill="#ffd83d" />
    <path d="M5 2.5 L7.3 8.2 L9.7 6.2 Z" fill={INK} />
    <path d="M27 2.5 L24.7 8.2 L22.3 6.2 Z" fill={INK} />
    <ellipse cx="16" cy="19" rx="10.5" ry="9.5" fill="#ffd83d" />
    <circle cx="8.6" cy="22" r="2.2" fill={RED} stroke="none" />
    <circle cx="23.4" cy="22" r="2.2" fill={RED} stroke="none" />
    <circle cx="11.8" cy="17.2" r="1.5" fill={INK} stroke="none" />
    <circle cx="20.2" cy="17.2" r="1.5" fill={INK} stroke="none" />
    <path d="M13.6 21.4 Q14.8 22.8 16 21.6 Q17.2 22.8 18.4 21.4" strokeWidth="1.3" />
  </Drawing>
)

/** Berries: an Oran Berry. */
export const BerryIcon: DatabankIcon = ({ className }) => (
  <Drawing className={className}>
    <path d="M16 10 Q15.5 6 18 3.5" />
    <path d="M17 6.5 Q22 3 25.5 6.5 Q21.5 10 17 6.5 Z" fill="#58c13c" />
    <circle cx="16" cy="19" r="9.5" fill="#3f8fe0" />
    <path d="M10.5 16 Q11.5 12.5 15 11.8" stroke="#bfe0ff" strokeWidth="1.8" />
    <circle cx="19.5" cy="21" r="0.9" fill={INK} stroke="none" />
    <circle cx="14" cy="23.5" r="0.9" fill={INK} stroke="none" />
    <circle cx="20.5" cy="16" r="0.9" fill={INK} stroke="none" />
  </Drawing>
)

/** Snacks: a Rare Candy in its wrapper. */
export const SnackIcon: DatabankIcon = ({ className }) => (
  <Drawing className={className}>
    <g transform="rotate(-28 16 16)">
      <path d="M9.5 16 L2.5 10.5 V21.5 Z" fill="#bfe6fb" />
      <path d="M22.5 16 L29.5 10.5 V21.5 Z" fill="#bfe6fb" />
      <circle cx="16" cy="16" r="7.5" fill="#62c0f2" />
      <path d="M12.5 13 Q16 11 19.5 13.5 Q21 16.5 18 18.5 Q15 19.5 14.2 16.8" stroke="#ffffff" strokeWidth="1.6" />
    </g>
  </Drawing>
)

/** Items: a Potion. */
export const ItemIcon: DatabankIcon = ({ className }) => (
  <Drawing className={className}>
    <path d="M13 9 V5.5 H19.5 L24.5 4 V8 L19.5 7.5" fill="#e6e9f5" />
    <rect x="12.5" y="9" width="7" height="4" fill="#e6e9f5" />
    <rect x="8.5" y="13" width="15" height="15.5" rx="3.5" fill="#a67bea" />
    <rect x="8.5" y="17.5" width="15" height="6" fill="#ffffff" />
    <path d="M14 20.5 H18 M16 18.6 V22.4" stroke="#a67bea" strokeWidth="1.5" />
  </Drawing>
)

/** Poké Balls: a Poké Ball. */
export const BallIcon: DatabankIcon = ({ className }) => (
  <Drawing className={className}>
    <circle cx="16" cy="16" r="12.5" fill="#ffffff" />
    <path d="M3.5 16 A12.5 12.5 0 0 1 28.5 16 Z" fill={RED} />
    <path d="M3.5 16 H28.5" strokeWidth="2.4" />
    <circle cx="16" cy="16" r="4" fill="#ffffff" />
    <circle cx="16" cy="16" r="1.5" fill="#ffffff" strokeWidth="1.2" />
  </Drawing>
)

/** Moves: a Technical Machine disc. */
export const MoveIcon: DatabankIcon = ({ className }) => (
  <Drawing className={className}>
    <circle cx="16" cy="16" r="12.5" fill="#ffc83d" />
    <path d="M7.5 11 A10 10 0 0 1 14 6.3" stroke="#fff3c4" strokeWidth="2" />
    <path d="M24.5 21 A10 10 0 0 1 18 25.7" stroke="#e39a12" strokeWidth="2" />
    <circle cx="16" cy="16" r="5" fill="#ffffff" />
    <circle cx="16" cy="16" r="1.7" fill={INK} stroke="none" />
  </Drawing>
)

/** Abilities: an Ability Capsule. */
export const AbilityIcon: DatabankIcon = ({ className }) => (
  <Drawing className={className}>
    <g transform="rotate(-38 15 18)">
      <rect x="3.5" y="12.5" width="23" height="11" rx="5.5" fill="#ffffff" />
      <path d="M15 12.5 H9 A5.5 5.5 0 0 0 9 23.5 H15 Z" fill="#f0609a" />
      <path d="M8.5 15.5 H12" stroke="#ffd0e2" strokeWidth="1.6" />
    </g>
    <path d="M25 2.5 L26.3 6.2 L30 7.5 L26.3 8.8 L25 12.5 L23.7 8.8 L20 7.5 L23.7 6.2 Z" fill="#ffd83d" strokeWidth="1.2" />
  </Drawing>
)

/** Types: fire, water and grass, the first three every trainer learns. */
export const TypeIcon: DatabankIcon = ({ className }) => (
  <Drawing className={className}>
    <path d="M16 16 L16 3.5 A12.5 12.5 0 0 1 26.83 22.25 Z" fill="#f0672f" />
    <path d="M16 16 L26.83 22.25 A12.5 12.5 0 0 1 5.17 22.25 Z" fill="#3f8fe0" />
    <path d="M16 16 L5.17 22.25 A12.5 12.5 0 0 1 16 3.5 Z" fill="#58c13c" />
    <circle cx="16" cy="16" r="3.4" fill="#ffffff" />
  </Drawing>
)

/** Regions and badges: a Town Map with a route marked on it. */
export const RegionIcon: DatabankIcon = ({ className }) => (
  <Drawing className={className}>
    <path d="M3.5 8.5 L11.5 5 L20.5 8.5 L28.5 5 V23.5 L20.5 27 L11.5 23.5 L3.5 27 Z" fill="#f7e9b8" />
    <path d="M11.5 5 V23.5 M20.5 8.5 V27" stroke="#c9b271" strokeWidth="1.3" />
    <path d="M7 20.5 Q10.5 14 15 17 T23 12.5" stroke={RED} strokeWidth="1.7" strokeDasharray="0.2 3.1" />
    <circle cx="24" cy="12" r="2.3" fill={RED} strokeWidth="1.3" />
  </Drawing>
)

/** Natures: a sprig of mint, the herb that changes one. */
export const NatureIcon: DatabankIcon = ({ className }) => (
  <Drawing className={className}>
    <path d="M16 29 V13" />
    <path d="M16 22 Q7 21.5 5 12.5 Q14 12.5 16 22 Z" fill="#58c13c" />
    <path d="M16 19 Q25 18.5 27 9.5 Q18 9.5 16 19 Z" fill="#58c13c" />
    <path d="M16 13 Q11.5 8 16 2.5 Q20.5 8 16 13 Z" fill="#7fdc5e" />
  </Drawing>
)
