import { TYPE_COLORS, type TypeName } from '../../lib/types'

// Eight cut-gem silhouettes, one per badge in a set, so a badge case reads as
// eight different badges and not eight copies. Drawn on a 40x40 grid.
const SHAPES = [
  'M20 3 L35 12 V28 L20 37 L5 28 V12 Z', // hexagon
  'M20 2 L37 20 L20 38 L3 20 Z', // diamond
  'M5 6 H35 V22 C35 30 28 35 20 38 C12 35 5 30 5 22 Z', // shield
  'M20 3 L25 14 L37 15 L28 24 L31 36 L20 30 L9 36 L12 24 L3 15 L15 14 Z', // star
  'M20 3 C30 14 34 20 34 26 A14 14 0 0 1 6 26 C6 20 10 14 20 3 Z', // drop
  'M12 4 H28 L37 13 V27 L28 36 H12 L3 27 V13 Z', // octagon
  'M20 3 A17 17 0 1 1 19.99 3 Z', // disc
  'M4 20 C4 9 13 4 20 4 C27 4 36 9 36 20 C36 31 27 36 20 36 C17 30 12 28 4 20 Z', // leaf
]

interface BadgeEmblemProps {
  type: TypeName
  /** Position in the set; picks the silhouette. */
  index: number
}

/**
 * A stand-in emblem for a gym badge: a cut gem in the gym's type colour.
 * (The real badge artwork is not available from PokeAPI.)
 */
export function BadgeEmblem({ type, index }: BadgeEmblemProps) {
  const shape = SHAPES[index % SHAPES.length]
  return (
    <svg viewBox="0 0 40 40" className="size-10 shrink-0" aria-hidden="true">
      <path d={shape} fill="#060e33" transform="translate(0 2.5)" />
      <path d={shape} fill={TYPE_COLORS[type]} stroke="#060e33" strokeWidth="2.5" strokeLinejoin="round" />
      {/* One facet catching the light. */}
      <path d={shape} fill="#ffffff" opacity="0.38" transform="translate(11 9) scale(0.3)" />
    </svg>
  )
}
