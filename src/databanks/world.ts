// The wider world: regions (with their gym badges) and natures.
import { badgeSprite, exclaim, fetchJson, generationLabel, itemArtwork, itemSprite, listWords, titleCase, type NamedResource, type PagedList } from '../lib/pokeapi'
import { pokemonLabel, STAT_LABELS } from '../lib/types'
import { REGION_LORE } from './data/regions'
import { NatureIcon, RegionIcon } from './icons'
import type { Databank, DexEntry, EntryGroup } from './types'

// ------------------------------------------------------------ Regions

interface ApiRegion {
  id: number
  name: string
  main_generation: NamedResource | null
  locations: NamedResource[]
  pokedexes: NamedResource[]
  version_groups: NamedResource[]
}

const GAME_NAMES: Record<string, string> = {
  'red-blue': 'Red / Blue',
  yellow: 'Yellow',
  'gold-silver': 'Gold / Silver',
  crystal: 'Crystal',
  'ruby-sapphire': 'Ruby / Sapphire',
  emerald: 'Emerald',
  'firered-leafgreen': 'FireRed / LeafGreen',
  'diamond-pearl': 'Diamond / Pearl',
  platinum: 'Platinum',
  'heartgold-soulsilver': 'HeartGold / SoulSilver',
  'black-white': 'Black / White',
  'black-2-white-2': 'Black 2 / White 2',
  'x-y': 'X / Y',
  'omega-ruby-alpha-sapphire': 'Omega Ruby / Alpha Sapphire',
  'sun-moon': 'Sun / Moon',
  'ultra-sun-ultra-moon': 'Ultra Sun / Ultra Moon',
  'lets-go-pikachu-lets-go-eevee': "Let's Go, Pikachu! / Eevee!",
  'sword-shield': 'Sword / Shield',
  'the-isle-of-armor': 'The Isle of Armor',
  'the-crown-tundra': 'The Crown Tundra',
  'brilliant-diamond-shining-pearl': 'Brilliant Diamond / Shining Pearl',
  'legends-arceus': 'Legends: Arceus',
  'scarlet-violet': 'Scarlet / Violet',
  'the-teal-mask': 'The Teal Mask',
  'the-indigo-disk': 'The Indigo Disk',
  colosseum: 'Colosseum',
  xd: 'XD: Gale of Darkness',
}

// Japanese first-print versions repeat the international ones.
const gameName = (slug: string): string | null => (slug.endsWith('-japan') ? null : (GAME_NAMES[slug] ?? titleCase(slug)))

function regionToEntry(region: ApiRegion): DexEntry {
  const name = titleCase(region.name)
  const lore = REGION_LORE[region.name]
  const games = region.version_groups.map((group) => gameName(group.name)).filter((game): game is string => game !== null)
  const badges = lore?.challenge?.badges ?? []

  const groups: EntryGroup[] = []
  if (lore?.challenge) {
    groups.push({
      title: lore.challenge.title,
      layout: 'badges',
      chips: badges.map((badge) => ({
        label: badge.badge,
        note: `${badge.leader} · ${badge.place}`,
        type: badge.type,
        image: badge.sprite ? badgeSprite(badge.sprite) : undefined,
        link: { section: 'types', key: badge.type },
      })),
    })
  }
  if (lore) {
    groups.push({
      title: 'Partner Pokémon',
      layout: 'chips',
      chips: lore.starters.map((slug) => ({ label: pokemonLabel(slug), link: { section: 'pokemon', key: slug } })),
    })
    if (lore.notable) {
      groups.push({
        title: lore.notable.title,
        layout: 'chips',
        chips: lore.notable.pokemon.map((slug) => ({ label: pokemonLabel(slug), link: { section: 'pokemon', key: slug } })),
      })
    }
  }
  groups.push({
    title: 'Places',
    layout: 'chips',
    chips: region.locations.map((location) => ({ label: titleCase(location.name.replace(new RegExp(`^${region.name}-`), '')) })),
    first: 16,
    empty: 'No locations on record.',
  })

  const summary = lore?.intro ?? `${name} is one of the regions of the Pokémon world.`
  const badgeLine =
    badges.length === 0
      ? ''
      : lore?.challenge?.title === 'Gym badges'
        ? ` Trainers here earn the ${listWords(badges.map((badge) => badge.badge.replace(/ Badge$/, '')))} badges.`
        : ` Trainers here face ${badges.length} grand trials.`

  return {
    section: 'regions',
    key: region.name,
    number: null,
    name,
    subtitle: 'Region',
    image: null,
    tags: region.main_generation ? [{ label: generationLabel(region.main_generation.name) }] : [{ label: 'Side story' }],
    summary,
    meters: null,
    facts: [
      { label: 'Introduced', value: region.main_generation ? generationLabel(region.main_generation.name) : 'Outside the numbered generations' },
      { label: 'Mapped locations', value: String(region.locations.length) },
      { label: 'Pokédexes', value: region.pokedexes.map((dex) => titleCase(dex.name).replace('Letsgo', "Let's Go")).join(', ') || 'None on record' },
      { label: 'Games set here', value: games.join(', ') || 'None on record' },
    ],
    groups,
    speech: `The ${name} region. ${exclaim(summary + badgeLine)}`,
  }
}

