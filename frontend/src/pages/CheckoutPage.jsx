import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleAlert, CircleCheck, Info, Pencil, ShoppingBag } from 'lucide-react'
import CartItem from '../components/cart/CartItem.jsx'
import CartSummary from '../components/cart/CartSummary.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Img from '../components/ui/Img.jsx'
import { useCart } from '../context/CartContext.jsx'
import { calculateTotals, getDefaultShippingMethodId, getShippingCost, getShippingMethods } from '../lib/pricing.js'
import { formatPrice } from '../lib/format.js'
import { validateCheckout } from '../lib/validation.js'
import { STORAGE_KEYS, writeStorage } from '../lib/storage.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useSettings } from '../store/hooks.js'
import { newDemoOrderStamp, recordDemoOrder } from '../store/store.js'
import '../styles/checkout.css'

const STEPS = ['Details', 'Review', 'Confirmation']
const INITIAL = {
  email: '',
  phone: '',
  firstName: '',
  lastName: '',
  address: '',
  apartment: '',
  city: '',
  postalCode: '',
  country: '',
  shippingMethod: '',
  notes: '',
}
const FIELD_ORDER = ['email', 'phone', 'firstName', 'lastName', 'address', 'city', 'postalCode', 'country', 'shippingMethod']
const FIELD_LABELS = {
  email: 'Email address',
  phone: 'Phone number',
  firstName: 'First name',
  lastName: 'Last name',
  address: 'Street address',
  city: 'City',
  postalCode: 'Postal code',
  country: 'Country',
  shippingMethod: 'Delivery method',
}

function Field({ name, label, required, error, hint, children }) {
  return (
    <div className="field">
      <label htmlFor={`co-${name}`}>
        {label}
        {required && <span className="req" aria-hidden="true">*</span>}
        {!required && <span className="muted"> (optional)</span>}
      </label>
      {children}
      {hint && !error && <span className="field-hint" id={`co-${name}-hint`}>{hint}</span>}
      {error && (
        <span className="field-error" id={`co-${name}-error`}>
          <CircleAlert size={14} aria-hidden="true" /> {error}
        </span>
      )}
    </div>
  )
}

