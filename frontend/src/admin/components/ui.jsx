/**
 * Small reusable Admin building blocks: page header, cards, form fields, toggles, status badges,
 * stat tiles, product thumbnails and reorder controls. Styles live in admin.css (prefix `adm-`).
 */
import { useId } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, CircleAlert, CircleCheck, CircleDashed, CircleMinus, CircleX, Search, Trash2, TriangleAlert } from 'lucide-react'
import Img from '../../components/ui/Img.jsx'

export function PageHeader({ title, description, actions, children }) {
  return (
    <header className="adm-page-head">
      <div className="adm-page-head__text">
        <h1 className="adm-page-title">{title}</h1>
        {description && <p className="adm-page-desc">{description}</p>}
        {children}
      </div>
      {actions && <div className="adm-page-head__actions">{actions}</div>}
    </header>
  )
}

export function Card({ title, description, actions, children, className = '', id, as: Tag = 'section' }) {
  const headingId = useId()
  return (
    <Tag className={`adm-card ${className}`} id={id} aria-labelledby={title ? headingId : undefined}>
      {(title || actions) && (
        <div className="adm-card__head">
          <div>
            {title && (
              <h2 className="adm-card__title" id={headingId}>
                {title}
              </h2>
            )}
            {description && <p className="adm-card__desc">{description}</p>}
          </div>
          {actions && <div className="adm-card__actions">{actions}</div>}
        </div>
      )}
      {children}
    </Tag>
  )
}

/** Demo / local-only notice. */
export function DemoNote({ children, tone = 'info' }) {
  return (
    <p className={`adm-note adm-note--${tone}`} role="note">
      {tone === 'warning' ? <TriangleAlert size={15} aria-hidden="true" /> : <CircleAlert size={15} aria-hidden="true" />}
      <span>{children}</span>
    </p>
  )
}

// ─── Form fields ─────────────────────────────────────────────────────────────

