import { useQuery } from '@tanstack/react-query'
import { cleanText, english, fetchJson, generationLabel, idFromUrl, pokemonArtwork, RotomApiError, slugify, titleCase, type Localized, type NamedResource } from '../lib/pokeapi'
import { nameForm } from '../lib/forms'
import { EGG_GROUP_NAMES, pokemonLabel } from '../lib/types'

// ------------------------------------------------------------ PokeAPI payloads (only the fields read here)

interface ApiPokemon {
  id: number
  name: string
  is_default: boolean
  height: number
  weight: number
  base_experience: number | null
  species: NamedResource
  types: { slot: number; type: NamedResource }[]
  stats: { base_stat: number; stat: NamedResource }[]
  abilities: { is_hidden: boolean; ability: NamedResource }[]
  cries?: { latest: string | null; legacy: string | null }
  sprites: { front_default: string | null; front_shiny?: string | null; other?: { 'official-artwork'?: { front_default: string | null; front_shiny?: string | null } } }
  moves: { move: NamedResource; version_group_details: { level_learned_at: number; move_learn_method: NamedResource }[] }[]
}

interface ApiSpecies {
  id: number
  name: string
  capture_rate: number
  is_legendary: boolean
  is_mythical: boolean
  is_baby: boolean
  habitat: NamedResource | null
  generation: NamedResource
  egg_groups: NamedResource[]
  names: (Localized & { name: string })[]
  genera: (Localized & { genus: string })[]
  flavor_text_entries: (Localized & { flavor_text: string; version: NamedResource })[]
  evolution_chain: { url: string } | null
  varieties: { is_default: boolean; pokemon: NamedResource }[]
}

// ------------------------------------------------------------ what the hook returns

export interface RotomStat {
  /** PokeAPI stat slug: "hp", "attack", "defense", "special-attack", "special-defense", "speed". */
  name: string
  value: number
}

export interface RotomAbility {
  name: string
  slug: string
  hidden: boolean
}

export interface RotomMove {
  name: string
  slug: string
  level: number
}

/** One of the forms a species comes in. */
export interface RotomForm {
  /** PokeAPI's number for it: the species' own for its ordinary form, 10001 and up for the others. */
  id: number
  slug: string
  name: string
  /** "Mega Evolution", "Gigantamax", "Regional form"…; null for the ordinary form. */
  kind: string | null
}

/** A Pokémon as Rotom reports it. The first five fields are the core record; the rest fill out the profile. */
export interface RotomPokemon {
  /** Its number: the National Pokédex number, or PokeAPI's own (10001 and up) for an alternate form. */
  id: number
  /** "Charizard"; for an alternate form, the form's name: "Mega Charizard X". */
  name: string
  /** Element types, primary first: ["grass", "poison"]. */
  types: string[]
  stats: RotomStat[]
  /** English Pokédex entry with the cartridge line breaks removed. */
  description: string

  /** PokeAPI slug of the exact form that was looked up. */
  slug: string
  /** National Pokédex number of its species, whichever form this is. */
  speciesId: number
  /** What kind of form this is; null for the ordinary one. */
  formKind: string | null
  /** Every form of its species, this one included, ordinary form first. */
  forms: RotomForm[]
  genus: string
  artwork: string
  /** The same artwork in its shiny colours, where there is one. */
  shinyArtwork: string | null
  cry: string | null
  /** Metres. */
  height: number
  /** Kilograms. */
  weight: number
  abilities: RotomAbility[]
  eggGroups: string[]
  habitat: string | null
  captureRate: number
  generation: string
  rank: 'standard' | 'legendary' | 'mythical' | 'baby'
  /** Moves learned by levelling up, earliest first. */
  levelUpMoves: RotomMove[]
  evolutionChainUrl: string | null
}

// ------------------------------------------------------------ fetching

/**
 * Looks a Pokémon up in two steps, as the Pokédex itself is organised:
 *  1. pokemon/{id or name} for the creature: id, types, base stats.
 *  2. its species.url for the species: the English name and Pokédex entry.
 */
