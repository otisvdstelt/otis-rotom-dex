// Names for alternate forms like Mega, Gigantamax and regional ones.
// PokeAPI slugs them as species slug plus a suffix, numbered from 10001
import { pokemonLabel } from './types.ts'

export interface FormName {
  /** Full form name, like Mega Charizard X */
  name: string
  /** Form kind for a tag, null for the ordinary form */
  kind: string | null
}

const REGIONS: Record<string, string> = { alola: 'Alolan', galar: 'Galarian', hisui: 'Hisuian', paldea: 'Paldean' }

const words = (suffix: string): string =>
  suffix
    .split('-')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')

/** Name with the detail in brackets if any */
const withDetail = (name: string, detail: string): string => (detail ? `${name} (${words(detail)})` : name)

/** Names a form from its slug and species */
export function nameForm(pokemonSlug: string, speciesSlug: string, speciesName: string): FormName {
  if (!pokemonSlug.startsWith(`${speciesSlug}-`)) return { name: speciesName, kind: null }
  const suffix = pokemonSlug.slice(speciesSlug.length + 1)
  const parts = suffix.split('-')

  // Mega forms
  if (parts.includes('mega')) {
    const rest = parts.filter((part) => part !== 'mega').join('-')
    const mega = `Mega ${speciesName}`
    return { name: rest === 'x' || rest === 'y' ? `${mega} ${rest.toUpperCase()}` : withDetail(mega, rest), kind: 'Mega Evolution' }
  }
  if (suffix === 'primal') return { name: `Primal ${speciesName}`, kind: 'Primal Reversion' }
  if (suffix === 'eternamax') return { name: `Eternamax ${speciesName}`, kind: 'Eternamax' }
  // Gigantamax forms
  if (parts.includes('gmax')) return { name: withDetail(`Gigantamax ${speciesName}`, parts.filter((part) => part !== 'gmax').join('-')), kind: 'Gigantamax' }
  if (parts.includes('totem')) return { name: withDetail(`Totem ${speciesName}`, parts.filter((part) => part !== 'totem' && !(part in REGIONS)).join('-')), kind: 'Totem Pokémon' }
  // Regional forms, Pikachu caps are not regional
  if (parts[0] in REGIONS && parts[parts.length - 1] !== 'cap') return { name: withDetail(`${REGIONS[parts[0]]} ${speciesName}`, parts.slice(1).join('-')), kind: 'Regional form' }

  return { name: withDetail(speciesName, suffix), kind: 'Alternate form' }
}

/** Species a form belongs to, the longest matching slug */
export function speciesOfForm(pokemonSlug: string, speciesSlugs: ReadonlySet<string>): string | null {
  const parts = pokemonSlug.split('-')
  for (let length = parts.length - 1; length >= 1; length--) {
    const candidate = parts.slice(0, length).join('-')
    if (speciesSlugs.has(candidate)) return candidate
  }
  return null
}

/** Form name from slugs only, for the index list */
export const nameFormFromSlugs = (pokemonSlug: string, speciesSlug: string): FormName => nameForm(pokemonSlug, speciesSlug, pokemonLabel(speciesSlug))
