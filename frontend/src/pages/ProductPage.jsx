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
import SetModeBanner from '../components/product/SetModeBanner.jsx'
import { MAX_LINE_QUANTITY } from '../data/catalog.js'
import { BUILDER_PATH, collectionPathFor } from '../data/setBuilder.js'
import { formatPrice } from '../lib/format.js'
import { getOptionInfo, getProductImageKeys, optionLabel } from '../lib/variants.js'
import { roleForProduct } from '../lib/customSet.js'
import { getHelpPage } from '../lib/helpContent.js'
import { getFreeShippingThreshold, offersFreeShipping } from '../lib/pricing.js'
import { useCatalog } from '../store/hooks.js'
import { useVariantSelection } from '../hooks/useVariantSelection.js'
import { useShopActions } from '../hooks/useShopActions.js'
import { useSetActions } from '../hooks/useSetActions.js'
import { useSetMode } from '../hooks/useSetMode.js'
import { useSetBuilder } from '../context/SetBuilderContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import NotFoundPage from './NotFoundPage.jsx'
import '../styles/product.css'

export default function ProductPage() {
  const { slug } = useParams()
  // Only active products with at least one variant can be viewed or bought.
  const product = useCatalog().bySlug[slug]
  if (!product) return <NotFoundPage title="We couldn’t find that product" />
  return <ProductDetail key={product.id} product={product} />
}

