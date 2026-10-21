import type { DexEntry, EntryLink, IndexItem, SectionId } from '../../databanks/types'
import type { SearchHit } from '../../hooks/useDatabank'
import type { RotomVoice } from '../../hooks/useRotomVoice'
import type { RotomEmotion } from '../../lib/emotion'
import type { RotomPower } from '../../lib/expression'
import type { Shot } from '../../lib/framing'
import type { RotomApiError } from '../../lib/pokeapi'

/** What the screen shows, face, menu, list, search or entry */
export type ScreenView = 'face' | 'menu' | 'list' | 'search' | 'entry'

/** Full UI state, owned by App */
export interface HudState {
  emotion: RotomEmotion
  /** Asleep, starting up or awake */
  power: RotomPower
  /** 3D Dex or phone form */
  form: 'dex' | 'phone'
  /** False on a phone */
  canSwitchForm: boolean
  view: ScreenView
  shot: Shot
  /** Open databank, null before one is chosen */
  section: SectionId | null
  /** Search target, the open databank or Pokémon */
  activeSection: SectionId
  /** Search field text */
  input: string
  /** Current lookup query */
  asked: string
  entry: DexEntry | undefined
  error: RotomApiError | null
  /** Close matches for a failed search */
  suggestions: IndexItem[]
  index: {
    items: IndexItem[] | undefined
    loading: boolean
    failed: boolean
    retry: () => void
  }
  /** Cross databank matches for the typed text */
  search: { hits: SearchHit[]; more: number; loading: boolean }
  /** Current line */
  line: string
  voice: RotomVoice
}

/** Every UI action */
export interface HudActions {
  setInput: (value: string) => void
  /** Look up the search text */
  submit: () => void
  prev: () => void
  next: () => void
  random: () => void
  /** Scan a specific entry */
  open: (link: EntryLink) => void
  openSection: (section: SectionId) => void
  /** Show the databank menu */
  openMenu: () => void
  /** Go back one level */
  back: () => void
  /** Repeat the report */
  replay: () => void
  /** Toggle wide and close view */
  toggleShot: () => void
  /** Wake Rotom */
  wake: () => void
  /** Sleep */
  sleep: () => void
  /** Tap, wakes or reacts */
  poke: () => void
  /** Toggle Dex and phone form */
  switchForm: () => void
}
