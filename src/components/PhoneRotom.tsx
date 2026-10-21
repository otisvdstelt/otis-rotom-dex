import type { QueryClient } from '@tanstack/react-query'
import { ChevronLeft, LayoutGrid, Power, TabletSmartphone } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { useElementHeight, useWindowSize } from '../hooks/useLayout'
import { EMOTION_COLOR, type RotomEmotion } from '../lib/emotion'
import { pickExpression } from '../lib/expression'
import { EYE_KEYS, FACE_BROW, FACE_KEYS, FACE_SKIN, MOUTHS, SWEAT, type EyeKey, type FaceKey } from '../lib/faceArt'
import { ROTOM } from '../lib/rotomSpec'
import { eyeTextureUrl } from '../lib/textures'
import { ControlDock } from './hud/ControlDock'
import { DialogueBox } from './hud/DialogueBox'
import type { HudActions, HudState } from './hud/model'
import { RotomScreenUI } from './screen/RotomScreenUI'

interface PhoneRotomProps {
  state: HudState
  actions: HudActions
  searchRef: RefObject<HTMLInputElement | null>
  /** True while the display shows data instead of the face */
  screenVisible: boolean
  grinning: boolean
  /** Cheer counter, each change makes Rotom hop */
  cheer: number
  /** Lookup counter so repeat successes still jump */
  scanCount: number
  reducedMotion: boolean
  queryClient: QueryClient
}

const SCREEN_TOP = ROTOM.screen.y + ROTOM.screen.height / 2
/** Hop for a cheer, a find or finishing startup */
const JUMP: Keyframe[] = [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-14px) scale(1.025)', offset: 0.4 }, { transform: 'translateY(0) scale(1)' }]
const JUMP_TIMING: KeyframeAnimationOptions = { duration: 420, easing: 'cubic-bezier(0.3, 0, 0.3, 1)' }

/** Drag distance that counts as a swipe */
const SWIPE_DISTANCE = 26

/** Poké Ball home key */
function PokeBall({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" fill="#ffffff" stroke="#1c1e2e" strokeWidth="2.4" />
      <path d="M1.5 16 A14.5 14.5 0 0 1 30.5 16 Z" fill="#e8332f" stroke="#1c1e2e" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M1.5 16 H30.5" stroke="#1c1e2e" strokeWidth="3.4" />
      <circle cx="16" cy="16" r="4.6" fill="#ffffff" stroke="#1c1e2e" strokeWidth="2.4" />
    </svg>
  )
}

/** Rotom phone form. The phone is the Rotom, eyes on top, same menus and text box.
    Tap to wake, soft keys at the bottom, home key or swipe up opens the controls */
