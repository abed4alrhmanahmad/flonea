import { Link } from 'react-router-dom'
import { Heart, X } from 'lucide-react'
import Img from '../components/ui/Img.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { ColorSwatches } from '../components/product/Options.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useQuickAdd } from '../components/product/QuickAdd.jsx'
import { formatPriceRange } from '../lib/format.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import '../styles/pages.css'

export default function WishlistPage() {
  useDocumentTitle('Wishlist')
  const { items, remove } = useWishlist()
  const { notify } = useToast()
  const openQuickAdd = useQuickAdd()

  return (
    <div className="container page wishlist">
      <header className="page__head">
        <h1>Your Wishlist</h1>
        <p className="muted">{items.length ? `${items.length} saved item${items.length === 1 ? '' : 's'} — saved in this browser.` : 'Save the pieces you love and come back to them later.'}</p>
      </header>

      {items.length === 0 ? (
        <EmptyState icon={Heart} title="Your wishlist is empty" actions={<Link to="/shop" className="btn">Discover Bedding</Link>}>
          <p>Tap the heart on any product to save it here.</p>
        </EmptyState>
      ) : (
        <ul className="wishlist__grid" role="list">
          {items.map((p) => (
            <li key={p.id} className="wish-card">
              <Link to={`/products/${p.slug}`} className="wish-card__media" tabIndex={-1} aria-hidden="true">
                <Img name={p.images[0]} alt="" ratio="1 / 1" sizes="(max-width: 600px) 50vw, 25vw" />
              </Link>
              <button
                type="button"
                className="wish-card__remove"
                aria-label={`Remove ${p.name} from wishlist`}
                onClick={() => {
                  remove(p.id)
                  notify({ tone: 'info', title: 'Removed from your wishlist', message: p.name })
                }}
              >
                <X size={16} />
              </button>
              <div className="wish-card__body">
                <p className="eyebrow">{p.categoryName}</p>
                <h2 className="wish-card__name">
                  <Link to={`/products/${p.slug}`}>{p.name}</Link>
                </h2>
                <p className="price">{formatPriceRange(p.priceRange)}</p>
                {p.availableColors.length > 1 && <ColorSwatches colors={p.availableColors} value={null} onChange={(c) => openQuickAdd(p, c)} size="sm" label={`${p.name} colours — choose to add to cart`} />}
                <button type="button" className="btn btn--sm btn--block" onClick={() => openQuickAdd(p)}>
                  Add to Cart
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
