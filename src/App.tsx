import { useQueryClient } from '@tanstack/react-query'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GameHUD } from './components/GameHUD'
import type { HudActions, HudState, ScreenView } from './components/hud/model'
import { PhoneRotom } from './components/PhoneRotom'
import { RotomScreenUI } from './components/screen/RotomScreenUI'
import { pokemonToEntry } from './databanks/pokemon'
import { DATABANKS, isSectionId } from './databanks/registry'
import type { EntryLink, IndexItem, SectionId } from './databanks/types'
import { indexQueryKey, nearestMatches, resolveQuery, searchAll, useDatabankEntry, useDatabankIndex, useEveryIndex } from './hooks/useDatabank'
import { useElementHeight, useMediaQuery, useWindowSize } from './hooks/useLayout'
import { useRotomApi } from './hooks/useRotomApi'
import { useRotomVoice } from './hooks/useRotomVoice'
import type { RotomEmotion } from './lib/emotion'
import type { RotomPower } from './lib/expression'
import { computeFraming, screenTitleBar, type Shot } from './lib/framing'
import { errorLine, GREETING, listLine, MENU_LINE, QUIPS, scanOpener } from './lib/lines'
import { titleCase } from './lib/pokeapi'
import { sfx } from './lib/sfx'

// three.js is most of the download; the HUD paints first and Rotom follows.
// A phone never loads it at all: there, the phone itself is Rotom.
const RotomCanvas = lazy(() => import('./components/RotomCanvas'))

/** Rotom always takes at least this long to "compute", even when the answer is already cached. */
const MIN_SCAN_MS = 850
/** How long after a result arrives Rotom shows it: time for the lunge and spin to finish. */
const REVEAL_MS = 950
/** The phone form has no spin to wait out: just its little jump. */
const PHONE_REVEAL_MS = 380
/** How long Rotom takes to start up once it is switched on. */
const WAKE_MS = 1900
/** How long Rotom's face shows between one screen and the next. */
const SWITCH_MS = 460

/** How many results a search across every databank shows at once. */
const SEARCH_LIMIT = 60

/** Keys that scroll Rotom's screen, and by how many screenfuls (infinite: all the way). */
const SCROLL_KEYS: Record<string, number> = { ArrowDown: 0.25, ArrowUp: -0.25, PageDown: 0.9, PageUp: -0.9, End: Infinity, Home: -Infinity }

interface Route {
  section: SectionId | null
  key: string | null
  /** True when the databank menu is open with no databank chosen yet. */
  menu: boolean
}

/** "#/berries/cheri" -> the Cheri Berry entry; "#/menu" -> the databank menu. */
function readRoute(): Route {
  const [section, key] = window.location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent)
  if (section === 'menu') return { section: null, key: null, menu: true }
  if (!section || !isSectionId(section)) return { section: null, key: null, menu: false }
  return { section, key: key || null, menu: true }
}

const routeHash = ({ section, key, menu }: Route): string => (section ? `#/${section}${key ? `/${encodeURIComponent(key)}` : ''}` : menu ? '#/menu' : '#/')

