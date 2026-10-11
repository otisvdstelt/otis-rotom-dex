import { Sparkles, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DATABANKS } from '../../databanks/registry'
import type { DexEntry, EntryChip, EntryGroup, EntryLink, EntryMeters } from '../../databanks/types'
import { useEvolutionFamily } from '../../hooks/useRotomApi'
import { pokemonSprite } from '../../lib/pokeapi'
import { BadgeEmblem } from '../hud/BadgeEmblem'
import { TypeLabel } from './TypeLabel'

type Open = (link: EntryLink) => void

// ------------------------------------------------------------ meters

/** Base-stat tiers, coloured the way the games' summary screens colour them. */
function statColor(value: number): string {
  if (value < 50) return '#f2553f'
  if (value < 80) return '#f59a23'
  if (value < 100) return '#f2c81e'
  if (value < 130) return '#58c13c'
  return '#22b6c9'
}

function Meters({ meters }: { meters: EntryMeters }) {
  // Start empty so the bars sweep up on first show; after that, a new entry
  // slides each bar from its old value to the new one.
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setArmed(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <section aria-label={meters.title}>
      <h3 className="dex-heading">{meters.title}</h3>
      <dl className="space-y-[0.34em]">
        {meters.items.map((meter, index) => {
          const percent = Math.max(0, Math.min(100, (meter.value / meter.max) * 100))
          return (
            <div key={meter.label} className="grid grid-cols-[4.3em_minmax(0,1fr)_auto] items-center gap-[0.6em]">
              <dt className="text-[0.86em] font-extrabold text-ink-soft">{meter.label}</dt>
              <dd>
                <div className="dex-meter" role="meter" aria-label={meter.label} aria-valuemin={0} aria-valuemax={Math.max(meter.max, meter.value)} aria-valuenow={meter.value}>
                  <div
                    className="dex-meter-fill transition-[width,background-color] duration-700 ease-out-expo"
                    style={{
                      width: armed ? `${percent}%` : '0%',
                      backgroundColor: meters.scale === 'stat' ? statColor(meter.value) : 'var(--color-aqua)',
                      transitionDelay: `${index * 45}ms`,
                    }}
                  />
                </div>
              </dd>
              <dd className="min-w-[2.2em] text-right text-[0.98em] font-black tabular-nums" aria-hidden="true">
                {meter.display ?? meter.value}
              </dd>
            </div>
          )
        })}
      </dl>
      {meters.total && (
        <p className="mt-[0.5em] flex items-baseline justify-between border-t-[0.12em] border-rule pt-[0.35em]">
          <span className="text-[0.86em] font-extrabold text-ink-soft">{meters.total.label}</span>
          <span className="text-[1.25em] font-black tabular-nums text-aqua-ink">{meters.total.value}</span>
        </p>
      )}
    </section>
  )
}

// ------------------------------------------------------------ linked groups

function Chip({ chip, open }: { chip: EntryChip; open: Open }) {
  const [imageBroken, setImageBroken] = useState(false)
  const body = (
    <>
      {chip.image && !imageBroken && <img src={chip.image} alt="" loading="lazy" onError={() => setImageBroken(true)} className="pixelated -my-[0.3em] -ml-[0.4em] size-[2em] object-contain" />}
      <span>{chip.label}</span>
      {chip.note && <span className="text-[0.82em] font-extrabold text-ink-soft">{chip.note}</span>}
    </>
  )
  if (!chip.link) return <span className="dex-chip">{body}</span>
  const link = chip.link
  return (
    <button type="button" className="dex-chip" onClick={() => open(link)} title={`Open in ${DATABANKS[link.section].label}`}>
      {body}
    </button>
  )
}

/** A gym badge with its real artwork, or a stand-in gem where the games awarded no badge. */
function Badge({ chip, index }: { chip: EntryChip; index: number }) {
  const [imageBroken, setImageBroken] = useState(false)
  return (
    <li className="flex items-center gap-[0.6em]">
      {chip.image && !imageBroken ? (
        <img src={chip.image} alt="" loading="lazy" onError={() => setImageBroken(true)} className="size-[2.4em] shrink-0 object-contain drop-shadow-[0_0.1em_0_rgb(37_48_90/0.3)]" />
      ) : (
        chip.type && <BadgeEmblem type={chip.type} index={index} />
      )}
      <span className="min-w-0">
        <span className="block truncate text-[0.96em] font-black leading-tight">{chip.label}</span>
        <span className="block truncate text-[0.78em] font-bold leading-tight text-ink-soft">{chip.note}</span>
      </span>
    </li>
  )
}

