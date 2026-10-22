import { COLORS, MATERIALS, SIZES, CATEGORIES, PILLOW_SIZE_FOR_BED } from '../data/catalog.js'

export const DEFAULT_LOW_STOCK_THRESHOLD = 4
export const DIMENSIONS = ['material', 'color', 'size']
/** Product field that lists each dimension's options. */
export const OPTION_FIELDS = { material: 'materials', color: 'colors', size: 'sizes' }
/** Shared presets, used as a fallback label for ids a product no longer defines. */
export const OPTION_LIBRARIES = { material: MATERIALS, color: COLORS, size: SIZES }

export const variantKey = ({ material, color, size }) => `${material}|${color}|${size}`
export const parseVariantKey = (key) => {
  const [material, color, size] = String(key).split('|')
  return { material, color, size }
}
export const roundMoney = (n) => Math.round(n * 100) / 100

export const matchesRule = (rule, variant) => Object.entries(rule).every(([k, v]) => variant[k] === v)
const unique = (arr) => [...new Set(arr)]
const isNumber = (n) => typeof n === 'number' && Number.isFinite(n)
const enabledOptions = (list) => (list ?? []).filter((o) => o.enabled !== false)

/**
 * Editable product model (what the Admin edits and the store persists) — see src/store/seed.js.
 * Each product owns its options:
 *   materials [{ id, name, short, description, surcharge, enabled }]
 *   colors    [{ id, name, hex, enabled }]
 *   sizes     [{ id, name, dims, price, enabled }]
 * plus `unavailable` partial-match rules (combinations that are not produced), `variantSettings`
 * keyed by variant key ({ available?, stock?, price? }) and `defaultStock` for combinations without
 * an explicit stock level.
 */

/**
 * Every combination of a simple product's ENABLED options — including those that are not sold:
 *   restricted  removed by one of the product's `unavailable` rules (not produced)
 *   offered     false when the combination is restricted or switched off for this variant
 * Disabled options produce no combinations at all.
 */
export function listCombinations(product) {
  const settingsByKey = product.variantSettings ?? {}
  const rules = product.unavailable ?? []
  const result = []
  for (const m of enabledOptions(product.materials)) {
    for (const c of enabledOptions(product.colors)) {
      for (const s of enabledOptions(product.sizes)) {
        const selection = { material: m.id, color: c.id, size: s.id }
        const key = variantKey(selection)
        const settings = settingsByKey[key] ?? {}
        const restricted = rules.some((rule) => matchesRule(rule, selection))
        const basePrice = roundMoney((Number(s.price) || 0) + (Number(m.surcharge) || 0))
        const priceOverride = isNumber(settings.price) ? roundMoney(settings.price) : null
        result.push({
          ...selection,
          key,
          restricted,
          offered: !restricted && settings.available !== false,
          basePrice,
          priceOverride,
          price: priceOverride ?? basePrice,
          stock: isNumber(settings.stock) ? settings.stock : (product.defaultStock ?? 10),
          stockOverride: isNumber(settings.stock),
        })
      }
    }
  }
  return result
}

export const variantSku = (product, { material, color, size }) =>
  `${product.skuPrefix || product.id}-${material}-${color}-${size}`.toUpperCase()

