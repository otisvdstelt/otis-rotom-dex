// Rotom's fixed lines, and the recorded voice clip for each one. Whatever has
// no clip (the entries themselves, which come from PokéAPI by the thousand)
// is not spoken at all: it appears in the text box only.
//
// To add or replace a recording: put the file in its folder under
// public/voice/ (the README there lists every line and file name). The text
// here is what the text box shows.
import type { SectionId } from '../databanks/types'

const clip = (file: string): string => `${import.meta.env.BASE_URL}voice/${file}`

/** A clip by the exact text of its line. */
const RECORDED = new Map<string, string>()
const recorded = (text: string, file: string): string => {
  RECORDED.set(text, clip(file))
  return text
}

/** Said once Rotom has finished starting up. */
export const GREETING = recorded('BZZZT! Rotom Dex, at your service! Tell me a Pokémon’s name or number and I’ll look it up. Or open my menu for berries, snacks, moves, badges and more-roto!', 'greeting/greeting.mp3')

/** What Rotom says when it is poked. */
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
  /** One of them, as said mid-sentence. */
  word: string
  /** The databank's name, as said when it opens. */
  databank: string
  /** The name its clips are saved under. */
  file: string
}

/** How each databank is named in a line, and the file its clips are saved under. */
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
// (How many entries a databank holds is left out of its line: the number
// changes whenever PokéAPI grows, and a recording cannot. Rotom's screen shows it.)
const LISTS = perSection((kind) => recorded(`${kind.databank} databank, open-roto! Pick one on my screen, or type a name or number.`, `lists/${kind.file}.mp3`))

/** Said when the menu of databanks opens. */
export const MENU_LINE = recorded('Which databank do you want-roto? Tap one on my screen!', 'lists/menu.mp3')
const NO_LINK = recorded('BZZT?! My data link fizzled out! Check your connection and scan again.', 'errors/link.mp3')

/** How Rotom opens a scan report, in its own recorded voice. The entry follows in the text box. */
export const scanOpener = (section: SectionId): string => OPENERS[section]

/** Said when a databank opens on its list. */
export const listLine = (section: SectionId): string => LISTS[section]

/** What Rotom says when a lookup fails: nothing by that name, or no connection. */
export const errorLine = (section: SectionId, problem: 'not-found' | 'network'): string => (problem === 'network' ? NO_LINK : NOT_FOUND[section])

/** The recorded clip for a line, by its exact text, if one exists. */
export const voiceClip = (text: string): string | undefined => RECORDED.get(text)