/** How many more chips each press of "and N more" brings out, so a list of hundreds opens in steps. */
const MORE_STEP = 48

function Group({ group, open }: { group: EntryGroup; open: Open }) {
  // A long group starts with its first few; "and N more" opens the rest.
  const [shown, setShown] = useState(group.first ?? group.chips.length)
  const waiting = Math.max(0, group.chips.length - shown)
  return (
    <section aria-label={group.title}>
      <h3 className="dex-heading">{group.title}</h3>
      {group.chips.length === 0 ? (
        <p className="text-[0.9em] text-ink-soft">{group.empty ?? 'Nothing on record.'}</p>
      ) : group.layout === 'types' ? (
        <div className="flex flex-wrap gap-[0.35em]">
          {group.chips.map((chip) => chip.type && <TypeLabel key={chip.label} type={chip.type} onClick={chip.link ? () => open(chip.link!) : undefined} />)}
        </div>
      ) : group.layout === 'badges' ? (
        <ol className="grid grid-cols-1 gap-x-[1em] gap-y-[0.5em] @xl:grid-cols-2">
          {group.chips.map((chip, index) => (
            <Badge key={`${chip.label}-${index}`} chip={chip} index={index} />
          ))}
        </ol>
      ) : (
        <div className="flex flex-wrap items-center gap-[0.35em]">
          {group.chips.slice(0, shown).map((chip, index) => (
            <Chip key={`${chip.label}-${index}`} chip={chip} open={open} />
          ))}
          {waiting > 0 && (
            <button type="button" className="dex-chip border-dashed! font-extrabold" onClick={() => setShown((now) => now + MORE_STEP)} title={`Show ${Math.min(waiting, MORE_STEP)} more`}>
              and {waiting} more
            </button>
          )}
          {waiting === 0 && group.first !== undefined && group.chips.length > group.first && (
            <button type="button" className="dex-chip border-dashed! font-extrabold" onClick={() => setShown(group.first!)}>
              Show fewer
            </button>
          )}
        </div>
      )}
    </section>
  )
}

// ------------------------------------------------------------ Pokémon extras

