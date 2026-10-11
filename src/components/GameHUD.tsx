import { Maximize2, Minimize2, Power, Smartphone } from 'lucide-react'
import type { RefObject } from 'react'
import { EMOTION_COLOR, EMOTION_LABEL, type RotomEmotion } from '../lib/emotion'
import type { RotomPower } from '../lib/expression'
import { ControlDock } from './hud/ControlDock'
import { DialogueBox } from './hud/DialogueBox'
import type { HudActions, HudState } from './hud/model'

function Wordmark() {
  return <p className="text-[1.15rem] font-black uppercase tracking-[0.04em] text-white [text-shadow:0_2px_0_rgb(8_32_120/0.9)] lg:text-[1.4rem]">Rotom Dex</p>
}

/** Rotom's system state, spelled out: the same four states that drive its body, lights and face. */
function StatusChip({ emotion, power }: { emotion: RotomEmotion; power: RotomPower }) {
  const awake = power === 'awake'
  const label = power === 'asleep' ? 'ASLEEP' : power === 'waking' ? 'STARTING' : emotion
  const blinking = power === 'waking' || (awake && (emotion === 'SCANNING' || emotion === 'ERROR'))
  return (
    <p role="status" className="flex h-10 items-center gap-2 rounded-full border-2 border-white/70 bg-[#0b2478]/75 pl-3 pr-4 text-white backdrop-blur-md">
      <span className={`size-3 rounded-full ${blinking ? 'animate-[blink_0.45s_steps(1)_infinite]' : ''}`} style={{ backgroundColor: power === 'asleep' ? '#8794b8' : EMOTION_COLOR[emotion] }} aria-hidden="true" />
      <span className="text-[0.84rem] font-black tracking-[0.1em]">{label}</span>
      <span className="sr-only">: {power === 'asleep' ? 'Switched off' : power === 'waking' ? 'Starting up' : EMOTION_LABEL[emotion]}</span>
    </p>
  )
}

const HEADER_KEY = 'grid size-10 place-items-center rounded-full border-2 border-white/70 bg-[#0b2478]/75 text-white backdrop-blur-md transition-colors duration-150 hover:bg-volt hover:text-volt-ink'

interface GameHUDProps {
  state: HudState
  actions: HudActions
  /** The band of controls along the bottom; its measured height keeps the camera clear of it. */
  bandRef: RefObject<HTMLDivElement | null>
  searchRef: RefObject<HTMLInputElement | null>
}

/**
 * The overlay around Rotom. All data lives on Rotom's own screen; what sits
 * out here is only what a trainer holds: Rotom's text box and the keys. On a
 * desktop the two sit side by side under Rotom; on a phone they stack, keys
 * lowest, within thumb reach.
 */
export function GameHUD({ state, actions, bandRef, searchRef }: GameHUDProps) {
  const awake = state.power === 'awake'
  const reportReady = awake && (state.emotion === 'SUCCESS' || state.emotion === 'ERROR')
  const close = state.shot === 'close'

  return (
    <div className="pointer-events-none relative z-10 flex h-dvh flex-col justify-between">
      <header className="flex items-center justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:p-5 lg:pt-[max(1.25rem,env(safe-area-inset-top))]">
        <Wordmark />
        <div className="pointer-events-auto flex items-center gap-2">
          <StatusChip emotion={state.emotion} power={state.power} />
          <button type="button" onClick={actions.switchForm} aria-label="Switch to Rotom's phone form" title="Phone form" className={HEADER_KEY}>
            <Smartphone size={18} strokeWidth={2.8} />
          </button>
          {awake && (
            <>
              <button type="button" onClick={actions.toggleShot} aria-label={close ? 'Step back to see all of Rotom' : 'Bring Rotom’s screen up close'} title={close ? 'See all of Rotom' : 'Read the screen up close'} className={HEADER_KEY}>
                {close ? <Minimize2 size={18} strokeWidth={2.8} /> : <Maximize2 size={18} strokeWidth={2.8} />}
              </button>
              <button type="button" onClick={actions.sleep} aria-label="Put Rotom to sleep" title="Put Rotom to sleep" className={HEADER_KEY}>
                <Power size={18} strokeWidth={3} />
              </button>
            </>
          )}
        </div>
      </header>

      <div ref={bandRef} className="pointer-events-auto mx-auto grid w-full max-w-[66rem] grid-cols-1 items-end gap-3 px-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-4 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-5 lg:px-5 lg:pb-5">
        <DialogueBox
          text={state.line}
          voice={state.voice}
          onReplay={reportReady ? actions.replay : undefined}
          suggestions={state.emotion === 'ERROR' ? state.suggestions : []}
          onSuggestion={(item) => actions.open({ section: state.activeSection, key: item.key })}
        />
        <ControlDock state={state} actions={actions} searchRef={searchRef} />
      </div>
    </div>
  )
}
