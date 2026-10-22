import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Boxes } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { CATEGORIES } from '../../data/catalog.js'
import { formatPrice } from '../../lib/format.js'
import { useStore } from '../../store/hooks.js'
import { patchProduct, setVariantAvailable, setVariantStock, updateSettings } from '../../store/store.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Card, DemoNote, NumberField, PageHeader, ProductThumb, SearchInput, StatTile, StatusBadge, Toggle } from '../components/ui.jsx'
import { inventoryRows, inventorySummary } from '../lib/inventory.js'

const PAGE_SIZE = 50
const STATES = ['all', 'in', 'low', 'out', 'off']

/** Stock cell: edits locally, saves on Enter / blur, rejects negative or fractional quantities. */
function StockInput({ row, onSave }) {
  const [value, setValue] = useState(null)
  const [error, setError] = useState('')
  const shown = value ?? String(row.stock)
  const commit = () => {
    if (value === null || value === String(row.stock)) {
      setValue(null)
      return
    }
    const qty = Number(value)
    if (value.trim() === '' || !Number.isInteger(qty) || qty < 0) {
      setError('Whole number, 0 or more')
      return
    }
    setError('')
    setValue(null)
    onSave(row, qty)
  }
  return (
    <span className="adm-stack" style={{ gap: 2, justifyItems: 'end' }}>
      <label className="visually-hidden" htmlFor={`inv-${row.id}`}>
        Stock for {row.product.name} {row.label}
      </label>
      <input
        id={`inv-${row.id}`}
        className="input adm-stock-input"
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        value={shown}
        aria-invalid={Boolean(error) || undefined}
        onChange={(e) => {
          setValue(e.target.value)
          setError('')
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setValue(null)
            setError('')
          }
        }}
      />
      {error && (
        <span className="adm-field__error" role="alert">
          {error}
        </span>
      )}
    </span>
  )
}

function ThresholdForm({ settings }) {
  const { notify } = useToast()
  const [value, setValue] = useState(String(settings.inventory.lowStockThreshold))
  const valid = Number.isInteger(Number(value)) && Number(value) >= 0 && value.trim() !== ''
  const changed = valid && Number(value) !== settings.inventory.lowStockThreshold
  const save = (e) => {
    e.preventDefault()
    if (!valid) return
    updateSettings({ ...settings, inventory: { ...settings.inventory, lowStockThreshold: Number(value) } }, `Set the low-stock threshold to ${value}.`)
    notify({ title: `Low-stock threshold set to ${value}`, message: 'Product pages show “Only N left” at or below this level.' })
  }
  return (
    <form className="adm-inline" onSubmit={save} style={{ alignItems: 'flex-end' }}>
      <NumberField label="Low-stock threshold" min="0" step="1" value={value} onChange={setValue} error={valid ? undefined : 'Enter a whole number, 0 or more.'} hint="Variants at or below this are “low”." />
      <button type="submit" className="btn btn--sm" disabled={!changed}>
        Save threshold
      </button>
    </form>
  )
}

