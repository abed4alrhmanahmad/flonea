/**
 * Factory defaults for the store, built from the existing data files. Nothing here is persisted
 * until the Admin changes something, so updating the data files still updates untouched stores.
 */
import { COLLECTIONS, COLORS, MATERIALS, SHIPPING, SIZES } from '../data/catalog.js'
import { DEFAULT_CONTENT } from '../data/content.js'
import { SEED_PRODUCTS } from '../data/products.js'
import { COUNTRIES } from '../lib/validation.js'
import { DEFAULT_LOW_STOCK_THRESHOLD, matchesRule, variantKey } from '../lib/variants.js'

const clone = (value) => JSON.parse(JSON.stringify(value))
const bySizeOrder = (a, b) => (SIZES[a]?.order ?? 99) - (SIZES[b]?.order ?? 99)

/** Legacy stock rule for one variant: the first matching override, else the default. */
function legacyStock(raw, selection) {
  const override = raw.stock?.overrides?.find((o) => matchesRule(o.match, selection))
  return override ? override.qty : (raw.stock?.default ?? 10)
}

/**
 * Converts a raw seed product (shared option ids + pricing tables) into the editable model where
 * the product owns copies of its sizes, colours and materials. Prices and stock are unchanged.
 */
export function productFromSeed(raw) {
  const common = {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    category: raw.category,
    tagline: raw.tagline ?? '',
    description: raw.description ?? '',
    status: 'active',
    featured: Boolean(raw.featured),
    bestSeller: Boolean(raw.bestSeller),
    isNew: Boolean(raw.isNew),
    createdAt: raw.createdAt ?? '2025-01-01',
    updatedAt: null,
    skuPrefix: '',
    images: [...(raw.images ?? [])],
    imageAlts: {},
    colorImages: clone(raw.colorImages ?? {}),
    specs: clone(raw.specs ?? []),
    care: [...(raw.care ?? [])],
    relatedProducts: [...(raw.relatedProducts ?? [])],
    rating: { ...(raw.rating ?? { average: 0, count: 0 }) },
    setEligible: true,
  }

  if (raw.bundle) {
    return {
      ...common,
      bundle: clone(raw.bundle),
      materials: [],
      colors: [],
      sizes: [],
      unavailable: [],
      variantSettings: {},
      defaultStock: 0,
    }
  }

  const sizes = raw.sizes.filter((id) => raw.pricing.sizes[id] != null).sort(bySizeOrder)
  const unavailable = clone(raw.unavailable ?? [])
  const defaultStock = raw.stock?.default ?? 10
  // Only stock levels that differ from the default are stored explicitly.
  const variantSettings = {}
  for (const material of raw.materials) {
    for (const color of raw.colors) {
      for (const size of sizes) {
        const selection = { material, color, size }
        if (unavailable.some((rule) => matchesRule(rule, selection))) continue
        const stock = legacyStock(raw, selection)
        if (stock !== defaultStock) variantSettings[variantKey(selection)] = { stock }
      }
    }
  }

  return {
    ...common,
    materials: raw.materials.map((id) => ({
      id,
      name: MATERIALS[id]?.name ?? id,
      short: MATERIALS[id]?.short ?? id,
      description: MATERIALS[id]?.description ?? '',
      surcharge: raw.pricing.materials?.[id] ?? 0,
      enabled: true,
    })),
    colors: raw.colors.map((id) => ({ id, name: COLORS[id]?.name ?? id, hex: COLORS[id]?.hex ?? '#FFFFFF', enabled: true })),
    sizes: sizes.map((id) => ({ id, name: SIZES[id]?.name ?? id, dims: SIZES[id]?.dims ?? '', price: raw.pricing.sizes[id], enabled: true })),
    unavailable,
    variantSettings,
    defaultStock,
  }
}

/** "Featured" listing order used before collections had a manual order (featured → best seller → catalog). */
function legacyListingOrder(products) {
  return products
    .map((p, i) => ({ p, i }))
    .sort((a, b) => Number(b.p.featured) - Number(a.p.featured) || Number(b.p.bestSeller) - Number(a.p.bestSeller) || a.i - b.i)
    .map(({ p }) => p.id)
}

/** The three original collections are core: their routes are linked across the site (and two feed Build a Set). */
export const CORE_COLLECTION_IDS = Object.keys(COLLECTIONS)

export function seedCollections(products) {
  return Object.values(COLLECTIONS).map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: c.subtitle,
    image: c.image,
    enabled: true,
    listed: true,
    // Same order customers saw before collections became editable.
    productIds: legacyListingOrder(products.filter((p) => c.categories.includes(p.category))),
  }))
}

export const DEFAULT_SETTINGS = {
  storeName: 'FLONEA',
  logoUrl: '',
  contact: { email: 'hello@flonea.example', phone: '', hours: 'Monday to Friday, 9:00–18:00' },
  social: { instagram: '', facebook: '', pinterest: '' },
  currency: { code: 'USD' },
  shipping: {
    freeThreshold: SHIPPING.freeThreshold,
    methods: SHIPPING.methods.map((m) => ({ ...m, enabled: true })),
  },
  inventory: { lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD },
  checkout: { defaultCountry: 'Lebanon', countries: [...COUNTRIES] },
}

/** Build a Set settings. Role ids, labels and which categories fill each role are fixed in data/setBuilder.js. */
export const DEFAULT_SET_BUILDER = {
  roles: {
    pillow: { hint: 'Each product is one complete item — choose its own size, material and colour.', maxQuantity: 10 },
    duvet: { hint: 'Choose the size, material and colour for your bed — it doesn’t have to match your pillows.', maxQuantity: 1 },
  },
}

export function createSeedData() {
  const products = SEED_PRODUCTS.map(productFromSeed)
  return {
    products,
    collections: seedCollections(SEED_PRODUCTS),
    content: clone(DEFAULT_CONTENT),
    settings: clone(DEFAULT_SETTINGS),
    setBuilder: clone(DEFAULT_SET_BUILDER),
  }
}
