// Shared databank shape. Export a Databank and register it in registry.ts
import type { LucideIcon } from 'lucide-react'
import type { DatabankIcon } from './icons'
import type { TypeName } from '../lib/types'

export type SectionId = 'pokemon' | 'berries' | 'treats' | 'items' | 'balls' | 'moves' | 'abilities' | 'types' | 'regions' | 'natures'

/** Link to another entry, across databanks */
export interface EntryLink {
  section: SectionId
  key: string
}

/** One row of a databank list */
export interface IndexItem {
  /** PokeAPI slug to look up */
  key: string
  label: string
  number?: number
  image?: string
  /** Small secondary text */
  hint?: string
  type?: TypeName
}

export interface EntryTag {
  label: string
  /** Colours the tag by type */
  type?: TypeName
  link?: EntryLink
}

export interface EntryMeter {
  label: string
  value: number
  max: number
  /** Shown instead of the number */
  display?: string
}

export interface EntryMeters {
  title: string
  /** Bar colouring, stat tiers or flat */
  scale: 'stat' | 'flat'
  items: EntryMeter[]
  total?: { label: string; value: number }
}

export interface EntryFact {
  label: string
  value: string
  link?: EntryLink
}

export interface EntryChip {
  label: string
  note?: string
  image?: string
  type?: TypeName
  link?: EntryLink
}

export interface EntryGroup {
  title: string
  /** Chips, badges or type tags */
  layout: 'chips' | 'badges' | 'types'
  /** All chips in the group */
  chips: EntryChip[]
  /** Chips shown at first, the rest behind and N more */
  first?: number
  /** Shown when empty */
  empty?: string
}

/** Everything needed to present one entry */
export interface DexEntry {
  section: SectionId
  key: string
  number: number | null
  name: string
  /** Line under the name */
  subtitle?: string
  image: { src: string; kind: 'artwork' | 'sprite' } | null
  tags: EntryTag[]
  /** Description, shown in the text box unless showSummary is set */
  summary: string
  /** Extra paragraph always shown */
  detail?: string
  meters: EntryMeters | null
  facts: EntryFact[]
  groups: EntryGroup[]
  /** Text box entry after the spoken opener, shown not spoken */
  speech: string
  /** Shiny artwork, Pokémon only */
  shinyImage?: string | null
  /** Pokémon only */
  speciesNumber?: number
  evolutionChainUrl?: string | null
  cry?: string | null
}

export interface Databank {
  id: SectionId
  /** Plural menu name */
  label: string
  /** Singular noun */
  singular: string
  /** Launcher line */
  blurb: string
  /** Menu icon artwork, one or a few images */
  art: string[]
  /** Fallback drawing */
  icon: DatabankIcon
  /** Launcher tile colour */
  hue: string
  placeholder: string
  /** Data source, shown in the footer */
  source: string
  loadIndex: (signal?: AbortSignal) => Promise<IndexItem[]>
  loadEntry: (key: string, signal?: AbortSignal) => Promise<DexEntry>
}

/** Menu slot with no data yet */
export interface PlannedDatabank {
  id: string
  label: string
  blurb: string
  icon: LucideIcon
}
