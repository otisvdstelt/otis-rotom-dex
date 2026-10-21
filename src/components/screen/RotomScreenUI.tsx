import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { DATABANKS } from '../../databanks/registry'
import type { HudActions, HudState } from '../hud/model'
import { ScreenEntry } from './ScreenEntry'
import { ScreenList } from './ScreenList'
import { ScreenMenu } from './ScreenMenu'
import { ScreenBoot, ScreenSleep } from './ScreenPower'
import { ScreenSearch } from './ScreenSearch'

interface RotomScreenUIProps {
  state: HudState
  actions: HudActions
  width: number
  /** Title bar text stays within this clear width between the eyes */
  titleBar: { height: number; gap: number }
  /** Query cache, passed in because the 3D screen has its own React root */
  queryClient: QueryClient
}

/** UI on the Rotom display, menu, list, entry, sleep and startup screens */
export function RotomScreenUI({ state, actions, width, titleBar, queryClient }: RotomScreenUIProps) {
  const databank = state.section ? DATABANKS[state.section] : null
  // Type scales with the display
  const fontSize = Math.max(12.5, Math.min(17, width / 40))

  if (state.power !== 'awake') {
    return (
      <div className="size-full" style={{ fontSize: Math.max(16, width / 17) }}>
        {state.power === 'asleep' ? <ScreenSleep onWake={actions.wake} hint="Tap to power on" /> : <ScreenBoot />}
      </div>
    )
  }

  const title = state.view === 'menu' ? 'Menu' : state.view === 'search' ? 'Search' : (databank?.label.split(' & ')[0] ?? '')
  const backLabel = state.view === 'entry' && databank ? databank.label.split(' & ')[0] : state.view === 'list' ? 'Menu' : 'Close'
  const count = state.index.items?.length
  // Position in the databank, like 25 of 1025
  const place = state.entry && state.index.items ? state.index.items.findIndex((item) => item.key === state.entry?.key) + 1 : 0

  return (
    <QueryClientProvider client={queryClient}>
      <div className="dex-screen @container" style={{ fontSize }}>
        <div className="dex-titlebar" style={{ height: titleBar.height }}>
          <p className="truncate pb-[0.18em] text-center text-[0.9em] font-black uppercase tracking-[0.08em]" style={{ maxWidth: titleBar.gap }}>
            {title}
          </p>
        </div>

        <div className="flex flex-none items-center justify-between gap-[0.6em] border-b-[0.1em] border-rule bg-white/80 px-[0.5em] py-[0.25em]">
          <button
            type="button"
            onClick={actions.back}
            className="flex min-h-[2.2em] items-center gap-[0.15em] rounded-full border-0 bg-transparent pl-[0.2em] pr-[0.7em] text-[0.86em] font-black text-aqua-ink hover:bg-volt focus-visible:bg-volt focus-visible:outline-none"
          >
            <ChevronLeft className="size-[1.2em]" strokeWidth={3.2} />
            {backLabel}
          </button>
          <p className="truncate text-[0.8em] font-extrabold text-ink-soft" aria-live="polite">
            {state.view === 'list' && count ? `${count} ${count === 1 ? 'entry' : 'entries'}` : state.view === 'menu' ? 'Pick a databank' : state.view === 'search' ? (state.search.hits.length ? `${state.search.hits.length + state.search.more} found` : '') : state.view === 'entry' && place > 0 ? `${place} / ${count}` : ''}
          </p>
        </div>

        {/* Keyed so each screen starts scrolled to the top */}
        <div key={`${state.view}:${state.section ?? ''}:${state.entry?.key ?? ''}`} className="dex-scroll">
          {state.view === 'menu' && <ScreenMenu onOpen={actions.openSection} />}
          {state.view === 'search' && <ScreenSearch search={state.search} query={state.input} onPick={actions.open} />}
          {state.view === 'list' && databank && <ScreenList databank={databank} index={state.index} filter={state.input} onPick={(key) => actions.open({ section: state.activeSection, key })} />}
          {state.view === 'entry' && state.entry && <ScreenEntry key={`${state.entry.section}/${state.entry.key}`} entry={state.entry} open={actions.open} muted={state.voice.muted} />}
        </div>
      </div>
    </QueryClientProvider>
  )
}
