import { useQuery } from '@tanstack/react-query'
import { cleanText, english, fetchJson, generationLabel, idFromUrl, pokemonArtwork, RotomApiError, slugify, titleCase, type Localized, type NamedResource } from '../lib/pokeapi'
import { nameForm } from '../lib/forms'
import { EGG_GROUP_NAMES, pokemonLabel } from '../lib/types'

// PokeAPI payloads, only fields used here

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

// Hook result

export interface RotomStat {
  /** PokeAPI stat slug */
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

/** One form of a species */
export interface RotomForm {
  /** PokeAPI id, 10001 and up for alternate forms */
  id: number
  slug: string
  name: string
  /** Form kind, null for the ordinary form */
  kind: string | null
}

/** A Pokémon as Rotom reports it */
export interface RotomPokemon {
  /** National Dex number, or the PokeAPI id for alternate forms */
  id: number
  /** Name, or the form name for alternate forms */
  name: string
  /** Types, primary first */
  types: string[]
  stats: RotomStat[]
  /** English Dex entry, cleaned */
  description: string

  /** Slug of the form looked up */
  slug: string
  /** Species Dex number */
  speciesId: number
  /** Form kind, null for the ordinary one */
  formKind: string | null
  /** All forms of the species, ordinary first */
  forms: RotomForm[]
  genus: string
  artwork: string
  /** Shiny artwork if any */
  shinyArtwork: string | null
  cry: string | null
  /** Metres */
  height: number
  /** Kilograms */
  weight: number
  abilities: RotomAbility[]
  eggGroups: string[]
  habitat: string | null
  captureRate: number
  generation: string
  rank: 'standard' | 'legendary' | 'mythical' | 'baby'
  /** Level up moves, earliest first */
  levelUpMoves: RotomMove[]
  evolutionChainUrl: string | null
}

// Fetching

/** Fetches the Pokémon, then its species for the name and Dex entry */
export async function fetchRotomPokemon(idOrName: string | number, signal?: AbortSignal): Promise<RotomPokemon> {
  const key = slugify(String(idOrName)).replace(/^0+(?=\d)/, '')
  if (!key) throw new RotomApiError('not-found', 'Nothing to look up')

  let pokemon: ApiPokemon
  try {
    pokemon = await fetchJson<ApiPokemon>(`pokemon/${key}`, signal)
  } catch (error) {
    // Some species have no plain form, so ask for the default
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

  // Species name and the name of each form
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

/** Pokémon lookup by id or name, null stays idle. No retries so typos fail fast */
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

// Evolution family

interface ApiChainLink {
  species: NamedResource
  evolves_to: ApiChainLink[]
}

export interface EvolutionStage {
  id: number
  slug: string
  name: string
}

/** Species in an evolution family, base first, branches flattened */
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
