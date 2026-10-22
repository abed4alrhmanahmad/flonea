import { useMemo, useState } from 'react'
import { ExternalLink, FolderPlus, Pencil, Plus, Trash2 } from 'lucide-react'
import Drawer from '../../components/ui/Drawer.jsx'
import Img from '../../components/ui/Img.jsx'
import { isImageRef } from '../../data/images.js'
import { SET_ROLES } from '../../data/setBuilder.js'
import { useStore } from '../../store/hooks.js'
import { deleteCollection, saveCollection } from '../../store/store.js'
import { useToast } from '../../context/ToastContext.jsx'
import { useConfirm } from '../components/ConfirmContext.jsx'
import { useUnsavedChanges } from '../components/UnsavedChangesContext.jsx'
import ImagePicker from '../components/ImagePicker.jsx'
import { Card, ErrorSummary, PageHeader, ProductThumb, ReorderButtons, SearchInput, StatusBadge, TextField, Toggle } from '../components/ui.jsx'
import { deepClone, isEqualJson, moveItem, removeAt, slugify } from '../lib/listUtils.js'
import { SLUG_PATTERN } from '../lib/productForm.js'

const SET_COLLECTIONS = SET_ROLES.map((r) => r.collectionId)
const RESERVED = new Set(['new', 'all', 'shop'])

function validateCollection(c, { collections, previousId, isNew }) {
  const errors = {}
  if (!c.title.trim()) errors.title = 'Enter a collection name.'
  else if (c.title.length > 80) errors.title = 'Keep the name under 80 characters.'
  if (!SLUG_PATTERN.test(c.id)) errors.id = 'Use lowercase letters, numbers and single hyphens (e.g. summer-linen).'
  else if (RESERVED.has(c.id)) errors.id = 'This slug is reserved.'
  else if (collections.some((x) => x.id === c.id && (isNew || x.id !== previousId))) errors.id = 'Another collection already uses this slug.'
  if (c.image && !isImageRef(c.image)) errors.image = 'Choose a library image or a valid image URL.'
  if (c.subtitle.length > 300) errors.subtitle = 'Keep the description under 300 characters.'
  return errors
}

