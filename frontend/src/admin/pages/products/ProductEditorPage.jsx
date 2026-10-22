import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CircleAlert, CircleCheck, CopyPlus, ExternalLink, Eye, Info, Plus, Save, Trash2 } from 'lucide-react'
import { CATEGORIES } from '../../../data/catalog.js'
import { buildProduct, listCombinations } from '../../../lib/variants.js'
import { formatPrice, pluralize } from '../../../lib/format.js'
import { useStore } from '../../../store/hooks.js'
import { bundlesUsing, createProduct, deleteProduct, duplicateProduct, findEditableProduct, uniqueProductId, updateProduct } from '../../../store/store.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { useConfirm } from '../../components/ConfirmContext.jsx'
import { useUnsavedChanges, useUnsavedChangesGuard } from '../../components/UnsavedChangesContext.jsx'
import ImageListEditor from '../../components/ImageListEditor.jsx'
import { Card, ErrorSummary, NumberField, PageHeader, ReorderButtons, SelectField, StatusBadge, TextField, Toggle } from '../../components/ui.jsx'
import { deepClone, isEqualJson, moveItem, removeAt, replaceAt, slugify, todayIso } from '../../lib/listUtils.js'
import { STATUS_OPTIONS, blankProduct, defaultCollectionsFor, describeProductChanges, isPillowCategory, setRoleForCategory, toProduct, validateProduct } from '../../lib/productForm.js'
import OptionsEditor from './OptionsEditor.jsx'
import VariantMatrix from './VariantMatrix.jsx'
import ProductPreview from './ProductPreview.jsx'

const SIMPLE_CATEGORIES = CATEGORIES.filter((c) => c.id !== 'bedding-sets')
const sortIds = (ids) => [...ids].sort()

export default function ProductEditorPage() {
  const { productId } = useParams()
  const { data } = useStore()
  const existing = productId ? data.products.find((p) => p.id === productId) : null
  if (productId && !existing) {
    return (
      <div className="adm-card adm-empty">
        <h1 className="adm-page-title">Product not found</h1>
        <p className="muted">It may have been deleted (perhaps in another tab).</p>
        <Link to="/admin/products" className="btn btn--sm">
          Back to products
        </Link>
      </div>
    )
  }
  return <ProductEditor key={productId ?? 'new'} existing={existing} />
}

