import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react'

/** Live CSS media query result */
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

/** Window size, kept current */
export function useWindowSize(): { width: number; height: number } {
  const width = useSyncExternalStore(onResize, () => window.innerWidth)
  const height = useSyncExternalStore(onResize, () => window.innerHeight)
  return { width, height }
}

/** Element height in pixels, 0 until mounted */
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

/** Reveals text a few characters at a time, skip shows it all */
export function useTypewriter(text: string, charactersPerSecond = 34): { shown: string; done: boolean; skip: () => void } {
  const [progress, setProgress] = useState({ text, count: 0 })
  // Reset during render when the text changes
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
