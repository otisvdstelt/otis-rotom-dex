// Names for the alternate forms of a Pokémon: Mega Evolutions, Gigantamax
// forms, regional forms and the rest. PokéAPI files each one as its own
// "pokemon" (numbered from 10001 up) whose slug is the species' slug plus a
// suffix: "charizard-mega-x", "raichu-alola", "pikachu-gmax".
import { pokemonLabel } from './types.ts'

export interface FormName {
  /** The form's full name: "Mega Charizard X", "Alolan Raichu", "Rotom (Wash)". */
  name: string
  /** What kind of form it is, for a tag; null for a species' ordinary form. */
  kind: string | null
}

const REGIONS: Record<string, string> = { alola: 'Alolan', galar: 'Galarian', hisui: 'Hisuian', paldea: 'Paldean' }

const words = (suffix: string): string =>
  suffix
    .split('-')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')

/** With the detail in brackets when there is any: "Tauros", "Tauros (Combat Breed)". */
const withDetail = (name: string, detail: string): string => (detail ? `${name} (${words(detail)})` : name)

/**
 * Names a form from its slug, given the slug and proper name of its species.
 * A slug that is just the species (or does not extend it) is the ordinary form.
 */
export function nameForm(pokemonSlug: string, speciesSlug: string, speciesName: string): FormName {
  if (!pokemonSlug.startsWith(`${speciesSlug}-`)) return { name: speciesName, kind: null }
  const suffix = pokemonSlug.slice(speciesSlug.length + 1)
  const parts = suffix.split('-')

  // Mega Evolutions: "mega", "mega-x" and "mega-y", or of a particular form ("curly-mega").
  if (parts.includes('mega')) {
    const rest = parts.filter((part) => part !== 'mega').join('-')
    const mega = `Mega ${speciesName}`
    return { name: rest === 'x' || rest === 'y' ? `${mega} ${rest.toUpperCase()}` : withDetail(mega, rest), kind: 'Mega Evolution' }
  }
  if (suffix === 'primal') return { name: `Primal ${speciesName}`, kind: 'Primal Reversion' }
  if (suffix === 'eternamax') return { name: `Eternamax ${speciesName}`, kind: 'Eternamax' }
  // Gigantamax, sometimes of a particular form: "gmax", "single-strike-gmax".
  if (parts.includes('gmax')) return { name: withDetail(`Gigantamax ${speciesName}`, parts.filter((part) => part !== 'gmax').join('-')), kind: 'Gigantamax' }
  if (parts.includes('totem')) return { name: withDetail(`Totem ${speciesName}`, parts.filter((part) => part !== 'totem' && !(part in REGIONS)).join('-')), kind: 'Totem Pokémon' }
  // Regional forms, sometimes with a breed or mode of their own: "alola", "paldea-combat-breed".
  // (Pikachu's caps are named after regions without being regional forms.)
  if (parts[0] in REGIONS && parts[parts.length - 1] !== 'cap') return { name: withDetail(`${REGIONS[parts[0]]} ${speciesName}`, parts.slice(1).join('-')), kind: 'Regional form' }

  return { name: withDetail(speciesName, suffix), kind: 'Alternate form' }
}

/**
 * The species a form's slug belongs to: the longest species slug it starts
 * with ("mr-mime-galar" belongs to "mr-mime", not to "mr").
 */
export function speciesOfForm(pokemonSlug: string, speciesSlugs: ReadonlySet<string>): string | null {
  const parts = pokemonSlug.split('-')
  for (let length = parts.length - 1; length >= 1; length--) {
    const candidate = parts.slice(0, length).join('-')
    if (speciesSlugs.has(candidate)) return candidate
  }
  return null
}

/** A form's name when only slugs are to hand (the index list), using the stock spelling of the species' name. */
export const nameFormFromSlugs = (pokemonSlug: string, speciesSlug: string): FormName => nameForm(pokemonSlug, speciesSlug, pokemonLabel(speciesSlug))
