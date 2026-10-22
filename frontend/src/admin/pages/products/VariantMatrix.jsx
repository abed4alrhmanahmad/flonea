import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { DIMENSIONS, OPTION_FIELDS, getAvailability, variantSku } from '../../../lib/variants.js'
import { currencySymbol, formatPrice } from '../../../lib/format.js'
import { NumberField, StatusBadge, Toggle } from '../../components/ui.jsx'
import { removeAt, replaceAt } from '../../lib/listUtils.js'

const DIM_LABEL = { material: 'Material', color: 'Colour', size: 'Size' }
const PAGE = 120

/**
 * Variant combinations of one product. Combinations come from its enabled options; restriction
 * rules remove combinations that are never produced, and each remaining combination can be
 * switched off, re-priced or given its own stock level. Nothing here affects other products.
 */
export default function VariantMatrix({ draft, onChange, combos, errors, threshold }) {
  const [filters, setFilters] = useState({ size: '', material: '', color: '', state: 'all' })
  const [bulkStock, setBulkStock] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const symbol = currencySymbol()
  const optionName = (dim, id) => draft[OPTION_FIELDS[dim]].find((o) => o.id === id)?.name || id
  const settings = draft.variantSettings ?? {}

  const setSettings = (key, patch) => {
    const current = { ...(settings[key] ?? {}), ...patch }
    for (const k of Object.keys(current)) if (current[k] === undefined || current[k] === null || current[k] === '') delete current[k]
    const next = { ...settings, [key]: current }
    if (!Object.keys(current).length) delete next[key]
    onChange({ ...draft, variantSettings: next })
  }

  const rows = combos.filter((c) => {
    if (filters.size && c.size !== filters.size) return false
    if (filters.material && c.material !== filters.material) return false
    if (filters.color && c.color !== filters.color) return false
    if (filters.state === 'offered' && !c.offered) return false
    if (filters.state === 'withdrawn' && (c.offered || c.restricted)) return false
    if (filters.state === 'restricted' && !c.restricted) return false
    if (filters.state === 'low' && !(c.offered && c.stock > 0 && c.stock <= threshold)) return false
    if (filters.state === 'out' && !(c.offered && c.stock <= 0)) return false
    return true
  })
  const editable = rows.filter((c) => !c.restricted)

  const bulk = (patchFor) => {
    const next = { ...settings }
    for (const c of editable) {
      const merged = { ...(next[c.key] ?? {}), ...patchFor(c) }
      for (const k of Object.keys(merged)) if (merged[k] === undefined || merged[k] === null || merged[k] === '') delete merged[k]
      if (Object.keys(merged).length) next[c.key] = merged
      else delete next[c.key]
    }
    onChange({ ...draft, variantSettings: next })
  }
  const applyBulkStock = () => {
    const qty = Number(bulkStock)
    if (bulkStock === '' || !Number.isInteger(qty) || qty < 0) return
    bulk(() => ({ stock: qty }))
    setBulkStock('')
  }

  // Restriction rules (combinations that are not produced)
  const rules = draft.unavailable
  const setRules = (next) => onChange({ ...draft, unavailable: next })
  const updateRule = (i, dim, value) => {
    const rule = { ...rules[i], [dim]: value }
    if (!value) delete rule[dim]
    setRules(replaceAt(rules, i, rule))
  }

  const offered = combos.filter((c) => c.offered).length
  const restricted = combos.filter((c) => c.restricted).length

  return (
    <div className="adm-stack">
      <div className="adm-stack" style={{ gap: 'var(--space-2)' }}>
        <h3 className="adm-card__title" style={{ fontSize: 'var(--fs-base)' }}>
          Combinations that are not produced
        </h3>
        <p className="adm-field__hint">
          Each rule removes every matching combination, e.g. Material “Linen” + Colour “Black”. Customers can’t select or buy them. Leave a field on “Any” to match all.
        </p>
        {rules.map((rule, i) => (
          <div key={i} className="adm-rule">
            <span className="muted">Not produced:</span>
            {DIMENSIONS.map((dim) => (
              <label key={dim}>
                <span className="visually-hidden">
                  Rule {i + 1} {DIM_LABEL[dim]}
                </span>
                <select className="select" value={rule[dim] ?? ''} onChange={(e) => updateRule(i, dim, e.target.value)}>
                  <option value="">Any {DIM_LABEL[dim].toLowerCase()}</option>
                  {draft[OPTION_FIELDS[dim]].map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name || o.id}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <button type="button" className="adm-icon-btn adm-icon-btn--danger" onClick={() => setRules(removeAt(rules, i))} aria-label={`Remove rule ${i + 1}`}>
              <Trash2 size={14} />
            </button>
            {errors[`rule.${i}`] && <span className="adm-field__error">{errors[`rule.${i}`]}</span>}
          </div>
        ))}
        <div>
          <button type="button" className="btn btn--light btn--sm" onClick={() => setRules([...rules, {}])}>
            <Plus size={14} aria-hidden="true" /> Add restriction rule
          </button>
        </div>
      </div>

      <div className="adm-form-grid">
        <NumberField
          label="Default stock for new combinations"
          min="0"
          step="1"
          value={draft.defaultStock}
          onChange={(v) => onChange({ ...draft, defaultStock: v })}
          error={errors.defaultStock}
          hint="Used by every combination without its own stock level below."
        />
      </div>

      <div>
        <div className="adm-matrix-tools">
          {DIMENSIONS.map((dim) => (
            <label key={dim} className="adm-filter">
              {DIM_LABEL[dim]}
              <select className="select" value={filters[dim]} onChange={(e) => setFilters({ ...filters, [dim]: e.target.value })}>
                <option value="">All</option>
                {draft[OPTION_FIELDS[dim]]
                  .filter((o) => o.enabled !== false)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name || o.id}
                    </option>
                  ))}
              </select>
            </label>
          ))}
          <label className="adm-filter">
            Show
            <select className="select" value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value })}>
              <option value="all">All combinations</option>
              <option value="offered">Offered</option>
              <option value="withdrawn">Switched off</option>
              <option value="restricted">Not produced (rules)</option>
              <option value="low">Low stock</option>
              <option value="out">Sold out</option>
            </select>
          </label>
          <span className="adm-toolbar__spacer" />
          <span className="adm-matrix-summary" aria-live="polite">
            {offered} offered · {combos.length - offered - restricted} switched off · {restricted} not produced
          </span>
        </div>

        {editable.length > 0 && (
          <div className="adm-matrix-tools">
            <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
              For the {editable.length} combination{editable.length === 1 ? '' : 's'} shown:
            </span>
            <button type="button" className="btn btn--light btn--sm" onClick={() => bulk(() => ({ available: undefined }))}>
              Offer all
            </button>
            <button type="button" className="btn btn--light btn--sm" onClick={() => bulk(() => ({ available: false }))}>
              Switch all off
            </button>
            <span className="adm-inline">
              <label className="visually-hidden" htmlFor="bulk-stock">
                Stock for all shown combinations
              </label>
              <input id="bulk-stock" className="input adm-stock-input" type="number" min="0" step="1" placeholder="Stock" value={bulkStock} onChange={(e) => setBulkStock(e.target.value)} style={{ width: 96 }} />
              <button type="button" className="btn btn--light btn--sm" onClick={applyBulkStock} disabled={bulkStock === '' || !Number.isInteger(Number(bulkStock)) || Number(bulkStock) < 0}>
                Set stock
              </button>
            </span>
          </div>
        )}

        {combos.length === 0 ? (
          <p className="adm-note adm-note--warning">No combinations yet — enable at least one size, one colour and one material above.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <caption className="visually-hidden">Variant combinations</caption>
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Material</th>
                  <th>Colour</th>
                  <th>Offered</th>
                  <th className="num">Price ({symbol})</th>
                  <th className="num">Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, limit).map((c) => {
                  const own = settings[c.key] ?? {}
                  const status = c.restricted ? null : !c.offered ? 'off' : getAvailability({ stock: c.stock }, threshold).state
                  return (
                    <tr key={c.key} className={c.offered ? '' : 'is-muted'}>
                      <td className="nowrap" title={`SKU ${variantSku(draft, c)}`}>
                        {optionName('size', c.size)}
                      </td>
                      <td className="nowrap">{optionName('material', c.material)}</td>
                      <td className="nowrap">
                        <span className="adm-swatch" style={{ background: draft.colors.find((o) => o.id === c.color)?.hex, marginRight: 6 }} aria-hidden="true" />
                        {optionName('color', c.color)}
                      </td>
                      <td>
                        {c.restricted ? (
                          <span className="muted">Rule</span>
                        ) : (
                          <Toggle size="sm" hideLabel label={`Offer ${c.key.replaceAll('|', ' / ')}`} checked={c.offered} onChange={(on) => setSettings(c.key, { available: on ? undefined : false })} />
                        )}
                      </td>
                      <td className="num">
                        <label className="visually-hidden" htmlFor={`price-${c.key}`}>
                          Price override for {c.key.replaceAll('|', ' / ')}
                        </label>
                        <input
                          id={`price-${c.key}`}
                          className="input adm-price-input"
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={c.restricted}
                          placeholder={String(c.basePrice)}
                          value={own.price ?? ''}
                          onChange={(e) => setSettings(c.key, { price: e.target.value })}
                          aria-invalid={Boolean(errors[`variant.${c.key}.price`]) || undefined}
                          title={`Base price ${formatPrice(c.basePrice)} (size + material). Enter a price to override it for this variant only.`}
                        />
                      </td>
                      <td className="num">
                        <label className="visually-hidden" htmlFor={`stock-${c.key}`}>
                          Stock for {c.key.replaceAll('|', ' / ')}
                        </label>
                        <input
                          id={`stock-${c.key}`}
                          className="input adm-stock-input"
                          type="number"
                          min="0"
                          step="1"
                          disabled={c.restricted}
                          placeholder={String(draft.defaultStock)}
                          value={own.stock ?? ''}
                          onChange={(e) => setSettings(c.key, { stock: e.target.value })}
                          aria-invalid={Boolean(errors[`variant.${c.key}.stock`]) || undefined}
                        />
                      </td>
                      <td>{c.restricted ? <StatusBadge status="off" label="Not produced" /> : <StatusBadge status={status} />}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > limit && (
          <button type="button" className="text-btn" onClick={() => setLimit((l) => l + PAGE)}>
            Show more ({rows.length - limit} hidden)
          </button>
        )}
        {rows.length === 0 && combos.length > 0 && <p className="muted">No combinations match these filters.</p>}
        <p className="adm-field__hint">
          Price: leave empty to use the size price plus the material surcharge (shown faded). Stock: leave empty to use the default stock. Stock is never deducted automatically by carts or demo
          orders.
        </p>
      </div>
    </div>
  )
}