/** Expands a simple (non-set) product into the variants a customer can choose. */
function expandSimpleProduct(product) {
  return listCombinations(product)
    .filter((c) => c.offered)
    .map(({ material, color, size, key, price, stock }) => ({
      material,
      color,
      size,
      key,
      sku: variantSku(product, { material, color, size }),
      price,
      compareAtPrice: null,
      stock,
    }))
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
 * Builds the variants of a ready-made bundle from its components.
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

/** Per-product option lookup: { material: { id: option }, color: {…}, size: {…} } with each option's position. */
function buildOptionInfo(product) {
  const info = {}
  for (const dim of DIMENSIONS) {
    info[dim] = Object.fromEntries((product[OPTION_FIELDS[dim]] ?? []).map((o, order) => [o.id, { ...o, order }]))
  }
  return info
}

const EMPTY_OPTION_INFO = { material: {}, color: {}, size: {} }

function finalizeProduct(product, variants, optionInfo) {
  // Options keep the product's own order (sizes as arranged in the Admin, which defaults to small → large).
  const ordered = (dim) =>
    unique(
      Object.values(optionInfo[dim])
        .sort((a, b) => a.order - b.order)
        .map((o) => o.id)
        .filter((id) => variants.some((v) => v[dim] === id)),
    )
  const availableMaterials = ordered('material')
  const availableColors = ordered('color')
  const availableSizes = ordered('size')
  const prices = variants.map((v) => v.price)
  const category = CATEGORIES.find((c) => c.id === product.category)
  const status = product.status ?? 'active'
  const name = (dim, id) => optionInfo[dim][id]?.name ?? OPTION_LIBRARIES[dim][id]?.name
  return {
    ...product,
    status,
    isBundle: Boolean(product.bundle),
    optionInfo,
    materials: availableMaterials,
    colors: availableColors,
    sizes: availableSizes,
    availableMaterials,
    availableColors,
    availableSizes,
    variants,
    variantsByKey: Object.fromEntries(variants.map((v) => [v.key, v])),
    inventory: Object.fromEntries(variants.map((v) => [v.key, v.stock])),
    priceRange: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: 0, max: 0 },
    // Customers can only see and buy active products that have at least one variant.
    isPurchasable: status === 'active' && variants.length > 0,
    categoryName: category?.name ?? product.category,
    searchText: [
      product.name,
      product.tagline,
      category?.name,
      ...availableMaterials.map((m) => name('material', m)),
      ...availableColors.map((c) => name('color', c)),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  }
}

const buildSimple = (product) => finalizeProduct(product, expandSimpleProduct(product), buildOptionInfo(product))

function buildBundle(product, productsById) {
  const components = product.bundle.components ?? []
  const lead = productsById[components[0]?.productId]
  // A ready-made set is only sold while every product it contains is itself active.
  const usable = lead && components.every((c) => productsById[c.productId]?.status === 'active' && !productsById[c.productId].isBundle)
  if (!usable) return finalizeProduct(product, [], lead?.optionInfo ?? EMPTY_OPTION_INFO)
  const candidates = { materials: lead.materials, colors: lead.colors, sizes: lead.sizes }
  return finalizeProduct(product, expandBundle({ ...product.bundle, candidates }, productsById), lead.optionInfo)
}

/** Processes one editable product. Bundles need the processed simple products they contain. */
export const buildProduct = (product, productsById) => (product.bundle ? buildBundle(product, productsById) : buildSimple(product))

/** Processes editable product definitions (any status) into the catalog used by the app. */
export function buildCatalog(products) {
  const byId = {}
  for (const p of products.filter((p) => !p.bundle)) byId[p.id] = buildSimple(p)
  for (const p of products.filter((p) => p.bundle)) byId[p.id] = buildBundle(p, byId)
  return products.map((p) => byId[p.id])
}

/**
 * Cross-product option index for shop filters: shared presets first (so filter labels stay
 * consistent), then any option a product defined itself under a new id.
 */
export function buildOptionIndex(products) {
  const index = {}
  for (const dim of DIMENSIONS) {
    index[dim] = Object.fromEntries(Object.entries(OPTION_LIBRARIES[dim]).map(([id, o]) => [id, { ...o, order: o.order ?? 0 }]))
    for (const p of products) {
      for (const id of p[OPTION_FIELDS[dim]]) {
        if (!index[dim][id]) index[dim][id] = { ...p.optionInfo[dim][id], order: 100 + (p.optionInfo[dim][id]?.order ?? 0) }
      }
    }
  }
  return index
}

// ─── Option labels ───────────────────────────────────────────────────────────

/** A product's own definition of an option, falling back to the shared preset. */
export function getOptionInfo(product, dimension, id) {
  if (id == null) return null
  return product?.optionInfo?.[dimension]?.[id] ?? OPTION_LIBRARIES[dimension]?.[id] ?? { id, name: id }
}

/** Short display label: material short name, colour name or size name. */
export function optionLabel(product, dimension, id) {
  const option = getOptionInfo(product, dimension, id)
  if (!option) return undefined
  return dimension === 'material' ? option.short || option.name : option.name
}

// ─── Selection helpers (product page, set builder) ──────────────────────────

export const findVariant = (product, selection) => (selection ? (product.variantsByKey[variantKey(selection)] ?? null) : null)

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

/** Human readable availability for a variant. `threshold` is the store's low-stock threshold. */
export function getAvailability(variant, threshold = DEFAULT_LOW_STOCK_THRESHOLD) {
  if (!variant) return { state: 'unavailable', label: 'Not available in this combination' }
  if (variant.stock <= 0) return { state: 'out', label: 'Sold out in this option' }
  if (variant.stock <= threshold) return { state: 'low', label: `Only ${variant.stock} left` }
  return { state: 'in', label: 'In stock — ships in 1–2 business days' }
}

/** Gallery image keys for a product in a given colour. */
export const getProductImageKeys = (product, color) =>
  (color && product.colorImages?.[color]?.length ? product.colorImages[color] : null) || product.images

/** ["Queen", "Linen", "White"] for a product's selection. */
export const describeSelection = (product, { material, color, size }) =>
  [optionLabel(product, 'size', size), optionLabel(product, 'material', material), optionLabel(product, 'color', color)].filter(Boolean)
