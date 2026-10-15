import { Lock } from 'lucide-react'
import { SHIPPING } from '../../data/catalog.js'
import { formatPrice } from '../../lib/format.js'

/** Order totals — shared by cart and checkout so the numbers always match. */
export default function CartSummary({ totals, shippingLabel = 'Shipping (Standard)', shippingEstimate = true, title = 'Order Summary', children }) {
  return (
    <section className="summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="summary__title">
        {title}
      </h2>
      <dl className="summary__rows">
        <div>
          <dt>Subtotal ({totals.itemCount} item{totals.itemCount === 1 ? '' : 's'})</dt>
          <dd className="price">{formatPrice(totals.subtotal)}</dd>
        </div>
        {totals.savings > 0 && (
          <div className="summary__discount">
            <dt>Set savings</dt>
            <dd className="price">−{formatPrice(totals.savings)}</dd>
          </div>
        )}
        <div>
          <dt>{shippingLabel}</dt>
          <dd className="price">{totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}</dd>
        </div>
      </dl>
      {shippingEstimate && totals.amountToFreeShipping > 0 && (
        <div className="summary__progress">
          <p>
            Add <strong>{formatPrice(totals.amountToFreeShipping)}</strong> more for free standard shipping.
          </p>
          <span className="summary__bar" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (totals.merchandise / SHIPPING.freeThreshold) * 100)}%` }} />
          </span>
        </div>
      )}
      <div className="summary__total">
        <span>Total</span>
        <span className="price">{formatPrice(totals.total)}</span>
      </div>
      {children}
      <p className="summary__secure">
        <Lock size={12} aria-hidden="true" /> Demo checkout — no payment is taken.
      </p>
    </section>
  )
}
