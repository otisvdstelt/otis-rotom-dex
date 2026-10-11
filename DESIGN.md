# Design

The visual system of Rotom Dex as built. Tokens and component classes live in `src/index.css`; Rotom's shape in `src/lib/rotomGeometry.ts`; its materials and animation in `src/components/RotomModel.tsx`; the sky in `src/components/three/Backdrop.tsx`.

## Thesis

It should feel like it came out of the Pokémon world. Rotom is the real Rotom Dex from the anime, and it is the interface: you wake it, the data is on its screen, its words are in a game text box, and nothing sits in side panels.

## Scene

An anime title card: a character introduced against a bright sky with a burst behind it. Daylight, saturated, graphic. Light enough to feel like Alola, deep enough at the top for white text.

## Rotom

Follows the anime (and the Sun and Moon model sheet for what the anime does not show).

- A flat red tablet. The head is an arrowhead: a low, nearly straight roof that rounds over a shoulder and drops to a sharp ear tip on each side. Under the ears the outline cuts back in to a narrower, boxier lower body with a flat bottom. Ear to ear it is about 1.4 times as wide as the lower body, and a little wider than it is tall.
- A fat cone of a spike on top, about half the head's width tall, red at the base and magenta at the tip.
- A pale screen filling most of the lower body, in a dark frame. Two tall oval eyes, white with blue irises, sit on the body and overlap the screen's top edge; between them stands a dark dome that is part of the display.
- On the screen, Rotom's own face: a wide light-blue head that rises into the dome, a tail trailing to the lower right corner, and a mouth. The happy mouth is a compact white grin with fine lines for teeth.
- Two speaker holes on each cheek, two teardrop feet, and an arm on each side: a thin strut that kicks up, jogs down and opens into a big paddle that flares toward its far end. Each paddle carries an oval boss.
- The back has the camera lens, bolts, a port and a button.
- Cel shading in hard bands, a constant-width dark ink outline, and a second, wider hull that glows in the emotion's colour (the Rotom inside). Only that glow and the sparks bloom.

Eyes and face are drawn expressions on unlit planes, swapped per emotion: idle, blink, scan, success, error and sleep, plus a talking mouth. One picker (`src/lib/expression.ts`) chooses them for both forms.

## Asleep and waking

Asleep is night: the same sky with the light gone out of it, the mood sun left as a dim moon, a few stars. Rotom hangs low with its arms down and its lids heavy; its screen is the dull grey-green of the unresponsive Pokédex in the games, with scan lines and a power glyph. Waking brings the day up, sparks jump from spike to ears to hands, the screen rolls through a three-line start-up check, and Rotom hops and grins.

## Rotom Phone form

On a phone the phone is the Rotom. Red body edge to edge with an inked rim; the same eyes at the top, overlapping the display by the same proportion as on the Dex; the dome between them. The display is the Dex's own: pale, with the blue head and tail, or the same paper menus. The text box floats over the foot of the display (it never takes a row of its own), and below the display runs a bar of soft keys in the title bar's cyan: Back, a Poké Ball home key riding half out of the bar, and Menu. The scan controls live in a white sheet that slides up over the display from that bar and is pulled down by its handle. Asleep, the screen is grey-green with a power mark in the middle and no bar under it; it is tapped, never swiped. The chin carries the status lamp and the power switch, which works in both directions. The display's rim glows in the emotion's colour and pulses the way the Dex's light does.

## Colour

| Token | Value | Role |
| --- | --- | --- |
| Sky | `#0b1f9c` → `#1657e6` → `#2bb1ff` | The world, top to bottom. Drawn in WebGL; the page background matches it. |
| `rotom` | `#de3b3d` | Rotom's red. In the HUD only for "BZZZT!". |
| `ink` / `ink-soft` | `#25305a` / `#55648c` | Menu text and secondary text. |
| `paper` / `pale` / `rule` | `#ffffff` / `#eef7fd` / `#cfe6f4` | Screen ground, striping, divider lines. |
| `aqua` / `aqua-deep` / `aqua-ink` | `#36b3e6` / `#1783b8` / `#0f5d86` | Rotom Dex cyan: title bars, key rims, headings, links. |
| `volt` / `volt-deep` / `volt-ink` | `#ffd83d` / `#d99200` / `#5a3b00` | Selection yellow: the cursor bar, hover and focus, the scan key. |
| Text box gold | `#f2a900`, `#ffe9a3` | The rim of Rotom's text box. Nothing else uses it. |
| Emotion | amber `#ffb547`, cyan `#2ff3ff`, green `#3dff8a`, red `#ff3b30` | Rotom's glow and light, the mood sun and the status dot. Nothing else uses them. |

