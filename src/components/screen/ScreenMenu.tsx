import { useState } from 'react'
import { DATABANK_LIST, PLANNED_DATABANKS } from '../../databanks/registry'
import type { Databank, SectionId } from '../../databanks/types'

/**
 * A databank's icon: its official artwork (one picture, or three gathered in
 * a cluster). If the artwork cannot be fetched, the databank's own drawing
 * stands in.
 */
function TileArt({ databank }: { databank: Databank }) {
  const [broken, setBroken] = useState(false)
  const Drawn = databank.icon
  if (broken || databank.art.length === 0) return <Drawn className="size-[2.8em]" />
  if (databank.art.length === 1) return <img src={databank.art[0]} alt="" onError={() => setBroken(true)} className="size-[3em] object-contain drop-shadow-[0_0.08em_0_rgb(37_48_90/0.25)]" />
  return (
    <span className="relative block size-[3.1em]">
      {databank.art.slice(0, 3).map((src, n) => (
        <img
          key={src}
          src={src}
          alt=""
          onError={() => setBroken(true)}
          className="absolute size-[1.8em] object-contain drop-shadow-[0_0.06em_0_rgb(37_48_90/0.25)]"
          // One on top, two beneath, like a little pile of gems.
          style={[{ left: '0.65em', top: '0.05em' }, { left: '0em', top: '1.2em' }, { left: '1.3em', top: '1.2em' }][n]}
        />
      ))}
    </span>
  )
}

/**
 * Rotom Dex's home menu: one round icon per databank, each showing official
 * artwork of something from the Pokémon world, like the app icons on the games' menu screen, followed by the slots kept for databanks that are
 * not installed yet.
 */
export function ScreenMenu({ onOpen }: { onOpen: (section: SectionId) => void }) {
  return (
    <div className="p-[0.8em]">
      <ul className="grid grid-cols-3 gap-x-[0.4em] gap-y-[0.7em] @xl:grid-cols-5">
        {DATABANK_LIST.map((databank) => {
          return (
            <li key={databank.id}>
              <button
                type="button"
                onClick={() => onOpen(databank.id)}
                title={databank.blurb}
                className="group flex w-full flex-col items-center gap-[0.3em] rounded-[0.8em] border-0 bg-transparent p-[0.3em] focus-visible:bg-volt/60 focus-visible:outline-none"
              >
                <span
                  className="grid size-[4em] place-items-center rounded-full border-[0.2em] shadow-[0_0.2em_0_rgb(37_48_90/0.25)] transition-transform duration-150 group-hover:-translate-y-[0.15em] group-hover:scale-105"
                  style={{ borderColor: databank.hue, backgroundColor: `color-mix(in srgb, ${databank.hue} 24%, #ffffff)` }}
                >
                  <TileArt databank={databank} />
                </span>
                <span className="text-center text-[0.84em] font-black leading-tight text-ink">{databank.label}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <h3 className="dex-heading mt-[1.2em]">Empty slots</h3>
      <ul className="grid grid-cols-1 gap-x-[1em] @xl:grid-cols-2">
        {PLANNED_DATABANKS.map((planned) => {
          const Icon = planned.icon
          return (
            <li key={planned.id} className="flex items-center gap-[0.6em] border-b-[0.08em] border-dashed border-rule py-[0.4em]">
              <span className="grid size-[2em] shrink-0 place-items-center rounded-full border-[0.13em] border-dashed border-ink-soft text-ink-soft">
                <Icon className="size-[1.05em]" strokeWidth={2.4} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.9em] font-extrabold text-ink">{planned.label}</span>
                <span className="block truncate text-[0.76em] font-bold text-ink-soft">{planned.blurb}</span>
              </span>
              <span className="shrink-0 text-[0.7em] font-black uppercase tracking-[0.05em] text-ink-soft">Not installed</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
