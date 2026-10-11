import type { EntryLink } from '../../databanks/types'
import type { HudState } from '../hud/model'
import { Row } from './ScreenList'

interface ScreenSearchProps {
  search: HudState['search']
  /** What was typed. */
  query: string
  onPick: (link: EntryLink) => void
}

/**
 * Results from every databank at once, shown while something is typed in the
 * search field. Each row says which databank it comes from.
 */
export function ScreenSearch({ search, query, onPick }: ScreenSearchProps) {
  if (search.hits.length === 0) {
    return (
      <p className="p-[0.9em] text-[0.98em]" role="status">
        {search.loading ? 'Fetching my databanks… bzzt…' : `Nothing in any databank matches “${query.trim()}”. Check the spelling, or press Enter and I will ask for it by that exact name.`}
      </p>
    )
  }

  return (
    <>
      <ul>
        {search.hits.map((hit) => (
          // The number is only shown for Pokémon: other databanks' numbers mean little side by side.
          <Row key={`${hit.section}/${hit.item.key}`} item={{ ...hit.item, number: hit.section === 'pokemon' ? hit.item.number : undefined, hint: hit.kind }} onPick={() => onPick({ section: hit.section, key: hit.item.key })} />
        ))}
      </ul>
      {search.more > 0 && <p className="p-[0.8em] text-center text-[0.84em] font-bold text-ink-soft">{search.more} more match. Keep typing to narrow them down.</p>}
    </>
  )
}
