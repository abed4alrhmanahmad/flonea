import { Link } from 'react-router-dom'
import { Check, Layers } from 'lucide-react'
import { useSetBuilder } from '../../context/SetBuilderContext.jsx'
import { BUILDER_PATH, SET_ROLES } from '../../data/setBuilder.js'

/** Shown on collection and product pages opened from Build a Set, so the customer knows where they are in the flow. */
export default function SetModeBanner({ role, hint, exitTo }) {
  const { set } = useSetBuilder()
  const step = SET_ROLES.findIndex((r) => r.id === role.id) + 1

  return (
    <aside className="set-banner" aria-label="Building your set">
      <Layers size={20} strokeWidth={1.4} className="set-banner__icon" aria-hidden="true" />
      <div className="set-banner__text">
        <p className="set-banner__eyebrow">
          Building your set · Step {step} of {SET_ROLES.length}: {role.label}
        </p>
        <p>{hint}</p>
        <ul className="set-banner__status" role="list" aria-label="Your set so far">
          {SET_ROLES.map((r, i) => {
            const c = set.components[i]
            return (
              <li key={r.id} className={c ? 'is-done' : ''}>
                {c ? <Check size={13} strokeWidth={2.2} aria-hidden="true" /> : <span className="set-banner__dot" aria-hidden="true" />}
                {r.label}: <span>{c ? c.name : 'not chosen yet'}</span>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="set-banner__actions">
        <Link to={BUILDER_PATH} className="btn btn--outline btn--sm">
          Review your set
        </Link>
        <Link to={exitTo} className="text-btn">
          Shop individually instead
        </Link>
      </div>
    </aside>
  )
}
