import { Check } from 'lucide-react'
import { COLORS, MATERIALS, SIZES } from '../../data/catalog.js'
import { findVariant, isOptionCompatible } from '../../lib/variants.js'

/**
 * Option selectors. Each option is evaluated against the current selection:
 * - "unavailable": no variant exists with this value + the other selected options
 * - "soldout":     the variant exists but has no stock (sizes only)
 */
function optionState(product, dimension, value, selection) {
  if (!isOptionCompatible(product, dimension, value, selection)) return 'unavailable'
  const v = findVariant(product, { ...selection, [dimension]: value })
  return v && v.stock <= 0 ? 'soldout' : 'ok'
}

const OTHER_DIMS = { material: ['color', 'size'], color: ['material', 'size'], size: ['material', 'color'] }

function reasonFor(state, dimension, selection) {
  if (state === 'soldout') return 'Sold out'
  const others = OTHER_DIMS[dimension]
    .map((d) => (d === 'material' ? MATERIALS[selection[d]]?.short : d === 'color' ? COLORS[selection[d]]?.name : SIZES[selection[d]]?.name))
    .join(' / ')
  return `Not made in ${others}`
}

export function ColorSwatches({ colors, value, onChange, product, selection, size = 'md', label = 'Colour', allowUnavailable = true }) {
  return (
    <div className={`swatches swatches--${size}`} role="radiogroup" aria-label={label}>
      {colors.map((id) => {
        const color = COLORS[id]
        const state = product && selection ? optionState(product, 'color', id, selection) : 'ok'
        const selected = value === id
        // Colours that only clash with the current material/size stay clickable: selecting
        // them switches to the closest valid variant (and explains the change).
        const disabled = state === 'unavailable' && !allowUnavailable
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${color.name}${state !== 'ok' ? ` — ${reasonFor(state, 'color', selection)}` : ''}`}
            title={state !== 'ok' ? `${color.name} — ${reasonFor(state, 'color', selection)}` : color.name}
            className={`swatch ${selected ? 'is-selected' : ''} ${state !== 'ok' ? 'is-muted' : ''}`}
            style={{ '--swatch': color.hex }}
            disabled={disabled}
            onClick={() => onChange(id)}
          >
            <span className="swatch__dot" aria-hidden="true">
              {selected && <Check size={size === 'sm' ? 10 : 13} strokeWidth={2.5} />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Generic pill selector used for sizes and materials. */
function OptionPills({ dimension, values, product, selection, onChange, label, getLabel, getSub, lockUnavailable }) {
  return (
    <div className="pills" role="radiogroup" aria-label={label}>
      {values.map((value) => {
        const state = optionState(product, dimension, value, selection)
        const selected = selection[dimension] === value
        const disabled = !selected && (state === 'soldout' || (lockUnavailable && state === 'unavailable'))
        const reason = state !== 'ok' ? reasonFor(state, dimension, selection) : null
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={disabled || undefined}
            disabled={disabled}
            title={reason ?? undefined}
            className={`pill ${selected ? 'is-selected' : ''} ${state !== 'ok' ? `is-${state}` : ''}`}
            onClick={() => onChange(value)}
          >
            <span className="pill__label">{getLabel(value)}</span>
            {getSub && <span className="pill__sub">{getSub(value)}</span>}
            {reason && <span className="pill__reason">{reason}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function SizeSelector({ product, selection, onChange }) {
  return (
    <OptionPills
      dimension="size"
      values={product.availableSizes}
      product={product}
      selection={selection}
      onChange={onChange}
      label="Size"
      getLabel={(v) => SIZES[v]?.name}
      getSub={(v) => SIZES[v]?.dims}
      lockUnavailable
    />
  )
}

export function MaterialSelector({ product, selection, onChange }) {
  return (
    <OptionPills
      dimension="material"
      values={product.availableMaterials}
      product={product}
      selection={selection}
      onChange={onChange}
      label="Material"
      getLabel={(v) => MATERIALS[v]?.short}
      lockUnavailable={false}
    />
  )
}

/** Material + colour + size for one product, with explanations for adjusted/unavailable options. */
export function VariantPicker({ product, selection, onSelect, notice }) {
  const material = MATERIALS[selection.material]
  return (
    <div className="variant-picker">
      <fieldset className="option-group">
        <legend className="option-group__label">
          Material <span className="option-group__value">{material?.name}</span>
        </legend>
        {product.availableMaterials.length > 1 ? (
          <MaterialSelector product={product} selection={selection} onChange={(v) => onSelect('material', v)} />
        ) : null}
        {material && <p className="option-group__hint">{material.description}</p>}
      </fieldset>

      <fieldset className="option-group">
        <legend className="option-group__label">
          Colour <span className="option-group__value">{COLORS[selection.color]?.name}</span>
        </legend>
        <ColorSwatches
          colors={product.availableColors}
          value={selection.color}
          product={product}
          selection={selection}
          onChange={(v) => onSelect('color', v)}
        />
        {product.availableColors.some((c) => optionState(product, 'color', c, selection) === 'unavailable') && (
          <p className="option-group__hint">
            Faded colours aren&apos;t made in {MATERIALS[selection.material]?.short} / {SIZES[selection.size]?.name}. Choosing one switches to the closest available option.
          </p>
        )}
      </fieldset>

      <fieldset className="option-group">
        <legend className="option-group__label">
          Size <span className="option-group__value">{SIZES[selection.size]?.name} · {SIZES[selection.size]?.dims}</span>
        </legend>
        <SizeSelector product={product} selection={selection} onChange={(v) => onSelect('size', v)} />
      </fieldset>

      {notice && (
        <p className="option-notice" role="status">
          {notice}
        </p>
      )}
    </div>
  )
}
