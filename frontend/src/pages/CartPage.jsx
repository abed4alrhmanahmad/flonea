import { Link } from 'react-router-dom'
import { CircleAlert, ShoppingBag } from 'lucide-react'
import CartItem from '../components/cart/CartItem.jsx'
import CartSummary from '../components/cart/CartSummary.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Img from '../components/ui/Img.jsx'
import ProductGrid from '../components/product/ProductGrid.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useCatalog } from '../store/hooks.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import '../styles/cart.css'

export default function CartPage() {
  useDocumentTitle('Your Cart')
  const { lines, unavailableLines, totals, updateQuantity, remove, removeUnavailable } = useCart()
  const { notify } = useToast()
  const { products } = useCatalog()
  const hasSet = lines.some((l) => l.type !== 'product')

  const onRemove = (line) => {
    remove(line.id)
    notify({ tone: 'info', title: `${line.name} removed from your cart` })
  }

  // Items the store has withdrawn, switched off or sold out are set aside, not silently dropped.
  const unavailableNotice = unavailableLines.length > 0 && (
    <div className="cart-unavailable" role="status">
      <CircleAlert size={16} aria-hidden="true" />
      <div>
        <p>
          <strong>
            {unavailableLines.length} item{unavailableLines.length === 1 ? ' is' : 's are'} currently unavailable
          </strong>{' '}
          and not included in your total: {unavailableLines.map((u) => u.name).join(', ')}.
        </p>
        <button type="button" className="text-btn" onClick={removeUnavailable}>
          Remove unavailable items
        </button>
      </div>
    </div>
  )

  if (!lines.length) {
    return (
      <div className="container cart-page">
        {unavailableNotice}
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          headingLevel={1}
          actions={
            <>
              <Link to="/shop" className="btn">
                Shop Bedding
              </Link>
              <Link to="/bedding-sets/builder" className="btn btn--outline">
                Build a Set
              </Link>
            </>
          }
        >
          <p>Discover duvet covers, pillows and complete sets in soft, natural fabrics.</p>
        </EmptyState>
        <section className="cart-page__suggest" aria-labelledby="suggest-title">
          <h2 id="suggest-title">Our Best Sellers</h2>
          <ProductGrid products={products.filter((p) => p.bestSeller).slice(0, 4)} />
        </section>
      </div>
    )
  }

  return (
    <div className="container cart-page">
      <h1 className="cart-page__title">
        Your Cart <span className="muted">({totals.itemCount} item{totals.itemCount === 1 ? '' : 's'})</span>
      </h1>
      {unavailableNotice}
      <div className="cart-page__layout">
        <div>
          <ul className="cart-list" role="list">
            {lines.map((line) => (
              <li key={line.id}>
                <CartItem line={line} onQuantity={updateQuantity} onRemove={onRemove} />
              </li>
            ))}
          </ul>

          {!hasSet && (
            <aside className="upsell">
              <Img name="duvetSage3" alt="" ratio="1 / 1" sizes="96px" className="upsell__img" />
              <div>
                <p className="upsell__title">Add a little more comfort</p>
                <p className="muted">Pair Pillows &amp; Pillowcases with a duvet cover in the Bedding Set Builder.</p>
              </div>
              <Link to="/bedding-sets/builder" className="btn btn--outline btn--sm">
                Build a Set
              </Link>
            </aside>
          )}
        </div>

        <CartSummary totals={totals}>
          <Link to="/checkout" className="btn btn--block">
            Proceed to Checkout
          </Link>
          <Link to="/shop" className="link-arrow summary__continue">
            Continue Shopping
          </Link>
        </CartSummary>
      </div>
    </div>
  )
}
