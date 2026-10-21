// Databank list in launcher order. To add one, write a Databank module,
// add its id to SectionId in types.ts and list it here
import { Compass, Layers, Medal, Tv, Users } from 'lucide-react'
import { abilitiesDatabank, movesDatabank, typesDatabank } from './battle'
import { ballsDatabank, berriesDatabank, itemsDatabank, treatsDatabank } from './items'
import { pokemonDatabank } from './pokemon'
import type { Databank, PlannedDatabank, SectionId } from './types'
import { naturesDatabank, regionsDatabank } from './world'

export const DATABANK_LIST: Databank[] = [
  pokemonDatabank,
  berriesDatabank,
  treatsDatabank,
  itemsDatabank,
  ballsDatabank,
  movesDatabank,
  abilitiesDatabank,
  typesDatabank,
  regionsDatabank,
  naturesDatabank,
]

export const DATABANKS = Object.fromEntries(DATABANK_LIST.map((databank) => [databank.id, databank])) as Record<SectionId, Databank>

export const isSectionId = (value: string): value is SectionId => value in DATABANKS

/** Empty menu slots for future databanks */
export const PLANNED_DATABANKS: PlannedDatabank[] = [
  { id: 'leaders', label: 'Gym leader teams', blurb: 'Each leader’s line-up, game by game', icon: Users },
  { id: 'locations', label: 'Places & encounters', blurb: 'What lives on every route', icon: Compass },
  { id: 'cards', label: 'Trading cards', blurb: 'Card sets and rarities', icon: Layers },
  { id: 'contests', label: 'Contests & ribbons', blurb: 'Appeals, Poffins and Pokéblocks', icon: Medal },
  { id: 'anime', label: 'Anime & films', blurb: 'Episodes, journeys, companions', icon: Tv },
]
