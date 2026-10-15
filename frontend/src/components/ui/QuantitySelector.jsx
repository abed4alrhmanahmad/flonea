import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'

/**
 * Stepper with a typed input. Values are clamped to [min, max]; invalid input reverts on blur.
 */
export default function QuantitySelector({ value, onChange, min = 1, max = 10, label = 'Quantity', size = 'md', disabled = false }) {
  const [draft, setDraft] = useState(null)
  const clamp = (n) => Math.min(Math.max(n, min), Math.max(min, max))

  const commit = (raw) => {
    const n = parseInt(raw, 10)
    setDraft(null)
    if (Number.isFinite(n)) onChange(clamp(n))
  }

  return (
    <div className={`qty qty--${size} ${disabled ? 'is-disabled' : ''}`} role="group" aria-label={label}>
      <button type="button" className="qty__btn" onClick={() => onChange(clamp(value - 1))} disabled={disabled || value <= min} aria-label={`Decrease ${label.toLowerCase()}`}>
        <Minus size={14} />
      </button>
      <input
        className="qty__input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={label}
        value={draft ?? value}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 2))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit(e.currentTarget.value)}
      />
      <button type="button" className="qty__btn" onClick={() => onChange(clamp(value + 1))} disabled={disabled || value >= max} aria-label={`Increase ${label.toLowerCase()}`}>
        <Plus size={14} />
      </button>
    </div>
  )
}