function CollectionEditor({ collection, isNew, onClose }) {
  const { data, catalog } = useStore()
  const { notify } = useToast()
  const confirm = useConfirm()
  const [initial] = useState(() => deepClone(collection))
  const [draft, setDraft] = useState(() => deepClone(collection))
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [submitted, setSubmitted] = useState(false)
  const [query, setQuery] = useState('')
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState([])
  const core = !isNew && catalog.collectionsById[initial.id]?.core
  const feedsBuilder = SET_COLLECTIONS.includes(initial.id)
  const dirty = !isEqualJson(draft, initial)
  useUnsavedChanges(dirty)

  const errors = validateCollection(draft, { collections: data.collections, previousId: initial.id, isNew })
  const shown = submitted ? errors : {}
  const productsById = Object.fromEntries(data.products.map((p) => [p.id, p]))
  const available = data.products.filter((p) => !draft.productIds.includes(p.id) && (!query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase())))
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const close = async () => {
    if (dirty && !(await confirm({ title: 'Discard changes to this collection?', message: 'Your edits haven’t been saved.', confirmLabel: 'Discard', tone: 'danger' }))) return
    onClose()
  }

  const save = () => {
    setSubmitted(true)
    if (Object.keys(errors).length) return
    const clean = { ...draft, title: draft.title.trim(), subtitle: draft.subtitle.trim() }
    const result = saveCollection(clean, { isNew, previousId: initial.id })
    if (!result.ok) return notify({ tone: 'error', title: 'Couldn’t save the collection', message: result.error })
    notify({ title: `${isNew ? 'Created' : 'Saved'} “${clean.title}”`, message: clean.enabled ? `Live at /collections/${clean.id}` : 'Disabled — hidden from customers.' })
    onClose()
  }

  const remove = async () => {
    const ok = await confirm({
      title: `Delete “${initial.title}”?`,
      message: 'The collection page and its product list are removed. The products themselves are not deleted. Homepage cards pointing to it are removed too.',
      confirmLabel: 'Delete collection',
      tone: 'danger',
    })
    if (!ok) return
    const result = deleteCollection(initial.id)
    if (!result.ok) return notify({ tone: 'error', title: 'Couldn’t delete', message: result.error })
    notify({ title: `Deleted “${initial.title}”` })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={close}
      title={isNew ? 'New collection' : `Edit collection: ${initial.title}`}
      side="right"
      className="adm-drawer adm-drawer--wide"
      footer={
        <>
          {!isNew && !core && (
            <button type="button" className="btn btn--light btn--sm" onClick={remove} style={{ marginRight: 'auto' }}>
              <Trash2 size={14} aria-hidden="true" /> Delete
            </button>
          )}
          <button type="button" className="btn btn--light btn--sm" onClick={close}>
            Cancel
          </button>
          <button type="button" className="btn btn--sm" onClick={save}>
            {isNew ? 'Create collection' : 'Save collection'}
          </button>
        </>
      }
    >
      {submitted && <ErrorSummary errors={errors} />}
      <div className="adm-form-grid">
        <TextField
          label="Name"
          value={draft.title}
          required
          error={shown.title}
          onChange={(title) => set({ title, ...(slugTouched ? {} : { id: slugify(title) }) })}
        />
        <TextField
          label="URL slug"
          value={draft.id}
          required
          error={shown.id}
          disabled={core}
          onChange={(v) => {
            setSlugTouched(true)
            set({ id: v.toLowerCase().replace(/\s+/g, '-') })
          }}
          hint={core ? 'Core collection — its URL is linked across the storefront and can’t change.' : `Page: /collections/${draft.id || '…'}${!isNew && draft.id !== initial.id ? ' · update any navigation links to the old URL' : ''}`}
        />
        <div className="adm-form-grid__full">
          <TextField label="Description" multiline rows={2} value={draft.subtitle} error={shown.subtitle} onChange={(subtitle) => set({ subtitle })} hint="Shown under the name in the collection banner." />
        </div>
        <div className="adm-form-grid__full">
          <ImagePicker label="Banner image" value={draft.image} onChange={(image) => set({ image })} error={shown.image} />
        </div>
        <Toggle
          checked={draft.enabled}
          onChange={(enabled) => set({ enabled })}
          disabled={core}
          label="Enabled"
          description={core ? (feedsBuilder ? 'Always on: this collection is a step of Build a Set and is linked across the site.' : 'Always on: this page is linked across the site.') : 'When off, the page shows “not found” and the collection is hidden.'}
        />
        <Toggle checked={draft.listed} onChange={(listed) => set({ listed })} label="Show in collection navigation" description="The collection links above product listings." />
      </div>

      <section className="adm-stack" aria-labelledby="col-products">
        <div className="adm-card__head" style={{ marginBottom: 0 }}>
          <div>
            <h3 id="col-products" className="adm-card__title">
              Products ({draft.productIds.length})
            </h3>
            <p className="adm-card__desc">Shown in this order (the default “Featured” sort). Only active products are visible to customers.</p>
          </div>
          <button type="button" className="btn btn--light btn--sm" onClick={() => setPicking((p) => !p)} aria-expanded={picking}>
            <Plus size={14} aria-hidden="true" /> Add products
          </button>
        </div>

        {picking && (
          <div className="adm-picker adm-card" style={{ padding: 'var(--space-3)' }}>
            <SearchInput value={query} onChange={setQuery} placeholder="Search products to add" label="Search products to add" />
            <ul className="adm-picker__list" role="list">
              {available.map((p) => (
                <li key={p.id}>
                  <label className="adm-picker__item">
                    <input type="checkbox" checked={picked.includes(p.id)} onChange={(e) => setPicked((ids) => (e.target.checked ? [...ids, p.id] : ids.filter((x) => x !== p.id)))} />
                    <ProductThumb product={p} meta={`${catalog.allById[p.id]?.categoryName} · ${p.status}`} />
                  </label>
                </li>
              ))}
              {!available.length && <li className="adm-picker__item muted">No more products to add.</li>}
            </ul>
            <div className="adm-inline">
              <button
                type="button"
                className="btn btn--sm"
                disabled={!picked.length}
                onClick={() => {
                  set({ productIds: [...draft.productIds, ...picked] })
                  setPicked([])
                  setPicking(false)
                }}
              >
                Add {picked.length || ''} selected
              </button>
              <button type="button" className="text-btn" onClick={() => setPicking(false)}>
                Close
              </button>
            </div>
          </div>
        )}

        {draft.productIds.length ? (
          <ol className="adm-ordered" role="list">
            {draft.productIds.map((id, i) => {
              const p = productsById[id]
              return (
                <li key={id}>
                  <span className="adm-ordered__pos">{i + 1}</span>
                  <span className="adm-ordered__main">
                    <ProductThumb product={p} meta={p ? `${catalog.allById[id]?.categoryName}` : 'Missing product'} />
                  </span>
                  {p && p.status !== 'active' && <StatusBadge status={p.status} />}
                  <ReorderButtons index={i} count={draft.productIds.length} label={p?.name ?? id} removeLabel={`Remove ${p?.name ?? id} from this collection`} onMove={(from, to) => set({ productIds: moveItem(draft.productIds, from, to) })} onRemove={(index) => set({ productIds: removeAt(draft.productIds, index) })} />
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="muted">No products in this collection yet.</p>
        )}
      </section>
    </Drawer>
  )
}

const blankCollection = () => ({ id: '', title: '', subtitle: '', image: 'heroRoom', enabled: true, listed: true, productIds: [] })

export default function CollectionsPage() {
  const { data, catalog } = useStore()
  const [editing, setEditing] = useState(null) // { collection, isNew }
  const [query, setQuery] = useState('')
  const list = useMemo(() => data.collections.filter((c) => !query.trim() || `${c.title} ${c.id}`.toLowerCase().includes(query.trim().toLowerCase())), [data.collections, query])

  return (
    <>
      <PageHeader
        title="Collections"
        description="Collection pages (/collections/…), their banners and which products they list, in order. Products are never added to a collection automatically."
        actions={
          <button type="button" className="btn btn--sm" onClick={() => setEditing({ collection: blankCollection(), isNew: true })}>
            <FolderPlus size={15} aria-hidden="true" /> Add collection
          </button>
        }
      />

      <Card className="adm-card--flush">
        <div className="adm-card__head" style={{ marginBottom: 0 }}>
          <SearchInput value={query} onChange={setQuery} placeholder="Search collections" label="Search collections" />
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <caption className="visually-hidden">Collections</caption>
            <thead>
              <tr>
                <th>Collection</th>
                <th>URL</th>
                <th className="num">Products</th>
                <th>Status</th>
                <th>Navigation</th>
                <th className="actions">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const processed = catalog.collectionsById[c.id]
                return (
                  <tr key={c.id} className={c.enabled ? '' : 'is-muted'}>
                    <td>
                      <span className="adm-thumb">
                        <Img name={c.image} alt="" ratio="4 / 3" sizes="64px" className="adm-thumb__img" />
                        <span className="adm-thumb__text">
                          <button type="button" className="adm-thumb__name text-btn" style={{ textAlign: 'left', padding: 0, textDecoration: 'none', color: 'var(--text)' }} onClick={() => setEditing({ collection: c, isNew: false })}>
                            {c.title}
                          </button>
                          <span className="adm-thumb__meta">
                            {processed?.core ? 'Core collection' : 'Custom collection'}
                            {SET_COLLECTIONS.includes(c.id) && ' · Build a Set step'}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <code className="adm-code">/collections/{c.id}</code>
                    </td>
                    <td className="num">
                      {processed?.products.length ?? 0}
                      <span className="muted"> / {c.productIds.length}</span>
                    </td>
                    <td>
                      <StatusBadge status={c.enabled ? 'enabled' : 'disabled'} />
                    </td>
                    <td>{c.listed ? 'Listed' : <span className="muted">Hidden</span>}</td>
                    <td className="actions">
                      {c.enabled && (
                        <a href={`/collections/${c.id}`} target="_blank" rel="noopener noreferrer" className="adm-icon-btn" aria-label={`View ${c.title} on the storefront`} title="View on storefront">
                          <ExternalLink size={15} />
                        </a>
                      )}
                      <button type="button" className="adm-icon-btn" onClick={() => setEditing({ collection: c, isNew: false })} aria-label={`Edit ${c.title}`} title="Edit">
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="adm-table-foot">
          <span>“Products” counts the active products customers can see, out of all products listed.</span>
        </div>
      </Card>

      {editing && <CollectionEditor key={editing.collection.id || 'new'} collection={editing.collection} isNew={editing.isNew} onClose={() => setEditing(null)} />}
    </>
  )
}
