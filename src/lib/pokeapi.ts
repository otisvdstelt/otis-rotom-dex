// Typed PokeAPI access and text cleanup

export const API = 'https://pokeapi.co/api/v2'
const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites'

/** Why a lookup failed */
export type RotomApiErrorKind = 'not-found' | 'network'

export class RotomApiError extends Error {
  readonly kind: RotomApiErrorKind

  constructor(kind: RotomApiErrorKind, message: string) {
    super(message)
    this.name = 'RotomApiError'
    this.kind = kind
  }
}

/** Fetches JSON from a PokeAPI path or URL */
export async function fetchJson<T>(pathOrUrl: string, signal?: AbortSignal): Promise<T> {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API}/${pathOrUrl}`
  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (cause) {
    if (signal?.aborted) throw cause
    throw new RotomApiError('network', 'PokeAPI could not be reached')
  }
  if (response.status === 404) throw new RotomApiError('not-found', `No entry at ${url}`)
  if (!response.ok) throw new RotomApiError('network', `PokeAPI answered ${response.status}`)
  return response.json() as Promise<T>
}

// Shared API shapes

export interface NamedResource {
  name: string
  url: string
}

export interface Localized {
  language: NamedResource
}

export interface PagedList {
  count: number
  results: NamedResource[]
}

// Text

/** Strips cartridge line breaks and soft hyphens */
export const cleanText = (value: string): string =>
  value
    .replace(/­\s*/g, '')
    .replace(/[\n\f\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/POKéMON/g, 'Pokémon')
    .trim()

/** Slug to title case */
export const titleCase = (value: string): string =>
  value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')

/** User input to a PokeAPI slug */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/^#/, '')
    .replace(/['’.:!?]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Latest English entry from a localized list */
export function english<T extends Localized>(entries: T[] | undefined): T | undefined {
  return entries?.findLast((entry) => entry.language.name === 'en')
}

/** Trailing id of a resource URL */
export const idFromUrl = (url: string): number => Number(url.replace(/\/$/, '').split('/').pop())

/** Generation slug to display name */
export const generationLabel = (name: string | undefined): string => {
  if (!name) return 'Unknown'
  const numeral = name.split('-').pop() ?? ''
  return `Generation ${numeral.toUpperCase()}`
}

/** a or an for the next word */
export const article = (word: string): string => (/^[aeiou]/i.test(word) ? 'An' : 'A')

/** Joins a list with commas and and */
export function listWords(words: string[]): string {
  if (words.length <= 1) return words.join('')
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
}

/** Ends a sentence with one exclamation mark */
export const exclaim = (sentence: string): string => `${sentence.replace(/[.!?\s]+$/, '')}!`

// Images from the PokeAPI sprite repo

export const pokemonSprite = (id: number): string => `${SPRITES}/pokemon/${id}.png`
export const pokemonArtwork = (id: number): string => `${SPRITES}/pokemon/other/official-artwork/${id}.png`
export const itemSprite = (slug: string): string => `${SPRITES}/items/${slug}.png`
/** Item Dream World artwork, up to gen five */
export const itemArtwork = (slug: string): string => `${SPRITES}/items/dream-world/${slug}.png`
/** Pokémon Dream World artwork, first five gens */
export const pokemonIllustration = (id: number): string => `${SPRITES}/pokemon/other/dream-world/${id}.svg`
/** Gym badge artwork in award order */
export const badgeSprite = (number: number): string => `${SPRITES}/badges/${number}.png`
/** Type label art, Scarlet and Violet set for sharpness */
export const typeIcon = (typeId: number): string => `${SPRITES}/types/generation-ix/scarlet-violet/${typeId}.png`
