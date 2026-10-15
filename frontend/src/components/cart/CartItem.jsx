import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import Img from '../ui/Img.jsx'
import QuantitySelector from '../ui/QuantitySelector.jsx'
import { formatPrice } from '../../lib/format.js'

export default function CartItem({ line, onQuantity, onRemove, compact = false }) {
  return (
    <article className={`cart-item ${compact ? 'cart-item--compact' : ''}`}>
      <Link to={line.href} className="cart-item__media" tabIndex={-1} aria-hidden="true">
        <Img name={line.imageKey} alt="" ratio="1 / 1" sizes="120px" />
        {compact && <span className="cart-item__qty-badge">{line.quantity}</span>}
      </Link>

      <div className="cart-item__info">
        {line.kindLabel && <span className="cart-item__kind">{line.kindLabel}</span>}
        <h3 className="cart-item__name">
          <Link to={line.href}>{line.name}</Link>
        </h3>
        <p className="cart-item__options">{line.options.map((o) => o.value).join(' · ')}</p>
        {line.components && (
          <ul className="cart-item__components" role="list" aria-label="Included items">
            {line.components.map((c) => (
              <li key={c.productId}>
                {c.quantity} × {c.name} <span className="muted">({c.details})</span>
              </li>
            ))}
          </ul>
        )}
        {!compact && (
          <p className="cart-item__unit">
            <span className="price">{formatPrice(line.unitPrice)}</span>
            {line.compareAtUnitPrice && <span className="price price--compare">{formatPrice(line.compareAtUnitPrice)}</span>}
            <span className="muted"> each</span>
          </p>
        )}
        {!compact && line.quantity >= line.maxQuantity && (
          <p className="cart-item__limit">{line.maxQuantity < 10 ? `Only ${line.maxQuantity} available in this option.` : 'Maximum 10 per order line.'}</p>
        )}
      </div>

      {!compact && (
        <div className="cart-item__controls">
          <QuantitySelector value={line.quantity} onChange={(q) => onQuantity(line.id, q)} max={line.maxQuantity} size="sm" label={`Quantity of ${line.name}`} />
          <button type="button" className="cart-item__remove" onClick={() => onRemove(line)} aria-label={`Remove ${line.name} from cart`}>
            <Trash2 size={15} aria-hidden="true" /> <span>Remove</span>
          </button>
        </div>
      )}

      <div className="cart-item__total">
        <span className="price">{formatPrice(line.lineTotal)}</span>
        {line.savings > 0 && <span className="cart-item__save">You save {formatPrice(line.savings)}</span>}
      </div>
    </article>
  )
}
