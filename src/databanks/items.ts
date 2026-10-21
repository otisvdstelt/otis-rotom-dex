import { article, cleanText, english, exclaim, fetchJson, idFromUrl, itemArtwork, itemSprite, pokemonSprite, titleCase, type Localized, type NamedResource, type PagedList } from '../lib/pokeapi'
import { isTypeName, pokemonLabel } from '../lib/types'
import { BallIcon, BerryIcon, ItemIcon, SnackIcon } from './icons'
import type { Databank, DexEntry, EntryGroup, IndexItem, SectionId } from './types'

// PokeAPI payloads

interface ApiItem {
  id: number
  name: string
  cost: number
  fling_power: number | null
  category: NamedResource
  attributes: NamedResource[]
  names: (Localized & { name: string })[]
  effect_entries: (Localized & { effect: string; short_effect: string })[]
  flavor_text_entries: (Localized & { text: string })[]
  held_by_pokemon: { pokemon: NamedResource }[]
  sprites: { default: string | null }
}

interface ApiCategory {
  items: NamedResource[]
}

interface ApiBerry {
  id: number
  name: string
  growth_time: number
  max_harvest: number
  natural_gift_power: number
  size: number
  smoothness: number
  soil_dryness: number
  firmness: NamedResource
  flavors: { potency: number; flavor: NamedResource }[]
  item: NamedResource
  natural_gift_type: NamedResource
}

// Shared item handling

const itemLabel = (slug: string) => titleCase(slug).replace(/\bTm(\d+)/, 'TM$1').replace(/\bHm(\d+)/, 'HM$1')

function heldByGroup(item: ApiItem): EntryGroup[] {
  if (item.held_by_pokemon.length === 0) return []
  return [
    {
      title: 'Found held by',
      layout: 'chips',
      chips: item.held_by_pokemon.map(({ pokemon }) => ({
        label: pokemonLabel(pokemon.name),
        image: pokemonSprite(idFromUrl(pokemon.url)),
        link: { section: 'pokemon', key: pokemon.name },
      })),
      first: 12,
    },
  ]
}

function itemToEntry(item: ApiItem, section: SectionId): DexEntry {
  const name = english(item.names)?.name ?? itemLabel(item.name)
  const category = titleCase(item.category.name)
  const effect = cleanText(english(item.effect_entries)?.short_effect ?? '')
  const flavor = cleanText(english(item.flavor_text_entries)?.text ?? '')
  const summary = flavor || effect || 'No description has been recorded for this item yet.'

  return {
    section,
    key: item.name,
    number: item.id,
    name,
    subtitle: category,
    image: { src: item.sprites.default ?? itemSprite(item.name), kind: 'sprite' },
    tags: item.attributes.slice(0, 3).map((attribute) => ({ label: titleCase(attribute.name) })),
    summary,
    detail: effect && effect !== summary ? effect : undefined,
    meters: null,
    facts: [
      { label: 'Category', value: category },
      { label: 'Shop price', value: item.cost > 0 ? `₽${item.cost.toLocaleString('en-US')}` : 'Not sold' },
      { label: 'Fling power', value: item.fling_power ? String(item.fling_power) : 'Cannot be flung' },
    ],
    groups: heldByGroup(item),
    speech: `${name}. ${article(category)} ${category.toLowerCase()} item. ${exclaim(summary)}`,
  }
}

const loadItem = (section: SectionId) => async (key: string, signal?: AbortSignal) => itemToEntry(await fetchJson<ApiItem>(`item/${key}`, signal), section)

const toIndexItem = (resource: NamedResource, hint?: string): IndexItem => ({
  key: resource.name,
  label: itemLabel(resource.name),
  number: idFromUrl(resource.url),
  image: itemSprite(resource.name),
  hint,
})

async function categoryIndex(categories: [slug: string, hint: string][], signal?: AbortSignal): Promise<IndexItem[]> {
  const lists = await Promise.all(categories.map(([slug]) => fetchJson<ApiCategory>(`item-category/${slug}`, signal)))
  return lists.flatMap((list, i) => list.items.map((item) => toIndexItem(item, categories[i][1])))
}

// Items

export const itemsDatabank: Databank = {
  id: 'items',
  label: 'Items',
  singular: 'item',
  blurb: 'Medicine, held items, TMs, key items',
  art: [itemArtwork('potion')],
  icon: ItemIcon,
  hue: '#7b6cf6',
  placeholder: 'Potion or 17',
  source: 'PokéAPI',
  loadIndex: async (signal) => (await fetchJson<PagedList>('item?limit=5000', signal)).results.map((item) => toIndexItem(item)),
  loadEntry: loadItem('items'),
}

// Poké Balls

export const ballsDatabank: Databank = {
  id: 'balls',
  label: 'Poké Balls',
  singular: 'Poké Ball',
  blurb: 'Standard, special and Apricorn balls',
  art: [itemArtwork('poke-ball')],
  icon: BallIcon,
  hue: '#e8402a',
  placeholder: 'Ultra Ball',
  source: 'PokéAPI',
  loadIndex: (signal) =>
    categoryIndex(
      [
        ['standard-balls', 'Standard'],
        ['special-balls', 'Special'],
        ['apricorn-balls', 'Apricorn'],
      ],
      signal,
    ),
  loadEntry: loadItem('balls'),
}

