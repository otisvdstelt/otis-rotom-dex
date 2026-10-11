// The Rotom Dex's table of contents. Order here is the order in the launcher.
//
// Adding a databank:
//   1. Write a module exporting a `Databank` (see types.ts): how to list its
//      entries and how to turn one API record into a `DexEntry`.
//   2. Add its id to `SectionId` in types.ts and list it below.
// Search, the index list, Prev/Next, random scan, cross-links, the details
// panel and Rotom's speech then work without further changes.
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

/** Slots reserved in the menu for databanks that are not written yet. */
export const PLANNED_DATABANKS: PlannedDatabank[] = [
  { id: 'leaders', label: 'Gym leader teams', blurb: 'Each leader’s line-up, game by game', icon: Users },
  { id: 'locations', label: 'Places & encounters', blurb: 'What lives on every route', icon: Compass },
  { id: 'cards', label: 'Trading cards', blurb: 'Card sets and rarities', icon: Layers },
  { id: 'contests', label: 'Contests & ribbons', blurb: 'Appeals, Poffins and Pokéblocks', icon: Medal },
  { id: 'anime', label: 'Anime & films', blurb: 'Episodes, journeys, companions', icon: Tv },
]
