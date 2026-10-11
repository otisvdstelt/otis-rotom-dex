import { useState } from 'react'
import { typeIcon } from '../../lib/pokeapi'
import { TYPE_COLORS, TYPE_IDS, TYPE_NEEDS_LIGHT_TEXT, type TypeName } from '../../lib/types'

interface TypeLabelProps {
  type: TypeName
  /** Extra words before the type name, e.g. "Natural Gift". */
  prefix?: string
  onClick?: () => void
}

/**
 * An element type shown with the games' own label artwork. If
 * that image cannot be fetched, a plain tag in the type's game colour stands in.
 */
export function TypeLabel({ type, prefix, onClick }: TypeLabelProps) {
  const [imageBroken, setImageBroken] = useState(false)

  const label = imageBroken ? (
    <span
      className={`inline-flex h-[1.55em] items-center rounded-[0.3em] px-[0.6em] text-[0.82em] font-black uppercase tracking-[0.04em] ${TYPE_NEEDS_LIGHT_TEXT.has(type) ? 'text-white' : 'text-ink'}`}
      style={{ backgroundColor: TYPE_COLORS[type] }}
    >
      {type}
    </span>
  ) : (
    <img src={typeIcon(TYPE_IDS[type])} alt={`${type} type`} onError={() => setImageBroken(true)} className="h-[1.5em] w-auto max-w-none" />
  )

  const content = (
    <>
      {prefix && <span className="dex-label">{prefix}</span>}
      {label}
    </>
  )
  const layout = 'inline-flex items-center gap-[0.35em] rounded-[0.35em]'

  return onClick ? (
    <button type="button" onClick={onClick} title={`Open the ${type} type`} className={`${layout} border-0 bg-transparent p-0 transition-transform duration-100 hover:-translate-y-[0.1em] focus-visible:outline-volt`}>
      {content}
    </button>
  ) : (
    <span className={layout}>{content}</span>
  )
}