function EvolutionFamily({ url, current, open }: { url: string; current: number | null; open: Open }) {
  const family = useEvolutionFamily(url)
  if (family.isError) return null
  // A family of one has nothing to show.
  if (family.data && family.data.length < 2) return null

  return (
    <section aria-label="Evolution family">
      <h3 className="dex-heading">Evolution family</h3>
      {family.isPending ? (
        <div className="h-[4em] w-[12em] animate-pulse rounded-[0.6em] bg-rule/70" />
      ) : (
        <ol className="flex flex-wrap gap-[0.35em]">
          {family.data.map((stage) => {
            const isCurrent = stage.id === current
            return (
              <li key={stage.id}>
                <button
                  type="button"
                  onClick={() => open({ section: 'pokemon', key: stage.slug })}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={`flex w-[4.9em] flex-col items-center rounded-[0.7em] border-[0.14em] pb-[0.25em] transition-colors duration-150 focus-visible:outline-none ${
                    isCurrent ? 'border-volt-deep bg-volt/70' : 'border-rule bg-white hover:border-volt-deep hover:bg-volt/50 focus-visible:border-volt-deep focus-visible:bg-volt/50'
                  }`}
                >
                  <img src={pokemonSprite(stage.id)} alt="" loading="lazy" className="pixelated size-[3.6em]" />
                  <span className="w-full truncate px-[0.2em] text-center text-[0.76em] font-extrabold leading-tight">{stage.name}</span>
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

// ------------------------------------------------------------ the entry

interface ScreenEntryProps {
  entry: DexEntry
  open: Open
  muted: boolean
}

/**
 * One entry from any databank, as Rotom shows it on its screen: picture,
 * number, name and types, then whatever meters, facts and linked groups that
 * kind of entry has. The description is not printed here; it appears
 * in the text box.
 */
export function ScreenEntry({ entry, open, muted }: ScreenEntryProps) {
  const [imageBroken, setImageBroken] = useState(false)
  const showImage = entry.image && !imageBroken
  // Pokémon can be shown in their shiny colours, where that artwork exists.
  const [shiny, setShiny] = useState(false)
  const [shinyMissing, setShinyMissing] = useState(false)
  const shinyShown = shiny && Boolean(entry.shinyImage) && !shinyMissing

  return (
    <article className="animate-[pop-in_0.4s_var(--ease-out-expo)] space-y-[0.9em] p-[0.8em]">
      <header className="flex items-center gap-[0.8em]">
        {showImage && entry.image && (
          <img
            src={shinyShown ? entry.shinyImage! : entry.image.src}
            alt={shinyShown ? `Shiny ${entry.name}` : entry.name}
            onError={() => (shinyShown ? setShinyMissing(true) : setImageBroken(true))}
            className={
              entry.image.kind === 'artwork'
                ? 'size-[6em] shrink-0 object-contain drop-shadow-[0_0.2em_0_rgb(37_48_90/0.18)] @xl:size-[8em]'
                : 'pixelated size-[4.2em] shrink-0 rounded-[0.8em] border-[0.14em] border-rule bg-white object-contain p-[0.4em] @xl:size-[5.4em]'
            }
          />
        )}
        <div className="min-w-0 flex-1">
          {entry.number !== null && (
            <p className="text-[0.9em] font-black tabular-nums text-aqua-ink">
              <span className="sr-only">Number </span>No. {String(entry.number).padStart(4, '0')}
            </p>
          )}
          <h2 className="wrap-break-word text-[1.6em] font-black uppercase leading-[1.02]">{entry.name}</h2>
          {entry.subtitle && <p className="text-[0.86em] font-bold text-ink-soft">{entry.subtitle}</p>}
          {(entry.tags.length > 0 || entry.cry || entry.shinyImage) && (
            <div className="mt-[0.45em] flex flex-wrap items-center gap-[0.35em]">
              {entry.tags.map((tag) =>
                tag.type ? (
                  <TypeLabel key={tag.label} type={tag.type} prefix={tag.label.includes(':') ? tag.label.split(':')[0] : undefined} onClick={tag.link ? () => open(tag.link!) : undefined} />
                ) : (
                  <span key={tag.label} className="inline-flex h-[1.7em] items-center rounded-full bg-aqua px-[0.7em] text-[0.8em] font-black text-white">
                    {tag.label}
                  </span>
                ),
              )}
              {entry.shinyImage && showImage && (
                <button
                  type="button"
                  className="dex-chip min-h-[1.9em]!"
                  aria-pressed={shinyShown}
                  disabled={shinyMissing}
                  title={shinyMissing ? 'No shiny artwork on record' : shinyShown ? 'Show its usual colours' : 'Show its shiny colours'}
                  onClick={() => setShiny((on) => !on)}
                >
                  <Sparkles className="size-[1.05em]" strokeWidth={2.8} />
                  Shiny
                </button>
              )}
              {entry.cry && (
                <button
                  type="button"
                  className="dex-chip min-h-[1.9em]!"
                  disabled={muted}
                  title={muted ? 'Sound is off' : 'Play its cry'}
                  onClick={() => {
                    const cry = new Audio(entry.cry!)
                    cry.volume = 0.18
                    cry.play().catch(() => {})
                  }}
                >
                  <Volume2 className="size-[1.05em]" strokeWidth={2.8} />
                  Cry
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {entry.detail && <p className="rounded-[0.7em] border-[0.12em] border-rule bg-white px-[0.8em] py-[0.5em] text-[0.92em] font-bold">{entry.detail}</p>}

      <div className="grid grid-cols-1 gap-[0.9em] @xl:grid-cols-2 @xl:gap-x-[1.4em]">
        {entry.meters && <Meters meters={entry.meters} />}

        {entry.facts.length > 0 && (
          <section aria-label="Profile" className={entry.meters ? '' : '@xl:col-span-2'}>
            <h3 className="dex-heading">Profile</h3>
            <dl className={`grid grid-cols-2 gap-x-[0.9em] gap-y-[0.4em] ${entry.meters ? '' : '@xl:grid-cols-4'}`}>
              {entry.facts.map((fact) => (
                <div key={fact.label} className={fact.value.length > 26 ? 'col-span-2' : ''}>
                  <dt className="dex-label">{fact.label}</dt>
                  <dd className="text-[0.95em] font-extrabold leading-snug">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      {entry.evolutionChainUrl && <EvolutionFamily url={entry.evolutionChainUrl} current={entry.speciesNumber ?? entry.number} open={open} />}

      {entry.groups.map((group) => (
        <Group key={group.title} group={group} open={open} />
      ))}

      <p className="text-[0.74em] font-bold text-ink-soft">Source: {DATABANKS[entry.section].source}</p>
    </article>
  )
}
