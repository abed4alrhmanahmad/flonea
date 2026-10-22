import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Gift, Info, Layers, RotateCcw } from 'lucide-react'
import Img from '../components/ui/Img.jsx'
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx'
import QuantitySelector from '../components/ui/QuantitySelector.jsx'
import Availability from '../components/product/Availability.jsx'
import { SET_MODE_PARAM, SET_MODE_VALUE, SET_ROLES, collectionPathFor } from '../data/setBuilder.js'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useSetBuilder } from '../context/SetBuilderContext.jsx'
import { makeCustomSetLine, maxComponentQuantity } from '../lib/customSet.js'
import { formatPrice } from '../lib/format.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useCatalog } from '../store/hooks.js'
import '../styles/builder.css'

const editHref = (c) => `/products/${c.product.slug}?${SET_MODE_PARAM}=${SET_MODE_VALUE}`

export default function SetBuilderPage() {
  useDocumentTitle('Bedding Set Builder')
  const [mode, setMode] = useState('set') // 'set' | 'individual'

  return (
    <div className="builder-page">
      <section className="builder-hero">
        <Img name="sand1" alt="" sizes="100vw" priority className="builder-hero__img" />
        <div className="container builder-hero__content">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Bedding Sets', to: '/collections/bedding-sets' }, { label: 'Set Builder' }]} />
          <h1>Create Your Perfect Set</h1>
          <p>Build a custom bedding set from our Pillows &amp; Pillowcases and Duvet Covers — or shop each piece on its own.</p>
          <div className="mode-toggle" role="radiogroup" aria-label="How would you like to shop?">
            <button type="button" role="radio" aria-checked={mode === 'set'} className={mode === 'set' ? 'is-active' : ''} onClick={() => setMode('set')}>
              Build a Set <span>(pillows + duvet cover)</span>
            </button>
            <button type="button" role="radio" aria-checked={mode === 'individual'} className={mode === 'individual' ? 'is-active' : ''} onClick={() => setMode('individual')}>
              Individual Items <span>(shop separately)</span>
            </button>
          </div>
        </div>
      </section>

      {mode === 'set' ? <BuildASet /> : <IndividualItems />}

      <section className="container builder-banner">
        <Img name="creamLinen" alt="" sizes="100vw" className="builder-banner__img" />
        <div className="builder-banner__text">
          <p className="serif">Soft. Natural. Considered for your skin.</p>
          <Link to="/collections/bedding-sets" className="link-arrow">
            Or shop ready-made sets →
          </Link>
        </div>
      </section>
    </div>
  )
}

