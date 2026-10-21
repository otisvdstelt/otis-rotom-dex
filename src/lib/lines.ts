// Fixed Rotom lines and their voice clips. Lines without a clip only show in the text box.
// Recordings go in public voice, see the README there
import type { SectionId } from '../databanks/types'

const clip = (file: string): string => `${import.meta.env.BASE_URL}voice/${file}`

/** Clip by exact line text */
const RECORDED = new Map<string, string>()
const recorded = (text: string, file: string): string => {
  RECORDED.set(text, clip(file))
  return text
}

/** Said after startup */
export const GREETING = recorded('BZZZT! Rotom Dex, at your service! Tell me a Pokémon’s name or number and I’ll look it up. Or open my menu for berries, snacks, moves, badges and more-roto!', 'greeting/greeting.mp3')

/** Said when poked */
export const QUIPS = [
  recorded('Bzzt! That tickles-roto!', 'poked/tickles.mp3'),
  recorded('Hey, careful with the screen-roto!', 'poked/careful.mp3'),
  recorded('Zzzt! Fully charged and ready, roto!', 'poked/charged.mp3'),
  recorded('Did you know-roto? Open my menu and I can look up berries, moves and gym badges too!', 'poked/menu.mp3'),
  recorded('Bzz-bzzt! Press the dice key and I’ll pick something to scan for you!', 'poked/dice.mp3'),
  recorded('I’m a Rotom living in a Pokédex. Best job in Alola, roto!', 'poked/job.mp3'),
  recorded('Poke me all you like. I’d rather be scanning-roto!', 'poked/scanning.mp3'),
]

interface Kind {
  /** Mid sentence form */
  word: string
  /** Name said when it opens */
  databank: string
  /** Clip file name */
  file: string
}

/** Databank names and clip files */
const KIND: Record<SectionId, Kind> = {
  pokemon: { word: 'Pokémon', databank: 'Pokémon', file: 'pokemon' },
  berries: { word: 'Berry', databank: 'Berries', file: 'berry' },
  treats: { word: 'snack', databank: 'Snacks', file: 'snack' },
  items: { word: 'item', databank: 'Items', file: 'item' },
  balls: { word: 'Poké Ball', databank: 'Poké Balls', file: 'ball' },
  moves: { word: 'move', databank: 'Moves', file: 'move' },
  abilities: { word: 'Ability', databank: 'Abilities', file: 'ability' },
  types: { word: 'type', databank: 'Types', file: 'type' },
  regions: { word: 'region', databank: 'Regions', file: 'region' },
  natures: { word: 'nature', databank: 'Natures', file: 'nature' },
}

const capitalised = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1)
const perSection = (line: (kind: Kind) => string): Record<SectionId, string> =>
  Object.fromEntries(Object.entries(KIND).map(([section, kind]) => [section, line(kind)])) as Record<SectionId, string>

const OPENERS = perSection((kind) => recorded(`BZZZT! ${capitalised(kind.word)} data analyzed! Here’s what I found-roto!`, `found/${kind.file}.mp3`))
const NOT_FOUND = perSection((kind) => recorded(`BZZT?! I can’t find that ${kind.word} in my records! Check the spelling and try again.`, `errors/${kind.file}.mp3`))
// Entry counts stay out of the lines since recordings cannot change
const LISTS = perSection((kind) => recorded(`${kind.databank} databank, open-roto! Pick one on my screen, or type a name or number.`, `lists/${kind.file}.mp3`))

/** Said when the menu opens */
export const MENU_LINE = recorded('Which databank do you want-roto? Tap one on my screen!', 'lists/menu.mp3')
const NO_LINK = recorded('BZZT?! My data link fizzled out! Check your connection and scan again.', 'errors/link.mp3')

/** Scan report opener, the entry follows in the text box */
export const scanOpener = (section: SectionId): string => OPENERS[section]

/** Said when a databank list opens */
export const listLine = (section: SectionId): string => LISTS[section]

/** Lookup failed lines, not found or offline */
export const errorLine = (section: SectionId, problem: 'not-found' | 'network'): string => (problem === 'network' ? NO_LINK : NOT_FOUND[section])

/** Clip for a line if one exists */
export const voiceClip = (text: string): string | undefined => RECORDED.get(text)