export function PhoneRotom({ state, actions, searchRef, screenVisible, grinning, cheer, scanCount, reducedMotion, queryClient }: PhoneRotomProps) {
  const { emotion, power } = state
  const viewport = useWindowSize()
  // Fills a phone, centered at phone size on bigger screens
  const framed = state.canSwitchForm
  const width = framed ? Math.min(viewport.width - 24, 430, Math.round((viewport.height - 24) * 0.5)) : viewport.width
  const height = framed ? Math.min(viewport.height - 24, 900) : viewport.height

  // One model unit in pixels, eyes span most of the width
  const unit = (width * 1.15) / ROTOM.eyes.width
  const bezel = Math.max(8, Math.round(width * 0.03))
  const overlap = (SCREEN_TOP - (ROTOM.eye.y - ROTOM.eye.radiusY)) * unit
  // Full screen mode grows the forehead to clear the notch
  const notchProbe = useRef<HTMLDivElement>(null)
  const notch = useElementHeight(notchProbe)
  const forehead = Math.round(ROTOM.eye.radiusY * 2 * unit - overlap + 0.09 * unit) + notch
  const domeHeight = (ROTOM.brow.top - SCREEN_TOP) * unit
  const screenWidth = width - bezel * 2

  const frame = useRef<HTMLDivElement>(null)
  const display = useRef<HTMLDivElement>(null)
  const displayHeight = useElementHeight(display)
  // Let the list scroll clear of the text box
  const talk = useRef<HTMLDivElement>(null)
  const talkHeight = useElementHeight(talk)
  const eyes = useRef<HTMLDivElement>(null)
  const eyeImages = useRef<Partial<Record<EyeKey, HTMLImageElement | null>>>({})
  const mouths = useRef<Partial<Record<FaceKey, SVGGElement | null>>>({})

  const awake = power === 'awake'
  const faceShowing = awake && !screenVisible

  // Control sheet

  const [sheetWanted, setSheetWanted] = useState(false)
  const sheetOpen = awake && sheetWanted

  // Controls that start an action also close the sheet
  const sheetActions: HudActions = useMemo(() => {
    const thenClose =
      (act: () => void) =>
      (): void => {
        act()
        setSheetWanted(false)
        searchRef.current?.blur()
      }
    return { ...actions, submit: thenClose(actions.submit), prev: thenClose(actions.prev), next: thenClose(actions.next), random: thenClose(actions.random), openMenu: thenClose(actions.openMenu) }
  }, [actions, searchRef])

  // Turns a vertical drag into up or down
  const drag = useRef<{ id: number; y: number } | null>(null)
  // Hold keeps the drag on small targets after the finger leaves
  const swipe = (up?: () => void, down?: () => void, hold = false) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      drag.current = { id: event.pointerId, y: event.clientY }
      if (hold) event.currentTarget.setPointerCapture(event.pointerId)
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      const start = drag.current
      if (!start || start.id !== event.pointerId) return
      const travelled = event.clientY - start.y
      if (up && travelled < -SWIPE_DISTANCE) {
        drag.current = null
        up()
      } else if (down && travelled > SWIPE_DISTANCE) {
        drag.current = null
        down()
      }
    },
    onPointerUp: () => {
      drag.current = null
    },
    onPointerCancel: () => {
      drag.current = null
    },
  })

  // Expressions

  // Same expression logic as the Rotom Dex
  const live = useRef({ emotion, power, speaking: state.voice.speaking, grinning, cheer })
  useEffect(() => {
    live.current = { emotion, power, speaking: state.voice.speaking, grinning, cheer }
  }, [emotion, power, state.voice.speaking, grinning, cheer])

  useEffect(() => {
    const started = performance.now()
    const seen = { emotion: live.current.emotion, since: 0, cheer: live.current.cheer, cheerUntil: 0 }
    let frame = 0
    const tick = () => {
      const t = (performance.now() - started) / 1000
      const now = live.current
      if (seen.emotion !== now.emotion) {
        seen.emotion = now.emotion
        seen.since = t
      }
      if (seen.cheer !== now.cheer) {
        seen.cheer = now.cheer
        seen.cheerUntil = t + 1.3
      }
      const next = pickExpression({ emotion: now.emotion, power: now.power, speaking: now.speaking, time: t, sinceEmotion: t - seen.since, grinning: now.grinning, cheering: t < seen.cheerUntil })
      for (const key of EYE_KEYS) {
        const image = eyeImages.current[key]
        if (image) image.style.visibility = key === next.eyes ? 'visible' : 'hidden'
      }
      for (const key of FACE_KEYS) {
        const mouth = mouths.current[key]
        if (mouth) mouth.style.visibility = key === next.face ? 'visible' : 'hidden'
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  // Eyes drift to the last touch
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!eyes.current) return
      const box = eyes.current.getBoundingClientRect()
      const x = (event.clientX - (box.left + box.width / 2)) / (window.innerWidth * 0.5)
      const y = (event.clientY - (box.top + box.height / 2)) / (window.innerHeight * 0.6)
      eyes.current.style.translate = `${(Math.max(-1, Math.min(1, x)) * unit * 0.022).toFixed(1)}px ${(Math.max(-1, Math.min(1, y)) * unit * 0.016).toFixed(1)}px`
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
    }
  }, [unit])

  // Body language

  // Never spins. Success jumps, error shakes
  useEffect(() => {
    const body = frame.current
    if (!body || reducedMotion || power !== 'awake') return
    if (emotion === 'SUCCESS') {
      body.animate(JUMP, JUMP_TIMING)
    } else if (emotion === 'ERROR') {
      const frames = Array.from({ length: 17 }, (_, i) => ({ transform: `translateX(${i === 16 ? 0 : (i % 2 ? 1 : -1) * 11 * (1 - i / 18)}px) rotate(${i === 16 ? 0 : i % 2 ? 0.5 : -0.5}deg)` }))
      body.animate(frames, { duration: 1250, easing: 'linear' })
    }
  }, [emotion, scanCount, power, reducedMotion])

  // Hop on cheer or startup
  const hopped = useRef({ cheer, power })
  useEffect(() => {
    const jump = hopped.current.cheer !== cheer || (hopped.current.power === 'waking' && power === 'awake')
    hopped.current = { cheer, power }
    if (!jump || reducedMotion) return
    frame.current?.animate(JUMP, JUMP_TIMING)
  }, [cheer, power, reducedMotion])

  const mood = awake || power === 'waking' ? EMOTION_COLOR[emotion] : '#5b6b74'

  // Face positions in pixels from the dome row corner
  const faceHeight = domeHeight + displayHeight
  const centre = screenWidth / 2
  const headY = domeHeight + (SCREEN_TOP + 0.16) * unit
  const mouthY = domeHeight + (SCREEN_TOP + 0.15) * unit
  const screenBox = { top: forehead, left: bezel, right: bezel }
  const nothingToGoBackTo = state.view === 'face' && emotion === 'IDLE'

  return (
    <main className="phone-rotom" data-power={power} data-emotion={emotion} style={{ '--mood': mood } as CSSProperties}>
      <div ref={notchProbe} className="phone-notch" aria-hidden="true" />
      <div ref={frame} className="phone-frame" style={framed ? { width, height } : undefined}>
        <div className="phone-body" style={{ '--talk': `${talkHeight + 16}px` } as CSSProperties}>
          {/* Forehead tap pokes or wakes Rotom */}
          <button type="button" className="absolute inset-x-0 top-0 border-0 bg-transparent" style={{ height: forehead }} onClick={actions.poke} aria-label={awake ? 'Poke Rotom' : 'Wake Rotom'} />

          {/* Dark dome between the eyes */}
          <div
            className="pointer-events-none absolute"
            style={{ left: '50%', top: forehead - domeHeight, width: ROTOM.brow.halfWidth * 2 * unit, height: domeHeight + 2, translate: '-50% 0', background: FACE_BROW, borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }}
            aria-hidden="true"
          />

          {/* Wake by press only so the browser allows the greeting audio */}
          <div className="phone-screen" style={screenBox}>
            <div ref={display} className="phone-display" onClick={faceShowing ? actions.poke : undefined}>
              <div className="absolute inset-0" style={{ opacity: screenVisible ? 1 : 0, pointerEvents: screenVisible ? 'auto' : 'none', transition: screenVisible ? 'opacity 220ms ease-out' : 'none' }} aria-hidden={!screenVisible}>
                <RotomScreenUI state={state} actions={actions} width={screenWidth} titleBar={{ height: overlap + 12, gap: (ROTOM.eye.x - ROTOM.eye.radiusX) * 2 * unit - 14 }} queryClient={queryClient} />
              </div>
            </div>

            {awake && (
              // Soft keys, swipe up on the bar opens the controls
              <nav className="phone-nav" aria-label="Rotom Phone keys" {...swipe(() => setSheetWanted(true))}>
                <button type="button" className="phone-softkey" onClick={actions.back} disabled={nothingToGoBackTo}>
                  <ChevronLeft size={22} strokeWidth={3.4} />
                  Back
                </button>
                <button type="button" className="phone-home" onClick={() => setSheetWanted((open) => !open)} aria-expanded={sheetOpen} aria-controls="phone-sheet" aria-label="Scan controls" title="Scan controls">
                  <PokeBall className="size-full" />
                </button>
                <button type="button" className="phone-softkey" onClick={actions.openMenu} aria-pressed={state.view === 'menu'}>
                  <LayoutGrid size={20} strokeWidth={3} />
                  Menu
                </button>
              </nav>
            )}
          </div>

          {/* Face rising from the display into the dome */}
          <svg
            className="pointer-events-none absolute"
            style={{ left: bezel, top: forehead - domeHeight, visibility: faceShowing ? 'visible' : 'hidden' }}
            width={screenWidth}
            height={faceHeight}
            viewBox={`0 0 ${screenWidth} ${Math.max(1, faceHeight)}`}
            aria-hidden="true"
          >
            <defs>
              <clipPath id="phone-display-clip">
                <rect x="0" y={domeHeight} width={screenWidth} height={displayHeight} rx="10" />
                <path d={`M${centre - ROTOM.brow.halfWidth * unit} ${domeHeight + 1} A${ROTOM.brow.halfWidth * unit} ${domeHeight} 0 0 1 ${centre + ROTOM.brow.halfWidth * unit} ${domeHeight + 1} Z`} />
              </clipPath>
            </defs>
            <g clipPath="url(#phone-display-clip)">
              {/* Tail */}
              <path d={`M${centre + 0.3 * unit} ${headY + 0.28 * unit} L${screenWidth * 0.96} ${faceHeight + 0.2 * unit}`} stroke={FACE_SKIN} strokeWidth={0.3 * unit} strokeLinecap="round" />
              <ellipse cx={centre} cy={headY} rx={0.66 * unit} ry={0.5 * unit} fill={FACE_SKIN} />
              {FACE_KEYS.map((key) => (
                <g
                  key={key}
                  ref={(node) => {
                    mouths.current[key] = node
                  }}
                  transform={`translate(${centre} ${mouthY}) scale(${unit * 1.12})`}
                  style={{ visibility: key === 'idle' ? 'visible' : 'hidden' }}
                  dangerouslySetInnerHTML={{ __html: key === 'error' ? `${MOUTHS[key]}<g transform="translate(0.5 0.06)">${SWEAT}</g>` : MOUTHS[key] }}
                />
              ))}
            </g>
          </svg>

          {/* Floating text box so the display never moves */}
          <div ref={talk} className="phone-talk" style={{ left: bezel + 8, right: bezel + 8 }}>
            <DialogueBox
              text={state.line}
              voice={state.voice}
              onReplay={awake && (emotion === 'SUCCESS' || emotion === 'ERROR') ? actions.replay : undefined}
              suggestions={emotion === 'ERROR' ? state.suggestions : []}
              onSuggestion={(item) => actions.open({ section: state.activeSection, key: item.key })}
            />
          </div>

          {/* Scan controls sheet */}
          <div className="phone-overlay" style={screenBox}>
            {/* Clear the scrim while searching */}
            <div className="phone-scrim" data-open={sheetOpen} data-clear={state.view === 'search'} onClick={() => setSheetWanted(false)} aria-hidden="true" />
            <div id="phone-sheet" className="phone-sheet" data-open={sheetOpen} role="dialog" aria-label="Scan controls" inert={!sheetOpen}>
              <button type="button" className="phone-grip" onClick={() => setSheetWanted(false)} aria-label="Put the controls away" {...swipe(undefined, () => setSheetWanted(false), true)}>
                <span />
              </button>
              <ControlDock state={state} actions={sheetActions} searchRef={searchRef} bare />
            </div>
          </div>

          {/* Eyes, one image per expression */}
          <div ref={eyes} className="pointer-events-none absolute transition-[translate] duration-200" style={{ left: '50%', top: forehead - (ROTOM.eyes.y + ROTOM.eyes.height / 2 - SCREEN_TOP) * unit, width: ROTOM.eyes.width * unit, height: ROTOM.eyes.height * unit, marginLeft: (-ROTOM.eyes.width * unit) / 2 }} aria-hidden="true">
            {EYE_KEYS.map((key) => (
              <img
                key={key}
                ref={(node) => {
                  eyeImages.current[key] = node
                }}
                src={eyeTextureUrl(key)}
                alt=""
                draggable={false}
                className="absolute inset-0 size-full max-w-none"
                style={{ visibility: key === 'sleep' ? 'visible' : 'hidden' }}
              />
            ))}
          </div>

          {/* Chin with the state and power switch */}
          <footer className="phone-chin" style={{ paddingInline: bezel + 4 }}>
            <StatusLamp emotion={emotion} power={power} />
            <span className="flex items-center gap-2">
              {framed && (
                <button type="button" onClick={actions.switchForm} aria-label="Switch back to the Rotom Dex" title="Rotom Dex form" className="grid size-8 place-items-center rounded-full border-2 border-white/60 bg-black/15 text-white">
                  <TabletSmartphone size={15} strokeWidth={2.8} />
                </button>
              )}
              {/* Power switch */}
              <button
                type="button"
                onClick={() => {
                  setSheetWanted(false)
                  if (awake) actions.sleep()
                  else actions.wake()
                }}
                disabled={power === 'waking'}
                aria-label={awake ? 'Put Rotom to sleep' : 'Power Rotom on'}
                title={awake ? 'Put Rotom to sleep' : 'Power on'}
                className="grid size-8 place-items-center rounded-full border-2 border-white/60 bg-black/15 text-white"
              >
                <Power size={15} strokeWidth={3} />
              </button>
            </span>
          </footer>
        </div>
      </div>
    </main>
  )
}

function StatusLamp({ emotion, power }: { emotion: RotomEmotion; power: HudState['power'] }) {
  const label = power === 'asleep' ? 'ASLEEP' : power === 'waking' ? 'STARTING' : emotion
  const blinking = power === 'waking' || (power === 'awake' && (emotion === 'SCANNING' || emotion === 'ERROR'))
  return (
    <p role="status" className="flex items-center gap-2 text-white">
      <span className={`size-2.5 rounded-full ${blinking ? 'animate-[blink_0.45s_steps(1)_infinite]' : ''}`} style={{ backgroundColor: 'var(--mood)' }} aria-hidden="true" />
      <span className="text-[0.74rem] font-black tracking-[0.12em]">{label}</span>
    </p>
  )
}
