import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { BUILDER_PATH, SET_ROLES, collectionPathFor } from '../../data/setBuilder.js'
import { resolveSet, roleForProduct } from '../../lib/customSet.js'
import { formatPrice } from '../../lib/format.js'
import { getDefaultSelection } from '../../lib/variants.js'
import { useStore } from '../../store/hooks.js'
import { patchProduct, updateSetBuilder } from '../../store/store.js'
import { useToast } from '../../context/ToastContext.jsx'
import { useUnsavedChanges } from '../components/UnsavedChangesContext.jsx'
import { Card, DemoNote, NumberField, PageHeader, ProductThumb, StatusBadge, TextField, Toggle } from '../components/ui.jsx'
import { deepClone, isEqualJson } from '../lib/listUtils.js'

/** A live example: the first eligible pillow product + the first eligible duvet cover, each in its own default options. */
function PriceCheck({ catalog }) {
  const pick = (roleId) => catalog.products.find((p) => roleForProduct(p)?.id === roleId && p.variants.some((v) => v.stock > 0))
  const pillow = pick('pillow')
  const duvet = pick('duvet')
  if (!pillow || !duvet) return <p className="muted">Add an eligible, in-stock product to each step to see an example.</p>
  // Prefer a King pillow with a Queen duvet cover, to show sizes don't have to match.
  const pillowSel = getDefaultSelection(pillow, { size: pillow.availableSizes.includes('king-pillow') ? 'king-pillow' : undefined })
  const set = resolveSet({ pillow: { productId: pillow.id, selection: pillowSel, quantity: 1 }, duvet: { productId: duvet.id, selection: getDefaultSelection(duvet), quantity: 1 } }, catalog)
  return (
    <div className="adm-stack" style={{ gap: 'var(--space-2)' }}>
      <ul className="adm-list" role="list">
        {set.chosen.map((c) => (
          <li key={c.role}>
            <span className="adm-list__main">
              <strong>{c.roleLabel}:</strong> {c.quantity} × {c.name} <span className="muted">— {c.details}</span>
            </span>
            <span className="price">{formatPrice(c.lineTotal)}</span>
          </li>
        ))}
        <li>
          <span className="adm-list__main">
            <strong>Set total</strong> <span className="muted">(sum of regular prices — no set discount)</span>
          </span>
          <span className="price">{formatPrice(set.total)}</span>
        </li>
      </ul>
      <p className="adm-field__hint">Added to the cart as one “Custom Bedding Set” line containing both items.</p>
    </div>
  )
}

