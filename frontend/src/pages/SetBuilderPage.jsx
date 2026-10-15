import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Gift, Layers, Leaf, Info, RotateCcw, Sparkles, Sprout, Wheat } from 'lucide-react'
import Img from '../components/ui/Img.jsx'
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx'
import QuantitySelector from '../components/ui/QuantitySelector.jsx'
import Availability from '../components/product/Availability.jsx'
import { ColorSwatches } from '../components/product/Options.jsx'
import { PRODUCTS_BY_ID } from '../data/products.js'
import { COLORS, MATERIALS, SIZES, PILLOW_SIZE_FOR_BED } from '../data/catalog.js'
import { SET_BUILDER, getBuilderDiscountPercent } from '../data/setBuilder.js'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { changeSelection, expandBundle, findVariant, getDefaultSelection, getProductImageKeys, isOptionCompatible, resolveComponentSelection } from '../lib/variants.js'
import { makeCustomSetLine } from '../lib/pricing.js'
import { formatPrice } from '../lib/format.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import '../styles/builder.css'

const MATERIAL_ICONS = { 'organic-cotton': Leaf, bamboo: Sprout, linen: Wheat }
const ITEMS = SET_BUILDER.items.map((item) => ({ ...item, product: PRODUCTS_BY_ID[item.productId] }))
const DUVET = ITEMS.find((i) => i.id === 'duvet').product
const CANDIDATES = { materials: DUVET.materials, colors: DUVET.colors, sizes: DUVET.sizes }

const initialQuantities = () => Object.fromEntries(ITEMS.map((i) => [i.id, i.defaultQuantity]))
const maxFor = (itemId, size) => Math.min(ITEMS.find((i) => i.id === itemId).max, SET_BUILDER.maxPerBedSize[itemId]?.[size] ?? Infinity)

/** A pseudo-product whose variants are the valid combinations for the chosen items. */
function buildConfigProduct(components, discountPercent) {
  const parts = components.length ? components : ITEMS.map((i) => ({ productId: i.productId, quantity: 1 }))
  const variants = expandBundle({ components: parts, discountPercent, candidates: CANDIDATES }, PRODUCTS_BY_ID)
  return { variants, variantsByKey: Object.fromEntries(variants.map((v) => [v.key, v])) }
}

