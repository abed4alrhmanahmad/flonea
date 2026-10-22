import { useState } from 'react'
import { CircleAlert, CircleCheck, Download, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { CURRENCIES } from '../../data/catalog.js'
import { isImageUrl } from '../../data/images.js'
import { formatPrice } from '../../lib/format.js'
import { isHttpsUrl } from '../../lib/links.js'
import { isValidEmail, isValidPhone } from '../../lib/validation.js'
import { useStore } from '../../store/hooks.js'
import { clearActivity, exportStoreData, removeSampleOrders, resetToDefaults, updateContent, updateSettings } from '../../store/store.js'
import { DEFAULT_SETTINGS } from '../../store/seed.js'
import { makeId } from '../../store/schema.js'
import { useToast } from '../../context/ToastContext.jsx'
import { useConfirm } from '../components/ConfirmContext.jsx'
import { useUnsavedChanges } from '../components/UnsavedChangesContext.jsx'
import { Card, DemoNote, ErrorSummary, NumberField, PageHeader, SelectField, TextField, Toggle } from '../components/ui.jsx'
import { deepClone, isEqualJson, removeAt, replaceAt } from '../lib/listUtils.js'

const num = (v) => (v === '' || v === null ? NaN : Number(v))

function validateSettings(s) {
  const e = {}
  if (!s.storeName.trim()) e.storeName = 'Enter the store name.'
  else if (s.storeName.length > 40) e.storeName = 'Keep it under 40 characters.'
  if (s.logoUrl.trim() && !isImageUrl(s.logoUrl)) e.logoUrl = 'Enter an https:// image address or a site path such as /images/logo.png — or leave empty for the FLONEA logo.'
  if (s.contact.email.trim() && !isValidEmail(s.contact.email)) e.email = 'Enter a valid email address.'
  if (s.contact.phone.trim() && !isValidPhone(s.contact.phone)) e.phone = 'Enter a valid phone number (7–15 digits).'
  for (const k of ['instagram', 'facebook', 'pinterest']) if (s.social[k].trim() && !isHttpsUrl(s.social[k])) e[`social.${k}`] = 'Use a full https:// address, or leave empty.'
  if (!Number.isFinite(num(s.shipping.freeThreshold)) || num(s.shipping.freeThreshold) < 0) e.freeThreshold = 'Enter an amount of 0 or more.'
  if (!s.shipping.methods.some((m) => m.enabled)) e.methods = 'Keep at least one delivery method enabled.'
  s.shipping.methods.forEach((m, i) => {
    if (!m.name.trim()) e[`method.${i}.name`] = `Delivery method ${i + 1} needs a name.`
    if (!Number.isFinite(num(m.price)) || num(m.price) < 0) e[`method.${i}.price`] = `Enter a price of 0 or more for ${m.name || `method ${i + 1}`}.`
  })
  const t = num(s.inventory.lowStockThreshold)
  if (!Number.isInteger(t) || t < 0) e.lowStockThreshold = 'Enter a whole number of 0 or more.'
  const countries = s.checkout.countries
  if (!countries.length) e.countries = 'List at least one country.'
  if (!countries.includes(s.checkout.defaultCountry)) e.defaultCountry = 'The default country must be one of the listed countries.'
  return e
}

function normalize(s) {
  return {
    ...s,
    storeName: s.storeName.trim(),
    logoUrl: s.logoUrl.trim(),
    contact: { email: s.contact.email.trim(), phone: s.contact.phone.trim(), hours: s.contact.hours.trim() },
    social: Object.fromEntries(Object.entries(s.social).map(([k, v]) => [k, v.trim()])),
    shipping: { freeThreshold: num(s.shipping.freeThreshold), methods: s.shipping.methods.map((m) => ({ ...m, name: m.name.trim(), eta: m.eta.trim(), price: num(m.price) })) },
    inventory: { lowStockThreshold: num(s.inventory.lowStockThreshold) },
  }
}

const VISIBILITY = [
  { key: 'announcement', label: 'Announcement bar', get: (c) => c.announcement.enabled, set: (c, v) => ['announcement', { ...c.announcement, enabled: v }] },
  ...[
    ['hero', 'Hero'],
    ['categories', 'Shop by Category'],
    ['popular', 'Popular Collections (Featured, New Arrivals, Best Sellers)'],
    ['materials', 'Materials band'],
    ['colors', 'Shop by Color'],
    ['builder', 'Build a Set promotion'],
    ['story', 'Brand story'],
    ['testimonials', 'Testimonials (demo)'],
    ['newsletter', 'Newsletter'],
  ].map(([key, label]) => ({ key, label, get: (c) => c.home[key].enabled, set: (c, v) => ['home', { ...c.home, [key]: { ...c.home[key], enabled: v } }] })),
]

export default function SettingsPage() {
  const { data, orders, activity, lastSave } = useStore()
  const { notify } = useToast()
  const confirm = useConfirm()
  const [saved, setSaved] = useState(() => deepClone(data.settings))
  const [draft, setDraft] = useState(() => deepClone(data.settings))
  const [countriesText, setCountriesText] = useState(() => data.settings.checkout.countries.join('\n'))
  const [submitted, setSubmitted] = useState(false)
  const dirty = !isEqualJson(draft, saved)
  useUnsavedChanges(dirty)
  const errors = validateSettings(draft)
  const shown = submitted ? errors : {}
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const setIn = (key, patch) => setDraft((d) => ({ ...d, [key]: { ...d[key], ...patch } }))
  const methods = draft.shipping.methods
  const setMethods = (next) => setIn('shipping', { methods: next })

  const save = () => {
    setSubmitted(true)
    if (Object.keys(errors).length) {
      notify({ tone: 'error', title: 'Please fix the highlighted settings', message: Object.values(errors)[0] })
      return
    }
    const next = normalize(draft)
    const result = updateSettings(next)
    setSaved(deepClone(next))
    setDraft(deepClone(next))
    setSubmitted(false)
    notify({ title: 'Settings saved', message: result.persisted ? 'The storefront uses them now.' : 'Browser storage is unavailable — settings last until you reload.' })
  }

  const restoreDefaults = async () => {
    if (!(await confirm({ title: 'Restore default settings?', message: 'Store name, contact details, social links, currency, shipping, low-stock threshold and checkout settings go back to their defaults. Products and content are not affected.', confirmLabel: 'Restore defaults', tone: 'danger' }))) return
    resetToDefaults('settings')
    setSaved(deepClone(DEFAULT_SETTINGS))
    setDraft(deepClone(DEFAULT_SETTINGS))
    setCountriesText(DEFAULT_SETTINGS.checkout.countries.join('\n'))
    notify({ tone: 'info', title: 'Default settings restored' })
  }

  const toggleVisibility = (item, on) => {
    const [section, value] = item.set(data.content, on)
    updateContent(section, value, `${on ? 'Showed' : 'Hid'} ${item.label} on the storefront.`)
    notify({ tone: on ? 'success' : 'info', title: `${item.label} ${on ? 'shown' : 'hidden'}`, message: 'Applied to the storefront.' })
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(exportStoreData(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flonea-store-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    notify({ title: 'Exported store data', message: 'A JSON file with the catalog, content, settings and demo orders was downloaded.' })
  }

  const reset = async (part, title, message) => {
    if (!(await confirm({ title, message, confirmLabel: 'Reset', tone: 'danger' }))) return
    resetToDefaults(part)
    if (part === 'all' || part === 'settings') {
      setSaved(deepClone(DEFAULT_SETTINGS))
      setDraft(deepClone(DEFAULT_SETTINGS))
      setCountriesText(DEFAULT_SETTINGS.checkout.countries.join('\n'))
    }
    notify({ tone: 'info', title: 'Reset complete', message: 'Customers’ carts and wishlists in this browser were kept.' })
  }

  const sampleCount = orders.filter((o) => o.sample).length

  return (
    <>
      <PageHeader title="Settings" description="Store-wide settings used by the storefront, cart and demo checkout." />
      {submitted && <ErrorSummary errors={errors} />}

      <div className="adm-grid adm-grid--2">
        <Card title="Store identity">
          <div className="adm-stack">
            <TextField label="Store name" value={draft.storeName} onChange={(storeName) => set({ storeName })} error={shown.storeName} required hint="Used in page titles, the footer and logo labels." />
            <TextField label="Logo URL" value={draft.logoUrl} onChange={(logoUrl) => set({ logoUrl })} error={shown.logoUrl} placeholder="Leave empty to use the FLONEA logo" hint="An https:// image or a /site/path image. The logo image itself is not uploaded." />
            {draft.logoUrl && isImageUrl(draft.logoUrl) && <img src={draft.logoUrl} alt="Logo preview" style={{ maxHeight: 56, maxWidth: 220, objectFit: 'contain' }} />}
          </div>
        </Card>

        <Card title="Contact" description="Shown in the footer and on the Contact help page.">
          <div className="adm-stack">
            <TextField label="Email" type="email" value={draft.contact.email} onChange={(email) => setIn('contact', { email })} error={shown.email} />
            <TextField label="Phone" type="tel" value={draft.contact.phone} onChange={(phone) => setIn('contact', { phone })} error={shown.phone} hint="Optional" />
            <TextField label="Opening hours" value={draft.contact.hours} onChange={(hours) => setIn('contact', { hours })} />
          </div>
        </Card>

        <Card title="Social links" description="Empty links show a “coming soon” message instead of opening a page.">
          <div className="adm-stack">
            {['instagram', 'facebook', 'pinterest'].map((k) => (
              <TextField key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} type="url" value={draft.social[k]} onChange={(v) => setIn('social', { [k]: v })} error={shown[`social.${k}`]} placeholder={`https://www.${k}.com/…`} />
            ))}
          </div>
        </Card>

        <Card title="Currency display" description="How prices are written on the storefront and in the Admin.">
          <div className="adm-stack">
            <SelectField label="Currency" value={draft.currency.code} onChange={(code) => set({ currency: { code } })} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.label} (${c.code})` }))} />
            <DemoNote tone="warning">Display only: prices keep their numbers and are not converted. A $89 product shows as {new Intl.NumberFormat('en-US', { style: 'currency', currency: draft.currency.code }).format(89)}.</DemoNote>
          </div>
        </Card>
      </div>

      <Card title="Shipping (demo)" description="Delivery methods and prices offered at the demo checkout. No real shipping integration is used.">
        <div className="adm-stack">
          <div className="adm-form-grid">
            <NumberField label="Free-shipping threshold" min="0" step="1" value={draft.shipping.freeThreshold} onChange={(freeThreshold) => setIn('shipping', { freeThreshold })} error={shown.freeThreshold} hint="Methods marked “free over threshold” cost nothing at or above this order value." />
          </div>
          {shown.methods && <p className="adm-field__error">{shown.methods}</p>}
          <div className="adm-table-wrap">
            <table className="adm-table">
              <caption className="visually-hidden">Delivery methods</caption>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Delivery time</th>
                  <th className="num">Price</th>
                  <th>Free over threshold</th>
                  <th>Enabled</th>
                  <th className="actions">
                    <span className="visually-hidden">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {methods.map((m, i) => (
                  <tr key={m.id}>
                    <td>
                      <input className="input" value={m.name} onChange={(e) => setMethods(replaceAt(methods, i, { ...m, name: e.target.value }))} aria-label={`Method ${i + 1} name`} aria-invalid={Boolean(shown[`method.${i}.name`]) || undefined} />
                    </td>
                    <td>
                      <input className="input" value={m.eta} onChange={(e) => setMethods(replaceAt(methods, i, { ...m, eta: e.target.value }))} aria-label={`Method ${i + 1} delivery time`} />
                    </td>
                    <td className="num">
                      <input className="input adm-price-input" type="number" min="0" step="0.01" value={m.price} onChange={(e) => setMethods(replaceAt(methods, i, { ...m, price: e.target.value }))} aria-label={`Method ${i + 1} price`} aria-invalid={Boolean(shown[`method.${i}.price`]) || undefined} />
                    </td>
                    <td>
                      <Toggle size="sm" hideLabel label={`${m.name} free over threshold`} checked={m.freeOverThreshold} onChange={(v) => setMethods(replaceAt(methods, i, { ...m, freeOverThreshold: v }))} />
                    </td>
                    <td>
                      <Toggle size="sm" hideLabel label={`${m.name} enabled`} checked={m.enabled} onChange={(v) => setMethods(replaceAt(methods, i, { ...m, enabled: v }))} />
                    </td>
                    <td className="actions">
                      <button type="button" className="adm-icon-btn adm-icon-btn--danger" disabled={methods.length <= 1} onClick={() => setMethods(removeAt(methods, i))} aria-label={`Remove ${m.name || `method ${i + 1}`}`}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {Object.entries(shown)
            .filter(([k]) => k.startsWith('method.'))
            .map(([k, v]) => (
              <p key={k} className="adm-field__error">
                {v}
              </p>
            ))}
          <div>
            <button type="button" className="btn btn--light btn--sm" onClick={() => setMethods([...methods, { id: makeId('ship'), name: '', eta: '', price: 0, freeOverThreshold: false, enabled: true }])} disabled={methods.length >= 6}>
              <Plus size={14} aria-hidden="true" /> Add delivery method
            </button>
          </div>
        </div>
      </Card>

      <div className="adm-grid adm-grid--2">
        <Card title="Inventory">
          <NumberField label="Low-stock threshold" min="0" step="1" value={draft.inventory.lowStockThreshold} onChange={(lowStockThreshold) => set({ inventory: { lowStockThreshold } })} error={shown.lowStockThreshold} hint="At or below this, product pages say “Only N left” and the Admin flags the variant as low." />
        </Card>

        <Card title="Checkout (demo)" description="The demo checkout never takes payment.">
          <div className="adm-stack">
            <SelectField label="Default country" value={draft.checkout.defaultCountry} onChange={(defaultCountry) => setIn('checkout', { defaultCountry })} options={draft.checkout.countries.map((c) => ({ value: c, label: c }))} error={shown.defaultCountry} />
            <TextField
              label="Countries offered (one per line)"
              multiline
              rows={6}
              value={countriesText}
              onChange={(text) => {
                setCountriesText(text)
                const countries = [...new Set(text.split('\n').map((c) => c.trim()).filter(Boolean))]
                setIn('checkout', { countries, defaultCountry: countries.includes(draft.checkout.defaultCountry) ? draft.checkout.defaultCountry : (countries[0] ?? '') })
              }}
              error={shown.countries}
            />
          </div>
        </Card>
      </div>

      <div className="adm-savebar">
        <span className={`adm-savebar__status ${dirty ? 'is-dirty' : ''}`} role="status">
          {dirty ? <CircleAlert size={15} aria-hidden="true" /> : <CircleCheck size={15} aria-hidden="true" />}
          {dirty ? 'Unsaved settings' : lastSave.ok ? 'All settings saved' : 'Last change couldn’t be written to browser storage'}
        </span>
        <div className="adm-savebar__actions">
          <button type="button" className="btn btn--light btn--sm" onClick={restoreDefaults}>
            <RotateCcw size={14} aria-hidden="true" /> Restore defaults
          </button>
          {dirty && (
            <button
              type="button"
              className="btn btn--light btn--sm"
              onClick={() => {
                setDraft(deepClone(saved))
                setCountriesText(saved.checkout.countries.join('\n'))
                setSubmitted(false)
              }}
            >
              Discard
            </button>
          )}
          <button type="button" className="btn btn--sm" onClick={save} disabled={!dirty}>
            <Save size={15} aria-hidden="true" /> Save settings
          </button>
        </div>
      </div>

      <Card title="Storefront visibility" description="Show or hide whole areas of the storefront. These switches apply immediately (the same switches are in Content).">
        <div className="adm-form-grid">
          {VISIBILITY.map((item) => (
            <Toggle key={item.key} checked={item.get(data.content)} onChange={(on) => toggleVisibility(item, on)} label={item.label} />
          ))}
        </div>
      </Card>

      <Card title="Data & reset" description="Everything you change is stored in this browser only (localStorage). It is not shared with other devices or visitors, and clearing site data removes it.">
        <div className="adm-stack">
          <div className="adm-inline">
            <button type="button" className="btn btn--light btn--sm" onClick={exportJson}>
              <Download size={14} aria-hidden="true" /> Export store data (JSON)
            </button>
            <span className="adm-field__hint">For backups, or as a starting point for importing into a real backend later.</span>
          </div>
          <hr className="adm-sep" style={{ margin: 0 }} />
          <div className="adm-inline">
            <button type="button" className="btn btn--light btn--sm" onClick={() => reset('catalog', 'Reset the catalog?', 'All products, variants, stock, collections and Build a Set settings go back to the original catalog. Content and settings are kept.')}>
              Reset catalog
            </button>
            <button type="button" className="btn btn--light btn--sm" onClick={() => reset('content', 'Reset all content?', 'Homepage, navigation, footer and About page content go back to the original copy.')}>
              Reset content
            </button>
            <button type="button" className="btn btn--danger btn--sm" onClick={() => reset('all', 'Reset everything to factory defaults?', 'Catalog, collections, content, settings and Build a Set settings are all restored. Demo orders, activity history and customers’ carts and wishlists are kept.')}>
              Reset everything
            </button>
          </div>
          <div className="adm-inline">
            <button type="button" className="btn btn--light btn--sm" disabled={!sampleCount} onClick={() => removeSampleOrders() && notify({ tone: 'info', title: 'Sample orders removed' })}>
              Remove sample orders ({sampleCount})
            </button>
            <button
              type="button"
              className="btn btn--light btn--sm"
              disabled={!activity.length}
              onClick={async () => {
                if (await confirm({ title: 'Clear the activity history?', message: 'The local list of admin changes is deleted. Your data is not changed.', confirmLabel: 'Clear history', tone: 'danger' })) {
                  clearActivity()
                  notify({ tone: 'info', title: 'Activity history cleared' })
                }
              }}
            >
              Clear activity history ({activity.length})
            </button>
          </div>
          <p className="adm-field__hint">
            With the saved shipping settings, orders under {formatPrice(data.settings.shipping.freeThreshold)} pay each method’s price; from {formatPrice(data.settings.shipping.freeThreshold)} the methods marked “free over threshold” are free.
          </p>
        </div>
      </Card>
    </>
  )
}
