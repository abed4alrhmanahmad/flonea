import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'

/** Accessible disclosure section. */
export function AccordionItem({ title, children, defaultOpen = false, meta }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div className={`accordion__item ${open ? 'is-open' : ''}`}>
      <h3 className="accordion__heading">
        <button
          type="button"
          className="accordion__trigger"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-trigger`}
          onClick={() => setOpen((o) => !o)}
        >
          <span>{title}</span>
          {meta ? <span className="accordion__meta">{meta}</span> : null}
          <ChevronDown size={16} aria-hidden="true" className="accordion__chevron" />
        </button>
      </h3>
      <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-trigger`} className="accordion__panel" hidden={!open}>
        {children}
      </div>
    </div>
  )
}

export default function Accordion({ children, className = '' }) {
  return <div className={`accordion ${className}`}>{children}</div>
}
