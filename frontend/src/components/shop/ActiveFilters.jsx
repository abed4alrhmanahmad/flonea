import { X } from 'lucide-react'
import { CATEGORIES, PRICE_RANGES } from '../../data/catalog.js'
import { FILTER_KEYS } from '../../lib/filters.js'
import { formatPriceBucket } from '../../lib/format.js'
import { useCatalog } from '../../store/hooks.js'

export default function ActiveFilters({ filters, query, onRemove, onClearQuery, onClearAll }) {
  const { optionIndex } = useCatalog()
  const labels = {
    category: (id) => CATEGORIES.find((c) => c.id === id)?.name,
    size: (id) => optionIndex.size[id]?.name,
    material: (id) => optionIndex.material[id]?.short || optionIndex.material[id]?.name,
    color: (id) => optionIndex.color[id]?.name,
    price: (id) => {
      const range = PRICE_RANGES.find((r) => r.id === id)
      return range && formatPriceBucket(range)
    },
  }
  const chips = FILTER_KEYS.flatMap((key) => filters[key].map((id) => ({ key, id, label: labels[key](id) ?? id })))
  if (!chips.length && !query) return null
  return (
    <div className="active-filters" aria-label="Active filters">
      {query && (
        <button type="button" className="chip chip--active" onClick={onClearQuery} aria-label={`Clear search “${query}”`}>
          “{query}” <X size={12} aria-hidden="true" />
        </button>
      )}
      {chips.map((c) => (
        <button key={`${c.key}-${c.id}`} type="button" className="chip chip--active" onClick={() => onRemove(c.key, c.id)} aria-label={`Remove filter ${c.label}`}>
          {c.label} <X size={12} aria-hidden="true" />
        </button>
      ))}
      <button type="button" className="text-btn" onClick={onClearAll}>
        Clear all
      </button>
    </div>
  )
}
