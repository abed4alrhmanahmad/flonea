import { getAvailability } from '../../lib/variants.js'
import { useSettings } from '../../store/hooks.js'

export default function Availability({ variant }) {
  const { lowStockThreshold } = useSettings().inventory
  const { state, label } = getAvailability(variant, lowStockThreshold)
  return (
    <p className={`availability availability--${state}`} role="status">
      <span className="availability__dot" aria-hidden="true" />
      {label}
    </p>
  )
}