// Snacks

// Regional sweets listed by hand, unknown names are skipped
const TREATS = [
  'lava-cookie',
  'old-gateau',
  'casteliacone',
  'lumiose-galette',
  'shalour-sable',
  'big-malasada',
  'rage-candy-bar',
  'pewter-crunchies',
  'sweet-heart',
  'rare-candy',
  'honey',
  'max-honey',
  'moomoo-milk',
  'berry-juice',
  'fresh-water',
  'soda-pop',
  'lemonade',
  'sweet-apple',
  'tart-apple',
  'syrupy-apple',
  'strawberry-sweet',
  'love-sweet',
  'berry-sweet',
  'clover-sweet',
  'flower-sweet',
  'star-sweet',
  'ribbon-sweet',
]

export const treatsDatabank: Databank = {
  id: 'treats',
  label: 'Snacks',
  singular: 'snack',
  blurb: 'Regional sweets, drinks, curry and sandwich fillings',
  art: [itemArtwork('casteliacone')],
  icon: SnackIcon,
  hue: '#f6a13a',
  placeholder: 'Lava Cookie',
  source: 'PokéAPI',
  loadIndex: async (signal) => {
    const [all, cooking] = await Promise.all([
      fetchJson<PagedList>('item?limit=5000', signal),
      categoryIndex(
        [
          ['curry-ingredients', 'Curry ingredient'],
          ['sandwich-ingredients', 'Sandwich filling'],
        ],
        signal,
      ),
    ])
    const known = new Map(all.results.map((item) => [item.name, item]))
    const sweets = TREATS.flatMap((slug) => {
      const item = known.get(slug)
      return item ? [toIndexItem(item, 'Treat')] : []
    })
    return [...sweets, ...cooking]
  },
  loadEntry: loadItem('treats'),
}

// Berries

const FLAVORS = ['spicy', 'dry', 'sweet', 'bitter', 'sour'] as const
/** Strongest flavour any Berry has */
const FLAVOR_CEILING = 40

function berryToEntry(berry: ApiBerry, item: ApiItem): DexEntry {
  const name = english(item.names)?.name ?? `${titleCase(berry.name)} Berry`
  const potency = new Map(berry.flavors.map((entry) => [entry.flavor.name, entry.potency]))
  // One top flavour names the taste, a tie means mixed
  const ranked = [...berry.flavors].sort((a, b) => b.potency - a.potency)
  const taste = !ranked[0] || ranked[0].potency === 0 ? 'mild' : ranked[1] && ranked[1].potency === ranked[0].potency ? 'mixed-flavour' : ranked[0].flavor.name
  const firmness = berry.firmness.name.replace(/-/g, ' ')
  const effect = cleanText(english(item.effect_entries)?.short_effect ?? '')
  const flavor = cleanText(english(item.flavor_text_entries)?.text ?? '')
  const summary = flavor || effect || 'No description has been recorded for this Berry yet.'
  const gift = berry.natural_gift_type.name

  return {
    section: 'berries',
    key: berry.name,
    number: berry.id,
    name,
    subtitle: `${titleCase(firmness)} · ${titleCase(taste)}`,
    image: { src: item.sprites.default ?? itemSprite(item.name), kind: 'sprite' },
    tags: isTypeName(gift) ? [{ label: `Natural Gift: ${titleCase(gift)}`, type: gift, link: { section: 'types', key: gift } }] : [],
    summary,
    detail: effect && effect !== summary ? effect : undefined,
    meters: {
      title: 'Flavour',
      scale: 'flat',
      items: FLAVORS.map((flavorName) => ({ label: titleCase(flavorName), value: potency.get(flavorName) ?? 0, max: FLAVOR_CEILING })),
    },
    facts: [
      { label: 'Firmness', value: titleCase(firmness) },
      { label: 'Size', value: `${(berry.size / 10).toFixed(1)} cm` },
      { label: 'Growth', value: `${berry.growth_time} h per stage` },
      { label: 'Harvest', value: `Up to ${berry.max_harvest}` },
      { label: 'Smoothness', value: String(berry.smoothness) },
      { label: 'Natural Gift', value: `${berry.natural_gift_power} power` },
    ],
    groups: heldByGroup(item),
    speech: `${name}. ${article(firmness)} ${firmness}, ${taste} Berry. ${exclaim(summary)}`,
  }
}

export const berriesDatabank: Databank = {
  id: 'berries',
  label: 'Berries',
  singular: 'Berry',
  blurb: 'Flavours, firmness, growth and effects',
  art: [itemArtwork('oran-berry')],
  icon: BerryIcon,
  hue: '#e84a8a',
  placeholder: 'Oran or 7',
  source: 'PokéAPI',
  loadIndex: async (signal) =>
    (await fetchJson<PagedList>('berry?limit=500', signal)).results.map((berry) => ({
      key: berry.name,
      label: `${titleCase(berry.name)} Berry`,
      number: idFromUrl(berry.url),
      image: itemSprite(`${berry.name}-berry`),
    })),
  loadEntry: async (key, signal) => {
    // PokeAPI drops the word berry from the name
    const berry = await fetchJson<ApiBerry>(`berry/${key.replace(/-berry$/, '')}`, signal)
    const item = await fetchJson<ApiItem>(berry.item.url, signal)
    return berryToEntry(berry, item)
  },
}
