# Rotom Dex

An interactive 3D Rotom Dex, modelled on the one from the Pokémon anime and Pokémon Sun and Moon. Switch it on and ask it about anything in the Pokémon world: it scans, reacts with its whole body, shows the answer on its own screen and announces it in its own recorded voice. On a phone it takes its phone form, where the phone itself is Rotom.

Built with Vite, React 19, TypeScript, Tailwind CSS v4, Three.js, React Three Fiber, drei and TanStack Query.

## What Rotom Dex can do

**It is a character, not a page**

- It starts every visit asleep under a night sky. Tap it and it powers on, runs a start-up check, hops and greets you.
- It reacts to everything with its whole body: it floats while idle, crackles with sparks while it scans, lunges and spins when it finds something, and shakes and slumps when it does not.
- Its eyes blink, follow your pointer and change with its mood, and its face shows on its own screen whenever no data is on it.
- It talks in its own recorded voice (40 clips), with a volume control and a mute switch.
- Poke it and it hops and answers back.
- You can drag to look at it from any side, and bring its screen up close to read.

**It knows the Pokémon world**

- **Pokémon:** all 1,025 species plus 326 alternate forms (Mega Evolutions, Gigantamax, regional forms, Totems and more), each with types, base stats, Pokédex entry, height and weight, abilities, level-up moves, evolution family, cry, and artwork in normal and shiny colours.
- **Berries, Snacks, Items and Poké Balls:** what each one does and which Pokémon are found holding it.
- **Moves and Abilities:** type, power, accuracy and effect, and every Pokémon that has them.
- **Types:** what each type is strong and weak against, attacking and defending.
- **Regions and gym badges:** every region with its games, places, partner Pokémon and badges.
- **Natures:** which stats they raise and lower, and the flavours those Pokémon like.

**It is quick to get around**

- One search field looks through every databank at once, from anywhere, and shows matches as you type.
- Everything is linked: tap a Pokémon's type, ability, move or form to jump straight to it.
- Step through a databank with PREV and NEXT, or let the dice key pick one at random.
- Long lists load as you scroll, so even 2,200 items stay smooth.
- Every entry has its own link you can share.

**It fits the device**

- On a computer or tablet it is the full 3D Rotom Dex.
- On a phone, the phone itself becomes Rotom: tap its sleeping screen to wake it, and use its soft keys and Poké Ball home key like a phone.
- It works with a keyboard, a mouse or touch, and tones its motion down for people who ask their device for less.

The rest of this page explains how each part works.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
npm run lint
```

Node 22.18 or newer is needed (Vite 8, and `npm run rotom` runs a TypeScript file directly).

## Deploy

The app is a static site: no server, no environment variables, no keys. On Vercel, import the repository and deploy; `vercel.json` already names the framework (Vite), the build command (`npm run build`) and the output folder (`dist`), and sets cache headers for the model, textures and voice clips. Any other static host works the same way: build, then serve `dist/`.

Everything the build needs is in the repository, including the generated model, textures and voice clips, so the asset scripts do not run during a deploy.

## Waking it up

Every visit, and every refresh, starts with Rotom **asleep**: night sky, eyes shut, arms hanging, the screen a dull grey-green. Tap Rotom, tap its screen, press the **Power on** key or press `Enter`. It crackles, runs a short start-up screen while the day comes up behind it, hops, grins and greets you. Nothing is looked up before that, and since browsers only allow sound after a tap, waking it is also what gives it its voice. The power button (top right, or on the phone form's chin) puts it back to sleep.

A link straight to an entry (`/#/pokemon/pikachu`) still opens on a sleeping Rotom; it scans that entry as soon as it is awake.

## How Rotom behaves

Once awake, Rotom has one core state, its **emotion**, taken straight from the life cycle of the current lookup:

| Emotion | When | Body | Light and sky | Face |
| --- | --- | --- | --- | --- |
| `IDLE` | Nothing requested | Slow float, lazy tilt, glances at your pointer, blinks | Soft amber | Wide eyes, smile |
| `SCANNING` | Request in flight | Fast jitter on every axis, arms raised, sparks from spike to ears and hands | Flashing cyan, rings racing outward | Narrowed eyes, flat mouth |
| `SUCCESS` | Data resolved | Lunges at you while spinning 360°, then holds its screen up | Steady green, one shockwave | Eyes squeezed shut with joy, the compact grin, mouth moving as it talks |
| `ERROR` | Unknown entry or no connection | Violent side-to-side shake, then a slump with relapses | Blinking hazard red, sour sky | `> <` eyes, wobbly mouth, a tear |

## Voice