/** Label + control + hint/error, with ids wired for screen readers. `children(id, describedBy)` renders the control. */
export function Field({ label, hint, error, required, children, className = '', labelHidden = false }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined
  return (
    <div className={`adm-field ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={id} className={labelHidden ? 'visually-hidden' : 'adm-field__label'}>
        {label}
        {required && (
          <span className="adm-req" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children(id, describedBy, Boolean(error))}
      {hint && !error && (
        <span className="adm-field__hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="adm-field__error" id={errorId}>
          <CircleAlert size={13} aria-hidden="true" /> {error}
        </span>
      )}
    </div>
  )
}

export function TextField({ label, value, onChange, hint, error, required, multiline = false, rows = 3, className, labelHidden, list, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className} labelHidden={labelHidden}>
      {(id, describedBy, invalid) =>
        multiline ? (
          <textarea
            id={id}
            className="input adm-textarea"
            rows={rows}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            {...rest}
          />
        ) : (
          <input
            id={id}
            className="input"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            list={list}
            {...rest}
          />
        )
      }
    </Field>
  )
}

/**
 * Number input that keeps whatever the user typed (so "12." or "" can be edited) and reports the
 * raw string; parse it on save. `value` may be a number or a string.
 */
export function NumberField({ label, value, onChange, hint, error, required, min, max, step = 'any', className, labelHidden, prefix, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className} labelHidden={labelHidden}>
      {(id, describedBy, invalid) => (
        <span className={`adm-number ${prefix ? 'has-prefix' : ''}`}>
          {prefix && (
            <span className="adm-number__prefix" aria-hidden="true">
              {prefix}
            </span>
          )}
          <input
            id={id}
            className="input"
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            {...rest}
          />
        </span>
      )}
    </Field>
  )
}

export function SelectField({ label, value, onChange, options, hint, error, required, className, labelHidden, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className} labelHidden={labelHidden}>
      {(id, describedBy, invalid) => (
        <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid || undefined} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  )
}

/** Accessible on/off switch. */
export function Toggle({ checked, onChange, label, description, disabled = false, hideLabel = false, size = 'md' }) {
  const id = useId()
  return (
    <div className={`adm-toggle adm-toggle--${size} ${disabled ? 'is-disabled' : ''}`}>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-label={hideLabel ? label : undefined}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        className={`adm-switch ${checked ? 'is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="adm-switch__knob" aria-hidden="true" />
      </button>
      {!hideLabel && (
        <span className="adm-toggle__text">
          <label htmlFor={id} className="adm-toggle__label">
            {label}
          </label>
          {description && (
            <span className="adm-toggle__desc" id={`${id}-desc`}>
              {description}
            </span>
          )}
        </span>
      )}
      {hideLabel && description && (
        <span className="visually-hidden" id={`${id}-desc`}>
          {description}
        </span>
      )}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search', label = 'Search' }) {
  const id = useId()
  return (
    <div className="adm-search" role="search">
      <Search size={15} aria-hidden="true" />
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <input id={id} type="search" className="adm-search__input" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

// ─── Status ──────────────────────────────────────────────────────────────────

const STATUS = {
  active: { label: 'Active', tone: 'good', Icon: CircleCheck },
  draft: { label: 'Draft', tone: 'neutral', Icon: CircleDashed },
  archived: { label: 'Archived', tone: 'muted', Icon: CircleMinus },
  in: { label: 'In stock', tone: 'good', Icon: CircleCheck },
  low: { label: 'Low stock', tone: 'warn', Icon: TriangleAlert },
  out: { label: 'Sold out', tone: 'bad', Icon: CircleX },
  off: { label: 'Not offered', tone: 'muted', Icon: CircleMinus },
  enabled: { label: 'Enabled', tone: 'good', Icon: CircleCheck },
  disabled: { label: 'Disabled', tone: 'muted', Icon: CircleMinus },
  placed: { label: 'Placed', tone: 'info', Icon: CircleDashed },
  processing: { label: 'Processing', tone: 'warn', Icon: CircleDashed },
  shipped: { label: 'Shipped (demo)', tone: 'info', Icon: CircleCheck },
  delivered: { label: 'Delivered (demo)', tone: 'good', Icon: CircleCheck },
  cancelled: { label: 'Cancelled', tone: 'bad', Icon: CircleX },
  sample: { label: 'Sample', tone: 'sample', Icon: CircleDashed },
}

/** Status label with icon + text (never colour alone). */
export function StatusBadge({ status, label }) {
  const s = STATUS[status] ?? { label: status, tone: 'neutral', Icon: CircleDashed }
  const Icon = s.Icon
  return (
    <span className={`adm-status adm-status--${s.tone}`}>
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {label ?? s.label}
    </span>
  )
}

/** KPI tile: label, value (proportional figures) and an optional note / link. */
export function StatTile({ label, value, note, icon: Icon, to, tone }) {
  const body = (
    <>
      <span className="adm-stat__label">
        {Icon && <Icon size={15} strokeWidth={1.6} aria-hidden="true" />}
        {label}
      </span>
      <span className={`adm-stat__value ${tone ? `adm-stat__value--${tone}` : ''}`}>{value}</span>
      {note && <span className="adm-stat__note">{note}</span>}
    </>
  )
  return to ? (
    <Link to={to} className="adm-stat adm-stat--link">
      {body}
    </Link>
  ) : (
    <div className="adm-stat">{body}</div>
  )
}

// ─── Products & lists ────────────────────────────────────────────────────────

/** Product preview: thumbnail, name and a meta line. */
export function ProductThumb({ product, meta, to, size = 44 }) {
  const name = product?.name ?? 'Unknown product'
  return (
    <span className="adm-thumb">
      <Img name={product?.images?.[0]} alt="" ratio="1 / 1" sizes={`${size}px`} className="adm-thumb__img" />
      <span className="adm-thumb__text">
        {to ? (
          <Link to={to} className="adm-thumb__name">
            {name}
          </Link>
        ) : (
          <span className="adm-thumb__name">{name}</span>
        )}
        {meta && <span className="adm-thumb__meta">{meta}</span>}
      </span>
    </span>
  )
}

/** Move up / move down / remove buttons for an item in an ordered list. */
export function ReorderButtons({ index, count, onMove, onRemove, label = 'item', removeLabel }) {
  return (
    <span className="adm-reorder">
      <button type="button" className="adm-icon-btn" onClick={() => onMove(index, index - 1)} disabled={index === 0} aria-label={`Move ${label} up`}>
        <ArrowUp size={14} />
      </button>
      <button type="button" className="adm-icon-btn" onClick={() => onMove(index, index + 1)} disabled={index === count - 1} aria-label={`Move ${label} down`}>
        <ArrowDown size={14} />
      </button>
      {onRemove && (
        <button type="button" className="adm-icon-btn adm-icon-btn--danger" onClick={() => onRemove(index)} aria-label={removeLabel ?? `Remove ${label}`}>
          <Trash2 size={14} />
        </button>
      )}
    </span>
  )
}

/** Inline error summary for a form that failed validation. */
export function ErrorSummary({ errors, title = 'Please fix the following before saving:' }) {
  const list = Object.values(errors ?? {}).filter(Boolean)
  if (!list.length) return null
  return (
    <div className="adm-error-summary" role="alert">
      <p>
        <CircleAlert size={15} aria-hidden="true" /> {title}
      </p>
      <ul>
        {[...new Set(list)].slice(0, 12).map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  )
}