export const regionsDatabank: Databank = {
  id: 'regions',
  label: 'Regions & badges',
  singular: 'region',
  blurb: 'Every region, its gyms, badges and partners',
  // The Boulder Badge, the first badge of the first region.
  art: [badgeSprite(1)],
  icon: RegionIcon,
  hue: '#2fb5d6',
  placeholder: 'Kanto or Alola',
  source: 'PokéAPI, with gym leaders from the Rotom Dex’s built-in records',
  loadIndex: async (signal) =>
    (await fetchJson<PagedList>('region?limit=100', signal)).results.map((region) => {
      const badges = REGION_LORE[region.name]?.challenge
      return {
        key: region.name,
        label: titleCase(region.name),
        hint: badges ? `${badges.badges.length} ${badges.title.toLowerCase()}` : 'No gym challenge',
      }
    }),
  loadEntry: async (key, signal) => regionToEntry(await fetchJson<ApiRegion>(`region/${key.replace(/-region$/, '')}`, signal)),
}

// ------------------------------------------------------------ Natures

interface ApiNature {
  id: number
  name: string
  increased_stat: NamedResource | null
  decreased_stat: NamedResource | null
  likes_flavor: NamedResource | null
  hates_flavor: NamedResource | null
}

interface ApiBerryFlavor {
  berries: { potency: number; berry: NamedResource }[]
}

async function natureToEntry(nature: ApiNature, signal?: AbortSignal): Promise<DexEntry> {
  const name = titleCase(nature.name)
  const up = nature.increased_stat ? (STAT_LABELS[nature.increased_stat.name] ?? titleCase(nature.increased_stat.name)) : null
  const down = nature.decreased_stat ? (STAT_LABELS[nature.decreased_stat.name] ?? titleCase(nature.decreased_stat.name)) : null
  const neutral = !up || !down || up === down
  const likes = nature.likes_flavor?.name ?? null
  const hates = nature.hates_flavor?.name ?? null

  // Berries whose strongest flavour is the one this nature loves.
  const groups: EntryGroup[] = []
  if (likes && !neutral) {
    const flavor = await fetchJson<ApiBerryFlavor>(`berry-flavor/${likes}`, signal)
    const favourites = [...flavor.berries].sort((a, b) => b.potency - a.potency).slice(0, 8)
    groups.push({
      title: `Berries it loves (${likes})`,
      layout: 'chips',
      chips: favourites.map(({ berry }) => ({ label: `${titleCase(berry.name)} Berry`, image: itemSprite(`${berry.name}-berry`), link: { section: 'berries', key: berry.name } })),
    })
  }

  // Spoken aloud, so stats are named in full ("Special Attack", not "Sp. Atk").
  const summary = neutral
    ? `A ${name} nature leaves every stat as it is, and such a Pokémon has no favourite flavour.`
    : `A ${name} nature raises ${titleCase(nature.increased_stat!.name)} and lowers ${titleCase(nature.decreased_stat!.name)}. Pokémon with it like ${likes} food and dislike ${hates} food.`

  return {
    section: 'natures',
    key: nature.name,
    number: null,
    name: `${name} nature`,
    subtitle: neutral ? 'Neutral nature' : 'Nature',
    image: null,
    tags: neutral ? [{ label: 'No stat change' }] : [{ label: `+ ${up}` }, { label: `− ${down}` }],
    summary,
    meters: null,
    facts: [
      { label: 'Raises', value: neutral ? 'Nothing' : `${up} (×1.1)` },
      { label: 'Lowers', value: neutral ? 'Nothing' : `${down} (×0.9)` },
      { label: 'Likes', value: neutral || !likes ? 'No preference' : titleCase(likes) },
      { label: 'Dislikes', value: neutral || !hates ? 'No preference' : titleCase(hates) },
    ],
    groups,
    speech: `The ${name} nature. ${exclaim(summary)}`,
  }
}

export const naturesDatabank: Databank = {
  id: 'natures',
  label: 'Natures',
  singular: 'nature',
  blurb: 'The 25 temperaments and the stats they shift',
  // A Mental Herb.
  art: [itemArtwork('mental-herb')],
  icon: NatureIcon,
  hue: '#b06cf0',
  placeholder: 'Adamant',
  source: 'PokéAPI',
  loadIndex: async (signal) =>
    (await fetchJson<PagedList>('nature?limit=100', signal)).results
      .map((nature) => ({ key: nature.name, label: titleCase(nature.name) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  loadEntry: async (key, signal) => natureToEntry(await fetchJson<ApiNature>(`nature/${key.replace(/-nature$/, '')}`, signal), signal),
}
