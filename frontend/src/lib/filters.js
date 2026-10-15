import { PRICE_RANGES } from '../data/catalog.js'

export const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
]

export const FILTER_KEYS = ['category', 'size', 'material', 'color', 'price']

export const EMPTY_FILTERS = { category: [], size: [], material: [], color: [], price: [] }

/**
 * Filters products. Within one filter group values are OR-ed; across groups they are AND-ed.
 * Size / material / colour / price must all be satisfied by the SAME variant, so selecting
 * "Linen" + "Black" never shows a product that has no linen-black variant.
 */
export function filterProducts(products, { query = '', filters = EMPTY_FILTERS } = {}) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const ranges = PRICE_RANGES.filter((r) => filters.price?.includes(r.id))

  return products.filter((product) => {
    if (terms.length && !terms.every((t) => product.searchText.includes(t))) return false
    if (filters.category?.length && !filters.category.includes(product.category)) return false

    const variantFilterActive = ['size', 'material', 'color'].some((k) => filters[k]?.length) || ranges.length
    if (!variantFilterActive) return true

    return product.variants.some(
      (v) =>
        (!filters.size?.length || filters.size.includes(v.size)) &&
        (!filters.material?.length || filters.material.includes(v.material)) &&
        (!filters.color?.length || filters.color.includes(v.color)) &&
        (!ranges.length || ranges.some((r) => v.price >= r.min && v.price < r.max)),
    )
  })
}

export function sortProducts(products, sortId) {
  const list = [...products]
  switch (sortId) {
    case 'newest':
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'price-asc':
      return list.sort((a, b) => a.priceRange.min - b.priceRange.min)
    case 'price-desc':
      return list.sort((a, b) => b.priceRange.max - a.priceRange.max)
    default:
      // Featured: featured first, then best sellers, then catalog order.
      return list
        .map((p, i) => ({ p, i }))
        .sort((a, b) => Number(b.p.featured) - Number(a.p.featured) || Number(b.p.bestSeller) - Number(a.p.bestSeller) || a.i - b.i)
        .map(({ p }) => p)
  }
}

export const countActiveFilters = (filters) => FILTER_KEYS.reduce((n, k) => n + (filters[k]?.length ?? 0), 0)