export async function fetchRotomPokemon(idOrName: string | number, signal?: AbortSignal): Promise<RotomPokemon> {
  const key = slugify(String(idOrName)).replace(/^0+(?=\d)/, '')
  if (!key) throw new RotomApiError('not-found', 'Nothing to look up')

  let pokemon: ApiPokemon
  try {
    pokemon = await fetchJson<ApiPokemon>(`pokemon/${key}`, signal)
  } catch (error) {
    // Some species have no plain-named form ("deoxys" is really "deoxys-normal",
    // "mimikyu" is "mimikyu-disguised"), so ask the species which form is its default.
    if (!(error instanceof RotomApiError) || error.kind !== 'not-found' || /^\d+$/.test(key)) throw error
    const species = await fetchJson<ApiSpecies>(`pokemon-species/${key}`, signal)
    const variety = species.varieties.find((v) => v.is_default) ?? species.varieties[0]
    if (!variety) throw error
    pokemon = await fetchJson<ApiPokemon>(variety.pokemon.url, signal)
  }

  const species = await fetchJson<ApiSpecies>(pokemon.species.url, signal)

  const levelUp = new Map<string, number>()
  for (const entry of pokemon.moves) {
    const detail = entry.version_group_details.findLast((d) => d.move_learn_method.name === 'level-up')
    if (detail) levelUp.set(entry.move.name, detail.level_learned_at)
  }

  // The species' proper name ("Mr. Mime"), and from it the name of each of its forms ("Galarian Mr. Mime").
  const speciesName = english(species.names)?.name ?? pokemonLabel(species.name)
  const forms: RotomForm[] = species.varieties
    .map((variety) => ({ id: idFromUrl(variety.pokemon.url), slug: variety.pokemon.name, ...(variety.is_default ? { name: speciesName, kind: null } : nameForm(variety.pokemon.name, species.name, speciesName)), ordinary: variety.is_default }))
    .sort((a, b) => Number(b.ordinary) - Number(a.ordinary) || a.id - b.id)
    .map(({ id, slug, name, kind }) => ({ id, slug, name, kind }))
  const form = forms.find((candidate) => candidate.slug === pokemon.name) ?? { id: pokemon.id, slug: pokemon.name, name: speciesName, kind: null }

  return {
    id: pokemon.id,
    name: form.name,
    types: [...pokemon.types].sort((a, b) => a.slot - b.slot).map((entry) => entry.type.name),
    stats: pokemon.stats.map((entry) => ({ name: entry.stat.name, value: entry.base_stat })),
    description: cleanText(english(species.flavor_text_entries)?.flavor_text ?? 'No Pokédex entry has been recorded for this Pokémon yet.'),

    slug: pokemon.name,
    speciesId: species.id,
    formKind: form.kind,
    forms,
    genus: english(species.genera)?.genus ?? 'Pokémon',
    artwork: pokemon.sprites.other?.['official-artwork']?.front_default ?? pokemon.sprites.front_default ?? pokemonArtwork(species.id),
    shinyArtwork: pokemon.sprites.other?.['official-artwork']?.front_shiny ?? pokemon.sprites.front_shiny ?? null,
    cry: pokemon.cries?.latest ?? pokemon.cries?.legacy ?? null,
    height: pokemon.height / 10,
    weight: pokemon.weight / 10,
    abilities: pokemon.abilities.map((entry) => ({ name: titleCase(entry.ability.name), slug: entry.ability.name, hidden: entry.is_hidden })),
    eggGroups: species.egg_groups.map((group) => EGG_GROUP_NAMES[group.name] ?? titleCase(group.name)),
    habitat: species.habitat ? titleCase(species.habitat.name) : null,
    captureRate: species.capture_rate,
    generation: generationLabel(species.generation.name),
    rank: species.is_mythical ? 'mythical' : species.is_legendary ? 'legendary' : species.is_baby ? 'baby' : 'standard',
    levelUpMoves: [...levelUp].map(([slug, level]) => ({ slug, name: titleCase(slug), level })).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)),
    evolutionChainUrl: species.evolution_chain?.url ?? null,
  }
}

/**
 * The Rotom Dex's Pokémon lookup. Pass an id or a name; pass null (or an empty
 * string) for "nothing requested", which leaves the query idle.
 *
 * Retries are off on purpose: a mistyped name should reach the error state at
 * once, not after three slow attempts.
 */
export function useRotomApi(idOrName: string | number | null) {
  const key = idOrName === null ? '' : String(idOrName).trim().toLowerCase()
  return useQuery<RotomPokemon, RotomApiError>({
    queryKey: ['rotom-pokemon', key],
    queryFn: ({ signal }) => fetchRotomPokemon(key, signal),
    enabled: key !== '',
    retry: false,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  })
}

// ------------------------------------------------------------ evolution family

interface ApiChainLink {
  species: NamedResource
  evolves_to: ApiChainLink[]
}

export interface EvolutionStage {
  id: number
  slug: string
  name: string
}

/** Every species in an evolution family, base stage first (branches are flattened in order). */
export function useEvolutionFamily(url: string | null | undefined) {
  return useQuery<EvolutionStage[], RotomApiError>({
    queryKey: ['evolution-chain', url],
    queryFn: async ({ signal }) => {
      const { chain } = await fetchJson<{ chain: ApiChainLink }>(url!, signal)
      const stages: EvolutionStage[] = []
      const walk = (link: ApiChainLink) => {
        stages.push({ id: idFromUrl(link.species.url), slug: link.species.name, name: pokemonLabel(link.species.name) })
        link.evolves_to.forEach(walk)
      }
      walk(chain)
      return stages
    },
    enabled: Boolean(url),
    retry: false,
    staleTime: Infinity,
  })
}