Rotom speaks only in its recorded voice. Every line it always says the same way has a clip: the greeting, its answers to being poked, the line for the menu and for each databank's list, the opener of each scan report ("Pokémon data analyzed! Here's what I found-roto!") and its error lines. The clips live in `public/voice/`, one folder per kind of line; the README there lists every line and file name, and `src/lib/lines.ts` ties each clip to its text.

The entries themselves come from PokéAPI by the thousand and cannot be recorded, so they are not spoken: after the opener, the entry appears in the text box. There is no synthesised voice, because none sounds like Rotom.

The slider beside the speaker button in the text box (or the `-` and `+` keys) sets how loud Rotom talks, from silent up to twice the level the clips were recorded at; the setting is kept in that browser.

On `SUCCESS` the engine cancels anything still playing and plays the opener. The opening "BZZZT!" is a synthesised buzz, never spoken. A line with no clip, or a clip that fails to load, is simply silent.

Poke Rotom (click or tap its body) and it hops, squeezes its eyes shut and answers back.

## Where things are shown

- **On Rotom's screen:** all data. The menu of databanks, the list inside one, and the entry itself are real HTML laid onto the 3D screen, so they move with the body. Rotom's eyes hang over the top edge of the screen, as on the real device. While Rotom is idle, scanning or upset, its face has the screen instead, and its grin flashes up each time the screen changes from one menu or list to the next.
- **In the text box under Rotom:** what Rotom says, typed out as it speaks, in the style of the games' dialogue box. The arrow in its corner puts the box away; the small tab left in that corner brings it back, and its dots blink when Rotom has said something new. In the phone form the text box floats over the foot of the display instead of taking a row of its own, so opening or closing it moves nothing, and lists scroll clear of it.
- **In the key tray:** menu, search, `PREV`, `NEXT` and the dice key.

### Rotom Phone form

A whole Rotom Dex does not fit on a phone, so below 640 px wide the phone is the Rotom: a red body edge to edge, the eyes at the top hanging over the display, and on the display the same pale screen, face and menus as the Rotom Dex. It is worked like a phone. Asleep it is a dark screen: tap the power mark in the middle of it, or the power switch at the bottom right of its rim, to power it on. It is a tap and not a swipe on purpose, because only a tap lets the browser play Rotom's greeting on time. Awake, a bar of soft keys runs along the bottom: Back, Menu, and a Poké Ball home key between them. Tap the Poké Ball, or swipe up from the bar, and a sheet slides up with the search field and the PREV, dice and NEXT keys; it puts itself away again as soon as Rotom has something to do. It scans, shakes and talks the same way, but it never spins: it is the screen in your hand, not an object in space, so a find gets a little jump instead. Three.js is never downloaded. On a bigger screen the phone button in the header (or `?form=phone` in the address) switches to this form.

### Camera

Long lists are drawn 40 rows at a time: more are added as you scroll toward the end, so even the 2,200 items stay light. Scroll a long list or entry with the mouse wheel, the scroll bar, a finger, or the arrow and page keys. While the screen is held up close, the wheel scrolls it from anywhere over the scene; from a distance the wheel zooms the camera.

The camera has two shots. The **wide** shot shows all of Rotom; the **close** shot brings its screen up to you at reading size. The app picks the shot (close whenever there is something to read) and the button at top right switches by hand. Drag to orbit Rotom: all the way round, never over the top.

## Databanks

The Rotom Dex goes beyond the series: it carries ten databanks, and is built so more can be added.

| Databank | What is in it | Source |
| --- | --- | --- |
| Pokémon | All 1,025 species plus every alternate form PokéAPI holds (Mega Evolutions, Gigantamax, regional forms, Totems and more, numbered from 10001): number, name, types, base stats, entry, profile, abilities, level-up moves, evolution family, cry, official artwork in normal and shiny colours | PokéAPI |
| Berries | Flavours, firmness, size, growth, Natural Gift | PokéAPI |
| Snacks | Regional sweets and drinks, curry ingredients, sandwich fillings | PokéAPI |
| Items | All 2,200+ items | PokéAPI |
| Poké Balls | Standard, special and Apricorn balls | PokéAPI |
| Moves | Type, class, power, accuracy, PP, effect, who learns it | PokéAPI |
| Abilities | Effect and every Pokémon that has it | PokéAPI |
| Types | Full attacking and defending match-ups | PokéAPI |
| Regions & badges | Games, Pokédexes, places, gym badges and leaders, partner Pokémon | PokéAPI + `src/databanks/data/regions.ts` |
| Natures | Stat changes, liked and disliked flavours, favourite berries | PokéAPI |

A Pokémon's entry lists its other forms, each one tap away, and its **Shiny** switch swaps the artwork for the shiny colours. Typing "mega", "gigantamax" or "alolan" in the Pokémon list narrows it to those forms.

Entries link to each other: a Pokémon's type opens that type, an ability lists its Pokémon, a nature lists the berries it loves.

