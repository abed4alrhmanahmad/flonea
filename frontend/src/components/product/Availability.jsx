import { getAvailability } from '../../lib/variants.js'

export default function Availability({ variant }) {
  const { state, label } = getAvailability(variant)
  return (
    <p className={`availability availability--${state}`} role="status">
      <span className="availability__dot" aria-hidden="true" />
      {label}
    </p>
  )
}
