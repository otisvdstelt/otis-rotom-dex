import { RotateCcw, Volume1, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { IndexItem } from '../../databanks/types'
import { useTypewriter } from '../../hooks/useLayout'
import { MAX_VOLUME, type RotomVoice } from '../../hooks/useRotomVoice'

interface DialogueBoxProps {
  /** Current line, a leading BZZZT gets its own lettering */
  text: string
  voice: RotomVoice
  /** Shown only when there is a report to replay */
  onReplay?: () => void
  /** Close matches offered as replies */
  suggestions?: IndexItem[]
  onSuggestion?: (item: IndexItem) => void
}

const BUZZ = /^(BZZ+T[!?]*)\s*/i

/** Text box bolt */
function Bolt({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 18 24" className={className} aria-hidden="true">
      <path d="M8 1 L1 13 H7.5 L4.5 23 L17 9.5 H10 L14.5 1 Z" fill="#ffd83d" stroke="#d99200" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

/** Arrow that hides or shows the box */
function Arrow({ up = false, bobbing }: { up?: boolean; bobbing: boolean }) {
  return (
    <span className={`block text-[#f2a900] ${bobbing ? 'animate-[nudge_0.9s_ease-in-out_infinite]' : ''}`}>
      <svg viewBox="0 0 12 8" className={`h-2.5 w-4 ${up ? 'rotate-180' : ''}`} aria-hidden="true">
        <path d="M1 1 L6 7 L11 1 Z" fill="currentColor" />
      </svg>
    </span>
  )
}

/** Rotom text box. Types out as Rotom speaks, tap to finish, scrolls long lines, hides to a tab */
export function DialogueBox({ text, voice, onReplay, suggestions = [], onSuggestion }: DialogueBoxProps) {
  const { shown, done, skip } = useTypewriter(text)
  const buzz = text.match(BUZZ)?.[1] ?? ''
  const buzzShown = shown.slice(0, buzz.length)
  const restShown = shown.slice(buzz.length)

  // Remember the line it was closed on, so the tab can flag new ones
  const [closedOn, setClosedOn] = useState<string | null>(null)
  const closed = closedOn !== null
  const unheard = closed && closedOn !== text

  // Keep the newest words in view
  const words = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (words.current) words.current.scrollTop = words.current.scrollHeight
  }, [shown, closed])

  // Screen readers get the full line once
  const spoken = (
    <p className="sr-only" role="status" aria-live="polite">
      {text}
    </p>
  )

  if (closed) {
    return (
      <div className="ml-auto w-fit">
        {spoken}
        <button
          type="button"
          onClick={() => setClosedOn(null)}
          aria-expanded={false}
          aria-label={unheard ? 'Open Rotom’s text box: it has said something new' : 'Open Rotom’s text box'}
          title="Open Rotom’s text box"
          className="textbox textbox-tab flex h-11 animate-[pop-in_0.18s_ease-out] items-center gap-2.5 pl-3 pr-3.5"
        >
          <Bolt className="h-5 w-auto" />
          <span className="flex items-center gap-1" data-unheard={unheard} aria-hidden="true">
            {[0, 1, 2].map((n) => (
              <span key={n} className="textbox-dot" style={{ animationDelay: `${n * 0.16}s` }} />
            ))}
          </span>
          <Arrow up bobbing={unheard} />
        </button>
      </div>
    )
  }

  return (
    <div className="textbox animate-[pop-in_0.18s_ease-out] px-4 pb-2.5 pt-3 lg:px-5">
      <Bolt className="absolute -top-4 left-6 h-7 w-auto drop-shadow-[0_2px_0_rgb(4_20_90/0.25)]" />
      {spoken}

      <p
        ref={words}
        aria-hidden="true"
        onClick={skip}
        className={`scrollbar-hidden h-[4.2em] overflow-y-auto overscroll-contain text-[1.02rem] font-bold leading-[1.4] lg:text-[1.1rem] ${done ? '' : 'cursor-pointer'}`}
      >
        {buzzShown && <span className="mr-1.5 font-black tracking-[0.02em] text-rotom">{buzzShown}</span>}
        {restShown}
      </p>

      {done && suggestions.length > 0 && onSuggestion && (
        <div className="mb-1.5 mt-1 flex flex-wrap items-center gap-2">
          <span className="text-[0.86rem] font-extrabold text-ink-soft">Did you mean</span>
          {suggestions.map((item) => (
            <button key={item.key} type="button" className="dex-chip" onClick={() => onSuggestion(item)}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-1.5">
        {onReplay && (
          <button
            type="button"
            onClick={onReplay}
            className="flex h-9 items-center gap-1.5 rounded-full border-2 border-aqua bg-white px-3 text-[0.8rem] font-black uppercase tracking-[0.04em] text-aqua-ink transition-colors duration-150 hover:border-volt-deep hover:bg-volt hover:text-volt-ink"
          >
            <RotateCcw size={15} strokeWidth={3} />
            Say again
          </button>
        )}
        {/* Volume, up to twice the recorded level */}
        <input
          type="range"
          min={0}
          max={MAX_VOLUME}
          step={0.05}
          value={voice.muted ? 0 : voice.volume}
          onChange={(event) => voice.setVolume(Number(event.target.value))}
          aria-label="Rotom's voice volume"
          aria-valuetext={`${Math.round((voice.muted ? 0 : voice.volume) * 100)} percent`}
          title={`Volume ${Math.round((voice.muted ? 0 : voice.volume) * 100)}% (− and + keys)`}
          className="volume w-[4.6rem] shrink"
          style={{ '--fill': `${((voice.muted ? 0 : voice.volume) / MAX_VOLUME) * 100}%` } as CSSProperties}
        />
        <button
          type="button"
          onClick={voice.toggleMuted}
          aria-pressed={!voice.muted}
          aria-label="Rotom's voice"
          title={voice.muted ? 'Voice is off (M)' : 'Voice is on (M)'}
          className={`grid size-9 place-items-center rounded-full border-2 transition-colors duration-150 hover:border-volt-deep hover:bg-volt hover:text-volt-ink ${
            voice.muted ? 'border-ink-soft bg-white text-ink-soft' : 'border-aqua bg-aqua text-white'
          }`}
        >
          {voice.muted || voice.volume === 0 ? <VolumeX size={17} strokeWidth={2.8} /> : voice.volume < 0.6 ? <Volume1 size={17} strokeWidth={2.8} /> : <Volume2 size={17} strokeWidth={2.8} />}
        </button>
        {/* More arrow, bobs when done and hides the box */}
        <button
          type="button"
          onClick={() => setClosedOn(text)}
          aria-expanded
          aria-label="Put Rotom’s text box away"
          title="Put the text box away"
          className="grid size-9 place-items-center rounded-full border-0 bg-transparent transition-colors duration-150 hover:bg-[#ffe9a3]"
        >
          <Arrow bobbing={done} />
        </button>
      </div>
    </div>
  )
}
