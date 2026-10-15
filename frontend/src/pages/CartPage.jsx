import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import CartItem from '../components/cart/CartItem.jsx'
import CartSummary from '../components/cart/CartSummary.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Img from '../components/ui/Img.jsx'
import ProductGrid from '../components/product/ProductGrid.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { PRODUCTS } from '../data/products.js'
import { SET_BUILDER } from '../data/setBuilder.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import '../styles/cart.css'

export default function CartPage() {
  useDocumentTitle('Your Cart')
  const { lines, totals, updateQuantity, remove } = useCart()
  const { notify } = useToast()
  const hasSet = lines.some((l) => l.type !== 'product')

  const onRemove = (line) => {
    remove(line.id)
    notify({ tone: 'info', title: `${line.name} removed from your cart` })
  }

  if (!lines.length) {
    return (
      <div className="container cart-page">
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
          <ProductGrid products={PRODUCTS.filter((p) => p.bestSeller).slice(0, 4)} />
        </section>
      </div>
    )
  }

  return (
    <div className="container cart-page">
      <h1 className="cart-page__title">
        Your Cart <span className="muted">({totals.itemCount} item{totals.itemCount === 1 ? '' : 's'})</span>
      </h1>
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
                <p className="muted">Complete your set and save {SET_BUILDER.fullSet.discountPercent}% with the Bedding Set Builder.</p>
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
