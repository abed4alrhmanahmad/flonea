import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, CopyPlus, Eye, PackageOpen, Pencil, Plus, Trash2 } from 'lucide-react'
import EmptyState from '../../../components/ui/EmptyState.jsx'
import { CATEGORIES } from '../../../data/catalog.js'
import { formatPriceRange } from '../../../lib/format.js'
import { useStore } from '../../../store/hooks.js'
import { bundlesUsing, deleteProduct, duplicateProduct, patchProduct } from '../../../store/store.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { useConfirm } from '../../components/ConfirmContext.jsx'
import { Card, PageHeader, ProductThumb, SearchInput, StatusBadge } from '../../components/ui.jsx'
import { inventoryRows } from '../../lib/inventory.js'
import { timeAgo } from '../../lib/listUtils.js'
import ProductPreview from './ProductPreview.jsx'

const SORTS = {
  name: (a, b) => a.product.name.localeCompare(b.product.name),
  price: (a, b) => a.processed.priceRange.min - b.processed.priceRange.min,
  inventory: (a, b) => a.units - b.units,
  updated: (a, b) => (a.product.updatedAt ?? '').localeCompare(b.product.updatedAt ?? ''),
}
const FLAGS = [
  { key: 'featured', label: 'Featured' },
  { key: 'isNew', label: 'New' },
  { key: 'bestSeller', label: 'Best seller' },
]

