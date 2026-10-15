import { COLORS, MATERIALS, SIZES, CATEGORIES, PILLOW_SIZE_FOR_BED } from '../data/catalog.js'

export const LOW_STOCK_THRESHOLD = 4
const DIMENSIONS = ['material', 'color', 'size']

export const variantKey = ({ material, color, size }) => `${material}|${color}|${size}`
export const roundMoney = (n) => Math.round(n * 100) / 100

const matchesRule = (rule, variant) => Object.entries(rule).every(([k, v]) => variant[k] === v)
const bySizeOrder = (a, b) => (SIZES[a]?.order ?? 99) - (SIZES[b]?.order ?? 99)
const unique = (arr) => [...new Set(arr)]

/** Expands a simple (non-set) product into its concrete variants. */
function expandSimpleProduct(product) {
  const variants = []
  const { pricing, unavailable = [], stock = {} } = product
  for (const material of product.materials) {
    for (const color of product.colors) {
      for (const size of product.sizes) {
        const v = { material, color, size }
        if (unavailable.some((rule) => matchesRule(rule, v))) continue
        const sizePrice = pricing.sizes[size]
        if (sizePrice == null) continue
        const price = roundMoney(sizePrice + (pricing.materials?.[material] ?? 0))
        const override = stock.overrides?.find((o) => matchesRule(o.match, v))
        variants.push({
          ...v,
          key: variantKey(v),
          sku: `${product.id}-${material}-${color}-${size}`.toUpperCase(),
          price,
          compareAtPrice: null,
          stock: override ? override.qty : (stock.default ?? 10),
        })
      }
    }
  }
  return variants
}

/**
 * Maps a set/builder selection (bed size, material, colour) to a component's own options.
 * - Duvet covers use the bed size; pillowcases & pillows use PILLOW_SIZE_FOR_BED.
 * - If a component only comes in one material/colour (e.g. white Cloud Pillow) that value is used.
 * Returns null when the component cannot match the selection.
 */
export function resolveComponentSelection(componentProduct, selection) {
  const pick = (values, wanted) => (values.includes(wanted) ? wanted : values.length === 1 ? values[0] : null)
  const size = componentProduct.category === 'duvet-covers' ? selection.size : PILLOW_SIZE_FOR_BED[selection.size]
  const material = pick(componentProduct.materials, selection.material)
  const color = pick(componentProduct.colors, selection.color)
  if (!material || !color || !size || !componentProduct.sizes.includes(size)) return null
  return { material, color, size }
}

/**
 * Builds the variants of a bundle from its components.
 * A bundle variant exists only when every component variant exists. Its price is the sum of
 * component prices × quantity minus `discountPercent`, and its stock is limited by the scarcest component.
 */
export function expandBundle({ components, discountPercent = 0, candidates }, productsById) {
  const parts = components.map((c) => ({ ...c, product: productsById[c.productId] }))
  if (parts.some((p) => !p.product)) return []
  const variants = []
  for (const material of candidates.materials) {
    for (const color of candidates.colors) {
      for (const size of candidates.sizes) {
        const selection = { material, color, size }
        const resolved = []
        for (const part of parts) {
          const sel = resolveComponentSelection(part.product, selection)
          const variant = sel && part.product.variantsByKey[variantKey(sel)]
          if (!variant) break
          resolved.push({ productId: part.productId, quantity: part.quantity, variant })
        }
        if (resolved.length !== parts.length) continue
        const compareAtPrice = roundMoney(resolved.reduce((sum, r) => sum + r.variant.price * r.quantity, 0))
        const price = roundMoney(compareAtPrice * (1 - discountPercent / 100))
        const stock = Math.min(...resolved.map((r) => Math.floor(r.variant.stock / r.quantity)))
        variants.push({
          ...selection,
          key: variantKey(selection),
          price,
          compareAtPrice: discountPercent > 0 ? compareAtPrice : null,
          stock,
          components: resolved.map((r) => ({ productId: r.productId, quantity: r.quantity, variantKey: r.variant.key, unitPrice: r.variant.price })),
        })
      }
    }
  }
  return variants
}

