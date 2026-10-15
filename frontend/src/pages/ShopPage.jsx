import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LayoutGrid, Rows3, Search, SearchX, SlidersHorizontal } from 'lucide-react'
import Img from '../components/ui/Img.jsx'
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx'
import Drawer from '../components/ui/Drawer.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ProductGrid from '../components/product/ProductGrid.jsx'
import FilterPanel from '../components/shop/FilterPanel.jsx'
import ActiveFilters from '../components/shop/ActiveFilters.jsx'
import SortSelect from '../components/shop/SortSelect.jsx'
import { PRODUCTS } from '../data/products.js'
import { COLLECTIONS } from '../data/catalog.js'
import { countActiveFilters } from '../lib/filters.js'
import { pluralize } from '../lib/format.js'
import { useProductFilters } from '../hooks/useProductFilters.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import NotFoundPage from './NotFoundPage.jsx'
import '../styles/shop.css'

const SHOP = { id: 'shop', title: 'Shop All Bedding', subtitle: 'Duvet covers, pillows and complete sets in natural fabrics.', image: 'heroRoom', categories: null }

export default function ShopPage() {
  const { collectionId } = useParams()
  const collection = collectionId ? COLLECTIONS[collectionId] : SHOP
  if (!collection) return <NotFoundPage />
  return <Listing key={collection.id} collection={collection} />
}

function Listing({ collection }) {
  useDocumentTitle(collection.title)
  const base = useMemo(
    () => (collection.categories ? PRODUCTS.filter((p) => collection.categories.includes(p.category)) : PRODUCTS),
    [collection],
  )
  const { query, sort, filters, results, pageItems, page, pageCount, options, toggleFilter, setQuery, setSort, clearAll, setPage } =
    useProductFilters(base)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dense, setDense] = useState(false)
  const activeCount = countActiveFilters(filters)
  const isShop = collection.id === 'shop'

  const removeFilter = (key, id) => toggleFilter(key, id)

  return (
    <>
      <section className="listing-hero">
        <Img name={collection.image} alt="" sizes="100vw" priority className="listing-hero__img" />
        <div className="listing-hero__overlay" />
        <div className="container listing-hero__content">
          <h1>{collection.title}</h1>
          <p>{collection.subtitle}</p>
        </div>
      </section>

      <div className="container listing">
        <Breadcrumbs items={isShop ? [{ label: 'Home', to: '/' }, { label: 'Shop' }] : [{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, { label: collection.title }]} />

        <nav className="collection-nav" aria-label="Collections">
          <ul role="list">
            <li><Link to="/shop" className={isShop ? 'is-active' : ''} aria-current={isShop ? 'page' : undefined}>All</Link></li>
            {Object.values(COLLECTIONS).map((c) => (
              <li key={c.id}>
                <Link to={`/collections/${c.id}`} className={collection.id === c.id ? 'is-active' : ''} aria-current={collection.id === c.id ? 'page' : undefined}>
                  {c.title}
                </Link>
              </li>
            ))}
            <li><Link to="/bedding-sets/builder" className="collection-nav__accent">Build a Set →</Link></li>
          </ul>
        </nav>

        <div className="listing__layout">
          <aside className="listing__sidebar" aria-label="Filters">
            <div className="listing__sidebar-head">
              <h2>Filters</h2>
              {activeCount > 0 && (
                <button type="button" className="text-btn" onClick={clearAll}>
                  Clear all
                </button>
              )}
            </div>
            <FilterPanel filters={filters} options={options} onToggle={toggleFilter} />
          </aside>

          <section className="listing__main" aria-label="Products">
            <div className="toolbar">
              <form className="toolbar__search" role="search" onSubmit={(e) => e.preventDefault()}>
                <Search size={16} aria-hidden="true" />
                <label htmlFor="listing-search" className="visually-hidden">
                  Search {collection.title}
                </label>
                <input id="listing-search" type="search" placeholder={`Search ${isShop ? 'all products' : collection.title.toLowerCase()}`} value={query} onChange={(e) => setQuery(e.target.value)} />
              </form>
              <button type="button" className="btn btn--light btn--sm toolbar__filter-btn" onClick={() => setDrawerOpen(true)}>
                <SlidersHorizontal size={15} aria-hidden="true" /> Filters{activeCount ? ` (${activeCount})` : ''}
              </button>
              <p className="toolbar__count" aria-live="polite">
                {pluralize(results.length, 'product')}
              </p>
              <SortSelect value={sort} onChange={setSort} />
              <div className="toolbar__view" role="group" aria-label="Grid density">
                <button type="button" className={`icon-btn ${!dense ? 'is-active' : ''}`} aria-pressed={!dense} onClick={() => setDense(false)} aria-label="Comfortable grid (3 per row)">
                  <Rows3 size={17} />
                </button>
                <button type="button" className={`icon-btn ${dense ? 'is-active' : ''}`} aria-pressed={dense} onClick={() => setDense(true)} aria-label="Compact grid (4 per row)">
                  <LayoutGrid size={17} />
                </button>
              </div>
            </div>

            <ActiveFilters filters={filters} query={query} onRemove={removeFilter} onClearQuery={() => setQuery('')} onClearAll={clearAll} />

            {results.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No products match your selection"
                actions={
                  <>
                    <button type="button" className="btn" onClick={clearAll}>
                      Clear filters &amp; search
                    </button>
                    {!isShop && (
                      <Link to="/shop" className="btn btn--outline">
                        Browse all products
                      </Link>
                    )}
                  </>
                }
              >
                <p>
                  {query ? `We couldn’t find anything for “${query}”` : 'No products match these filters'}
                  {activeCount ? ' with the filters you chose' : ''}. Try removing a filter or searching for “linen”, “silk” or “pillow”.
                </p>
              </EmptyState>
            ) : (
              <>
                <ProductGrid products={pageItems} columns={dense ? 4 : 3} priorityCount={3} />
                {pageCount > 1 && (
                  <nav className="pagination" aria-label="Pagination">
                    <button type="button" className="icon-btn" onClick={() => setPage(page - 1)} disabled={page === 1} aria-label="Previous page">
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                      <button key={n} type="button" className={`pagination__page ${n === page ? 'is-active' : ''}`} aria-current={n === page ? 'page' : undefined} onClick={() => setPage(n)}>
                        {n}
                      </button>
                    ))}
                    <button type="button" className="icon-btn" onClick={() => setPage(page + 1)} disabled={page === pageCount} aria-label="Next page">
                      <ChevronRight size={16} />
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={`Filters${activeCount ? ` (${activeCount})` : ''}`}
        side="left"
        className="filter-drawer"
        footer={
          <div className="filter-drawer__foot">
            <button type="button" className="btn btn--outline" onClick={clearAll} disabled={!activeCount}>
              Clear all
            </button>
            <button type="button" className="btn" onClick={() => setDrawerOpen(false)}>
              Show {pluralize(results.length, 'result')}
            </button>
          </div>
        }
      >
        <FilterPanel filters={filters} options={options} onToggle={toggleFilter} />
      </Drawer>
    </>
  )
}