/** Individual Items: normal shopping — each product goes to the cart on its own. */
function IndividualItems() {
  const { collectionsById } = useCatalog()
  return (
    <div className="container builder builder--single">
      <div className="builder__steps">
        <p className="builder__mode-note" role="status">
          <Info size={16} aria-hidden="true" />
          You’re shopping individual items: each piece is added to your cart on its own, at its regular price. Nothing is grouped into a set.
        </p>
        <ul className="shop-choices" role="list">
          {SET_ROLES.map((role) => {
            const collection = collectionsById[role.collectionId]
            return (
              <li key={role.id}>
                <Link to={collectionPathFor(role, false)} className="shop-choice">
                  <Img name={collection.image} alt="" ratio="4 / 3" sizes="(max-width: 700px) 100vw, 40vw" />
                  <span className="shop-choice__body">
                    <span className="shop-choice__name">{role.shopLabel}</span>
                    <span className="shop-choice__desc">
                      {collection.title}
                      {collection.subtitle && ` — ${collection.subtitle}`}
                    </span>
                  </span>
                  <ArrowRight size={18} className="shop-choice__arrow" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/** Build a Set: one Pillows & Pillowcases product + one duvet cover, reviewed and added to the cart as one item. */
function BuildASet() {
  const { draft, set, setComponentQuantity, removeComponent, clear } = useSetBuilder()
  const { addLine } = useCart()
  const { notify } = useToast()
  const errorFor = (roleId) => set.errors.find((e) => e.role === roleId)?.message

  const addToCart = () => {
    if (!set.isComplete) return
    const result = addLine(makeCustomSetLine(draft, 1))
    if (result.error || result.added === 0) {
      notify({ tone: 'error', title: result.error ?? 'You already have the maximum available of this set in your cart.', action: { label: 'View cart', to: '/cart' } })
      return
    }
    notify({ title: 'Your custom bedding set was added to the cart', message: set.summary, action: { label: 'View cart', to: '/cart' } })
    clear()
  }

  // The duvet cover leads the preview (it is the largest piece); other chosen pieces show as thumbnails.
  const lead = set.chosen.find((c) => c.role === 'duvet') ?? set.chosen[0]
  const previewMain = lead?.imageKey ?? 'duvetWhite3'
  const previewThumbs = set.chosen.filter((c) => c !== lead)

  return (
    <div className="container builder">
      <div className="builder__steps">
        <p className="builder__mode-note" role="status">
          <Info size={16} aria-hidden="true" />
          You’re building a custom set: one Pillows &amp; Pillowcases product and one duvet cover, each in its own size, material and colour. Your set is added
          to the cart as one item, at regular prices.
        </p>

        {SET_ROLES.map((role, i) => {
          const c = set.components[i]
          const error = c && errorFor(role.id)
          return (
            <section key={role.id} className="step" id={`step-${role.id}`} aria-labelledby={`step-${role.id}-title`}>
              <h2 id={`step-${role.id}-title`}>
                <span className="step__num">{i + 1}</span> Choose Your {role.label}
              </h2>
              {c ? (
                <div className={`set-slot ${error ? 'has-error' : 'is-checked'}`}>
                  <Link to={editHref(c)} className="set-slot__media" tabIndex={-1} aria-hidden="true">
                    <Img name={c.imageKey} alt="" ratio="1 / 1" sizes="88px" />
                  </Link>
                  <div className="set-slot__body">
                    <p className="set-slot__name">
                      <Link to={editHref(c)}>{c.name}</Link>
                    </p>
                    <dl className="set-slot__options">
                      {c.options.map((o) => (
                        <div key={o.label}>
                          <dt>{o.label}</dt>
                          <dd>{o.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="set-slot__unit">
                      <span className="price">{formatPrice(c.unitPrice)}</span> <span className="muted">each</span>
                    </p>
                    {error && (
                      <p className="set-slot__error" role="alert">
                        {error}
                      </p>
                    )}
                    <div className="set-slot__actions">
                      <Link to={editHref(c)} className="text-btn">
                        Change options
                      </Link>
                      <Link to={collectionPathFor(role)} className="text-btn">
                        Choose a different product
                      </Link>
                      <button type="button" className="text-btn" onClick={() => removeComponent(role.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="set-slot__side">
                    {role.maxQuantity > 1 && c.variant?.stock > 0 && (
                      <QuantitySelector
                        value={c.quantity}
                        onChange={(q) => setComponentQuantity(role.id, q)}
                        max={Math.max(1, maxComponentQuantity(role.id, c.variant))}
                        size="sm"
                        label={`${c.name} quantity`}
                      />
                    )}
                    <span className="price set-slot__total">{formatPrice(c.lineTotal)}</span>
                  </div>
                </div>
              ) : (
                <div className="set-slot set-slot--empty">
                  <div className="set-slot__body">
                    <p className="set-slot__name">Not chosen yet</p>
                    <p className="set-slot__hint">{role.hint}</p>
                  </div>
                  <Link to={collectionPathFor(role)} className="btn btn--sm">
                    Choose {role.label}
                  </Link>
                </div>
              )}
            </section>
          )
        })}

        <section className="why-set" aria-labelledby="why-title">
          <h2 id="why-title">Why build a set?</h2>
          <ul role="list">
            <li><Layers size={22} strokeWidth={1.4} aria-hidden="true" /><span>Pillows and a duvet cover, chosen together</span></li>
            <li><Check size={22} strokeWidth={1.4} aria-hidden="true" /><span>Each piece in its own size, material &amp; colour</span></li>
            <li><Gift size={22} strokeWidth={1.4} aria-hidden="true" /><span>Added to your cart as one set</span></li>
          </ul>
        </section>
      </div>

      <aside className="builder__summary" id="your-set" aria-labelledby="summary-title">
        <div className="summary-card">
          <div className="summary-card__preview">
            <Img name={previewMain} alt={set.chosen.length ? 'Preview of your set' : ''} ratio="4 / 3" sizes="(max-width: 900px) 100vw, 380px" />
            {previewThumbs.length > 0 && (
              <div className="summary-card__thumbs">
                {previewThumbs.map((c) => (
                  <Img key={c.role} name={c.imageKey} alt="" ratio="1 / 1" sizes="80px" />
                ))}
              </div>
            )}
          </div>
          <div className="summary-card__body">
            <div className="summary-card__head">
              <h2 id="summary-title">Your Set</h2>
              <span className={`badge ${set.isComplete ? 'badge--green' : 'badge--outline'}`}>
                {set.isComplete ? 'Custom Set' : `${set.chosen.length} of ${SET_ROLES.length} chosen`}
              </span>
            </div>
            <p className="summary-card__config">{set.summary || 'Choose a Pillows & Pillowcases product and a duvet cover.'}</p>

            <ul className="summary-lines summary-lines--set" role="list">
              {SET_ROLES.map((role, i) => {
                const c = set.components[i]
                return c ? (
                  <li key={role.id}>
                    <Img name={c.imageKey} alt="" ratio="1 / 1" sizes="48px" className="summary-lines__thumb" />
                    <span className="summary-lines__text">
                      <span className="summary-lines__role">{role.label}</span>
                      <span>
                        {c.name}
                        {c.quantity > 1 && <span className="muted"> × {c.quantity}</span>}
                      </span>
                      <span className="muted">{c.details}</span>
                    </span>
                    <span className="price">{formatPrice(c.lineTotal)}</span>
                  </li>
                ) : (
                  <li key={role.id} className="summary-lines__empty">
                    <span className="summary-lines__thumb" aria-hidden="true" />
                    <span className="summary-lines__text">
                      <span className="summary-lines__role">{role.label}</span>
                      <span className="muted">Not chosen yet</span>
                    </span>
                    <Link to={collectionPathFor(role)} className="text-btn">
                      Choose
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="summary-card__total">
              <span>Total</span>
              <span className="price">{formatPrice(set.total)}</span>
            </div>

            {set.errors.length > 0 ? (
              <ul className="summary-card__errors" role="status" aria-label="Before you can add your set">
                {set.errors.map((e) => (
                  <li key={e.role}>{e.message}</li>
                ))}
              </ul>
            ) : (
              <Availability variant={{ stock: set.stock }} />
            )}

            <button type="button" className="btn btn--block" disabled={!set.isComplete} onClick={addToCart}>
              Add Complete Set to Cart
            </button>
            <div className="summary-card__links">
              <a href="#step-pillow" className="text-btn">Edit pillows</a>
              <a href="#step-duvet" className="text-btn">Edit duvet cover</a>
              <button type="button" className="text-btn" onClick={clear} disabled={!set.chosen.length}>
                <RotateCcw size={12} aria-hidden="true" /> Reset
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
