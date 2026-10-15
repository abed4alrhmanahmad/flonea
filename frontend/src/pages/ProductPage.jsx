import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Headphones, Heart, RotateCcw, Truck } from 'lucide-react'
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import Rating from '../components/ui/Rating.jsx'
import QuantitySelector from '../components/ui/QuantitySelector.jsx'
import ProductGallery from '../components/product/ProductGallery.jsx'
import ProductGrid from '../components/product/ProductGrid.jsx'
import PriceTag from '../components/product/PriceTag.jsx'
import Availability from '../components/product/Availability.jsx'
import { VariantPicker } from '../components/product/Options.jsx'
import { getProductById, getProductBySlug } from '../data/products.js'
import { COLLECTIONS, MATERIALS, MAX_LINE_QUANTITY, SHIPPING, SIZES } from '../data/catalog.js'
import { HELP_PAGES } from '../data/content.js'
import { SET_BUILDER } from '../data/setBuilder.js'
import { formatPrice } from '../lib/format.js'
import { getProductImageKeys } from '../lib/variants.js'
import { useVariantSelection } from '../hooks/useVariantSelection.js'
import { useShopActions } from '../hooks/useShopActions.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import NotFoundPage from './NotFoundPage.jsx'
import '../styles/product.css'

const collectionFor = (category) => Object.values(COLLECTIONS).find((c) => c.categories.includes(category))

export default function ProductPage() {
  const { slug } = useParams()
  const product = getProductBySlug(slug)
  if (!product) return <NotFoundPage title="We couldn’t find that product" />
  return <ProductDetail key={product.id} product={product} />
}