export default function InventoryPage() {
  const { data, catalog } = useStore()
  const { notify } = useToast()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState('variants')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [productId, setProductId] = useState('all')
  const [page, setPage] = useState(1)
  const state = STATES.includes(params.get('state')) ? params.get('state') : 'all'
  const threshold = data.settings.inventory.lowStockThreshold

  const rows = useMemo(() => inventoryRows(data.products, catalog.allById, threshold), [data.products, catalog, threshold])
  const summary = useMemo(() => inventorySummary(rows), [rows])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (state !== 'all' && r.state !== state) return false
      if (category !== 'all' && r.product.category !== category) return false
      if (productId !== 'all' && r.productId !== productId) return false
      if (q && !`${r.product.name} ${r.label} ${r.sku}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, state, category, productId, query])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const pageRows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const setState = (next) => {
    setPage(1)
    setParams(next === 'all' ? {} : { state: next }, { replace: true })
  }

  const saveStock = (row, qty) => {
    const result = setVariantStock(row.productId, row.selection, qty)
    if (!result.ok) return notify({ tone: 'error', title: 'Couldn’t update stock', message: result.error })
    notify({ title: `Stock updated: ${qty}`, message: `${row.product.name} — ${row.label}` })
  }
  const toggleOffered = (row, on) => {
    const result = setVariantAvailable(row.productId, row.selection, on)
    if (!result.ok) return notify({ tone: 'error', title: 'Couldn’t update', message: result.error })
    notify({ tone: on ? 'success' : 'info', title: on ? 'Variant offered again' : 'Variant marked unavailable', message: `${row.product.name} — ${row.label}` })
  }

  const productRows = useMemo(
    () =>
      data.products
        .filter((p) => !p.bundle && (category === 'all' || p.category === category))
        .map((p) => {
          const own = rows.filter((r) => r.productId === p.id)
          const offered = own.filter((r) => r.offered)
          return { product: p, offered: offered.length, total: own.length, units: offered.reduce((s, r) => s + r.stock, 0), low: offered.filter((r) => r.state === 'low').length, out: offered.filter((r) => r.state === 'out').length }
        }),
    [data.products, rows, category],
  )

  return (
    <>
      <PageHeader title="Inventory" description="Stock per variant for every single-item product. Ready-made sets take their stock from the products they contain." />
      <DemoNote>Stock is never deducted automatically: adding to a cart reserves nothing, and demo orders don’t change inventory. Quantities change only when you edit them.</DemoNote>

      <section className="adm-stats" aria-label="Inventory summary">
        <StatTile label="Offered variants" value={summary.offered} note={`${summary.counts.off} not offered`} />
        <StatTile label="In stock" value={summary.counts.in} />
        <StatTile label={`Low stock (≤ ${threshold})`} value={summary.counts.low} tone={summary.counts.low ? 'warn' : undefined} note={`${summary.lowProducts.length} products`} />
        <StatTile label="Sold out" value={summary.counts.out} tone={summary.counts.out ? 'bad' : undefined} note={`${summary.soldOutProducts.length} products fully sold out`} />
      </section>

      <Card>
        <ThresholdForm key={threshold} settings={data.settings} />
      </Card>

      <div className="adm-tabs" role="tablist" aria-label="Inventory view">
        {[
          ['variants', 'Variants'],
          ['products', 'Products'],
        ].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={view === id} className="adm-tab" onClick={() => setView(id)}>
            {label}
          </button>
        ))}
      </div>

      {view === 'variants' ? (
        <Card className="adm-card--flush">
          <div className="adm-card__head" style={{ marginBottom: 0 }}>
            <div className="adm-toolbar" style={{ width: '100%' }}>
              <SearchInput
                value={query}
                onChange={(v) => {
                  setQuery(v)
                  setPage(1)
                }}
                placeholder="Search product, variant or SKU"
                label="Search inventory"
              />
              <label className="adm-filter">
                Stock
                <select className="select" value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="all">All variants</option>
                  <option value="in">In stock</option>
                  <option value="low">Low stock</option>
                  <option value="out">Sold out</option>
                  <option value="off">Not offered</option>
                </select>
              </label>
              <label className="adm-filter">
                Category
                <select
                  className="select"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">All categories</option>
                  {CATEGORIES.filter((c) => c.id !== 'bedding-sets').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="adm-filter">
                Product
                <select
                  className="select"
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">All products</option>
                  {data.products
                    .filter((p) => !p.bundle)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          </div>
          {pageRows.length === 0 ? (
            <EmptyState icon={Boxes} title="No variants match these filters" />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <caption className="visually-hidden">Inventory by variant</caption>
                <thead>
                  <tr>
                    <th>Product / variant</th>
                    <th>SKU</th>
                    <th className="num">Price</th>
                    <th>Available</th>
                    <th className="num">Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.id} className={r.offered && r.product.status === 'active' ? '' : 'is-muted'}>
                      <td>
                        <ProductThumb product={r.product} to={`/admin/products/${r.productId}#variants`} meta={`${r.label}${r.product.status !== 'active' ? ` · product ${r.product.status}` : ''}`} />
                      </td>
                      <td>
                        <code className="adm-code">{r.sku}</code>
                      </td>
                      <td className="num">{formatPrice(r.price)}</td>
                      <td>
                        <Toggle size="sm" hideLabel label={`${r.product.name} ${r.label} available`} checked={r.offered} onChange={(on) => toggleOffered(r, on)} />
                      </td>
                      <td className="num">
                        <StockInput key={`${r.id}:${r.stock}`} row={r} onSave={saveStock} />
                      </td>
                      <td>
                        <StatusBadge status={r.state} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="adm-table-foot">
            <span>
              {filtered.length} variant{filtered.length === 1 ? '' : 's'}
              {filtered.length > PAGE_SIZE && ` · page ${current} of ${pageCount}`}
            </span>
            {pageCount > 1 && (
              <span className="adm-pager">
                <button type="button" className="btn btn--light btn--sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
                  Previous
                </button>
                <button type="button" className="btn btn--light btn--sm" disabled={current === pageCount} onClick={() => setPage(current + 1)}>
                  Next
                </button>
              </span>
            )}
          </div>
        </Card>
      ) : (
        <Card className="adm-card--flush" title="Products" description="Switch a whole product off (moves it to Draft) or back on (Active).">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <caption className="visually-hidden">Inventory by product</caption>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Available for sale</th>
                  <th className="num">Offered variants</th>
                  <th className="num">Units</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {productRows.map(({ product, offered, total, units, low, out }) => (
                  <tr key={product.id} className={product.status === 'active' ? '' : 'is-muted'}>
                    <td>
                      <ProductThumb product={product} to={`/admin/products/${product.id}#variants`} meta={catalog.allById[product.id]?.categoryName} />
                    </td>
                    <td>
                      <Toggle
                        size="sm"
                        checked={product.status === 'active'}
                        label={product.status === 'active' ? 'Active' : product.status === 'archived' ? 'Archived' : 'Draft'}
                        onChange={(on) => {
                          const result = patchProduct(product.id, { status: on ? 'active' : 'draft' }, `${on ? 'Activated' : 'Marked unavailable'} “${product.name}”.`)
                          if (result.ok) notify({ tone: on ? 'success' : 'info', title: on ? `“${product.name}” is available again` : `“${product.name}” is now unavailable`, message: on ? 'Active on the storefront.' : 'Moved to Draft — hidden from customers.' })
                        }}
                      />
                    </td>
                    <td className="num">
                      {offered} <span className="muted">/ {total}</span>
                    </td>
                    <td className="num">{units}</td>
                    <td>{!offered ? <StatusBadge status="off" /> : out === offered ? <StatusBadge status="out" /> : low || out ? <StatusBadge status="low" label={`${low} low · ${out} sold out`} /> : <StatusBadge status="in" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="adm-table-foot">
            <span>
              Ready-made sets aren’t listed: their stock is the lowest of their items. <Link to="/admin/products">Manage sets in Products</Link>.
            </span>
          </div>
        </Card>
      )}
    </>
  )
}
