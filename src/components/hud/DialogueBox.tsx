import { RotateCcw, Volume1, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, type CSSProperties } from 'react'
import type { IndexItem } from '../../databanks/types'
import { useTypewriter } from '../../hooks/useLayout'
import { MAX_VOLUME, type RotomVoice } from '../../hooks/useRotomVoice'

interface DialogueBoxProps {
  /** Rotom's current line. A leading "BZZZT!" is set in its own lettering. */
  text: string
  voice: RotomVoice
  /** Offered only when there is a report worth hearing again. */
  onReplay?: () => void
  /** Close matches for a failed search, offered as replies. */
  suggestions?: IndexItem[]
  onSuggestion?: (item: IndexItem) => void
}

const BUZZ = /^(BZZ+T[!?]*)\s*/i

/**
 * Rotom's words, in the text box the games use for dialogue. The line types
 * itself out as Rotom speaks; tap the box to show the rest at once. The box
 * keeps one size, as in the games: a long line rolls upward as it is written
 * and can be scrolled back afterwards. A small arrow bobs at the corner when
 * it has finished.
 */
export function DialogueBox({ text, voice, onReplay, suggestions = [], onSuggestion }: DialogueBoxProps) {
  const { shown, done, skip } = useTypewriter(text)
  const buzz = text.match(BUZZ)?.[1] ?? ''
  const buzzShown = shown.slice(0, buzz.length)
  const restShown = shown.slice(buzz.length)

  // Keep the newest words in view while the line is being written.
  const words = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (words.current) words.current.scrollTop = words.current.scrollHeight
  }, [shown])

  return (
    <div className="textbox px-4 pb-2.5 pt-3 lg:px-5">
      {/* The little bolt the games pin to Rotom's text box. */}
      <svg viewBox="0 0 18 24" className="absolute -top-4 left-6 h-7 w-auto drop-shadow-[0_2px_0_rgb(4_20_90/0.25)]" aria-hidden="true">
        <path d="M8 1 L1 13 H7.5 L4.5 23 L17 9.5 H10 L14.5 1 Z" fill="#ffd83d" stroke="#d99200" strokeWidth="2" strokeLinejoin="round" />
      </svg>

      {/* Screen readers get the whole line once, not letter by letter. */}
      <p className="sr-only" role="status" aria-live="polite">
        {text}
      </p>

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
        {/* How loud Rotom talks: up to twice the level its lines were recorded at. */}
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
        {/* The "more" arrow from the games; it only marks that the line is complete. */}
        <span className={`ml-1 text-[#f2a900] ${done ? 'animate-[nudge_0.9s_ease-in-out_infinite]' : 'opacity-0'}`} aria-hidden="true">
          <svg viewBox="0 0 12 8" className="h-2.5 w-4">
            <path d="M1 1 L6 7 L11 1 Z" fill="currentColor" />
          </svg>
        </span>
      </div>
    </div>
  )
}
