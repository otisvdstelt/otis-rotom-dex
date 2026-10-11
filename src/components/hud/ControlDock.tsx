import { ArrowRight, ChevronLeft, ChevronRight, Dices, LayoutGrid, Power, Search, X } from 'lucide-react'
import type { RefObject } from 'react'
import { DATABANKS } from '../../databanks/registry'
import type { HudActions, HudState } from './model'

interface ControlDockProps {
  state: HudState
  actions: HudActions
  searchRef: RefObject<HTMLInputElement | null>
  /** Leave out the glass tray, for when the keys already sit on a surface of their own. */
  bare?: boolean
}

/**
 * Rotom's controls. Asleep, there is one: the power key. Awake: the menu key,
 * a search field that looks through every databank, and three hardware keys. PREV and NEXT
 * step through the open databank; the dice key picks an entry at random.
 */
export function ControlDock({ state, actions, searchRef, bare = false }: ControlDockProps) {
  const tray = bare ? '' : 'glass p-3'
  const databank = DATABANKS[state.activeSection]
  const scanning = state.emotion === 'SCANNING'
  const hasList = Boolean(state.index.items?.length)

  if (state.power !== 'awake') {
    const starting = state.power === 'waking'
    return (
      <div className={tray}>
        <button type="button" className="key key-volt min-h-[64px]! w-full text-[1.05rem]!" onClick={actions.wake} disabled={starting} aria-busy={starting} title="Switch Rotom on (Enter)">
          <Power size={22} strokeWidth={3.2} className="shrink-0" />
          {starting ? 'Starting up' : 'Power on'}
        </button>
      </div>
    )
  }

  return (
    <div className={tray}>
      <form
        role="search"
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          actions.submit()
        }}
      >
        <button type="button" className="key w-[56px] shrink-0 px-0!" onClick={actions.openMenu} aria-pressed={state.view === 'menu'} aria-label="Databank menu" title="Databank menu">
          <LayoutGrid size={22} strokeWidth={2.8} />
        </button>
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search every databank by name or number</span>
          <Search size={19} strokeWidth={3} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-aqua-ink" aria-hidden="true" />
          <input
            ref={searchRef}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Search anything"
            value={state.input}
            onChange={(event) => actions.setInput(event.target.value)}
            className={`h-[52px] w-full rounded-full border-[3px] border-aqua bg-white pl-11 text-[1.05rem] ${state.input ? 'pr-10' : 'pr-3'} font-extrabold text-ink shadow-[inset_0_3px_0_rgb(37_48_90/0.1)] outline-none transition-shadow duration-150 placeholder:font-bold placeholder:text-ink-soft focus-visible:border-volt-deep focus-visible:shadow-[inset_0_3px_0_rgb(37_48_90/0.1),0_0_0_4px_var(--color-volt)]`}
          />
          {state.input && (
            <button type="button" aria-label="Clear the search" onClick={() => actions.setInput('')} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink-soft hover:bg-pale hover:text-ink">
              <X size={18} strokeWidth={3.2} />
            </button>
          )}
        </label>
        <button type="submit" className="key w-[56px] shrink-0 px-0!" aria-label="Look it up" title="Look it up (Enter)" disabled={!state.input.trim()}>
          <ArrowRight size={22} strokeWidth={3.4} />
        </button>
      </form>

      <div className="mt-3.5 grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] gap-2 sm:gap-2.5">
        <button type="button" className="key px-1! max-sm:gap-0.5! max-sm:text-[0.8rem]!" onClick={actions.prev} disabled={!hasList} title="Previous entry (←)">
          <ChevronLeft size={20} strokeWidth={3.6} className="-ml-1 shrink-0" />
          Prev
        </button>
        <button type="button" className="key key-volt px-1! max-sm:text-[0.82rem]!" onClick={actions.random} disabled={!hasList} aria-busy={scanning} title={`Pick a ${databank.singular} at random (R)`}>
          <Dices size={20} strokeWidth={2.8} className="shrink-0" />
          <span className="truncate">Random</span>
        </button>
        <button type="button" className="key px-1! max-sm:gap-0.5! max-sm:text-[0.8rem]!" onClick={actions.next} disabled={!hasList} title="Next entry (→)">
          Next
          <ChevronRight size={20} strokeWidth={3.6} className="-mr-1 shrink-0" />
        </button>
      </div>
    </div>
  )
}
