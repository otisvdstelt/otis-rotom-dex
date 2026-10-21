import { useEffect, useMemo, useRef, useState } from 'react'
import type { Databank, IndexItem } from '../../databanks/types'
import { slugify } from '../../lib/pokeapi'
import type { HudState } from '../hud/model'
import { TypeLabel } from './TypeLabel'

/** Rows drawn per batch while scrolling */
const BATCH = 40
/** Distance from the bottom in pixels that loads the next batch */
const LOAD_AHEAD = 600

/** One tappable row */
export function Row({ item, onPick }: { item: IndexItem; onPick: (key: string) => void }) {
  const [imageBroken, setImageBroken] = useState(false)
  return (
    <li>
      <button type="button" onClick={() => onPick(item.key)} className="dex-row">
        {item.image && !imageBroken && <img src={item.image} alt="" loading="lazy" onError={() => setImageBroken(true)} className="pixelated size-[2.3em] shrink-0 object-contain" />}
        {item.number !== undefined && <span className="w-[3.4em] shrink-0 text-[0.84em] font-extrabold tabular-nums text-aqua-ink">{String(item.number).padStart(4, '0')}</span>}
        <span className="min-w-0 flex-1 truncate text-[1.02em] font-extrabold">{item.label}</span>
        {item.type && <TypeLabel type={item.type} />}
        {item.hint && <span className="shrink-0 text-[0.76em] font-bold text-ink-soft">{item.hint}</span>}
      </button>
    </li>
  )
}

interface ScreenListProps {
  databank: Databank
  index: HudState['index']
  /** Search text that filters the list */
  filter: string
  onPick: (key: string) => void
}

/** Databank list filtered by search, drawn in batches as you scroll */
export function ScreenList({ databank, index, filter, onPick }: ScreenListProps) {
  const matches = useMemo(() => {
    const items = index.items ?? []
    const wanted = slugify(filter)
    if (!wanted) return items
    if (/^\d+$/.test(wanted)) return items.filter((item) => item.number !== undefined && String(item.number).startsWith(String(Number(wanted))))
    return items.filter((item) => item.key.includes(wanted) || slugify(item.label).includes(wanted))
  }, [index.items, filter])

  // Rows drawn so far, resets for a new list
  const [drawn, setDrawn] = useState({ list: matches, rows: BATCH })
  if (drawn.list !== matches) setDrawn({ list: matches, rows: BATCH })
  const rows = drawn.list === matches ? drawn.rows : BATCH
  const waiting = Math.max(0, matches.length - rows)

  const end = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (waiting === 0) return
    const scroller = end.current?.closest<HTMLElement>('.dex-scroll')
    if (!scroller) return
    const drawMore = () => {
      if (scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight > LOAD_AHEAD) return
      setDrawn((now) => (now.list === matches ? { list: matches, rows: now.rows + BATCH } : now))
    }
    // Run once now in case the screen is not full, then on every scroll
    const frame = requestAnimationFrame(drawMore)
    scroller.addEventListener('scroll', drawMore, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', drawMore)
    }
  }, [matches, waiting])

  if (index.loading) {
    return (
      <div className="space-y-[0.4em] p-[0.8em]" role="status">
        <p className="flex items-center gap-[0.45em] pb-[0.2em] text-[0.95em] font-extrabold text-aqua-ink">
          <svg viewBox="0 0 18 24" className="h-[1.2em] w-auto animate-[blink_0.5s_steps(1)_infinite]" aria-hidden="true">
            <path d="M8 1 L1 13 H7.5 L4.5 23 L17 9.5 H10 L14.5 1 Z" fill="#ffd83d" stroke="#d99200" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          Fetching the {databank.label} list… bzzt…
        </p>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-[2.3em] animate-pulse rounded-[0.5em] bg-rule" />
        ))}
      </div>
    )
  }

  if (index.failed || !index.items) {
    return (
      <div role="alert" className="space-y-[0.7em] p-[0.9em]">
        <p className="text-[0.98em]">The {databank.label} list did not arrive. You can still type an exact name below and scan it.</p>
        <button type="button" className="dex-chip" onClick={index.retry}>
          Load the list again
        </button>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <p className="p-[0.9em] text-[0.98em]">
        No {databank.singular} in the list matches “{filter.trim()}”. Check the spelling, or clear the search to see them all.
      </p>
    )
  }

  return (
    <>
      <ul>
        {matches.slice(0, rows).map((item) => (
          <Row key={item.key} item={item} onPick={onPick} />
        ))}
      </ul>
      {waiting > 0 && (
        <p ref={end} className="p-[0.8em] text-center text-[0.84em] font-bold text-ink-soft">
          {waiting} more below…
        </p>
      )}
    </>
  )
}
