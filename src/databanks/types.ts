// The shape every databank speaks. A databank is one section of the Rotom Dex
// (Pokémon, Berries, Moves...). To add a new one, write a module that exports a
// `Databank` and register it in registry.ts; the HUD, search, Prev/Next, random
// scan and Rotom's speech all work from these few fields.
import type { LucideIcon } from 'lucide-react'
import type { DatabankIcon } from './icons'
import type { TypeName } from '../lib/types'

export type SectionId = 'pokemon' | 'berries' | 'treats' | 'items' | 'balls' | 'moves' | 'abilities' | 'types' | 'regions' | 'natures'

/** A pointer to another entry, so details can link across databanks. */
export interface EntryLink {
  section: SectionId
  key: string
}

/** One row of a databank's list of everything it holds. */
export interface IndexItem {
  /** PokeAPI slug: what gets looked up. */
  key: string
  label: string
  number?: number
  image?: string
  /** Small secondary text: a category, a generation. */
  hint?: string
  type?: TypeName
}

export interface EntryTag {
  label: string
  /** Paints the tag in that element type's colour. */
  type?: TypeName
  link?: EntryLink
}

export interface EntryMeter {
  label: string
  value: number
  max: number
  /** Shown instead of the number, e.g. "—" for a move with no power. */
  display?: string
}

export interface EntryMeters {
  title: string
  /** How to colour the bars: by base-stat tiers, or one flat colour. */
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
  /** "chips" for short links, "badges" for gym badges with an emblem, "types" for type tags. */
  layout: 'chips' | 'badges' | 'types'
  /** Every chip in the group. */
  chips: EntryChip[]
  /** How many are shown to begin with; the rest wait behind "and N more". Omit to show them all. */
  first?: number
  /** Shown when there are no chips. */
  empty?: string
}

/** Everything the details panel and Rotom's voice need to present one entry. */
export interface DexEntry {
  section: SectionId
  key: string
  number: number | null
  name: string
  /** One line under the name: a genus, a category. */
  subtitle?: string
  image: { src: string; kind: 'artwork' | 'sprite' } | null
  tags: EntryTag[]
  /** The entry's description. The text box carries it, so the panel does not repeat it unless `showSummary` is set. */
  summary: string
  /** A second paragraph the panel always shows, e.g. the exact battle effect. */
  detail?: string
  meters: EntryMeters | null
  facts: EntryFact[]
  groups: EntryGroup[]
  /**
   * The entry as the text box gives it, after Rotom's recorded opener ("Pokémon
   * data analyzed! Here's what I found-roto!"): the name, what it is, its
   * description. It is shown, not spoken.
   */
  speech: string
  /** The same picture in its shiny colours (Pokémon only, and only where one exists). */
  shinyImage?: string | null
  /** Pokémon only. */
  speciesNumber?: number
  evolutionChainUrl?: string | null
  cry?: string | null
}

export interface Databank {
  id: SectionId
  /** Plural name for menus: "Berries". */
  label: string
  /** Singular noun for sentences: "Berry". */
  singular: string
  /** One line for the launcher. */
  blurb: string
  /**
   * Official artwork shown as the databank's menu icon: one picture, or a
   * small group of them.
   */
  art: string[]
  /** A drawing that stands in when that artwork cannot be fetched. */
  icon: DatabankIcon
  /** The tile's colour in the launcher. */
  hue: string
  placeholder: string
  /** Where the data comes from, shown in the panel footer. */
  source: string
  loadIndex: (signal?: AbortSignal) => Promise<IndexItem[]>
  loadEntry: (key: string, signal?: AbortSignal) => Promise<DexEntry>
}

/** A databank that has a place in the menu but no data behind it yet. */
export interface PlannedDatabank {
  id: string
  label: string
  blurb: string
  icon: LucideIcon
}
