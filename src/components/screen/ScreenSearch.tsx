import type { EntryLink } from '../../databanks/types'
import type { HudState } from '../hud/model'
import { Row } from './ScreenList'

interface ScreenSearchProps {
  search: HudState['search']
  query: string
  onPick: (link: EntryLink) => void
}

/** Search results from every databank, each row shows its databank */
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
          // Only Pokémon show a number
          <Row key={`${hit.section}/${hit.item.key}`} item={{ ...hit.item, number: hit.section === 'pokemon' ? hit.item.number : undefined, hint: hit.kind }} onPick={() => onPick({ section: hit.section, key: hit.item.key })} />
        ))}
      </ul>
      {search.more > 0 && <p className="p-[0.8em] text-center text-[0.84em] font-bold text-ink-soft">{search.more} more match. Keep typing to narrow them down.</p>}
    </>
  )
}
