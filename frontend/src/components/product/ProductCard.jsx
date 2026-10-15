import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Plus } from 'lucide-react'
import Img from '../ui/Img.jsx'
import { ColorSwatches } from './Options.jsx'
import { formatPriceRange } from '../../lib/format.js'
import { getProductImageKeys } from '../../lib/variants.js'
import { useShopActions } from '../../hooks/useShopActions.js'
import { useQuickAdd } from './QuickAdd.jsx'

function ProductCard({ product, priority = false }) {
  const [color, setColor] = useState(product.availableColors[0])
  const { toggleWishlist, isWishlisted } = useShopActions()
  const openQuickAdd = useQuickAdd()
  const images = getProductImageKeys(product, color)
  const href = `/products/${product.slug}${color && product.availableColors.length > 1 ? `?color=${color}` : ''}`
  const saved = isWishlisted(product.id)

  return (
    <article className="product-card">
      <div className="product-card__media">
        <Link to={href} tabIndex={-1} aria-hidden="true" className="product-card__image-link">
          <Img name={images[0]} alt="" ratio="1 / 1" sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 25vw" priority={priority} />
          {images[1] && <Img name={images[1]} alt="" ratio="1 / 1" className="product-card__alt" sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 25vw" />}
        </Link>
        <div className="product-card__badges">
          {product.isBundle && <span className="badge badge--green">Set · Save {product.bundle.discountPercent}%</span>}
          {!product.isBundle && product.isNew && <span className="badge">New</span>}
          {!product.isBundle && !product.isNew && product.bestSeller && <span className="badge badge--gold">Best Seller</span>}
        </div>
        <button
          type="button"
          className={`product-card__wish ${saved ? 'is-active' : ''}`}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          onClick={() => toggleWishlist(product)}
        >
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
        </button>
        <button type="button" className="product-card__quick" onClick={() => openQuickAdd(product, color)} aria-label={`Quick add ${product.name}`}>
          <Plus size={15} aria-hidden="true" />
          <span>Quick Add</span>
        </button>
      </div>
      <div className="product-card__body">
        <h3 className="product-card__title">
          <Link to={href}>{product.name}</Link>
        </h3>
        <p className="product-card__price price">{formatPriceRange(product.priceRange)}</p>
        {product.availableColors.length > 1 ? (
          <ColorSwatches colors={product.availableColors} value={color} onChange={setColor} size="sm" label={`${product.name} colours`} />
        ) : (
          <p className="product-card__meta">{product.tagline}</p>
        )}
      </div>
    </article>
  )
}

export default memo(ProductCard)