export default function App() {
  const queryClient = useQueryClient()
  const voice = useRotomVoice()
  const { say, stop } = voice
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  // On a phone, Rotom takes its phone form: the whole display is its body.
  // On a bigger screen that form is a choice (or "?form=phone" in the address).
  const narrow = useMediaQuery('(max-width: 639px)')
  const [phoneChosen, setPhoneChosen] = useState(() => new URLSearchParams(window.location.search).get('form') === 'phone')
  const phone = narrow || phoneChosen

  // ---------------------------------------------------------- what is being looked at

  const [route, setRoute] = useState<Route>(readRoute)
  /** Text in the search field. */
  const [input, setInput] = useState('')
  /** How the current lookup was asked for, in the user's own words. */
  const [asked, setAsked] = useState(() => (route.key ? titleCase(route.key) : ''))
  /** Counts lookups, so repeating one still counts as a new event. */
  const [scanCount, setScanCount] = useState(0)
  /** Holds Rotom in its scanning state for a beat after each new request. */
  const [scanHold, setScanHold] = useState(false)
  const scanTimer = useRef(0)

  // ---------------------------------------------------------- power

  // Every visit starts with Rotom asleep. Nothing is looked up until it is switched on.
  const [power, setPower] = useState<RotomPower>('asleep')
  const awake = power === 'awake'
  const wakeTimer = useRef(0)
  /** Counts cheers: each one makes Rotom hop with its eyes squeezed shut. */
  const [cheer, setCheer] = useState(0)
  /** Rotom's answer to being poked, until something else happens. */
  const [quip, setQuip] = useState<string | null>(null)
  /** Holds the big grin for a moment (the greeting). */
  const [grinHold, setGrinHold] = useState(false)
  const grinTimer = useRef(0)

  const { section } = route
  const lookup = awake ? route.key : null
  const activeSection: SectionId = section ?? 'pokemon'

  const beginScanHold = useCallback(() => {
    setScanCount((count) => count + 1)
    setScanHold(true)
    window.clearTimeout(scanTimer.current)
    scanTimer.current = window.setTimeout(() => setScanHold(false), MIN_SCAN_MS)
  }, [])

  const wake = useCallback(() => {
    if (power !== 'asleep') return
    // This tap is also what lets the browser play sound and speech from here on.
    sfx.unlock()
    sfx.powerOn()
    setPower('waking')
    window.clearTimeout(wakeTimer.current)
    wakeTimer.current = window.setTimeout(
      () => {
        setPower('awake')
        if (route.key) {
          // Opened from a link to an entry: go straight to scanning it.
          sfx.scan()
          beginScanHold()
        } else if (route.section || route.menu) {
          setGrinHold(true)
          window.clearTimeout(grinTimer.current)
          grinTimer.current = window.setTimeout(() => setGrinHold(false), 1200)
        } else {
          say(GREETING)
          setGrinHold(true)
          window.clearTimeout(grinTimer.current)
          grinTimer.current = window.setTimeout(() => setGrinHold(false), 2600)
        }
      },
      reducedMotion ? 700 : WAKE_MS,
    )
  }, [power, route.key, route.section, route.menu, beginScanHold, say, reducedMotion])

  const sleep = useCallback(() => {
    window.clearTimeout(wakeTimer.current)
    window.clearTimeout(scanTimer.current)
    window.clearTimeout(grinTimer.current)
    stop()
    sfx.powerOff()
    setScanHold(false)
    setGrinHold(false)
    setQuip(null)
    setPower('asleep')
  }, [stop])

  useEffect(
    () => () => {
      window.clearTimeout(wakeTimer.current)
      window.clearTimeout(scanTimer.current)
      window.clearTimeout(grinTimer.current)
    },
    [],
  )

  // ---------------------------------------------------------- the API hooks

  const index = useDatabankIndex(activeSection)
  // The search field looks through every databank, wherever you are. If one
  // is open, its own matches are listed first.
  const everything = useEveryIndex(awake)
  const searching = awake && input.trim() !== ''
  const search = useMemo(() => {
    if (!searching) return { hits: [], more: 0, loading: everything.loading }
    const lists = section ? [...everything.lists].sort((a, b) => Number(b.section === section) - Number(a.section === section)) : everything.lists
    return { ...searchAll(input, lists, SEARCH_LIMIT), loading: everything.loading }
  }, [searching, input, everything, section])
  // Pokémon go through the dedicated Rotom hook; every other databank through the generic one.
  const pokemonQuery = useRotomApi(activeSection === 'pokemon' ? lookup : null)
  const databankQuery = useDatabankEntry(activeSection === 'pokemon' ? null : activeSection, lookup)

  const pokemonEntry = useMemo(() => (pokemonQuery.data ? pokemonToEntry(pokemonQuery.data) : undefined), [pokemonQuery.data])
  const lookupState =
    activeSection === 'pokemon'
      ? { pending: pokemonQuery.isPending, error: pokemonQuery.error, entry: pokemonEntry }
      : { pending: databankQuery.isPending, error: databankQuery.error, entry: databankQuery.data }

  // ---------------------------------------------------------- Rotom's core system emotion

  // The emotion is the lookup's life cycle, read straight off the hooks:
  //   nothing requested -> IDLE, request in flight -> SCANNING,
  //   data resolved -> SUCCESS, request failed or entry unknown -> ERROR.
  const emotion: RotomEmotion = !lookup ? 'IDLE' : scanHold || lookupState.pending ? 'SCANNING' : lookupState.error ? 'ERROR' : 'SUCCESS'
  const entry = emotion === 'SUCCESS' ? lookupState.entry : undefined

  // ---------------------------------------------------------- what Rotom's screen shows

  // A result goes onto the screen once Rotom has finished its lunge and spin.
  const reportKey = entry ? `${entry.section}/${entry.key}/${scanCount}` : null
  const [revealed, setRevealed] = useState<string | null>(null)
  useEffect(() => {
    if (!reportKey) return
    const timer = window.setTimeout(() => setRevealed(reportKey), reducedMotion ? 150 : phone ? PHONE_REVEAL_MS : REVEAL_MS)
    return () => window.clearTimeout(timer)
  }, [reportKey, reducedMotion, phone])

  // Typing brings the search results up over whatever was showing (except in the middle of a scan).
  const view: ScreenView = !awake ? 'face' : searching && emotion !== 'SCANNING' ? 'search' : entry ? 'entry' : emotion !== 'IDLE' ? 'face' : section ? 'list' : route.menu ? 'menu' : 'face'

  // Rotom's face lives on its screen, so it shows between one screen and the
  // next: each change of menu or list is a short flash of its grin.
  const screenKey = `${view}:${section ?? ''}`
  const [settledScreen, setSettledScreen] = useState(screenKey)
  useEffect(() => {
    if (settledScreen === screenKey) return
    const timer = window.setTimeout(() => setSettledScreen(screenKey), view === 'menu' || view === 'list' ? SWITCH_MS : 0)
    return () => window.clearTimeout(timer)
  }, [screenKey, settledScreen, view])
  const switching = settledScreen !== screenKey && (view === 'menu' || view === 'list')

  // Asleep and starting up, the screen shows its own power screens.
  const screenVisible = !awake ? true : view === 'entry' ? revealed === reportKey : view !== 'face' && !switching
  const grinning = awake && (switching || grinHold)

  // The camera comes in close whenever there is something to read; the user can override it per view.
  const [shotChoice, setShotChoice] = useState<{ view: ScreenView; shot: Shot } | null>(null)
  const shot: Shot = !awake ? 'wide' : shotChoice?.view === view ? shotChoice.shot : view === 'face' ? 'wide' : 'close'

  // ---------------------------------------------------------- actions

  const scan = useCallback(
    (target: SectionId, raw: string) => {
      const items = queryClient.getQueryData<IndexItem[]>(indexQueryKey(target))
      const key = resolveQuery(raw, items)
      if (!key) return
      sfx.unlock()
      sfx.scan()
      setRoute({ section: target, key, menu: true })
      setAsked(items?.find((item) => item.key === key)?.label ?? titleCase(raw.trim()))
      setInput('')
      setQuip(null)
      beginScanHold()
    },
    [queryClient, beginScanHold],
  )

  const show = useCallback(
    (next: Route) => {
    sfx.unlock()
    sfx.tap()
    stop()
    window.clearTimeout(scanTimer.current)
    setScanHold(false)
    setRoute(next)
    setInput('')
    setQuip(null)
    },
    [stop],
  )

  const step = useCallback(
    (delta: number) => {
      const items = index.data
      if (!items?.length) return
      const at = items.findIndex((item) => item.key === (entry?.key ?? lookup) || (entry?.number != null && item.number === entry.number))
      const next = at < 0 ? (delta > 0 ? 0 : items.length - 1) : (at + delta + items.length) % items.length
      scan(activeSection, items[next].key)
    },
    [index.data, entry, lookup, scan, activeSection],
  )

  const poke = useCallback(() => {
    if (power === 'asleep') {
      wake()
      return
    }
    if (power !== 'awake') return
    sfx.unlock()
    sfx.poke()
    setCheer((count) => count + 1)
    // It only stops to chat when it has nothing else on.
    if (emotion === 'IDLE' && view === 'face') {
      const fresh = QUIPS.filter((candidate) => candidate !== quip)
      const line = fresh[Math.floor(Math.random() * fresh.length)]
      setQuip(line)
      say(line)
    }
  }, [power, wake, emotion, view, say, quip])

  const actions: HudActions = useMemo(
    () => ({
      setInput,
      // Take the best match from all the databanks; failing any, ask the open
      // databank (or Pokémon) for that name and let the API have the final say.
      submit: () => {
        const best = search.hits[0]
        if (best) scan(best.section, best.item.key)
        else scan(activeSection, input)
      },
      prev: () => step(-1),
      next: () => step(1),
      random: () => {
        const items = index.data
        if (!items?.length) return
        let pick = items[Math.floor(Math.random() * items.length)]
        if (items.length > 1) while (pick.key === lookup) pick = items[Math.floor(Math.random() * items.length)]
        scan(activeSection, pick.key)
      },
      open: (link: EntryLink) => scan(link.section, link.key),
      openSection: (target: SectionId) => show({ section: target, key: null, menu: true }),
      // The menu key opens the menu, or puts it away again if it is already showing.
      openMenu: () => show({ section: null, key: null, menu: !(route.menu && !section) }),
      back: () => {
        if (searching) setInput('')
        else if (lookup && section) show({ section, key: null, menu: true })
        else if (section) show({ section: null, key: null, menu: true })
        else if (route.menu) show({ section: null, key: null, menu: false })
      },
      replay: () => {
        if (lookup) scan(activeSection, lookup)
      },
      toggleShot: () => setShotChoice({ view, shot: shot === 'close' ? 'wide' : 'close' }),
      wake,
      sleep,
      poke,
      switchForm: () => setPhoneChosen((chosen) => !chosen),
    }),
    [scan, show, step, activeSection, input, index.data, lookup, section, route.menu, view, shot, wake, sleep, poke, search, searching],
  )

  // ---------------------------------------------------------- what Rotom says

  const notFound = emotion === 'ERROR' && lookupState.error?.kind !== 'network'
  // A report comes in parts: Rotom's recorded line, which it says aloud, then
  // (for a result) the entry itself, which only the text box carries.
  const report = useMemo(() => {
    if (emotion === 'SUCCESS' && entry) return [scanOpener(entry.section), entry.speech]
    if (emotion === 'ERROR') return [errorLine(activeSection, notFound ? 'not-found' : 'network')]
    return null
  }, [emotion, entry, activeSection, notFound])

  const line = useMemo(() => {
    if (power === 'asleep') return `Zzz… bzz… zzz… Rotom Dex is fast asleep. ${phone ? 'Tap my screen' : 'Tap it'} to power it on!`
    if (power === 'waking') return 'Bzz… bzzt… BZZT! Starting up-roto…'
    if (emotion === 'SCANNING') return `Scanning for ${asked}… bzz… bzzt…`
    if (report) return report.join(' ')
    if (view === 'list') return listLine(activeSection)
    if (view === 'menu') return MENU_LINE
    if (view === 'search') return 'Searching all my databanks-roto… Pick one on my screen, or press Enter for the best match.'
    return quip ?? GREETING
  }, [power, phone, emotion, report, asked, view, activeSection, quip])

  // The speech engine fires the moment the lookup resolves, in step with the
  // success spin (or the error shake). Starting a new scan cuts it off.
  useEffect(() => {
    if (!report) return
    if (emotion === 'SUCCESS') sfx.success()
    else sfx.error()
    say(...report)
  }, [report, emotion, scanCount, say])
  useEffect(() => {
    if (emotion === 'SCANNING') stop()
  }, [emotion, scanCount, stop])

  // Opening the menu or a databank's list gets a line of its own.
  const browsing = awake && emotion === 'IDLE' ? (view === 'menu' ? 'menu' : view === 'list' ? activeSection : null) : null
  useEffect(() => {
    if (browsing) say(browsing === 'menu' ? MENU_LINE : listLine(browsing))
  }, [browsing, say])

  // ---------------------------------------------------------- address bar and keyboard

  useEffect(() => {
    const hash = routeHash(route)
    if (window.location.hash !== hash && !(hash === '#/' && window.location.hash === '')) window.history.replaceState(null, '', hash)
    document.title = entry ? `${entry.name} · Rotom Dex` : section ? `${DATABANKS[section].label} · Rotom Dex` : 'Rotom Dex'
  }, [route, entry, section])

  useEffect(() => {
    const onHashChange = () => {
      const next = readRoute()
      setRoute((current) => (current.section === next.section && current.key === next.key && current.menu === next.menu ? current : next))
      if (next.key) setAsked(titleCase(next.key))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target as HTMLElement | null
      // The volume slider is an input too, but nobody types in it.
      const onSlider = target instanceof HTMLInputElement && target.type === 'range'
      const typing = (target instanceof HTMLInputElement && !onSlider) || target instanceof HTMLTextAreaElement
      if (!awake) {
        // Asleep, the only thing the keyboard does is switch it on.
        if ((event.key === 'Enter' || event.key === ' ') && !(target instanceof HTMLButtonElement)) {
          event.preventDefault()
          actions.wake()
        }
        return
      }
      if (event.key === 'Escape') {
        if (typing) target.blur()
        else actions.back()
        return
      }
      if (typing) return
      if (event.key.toLowerCase() === 'm') voice.toggleMuted()
      else if (event.key === '+' || event.key === '=') voice.setVolume((voice.muted ? 0 : voice.volume) + 0.1)
      else if (event.key === '-' || event.key === '_') voice.setVolume((voice.muted ? 0 : voice.volume) - 0.1)
      // With the slider in hand, the arrow keys belong to it.
      else if (onSlider) return
      else if (event.key === '/') {
        event.preventDefault()
        searchRef.current?.focus()
      } else if (event.key in SCROLL_KEYS) {
        const scroller = document.querySelector<HTMLElement>('.dex-scroll')
        if (!scroller || !screenVisible) return
        event.preventDefault()
        const pages = SCROLL_KEYS[event.key]
        scroller.scrollBy({ top: Number.isFinite(pages) ? pages * scroller.clientHeight : pages * scroller.scrollHeight, behavior: 'smooth' })
      } else if (event.key === 'ArrowLeft') actions.prev()
      else if (event.key === 'ArrowRight') actions.next()
      else if (event.key.toLowerCase() === 'r') actions.random()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [actions, voice, awake, screenVisible])

  // ---------------------------------------------------------- layout

  // The camera keeps Rotom clear of the header and of the band of controls,
  // whose height depends on the layout.
  const bandRef = useRef<HTMLDivElement>(null)
  const bandHeight = useElementHeight(bandRef)
  const viewport = useWindowSize()
  const framing = useMemo(() => computeFraming(viewport.width, viewport.height, viewport.width >= 1024 ? 76 : 60, bandHeight + 6), [viewport.width, viewport.height, bandHeight])

  const state: HudState = {
    emotion,
    power,
    form: phone ? 'phone' : 'dex',
    canSwitchForm: !narrow,
    view,
    shot,
    section,
    activeSection,
    input,
    asked,
    entry,
    error: emotion === 'ERROR' ? lookupState.error : null,
    suggestions: notFound ? nearestMatches(asked, index.data) : [],
    index: { items: index.data, loading: index.isPending, failed: index.isError, retry: () => void index.refetch() },
    search,
    line,
    voice,
  }

  if (phone) {
    return <PhoneRotom state={state} actions={actions} searchRef={searchRef} screenVisible={screenVisible} grinning={grinning} cheer={cheer} scanCount={scanCount} reducedMotion={reducedMotion} queryClient={queryClient} />
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <div className="fixed inset-0">
        <Suspense fallback={null}>
          <RotomCanvas
            emotion={emotion}
            power={power}
            speaking={voice.speaking}
            grinning={grinning}
            cheer={cheer}
            reducedMotion={reducedMotion}
            shot={shot}
            framing={framing}
            onPoke={actions.poke}
            screen={{
              content: <RotomScreenUI state={state} actions={actions} width={framing.screen.width} titleBar={screenTitleBar(framing.screen.pixelsPerUnit)} queryClient={queryClient} />,
              visible: screenVisible,
              ...framing.screen,
            }}
          />
        </Suspense>
      </div>
      <GameHUD state={state} actions={actions} bandRef={bandRef} searchRef={searchRef} />
    </main>
  )
}
