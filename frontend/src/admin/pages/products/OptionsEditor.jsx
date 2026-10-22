import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { COLORS, MATERIALS, SIZES } from '../../../data/catalog.js'
import { currencySymbol } from '../../../lib/format.js'
import ImageListEditor from '../../components/ImageListEditor.jsx'
import { useConfirm } from '../../components/ConfirmContext.jsx'
import { NumberField, ReorderButtons, TextField, Toggle } from '../../components/ui.jsx'
import { moveItem, removeAt, replaceAt, slugify } from '../../lib/listUtils.js'
import { HEX_PATTERN } from '../../lib/productForm.js'

const CONFIG = {
  size: { field: 'sizes', label: 'Size', plural: 'sizes', library: SIZES },
  color: { field: 'colors', label: 'Colour', plural: 'colours', library: COLORS },
  material: { field: 'materials', label: 'Material', plural: 'materials', library: MATERIALS },
}

/** A new option for this product only, from a preset or a custom name. */
function makeOption(dimension, preset, name, list) {
  const id = preset?.id ?? slugify(name)
  if (dimension === 'size') {
    const last = list[list.length - 1]
    return { id, name: preset?.name ?? name.trim(), dims: preset?.dims ?? '', price: last ? last.price : '', enabled: true }
  }
  if (dimension === 'color') return { id, name: preset?.name ?? name.trim(), hex: preset?.hex ?? '#FFFFFF', enabled: true }
  return { id, name: preset?.name ?? name.trim(), short: preset?.short ?? name.trim(), description: preset?.description ?? '', surcharge: 0, enabled: true }
}