export default function SetBuilderPage() {
  useDocumentTitle('Bedding Set Builder')
  const { addLine } = useCart()
  const { notify } = useToast()
  const [mode, setMode] = useState('full') // 'full' | 'individual'
  const [quantities, setQuantities] = useState(initialQuantities)
  const [selection, setSelection] = useState(() => getDefaultSelection(buildConfigProduct(ITEMS.map((i) => ({ productId: i.productId, quantity: 1 })), 0), { material: 'organic-cotton', color: 'white', size: 'queen' }))
  const [notice, setNotice] = useState(null)

  // Full Set mode always includes the duvet cover and at least one pillowcase set.
  const effectiveQty = useMemo(() => {
    const q = { ...quantities }
    for (const item of ITEMS) q[item.id] = Math.min(q[item.id], maxFor(item.id, selection.size))
    if (mode === 'full') {
      q.duvet = 1
      q.pillowcases = Math.max(1, q.pillowcases)
    }
    return q
  }, [quantities, mode, selection.size])

  const components = ITEMS.filter((i) => effectiveQty[i.id] > 0).map((i) => ({ productId: i.productId, quantity: effectiveQty[i.id] }))
  const discountPercent = mode === 'full' ? getBuilderDiscountPercent(components) : 0
  const config = buildConfigProduct(components, discountPercent) // 75 combinations at most — cheap to rebuild

  // Keep the selection valid when the chosen items change (derived-state correction during render).
  const current = findVariant(config, selection)
  if (components.length && (!current || (current.stock === 0 && config.variants.some((v) => v.stock > 0)))) {
    const fixed = getDefaultSelection(config, selection)
    if (fixed && (fixed.material !== selection.material || fixed.color !== selection.color || fixed.size !== selection.size)) {
      setSelection(fixed)
      setNotice('Some options aren’t available with the items you chose, so we picked the closest available combination.')
    }
  }

  const variant = findVariant(config, selection)
  const choose = (dimension, value) => {
    const { selection: next, adjusted } = changeSelection(config, selection, dimension, value)
    setSelection(next)
    setNotice(
      adjusted.length
        ? `That option isn’t available in your current ${adjusted.map((d) => (d === 'color' ? 'colour' : d)).join(' and ')}, so we updated ${adjusted.length > 1 ? 'them' : 'it'} for you.`
        : null,
    )
  }
  const optionOk = (dimension, value) => isOptionCompatible(config, dimension, value, selection)

  const setQty = (id, value) => setQuantities((q) => ({ ...q, [id]: value }))
  const reset = () => {
    setQuantities(initialQuantities())
    setSelection(getDefaultSelection(buildConfigProduct([], 0), { material: 'organic-cotton', color: 'white', size: 'queen' }))
    setNotice(null)
  }

  const lines = variant
    ? variant.components.map((c) => {
        const item = ITEMS.find((i) => i.productId === c.productId)
        const v = item.product.variantsByKey[c.variantKey]
        return { ...c, item, variant: v, total: c.unitPrice * c.quantity }
      })
    : []
  const subtotal = variant ? (variant.compareAtPrice ?? variant.price) : 0
  const total = variant ? variant.price : 0
  const canAdd = components.length > 0 && variant && variant.stock > 0

  const addToCart = () => {
    if (!canAdd) return
    if (mode === 'full') {
      const result = addLine(makeCustomSetLine(selection, components, 1))
      if (result.error || result.added === 0) {
        notify({ tone: 'error', title: result.error ?? 'You already have the maximum available of this set in your cart.' })
        return
      }
      notify({ title: 'Your bedding set was added to the cart', message: `${lines.length} matched items · ${discountPercent}% set saving applied`, action: { label: 'View cart', to: '/cart' } })
    } else {
      let added = 0
      for (const c of components) {
        const product = PRODUCTS_BY_ID[c.productId]
        const sel = resolveComponentSelection(product, selection)
        const result = addLine({ type: 'product', productId: c.productId, selection: sel, quantity: c.quantity })
        added += result.added ?? 0
      }
      notify(
        added
          ? { title: `${components.length} individual item${components.length > 1 ? 's' : ''} added to the cart`, message: 'Regular prices — switch to Full Set to save.', action: { label: 'View cart', to: '/cart' } }
          : { tone: 'error', title: 'These items are already at the maximum available quantity in your cart.' },
      )
    }
  }

  const previewKeys = [getProductImageKeys(DUVET, selection.color)[0], ...ITEMS.slice(1).map((i) => getProductImageKeys(i.product, selection.color)[0])]

  return (
    <div className="builder-page">
      <section className="builder-hero">
        <Img name="sand1" alt="" sizes="100vw" priority className="builder-hero__img" />
        <div className="container builder-hero__content">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Bedding Sets', to: '/collections/bedding-sets' }, { label: 'Set Builder' }]} />
          <h1>Create Your Perfect Set</h1>
          <p>Choose between a complete set or individual items — every piece is matched in fabric, colour and size.</p>
          <div className="mode-toggle" role="radiogroup" aria-label="Purchase type">
            <button type="button" role="radio" aria-checked={mode === 'full'} className={mode === 'full' ? 'is-active' : ''} onClick={() => setMode('full')}>
              Full Set <span>(Best Value · save {SET_BUILDER.fullSet.discountPercent}%)</span>
            </button>
            <button type="button" role="radio" aria-checked={mode === 'individual'} className={mode === 'individual' ? 'is-active' : ''} onClick={() => setMode('individual')}>
              Individual Items <span>(regular prices)</span>
            </button>
          </div>
        </div>
      </section>

      <div className="container builder">
        <div className="builder__steps">
          <p className="builder__mode-note" role="status">
            <Info size={16} aria-hidden="true" />
            {mode === 'full'
              ? `You’re building a Full Set: a duvet cover plus at least one pillowcase set, added to your cart as one set with ${SET_BUILDER.fullSet.discountPercent}% off every piece.`
              : 'You’re choosing Individual Items: each piece is added to your cart separately at its regular price. No set saving applies.'}
          </p>

          <section className="step" id="step-items" aria-labelledby="step-items-title">
            <h2 id="step-items-title"><span className="step__num">1</span> Select Your Items</h2>
            <ul className="item-list" role="list">
              {ITEMS.map((item) => {
                const qty = effectiveQty[item.id]
                const max = maxFor(item.id, selection.size)
                const locked = mode === 'full' && item.id === 'duvet'
                const min = mode === 'full' && item.id === 'pillowcases' ? 1 : 0
                const checked = qty > 0
                return (
                  <li key={item.id} className={`item-row ${checked ? 'is-checked' : ''}`}>
                    <label className="checkbox item-row__check">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={locked || (mode === 'full' && item.id === 'pillowcases')}
                        onChange={(e) => setQty(item.id, e.target.checked ? 1 : 0)}
                      />
                      <span>
                        <span className="item-row__name">{item.label}</span>
                        <span className="item-row__note">
                          {locked ? 'Required for a full set' : mode === 'full' && item.id === 'pillowcases' ? 'At least one set required' : item.note}
                        </span>
                      </span>
                    </label>
                    {item.max > 1 && checked && (
                      <QuantitySelector value={qty} onChange={(v) => setQty(item.id, v)} min={Math.max(1, min)} max={max} size="sm" label={`${item.label} quantity`} />
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="step" id="step-size" aria-labelledby="step-size-title">
            <h2 id="step-size-title"><span className="step__num">2</span> Choose Bed Size</h2>
            <div className="pills" role="radiogroup" aria-label="Bed size">
              {DUVET.sizes.map((s) => {
                const ok = optionOk('size', s)
                const selected = selection.size === s
                return (
                  <button key={s} type="button" role="radio" aria-checked={selected} disabled={!ok && !selected} className={`pill ${selected ? 'is-selected' : ''} ${!ok ? 'is-unavailable' : ''}`} onClick={() => choose('size', s)} title={ok ? undefined : `Not available in ${MATERIALS[selection.material].short} / ${COLORS[selection.color].name}`}>
                    <span className="pill__label">{SIZES[s].name}</span>
                    <span className="pill__sub">{SIZES[s].dims}</span>
                    {!ok && <span className="pill__reason">Not in {MATERIALS[selection.material].short}</span>}
                  </button>
                )
              })}
            </div>
            <p className="option-group__hint">
              Pillowcases &amp; pillows for a {SIZES[selection.size].name} bed: {SIZES[PILLOW_SIZE_FOR_BED[selection.size]].name} ({SIZES[PILLOW_SIZE_FOR_BED[selection.size]].dims}).
              {SET_BUILDER.maxPerBedSize.pillowcases[selection.size] === 1 && ' Single beds take one pillowcase set.'}
            </p>
          </section>

          <section className="step" id="step-material" aria-labelledby="step-material-title">
            <h2 id="step-material-title"><span className="step__num">3</span> Select Material</h2>
            <div className="material-cards" role="radiogroup" aria-label="Material">
              {DUVET.materials.map((m) => {
                const Icon = MATERIAL_ICONS[m] ?? Sparkles
                const selected = selection.material === m
                const ok = optionOk('material', m)
                return (
                  <button key={m} type="button" role="radio" aria-checked={selected} className={`material-card ${selected ? 'is-selected' : ''} ${!ok ? 'is-muted' : ''}`} onClick={() => choose('material', m)}>
                    <Icon size={22} strokeWidth={1.4} aria-hidden="true" />
                    <span className="material-card__name">{MATERIALS[m].short}</span>
                    <span className="material-card__desc">{MATERIALS[m].description}</span>
                    {!ok && <span className="pill__reason">Not in {COLORS[selection.color].name} — selecting changes colour</span>}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="step" id="step-color" aria-labelledby="step-color-title">
            <h2 id="step-color-title"><span className="step__num">4</span> Choose Colour <span className="step__value">{COLORS[selection.color].name}</span></h2>
            <ColorSwatches colors={DUVET.colors} value={selection.color} product={config} selection={selection} onChange={(c) => choose('color', c)} />
            {DUVET.colors.some((c) => !optionOk('color', c)) && (
              <p className="option-group__hint">Faded colours aren&apos;t available in {MATERIALS[selection.material].short} for your items. Choosing one switches to an available material.</p>
            )}
            {effectiveQty.pillows > 0 && <p className="option-group__hint">Cloud Pillows come in White only and are not affected by colour.</p>}
          </section>

          {notice && (
            <p className="option-notice" role="status">
              {notice}
            </p>
          )}

          <section className="why-set" aria-labelledby="why-title">
            <h2 id="why-title">Why choose a full set?</h2>
            <ul role="list">
              <li><Layers size={22} strokeWidth={1.4} aria-hidden="true" /><span>Thoughtfully matched pieces</span></li>
              <li><Gift size={22} strokeWidth={1.4} aria-hidden="true" /><span>Better value with a {SET_BUILDER.fullSet.discountPercent}% set saving</span></li>
              <li><Check size={22} strokeWidth={1.4} aria-hidden="true" /><span>Only compatible sizes &amp; colours</span></li>
            </ul>
          </section>
        </div>

        <aside className="builder__summary" aria-labelledby="summary-title">
          <div className="summary-card">
            <div className="summary-card__preview">
              <Img name={previewKeys[0]} alt={`${COLORS[selection.color].name} duvet cover preview`} ratio="4 / 3" sizes="(max-width: 900px) 100vw, 380px" />
              <div className="summary-card__thumbs">
                {previewKeys.slice(1).map((k, i) => (
                  <Img key={`${k}-${i}`} name={k} alt="" ratio="1 / 1" sizes="80px" />
                ))}
              </div>
            </div>
            <div className="summary-card__body">
              <div className="summary-card__head">
                <h2 id="summary-title">{mode === 'full' ? 'Your Set' : 'Your Items'}</h2>
                <span className={`badge ${mode === 'full' ? 'badge--green' : 'badge--outline'}`}>{mode === 'full' ? 'Full Set' : 'Individual Items'}</span>
              </div>
              <p className="summary-card__config">
                {SIZES[selection.size].name} · {MATERIALS[selection.material].short} · {COLORS[selection.color].name}
              </p>

              {components.length === 0 ? (
                <p className="muted">Select at least one item to see your total.</p>
              ) : !variant ? (
                <p className="option-notice">This combination isn&apos;t available. Please choose another size, material or colour.</p>
              ) : (
                <ul className="summary-lines" role="list">
                  {lines.map((l) => (
                    <li key={l.productId}>
                      <span>
                        {l.item.product.name}
                        <span className="muted">
                          {' '}({SIZES[l.variant.size].name}{l.quantity > 1 ? `, ×${l.quantity}` : ''})
                        </span>
                      </span>
                      <span className="price">{formatPrice(l.total)}</span>
                    </li>
                  ))}
                  {discountPercent > 0 && (
                    <li className="summary-lines__discount">
                      <span>{SET_BUILDER.fullSet.label} ({discountPercent}%)</span>
                      <span className="price">−{formatPrice(subtotal - total)}</span>
                    </li>
                  )}
                </ul>
              )}

              <div className="summary-card__total">
                <span>Total</span>
                <span className="price">{formatPrice(total)}</span>
              </div>
              {mode === 'individual' && components.length > 0 && <p className="muted summary-card__hint">Switch to Full Set to save {SET_BUILDER.fullSet.discountPercent}% (needs a duvet cover + pillowcases).</p>}

              {variant && <Availability variant={variant} />}

              <button type="button" className="btn btn--block" disabled={!canAdd} onClick={addToCart}>
                {mode === 'full' ? 'Add Complete Set to Cart' : components.length ? `Add ${components.length} Item${components.length === 1 ? '' : 's'} to Cart` : 'Select an item to continue'}
              </button>
              <div className="summary-card__links">
                <a href="#step-items" className="text-btn">Edit items</a>
                <a href="#step-size" className="text-btn">Edit size</a>
                <button type="button" className="text-btn" onClick={reset}>
                  <RotateCcw size={12} aria-hidden="true" /> Reset
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

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
