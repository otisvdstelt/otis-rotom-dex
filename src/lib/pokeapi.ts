// Thin, typed access to PokeAPI plus the text clean-up every databank needs.

export const API = 'https://pokeapi.co/api/v2'
const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites'

/** Why a lookup failed, so Rotom can say something useful about it. */
export type RotomApiErrorKind = 'not-found' | 'network'

export class RotomApiError extends Error {
  readonly kind: RotomApiErrorKind

  constructor(kind: RotomApiErrorKind, message: string) {
    super(message)
    this.name = 'RotomApiError'
    this.kind = kind
  }
}

/** GETs JSON from PokeAPI (a path like "pokemon/25" or a full resource URL). */
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

// ------------------------------------------------------------ shared API shapes

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

// ------------------------------------------------------------ text

/** PokeAPI text carries form feeds, hard line breaks and soft hyphens from the cartridges. */
export const cleanText = (value: string): string =>
  value
    .replace(/­\s*/g, '')
    .replace(/[\n\f\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/POKéMON/g, 'Pokémon')
    .trim()

/** "special-attack" -> "Special Attack" */
export const titleCase = (value: string): string =>
  value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')

/** What a user types -> the slug PokeAPI uses: "Mr. Mime" -> "mr-mime", "#025" -> "25". */
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

/** The English entry from a localized list, preferring the most recent one. */
export function english<T extends Localized>(entries: T[] | undefined): T | undefined {
  return entries?.findLast((entry) => entry.language.name === 'en')
}

/** Trailing numeric id of a resource URL. */
export const idFromUrl = (url: string): number => Number(url.replace(/\/$/, '').split('/').pop())

/** "generation-iv" -> "Generation IV" */
export const generationLabel = (name: string | undefined): string => {
  if (!name) return 'Unknown'
  const numeral = name.split('-').pop() ?? ''
  return `Generation ${numeral.toUpperCase()}`
}

/** "a" or "an", by sound, for the word that follows. */
export const article = (word: string): string => (/^[aeiou]/i.test(word) ? 'An' : 'A')

/** ["a","b","c"] -> "a, b and c" */
export function listWords(words: string[]): string {
  if (words.length <= 1) return words.join('')
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
}

/** Ends a sentence with exactly one "!", whatever punctuation it came with. */
export const exclaim = (sentence: string): string => `${sentence.replace(/[.!?\s]+$/, '')}!`

// ------------------------------------------------------------ images (all served by PokeAPI's sprite repository)

export const pokemonSprite = (id: number): string => `${SPRITES}/pokemon/${id}.png`
export const pokemonArtwork = (id: number): string => `${SPRITES}/pokemon/other/official-artwork/${id}.png`
export const itemSprite = (slug: string): string => `${SPRITES}/items/${slug}.png`
/** The games' illustrated artwork of an item (from Pokémon Dream World; it covers items up to the fifth generation). */
export const itemArtwork = (slug: string): string => `${SPRITES}/items/dream-world/${slug}.png`
/** A Pokémon's Dream World illustration (first five generations). */
export const pokemonIllustration = (id: number): string => `${SPRITES}/pokemon/other/dream-world/${id}.svg`
/** Gym badge artwork, numbered in the order the games award them (1 = Boulder Badge). */
export const badgeSprite = (number: number): string => `${SPRITES}/badges/${number}.png`
/** The games' own type label. The Sun and Moon drawings are only 48 pixels wide, so the sharper Scarlet and Violet set is used. */
export const typeIcon = (typeId: number): string => `${SPRITES}/types/generation-ix/scarlet-violet/${typeId}.png`
