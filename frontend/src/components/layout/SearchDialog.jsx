import { useDeferredValue, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import Drawer from '../ui/Drawer.jsx'
import Img from '../ui/Img.jsx'
import { filterProducts } from '../../lib/filters.js'
import { useCatalog } from '../../store/hooks.js'
import { formatPriceRange } from '../../lib/format.js'

const SUGGESTIONS = ['Linen', 'Silk', 'Forest Green', 'Pillow', 'King', 'Set']

export default function SearchDialog({ open, onClose }) {
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)
  const navigate = useNavigate()
  const { products } = useCatalog()
  const results = useMemo(() => (deferred.trim() ? filterProducts(products, { query: deferred }) : []), [deferred, products])

  const submit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/shop?q=${encodeURIComponent(query.trim())}`)
    onClose()
  }

  return (
    <Drawer open={open} onClose={onClose} title="Search FLONEA" side="top" className="search-dialog">
      <form onSubmit={submit} className="search-dialog__form" role="search">
        <Search size={20} aria-hidden="true" />
        <label htmlFor="site-search" className="visually-hidden">
          Search products
        </label>
        <input
          id="site-search"
          data-autofocus
          className="search-dialog__input"
          type="search"
          placeholder="Search duvet covers, pillows, linen…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" className="btn btn--sm">
          Search
        </button>
      </form>

      {!query.trim() && (
        <div className="search-dialog__suggest">
          <p className="eyebrow">Popular searches</p>
          <ul role="list">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <button type="button" className="chip" onClick={() => setQuery(s)}>
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {query.trim() && (
        <div className="search-dialog__results" aria-live="polite">
          <p className="muted search-dialog__count">
            {results.length ? `${results.length} result${results.length === 1 ? '' : 's'}` : `No products match “${query.trim()}”. Try “linen” or “pillow”.`}
          </p>
          <ul role="list">
            {results.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link to={`/products/${p.slug}`} className="search-result" onClick={onClose}>
                  <Img name={p.images[0]} alt="" ratio="1 / 1" sizes="64px" />
                  <span>
                    <span className="search-result__name">{p.name}</span>
                    <span className="search-result__meta">
                      {p.categoryName} · {formatPriceRange(p.priceRange)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {results.length > 6 && (
            <button type="button" className="link-arrow" onClick={submit}>
              View all {results.length} results
            </button>
          )}
        </div>
      )}
    </Drawer>
  )
}