function ProductDetail({ product }) {
  useDocumentTitle(product.name)
  const catalog = useCatalog()
  const [params, setParams] = useSearchParams()
  const preferredColor = params.get('color')

  // Build a Set mode: this product fills one role of the pending set. When it is already the
  // product in that role, reopen its saved options so the customer can adjust them.
  const setMode = useSetMode()
  const role = roleForProduct(product)
  const setRole = setMode ? role : null
  const { draft } = useSetBuilder()
  const inSet = setRole ? draft[setRole.id] : null
  const editing = inSet?.productId === product.id
  const preferred = editing ? { ...inSet.selection, ...(preferredColor ? { color: preferredColor } : {}) } : { color: preferredColor }
  const setActionLabel = editing ? 'Update Set' : inSet ? 'Replace in Set' : 'Add to Set'

  const { selection, variant, select, notice } = useVariantSelection(product, preferred)
  const [quantity, setQuantity] = useState(editing ? inSet.quantity : 1)
  const { addToCart, toggleWishlist, isWishlisted } = useShopActions()
  const { addToSet } = useSetActions()

  const images = getProductImageKeys(product, selection.color)
  // Breadcrumb: the first visible collection that contains this product.
  const collection = catalog.collections.find((c) => c.enabled && c.productIds.includes(product.id))
  const material = getOptionInfo(product, 'material', selection.material)
  const size = getOptionInfo(product, 'size', selection.size)
  const maxQty = Math.max(1, Math.min(variant?.stock ?? 1, MAX_LINE_QUANTITY, setRole?.maxQuantity ?? MAX_LINE_QUANTITY))
  const qty = Math.min(quantity, maxQty)
  const canAdd = Boolean(variant && variant.stock > 0)
  const saved = isWishlisted(product.id)
  const related = useMemo(() => product.relatedProducts.map((id) => catalog.byId[id]).filter(Boolean), [product, catalog])

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
          {material?.description && (
            <p>
              <strong>{material.name}:</strong> {material.description}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'specs',
      label: 'Specifications',
      content: (
        <dl className="spec-list">
          <div><dt>Material</dt><dd>{material?.name}</dd></div>
          <div><dt>Size</dt><dd>{size?.name}{size?.dims ? ` — ${size.dims}` : ''}</dd></div>
          {product.specs.map(([k, v], i) => (
            <div key={`${k}-${i}`}><dt>{k}</dt><dd>{v}</dd></div>
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
          {product.care.map((c, i) => (
            <li key={`${i}-${c}`}>{c}</li>
          ))}
        </ul>
      ),
    },
    {
      id: 'shipping',
      label: 'Shipping & Returns',
      content: (
        <div className="prose">
          {getHelpPage('shipping-returns').sections.map(([title, text]) => (
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
          ...(collection ? [{ label: collection.title, to: setRole ? collectionPathFor(setRole) : `/collections/${collection.id}` }] : []),
          { label: product.name },
        ]}
      />

      {setRole && (
        <SetModeBanner
          role={setRole}
          hint={`Choose this product’s size, material and colour, then select ${setActionLabel}.`}
          exitTo={`/products/${product.slug}`}
        />
      )}

      <div className="pdp__top">
        <ProductGallery images={images} productName={product.name} alts={product.imageAlts} />

        <div className="pdp__info">
          {product.isBundle && <span className="badge badge--green">Bedding Set · Save {product.bundle.discountPercent}%</span>}
          {!product.isBundle && product.isNew && <span className="badge badge--outline">New</span>}
          <h1 className="pdp__title">{product.name}</h1>
          <PriceTag price={variant?.price ?? product.priceRange.min} compareAt={variant?.compareAtPrice} size="lg" />
          {product.rating.count > 0 && (
            <div className="pdp__rating">
              <Rating value={product.rating.average} count={product.rating.count} />
              <span className="muted pdp__rating-note">Sample ratings</span>
            </div>
          )}
          <p className="pdp__tagline">{product.tagline}</p>

          <VariantPicker product={product} selection={selection} onSelect={onSelect} notice={notice} />

          {product.isBundle && variant && (
            <div className="set-includes">
              <h2 className="set-includes__title">What&apos;s included</h2>
              <ul role="list">
                {variant.components.map((c) => {
                  const part = catalog.allById[c.productId]
                  const partVariant = part.variantsByKey[c.variantKey]
                  return (
                    <li key={c.productId}>
                      <span>
                        {c.quantity} × <Link to={`/products/${part.slug}`}>{part.name}</Link>
                        <span className="muted"> · {optionLabel(part, 'size', partVariant.size)}</span>
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
            {(!setRole || setRole.maxQuantity > 1) && <QuantitySelector value={qty} onChange={setQuantity} max={maxQty} disabled={!canAdd} />}
            {setRole ? (
              <button type="button" className="btn pdp__add" disabled={!canAdd} onClick={() => addToSet(product, selection, qty)}>
                {canAdd ? `${setActionLabel} — ${formatPrice((variant?.price ?? 0) * qty)}` : 'Sold Out'}
              </button>
            ) : (
              <button type="button" className="btn pdp__add" disabled={!canAdd} onClick={() => addToCart(product, selection, qty)}>
                {canAdd ? `Add to Cart — ${formatPrice((variant?.price ?? 0) * qty)}` : 'Sold Out'}
              </button>
            )}
          </div>
          {setRole && inSet && !editing && (
            <p className="pdp__set-note muted">
              Your set currently has the {catalog.allById[inSet.productId]?.name ?? 'another product'}. Adding this product replaces it — your other set item stays as it is.
            </p>
          )}
          <button type="button" className={`pdp__wish ${saved ? 'is-active' : ''}`} aria-pressed={saved} onClick={() => toggleWishlist(product)}>
            <Heart size={16} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
            {saved ? 'Saved to Wishlist' : 'Add to Wishlist'}
          </button>

          {role && !setRole && (
            <p className="pdp__cross muted">
              Want a complete bed? <Link to={BUILDER_PATH}>Build a set</Link> — pair Pillows &amp; Pillowcases with a duvet cover, each in its own size and fabric.
            </p>
          )}

          <ul className="service-row" role="list">
            {offersFreeShipping() && (
              <li>
                <Truck size={20} strokeWidth={1.4} aria-hidden="true" />
                <span><strong>Free Shipping</strong>on orders over {formatPrice(getFreeShippingThreshold())}</span>
              </li>
            )}
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
          <ProductGrid products={related} setMode={Boolean(setRole)} />
        </section>
      )}
    </div>
  )
}
