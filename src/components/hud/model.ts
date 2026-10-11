import type { DexEntry, EntryLink, IndexItem, SectionId } from '../../databanks/types'
import type { SearchHit } from '../../hooks/useDatabank'
import type { RotomVoice } from '../../hooks/useRotomVoice'
import type { RotomEmotion } from '../../lib/emotion'
import type { RotomPower } from '../../lib/expression'
import type { Shot } from '../../lib/framing'
import type { RotomApiError } from '../../lib/pokeapi'

/**
 * What Rotom's screen is showing: its own face, the menu of databanks, the
 * list of one databank, search results from all of them, or a single entry.
 */
export type ScreenView = 'face' | 'menu' | 'list' | 'search' | 'entry'

/** Everything the interface shows. App owns it; the HUD and Rotom's screen only render it. */
export interface HudState {
  emotion: RotomEmotion
  /** Asleep (as on every fresh visit), starting up, or awake. */
  power: RotomPower
  /** Which body Rotom is in: the 3D Rotom Dex, or the phone-shaped one that fills a phone's display. */
  form: 'dex' | 'phone'
  /** False on a phone, where only the phone form fits. */
  canSwitchForm: boolean
  view: ScreenView
  shot: Shot
  /** The open databank, or null before one has been chosen. */
  section: SectionId | null
  /** The databank searches go to: the open one, or Pokémon otherwise. */
  activeSection: SectionId
  /** Text in the search field. */
  input: string
  /** What was asked for in the lookup now running, shown or failed. */
  asked: string
  entry: DexEntry | undefined
  error: RotomApiError | null
  /** Close matches for a failed search. */
  suggestions: IndexItem[]
  index: {
    items: IndexItem[] | undefined
    loading: boolean
    failed: boolean
    retry: () => void
  }
  /** What the typed text matches across every databank. */
  search: { hits: SearchHit[]; more: number; loading: boolean }
  /** Rotom's current line. */
  line: string
  voice: RotomVoice
}

/** Everything the interface can ask for. */
export interface HudActions {
  setInput: (value: string) => void
  /** Look up whatever is in the search field. */
  submit: () => void
  prev: () => void
  next: () => void
  random: () => void
  /** Scan one specific entry, possibly in another databank. */
  open: (link: EntryLink) => void
  openSection: (section: SectionId) => void
  /** Show the menu of databanks on Rotom's screen. */
  openMenu: () => void
  /** Step back one level: entry -> list -> menu -> Rotom's face. */
  back: () => void
  /** Say the current report again. */
  replay: () => void
  /** Switch between seeing all of Rotom and reading its screen up close. */
  toggleShot: () => void
  /** Switch Rotom on. */
  wake: () => void
  /** Put Rotom back to sleep. */
  sleep: () => void
  /** Rotom was tapped: asleep it wakes, awake it reacts. */
  poke: () => void
  /** Swap between the Rotom Dex and the Rotom Phone form. */
  switchForm: () => void
}
