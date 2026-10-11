import { Power } from 'lucide-react'

/**
 * Rotom's screen while it sleeps: the dull grey-green of the unresponsive
 * Pokédex in the games, a snore drifting up it, and the way to wake it.
 */
export function ScreenSleep({ onWake, hint }: { onWake: () => void; hint: string }) {
  return (
    <button type="button" onClick={onWake} className="dex-off group relative flex size-full flex-col items-center justify-center gap-[0.7em] border-0 text-[#e9f3ee]">
      <span className="absolute right-[16%] top-[30%] font-black" aria-hidden="true">
        {[0, 1, 2].map((n) => (
          <span key={n} className="absolute animate-[snore_3s_ease-in-out_infinite] opacity-0" style={{ animationDelay: `${n * 1}s`, fontSize: `${1.1 + n * 0.45}em`, left: `${n * 0.7}em`, top: `${-n * 1.1}em` }}>
            Z
          </span>
        ))}
      </span>
      <span className="grid size-[3.4em] place-items-center rounded-full border-[0.18em] border-current transition-colors duration-150 group-hover:bg-volt group-hover:text-volt-ink group-focus-visible:bg-volt group-focus-visible:text-volt-ink">
        <Power className="size-[1.7em]" strokeWidth={2.8} />
      </span>
      <span className="text-[0.95em] font-black uppercase tracking-[0.12em]">{hint}</span>
    </button>
  )
}

const BOOT_LINES = ['Rotom entering Pokédex', 'Charging voice box', 'Linking databanks']

/** The start-up screen: static, a short checklist, and a bar filling as Rotom settles in. */
export function ScreenBoot() {
  return (
    <div className="dex-off dex-static flex size-full flex-col items-center justify-center gap-[0.5em] text-[#e9f3ee]" role="status">
      <p className="text-[1.5em] font-black uppercase tracking-[0.14em]">Rotom Dex</p>
      <ul className="text-[0.82em] font-bold">
        {BOOT_LINES.map((line, n) => (
          <li key={line} className="flex animate-[boot-line_0.3s_ease-out_both] items-center justify-between gap-[1.4em]" style={{ animationDelay: `${0.15 + n * 0.42}s` }}>
            <span>{line}…</span>
            <span className="font-black text-volt">OK</span>
          </li>
        ))}
      </ul>
      <div className="mt-[0.3em] h-[0.5em] w-[58%] overflow-hidden rounded-full bg-black/35">
        <div className="h-full origin-left animate-[boot-bar_1.7s_ease-in-out_both] rounded-full bg-volt" />
      </div>
    </div>
  )
}