function finalizeProduct(product, variants) {
  const order = (list, dimension) => unique(list.filter((value) => variants.some((v) => v[dimension] === value)))
  const availableMaterials = order(product.materials, 'material')
  const availableColors = order(product.colors, 'color')
  const availableSizes = order(product.sizes, 'size').sort(bySizeOrder)
  const prices = variants.map((v) => v.price)
  const category = CATEGORIES.find((c) => c.id === product.category)
  return {
    ...product,
    isBundle: Boolean(product.bundle),
    materials: availableMaterials,
    colors: availableColors,
    sizes: availableSizes,
    availableMaterials,
    availableColors,
    availableSizes,
    variants,
    variantsByKey: Object.fromEntries(variants.map((v) => [v.key, v])),
    inventory: Object.fromEntries(variants.map((v) => [v.key, v.stock])),
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
    categoryName: category?.name ?? product.category,
    searchText: [
      product.name,
      product.tagline,
      category?.name,
      ...availableMaterials.map((m) => MATERIALS[m]?.name),
      ...availableColors.map((c) => COLORS[c]?.name),
    ]
      .join(' ')
      .toLowerCase(),
  }
}

/** Processes raw product definitions into the catalog used by the app. */
export function buildCatalog(rawProducts) {
  const byId = {}
  for (const raw of rawProducts.filter((p) => !p.bundle)) {
    byId[raw.id] = finalizeProduct(raw, expandSimpleProduct(raw))
  }
  for (const raw of rawProducts.filter((p) => p.bundle)) {
    const lead = byId[raw.bundle.components[0].productId]
    const candidates = { materials: lead.materials, colors: lead.colors, sizes: lead.sizes }
    const variants = expandBundle({ ...raw.bundle, candidates }, byId)
    byId[raw.id] = finalizeProduct({ ...raw, ...candidates }, variants)
  }
  return rawProducts.map((p) => byId[p.id])
}

// ─── Selection helpers (product page, set builder) ──────────────────────────

export const findVariant = (product, selection) => product.variantsByKey[variantKey(selection)] ?? null

/** True if any variant has `dimension = value` while keeping the other selected options. */
export function isOptionCompatible(product, dimension, value, selection) {
  return product.variants.some(
    (v) => v[dimension] === value && DIMENSIONS.every((d) => d === dimension || v[d] === selection[d]),
  )
}

/** True if any variant has `dimension = value` at all (ignoring other selections). */
export const isOptionOffered = (product, dimension, value) => product.variants.some((v) => v[dimension] === value)

/** Picks a sensible starting selection: the first in-stock variant, optionally preferring some options. */
export function getDefaultSelection(product, preferred = {}) {
  // Queen is the most common bed size, so bed products open on it unless told otherwise.
  if (!preferred.size && product.variants.some((v) => v.size === 'queen')) preferred = { ...preferred, size: 'queen' }
  const score = (v) =>
    (v.stock > 0 ? 100 : 0) + DIMENSIONS.reduce((s, d) => s + (preferred[d] && v[d] === preferred[d] ? 10 : 0), 0)
  const best = [...product.variants].sort((a, b) => score(b) - score(a))[0]
  return best ? { material: best.material, color: best.color, size: best.size } : null
}

/**
 * Applies a change to one option. If the resulting combination doesn't exist (or is sold out
 * while an in-stock alternative exists), the closest valid variant is chosen and the changed
 * dimensions are reported so the UI can explain the adjustment.
 */
export function changeSelection(product, selection, dimension, value) {
  const next = { ...selection, [dimension]: value }
  const exact = findVariant(product, next)
  if (exact && exact.stock > 0) return { selection: next, adjusted: [] }
  const candidates = product.variants.filter((v) => v[dimension] === value)
  if (!candidates.length) return { selection, adjusted: [] }
  const score = (v) =>
    (v.stock > 0 ? 100 : 0) + DIMENSIONS.reduce((s, d) => s + (v[d] === selection[d] ? (d === 'size' ? 3 : 2) : 0), 0)
  const best = [...candidates].sort((a, b) => score(b) - score(a))[0]
  if (exact && best.stock === 0) return { selection: next, adjusted: [] }
  const chosen = { material: best.material, color: best.color, size: best.size }
  return { selection: chosen, adjusted: DIMENSIONS.filter((d) => d !== dimension && chosen[d] !== selection[d]) }
}

/** Human readable availability for a variant. */
export function getAvailability(variant) {
  if (!variant) return { state: 'unavailable', label: 'Not available in this combination' }
  if (variant.stock <= 0) return { state: 'out', label: 'Sold out in this option' }
  if (variant.stock <= LOW_STOCK_THRESHOLD) return { state: 'low', label: `Only ${variant.stock} left` }
  return { state: 'in', label: 'In stock — ships in 1–2 business days' }
}

/** Gallery image keys for a product in a given colour. */
export const getProductImageKeys = (product, color) =>
  (color && product.colorImages?.[color]) || product.images

export const describeSelection = ({ material, color, size }) =>
  [SIZES[size]?.name, MATERIALS[material]?.short, COLORS[color]?.name].filter(Boolean)