function AddOption({ dimension, list, onAdd }) {
  const config = CONFIG[dimension]
  const [preset, setPreset] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const taken = new Set(list.map((o) => o.id))
  const presets = Object.values(config.library).filter((o) => !taken.has(o.id))

  const add = () => {
    const chosen = preset ? config.library[preset] : null
    if (!chosen && !name.trim()) {
      setError(`Choose a preset or type a new ${config.label.toLowerCase()} name.`)
      return
    }
    const option = makeOption(dimension, chosen, name, list)
    if (!option.id) {
      setError('Use letters or numbers in the name.')
      return
    }
    if (taken.has(option.id)) {
      setError(`This product already has a ${config.label.toLowerCase()} “${option.id}”.`)
      return
    }
    onAdd(option)
    setPreset('')
    setName('')
    setError('')
  }

  return (
    <div className="adm-add-option">
      <label className="adm-field">
        <span className="adm-field__label">Add a preset</span>
        <select
          className="select"
          value={preset}
          onChange={(e) => {
            setPreset(e.target.value)
            setName('')
            setError('')
          }}
        >
          <option value="">— Choose —</option>
          {dimension === 'size' ? (
            <>
              <optgroup label="Bed sizes">
                {presets.filter((o) => o.order < 10).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.dims})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Pillow sizes">
                {presets.filter((o) => o.order >= 10).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.dims})
                  </option>
                ))}
              </optgroup>
            </>
          ) : (
            presets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))
          )}
        </select>
      </label>
      <label className="adm-field">
        <span className="adm-field__label">…or a new {config.label.toLowerCase()}</span>
        <input
          className="input"
          value={name}
          placeholder={dimension === 'color' ? 'e.g. Terracotta' : dimension === 'size' ? 'e.g. California King' : 'e.g. Tencel Blend'}
          onChange={(e) => {
            setName(e.target.value)
            setPreset('')
            setError('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
      </label>
      <button type="button" className="btn btn--sm" onClick={add}>
        <Plus size={14} aria-hidden="true" /> Add {config.label.toLowerCase()}
      </button>
      {error && (
        <span className="adm-field__error" role="alert" style={{ width: '100%' }}>
          {error}
        </span>
      )}
    </div>
  )
}

/**
 * Sizes, colours or materials of ONE product. Options belong to this product only: adding a colour
 * here never adds it to any other product. Disabled options are hidden from customers (their
 * variants and stock settings are kept); removing deletes them.
 */
export default function OptionsEditor({ dimension, draft, onChange, errors, variantCounts }) {
  const config = CONFIG[dimension]
  const list = draft[config.field]
  const confirm = useConfirm()
  const [openImages, setOpenImages] = useState(null)
  const symbol = currencySymbol()

  const setList = (next, extra = {}) => onChange({ ...draft, [config.field]: next, ...extra })
  const update = (i, patch) => setList(replaceAt(list, i, { ...list[i], ...patch }))

  const remove = async (i) => {
    const option = list[i]
    const count = variantCounts?.[option.id] ?? 0
    const ok = await confirm({
      title: `Remove ${config.label.toLowerCase()} “${option.name || option.id}”?`,
      message: `This deletes it from this product${count ? `, together with its ${count} variant${count === 1 ? '' : 's'} and their stock and price settings` : ''}. Customers’ carts holding it will show it as unavailable. To hide it temporarily, switch it off instead.`,
      confirmLabel: `Remove ${config.label.toLowerCase()}`,
      tone: 'danger',
    })
    if (!ok) return
    const extra = {}
    if (dimension === 'color') {
      const colorImages = { ...draft.colorImages }
      delete colorImages[option.id]
      extra.colorImages = colorImages
    }
    extra.unavailable = draft.unavailable.map((rule) => (rule[dimension] === option.id ? null : rule)).filter(Boolean)
    setList(removeAt(list, i), extra)
  }

  return (
    <div className="adm-stack">
      {list.length === 0 && <p className="muted">No {config.plural} yet. Add at least one — a product needs a size, a colour and a material to be purchasable.</p>}
      <ul className="adm-options" role="list">
        {list.map((o, i) => {
          const e = (f) => errors[`${dimension}.${i}.${f}`]
          return (
            <li key={o.id} className={`adm-option ${o.enabled === false ? 'is-disabled' : ''}`}>
              <div className="adm-option__fields">
                <TextField label="Name" value={o.name} onChange={(v) => update(i, { name: v })} error={e('name')} required />
                {dimension === 'size' && (
                  <>
                    <TextField label="Dimensions" value={o.dims} onChange={(v) => update(i, { dims: v })} placeholder="e.g. 220 × 240 cm" />
                    <NumberField label="Base price" prefix={symbol} min="0" step="0.01" value={o.price} onChange={(v) => update(i, { price: v })} error={e('price')} required />
                  </>
                )}
                {dimension === 'material' && (
                  <>
                    <TextField label="Short label" value={o.short} onChange={(v) => update(i, { short: v })} hint="Shown on option buttons" />
                    <NumberField label="Price surcharge" prefix={symbol} step="0.01" value={o.surcharge} onChange={(v) => update(i, { surcharge: v })} error={e('surcharge')} hint="Added to every size price" />
                  </>
                )}
                {dimension === 'color' && (
                  <div className="adm-field">
                    <span className="adm-field__label">Hex colour</span>
                    <span className="adm-swatch-input">
                      <input
                        type="color"
                        aria-label={`Pick ${o.name || 'colour'}`}
                        value={HEX_PATTERN.test(o.hex) && o.hex.length === 7 ? o.hex : '#ffffff'}
                        onChange={(ev) => update(i, { hex: ev.target.value.toUpperCase() })}
                      />
                      <input className="input" value={o.hex} onChange={(ev) => update(i, { hex: ev.target.value })} aria-label={`${o.name || 'Colour'} hex value`} aria-invalid={Boolean(e('hex')) || undefined} maxLength={7} />
                      <span className="adm-swatch" style={{ background: HEX_PATTERN.test(o.hex) ? o.hex : 'transparent' }} title="Live swatch preview" aria-hidden="true" />
                    </span>
                    {e('hex') && <span className="adm-field__error">{e('hex')}</span>}
                  </div>
                )}
                {dimension === 'material' && (
                  <div className="adm-form-grid__full">
                    <TextField label="Description" multiline rows={2} value={o.description} onChange={(v) => update(i, { description: v })} hint="Shown under the material options on the product page" />
                  </div>
                )}
              </div>
              <div className="adm-option__side">
                <Toggle size="sm" checked={o.enabled !== false} onChange={(on) => update(i, { enabled: on })} label={o.enabled !== false ? 'Enabled' : 'Disabled'} />
                <ReorderButtons index={i} count={list.length} label={o.name || o.id} onMove={(from, to) => setList(moveItem(list, from, to))} onRemove={remove} />
                <span className="adm-option__id">
                  id <code className="adm-code">{o.id}</code>
                  {variantCounts && ` · ${variantCounts[o.id] ?? 0} offered`}
                </span>
              </div>
              {dimension === 'color' && (
                <div className="adm-option__images">
                  <button type="button" className="text-btn" aria-expanded={openImages === o.id} onClick={() => setOpenImages(openImages === o.id ? null : o.id)}>
                    {openImages === o.id ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronRight size={13} aria-hidden="true" />} Colour images ({draft.colorImages?.[o.id]?.length ?? 0})
                    {!draft.colorImages?.[o.id]?.length && ' — uses the default gallery'}
                  </button>
                  {openImages === o.id && (
                    <ImageListEditor
                      label={`${o.name} images`}
                      images={draft.colorImages?.[o.id] ?? []}
                      onChange={(imgs) => onChange({ ...draft, colorImages: { ...draft.colorImages, [o.id]: imgs } })}
                      emptyHint="Without colour images, customers see the default gallery when this colour is selected."
                    />
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <AddOption dimension={dimension} list={list} onAdd={(option) => setList([...list, option])} />
      <p className="adm-field__hint">
        New {config.plural} are offered in every combination your restriction rules allow, at the default stock level. Review them under Variants &amp; inventory.
      </p>
    </div>
  )
}
