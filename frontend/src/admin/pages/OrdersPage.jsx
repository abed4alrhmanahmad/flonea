import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, Eye, FlaskConical, ReceiptText, Trash2 } from 'lucide-react'
import Drawer from '../../components/ui/Drawer.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Img from '../../components/ui/Img.jsx'
import { formatPrice, pluralize } from '../../lib/format.js'
import { ORDER_STATUSES } from '../../store/schema.js'
import { useStore } from '../../store/hooks.js'
import { addSampleOrders, deleteOrder, getCatalog, removeSampleOrders, updateOrderStatus } from '../../store/store.js'
import { useToast } from '../../context/ToastContext.jsx'
import { useConfirm } from '../components/ConfirmContext.jsx'
import { Card, DemoNote, PageHeader, SearchInput, SelectField, StatusBadge, TextField } from '../components/ui.jsx'
import { formatDateTime } from '../lib/listUtils.js'
import { buildSampleOrders } from '../lib/sampleOrders.js'

const STATUS_LABEL = { placed: 'Placed', processing: 'Processing', shipped: 'Shipped (demo)', delivered: 'Delivered (demo)', cancelled: 'Cancelled' }
const customerName = (o) => `${o.customer.firstName} ${o.customer.lastName}`.trim() || o.customer.email || 'Unknown'

