import { useId } from 'react'
import { SORT_OPTIONS } from '../../lib/filters.js'

export default function SortSelect({ value, onChange }) {
  const id = useId()
  return (
    <div className="sort-select">
      <label htmlFor={id}>Sort by</label>
      <select id={id} className="select select--sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {SORT_OPTIONS.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
