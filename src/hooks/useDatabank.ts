import { useQueries, useQuery } from '@tanstack/react-query'
import { DATABANK_LIST, DATABANKS } from '../databanks/registry'
import type { DexEntry, IndexItem, SectionId } from '../databanks/types'
import { slugify, type RotomApiError } from '../lib/pokeapi'

export const indexQueryKey = (section: SectionId) => ['databank-index', section] as const

/** Full databank list, fetched once per visit */
export function useDatabankIndex(section: SectionId | null) {
  return useQuery<IndexItem[], RotomApiError>({
    queryKey: section ? indexQueryKey(section) : ['databank-index', 'none'],
    queryFn: ({ signal }) => DATABANKS[section!].loadIndex(signal),
    enabled: section !== null,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

/** One entry from any databank except Pokémon, never retries */
export function useDatabankEntry(section: SectionId | null, key: string | null) {
  return useQuery<DexEntry, RotomApiError>({
    queryKey: ['databank-entry', section, key],
    queryFn: ({ signal }) => DATABANKS[section!].loadEntry(key!, signal),
    enabled: section !== null && Boolean(key),
    retry: false,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  })
}

/** Turns typed text into a lookup key, by number, exact name or prefix */
export function resolveQuery(raw: string, index: IndexItem[] | undefined): string | null {
  const slug = slugify(raw)
  if (!slug) return null

  if (/^\d+$/.test(slug)) {
    const number = Number(slug)
    return index?.find((item) => item.number === number)?.key ?? String(number)
  }
  if (!index) return slug

  const exact = index.find((item) => item.key === slug || slugify(item.label) === slug)
  if (exact) return exact.key
  const beginning = index.find((item) => item.key.startsWith(slug) || slugify(item.label).startsWith(slug))
  return beginning?.key ?? slug
}

/** Closest names to a failed search, for did you mean */
export function nearestMatches(raw: string, index: IndexItem[] | undefined, limit = 3): IndexItem[] {
  const wanted = slugify(raw)
  if (!index || wanted.length < 2 || /^\d+$/.test(wanted)) return []

  const distance = (a: string, b: string): number => {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i)
    for (let i = 1; i <= a.length; i++) {
      let previous = row[0]
      row[0] = i
      for (let j = 1; j <= b.length; j++) {
        const current = row[j]
        row[j] = a[i - 1] === b[j - 1] ? previous : 1 + Math.min(previous, row[j], row[j - 1])
        previous = current
      }
    }
    return row[b.length]
  }

  return index
    .map((item) => ({ item, score: distance(wanted, item.key.slice(0, wanted.length + 2)) }))
    .filter(({ score }) => score <= Math.max(2, Math.floor(wanted.length / 3)))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ item }) => item)
}

/** One cross databank search result */
export interface SearchHit {
  section: SectionId
  item: IndexItem
  /** Row tag, like Pokémon, Berry or Move */
  kind: string
}

/** Searches every databank, exact names first, then prefixes, then contains */
export function searchAll(raw: string, lists: { section: SectionId; items: IndexItem[] | undefined }[], limit: number): { hits: SearchHit[]; more: number } {
  const wanted = slugify(raw)
  if (!wanted) return { hits: [], more: 0 }
  const numeric = /^\d+$/.test(wanted)
  const scored: { hit: SearchHit; score: number; order: number }[] = []

  lists.forEach(({ section, items }, bank) => {
    if (!items || (numeric && section !== 'pokemon')) return
    const kind = DATABANKS[section].singular
    const label = kind.charAt(0).toUpperCase() + kind.slice(1)
    items.forEach((item, position) => {
      let score: number
      if (numeric) {
        const number = String(item.number ?? '')
        score = number === String(Number(wanted)) ? 0 : number.startsWith(String(Number(wanted))) ? 1 : -1
      } else {
        const name = slugify(item.label)
        score =
          item.key === wanted || name === wanted ? 0 : item.key.startsWith(wanted) || name.startsWith(wanted) ? 1 : name.includes(`-${wanted}`) || item.key.includes(`-${wanted}`) ? 2 : name.includes(wanted) || item.key.includes(wanted) ? 3 : -1
      }
      if (score >= 0) scored.push({ hit: { section, item, kind: label }, score, order: bank * 100000 + position })
    })
  })

  scored.sort((a, b) => a.score - b.score || a.order - b.order)
  return { hits: scored.slice(0, limit).map((entry) => entry.hit), more: Math.max(0, scored.length - limit) }
}

const everyList = (results: { data: IndexItem[] | undefined; isPending: boolean }[]) => ({
  lists: DATABANK_LIST.map((databank, n) => ({ section: databank.id, items: results[n]?.data })),
  loading: results.some((result) => result.isPending),
})

/** Every databank list, fetched in the background once Rotom is awake */
export function useEveryIndex(enabled: boolean) {
  return useQueries({
    queries: DATABANK_LIST.map((databank) => ({
      queryKey: indexQueryKey(databank.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => databank.loadIndex(signal),
      enabled,
      staleTime: Infinity,
      gcTime: Infinity,
      retry: 1,
      refetchOnWindowFocus: false,
    })),
    combine: everyList,
  })
}
