// Moves, abilities and types
import { article, cleanText, english, exclaim, fetchJson, generationLabel, idFromUrl, itemArtwork, listWords, pokemonSprite, titleCase, type Localized, type NamedResource, type PagedList } from '../lib/pokeapi'
import { isTypeName, pokemonLabel, TYPE_NAMES, type TypeName } from '../lib/types'
import { AbilityIcon, MoveIcon, TypeIcon } from './icons'
import type { Databank, DexEntry, EntryChip, EntryGroup } from './types'

const NATIONAL_DEX_SIZE = 1025

/** Chips for Pokémon resources, skipping alternate forms above id 10000 */
function pokemonChips(resources: NamedResource[], first: number): { chips: EntryChip[]; first: number } {
  const species = resources.filter((pokemon) => idFromUrl(pokemon.url) <= NATIONAL_DEX_SIZE)
  return {
    chips: species.map((pokemon) => ({
      label: pokemonLabel(pokemon.name),
      image: pokemonSprite(idFromUrl(pokemon.url)),
      link: { section: 'pokemon', key: pokemon.name },
    })),
    first,
  }
}

// Moves

interface ApiMove {
  id: number
  name: string
  accuracy: number | null
  power: number | null
  pp: number | null
  priority: number
  effect_chance: number | null
  damage_class: NamedResource | null
  type: NamedResource
  target: NamedResource
  generation: NamedResource
  names: (Localized & { name: string })[]
  effect_entries: (Localized & { effect: string; short_effect: string })[]
  flavor_text_entries: (Localized & { flavor_text: string })[]
  learned_by_pokemon: NamedResource[]
}

function moveToEntry(move: ApiMove): DexEntry {
  const name = english(move.names)?.name ?? titleCase(move.name)
  const type = move.type.name
  const damageClass = move.damage_class?.name ?? 'status'
  const effect = cleanText((english(move.effect_entries)?.short_effect ?? '').replace(/\$effect_chance/g, String(move.effect_chance ?? '')))
  const flavor = cleanText(english(move.flavor_text_entries)?.flavor_text ?? '')
  const summary = flavor || effect || 'No description has been recorded for this move yet.'
  const learners = pokemonChips(move.learned_by_pokemon, 18)
  const power = move.power ? ` with ${move.power} power` : ''

  return {
    section: 'moves',
    key: move.name,
    number: move.id,
    name,
    subtitle: `${titleCase(damageClass)} move`,
    image: null,
    tags: [...(isTypeName(type) ? [{ label: titleCase(type), type, link: { section: 'types' as const, key: type } }] : []), { label: titleCase(damageClass) }],
    summary,
    detail: effect && effect !== summary ? effect : undefined,
    meters: {
      title: 'Numbers',
      scale: 'flat',
      items: [
        { label: 'Power', value: move.power ?? 0, max: 250, display: move.power ? undefined : '—' },
        { label: 'Accuracy', value: move.accuracy ?? 100, max: 100, display: move.accuracy ? `${move.accuracy}%` : 'Never misses' },
        { label: 'PP', value: move.pp ?? 0, max: 40, display: move.pp ? undefined : '—' },
      ],
    },
    facts: [
      { label: 'Priority', value: move.priority > 0 ? `+${move.priority}` : String(move.priority) },
      { label: 'Target', value: titleCase(move.target.name) },
      { label: 'Introduced', value: generationLabel(move.generation.name) },
    ],
    groups: [{ title: 'Learned by', layout: 'chips', ...learners, empty: 'No Pokémon on record learn this move.' }],
    speech: `${name}. ${article(type)} ${titleCase(type)} type ${damageClass} move${power}. ${exclaim(summary)}`,
  }
}

export const movesDatabank: Databank = {
  id: 'moves',
  label: 'Moves',
  singular: 'move',
  blurb: 'Power, accuracy, effects and who learns them',
  art: [itemArtwork('black-belt')],
  icon: MoveIcon,
  hue: '#3a9bf4',
  placeholder: 'Thunderbolt or 85',
  source: 'PokéAPI',
  loadIndex: async (signal) =>
    (await fetchJson<PagedList>('move?limit=2000', signal)).results.map((move) => ({ key: move.name, label: titleCase(move.name), number: idFromUrl(move.url) })),
  loadEntry: async (key, signal) => moveToEntry(await fetchJson<ApiMove>(`move/${key}`, signal)),
}

// Abilities

interface ApiAbility {
  id: number
  name: string
  generation: NamedResource
  names: (Localized & { name: string })[]
  effect_entries: (Localized & { effect: string; short_effect: string })[]
  flavor_text_entries: (Localized & { flavor_text: string })[]
  pokemon: { is_hidden: boolean; pokemon: NamedResource }[]
}