function OrderDetail({ order, onClose }) {
  const { notify } = useToast()
  const confirm = useConfirm()
  const [status, setStatus] = useState(order.status)
  const [note, setNote] = useState('')

  const applyStatus = async (next = status) => {
    if (next === 'cancelled') {
      const ok = await confirm({ title: `Cancel demo order ${order.number}?`, message: 'The order is marked as cancelled in this browser. Nothing is refunded or emailed — no payment was ever taken.', confirmLabel: 'Cancel order', tone: 'danger' })
      if (!ok) return
    }
    const result = updateOrderStatus(order.id, next, note)
    if (!result.ok) return notify({ tone: 'error', title: 'Couldn’t update the order', message: result.error })
    setNote('')
    setStatus(next)
    notify({ title: `${order.number}: ${STATUS_LABEL[next]}`, message: 'Demo status only — no email was sent and nothing was shipped.' })
  }

  const remove = async () => {
    const ok = await confirm({ title: `Delete ${order.sample ? 'sample' : 'demo'} order ${order.number}?`, message: 'It is removed from this browser’s order list. This can’t be undone.', confirmLabel: 'Delete order', tone: 'danger' })
    if (!ok) return
    deleteOrder(order.id)
    notify({ tone: 'info', title: `Deleted ${order.number}` })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Order ${order.number}`}
      side="right"
      className="adm-drawer"
      footer={
        <>
          <button type="button" className="btn btn--light btn--sm" onClick={remove} style={{ marginRight: 'auto' }}>
            <Trash2 size={14} aria-hidden="true" /> Delete
          </button>
          <button type="button" className="btn btn--sm" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <div className="adm-inline">
        <StatusBadge status={order.status} />
        {order.sample && <StatusBadge status="sample" label="Sample order" />}
        <span className="muted">{formatDateTime(order.createdAt)}</span>
      </div>
      {order.sample ? (
        <DemoNote tone="warning">Sample order for interface testing — not placed by anyone.</DemoNote>
      ) : (
        <DemoNote>Demo order placed through this browser’s checkout. No payment was taken and nothing will be shipped.</DemoNote>
      )}

      <section className="adm-stack" aria-label="Customer and delivery">
        <dl className="adm-dl">
          <dt>Customer</dt>
          <dd>{customerName(order)}</dd>
          <dt>Email</dt>
          <dd>{order.customer.email || '—'}</dd>
          <dt>Phone</dt>
          <dd>{order.customer.phone || '—'}</dd>
          <dt>Ship to</dt>
          <dd>
            {[order.shippingAddress.address, order.shippingAddress.apartment].filter(Boolean).join(', ') || '—'}
            <br />
            {[order.shippingAddress.city, order.shippingAddress.postalCode].filter(Boolean).join(' ')}
            {order.shippingAddress.country && `, ${order.shippingAddress.country}`}
          </dd>
          <dt>Delivery</dt>
          <dd>
            {order.shippingMethod.name || '—'}
            {order.shippingMethod.eta && <span className="muted"> · {order.shippingMethod.eta}</span>}
          </dd>
          {order.notes && (
            <>
              <dt>Notes</dt>
              <dd>{order.notes}</dd>
            </>
          )}
        </dl>
      </section>

      <section className="adm-stack" aria-labelledby="order-items" style={{ gap: 'var(--space-2)' }}>
        <h3 id="order-items" className="adm-card__title">
          Items
        </h3>
        <ul className="adm-order-lines" role="list">
          {order.items.map((item, i) => (
            <li key={i} className="adm-order-line">
              <Img name={item.imageKey} alt="" ratio="1 / 1" sizes="48px" />
              <div>
                <strong>{item.name}</strong> × {item.quantity}
                {item.type === 'custom-set' ? (
                  <ul className="adm-order-line__set" role="list" aria-label="Items in this custom set">
                    {item.components.map((c) => (
                      <li key={c.role}>
                        <strong>{c.roleLabel}:</strong> {c.quantity} × {c.name} — {c.details} · {formatPrice(c.unitPrice)} each
                      </li>
                    ))}
                    <li className="muted">One grouped custom set · regular prices, no set discount</li>
                  </ul>
                ) : (
                  item.options && <div className="muted">{item.options}</div>
                )}
              </div>
              <span className="price">{formatPrice(item.total)}</span>
            </li>
          ))}
        </ul>
        <dl className="adm-totals">
          <div>
            <dt>Subtotal ({pluralize(order.totals.itemCount, 'item')})</dt>
            <dd>{formatPrice(order.totals.subtotal)}</dd>
          </div>
          {order.totals.savings > 0 && (
            <div>
              <dt>Ready-made set savings</dt>
              <dd>−{formatPrice(order.totals.savings)}</dd>
            </div>
          )}
          <div>
            <dt>Shipping</dt>
            <dd>{order.totals.shipping === 0 ? 'Free' : formatPrice(order.totals.shipping)}</dd>
          </div>
          <div className="is-total">
            <dt>Total (demo)</dt>
            <dd>{formatPrice(order.totals.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="adm-stack adm-card" aria-labelledby="order-status" style={{ gap: 'var(--space-3)' }}>
        <h3 id="order-status" className="adm-card__title">
          Update status (demo)
        </h3>
        <div className="adm-form-grid">
          <SelectField label="Status" value={status} onChange={setStatus} options={ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))} />
          <TextField label="Note (optional)" value={note} maxLength={300} onChange={setNote} placeholder="e.g. Packed for pick-up" />
        </div>
        <div className="adm-inline">
          <button type="button" className="btn btn--sm" onClick={() => applyStatus()} disabled={status === order.status && !note.trim()}>
            Save status
          </button>
          {order.status !== 'cancelled' && (
            <button type="button" className="btn btn--light btn--sm" onClick={() => applyStatus('cancelled')}>
              Cancel order
            </button>
          )}
        </div>
        <p className="adm-field__hint">Changing a status only updates this record. It does not send emails, ship parcels, refund or contact anyone.</p>
        <ol className="adm-timeline" role="list" aria-label="Status history">
          {[...order.history].reverse().map((h, i) => (
            <li key={i}>
              <span>
                <strong>{STATUS_LABEL[h.status] ?? h.status}</strong> <span className="muted">· {formatDateTime(h.at)}</span>
              </span>
              {h.note && <span className="muted">{h.note}</span>}
            </li>
          ))}
        </ol>
      </section>
    </Drawer>
  )
}

export default function OrdersPage() {
  const { orders } = useStore()
  const { notify } = useToast()
  const confirm = useConfirm()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [kind, setKind] = useState('all')
  const [asc, setAsc] = useState(false)
  const [openId, setOpenId] = useState(null)
  const sampleCount = orders.filter((o) => o.sample).length

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = orders.filter((o) => {
      if (status !== 'all' && o.status !== status) return false
      if (kind === 'demo' && o.sample) return false
      if (kind === 'sample' && !o.sample) return false
      if (q && !`${o.number} ${customerName(o)} ${o.customer.email} ${o.items.map((i) => i.name).join(' ')}`.toLowerCase().includes(q)) return false
      return true
    })
    return [...list].sort((a, b) => (asc ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)))
  }, [orders, query, status, kind, asc])

  const loadSamples = () => {
    const samples = buildSampleOrders(getCatalog())
    if (!samples.length) return notify({ tone: 'error', title: 'Couldn’t build sample orders', message: 'No purchasable products are available.' })
    addSampleOrders(samples)
    notify({ title: `Added ${samples.length} sample orders`, message: 'They are labelled “Sample” and never counted as demo sales.' })
  }
  const clearSamples = async () => {
    if (await confirm({ title: 'Remove all sample orders?', message: 'Real demo orders from the checkout are kept.', confirmLabel: 'Remove samples', tone: 'danger' })) {
      removeSampleOrders()
      notify({ tone: 'info', title: 'Sample orders removed' })
    }
  }

  const open = orders.find((o) => o.id === openId)

  return (
    <>
      <PageHeader
        title="Orders"
        description="Demo orders placed through this browser’s checkout. No payments are taken and nothing is shipped."
        actions={
          <>
            <button type="button" className="btn btn--light btn--sm" onClick={loadSamples}>
              <FlaskConical size={15} aria-hidden="true" /> Add sample orders
            </button>
            {sampleCount > 0 && (
              <button type="button" className="btn btn--light btn--sm" onClick={clearSamples}>
                Remove samples ({sampleCount})
              </button>
            )}
          </>
        }
      />

      {orders.length === 0 ? (
        <Card>
          <EmptyState
            icon={ReceiptText}
            title="No demo orders yet"
            actions={
              <>
                <a href="/shop" target="_blank" rel="noopener noreferrer" className="btn btn--sm">
                  Place a demo order in the store
                </a>
                <button type="button" className="btn btn--outline btn--sm" onClick={loadSamples}>
                  Add sample orders
                </button>
              </>
            }
          >
            <p>Orders appear here after someone completes the demo checkout in this browser. You can also add clearly-labelled sample orders to try this screen.</p>
          </EmptyState>
        </Card>
      ) : (
        <Card className="adm-card--flush">
          <div className="adm-card__head" style={{ marginBottom: 0 }}>
            <div className="adm-toolbar" style={{ width: '100%' }}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search order, customer or product" label="Search orders" />
              <label className="adm-filter">
                Status
                <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="all">All statuses</option>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="adm-filter">
                Type
                <select className="select" value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="all">Demo &amp; sample</option>
                  <option value="demo">Demo orders only</option>
                  <option value="sample">Sample orders only</option>
                </select>
              </label>
            </div>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <caption className="visually-hidden">Orders</caption>
              <thead>
                <tr>
                  <th>Order</th>
                  <th aria-sort={asc ? 'ascending' : 'descending'}>
                    <button type="button" className="adm-sort" onClick={() => setAsc((a) => !a)}>
                      Date {asc ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />}
                    </button>
                  </th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th className="num">Total</th>
                  <th>Status</th>
                  <th className="actions">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr key={o.id}>
                    <td className="nowrap">
                      <button type="button" className="text-btn" style={{ color: 'var(--text)', fontWeight: 500 }} onClick={() => setOpenId(o.id)}>
                        {o.number}
                      </button>{' '}
                      {o.sample && <StatusBadge status="sample" />}
                    </td>
                    <td className="nowrap">{formatDateTime(o.createdAt)}</td>
                    <td>
                      <div>{customerName(o)}</div>
                      <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
                        {o.customer.email}
                      </div>
                    </td>
                    <td>
                      {o.items.map((i) => `${i.quantity} × ${i.name}`).join(', ')}
                      {o.items.some((i) => i.type === 'custom-set') && <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Includes a custom bedding set</div>}
                    </td>
                    <td className="num">{formatPrice(o.totals.total)}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="actions">
                      <button type="button" className="adm-icon-btn" onClick={() => setOpenId(o.id)} aria-label={`View order ${o.number}`} title="View details">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visible.length === 0 && <p className="muted" style={{ padding: 'var(--space-4)' }}>No orders match these filters.</p>}
          <div className="adm-table-foot">
            <span>
              {visible.length} of {orders.length} orders · Demo orders don’t change inventory. <Link to="/admin/inventory">Inventory</Link>
            </span>
          </div>
        </Card>
      )}

      {open && <OrderDetail key={open.id} order={open} onClose={() => setOpenId(null)} />}
    </>
  )
}
