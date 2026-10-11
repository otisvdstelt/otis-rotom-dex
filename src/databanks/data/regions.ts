// Region lore that PokeAPI does not carry: gym badges, their leaders, the
// partner Pokémon trainers choose from, and a line of introduction. Maintained
// by hand from the main-series games; extend it here when a new region arrives.
import type { TypeName } from '../../lib/types'

export interface GymBadge {
  badge: string
  leader: string
  place: string
  type: TypeName
  /** Number of this badge's artwork in PokeAPI's sprite set; absent where there is no badge to show. */
  sprite?: number
}

export interface RegionLore {
  intro: string
  /** PokeAPI slugs of the partner Pokémon offered at the start of the journey. */
  starters: string[]
  /** What this region calls its challenge: gyms elsewhere, trials in Alola, nobles in Hisui. */
  challenge: { title: string; badges: GymBadge[] } | null
  /** Notable Pokémon tied to the region's story, as PokeAPI slugs. */
  notable?: { title: string; pokemon: string[] }
}

export const REGION_LORE: Record<string, RegionLore> = {
  kanto: {
    intro: 'Where most journeys began: Pallet Town, Professor Oak and the Indigo League.',
    starters: ['bulbasaur', 'charmander', 'squirtle'],
    challenge: {
      title: 'Gym badges',
      badges: [
        { badge: 'Boulder Badge', leader: 'Brock', place: 'Pewter City', type: 'rock' },
        { badge: 'Cascade Badge', leader: 'Misty', place: 'Cerulean City', type: 'water' },
        { badge: 'Thunder Badge', leader: 'Lt. Surge', place: 'Vermilion City', type: 'electric' },
        { badge: 'Rainbow Badge', leader: 'Erika', place: 'Celadon City', type: 'grass' },
        { badge: 'Soul Badge', leader: 'Koga', place: 'Fuchsia City', type: 'poison' },
        { badge: 'Marsh Badge', leader: 'Sabrina', place: 'Saffron City', type: 'psychic' },
        { badge: 'Volcano Badge', leader: 'Blaine', place: 'Cinnabar Island', type: 'fire' },
        { badge: 'Earth Badge', leader: 'Giovanni', place: 'Viridian City', type: 'ground' },
      ],
    },
    notable: { title: 'Legendary birds and beyond', pokemon: ['articuno', 'zapdos', 'moltres', 'mewtwo', 'mew'] },
  },
  johto: {
    intro: "Kanto's western neighbour, steeped in tradition and legend, from Ecruteak's towers to the Ruins of Alph.",
    starters: ['chikorita', 'cyndaquil', 'totodile'],
    challenge: {
      title: 'Gym badges',
      badges: [
        { badge: 'Zephyr Badge', leader: 'Falkner', place: 'Violet City', type: 'flying' },
        { badge: 'Hive Badge', leader: 'Bugsy', place: 'Azalea Town', type: 'bug' },
        { badge: 'Plain Badge', leader: 'Whitney', place: 'Goldenrod City', type: 'normal' },
        { badge: 'Fog Badge', leader: 'Morty', place: 'Ecruteak City', type: 'ghost' },
        { badge: 'Storm Badge', leader: 'Chuck', place: 'Cianwood City', type: 'fighting' },
        { badge: 'Mineral Badge', leader: 'Jasmine', place: 'Olivine City', type: 'steel' },
        { badge: 'Glacier Badge', leader: 'Pryce', place: 'Mahogany Town', type: 'ice' },
        { badge: 'Rising Badge', leader: 'Clair', place: 'Blackthorn City', type: 'dragon' },
      ],
    },
    notable: { title: 'Tower guardians and beasts', pokemon: ['lugia', 'ho-oh', 'raikou', 'entei', 'suicune', 'celebi'] },
  },
  hoenn: {
    intro: 'A warm southern region of rainforest, volcano and open sea, shaped by Groudon and Kyogre.',
    starters: ['treecko', 'torchic', 'mudkip'],
    challenge: {
      title: 'Gym badges',
      badges: [
        { badge: 'Stone Badge', leader: 'Roxanne', place: 'Rustboro City', type: 'rock' },
        { badge: 'Knuckle Badge', leader: 'Brawly', place: 'Dewford Town', type: 'fighting' },
        { badge: 'Dynamo Badge', leader: 'Wattson', place: 'Mauville City', type: 'electric' },
        { badge: 'Heat Badge', leader: 'Flannery', place: 'Lavaridge Town', type: 'fire' },
        { badge: 'Balance Badge', leader: 'Norman', place: 'Petalburg City', type: 'normal' },
        { badge: 'Feather Badge', leader: 'Winona', place: 'Fortree City', type: 'flying' },
        { badge: 'Mind Badge', leader: 'Tate & Liza', place: 'Mossdeep City', type: 'psychic' },
        { badge: 'Rain Badge', leader: 'Wallace', place: 'Sootopolis City', type: 'water' },
      ],
    },
    notable: { title: 'Weather trio', pokemon: ['kyogre', 'groudon', 'rayquaza'] },
  },
  sinnoh: {
    intro: 'A cold northern region split by Mt. Coronet, where the myths of time and space were born.',
    starters: ['turtwig', 'chimchar', 'piplup'],
    challenge: {
      title: 'Gym badges',
      badges: [
        { badge: 'Coal Badge', leader: 'Roark', place: 'Oreburgh City', type: 'rock' },
        { badge: 'Forest Badge', leader: 'Gardenia', place: 'Eterna City', type: 'grass' },
        { badge: 'Cobble Badge', leader: 'Maylene', place: 'Veilstone City', type: 'fighting' },
        { badge: 'Fen Badge', leader: 'Crasher Wake', place: 'Pastoria City', type: 'water' },
        { badge: 'Relic Badge', leader: 'Fantina', place: 'Hearthome City', type: 'ghost' },
        { badge: 'Mine Badge', leader: 'Byron', place: 'Canalave City', type: 'steel' },
        { badge: 'Icicle Badge', leader: 'Candice', place: 'Snowpoint City', type: 'ice' },
        { badge: 'Beacon Badge', leader: 'Volkner', place: 'Sunyshore City', type: 'electric' },
      ],
    },
    notable: { title: 'Creation trio', pokemon: ['dialga', 'palkia', 'giratina', 'arceus'] },
  },
  unova: {
    intro: 'A far-off region of big cities and long bridges, with Castelia City at its heart.',
    starters: ['snivy', 'tepig', 'oshawott'],
    challenge: {
      title: 'Gym badges',
      badges: [
        { badge: 'Trio Badge', leader: 'Cilan, Chili & Cress', place: 'Striaton City', type: 'grass' },
        { badge: 'Basic Badge', leader: 'Lenora', place: 'Nacrene City', type: 'normal' },
        { badge: 'Insect Badge', leader: 'Burgh', place: 'Castelia City', type: 'bug' },
        { badge: 'Bolt Badge', leader: 'Elesa', place: 'Nimbasa City', type: 'electric' },
        { badge: 'Quake Badge', leader: 'Clay', place: 'Driftveil City', type: 'ground' },
        { badge: 'Jet Badge', leader: 'Skyla', place: 'Mistralton City', type: 'flying' },
        { badge: 'Freeze Badge', leader: 'Brycen', place: 'Icirrus City', type: 'ice' },
        { badge: 'Legend Badge', leader: 'Drayden / Iris', place: 'Opelucid City', type: 'dragon' },
        { badge: 'Toxic Badge', leader: 'Roxie (Black 2 / White 2)', place: 'Virbank City', type: 'poison' },
        { badge: 'Wave Badge', leader: 'Marlon (Black 2 / White 2)', place: 'Humilau City', type: 'water' },
      ],
    },
    notable: { title: 'Tao trio', pokemon: ['reshiram', 'zekrom', 'kyurem'] },
  },
  kalos: {
    intro: 'A star-shaped region famed for beauty and fashion, where Mega Evolution was first studied.',
    starters: ['chespin', 'fennekin', 'froakie'],
    challenge: {
      title: 'Gym badges',
      badges: [
        { badge: 'Bug Badge', leader: 'Viola', place: 'Santalune City', type: 'bug' },
        { badge: 'Cliff Badge', leader: 'Grant', place: 'Cyllage City', type: 'rock' },
        { badge: 'Rumble Badge', leader: 'Korrina', place: 'Shalour City', type: 'fighting' },
        { badge: 'Plant Badge', leader: 'Ramos', place: 'Coumarine City', type: 'grass' },
        { badge: 'Voltage Badge', leader: 'Clemont', place: 'Lumiose City', type: 'electric' },
        { badge: 'Fairy Badge', leader: 'Valerie', place: 'Laverre City', type: 'fairy' },
        { badge: 'Psychic Badge', leader: 'Olympia', place: 'Anistar City', type: 'psychic' },
        { badge: 'Iceberg Badge', leader: 'Wulfric', place: 'Snowbelle City', type: 'ice' },
      ],
    },
    notable: { title: 'Aura trio', pokemon: ['xerneas', 'yveltal', 'zygarde'] },
  },
  alola: {
    intro: 'Four tropical islands where trainers take the island challenge instead of gyms. The first Rotom Dex was issued here.',
    starters: ['rowlet', 'litten', 'popplio'],
    challenge: {
      title: 'Grand trials',
      badges: [
        { badge: 'Melemele grand trial', leader: 'Kahuna Hala', place: 'Melemele Island', type: 'fighting' },
        { badge: 'Akala grand trial', leader: 'Kahuna Olivia', place: 'Akala Island', type: 'rock' },
        { badge: "Ula'ula grand trial", leader: 'Kahuna Nanu', place: "Ula'ula Island", type: 'dark' },
        { badge: 'Poni grand trial', leader: 'Kahuna Hapu', place: 'Poni Island', type: 'ground' },
      ],
    },
    notable: { title: 'Guardian deities', pokemon: ['tapu-koko', 'tapu-lele', 'tapu-bulu', 'tapu-fini'] },
  },
  galar: {
    intro: 'A long industrial region where gym battles fill stadiums and Pokémon Dynamax.',
    starters: ['grookey', 'scorbunny', 'sobble'],
    challenge: {
      title: 'Gym badges',
      badges: [
        { badge: 'Grass Badge', leader: 'Milo', place: 'Turffield', type: 'grass' },
        { badge: 'Water Badge', leader: 'Nessa', place: 'Hulbury', type: 'water' },
        { badge: 'Fire Badge', leader: 'Kabu', place: 'Motostoke', type: 'fire' },
        { badge: 'Fighting Badge', leader: 'Bea (Sword)', place: 'Stow-on-Side', type: 'fighting' },
        { badge: 'Ghost Badge', leader: 'Allister (Shield)', place: 'Stow-on-Side', type: 'ghost' },
        { badge: 'Fairy Badge', leader: 'Opal', place: 'Ballonlea', type: 'fairy' },
        { badge: 'Rock Badge', leader: 'Gordie (Sword)', place: 'Circhester', type: 'rock' },
        { badge: 'Ice Badge', leader: 'Melony (Shield)', place: 'Circhester', type: 'ice' },
        { badge: 'Dark Badge', leader: 'Piers', place: 'Spikemuth', type: 'dark' },
        { badge: 'Dragon Badge', leader: 'Raihan', place: 'Hammerlocke', type: 'dragon' },
      ],
    },
    notable: { title: 'The Darkest Day', pokemon: ['zacian', 'zamazenta', 'eternatus'] },
  },
  hisui: {
    intro: 'Sinnoh as it was long ago, when people and Pokémon were only beginning to live together.',
    starters: ['rowlet', 'cyndaquil', 'oshawott'],
    challenge: null,
    notable: { title: 'Noble Pokémon', pokemon: ['kleavor', 'lilligant', 'arcanine', 'electrode', 'avalugg'] },
  },
  paldea: {
    intro: 'A vast open region built around its academy, the Great Crater and the Terastal phenomenon.',
    starters: ['sprigatito', 'fuecoco', 'quaxly'],
    challenge: {
      title: 'Gym badges',
      badges: [
        { badge: 'Bug Badge', leader: 'Katy', place: 'Cortondo', type: 'bug' },
        { badge: 'Grass Badge', leader: 'Brassius', place: 'Artazon', type: 'grass' },
        { badge: 'Electric Badge', leader: 'Iono', place: 'Levincia', type: 'electric' },
        { badge: 'Water Badge', leader: 'Kofu', place: 'Cascarrafa', type: 'water' },
        { badge: 'Normal Badge', leader: 'Larry', place: 'Medali', type: 'normal' },
        { badge: 'Ghost Badge', leader: 'Ryme', place: 'Montenevera', type: 'ghost' },
        { badge: 'Psychic Badge', leader: 'Tulip', place: 'Alfornada', type: 'psychic' },
        { badge: 'Ice Badge', leader: 'Grusha', place: 'Glaseado', type: 'ice' },
      ],
    },
    notable: { title: 'Riders of past and future', pokemon: ['koraidon', 'miraidon'] },
  },
  orre: {
    intro: 'A harsh desert region with almost no wild Pokémon, known for the Shadow Pokémon stolen and corrupted there.',
    starters: ['eevee', 'espeon', 'umbreon'],
    challenge: null,
  },
}

// Artwork numbers in PokeAPI's badge sprites, in the same order as each region's list above.
const BADGE_SPRITES: Record<string, number[]> = {
  kanto: [1, 2, 3, 4, 5, 6, 7, 8],
  johto: [9, 10, 11, 12, 13, 14, 15, 16],
  hoenn: [17, 18, 19, 20, 21, 22, 23, 24],
  sinnoh: [25, 26, 27, 28, 29, 30, 31, 32],
  unova: [33, 34, 36, 37, 38, 39, 40, 41, 35, 42],
  kalos: [43, 44, 45, 46, 47, 48, 49, 50],
  galar: [51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
  paldea: [70, 71, 72, 73, 74, 75, 76, 77],
}

for (const [region, sprites] of Object.entries(BADGE_SPRITES)) {
  REGION_LORE[region]?.challenge?.badges.forEach((badge, index) => {
    badge.sprite = sprites[index]
  })
}
