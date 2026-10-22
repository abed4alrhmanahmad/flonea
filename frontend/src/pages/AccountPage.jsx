import { Link } from 'react-router-dom'
import { Heart, Info, Package, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import { formatPrice } from '../lib/format.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useStore } from '../store/hooks.js'
import '../styles/pages.css'

export default function AccountPage() {
  useDocumentTitle('Account')
  const { count } = useCart()
  const wishlist = useWishlist()
  // Most recent demo order placed in this browser (sample orders added in the Admin are excluded).
  const lastOrder = useStore().orders.find((o) => !o.sample) ?? null

  return (
    <div className="container page account">
      <header className="page__head">
        <h1>Your Account</h1>
      </header>
      <div className="demo-note">
        <Info size={16} aria-hidden="true" />
        <span>Sign-in isn&apos;t available in this frontend demo. Your cart, wishlist and last demo order are stored in this browser only.</span>
      </div>
      <ul className="account__tiles" role="list">
        <li>
          <Link to="/cart" className="account-tile">
            <ShoppingBag size={22} strokeWidth={1.4} aria-hidden="true" />
            <strong>Cart</strong>
            <span className="muted">{count} item{count === 1 ? '' : 's'}</span>
          </Link>
        </li>
        <li>
          <Link to="/wishlist" className="account-tile">
            <Heart size={22} strokeWidth={1.4} aria-hidden="true" />
            <strong>Wishlist</strong>
            <span className="muted">{wishlist.count} saved</span>
          </Link>
        </li>
        <li>
          <div className="account-tile">
            <Package size={22} strokeWidth={1.4} aria-hidden="true" />
            <strong>Last demo order</strong>
            {lastOrder ? (
              <span className="muted">
                {lastOrder.number} · {new Date(lastOrder.createdAt).toLocaleDateString()} · {formatPrice(lastOrder.totals?.total)}
              </span>
            ) : (
              <span className="muted">No demo orders yet</span>
            )}
          </div>
        </li>
      </ul>
    </div>
  )
}
