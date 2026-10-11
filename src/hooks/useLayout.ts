import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react'

/** Live result of a CSS media query. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}

const onResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

/** The window's inner size, kept current as it resizes. */
export function useWindowSize(): { width: number; height: number } {
  const width = useSyncExternalStore(onResize, () => window.innerWidth)
  const height = useSyncExternalStore(onResize, () => window.innerHeight)
  return { width, height }
}

/** An element's rendered height in pixels, kept current as it resizes (0 until it mounts). */
export function useElementHeight(target: RefObject<HTMLElement | null>): number {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const element = target.current
    if (!element) return
    const measure = () => setHeight(Math.round(element.getBoundingClientRect().height))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [target])

  return height
}

/**
 * Reveals `text` a few characters at a time, like speech appearing in a text
 * box. Restarts whenever the text changes; `skip` shows the rest at once.
 */
export function useTypewriter(text: string, charactersPerSecond = 34): { shown: string; done: boolean; skip: () => void } {
  const [progress, setProgress] = useState({ text, count: 0 })
  // A new line starts from nothing (adjusted during render, not in an effect).
  if (progress.text !== text) setProgress({ text, count: 0 })
  const count = progress.text === text ? progress.count : 0

  useEffect(() => {
    if (count >= text.length) return
    const timer = window.setTimeout(
      () => setProgress((p) => (p.text === text ? { text, count: Math.min(text.length, p.count + Math.max(1, Math.round(charactersPerSecond / 30))) } : p)),
      1000 / 30,
    )
    return () => window.clearTimeout(timer)
  }, [count, text, charactersPerSecond])

  return { shown: text.slice(0, count), done: count >= text.length, skip: () => setProgress({ text, count: text.length }) }
}
