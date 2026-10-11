import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { voiceClip } from '../lib/lines'
import { audio, sfx } from '../lib/sfx'

const MUTED_KEY = 'rotom-dex-muted'
const VOLUME_KEY = 'rotom-dex-volume'

/** The loudest the voice can be set: twice the level the clips were recorded at. */
export const MAX_VOLUME = 2
const clampVolume = (value: number) => Math.min(MAX_VOLUME, Math.max(0, Math.round(value * 20) / 20))

/** How long the opening buzz plays before the words start. */
const BUZZ_MS = 230
/** The breath between one clip and the next. */
const PART_GAP_MS = 90
const BUZZ = /^BZZ+T[!?]*\s*/i

/** How long Rotom mouths a line when its voice is switched off. */
const silentSeconds = (text: string) => Math.min(8, Math.max(1.2, text.length / 17))

export interface RotomVoice {
  muted: boolean
  /** True while Rotom is talking (or mouthing the words when muted). */
  speaking: boolean
  /**
   * Says one or more lines, one after another. Anything already being said is
   * cut off first. Only lines that have been recorded are spoken; the rest
   * are for the text box alone.
   */
  say: (...lines: string[]) => void
  stop: () => void
  toggleMuted: () => void
  /** How loud the voice is: 0 is silent, 1 is as recorded, up to MAX_VOLUME. */
  volume: number
  /** Sets the volume and remembers it in this browser. Turning it up also switches the voice back on. */
  setVolume: (value: number) => void
}

/**
 * Rotom's voice: recorded clips, and nothing else.
 *
 * Every line Rotom always says the same way has a clip (see lib/lines.ts).
 * The entries it looks up come from PokéAPI by the thousand and have none, so
 * Rotom announces them in its own voice and leaves the reading to the text
 * box; no synthesised voice stands in, because none sounds like Rotom.
 * `say` cancels whatever was playing first, so quick scans never stack up
 * into overlapping chatter, and a leading "BZZZT!" is played as a
 * synthesised buzz rather than spoken.
 */
export function useRotomVoice(): RotomVoice {
  const [speaking, setSpeaking] = useState(false)
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTED_KEY) === 'true'
    } catch {
      return false
    }
  })

  const [volume, setVolumeState] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(VOLUME_KEY) ?? '1')
      return Number.isFinite(saved) ? clampVolume(saved) : 1
    } catch {
      return 1
    }
  })

  // Held in refs so `say` stays the same function across renders.
  const mutedRef = useRef(muted)
  const volumeRef = useRef(volume)
  /** The clips are mixed through this gain, which is what lets them go louder than they were recorded. */
  const gain = useRef<GainNode | null>(null)
  const timers = useRef<number[]>([])
  /** Identifies the run of lines now being said; anything from an older run is ignored. */
  const run = useRef<object | null>(null)
  /** The clip now playing, if any. */
  const playing = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    mutedRef.current = muted
  }, [muted])
  useEffect(() => {
    volumeRef.current = volume
    // A clip already playing follows the control at once.
    if (gain.current) gain.current.gain.value = volume
    else if (playing.current) playing.current.volume = Math.min(1, volume)
  }, [volume])

  const stop = useCallback(() => {
    run.current = null
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
    playing.current?.pause()
    playing.current = null
    setSpeaking(false)
  }, [])

  const say = useCallback(
    (...lines: string[]) => {
      // 1. Cancel whatever is playing so lines never overlap.
      stop()

      const startsWithBuzz = BUZZ.test(lines[0] ?? '')
      // 2. Keep the lines that have a recording; the others are not spoken.
      const clips = lines.flatMap((line) => {
        const url = voiceClip(line)
        return url ? [{ url, words: line.replace(BUZZ, '').trim() }] : []
      })
      if (clips.length === 0) return

      const mine = {}
      run.current = mine
      const live = () => run.current === mine
      const later = (act: () => void, ms: number) => timers.current.push(window.setTimeout(act, ms))
      setSpeaking(true)

      if (mutedRef.current) {
        // No sound, but Rotom still mouths the words for about as long as they take.
        later(() => {
          if (live()) stop()
        }, silentSeconds(clips.map((clip) => clip.words).join(' ')) * 1000)
        return
      }
      if (startsWithBuzz) sfx.buzz(Math.min(1.5, volumeRef.current))

      // 3. Play the clips back to back. One that will not load or play is skipped.
      const playFrom = (index: number, delay: number) => {
        if (!live()) return
        const clip = clips[index]
        if (!clip) {
          stop()
          return
        }
        const player = new Audio(clip.url)
        playing.current = player
        // Through the gain where Web Audio is available; otherwise the element's own volume (which tops out at 1).
        const context = audio()
        try {
          if (!context) throw new Error('no Web Audio')
          gain.current ??= context.createGain()
          gain.current.gain.value = volumeRef.current
          gain.current.connect(context.destination)
          context.createMediaElementSource(player).connect(gain.current)
        } catch {
          player.volume = Math.min(1, volumeRef.current)
        }
        let settled = false
        const next = () => {
          if (settled || !live()) return
          settled = true
          playFrom(index + 1, PART_GAP_MS)
        }
        player.onended = next
        player.onerror = next
        later(() => {
          if (live()) player.play().catch(next)
        }, delay)
      }
      // The mouth starts moving at once, in step with the success spin; the words follow the buzz.
      playFrom(0, startsWithBuzz ? BUZZ_MS : 60)
    },
    [stop],
  )

  const toggleMuted = useCallback(() => {
    setMuted((value) => {
      const next = !value
      try {
        localStorage.setItem(MUTED_KEY, String(next))
      } catch {
        // Private mode: the choice just lasts for this visit.
      }
      return next
    })
    stop()
  }, [stop])

  const setVolume = useCallback((value: number) => {
    const next = clampVolume(value)
    setVolumeState(next)
    try {
      localStorage.setItem(VOLUME_KEY, String(next))
      // Reaching for the volume means wanting to hear it.
      if (next > 0) localStorage.setItem(MUTED_KEY, 'false')
    } catch {
      // Private mode: the choice just lasts for this visit.
    }
    if (next > 0) setMuted(false)
  }, [])

  // Never leave Rotom talking to an empty room.
  useEffect(() => {
    window.addEventListener('pagehide', stop)
    return () => {
      window.removeEventListener('pagehide', stop)
      stop()
    }
  }, [stop])

  return useMemo(() => ({ muted, speaking, say, stop, toggleMuted, volume, setVolume }), [muted, speaking, say, stop, toggleMuted, volume, setVolume])
}
