import { fetchRotomPokemon, type RotomPokemon } from '../hooks/useRotomApi'
import { article, exclaim, fetchJson, idFromUrl, listWords, pokemonIllustration, pokemonSprite, titleCase, type PagedList } from '../lib/pokeapi'
import { nameFormFromSlugs, speciesOfForm } from '../lib/forms'
import { isTypeName, pokemonLabel, STAT_LABELS, type TypeName } from '../lib/types'
import { PokemonIcon } from './icons'
import type { Databank, DexEntry } from './types'

/** Stat meter maximum, higher stats are rare */
const STAT_CEILING = 180

/** Ids above this are alternate forms */
const FIRST_FORM_NUMBER = 10000

const RANK_LABEL = { legendary: 'Legendary', mythical: 'Mythical', baby: 'Baby' } as const

/** Text box line with name, type and description */
function speech(pokemon: RotomPokemon): string {
  const types = pokemon.types.map(titleCase)
  return `${pokemon.name}. ${article(types[0])} ${listWords(types)} type Pokémon. ${exclaim(pokemon.description)}`
}

/** Maps the API record to the details panel shape */
export function pokemonToEntry(pokemon: RotomPokemon): DexEntry {
  const types = pokemon.types.filter(isTypeName) as TypeName[]
  const total = pokemon.stats.reduce((sum, stat) => sum + stat.value, 0)

  return {
    section: 'pokemon',
    key: pokemon.slug,
    number: pokemon.id,
    name: pokemon.name,
    subtitle: [pokemon.genus, pokemon.rank !== 'standard' ? RANK_LABEL[pokemon.rank] : null].filter(Boolean).join(' · '),
    image: { src: pokemon.artwork, kind: 'artwork' },
    shinyImage: pokemon.shinyArtwork,
    speciesNumber: pokemon.speciesId,
    tags: [...types.map((type) => ({ label: titleCase(type), type, link: { section: 'types' as const, key: type } })), ...(pokemon.formKind ? [{ label: pokemon.formKind }] : [])],
    summary: pokemon.description,
    meters: {
      title: 'Base stats',
      scale: 'stat',
      items: pokemon.stats.map((stat) => ({ label: STAT_LABELS[stat.name] ?? titleCase(stat.name), value: stat.value, max: STAT_CEILING })),
      total: { label: 'Total', value: total },
    },
    facts: [
      { label: 'Height', value: `${pokemon.height.toFixed(1)} m` },
      { label: 'Weight', value: `${pokemon.weight.toFixed(1)} kg` },
      { label: 'Habitat', value: pokemon.habitat ?? 'Unknown' },
      { label: 'Catch rate', value: `${pokemon.captureRate} / 255` },
      { label: 'Egg groups', value: pokemon.eggGroups.join(', ') || 'None' },
      { label: 'First seen', value: pokemon.generation },
    ],
    groups: [
      // Other forms like Mega, Gigantamax and regional
      ...(pokemon.forms.length > 1
        ? [
            {
              title: 'Forms',
              layout: 'chips' as const,
              chips: pokemon.forms
                .filter((form) => form.slug !== pokemon.slug)
                .map((form) => ({ label: form.name, image: pokemonSprite(form.id), link: { section: 'pokemon' as const, key: form.slug } })),
            },
          ]
        : []),
      {
        title: 'Abilities',
        layout: 'chips',
        chips: pokemon.abilities.map((ability) => ({ label: ability.name, note: ability.hidden ? 'Hidden' : undefined, link: { section: 'abilities', key: ability.slug } })),
      },
      {
        title: 'Learns by level',
        layout: 'chips',
        chips: pokemon.levelUpMoves.map((move) => ({ label: move.name, note: move.level <= 1 ? 'Start' : `Lv ${move.level}`, link: { section: 'moves', key: move.slug } })),
        first: 14,
        empty: 'No level-up moves on record.',
      },
    ],
    speech: speech(pokemon),
    evolutionChainUrl: pokemon.evolutionChainUrl,
    cry: pokemon.cry,
  }
}

export const pokemonDatabank: Databank = {
  id: 'pokemon',
  label: 'Pokémon',
  singular: 'Pokémon',
  blurb: 'Every species and form, with stats, entry and family',
  art: [pokemonIllustration(25)],
  icon: PokemonIcon,
  hue: '#ff5a4d',
  placeholder: 'Pikachu or 25',
  source: 'PokéAPI',
  // Species in Pokédex order, then alternate forms from 10001
  loadIndex: async (signal) => {
    const [speciesList, pokemonList] = await Promise.all([fetchJson<PagedList>('pokemon-species?limit=3000', signal), fetchJson<PagedList>('pokemon?limit=3000', signal)])
    const species = speciesList.results.map((entry) => {
      const number = idFromUrl(entry.url)
      return { key: entry.name, label: pokemonLabel(entry.name), number, image: pokemonSprite(number) }
    })
    const speciesSlugs = new Set(speciesList.results.map((entry) => entry.name))
    const forms = pokemonList.results
      .map((entry) => ({ slug: entry.name, number: idFromUrl(entry.url) }))
      .filter((entry) => entry.number > FIRST_FORM_NUMBER)
      .sort((a, b) => a.number - b.number)
      .map((entry) => {
        const owner = speciesOfForm(entry.slug, speciesSlugs)
        const form = owner ? nameFormFromSlugs(entry.slug, owner) : { name: pokemonLabel(entry.slug), kind: 'Alternate form' }
        return { key: entry.slug, label: form.name, number: entry.number, image: pokemonSprite(entry.number), hint: form.kind ?? undefined }
      })
    return [...species, ...forms]
  },
  loadEntry: async (key, signal) => pokemonToEntry(await fetchRotomPokemon(key, signal)),
}
