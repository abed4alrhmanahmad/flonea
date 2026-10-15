import { formatPrice } from '../../lib/format.js'

/** Price with optional compare-at (set savings). */
export default function PriceTag({ price, compareAt, size = 'md' }) {
  return (
    <p className={`price-tag price-tag--${size}`}>
      <span className="price">{formatPrice(price)}</span>
      {compareAt && compareAt > price && (
        <>
          <span className="price price--compare">
            <span className="visually-hidden">Regular price </span>
            {formatPrice(compareAt)}
          </span>
          <span className="price-tag__save">Save {formatPrice(compareAt - price)}</span>
        </>
      )}
    </p>
  )
}