function abilityToEntry(ability: ApiAbility): DexEntry {
  const name = english(ability.names)?.name ?? titleCase(ability.name)
  const effect = cleanText(english(ability.effect_entries)?.short_effect ?? '')
  const flavor = cleanText(english(ability.flavor_text_entries)?.flavor_text ?? '')
  const summary = effect || flavor || 'No description has been recorded for this Ability yet.'
  const hidden = new Set(ability.pokemon.filter((entry) => entry.is_hidden).map((entry) => entry.pokemon.name))
  const holders = pokemonChips(
    ability.pokemon.map((entry) => entry.pokemon),
    24,
  )

  return {
    section: 'abilities',
    key: ability.name,
    number: ability.id,
    name,
    subtitle: 'Ability',
    image: null,
    tags: [],
    summary,
    detail: flavor && flavor !== summary ? flavor : undefined,
    meters: null,
    facts: [
      { label: 'Introduced', value: generationLabel(ability.generation.name) },
      { label: 'Pokémon with it', value: String(ability.pokemon.filter((entry) => idFromUrl(entry.pokemon.url) <= NATIONAL_DEX_SIZE).length) },
    ],
    groups: [
      {
        title: 'Pokémon with this Ability',
        layout: 'chips',
        chips: holders.chips.map((chip) => ({ ...chip, note: chip.link && hidden.has(chip.link.key) ? 'Hidden' : undefined })),
        first: holders.first,
        empty: 'No Pokémon on record have this Ability.',
      },
    ],
    speech: `${name}. An Ability. ${exclaim(summary)}`,
  }
}

export const abilitiesDatabank: Databank = {
  id: 'abilities',
  label: 'Abilities',
  singular: 'Ability',
  blurb: 'What each Ability does and who has it',
  art: [itemArtwork('life-orb')],
  icon: AbilityIcon,
  hue: '#f2c81e',
  placeholder: 'Levitate or 26',
  source: 'PokéAPI',
  loadIndex: async (signal) =>
    (await fetchJson<PagedList>('ability?limit=1000', signal)).results.map((ability) => ({ key: ability.name, label: titleCase(ability.name), number: idFromUrl(ability.url) })),
  loadEntry: async (key, signal) => abilityToEntry(await fetchJson<ApiAbility>(`ability/${key}`, signal)),
}

// Types

interface ApiType {
  id: number
  name: string
  generation: NamedResource
  damage_relations: Record<'no_damage_to' | 'half_damage_to' | 'double_damage_to' | 'no_damage_from' | 'half_damage_from' | 'double_damage_from', NamedResource[]>
  pokemon: { slot: number; pokemon: NamedResource }[]
  moves: NamedResource[]
}

const typeGroup = (title: string, types: NamedResource[], empty: string): EntryGroup => ({
  title,
  layout: 'types',
  chips: types
    .map((type) => type.name)
    .filter(isTypeName)
    .map((type) => ({ label: titleCase(type), type, link: { section: 'types', key: type } })),
  empty,
})

function typeToEntry(type: ApiType): DexEntry {
  const name = titleCase(type.name)
  const relations = type.damage_relations
  const strong = relations.double_damage_to.map((t) => titleCase(t.name))
  const weak = relations.double_damage_from.map((t) => titleCase(t.name))
  const natives = pokemonChips(
    type.pokemon.filter((entry) => entry.slot === 1).map((entry) => entry.pokemon),
    18,
  )
  const summary =
    `${name}-type moves are ${strong.length ? `super effective against ${listWords(strong)}` : 'super effective against nothing'}. ` +
    `${name}-type Pokémon are ${weak.length ? `weak to ${listWords(weak)}` : 'weak to nothing'}.`

  return {
    section: 'types',
    key: type.name,
    number: null,
    name: `${name} type`,
    subtitle: 'Element type',
    image: null,
    tags: isTypeName(type.name) ? [{ label: name, type: type.name }] : [],
    summary,
    meters: null,
    facts: [
      { label: 'Pokémon', value: String(type.pokemon.filter((entry) => idFromUrl(entry.pokemon.url) <= NATIONAL_DEX_SIZE).length) },
      { label: 'Moves', value: String(type.moves.length) },
      { label: 'Introduced', value: generationLabel(type.generation.name) },
    ],
    groups: [
      typeGroup('Attacking: super effective against', relations.double_damage_to, 'Nothing'),
      typeGroup('Attacking: not very effective against', relations.half_damage_to, 'Nothing'),
      typeGroup('Attacking: no effect on', relations.no_damage_to, 'Nothing'),
      typeGroup('Defending: weak to', relations.double_damage_from, 'Nothing'),
      typeGroup('Defending: resists', relations.half_damage_from, 'Nothing'),
      typeGroup('Defending: immune to', relations.no_damage_from, 'Nothing'),
      { title: `${name}-type Pokémon`, layout: 'chips', ...natives, empty: 'None on record.' },
    ],
    speech: `The ${name} type. ${exclaim(summary)}`,
  }
}

export const typesDatabank: Databank = {
  id: 'types',
  label: 'Types',
  singular: 'type',
  blurb: 'All 18 elements and how they match up',
  art: [itemArtwork('fire-gem'), itemArtwork('water-gem'), itemArtwork('grass-gem')],
  icon: TypeIcon,
  hue: '#3fc79a',
  placeholder: 'Electric',
  source: 'PokéAPI',
  // The eighteen types are fixed, so no request is needed
  loadIndex: async () => TYPE_NAMES.map((type: TypeName) => ({ key: type, label: titleCase(type), type })),
  loadEntry: async (key, signal) => typeToEntry(await fetchJson<ApiType>(`type/${key.replace(/-type$/, '')}`, signal)),
}
