import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Boxes,
  CircleCheck,
  CircleX,
  Coins,
  FolderOpen,
  Layers,
  Package,
  PanelsTopLeft,
  Plus,
  ReceiptText,
  Settings,
  TriangleAlert,
} from 'lucide-react'
import { Card, DemoNote, PageHeader, ProductThumb, StatTile, StatusBadge } from '../components/ui.jsx'
import { useStore } from '../../store/hooks.js'
import { formatPrice, pluralize } from '../../lib/format.js'
import { inventoryRows, inventorySummary } from '../lib/inventory.js'
import { timeAgo } from '../lib/listUtils.js'
import { roundMoney } from '../../lib/variants.js'

const QUICK_ACTIONS = [
  { to: '/admin/products/new', label: 'Add product', icon: Plus },
  { to: '/admin/products', label: 'Manage products', icon: Package },
  { to: '/admin/collections', label: 'Manage collections', icon: FolderOpen },
  { to: '/admin/content', label: 'Homepage content', icon: PanelsTopLeft },
  { to: '/admin/inventory', label: 'Update inventory', icon: Boxes },
  { to: '/admin/build-a-set', label: 'Build a Set', icon: Layers },
  { to: '/admin/orders', label: 'Demo orders', icon: ReceiptText },
  { to: '/admin/settings', label: 'Store settings', icon: Settings },
]

function StockHealth({ counts, threshold }) {
  const total = counts.in + counts.low + counts.out
  const segments = [
    { id: 'in', label: 'In stock', value: counts.in, Icon: CircleCheck },
    { id: 'low', label: `Low (≤ ${threshold})`, value: counts.low, Icon: TriangleAlert },
    { id: 'out', label: 'Sold out', value: counts.out, Icon: CircleX },
  ]
  if (!total) return <p className="muted">No offered variants yet.</p>
  return (
    <div className="adm-health">
      <div className="adm-health__bar" role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}>
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <span key={s.id} className={`adm-health__seg adm-health__seg--${s.id}`} style={{ flexGrow: s.value }} title={`${s.label}: ${s.value} of ${total} offered variants (${Math.round((s.value / total) * 100)}%)`} />
          ))}
      </div>
      <ul className="adm-health__legend" role="list">
        {segments.map(({ id, label, value, Icon }) => (
          <li key={id}>
            <span className={`adm-health__key adm-health__seg--${id}`} aria-hidden="true" />
            <Icon size={14} aria-hidden="true" />
            {label}: <strong>{value}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function DashboardPage() {
  const { data, catalog, orders, activity } = useStore()
  const threshold = data.settings.inventory.lowStockThreshold
  const rows = inventoryRows(data.products, catalog.allById, threshold)
  const summary = inventorySummary(rows)

  const activeProducts = data.products.filter((p) => p.status === 'active').length
  const drafts = data.products.filter((p) => p.status === 'draft').length
  const enabledCollections = data.collections.filter((c) => c.enabled).length
  // Only orders placed through this browser's checkout count — sample orders never do.
  const demoOrders = orders.filter((o) => !o.sample)
  const sampleCount = orders.length - demoOrders.length
  const demoValue = roundMoney(demoOrders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.totals.total, 0))
  const recentProducts = [...data.products].filter((p) => p.updatedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6)

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview calculated from the catalog, inventory and demo orders saved in this browser."
        actions={
          <Link to="/admin/products/new" className="btn btn--sm">
            <Plus size={15} aria-hidden="true" /> Add product
          </Link>
        }
      />

      <DemoNote>
        This is a frontend-only demo. Figures come from local data in this browser — there are no real sales, payments or customers.
      </DemoNote>

      <section aria-label="Key figures" className="adm-stats">
        <StatTile label="Active products" value={activeProducts} icon={Package} to="/admin/products" note={`${catalog.products.length} purchasable on the storefront${drafts ? ` · ${drafts} draft${drafts === 1 ? '' : 's'}` : ''}`} />
        <StatTile label="Collections" value={data.collections.length} icon={FolderOpen} to="/admin/collections" note={`${enabledCollections} enabled`} />
        <StatTile
          label="Low-stock products"
          value={summary.lowProducts.length}
          tone={summary.lowProducts.length ? 'warn' : undefined}
          icon={TriangleAlert}
          to="/admin/inventory?state=low"
          note={`${pluralize(summary.counts.low, 'variant')} at or below ${threshold}`}
        />
        <StatTile
          label="Out-of-stock products"
          value={summary.soldOutProducts.length}
          tone={summary.soldOutProducts.length ? 'bad' : undefined}
          icon={CircleX}
          to="/admin/inventory?state=out"
          note={`${pluralize(summary.counts.out, 'sold-out variant')} across ${pluralize(summary.productsWithSoldOutVariants.length, 'product')}`}
        />
        <StatTile label="Demo orders" value={demoOrders.length} icon={ReceiptText} to="/admin/orders" note={sampleCount ? `${sampleCount} sample order${sampleCount === 1 ? '' : 's'} not counted` : 'Placed via this browser’s checkout'} />
        <StatTile label="Demo order value" value={formatPrice(demoValue)} icon={Coins} to="/admin/orders" note="Excludes cancelled · no payment taken" />
      </section>

      <div className="adm-grid adm-grid--2">
        <Card
          title="Stock health"
          description={`Offered variants of single-item products. Low stock means ${threshold} or fewer left (change it in Settings).`}
          actions={
            <Link to="/admin/inventory" className="link-arrow">
              Inventory <ArrowRight size={14} />
            </Link>
          }
        >
          <StockHealth counts={summary.counts} threshold={threshold} />
          {summary.counts.off > 0 && <p className="adm-field__hint">{pluralize(summary.counts.off, 'variant')} switched off (not offered to customers).</p>}
          {summary.lowProducts.length > 0 && (
            <>
              <hr className="adm-sep" />
              <ul className="adm-list" role="list" aria-label="Low-stock products">
                {summary.lowProducts.slice(0, 5).map((e) => (
                  <li key={e.product.id}>
                    <span className="adm-list__main">
                      <ProductThumb product={e.product} to={`/admin/products/${e.product.id}#variants`} meta={`${pluralize(e.low, 'variant')} low${e.out ? ` · ${e.out} sold out` : ''}`} />
                    </span>
                    <StatusBadge status="low" />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card title="Quick actions">
          <nav className="adm-quick" aria-label="Quick actions">
            {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}>
                <Icon size={16} aria-hidden="true" /> {label}
              </Link>
            ))}
          </nav>
        </Card>
      </div>

      <div className="adm-grid adm-grid--2">
        <Card title="Recently updated products" description="Products edited in this browser.">
          {recentProducts.length ? (
            <ul className="adm-list" role="list">
              {recentProducts.map((p) => (
                <li key={p.id}>
                  <span className="adm-list__main">
                    <ProductThumb product={p} to={`/admin/products/${p.id}`} meta={timeAgo(p.updatedAt)} />
                  </span>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No products have been edited yet. Changes you save will appear here.</p>
          )}
        </Card>

        <Card
          title="Recent activity"
          description="Local demo history of changes made in this browser — not a secure audit log."
          actions={
            <Link to="/admin/activity" className="link-arrow">
              View all <ArrowRight size={14} />
            </Link>
          }
        >
          {activity.length ? (
            <ul className="adm-list" role="list">
              {activity.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <span className="adm-dot" aria-hidden="true" />
                  <span className="adm-list__main">{a.message}</span>
                  <span className="adm-list__meta">{timeAgo(a.at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Nothing yet. Product, collection, content and settings changes will be listed here.</p>
          )}
        </Card>
      </div>
    </>
  )
}
