import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PRICE_RANGES, SIZES } from '../data/catalog.js'
import { EMPTY_FILTERS, FILTER_KEYS, SORT_OPTIONS, filterProducts, sortProducts } from '../lib/filters.js'

export const PAGE_SIZE = 12

/**
 * Search, filters, sorting and pagination stored in the URL (?q=&color=sage,white&sort=newest&page=2),
 * so results are shareable and survive refresh / back navigation.
 */
export function useProductFilters(baseProducts) {
  const [params, setParams] = useSearchParams()

  const query = params.get('q') ?? ''
  const sortParam = params.get('sort')
  const sort = SORT_OPTIONS.some((o) => o.id === sortParam) ? sortParam : 'featured'
  const filters = useMemo(() => {
    const f = { ...EMPTY_FILTERS }
    for (const key of FILTER_KEYS) f[key] = (params.get(key) ?? '').split(',').filter(Boolean)
    return f
  }, [params])

  // Build from window.location (always current) rather than the params of the last render,
  // so two quick filter clicks before a re-render can't overwrite each other.
  const update = useCallback(
    (mutate) => {
      const next = new URLSearchParams(window.location.search)
      mutate(next)
      next.delete('page')
      setParams(next, { replace: true, preventScrollReset: true })
    },
    [setParams],
  )

  const toggleFilter = useCallback(
    (key, id) =>
      update((next) => {
        const values = new Set((next.get(key) ?? '').split(',').filter(Boolean))
        if (values.has(id)) values.delete(id)
        else values.add(id)
        if (values.size) next.set(key, [...values].join(','))
        else next.delete(key)
      }),
    [update],
  )

  const setQuery = useCallback((q) => update((next) => (q ? next.set('q', q) : next.delete('q'))), [update])
  const setSort = useCallback((s) => update((next) => (s === 'featured' ? next.delete('sort') : next.set('sort', s))), [update])
  const clearAll = useCallback(() => update((next) => [...FILTER_KEYS, 'q'].forEach((k) => next.delete(k))), [update])
  const setPage = useCallback(
    (page) =>
      setParams(() => {
        const next = new URLSearchParams(window.location.search)
        if (page > 1) next.set('page', String(page))
        else next.delete('page')
        return next
      }),
    [setParams],
  )

  const results = useMemo(() => sortProducts(filterProducts(baseProducts, { query, filters }), sort), [baseProducts, query, filters, sort])

  /** Values present in the base product set, with how many products offer each. */
  const options = useMemo(() => {
    const count = (getter) => {
      const map = new Map()
      for (const p of baseProducts) for (const v of new Set(getter(p))) map.set(v, (map.get(v) ?? 0) + 1)
      return map
    }
    const sizes = count((p) => p.availableSizes)
    const priceCounts = PRICE_RANGES.map((r) => [r.id, baseProducts.filter((p) => p.variants.some((v) => v.price >= r.min && v.price < r.max)).length])
    return {
      category: [...count((p) => [p.category])],
      size: [...sizes].sort((a, b) => SIZES[a[0]].order - SIZES[b[0]].order),
      material: [...count((p) => p.availableMaterials)],
      color: [...count((p) => p.availableColors)],
      price: priceCounts.filter(([, n]) => n > 0),
    }
  }, [baseProducts])

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1), pageCount)
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return { query, sort, filters, results, pageItems, page, pageCount, options, toggleFilter, setQuery, setSort, clearAll, setPage }
}
