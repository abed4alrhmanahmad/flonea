import { Check } from 'lucide-react'
import { findVariant, getOptionInfo, isOptionCompatible, optionLabel } from '../../lib/variants.js'

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

/** Light swatches get a dark check mark (relative luminance, so Admin-added colours work too). */
function isLight(hex = '#FFFFFF') {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6
}

function reasonFor(product, state, dimension, selection) {
  if (state === 'soldout') return 'Sold out'
  const others = OTHER_DIMS[dimension].map((d) => optionLabel(product, d, selection[d])).join(' / ')
  return `Not made in ${others}`
}

/**
 * Colour swatches. `product` supplies each colour's name and hex (every product defines its own);
 * pass `selection` too to grey out colours that don't exist with the other selected options.
 */
export function ColorSwatches({ colors, value, onChange, product, selection, size = 'md', label = 'Colour', allowUnavailable = true }) {
  return (
    <div className={`swatches swatches--${size}`} role="radiogroup" aria-label={label}>
      {colors.map((id) => {
        const color = getOptionInfo(product, 'color', id)
        const state = selection ? optionState(product, 'color', id, selection) : 'ok'
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
            aria-label={`${color.name}${state !== 'ok' ? ` — ${reasonFor(product, state, 'color', selection)}` : ''}`}
            title={state !== 'ok' ? `${color.name} — ${reasonFor(product, state, 'color', selection)}` : color.name}
            className={`swatch ${selected ? 'is-selected' : ''} ${state !== 'ok' ? 'is-muted' : ''} ${isLight(color.hex) ? 'swatch--light' : ''}`}
            style={{ '--swatch': color.hex ?? '#FFFFFF' }}
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
        const reason = state !== 'ok' ? reasonFor(product, state, dimension, selection) : null
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
      getLabel={(v) => optionLabel(product, 'size', v)}
      getSub={(v) => getOptionInfo(product, 'size', v)?.dims}
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
      getLabel={(v) => optionLabel(product, 'material', v)}
      lockUnavailable={false}
    />
  )
}

/** Material + colour + size for one product, with explanations for adjusted/unavailable options. */
export function VariantPicker({ product, selection, onSelect, notice }) {
  const material = getOptionInfo(product, 'material', selection.material)
  const size = getOptionInfo(product, 'size', selection.size)
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
          Colour <span className="option-group__value">{optionLabel(product, 'color', selection.color)}</span>
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
            Faded colours aren&apos;t made in {optionLabel(product, 'material', selection.material)} / {size?.name}. Choosing one switches to the closest available option.
          </p>
        )}
      </fieldset>

      <fieldset className="option-group">
        <legend className="option-group__label">
          Size <span className="option-group__value">{size?.name}{size?.dims ? ` · ${size.dims}` : ''}</span>
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