function SortHeader({ id, label, sort, onSort, className }) {
  const active = sort.by === id
  return (
    <th className={className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
      <button type="button" className="adm-sort" onClick={() => onSort(id)}>
        {label}
        {active && (sort.dir === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />)}
      </button>
    </th>
  )
}

export default function ProductsPage() {
  const { data, catalog } = useStore()
  const { notify } = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [availability, setAvailability] = useState('all')
  const [stock, setStock] = useState('all')
  const [sort, setSort] = useState({ by: 'name', dir: 'asc' })
  const [previewId, setPreviewId] = useState(null)
  const threshold = data.settings.inventory.lowStockThreshold

  const rows = useMemo(() => {
    const variantRows = inventoryRows(data.products, catalog.allById, threshold)
    return data.products.map((product) => {
      const processed = catalog.allById[product.id]
      const own = variantRows.filter((r) => r.productId === product.id && r.offered)
      // Ready-made sets: stock is derived from their products.
      const variants = product.bundle ? processed.variants : own
      const units = variants.reduce((s, v) => s + v.stock, 0)
      const low = variants.filter((v) => v.stock > 0 && v.stock <= threshold).length
      const out = variants.filter((v) => v.stock <= 0).length
      const stockState = !variants.length ? 'none' : out === variants.length ? 'out' : low || out ? 'low' : 'in'
      return { product, processed, units, low, out, variantCount: variants.length, stockState }
    })
  }, [data.products, catalog, threshold])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = rows.filter(({ product, processed, stockState }) => {
      if (q && ![product.name, product.slug, product.id, product.skuPrefix, product.tagline].join(' ').toLowerCase().includes(q)) return false
      if (category !== 'all' && product.category !== category) return false
      if (status !== 'all' && product.status !== status) return false
      if (availability === 'purchasable' && !processed.isPurchasable) return false
      if (availability === 'hidden' && processed.isPurchasable) return false
      if (stock === 'low' && stockState !== 'low') return false
      if (stock === 'out' && stockState !== 'out') return false
      if (stock === 'in' && stockState !== 'in') return false
      return true
    })
    const sorted = [...list].sort(SORTS[sort.by])
    return sort.dir === 'asc' ? sorted : sorted.reverse()
  }, [rows, query, category, status, availability, stock, sort])

  const onSort = (by) => setSort((s) => ({ by, dir: s.by === by && s.dir === 'asc' ? 'desc' : 'asc' }))
  const clearFilters = () => {
    setQuery('')
    setCategory('all')
    setStatus('all')
    setAvailability('all')
    setStock('all')
  }

  const report = (result, success) => {
    if (!result.ok) notify({ tone: 'error', title: 'Couldn’t save', message: result.error })
    else notify({ title: success, message: result.persisted ? undefined : 'Browser storage is unavailable — the change lasts until you reload.' })
    return result
  }

  const onStatus = (product, next) => report(patchProduct(product.id, { status: next }, `Changed “${product.name}” to ${next}.`), `“${product.name}” is now ${next}`)
  const onFlag = (product, flag) => {
    const label = FLAGS.find((f) => f.key === flag).label
    const on = !product[flag]
    report(patchProduct(product.id, { [flag]: on }, `${on ? 'Marked' : 'Unmarked'} “${product.name}” as ${label}.`), `${label} ${on ? 'on' : 'off'} for “${product.name}”`)
  }
  const onDuplicate = (product) => {
    const result = report(duplicateProduct(product.id), `Duplicated “${product.name}” as a draft`)
    if (result.ok) navigate(`/admin/products/${result.id}`)
  }
  const onDelete = async (product) => {
    const sets = bundlesUsing(product.id)
    if (sets.length) {
      notify({ tone: 'error', title: 'This product is part of a ready-made set', message: `Remove it from ${sets.map((s) => s.name).join(', ')} first, or archive it instead.` })
      return
    }
    const ok = await confirm({
      title: `Delete “${product.name}”?`,
      message: 'This removes the product, its variants and stock from this browser’s catalog and from every collection. Customers’ carts that contain it will show it as unavailable. Archive it instead if you may need it again.',
      confirmLabel: 'Delete product',
      tone: 'danger',
    })
    if (ok) report(deleteProduct(product.id), `Deleted “${product.name}”`)
  }

  const preview = previewId ? catalog.allById[previewId] : null
  const filtered = query || category !== 'all' || status !== 'all' || availability !== 'all' || stock !== 'all'

  return (
    <>
      <PageHeader
        title="Products"
        description="Every product in the catalog. Changes apply to the storefront as soon as they are saved."
        actions={
          <Link to="/admin/products/new" className="btn btn--sm">
            <Plus size={15} aria-hidden="true" /> Add product
          </Link>
        }
      />

      <Card className="adm-card--flush">
        <div className="adm-card__head" style={{ marginBottom: 0 }}>
          <div className="adm-toolbar" style={{ width: '100%' }}>
            <SearchInput value={query} onChange={setQuery} placeholder="Search name, slug or SKU" label="Search products" />
            <label className="adm-filter">
              Category
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="adm-filter">
              Status
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="adm-filter">
              Availability
              <select className="select" value={availability} onChange={(e) => setAvailability(e.target.value)}>
                <option value="all">All</option>
                <option value="purchasable">On the storefront</option>
                <option value="hidden">Not on the storefront</option>
              </select>
            </label>
            <label className="adm-filter">
              Stock
              <select className="select" value={stock} onChange={(e) => setStock(e.target.value)}>
                <option value="all">Any stock</option>
                <option value="in">All in stock</option>
                <option value="low">Low or partly sold out</option>
                <option value="out">Fully sold out</option>
              </select>
            </label>
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title={filtered ? 'No products match these filters' : 'No products yet'}
            actions={
              filtered ? (
                <button type="button" className="btn btn--sm" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : (
                <Link to="/admin/products/new" className="btn btn--sm">
                  Add your first product
                </Link>
              )
            }
          />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <caption className="visually-hidden">Products</caption>
              <thead>
                <tr>
                  <SortHeader id="name" label="Product" sort={sort} onSort={onSort} />
                  <th>Status</th>
                  <SortHeader id="price" label="Price" sort={sort} onSort={onSort} className="num" />
                  <SortHeader id="inventory" label="Inventory" sort={sort} onSort={onSort} className="num" />
                  <th>Merchandising</th>
                  <SortHeader id="updated" label="Updated" sort={sort} onSort={onSort} />
                  <th className="actions">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ product, processed, units, low, out, variantCount, stockState }) => (
                  <tr key={product.id} className={product.status !== 'active' ? 'is-muted' : ''}>
                    <td>
                      <ProductThumb
                        product={product}
                        to={`/admin/products/${product.id}`}
                        meta={`${processed.categoryName}${product.bundle ? ' · Ready-made set' : ''} · ${variantCount} variant${variantCount === 1 ? '' : 's'}`}
                      />
                    </td>
                    <td>
                      <div className="adm-stack" style={{ gap: '0.35rem' }}>
                        <label className="visually-hidden" htmlFor={`status-${product.id}`}>
                          Status of {product.name}
                        </label>
                        <select id={`status-${product.id}`} className="select select--sm" value={product.status} onChange={(e) => onStatus(product, e.target.value)}>
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>
                        {product.status === 'active' && !processed.isPurchasable && <StatusBadge status="off" label="Not purchasable" />}
                      </div>
                    </td>
                    <td className="num">{variantCount ? formatPriceRange(processed.priceRange) : '—'}</td>
                    <td className="num">
                      <div>{units} units</div>
                      {stockState === 'out' ? <StatusBadge status="out" /> : low || out ? <StatusBadge status="low" label={`${low ? `${low} low` : ''}${low && out ? ' · ' : ''}${out ? `${out} sold out` : ''}`} /> : stockState === 'in' ? <StatusBadge status="in" /> : null}
                    </td>
                    <td>
                      <span className="adm-flags">
                        {FLAGS.map((f) => (
                          <button key={f.key} type="button" className={`adm-flag ${product[f.key] ? 'is-on' : ''}`} aria-pressed={product[f.key]} onClick={() => onFlag(product, f.key)} title={`Toggle ${f.label}`}>
                            {f.label}
                          </button>
                        ))}
                      </span>
                    </td>
                    <td className="nowrap muted">{product.updatedAt ? timeAgo(product.updatedAt) : 'Not edited'}</td>
                    <td className="actions">
                      <button type="button" className="adm-icon-btn" onClick={() => setPreviewId(product.id)} aria-label={`Preview ${product.name}`} title="Preview">
                        <Eye size={15} />
                      </button>
                      <Link to={`/admin/products/${product.id}`} className="adm-icon-btn" aria-label={`Edit ${product.name}`} title="Edit">
                        <Pencil size={15} />
                      </Link>
                      <button type="button" className="adm-icon-btn" onClick={() => onDuplicate(product)} aria-label={`Duplicate ${product.name}`} title="Duplicate">
                        <CopyPlus size={15} />
                      </button>
                      <button type="button" className="adm-icon-btn adm-icon-btn--danger" onClick={() => onDelete(product)} aria-label={`Delete ${product.name}`} title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="adm-table-foot">
          <span>
            Showing {visible.length} of {data.products.length} products
          </span>
          {filtered && (
            <button type="button" className="text-btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      </Card>

      <ProductPreview product={preview} open={Boolean(preview)} onClose={() => setPreviewId(null)} />
    </>
  )
}
