import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { voiceClip } from '../lib/lines'
import { audio, sfx } from '../lib/sfx'

const MUTED_KEY = 'rotom-dex-muted'
const VOLUME_KEY = 'rotom-dex-volume'

/** Max volume, twice the recorded level */
export const MAX_VOLUME = 2
const clampVolume = (value: number) => Math.min(MAX_VOLUME, Math.max(0, Math.round(value * 20) / 20))

/** Buzz length before the words */
const BUZZ_MS = 230
/** Pause between clips */
const PART_GAP_MS = 90
const BUZZ = /^BZZ+T[!?]*\s*/i

/** How long Rotom mouths a line when muted */
const silentSeconds = (text: string) => Math.min(8, Math.max(1.2, text.length / 17))

export interface RotomVoice {
  muted: boolean
  /** True while talking or mouthing when muted */
  speaking: boolean
  /** Says lines in order, cutting off what was playing. Only recorded lines are spoken */
  say: (...lines: string[]) => void
  stop: () => void
  toggleMuted: () => void
  /** Volume from 0 to MAX VOLUME, 1 is as recorded */
  volume: number
  /** Sets and saves the volume, turning it up unmutes */
  setVolume: (value: number) => void
}

/** Rotom voice from recorded clips only. Looked up entries have no clip and stay in the text box.
    Each call cancels the last, and a leading BZZZT plays as a buzz */
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

  // Refs keep say stable across renders
  const mutedRef = useRef(muted)
  const volumeRef = useRef(volume)
  /** Gain node, lets clips go louder than recorded */
  const gain = useRef<GainNode | null>(null)
  const timers = useRef<number[]>([])
  /** Current run id, older runs are ignored */
  const run = useRef<object | null>(null)
  /** Clip playing now */
  const playing = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    mutedRef.current = muted
  }, [muted])
  useEffect(() => {
    volumeRef.current = volume
    // Apply volume to a playing clip at once
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
      // Stop what is playing
      stop()

      const startsWithBuzz = BUZZ.test(lines[0] ?? '')
      // Keep only recorded lines
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
        // Muted, still mouth the words
        later(() => {
          if (live()) stop()
        }, silentSeconds(clips.map((clip) => clip.words).join(' ')) * 1000)
        return
      }
      if (startsWithBuzz) sfx.buzz(Math.min(1.5, volumeRef.current))

      // Play clips back to back, skip broken ones
      const playFrom = (index: number, delay: number) => {
        if (!live()) return
        const clip = clips[index]
        if (!clip) {
          stop()
          return
        }
        const player = new Audio(clip.url)
        playing.current = player
        // Use the gain if available, else element volume up to 1
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
      // Mouth starts now, words follow the buzz
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
        // Private mode, keep it for this visit
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
      // Turning it up unmutes
      if (next > 0) localStorage.setItem(MUTED_KEY, 'false')
    } catch {
        // Private mode, keep it for this visit
    }
    if (next > 0) setMuted(false)
  }, [])

  // Stop talking on unmount
  useEffect(() => {
    window.addEventListener('pagehide', stop)
    return () => {
      window.removeEventListener('pagehide', stop)
      stop()
    }
  }, [stop])

  return useMemo(() => ({ muted, speaking, say, stop, toggleMuted, volume, setVolume }), [muted, speaking, say, stop, toggleMuted, volume, setVolume])
}