function ProductEditor({ existing }) {
  const isNew = !existing
  const { data, catalog } = useStore()
  const { notify } = useToast()
  const confirm = useConfirm()
  const { confirmLeave } = useUnsavedChangesGuard()
  const navigate = useNavigate()

  const [initial, setInitial] = useState(() => (existing ? deepClone(existing) : blankProduct({ id: '', today: todayIso() })))
  const [draft, setDraft] = useState(() => deepClone(initial))
  const [initialCollections, setInitialCollections] = useState(() =>
    sortIds(existing ? data.collections.filter((c) => c.productIds.includes(existing.id)).map((c) => c.id) : defaultCollectionsFor(initial.category)),
  )
  const [collectionIds, setCollectionIds] = useState(initialCollections)
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [submitted, setSubmitted] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const dirty = !isEqualJson(draft, initial) || !isEqualJson(sortIds(collectionIds), initialCollections)
  useUnsavedChanges(dirty)

  const threshold = data.settings.inventory.lowStockThreshold
  const normalized = useMemo(() => toProduct(draft), [draft])
  const preview = useMemo(() => buildProduct(normalized, catalog.allById), [normalized, catalog])
  const combos = useMemo(() => (draft.bundle ? [] : listCombinations(normalized)), [draft.bundle, normalized])
  const { errors, warnings } = validateProduct(draft, { products: data.products, previewVariants: draft.bundle ? preview.variants : null })
  const shownErrors = submitted ? errors : {}
  const role = setRoleForCategory(draft.category)
  const savedProcessed = existing ? catalog.allById[existing.id] : null
  const offeredCounts = useMemo(() => {
    const counts = { size: {}, color: {}, material: {} }
    for (const c of combos) if (c.offered) for (const dim of ['size', 'color', 'material']) counts[dim][c[dim]] = (counts[dim][c[dim]] ?? 0) + 1
    return counts
  }, [combos])

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const onName = (name) => setDraft((d) => ({ ...d, name, ...(slugTouched ? {} : { slug: slugify(name) }) }))

  const save = async (statusOverride) => {
    const candidate = statusOverride ? { ...draft, status: statusOverride } : draft
    setSubmitted(true)
    const check = validateProduct(candidate, { products: data.products, previewVariants: candidate.bundle ? buildProduct(toProduct(candidate), catalog.allById).variants : null })
    if (Object.keys(check.errors).length) {
      notify({ tone: 'error', title: 'Please fix the highlighted fields', message: Object.values(check.errors)[0] })
      requestAnimationFrame(() => document.querySelector('.adm-error-summary')?.scrollIntoView({ block: 'center' }))
      return
    }
    setSaving(true)
    const product = toProduct(candidate)
    let result
    if (isNew) {
      product.id = uniqueProductId(product.slug)
      result = createProduct(product, { collectionIds })
    } else {
      const changes = describeProductChanges(existing, product)
      result = updateProduct(existing.id, product, {
        collectionIds,
        message: `Updated “${product.name}”${changes?.length ? ` (${changes.join(', ')})` : ''}.`,
      })
    }
    setSaving(false)
    if (!result.ok) {
      notify({ tone: 'error', title: 'Couldn’t save the product', message: result.error })
      return
    }
    const id = isNew ? result.id : existing.id
    const saved = findEditableProduct(id)
    notify({
      title: isNew ? `Created “${product.name}”` : `Saved “${product.name}”`,
      message: !result.persisted
        ? 'Browser storage is unavailable — this change lasts until you reload.'
        : saved.status === 'active'
          ? 'Live on the storefront now.'
          : `Saved as ${saved.status} — hidden from customers.`,
    })
    if (isNew) {
      setInitial(deepClone(saved))
      setDraft(deepClone(saved))
      setInitialCollections(sortIds(collectionIds))
      navigate(`/admin/products/${id}`, { replace: true })
      return
    }
    setInitial(deepClone(saved))
    setDraft(deepClone(saved))
    setInitialCollections(sortIds(collectionIds))
    setSubmitted(false)
  }

  const discard = async () => {
    const ok = await confirm({ title: 'Discard your changes?', message: 'The product goes back to how it was last saved.', confirmLabel: 'Discard changes', tone: 'danger' })
    if (!ok) return
    setDraft(deepClone(initial))
    setCollectionIds(initialCollections)
    setSubmitted(false)
  }

  const onDelete = async () => {
    const sets = bundlesUsing(existing.id)
    if (sets.length) {
      notify({ tone: 'error', title: 'This product is part of a ready-made set', message: `Remove it from ${sets.map((s) => s.name).join(', ')} first, or archive it instead.` })
      return
    }
    const ok = await confirm({
      title: `Delete “${existing.name}”?`,
      message: 'The product, its variants and stock levels are removed from this browser’s catalog and from every collection. Archive it instead if you may need it again.',
      confirmLabel: 'Delete product',
      tone: 'danger',
    })
    if (!ok) return
    const result = deleteProduct(existing.id)
    if (!result.ok) return notify({ tone: 'error', title: 'Couldn’t delete', message: result.error })
    setInitial(draft) // nothing left to protect
    notify({ title: `Deleted “${existing.name}”` })
    navigate('/admin/products', { replace: true })
  }

  const onDuplicate = async () => {
    if (!(await confirmLeave())) return
    const result = duplicateProduct(existing.id)
    if (!result.ok) return notify({ tone: 'error', title: 'Couldn’t duplicate', message: result.error })
    notify({ title: `Duplicated “${existing.name}”`, message: 'The copy is a draft — edit it, then set it to Active.' })
    navigate(`/admin/products/${result.id}`)
  }

  const sectionError = (prefixes) => Object.keys(shownErrors).some((k) => prefixes.some((p) => k === p || k.startsWith(`${p}.`)))
  const sections = [
    { id: 'general', label: 'General', error: sectionError(['name', 'slug', 'category', 'skuPrefix', 'description']) },
    { id: 'status', label: 'Status & visibility', error: sectionError(['createdAt']) },
    { id: 'media', label: 'Images', error: sectionError(['images']) },
    ...(draft.bundle
      ? [{ id: 'bundle', label: 'Set contents', error: sectionError(['bundle', 'discount']) }]
      : [
          { id: 'sizes', label: 'Sizes', error: sectionError(['size']) },
          { id: 'colours', label: 'Colours', error: sectionError(['color']) },
          { id: 'materials', label: 'Materials', error: sectionError(['material', 'pricing']) },
        ]),
    { id: 'variants', label: 'Variants & inventory', error: sectionError(['variant', 'variants', 'defaultStock', 'rule']) },
    { id: 'details', label: 'Product information', error: sectionError(['spec', 'rating', 'ratingCount']) },
    { id: 'collections', label: 'Collections', error: false },
  ]

  return (
    <>
      <PageHeader
        title={isNew ? 'New product' : existing.name}
        description={
          isNew
            ? 'Fill in the details, add its own sizes, colours and materials, then save it as a draft or publish it.'
            : `/products/${existing.slug} · ${preview.categoryName}${existing.bundle ? ' · Ready-made set' : ''}`
        }
        actions={
          <>
            {!isNew && <StatusBadge status={existing.status} />}
            <button type="button" className="btn btn--light btn--sm" onClick={() => setPreviewOpen(true)}>
              <Eye size={15} aria-hidden="true" /> Preview
            </button>
            {savedProcessed?.isPurchasable && (
              <a href={`/products/${existing.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn--light btn--sm">
                <ExternalLink size={15} aria-hidden="true" /> View in store
              </a>
            )}
            {!isNew && (
              <>
                <button type="button" className="btn btn--light btn--sm" onClick={onDuplicate}>
                  <CopyPlus size={15} aria-hidden="true" /> Duplicate
                </button>
                <button type="button" className="btn btn--light btn--sm" onClick={onDelete}>
                  <Trash2 size={15} aria-hidden="true" /> Delete
                </button>
              </>
            )}
          </>
        }
      />

      {submitted && <ErrorSummary errors={errors} />}
      {warnings.map((w) => (
        <p key={w} className="adm-note adm-note--warning">
          <CircleAlert size={15} aria-hidden="true" /> {w}
        </p>
      ))}

      <div className="adm-editor">
        <nav className="adm-editor__nav" aria-label="Product sections">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={s.error ? 'has-error' : ''}>
              {s.label}
              {s.error && <span className="visually-hidden"> (has errors)</span>}
            </a>
          ))}
        </nav>

        <div className="adm-editor__main">
          {/* ── General ─────────────────────────────────────── */}
          <Card id="general" title="General">
            <div className="adm-form-grid">
              <TextField label="Product name" value={draft.name} onChange={onName} error={shownErrors.name} required maxLength={120} />
              <TextField
                label="URL slug"
                value={draft.slug}
                onChange={(v) => {
                  setSlugTouched(true)
                  set({ slug: v.toLowerCase().replace(/\s+/g, '-') })
                }}
                error={shownErrors.slug}
                required
                hint={`Product page: /products/${draft.slug || '…'}`}
              />
              {isNew ? (
                <SelectField
                  label="Product type"
                  value={draft.bundle ? 'bundle' : 'single'}
                  onChange={(type) => {
                    const fresh = blankProduct({ id: '', type, category: type === 'bundle' ? 'bedding-sets' : 'duvet-covers', today: draft.createdAt })
                    setDraft({ ...fresh, name: draft.name, slug: draft.slug, tagline: draft.tagline, description: draft.description, images: draft.images, imageAlts: draft.imageAlts })
                    setCollectionIds(defaultCollectionsFor(fresh.category))
                  }}
                  options={[
                    { value: 'single', label: 'Single item (own sizes, colours & materials)' },
                    { value: 'bundle', label: 'Ready-made set (made of other products)' },
                  ]}
                />
              ) : (
                <div className="adm-field">
                  <span className="adm-field__label">Product type</span>
                  <span>{draft.bundle ? 'Ready-made set (made of other products)' : 'Single item'}</span>
                </div>
              )}
              {draft.bundle ? (
                <div className="adm-field">
                  <span className="adm-field__label">Category</span>
                  <span>Bedding Sets</span>
                </div>
              ) : (
                <SelectField
                  label="Category"
                  value={draft.category}
                  onChange={(category) => {
                    set({ category })
                    if (isNew) setCollectionIds(defaultCollectionsFor(category))
                  }}
                  options={SIMPLE_CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
                  error={shownErrors.category}
                  hint={role ? `Build a Set role: ${role.label}` : 'Not used by Build a Set'}
                />
              )}
              <div className="adm-form-grid__full">
                <TextField label="Tagline" value={draft.tagline} onChange={(v) => set({ tagline: v })} hint="One line under the name on cards and the product page." maxLength={200} />
              </div>
              <div className="adm-form-grid__full">
                <TextField label="Description" multiline rows={5} value={draft.description} onChange={(v) => set({ description: v })} error={shownErrors.description} />
              </div>
              <TextField
                label="SKU prefix"
                value={draft.skuPrefix}
                onChange={(v) => set({ skuPrefix: v.toUpperCase() })}
                error={shownErrors.skuPrefix}
                placeholder={(draft.id || draft.slug || 'PRODUCT').toUpperCase()}
                hint="Variant SKUs are prefix-material-colour-size."
              />
            </div>
            {isPillowCategory(draft.category) && (
              <p className="adm-note" style={{ marginTop: 'var(--space-4)' }}>
                <Info size={15} aria-hidden="true" />
                <span>
                  Pillows &amp; Pillowcases products are sold as <strong>one item</strong>: whatever is included (e.g. a pillow with its pillowcase, or a pair of pillowcases) has one price, one
                  stock level and one cart line. Describe what’s included under Product information → Specifications.
                </span>
              </p>
            )}
          </Card>

          {/* ── Status ──────────────────────────────────────── */}
          <Card id="status" title="Status & visibility" description="Only Active products appear on the storefront and can be bought.">
            <fieldset className="adm-stack" style={{ border: 0, padding: 0, margin: 0, gap: 'var(--space-2)' }}>
              <legend className="adm-field__label" style={{ marginBottom: 'var(--space-2)' }}>
                Status
              </legend>
              {STATUS_OPTIONS.map((o) => (
                <label key={o.value} className="checkbox">
                  <input type="radio" name="status" value={o.value} checked={draft.status === o.value} onChange={() => set({ status: o.value })} />
                  <span>{o.label}</span>
                </label>
              ))}
            </fieldset>
            <hr className="adm-sep" />
            <div className="adm-form-grid">
              <Toggle checked={draft.featured} onChange={(v) => set({ featured: v })} label="Featured" description="Listed under Featured on the homepage and first in “Featured” sorting." />
              <Toggle checked={draft.isNew} onChange={(v) => set({ isNew: v })} label="New Arrival" description="Shows a “New” badge and appears under New Arrivals." />
              <Toggle checked={draft.bestSeller} onChange={(v) => set({ bestSeller: v })} label="Best Seller" description="Appears under Best Sellers." />
              {role && !draft.bundle && (
                <Toggle
                  checked={draft.setEligible !== false}
                  onChange={(v) => set({ setEligible: v })}
                  label={`Available in Build a Set (${role.label})`}
                  description="When off, it can still be bought on its own but can’t be chosen for a custom set."
                />
              )}
              <TextField label="Date added" type="date" value={draft.createdAt.slice(0, 10)} onChange={(v) => set({ createdAt: v })} error={shownErrors.createdAt} hint="Used by the “Newest” sort." />
            </div>
          </Card>

          {/* ── Media ───────────────────────────────────────── */}
          <Card id="media" title="Images" description="The default gallery. The first image is the main one; colours can have their own galleries under Colours.">
            <ImageListEditor
              label="Product images"
              images={draft.images}
              onChange={(images) => set({ images })}
              alts={draft.imageAlts}
              onAltsChange={(imageAlts) => set({ imageAlts })}
              emptyHint="Add at least one image before publishing."
            />
            {shownErrors.images && <p className="adm-field__error">{shownErrors.images}</p>}
          </Card>

          {/* ── Options ─────────────────────────────────────── */}
          {draft.bundle ? (
            <BundleSection draft={draft} onChange={setDraft} errors={shownErrors} products={data.products} preview={preview} />
          ) : (
            <>
              <Card id="sizes" title="Sizes" description="This product’s own sizes and base prices. Other products are not affected.">
                <OptionsEditor dimension="size" draft={draft} onChange={setDraft} errors={shownErrors} variantCounts={offeredCounts.size} />
              </Card>
              <Card id="colours" title="Colours" description="This product’s own colours, with a live swatch and optional colour-specific images.">
                <OptionsEditor dimension="color" draft={draft} onChange={setDraft} errors={shownErrors} variantCounts={offeredCounts.color} />
              </Card>
              <Card id="materials" title="Materials" description="This product’s own materials. A surcharge is added to every size price for that material.">
                <OptionsEditor dimension="material" draft={draft} onChange={setDraft} errors={shownErrors} variantCounts={offeredCounts.material} />
                {shownErrors.pricing && <p className="adm-field__error">{shownErrors.pricing}</p>}
              </Card>
            </>
          )}

          {/* ── Variants ────────────────────────────────────── */}
          <Card
            id="variants"
            title="Variants & inventory"
            description={
              draft.bundle
                ? 'A ready-made set’s variants, prices and stock come from the products it contains.'
                : `${pluralize(preview.variants.length, 'purchasable variant')} · ${preview.variants.length ? `${formatPrice(preview.priceRange.min)}–${formatPrice(preview.priceRange.max)}` : 'no price yet'}`
            }
          >
            {draft.bundle ? (
              <BundleVariants preview={preview} />
            ) : (
              <VariantMatrix draft={draft} onChange={setDraft} combos={combos} errors={shownErrors} threshold={threshold} />
            )}
            {shownErrors.variants && <p className="adm-field__error">{shownErrors.variants}</p>}
          </Card>

          {/* ── Details ─────────────────────────────────────── */}
          <DetailsSection draft={draft} onChange={setDraft} errors={shownErrors} products={data.products} />

          {/* ── Collections ─────────────────────────────────── */}
          <Card id="collections" title="Collections" description="Choose where this product is listed. Products are only added to the collections you tick.">
            <ul className="adm-stack" role="list" style={{ gap: 'var(--space-2)' }}>
              {data.collections.map((c) => (
                <li key={c.id}>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={collectionIds.includes(c.id)}
                      onChange={(e) => setCollectionIds((ids) => (e.target.checked ? [...ids, c.id] : ids.filter((x) => x !== c.id)))}
                    />
                    <span>
                      {c.title} <span className="muted">/collections/{c.id}</span>
                    </span>
                    {!c.enabled && <StatusBadge status="disabled" />}
                  </label>
                </li>
              ))}
            </ul>
          </Card>

          <div className="adm-savebar">
            <span className={`adm-savebar__status ${dirty ? 'is-dirty' : ''}`} role="status">
              {dirty ? <CircleAlert size={15} aria-hidden="true" /> : <CircleCheck size={15} aria-hidden="true" />}
              {dirty ? 'Unsaved changes' : isNew ? 'Not saved yet' : 'All changes saved'}
            </span>
            <div className="adm-savebar__actions">
              {dirty && !isNew && (
                <button type="button" className="btn btn--light btn--sm" onClick={discard}>
                  Discard
                </button>
              )}
              <button type="button" className="btn btn--outline btn--sm" onClick={() => save('draft')} disabled={saving}>
                Save as draft
              </button>
              <button type="button" className="btn btn--sm" onClick={() => save()} disabled={saving || (!dirty && !isNew)}>
                <Save size={15} aria-hidden="true" /> {draft.status === 'active' ? (existing?.status === 'active' ? 'Save changes' : 'Save & publish') : `Save (${draft.status})`}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ProductPreview product={preview} open={previewOpen} onClose={() => setPreviewOpen(false)} unsaved={dirty || isNew} />
    </>
  )
}

// ─── Ready-made set contents ─────────────────────────────────────────────────

function BundleSection({ draft, onChange, errors, products, preview }) {
  const components = draft.bundle.components
  const candidates = products.filter((p) => !p.bundle && p.id !== draft.id)
  const setComponents = (next) => onChange({ ...draft, bundle: { ...draft.bundle, components: next } })
  return (
    <Card id="bundle" title="Set contents" description="A ready-made set is sold as one product. Its options come from the first item; each combination exists only when every item has it.">
      <ul className="adm-ordered" role="list">
        {components.map((c, i) => (
          <li key={i}>
            <span className="adm-ordered__pos">{i + 1}</span>
            <span className="adm-ordered__main adm-inline">
              <label className="visually-hidden" htmlFor={`bundle-${i}`}>
                Item {i + 1}
              </label>
              <select id={`bundle-${i}`} className="select" style={{ flex: 1, minWidth: 200 }} value={c.productId} onChange={(e) => setComponents(replaceAt(components, i, { ...c, productId: e.target.value }))}>
                <option value="">— Choose a product —</option>
                {candidates.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.status !== 'active' ? ` (${p.status})` : ''}
                  </option>
                ))}
              </select>
              <label className="adm-inline">
                <span className="muted">Qty</span>
                <input className="input adm-stock-input" type="number" min="1" max="10" step="1" value={c.quantity} onChange={(e) => setComponents(replaceAt(components, i, { ...c, quantity: e.target.value }))} aria-label={`Quantity of item ${i + 1}`} />
              </label>
              {(errors[`bundle.${i}`] || errors[`bundle.${i}.quantity`]) && <span className="adm-field__error">{errors[`bundle.${i}`] ?? errors[`bundle.${i}.quantity`]}</span>}
            </span>
            <ReorderButtons index={i} count={components.length} label={`item ${i + 1}`} onMove={(from, to) => setComponents(moveItem(components, from, to))} onRemove={(index) => setComponents(removeAt(components, index))} />
          </li>
        ))}
        {!components.length && <li className="muted">No items yet.</li>}
      </ul>
      {errors.bundle && <p className="adm-field__error">{errors.bundle}</p>}
      <div style={{ margin: 'var(--space-3) 0' }}>
        <button type="button" className="btn btn--light btn--sm" onClick={() => setComponents([...components, { productId: '', quantity: 1 }])} disabled={components.length >= 10}>
          <Plus size={14} aria-hidden="true" /> Add item
        </button>
      </div>
      <div className="adm-form-grid">
        <NumberField
          label="Ready-made set saving (%)"
          min="0"
          max="90"
          step="1"
          value={draft.bundle.discountPercent}
          onChange={(v) => onChange({ ...draft, bundle: { ...draft.bundle, discountPercent: v } })}
          error={errors.discount}
          hint="Applies to this ready-made set only. Custom sets from Build a Set never get a discount."
        />
        <div className="adm-field">
          <span className="adm-field__label">Derived options</span>
          <span className="muted">
            {pluralize(preview.availableSizes.length, 'size')} · {pluralize(preview.availableMaterials.length, 'material')} · {pluralize(preview.availableColors.length, 'colour')}
          </span>
        </div>
      </div>
    </Card>
  )
}

function BundleVariants({ preview }) {
  if (!preview.variants.length) return <p className="adm-note adm-note--warning">No combination is shared by every item (or an item isn’t active), so this set can’t be sold yet.</p>
  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <caption className="visually-hidden">Ready-made set variants</caption>
        <thead>
          <tr>
            <th>Variant</th>
            <th className="num">Separately</th>
            <th className="num">Set price</th>
            <th className="num">Stock (derived)</th>
          </tr>
        </thead>
        <tbody>
          {preview.variants.slice(0, 60).map((v) => (
            <tr key={v.key}>
              <td>
                {[v.size, v.material, v.color].map((id, i) => preview.optionInfo[['size', 'material', 'color'][i]][id]?.name ?? id).join(' / ')}
              </td>
              <td className="num">{v.compareAtPrice ? formatPrice(v.compareAtPrice) : '—'}</td>
              <td className="num">{formatPrice(v.price)}</td>
              <td className="num">{v.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {preview.variants.length > 60 && <p className="adm-field__hint">Showing 60 of {preview.variants.length} variants.</p>}
    </div>
  )
}

// ─── Specs, care, related, rating ────────────────────────────────────────────

function DetailsSection({ draft, onChange, errors, products }) {
  const set = (patch) => onChange({ ...draft, ...patch })
  const [related, setRelated] = useState('')
  const options = products.filter((p) => p.id !== draft.id && !draft.relatedProducts.includes(p.id))
  return (
    <Card id="details" title="Product information" description="Specifications, care instructions and related products shown on the product page.">
      <div className="adm-stack">
        <div className="adm-stack" style={{ gap: 'var(--space-2)' }}>
          <span className="adm-field__label">Specifications</span>
          {draft.specs.map(([k, v], i) => (
            <div key={i} className="adm-inline">
              <input className="input" style={{ maxWidth: 200 }} value={k} placeholder="Label (e.g. Includes)" aria-label={`Specification ${i + 1} label`} onChange={(e) => set({ specs: replaceAt(draft.specs, i, [e.target.value, v]) })} />
              <input className="input" value={v} placeholder="Value" aria-label={`Specification ${i + 1} value`} onChange={(e) => set({ specs: replaceAt(draft.specs, i, [k, e.target.value]) })} />
              <ReorderButtons index={i} count={draft.specs.length} label={`specification ${i + 1}`} onMove={(from, to) => set({ specs: moveItem(draft.specs, from, to) })} onRemove={(index) => set({ specs: removeAt(draft.specs, index) })} />
              {errors[`spec.${i}`] && <span className="adm-field__error">{errors[`spec.${i}`]}</span>}
            </div>
          ))}
          <div>
            <button type="button" className="btn btn--light btn--sm" onClick={() => set({ specs: [...draft.specs, ['', '']] })}>
              <Plus size={14} aria-hidden="true" /> Add specification
            </button>
          </div>
        </div>

        <div className="adm-stack" style={{ gap: 'var(--space-2)' }}>
          <span className="adm-field__label">Care instructions</span>
          {draft.care.map((c, i) => (
            <div key={i} className="adm-inline">
              <input className="input" value={c} aria-label={`Care instruction ${i + 1}`} onChange={(e) => set({ care: replaceAt(draft.care, i, e.target.value) })} />
              <ReorderButtons index={i} count={draft.care.length} label={`care instruction ${i + 1}`} onMove={(from, to) => set({ care: moveItem(draft.care, from, to) })} onRemove={(index) => set({ care: removeAt(draft.care, index) })} />
            </div>
          ))}
          <div>
            <button type="button" className="btn btn--light btn--sm" onClick={() => set({ care: [...draft.care, ''] })}>
              <Plus size={14} aria-hidden="true" /> Add care instruction
            </button>
          </div>
        </div>

        <div className="adm-stack" style={{ gap: 'var(--space-2)' }}>
          <span className="adm-field__label">Related products (“You may also like”)</span>
          <ul className="adm-ordered" role="list">
            {draft.relatedProducts.map((id, i) => (
              <li key={id}>
                <span className="adm-ordered__pos">{i + 1}</span>
                <span className="adm-ordered__main">{products.find((p) => p.id === id)?.name ?? id}</span>
                <ReorderButtons
                  index={i}
                  count={draft.relatedProducts.length}
                  label="related product"
                  onMove={(from, to) => set({ relatedProducts: moveItem(draft.relatedProducts, from, to) })}
                  onRemove={(index) => set({ relatedProducts: removeAt(draft.relatedProducts, index) })}
                />
              </li>
            ))}
            {!draft.relatedProducts.length && <li className="muted">None.</li>}
          </ul>
          <div className="adm-inline">
            <label className="visually-hidden" htmlFor="related-add">
              Add a related product
            </label>
            <select id="related-add" className="select" style={{ maxWidth: 320 }} value={related} onChange={(e) => setRelated(e.target.value)}>
              <option value="">— Choose a product —</option>
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn--light btn--sm"
              disabled={!related || draft.relatedProducts.length >= 12}
              onClick={() => {
                set({ relatedProducts: [...draft.relatedProducts, related] })
                setRelated('')
              }}
            >
              <Plus size={14} aria-hidden="true" /> Add
            </button>
          </div>
        </div>

        <div className="adm-form-grid">
          <NumberField label="Sample rating (0–5)" min="0" max="5" step="0.1" value={draft.rating.average} onChange={(v) => set({ rating: { ...draft.rating, average: v } })} error={errors.rating} hint="Demo content, labelled “Sample ratings” on the storefront. Hidden when the count is 0." />
          <NumberField label="Sample review count" min="0" step="1" value={draft.rating.count} onChange={(v) => set({ rating: { ...draft.rating, count: v } })} error={errors.ratingCount} />
        </div>
      </div>
    </Card>
  )
}
