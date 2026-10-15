import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Modal dialog rendered as a side drawer (`side="left" | "right"`) or centred modal (`side="center"`/"top").
 * Handles Escape, focus trapping, body scroll lock and focus restoration.
 */
export default function Drawer({ open, onClose, title, side = 'right', children, footer, className = '', hideTitle = false, brand = null }) {
  const panelRef = useRef(null)
  const titleId = useId()
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    document.body.classList.add('no-scroll')
    const panel = panelRef.current
    const first = panel?.querySelector('[data-autofocus]') ?? panel?.querySelector(FOCUSABLE)
    first?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
      }
      if (e.key === 'Tab' && panel) {
        const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
        if (!items.length) return
        const firstEl = items[0]
        const lastEl = items[items.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className={`drawer drawer--${side} ${className}`}>
      <div className="drawer__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="drawer__panel" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panelRef}>
        <div className={`drawer__head ${hideTitle ? 'drawer__head--bare' : ''}`}>
          {brand}
          <h2 id={titleId} className={hideTitle || brand ? 'visually-hidden' : 'drawer__title'}>
            {title}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={`Close ${title}`} data-autofocus={brand ? true : undefined}>
            <X size={20} />
          </button>
        </div>
        <div className="drawer__body">{children}</div>
        {footer && <div className="drawer__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