function ProductDetail({ product }) {
  useDocumentTitle(product.name)
  const [params, setParams] = useSearchParams()
  const preferredColor = params.get('color')
  const { selection, variant, select, notice } = useVariantSelection(product, { color: preferredColor })
  const [quantity, setQuantity] = useState(1)
  const { addToCart, toggleWishlist, isWishlisted } = useShopActions()

  const images = getProductImageKeys(product, selection.color)
  const collection = collectionFor(product.category)
  const maxQty = Math.max(1, Math.min(variant?.stock ?? 1, MAX_LINE_QUANTITY))
  const qty = Math.min(quantity, maxQty)
  const canAdd = Boolean(variant && variant.stock > 0)
  const saved = isWishlisted(product.id)
  const related = useMemo(() => product.relatedProducts.map(getProductById).filter(Boolean), [product])

  const onSelect = (dimension, value) => {
    select(dimension, value)
    if (dimension === 'color') {
      setParams((p) => {
        const next = new URLSearchParams(p)
        next.set('color', value)
        return next
      }, { replace: true, preventScrollReset: true })
    }
  }

  const tabs = [
    {
      id: 'description',
      label: 'Description',
      content: (
        <div className="prose">
          <p>{product.description}</p>
          <p>
            <strong>{MATERIALS[selection.material]?.name}:</strong> {MATERIALS[selection.material]?.description}
          </p>
        </div>
      ),
    },
    {
      id: 'specs',
      label: 'Specifications',
      content: (
        <dl className="spec-list">
          <div><dt>Material</dt><dd>{MATERIALS[selection.material]?.name}</dd></div>
          <div><dt>Size</dt><dd>{SIZES[selection.size]?.name} — {SIZES[selection.size]?.dims}</dd></div>
          {product.specs.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
          {variant?.sku && <div><dt>SKU</dt><dd>{variant.sku}</dd></div>}
        </dl>
      ),
    },
    {
      id: 'care',
      label: 'Care Instructions',
      content: (
        <ul className="care-list">
          {product.care.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      ),
    },
    {
      id: 'shipping',
      label: 'Shipping & Returns',
      content: (
        <div className="prose">
          {HELP_PAGES['shipping-returns'].sections.map(([title, text]) => (
            <p key={title}>
              <strong>{title}.</strong> {text}
            </p>
          ))}
          <p className="muted">Demo policy shown for illustration only.</p>
        </div>
      ),
    },
  ]

  return (
    <div className="container pdp">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Shop', to: '/shop' },
          ...(collection ? [{ label: collection.title, to: `/collections/${collection.id}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="pdp__top">
        <ProductGallery images={images} productName={product.name} />

        <div className="pdp__info">
          {product.isBundle && <span className="badge badge--green">Bedding Set · Save {product.bundle.discountPercent}%</span>}
          {!product.isBundle && product.isNew && <span className="badge badge--outline">New</span>}
          <h1 className="pdp__title">{product.name}</h1>
          <PriceTag price={variant?.price ?? product.priceRange.min} compareAt={variant?.compareAtPrice} size="lg" />
          <div className="pdp__rating">
            <Rating value={product.rating.average} count={product.rating.count} />
            <span className="muted pdp__rating-note">Sample ratings</span>
          </div>
          <p className="pdp__tagline">{product.tagline}</p>

          <VariantPicker product={product} selection={selection} onSelect={onSelect} notice={notice} />

          {product.isBundle && variant && (
            <div className="set-includes">
              <h2 className="set-includes__title">What&apos;s included</h2>
              <ul role="list">
                {variant.components.map((c) => {
                  const part = getProductById(c.productId)
                  const partVariant = part.variantsByKey[c.variantKey]
                  return (
                    <li key={c.productId}>
                      <span>
                        {c.quantity} × <Link to={`/products/${part.slug}`}>{part.name}</Link>
                        <span className="muted"> · {SIZES[partVariant.size]?.name}</span>
                      </span>
                      <span className="price">{formatPrice(c.unitPrice * c.quantity)}</span>
                    </li>
                  )
                })}
                <li className="set-includes__saving">
                  <span>Set saving ({product.bundle.discountPercent}%)</span>
                  <span className="price">−{formatPrice(variant.compareAtPrice - variant.price)}</span>
                </li>
              </ul>
            </div>
          )}

          <Availability variant={variant} />

          <div className="pdp__buy">
            <QuantitySelector value={qty} onChange={setQuantity} max={maxQty} disabled={!canAdd} />
            <button type="button" className="btn pdp__add" disabled={!canAdd} onClick={() => addToCart(product, selection, qty)}>
              {canAdd ? `Add to Cart — ${formatPrice((variant?.price ?? 0) * qty)}` : 'Sold Out'}
            </button>
          </div>
          <button type="button" className={`pdp__wish ${saved ? 'is-active' : ''}`} aria-pressed={saved} onClick={() => toggleWishlist(product)}>
            <Heart size={16} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
            {saved ? 'Saved to Wishlist' : 'Add to Wishlist'}
          </button>

          {product.category === 'duvet-covers' || product.category === 'pillowcases' ? (
            <p className="pdp__cross muted">
              Want matching pieces? <Link to="/bedding-sets/builder">Build a set</Link> and save {SET_BUILDER.fullSet.discountPercent}% on a full set.
            </p>
          ) : null}

          <ul className="service-row" role="list">
            <li>
              <Truck size={20} strokeWidth={1.4} aria-hidden="true" />
              <span><strong>Free Shipping</strong>on orders over {formatPrice(SHIPPING.freeThreshold)}</span>
            </li>
            <li>
              <RotateCcw size={20} strokeWidth={1.4} aria-hidden="true" />
              <span><strong>Easy Returns</strong>within 30 days</span>
            </li>
            <li>
              <Headphones size={20} strokeWidth={1.4} aria-hidden="true" />
              <span><strong>Dedicated Support</strong><Link to="/help/contact">we&apos;re here to help</Link></span>
            </li>
          </ul>
        </div>
      </div>

      <Tabs tabs={tabs} label="Product information" className="pdp__tabs" />

      {related.length > 0 && (
        <section className="pdp__related" aria-labelledby="related-title">
          <h2 id="related-title">You May Also Like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  )
}
