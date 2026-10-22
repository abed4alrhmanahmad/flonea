import { Plus } from 'lucide-react'
import { ReorderButtons, Toggle } from './ui.jsx'
import { moveItem, removeAt, replaceAt } from '../lib/listUtils.js'

/**
 * Editor for an ordered list of objects (slides, links, testimonials…): reorder, remove, add and an
 * optional per-item "shown" switch when items have an `enabled` field.
 * `renderItem(item, update, index)` renders the item's fields; `update(patch)` merges a change.
 */
export default function ListEditor({ items, onChange, renderItem, newItem, itemLabel, addLabel = 'Add item', max = 50, min = 0, emptyText = 'Nothing here yet.' }) {
  return (
    <div className="adm-stack" style={{ gap: 'var(--space-3)' }}>
      {items.length === 0 && <p className="muted">{emptyText}</p>}
      <ol className="adm-options" role="list">
        {items.map((item, i) => {
          const label = itemLabel(item, i)
          const update = (patch) => onChange(replaceAt(items, i, { ...item, ...patch }))
          return (
            <li key={item.id ?? i} className={`adm-option ${item.enabled === false ? 'is-disabled' : ''}`} style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
              <div className="adm-inline" style={{ justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 'var(--fs-sm)' }}>
                  {i + 1}. {label}
                </strong>
                <span className="adm-inline">
                  {'enabled' in item && <Toggle size="sm" checked={item.enabled !== false} onChange={(on) => update({ enabled: on })} label={item.enabled !== false ? 'Shown' : 'Hidden'} />}
                  <ReorderButtons index={i} count={items.length} label={label} onMove={(from, to) => onChange(moveItem(items, from, to))} onRemove={items.length > min ? (index) => onChange(removeAt(items, index)) : undefined} />
                </span>
              </div>
              <div className="adm-form-grid">{renderItem(item, update, i)}</div>
            </li>
          )
        })}
      </ol>
      {items.length < max && (
        <div>
          <button type="button" className="btn btn--light btn--sm" onClick={() => onChange([...items, newItem()])}>
            <Plus size={14} aria-hidden="true" /> {addLabel}
          </button>
        </div>
      )}
    </div>
  )
}