export default function BuildASetPage() {
  const { data, catalog } = useStore()
  const { notify } = useToast()
  const [draft, setDraft] = useState(() => deepClone(data.setBuilder))
  const [saved, setSaved] = useState(() => deepClone(data.setBuilder))
  const dirty = !isEqualJson(draft, saved)
  useUnsavedChanges(dirty)
  const max = Number(draft.roles.pillow.maxQuantity)
  const maxError = Number.isInteger(max) && max >= 1 && max <= 10 ? undefined : 'Choose a whole number from 1 to 10.'

  const setRole = (id, patch) => setDraft((d) => ({ ...d, roles: { ...d.roles, [id]: { ...d.roles[id], ...patch } } }))
  const save = () => {
    if (maxError) return
    const next = { roles: { pillow: { ...draft.roles.pillow, hint: draft.roles.pillow.hint.trim(), maxQuantity: max }, duvet: { ...draft.roles.duvet, hint: draft.roles.duvet.hint.trim(), maxQuantity: 1 } } }
    updateSetBuilder(next)
    setDraft(deepClone(next))
    setSaved(deepClone(next))
    notify({ title: 'Build a Set settings saved', message: 'The set builder uses them right away.' })
  }

  const toggleEligible = (product, on) => {
    const result = patchProduct(product.id, { setEligible: on }, `${on ? 'Made' : 'Removed'} “${product.name}” ${on ? 'eligible for' : 'from'} Build a Set.`)
    if (result.ok) notify({ tone: on ? 'success' : 'info', title: on ? `“${product.name}” can be chosen in Build a Set` : `“${product.name}” removed from Build a Set`, message: on ? undefined : 'It can still be bought on its own.' })
  }

  return (
    <>
      <PageHeader
        title="Build a Set"
        description="Customers pick one Pillows & Pillowcases product and one duvet cover, review them and add the complete set to the cart as one grouped item."
        actions={
          <a href={BUILDER_PATH} target="_blank" rel="noopener noreferrer" className="btn btn--light btn--sm">
            <ExternalLink size={15} aria-hidden="true" /> Open the set builder
          </a>
        }
      />

      <Card title="How custom sets work">
        <ul className="tick-list" role="list">
          <li>Each item keeps its own size, colour and material — a King pillow with a Queen duvet cover is a valid set. There is no matching-size rule.</li>
          <li>Each Pillows &amp; Pillowcases product is one item with one price; its included pillowcase is never a separate product or cart line.</li>
          <li>The set total is always the sum of the items’ regular prices. There is no bundle discount for custom sets.</li>
          <li>The finished set is one cart line (“Custom Bedding Set”) that lists both items.</li>
          <li>Only active, in-stock variants that are offered can be chosen; each product’s own restriction rules apply.</li>
        </ul>
      </Card>

      <div className="adm-grid adm-grid--2">
        <Card title="Steps" description="The wording and limits customers see in the builder.">
          <div className="adm-stack">
            {SET_ROLES.map((role, i) => (
              <div key={role.id} className="adm-stack" style={{ gap: 'var(--space-2)' }}>
                <p className="adm-inline" style={{ margin: 0 }}>
                  <strong>
                    Step {i + 1}: {role.label}
                  </strong>
                  <Link to={collectionPathFor(role, false)} target="_blank" className="muted">
                    /collections/{role.collectionId}
                  </Link>
                </p>
                <TextField label="Hint" value={draft.roles[role.id].hint} onChange={(hint) => setRole(role.id, { hint })} hint="Shown while this step is empty." maxLength={240} />
                {role.id === 'pillow' ? (
                  <NumberField label="Maximum quantity per set" min="1" max="10" step="1" value={draft.roles.pillow.maxQuantity} onChange={(v) => setRole('pillow', { maxQuantity: v })} error={maxError} hint="How many of the chosen pillow product one set can include." />
                ) : (
                  <p className="adm-field__hint">One duvet cover per set (fixed).</p>
                )}
              </div>
            ))}
            <div className="adm-inline">
              <button type="button" className="btn btn--sm" onClick={save} disabled={!dirty || Boolean(maxError)}>
                Save settings
              </button>
              {dirty && (
                <button type="button" className="text-btn" onClick={() => setDraft(deepClone(saved))}>
                  Discard
                </button>
              )}
            </div>
          </div>
        </Card>
        <Card title="Price check" description="A live example built with the current catalog.">
          <PriceCheck catalog={catalog} />
        </Card>
      </div>

      {SET_ROLES.map((role) => {
        const products = data.products.filter((p) => !p.bundle && role.categories.includes(p.category))
        return (
          <Card key={role.id} className="adm-card--flush" title={`${role.label} — eligible products`} description="Switch a product off to keep it out of custom sets (it stays on sale on its own).">
            <div className="adm-table-wrap">
              <table className="adm-table">
                <caption className="visually-hidden">{role.label} products</caption>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Status</th>
                    <th>Sizes</th>
                    <th className="num">Variants</th>
                    <th>In Build a Set</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const processed = catalog.allById[p.id]
                    const usable = processed.isPurchasable
                    return (
                      <tr key={p.id} className={usable && p.setEligible !== false ? '' : 'is-muted'}>
                        <td>
                          <ProductThumb product={p} to={`/admin/products/${p.id}`} meta={processed.categoryName} />
                        </td>
                        <td>
                          <StatusBadge status={p.status} />
                          {p.status === 'active' && !usable && <div className="adm-field__hint">No purchasable variants</div>}
                        </td>
                        <td>{processed.availableSizes.map((s) => processed.optionInfo.size[s]?.name ?? s).join(', ') || '—'}</td>
                        <td className="num">{processed.variants.length}</td>
                        <td>
                          <Toggle size="sm" hideLabel label={`${p.name} available in Build a Set`} checked={p.setEligible !== false} onChange={(on) => toggleEligible(p, on)} />
                        </td>
                      </tr>
                    )
                  })}
                  {!products.length && (
                    <tr>
                      <td colSpan={5} className="muted">
                        No products in this step’s categories yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )
      })}

      <DemoNote>Ready-made bedding sets (the Bedding Sets collection) are separate products with their own optional set saving; they are not affected by these settings.</DemoNote>
    </>
  )
}
