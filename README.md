# Rotom Dex

I wanted a Pokédex that felt alive, so I built the Rotom Dex from the anime and Sun and Moon.

It starts asleep under a night sky. Tap it and it wakes up, hops and says hi. Then ask it about anything: Pokémon, berries, items, moves, abilities, types, regions, badges or natures. It scans with sparks flying, spins when it finds the answer and shows it on its own screen. If it finds nothing, it shakes and slumps.

It talks with 40 recorded voice clips. On a phone, the phone itself becomes Rotom. You can also add it to your home screen and it opens like an app.

## How I made it

- **The app** is React and TypeScript, built with Vite and styled with Tailwind CSS.
- **The 3D Rotom** runs on Three.js through React Three Fiber and drei, with a bloom effect for the glow. I built its whole body in code, and a script bakes it into a small 3D model file.
- **The faces** are drawn in code too, and a script turns them into images.
- **The phone version** is plain HTML and CSS with no 3D at all, so it stays light.
- **The data** comes live from [PokéAPI](https://pokeapi.co), loaded with TanStack Query. I wrote the gym badge info by hand because PokéAPI doesn't have it.
- **The voice** is recorded clips made with a voice model on fish.audio. The sound effects are generated in the browser.

## Run it

Needs Node 22.18 or newer.

```bash
npm install
npm run dev
npm run build
```

It's a static site with no server or keys, so it deploys anywhere. `vercel.json` is already set up. Run `npm run assets` to rebuild the model, faces and icons.

## Small print

The voice clips were made with a community voice model on fish.audio, so check its terms before using them beyond a personal project.

Pokémon and all related names and images are © Nintendo, Game Freak and The Pokémon Company. This is an unofficial fan project and isn't affiliated with or endorsed by them.