Type labels and gym badges are the games' own artwork. Stat bars are coloured by tier: red, orange, yellow, green, cyan.

## The mood sun

A flat, hard-edged disc behind Rotom: a pale centre so its red reads clearly, and a saturated ring in the emotion's colour. No soft gradient. Scanning sends thin rings outward, success fires one shockwave, error sours the sky and pulses hazard stripes at the corners. Burst wedges turn slowly; halftone dots gather toward the bottom.

## Type

**M PLUS Rounded 1c** (500 / 700 / 800 / 900), standing in for the rounded gothic the games set their menus in. One family throughout: weight and case carry the hierarchy. Names and key legends are 900 uppercase; sentences are 700; captions are 800 in cyan ink. Self-hosted latin subsets via Fontsource.

Everything on Rotom's screen is sized in `em` from one base size that follows the screen's width, so the same layout works on a phone and a desktop.

## Surfaces

- **Rotom's screen** (`.dex-screen`): white paper with faint diagonal cyan stripes. A cyan title bar that runs up behind the bottoms of the eyes (on the 3D Dex that last strip is drawn in the scene itself, since HTML cannot pass behind them). Below it a back row, then a scrolling body. Lists are ruled rows with a yellow cursor bar on hover and focus. Sections open with a small cyan heading and a rule (`.dex-heading`).
- **Text box** (`.textbox`): cream paper in a gold double rim with a small bolt pinned to its top edge. Fixed height: a long line rolls upward as it is typed. A bobbing arrow marks the end of the line and, pressed, puts the box away, leaving a pill-shaped tab in the same corner (bolt, three dots, arrow up) that brings it back; the dots turn red and blink when there is a new line.
- **Key tray** (`.glass`): pale frosted glass over the sky, holding the keys.
- **Key** (`.key`): a white pill with a cyan rim and a visible skirt it sinks into when pressed. Yellow for the scan key. Hover adds a yellow ring; while a scan runs, stripes of charge run across the scan key.
- **Chip** (`.dex-chip`): a white pill for linked entries; turns yellow on hover.
- **Meter** (`.dex-meter`): a rounded bar, fill animated on width.

Nothing is nested in cards. There are no side panels.

## Layout

- The canvas fills the window. Header: wordmark at left; status chip and shot switch at right. Bottom band: text box and key tray, side by side on a desktop, stacked on a phone with the keys lowest.
- `src/lib/framing.ts` works out both camera shots from the window size and the measured height of the bottom band, and the size of Rotom's screen in CSS pixels in the close shot. The camera and the HTML on the screen use the same numbers, so the screen is shown at 1:1.
- In the close shot Rotom stops tilting, so the screen stays square to the viewer.
- Below 640 px wide the 3D scene is replaced by the phone form; nothing of three.js loads.

## Motion

- Rotom carries the motion. Each emotion is a pose and a rhythm that cross-fade: float, jitter, lunge-and-spin, shake-and-slump.
- A result appears on the screen only after the lunge and spin have finished.
- Between one menu or list and the next, the screen clears for a moment and Rotom's grin shows through. Face and content always hand over directly: content fades in over the face, and the face is back the instant content clears, so the bare screen never shows.
- A poke is a hop with the eyes squeezed shut.
- The interface answers with small things: the text box types its words, meters sweep, a new entry rises in, keys travel when pressed.
- Easing is exponential ease-out. `prefers-reduced-motion` shrinks Rotom's shakes, drops the spin and removes interface transitions.

## Voice

Rotom speaks in first person, excitable, with "BZZZT!", "bzzt" and the occasional "-roto". Labels on the screen and keys are plain: Menu, Close, Prev, Next, Random, Say again. Errors say what went wrong and what to do.
