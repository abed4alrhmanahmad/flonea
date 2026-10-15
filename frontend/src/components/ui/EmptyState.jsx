import { LogoImage } from '../layout/Logo.jsx'

/** Friendly empty / zero-results state. */
export default function EmptyState({ icon: Icon, title, children, actions, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`
  return (
    <div className="empty-state">
      {Icon && (
        <span className="empty-state__icon" aria-hidden="true">
          <Icon size={28} strokeWidth={1.4} />
        </span>
      )}
      <Heading className="empty-state__title">{title}</Heading>
      {children && <div className="empty-state__text">{children}</div>}
      {actions && <div className="empty-state__actions">{actions}</div>}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="logo page-loader__mark" aria-hidden="true">
        <LogoImage alt="" priority />
      </span>
      <span className="visually-hidden">Loading page…</span>
    </div>
  )
}
