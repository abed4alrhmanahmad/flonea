import { Check } from 'lucide-react'
import Accordion, { AccordionItem } from '../ui/Accordion.jsx'
import { CATEGORIES, PRICE_RANGES } from '../../data/catalog.js'
import { formatPriceBucket } from '../../lib/format.js'
import { useCatalog } from '../../store/hooks.js'

/**
 * Filter controls. `options` lists the values available in the current product set,
 * each with a product count: { category: [[id, n]], size: [...], material, color, price }.
 */
export default function FilterPanel({ filters, options, onToggle }) {
  const { optionIndex } = useCatalog()
  const groups = [
    { key: 'category', title: 'Category', label: (id) => CATEGORIES.find((c) => c.id === id)?.name },
    { key: 'size', title: 'Size', label: (id) => optionIndex.size[id]?.name ?? id, sub: (id) => optionIndex.size[id]?.dims },
    { key: 'material', title: 'Material', label: (id) => optionIndex.material[id]?.short || optionIndex.material[id]?.name || id },
    { key: 'price', title: 'Price Range', label: (id) => formatPriceBucket(PRICE_RANGES.find((r) => r.id === id)) },
  ].filter((g) => options[g.key]?.length > (g.key === 'category' ? 1 : 0))

  const renderChecks = (g) => (
    <ul role="list" className="filter-list">
      {options[g.key].map(([id, count]) => (
        <li key={id}>
          <label className="checkbox">
            <input type="checkbox" checked={filters[g.key].includes(id)} onChange={() => onToggle(g.key, id)} />
            <span>
              {g.label(id)}
              {g.sub && <span className="filter-list__sub"> {g.sub(id)}</span>}
            </span>
            <span className="count">{count}</span>
          </label>
        </li>
      ))}
    </ul>
  )

  return (
    <Accordion className="filters">
      {groups.slice(0, 3).map((g) => (
        <AccordionItem key={g.key} title={g.title} defaultOpen meta={filters[g.key].length ? `${filters[g.key].length}` : null}>
          {renderChecks(g)}
        </AccordionItem>
      ))}
      {options.color?.length > 0 && (
        <AccordionItem title="Colour" defaultOpen meta={filters.color.length ? `${filters.color.length}` : null}>
          <ul role="list" className="filter-colors">
            {options.color.map(([id, count]) => {
              const c = optionIndex.color[id] ?? { name: id, hex: '#FFFFFF' }
              const checked = filters.color.includes(id)
              return (
                <li key={id}>
                  <label className={`filter-color ${checked ? 'is-checked' : ''}`} title={`${c.name} (${count})`}>
                    <input type="checkbox" className="visually-hidden" checked={checked} onChange={() => onToggle('color', id)} />
                    <span className="filter-color__dot" style={{ '--swatch': c.hex }} aria-hidden="true">
                      {checked && <Check size={12} strokeWidth={2.5} />}
                    </span>
                    <span className="filter-color__name">{c.name}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </AccordionItem>
      )}
      {groups.slice(3).map((g) => (
        <AccordionItem key={g.key} title={g.title} defaultOpen meta={filters[g.key].length ? `${filters[g.key].length}` : null}>
          {renderChecks(g)}
        </AccordionItem>
      ))}
    </Accordion>
  )
}