export default function CheckoutPage() {
  useDocumentTitle('Checkout')
  const { lines, clear } = useCart()
  const { checkout } = useSettings()
  const [values, setValues] = useState(() => ({ ...INITIAL, country: checkout.defaultCountry, shippingMethod: getDefaultShippingMethodId() }))
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState(0)
  const [order, setOrder] = useState(null)
  const errorSummaryRef = useRef(null)

  const totals = useMemo(() => calculateTotals(lines, values.shippingMethod), [lines, values.shippingMethod])

  const errors = useMemo(() => validateCheckout(values), [values])
  const visibleError = (name) => (submitted || touched[name] ? errors[name] : undefined)
  const shippingMethods = getShippingMethods()
  // Falls back to the first method if the chosen one was switched off in the Admin meanwhile.
  const shippingMethod = shippingMethods.find((m) => m.id === values.shippingMethod) ?? shippingMethods[0]
  const countries = checkout.countries.includes(values.country) ? checkout.countries : [values.country, ...checkout.countries].filter(Boolean)

  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }))
  const blur = (name) => () => setTouched((t) => ({ ...t, [name]: true }))
  const inputProps = (name, extra = {}) => ({
    id: `co-${name}`,
    name,
    value: values[name],
    onChange: set(name),
    onBlur: blur(name),
    'aria-invalid': Boolean(visibleError(name)),
    'aria-describedby': visibleError(name) ? `co-${name}-error` : extra.hint ? `co-${name}-hint` : undefined,
    'aria-required': extra.required || undefined,
  })

  const onReview = (e) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length) {
      // Move focus to the error summary so screen-reader and keyboard users find the problems.
      requestAnimationFrame(() => errorSummaryRef.current?.focus())
      return
    }
    setStep(1)
    window.scrollTo({ top: 0 })
  }

  const placeDemoOrder = () => {
    const { number, createdAt } = newDemoOrderStamp()
    const items = lines.map((l) => ({
      type: l.type,
      productId: l.productId ?? '',
      name: l.name,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      // A custom set lists each component with its own options.
      options: l.type === 'custom-set' ? l.components.map((c) => `${c.quantity} × ${c.name} (${c.details})`).join(' + ') : l.options.map((o) => o.value).join(' · '),
      total: l.lineTotal,
      imageKey: l.imageKey,
      components:
        l.type === 'custom-set'
          ? l.components.map((c) => ({ role: c.role, roleLabel: c.roleLabel, productId: c.productId, name: c.name, quantity: c.quantity, unitPrice: c.unitPrice, details: c.details }))
          : [],
    }))
    const snapshot = {
      number,
      createdAt,
      email: values.email,
      name: `${values.firstName} ${values.lastName}`,
      items,
      totals,
      shipping: shippingMethod,
      address: values,
    }
    writeStorage(STORAGE_KEYS.lastOrder, snapshot)
    // Also kept in the local demo orders log shown in Admin → Orders. No payment, no shipping, no stock change.
    recordDemoOrder({
      id: number,
      number,
      createdAt,
      status: 'placed',
      customer: { email: values.email, phone: values.phone, firstName: values.firstName, lastName: values.lastName },
      shippingAddress: { address: values.address, apartment: values.apartment, city: values.city, postalCode: values.postalCode, country: values.country },
      shippingMethod: { id: shippingMethod.id, name: shippingMethod.name, eta: shippingMethod.eta, price: totals.shipping },
      notes: values.notes,
      items,
      totals,
    })
    setOrder(snapshot)
    clear()
    setStep(2)
    window.scrollTo({ top: 0 })
  }

  if (step === 2 && order) return <Confirmation order={order} />

  if (!lines.length) {
    return (
      <div className="container checkout">
        <EmptyState icon={ShoppingBag} title="Your cart is empty" headingLevel={1} actions={<Link to="/shop" className="btn">Shop Bedding</Link>}>
          <p>Add something to your cart before checking out.</p>
        </EmptyState>
      </div>
    )
  }

  const errorList = FIELD_ORDER.filter((f) => errors[f])

  return (
    <div className="container checkout">
      <ol className="steps" aria-label="Checkout progress">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? 'is-current' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
            <span className="steps__dot">{i < step ? <CircleCheck size={14} /> : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <div className="demo-note checkout__demo">
        <Info size={16} aria-hidden="true" />
        <span>
          <strong>Demo checkout.</strong> This storefront does not collect payment details or place real orders. Your details stay in this browser
          tab only.
        </span>
      </div>

      <div className="checkout__layout">
        {step === 0 ? (
          <form className="checkout__form" onSubmit={onReview} noValidate>
            {submitted && errorList.length > 0 && (
              <div className="error-summary" role="alert" tabIndex={-1} ref={errorSummaryRef}>
                <p>
                  <CircleAlert size={16} aria-hidden="true" /> Please fix {errorList.length} field{errorList.length > 1 ? 's' : ''} before continuing:
                </p>
                <ul>
                  {errorList.map((f) => (
                    <li key={f}>
                      <a href={`#co-${f}`} onClick={(e) => { e.preventDefault(); document.getElementById(`co-${f}`)?.focus() }}>
                        {FIELD_LABELS[f]}: {errors[f]}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <fieldset className="form-section">
              <legend>Customer Information</legend>
              <div className="form-grid">
                <Field name="email" label="Email address" required error={visibleError('email')} hint="For your order confirmation.">
                  <input className="input" type="email" autoComplete="email" inputMode="email" placeholder="you@domain.com" {...inputProps('email', { required: true, hint: true })} />
                </Field>
                <Field name="phone" label="Phone number" required error={visibleError('phone')} hint="For delivery updates.">
                  <input className="input" type="tel" autoComplete="tel" inputMode="tel" placeholder="+961 70 000 000" {...inputProps('phone', { required: true, hint: true })} />
                </Field>
              </div>
            </fieldset>

            <fieldset className="form-section">
              <legend>Shipping Address</legend>
              <div className="form-grid">
                <Field name="firstName" label="First name" required error={visibleError('firstName')}>
                  <input className="input" autoComplete="given-name" {...inputProps('firstName', { required: true })} />
                </Field>
                <Field name="lastName" label="Last name" required error={visibleError('lastName')}>
                  <input className="input" autoComplete="family-name" {...inputProps('lastName', { required: true })} />
                </Field>
                <div className="form-grid__full">
                  <Field name="address" label="Street address" required error={visibleError('address')}>
                    <input className="input" autoComplete="address-line1" placeholder="Street and building number" {...inputProps('address', { required: true })} />
                  </Field>
                </div>
                <div className="form-grid__full">
                  <Field name="apartment" label="Apartment, suite, floor">
                    <input className="input" autoComplete="address-line2" {...inputProps('apartment')} />
                  </Field>
                </div>
                <Field name="city" label="City" required error={visibleError('city')}>
                  <input className="input" autoComplete="address-level2" {...inputProps('city', { required: true })} />
                </Field>
                <Field name="postalCode" label="Postal code" error={visibleError('postalCode')}>
                  <input className="input" autoComplete="postal-code" {...inputProps('postalCode')} />
                </Field>
                <div className="form-grid__full">
                  <Field name="country" label="Country" required error={visibleError('country')}>
                    <select className="select" autoComplete="country-name" {...inputProps('country', { required: true })}>
                      {countries.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </fieldset>

            <fieldset className="form-section" id="co-shippingMethod" tabIndex={-1}>
              <legend>Delivery Method</legend>
              <div className="ship-options">
                {shippingMethods.map((m) => {
                  const cost = getShippingCost(m.id, totals.merchandise)
                  return (
                    <label key={m.id} className={`ship-option ${shippingMethod?.id === m.id ? 'is-selected' : ''}`}>
                      <input type="radio" name="shippingMethod" value={m.id} checked={shippingMethod?.id === m.id} onChange={set('shippingMethod')} />
                      <span className="ship-option__text">
                        <strong>{m.name}</strong>
                        <span className="muted">{m.eta}</span>
                      </span>
                      <span className="price">{cost === 0 ? 'Free' : formatPrice(cost)}</span>
                    </label>
                  )
                })}
              </div>
              {visibleError('shippingMethod') && <p className="field-error">{visibleError('shippingMethod')}</p>}
            </fieldset>

            <fieldset className="form-section">
              <legend>Payment</legend>
              <p className="muted">Payment is not collected in this demo. In the live store, secure payment will be handled by a certified payment provider.</p>
            </fieldset>

            <div className="checkout__actions">
              <Link to="/cart" className="text-btn">
                ← Return to cart
              </Link>
              <button type="submit" className="btn">
                Review Order
              </button>
            </div>
          </form>
        ) : (
          <section className="checkout__review" aria-labelledby="review-title">
            <h1 id="review-title" className="checkout__heading">Review Your Order</h1>
            <div className="review-grid">
              <div className="review-box">
                <div className="review-box__head">
                  <h2>Contact</h2>
                  <button type="button" className="text-btn" onClick={() => setStep(0)}><Pencil size={12} aria-hidden="true" /> Edit</button>
                </div>
                <p>{values.email}<br />{values.phone}</p>
              </div>
              <div className="review-box">
                <div className="review-box__head">
                  <h2>Ship to</h2>
                  <button type="button" className="text-btn" onClick={() => setStep(0)}><Pencil size={12} aria-hidden="true" /> Edit</button>
                </div>
                <p>
                  {values.firstName} {values.lastName}<br />
                  {values.address}{values.apartment && `, ${values.apartment}`}<br />
                  {values.city}{values.postalCode && ` ${values.postalCode}`}, {values.country}
                </p>
              </div>
              <div className="review-box">
                <div className="review-box__head">
                  <h2>Delivery</h2>
                  <button type="button" className="text-btn" onClick={() => setStep(0)}><Pencil size={12} aria-hidden="true" /> Edit</button>
                </div>
                <p>{shippingMethod.name} — {shippingMethod.eta}<br />{totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}</p>
              </div>
            </div>
            <ul className="cart-list" role="list">
              {lines.map((l) => (
                <li key={l.id}><CartItem line={l} compact /></li>
              ))}
            </ul>
            <div className="checkout__actions">
              <button type="button" className="text-btn" onClick={() => setStep(0)}>← Back to details</button>
              <button type="button" className="btn" onClick={placeDemoOrder}>
                Place Demo Order — {formatPrice(totals.total)}
              </button>
            </div>
            <p className="muted checkout__fine">By placing a demo order you confirm this is a simulation: no payment is taken and nothing will be shipped.</p>
          </section>
        )}

        <aside className="checkout__aside">
          <CartSummary totals={totals} shippingLabel={`Shipping (${shippingMethod.name.replace(' (demo)', '')})`} shippingEstimate={shippingMethod.freeOverThreshold}>
            <ul className="checkout__mini" role="list">
              {lines.map((l) => (
                <li key={l.id}><CartItem line={l} compact /></li>
              ))}
            </ul>
          </CartSummary>
        </aside>
      </div>
    </div>
  )
}

function Confirmation({ order }) {
  useDocumentTitle('Demo Order Confirmed')
  return (
    <div className="container confirmation">
      <span className="confirmation__icon" aria-hidden="true"><CircleCheck size={40} strokeWidth={1.3} /></span>
      <p className="eyebrow">Demo order {order.number}</p>
      <h1>Thank you, {order.name.split(' ')[0]}.</h1>
      <p className="confirmation__lead">
        This was a <strong>demonstration checkout</strong>. No real order has been placed, no payment was taken and nothing will be shipped.
      </p>
      <div className="confirmation__card">
        <ul role="list">
          {order.items.map((i, idx) => (
            <li key={idx}>
              <Img name={i.imageKey} alt="" ratio="1 / 1" sizes="56px" />
              <span>
                <strong>{i.name}</strong> × {i.quantity}
                <span className="muted">{i.options}</span>
              </span>
              <span className="price">{formatPrice(i.total)}</span>
            </li>
          ))}
        </ul>
        <dl>
          <div><dt>Subtotal</dt><dd>{formatPrice(order.totals.subtotal)}</dd></div>
          {order.totals.savings > 0 && <div><dt>Set savings</dt><dd>−{formatPrice(order.totals.savings)}</dd></div>}
          <div><dt>{order.shipping.name}</dt><dd>{order.totals.shipping === 0 ? 'Free' : formatPrice(order.totals.shipping)}</dd></div>
          <div className="confirmation__total"><dt>Total (demo)</dt><dd>{formatPrice(order.totals.total)}</dd></div>
        </dl>
      </div>
      <div className="confirmation__actions">
        <Link to="/shop" className="btn">Continue Shopping</Link>
        <Link to="/account" className="btn btn--outline">View in Account</Link>
      </div>
    </div>
  )
}
