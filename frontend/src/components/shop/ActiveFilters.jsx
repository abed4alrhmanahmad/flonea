import { X } from 'lucide-react'
import { CATEGORIES, COLORS, MATERIALS, PRICE_RANGES, SIZES } from '../../data/catalog.js'
import { FILTER_KEYS } from '../../lib/filters.js'

const LABELS = {
  category: (id) => CATEGORIES.find((c) => c.id === id)?.name,
  size: (id) => SIZES[id]?.name,
  material: (id) => MATERIALS[id]?.short,
  color: (id) => COLORS[id]?.name,
  price: (id) => PRICE_RANGES.find((r) => r.id === id)?.label,
}

export default function ActiveFilters({ filters, query, onRemove, onClearQuery, onClearAll }) {
  const chips = FILTER_KEYS.flatMap((key) => filters[key].map((id) => ({ key, id, label: LABELS[key](id) ?? id })))
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