PokéAPI has no data about gyms, so which badge belongs to which leader, town and region is kept by hand in `src/databanks/data/regions.ts`. The badge pictures and type labels themselves are the games' artwork, served from PokéAPI's sprite repository. Regions whose trials award no badge (Alola) show a plain gem in the trial's type colour.

The menu also lists five **empty slots** (gym leader teams, places and encounters, trading cards, contests, anime) that are not built yet.

### Adding a databank

1. Write a module that exports a `Databank` (see `src/databanks/types.ts`): `loadIndex` lists its entries, `loadEntry` turns one API record into a `DexEntry` (name, tags, meters, facts, linked groups, and the line Rotom should say).
2. Add its id to `SectionId` and list it in `src/databanks/registry.ts`.

Search, the list, Prev/Next, the random scan, cross-links, the entry screen and Rotom's speech then work with no further changes.

## Controls

| Input | Action |
| --- | --- |
| Search field + `Enter` | Search every databank at once, from anywhere: matches appear on Rotom's screen as you type (the open databank's first), and `Enter` takes the best one |
| Menu key | Open or close the databank menu on Rotom's screen |
| `PREV` / `NEXT`, `←` / `→` | Step through the open databank |
| Dice key (`RANDOM`), `R` | Pick one at random from the open databank |
| `/` | Focus the search field |
| `Esc` | Back one level |
| `↑` `↓` `Page Up` `Page Down` `Home` `End` | Scroll Rotom's screen |
| `M` | Voice on / off |
| `-` / `+` | Voice quieter / louder |
| `Enter` or `Space` (while asleep) | Power on |
| Click or tap Rotom | Wake it, or poke it |

Links are shareable: `/#/pokemon/pikachu`, `/#/berries/oran`, `/#/regions/kanto`.

## Assets

- **`public/assets/rotom_device.glb`**: Rotom's body, generated by `npm run rotom` from `src/lib/rotomGeometry.ts` (17 named meshes, about 10,800 triangles, Draco-compressed to 46 KB). If the file is missing or broken, the app builds the same body from Three.js primitives at runtime. Drop a different model at that path and the app cel-shades it and lays the face and screen on its front.
- **`public/textures/eyes_*.png`** and **`face_*.png`**: six sets of eyes (idle, blink, scan, success, error, sleep) and five on-screen faces (idle, talk, scan, success, error). The drawings live in `src/lib/faceArt.ts`; `npm run faces` bakes them into textures, and the phone form draws the same mouths straight into the page.
- **`public/voice/`**: Rotom's recorded lines (40 clips), sorted into `greeting/`, `poked/`, `lists/`, `found/` and `errors/`.
- **`public/draco/`**: the Draco decoder, copied from three.js by `npm run draco`.

`npm run assets` regenerates all three. Pokémon, item, badge and type-label images come from PokéAPI's sprite repository at runtime.

## Project layout

```
scripts/                 asset generators (Rotom GLB, face textures, Draco decoder)
src/
  App.tsx                state machine: power, emotion, search input, routing, camera shot, speech trigger
  hooks/
    useRotomApi.ts       the Pokémon lookup (pokemon -> species), retry: false
    useDatabank.ts       generic lookups and lists for the other databanks
    useRotomVoice.ts     the voice: plays the recorded clips
    useLayout.ts         media query, window and element size, typewriter
  components/
    RotomCanvas.tsx      Canvas, lights, emotion light, camera shots, orbit limits, bloom
    RotomModel.tsx       GLB + primitive fallback, emotion animations, face swapping, the HTML screen
    PhoneRotom.tsx       the phone form: the same Rotom built from HTML and CSS
    GameHUD.tsx          wordmark, status chip, text box and key tray
    hud/                 text box, key tray, shared HUD types
    screen/              what Rotom's screen shows: sleep and start-up screens, menu, list, entry, type labels
    three/               sky backdrop, Poké Ball loader
  databanks/             one module per kind of data, plus the registry
  lib/                   geometry, face drawings, expression picker, form names, camera framing, cel shading, PokéAPI client, sound effects, types
```

## Notes

- Speech needs a click or key press first; browsers block audio before that. Powering Rotom on is that click.
- The recorded clips were made with a community voice model on fish.audio. Check that model's terms before using them for anything beyond a personal project.
- `prefers-reduced-motion` shrinks the shakes and replaces the spin with a small nudge.
- In the phone form the text box floats over the foot of the display, so entries scroll; put the box away with its arrow to see the whole display.

## Credits and legal

Pokémon and all related names, characters and images are © Nintendo, Game Freak and The Pokémon Company. This is an unofficial, non-commercial fan project and is not affiliated with or endorsed by them. Data and images from [PokéAPI](https://pokeapi.co). The Rotom Dex model and its faces were drawn for this project, following the official design.
