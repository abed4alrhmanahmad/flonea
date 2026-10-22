/**
 * Sanitisers for data read back from localStorage. Stored data may be missing, hand-edited,
 * truncated or written by an older version, so every value is checked and anything invalid falls
 * back to the factory default (or is dropped) instead of reaching the UI.
 *
 * A small schema DSL keeps this declarative: `parse(schema, value, fallback)` returns a value that
 * matches the schema, using `fallback` (the seed value) wherever the stored value is unusable.
 */
import { CATEGORIES, CURRENCIES } from '../data/catalog.js'
import { isImageRef } from '../data/images.js'
import { DIMENSIONS } from '../lib/variants.js'
import { CORE_COLLECTION_IDS } from './seed.js'

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)))
let idCounter = 0
export const makeId = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}${(idCounter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`

// ─── Schema DSL ──────────────────────────────────────────────────────────────

export const s = {
  str: (def = '', max = 2000) => ({ kind: 'str', def, max }),
  num: (def = 0, { min = -Infinity, max = Infinity, int = false } = {}) => ({ kind: 'num', def, min, max, int }),
  bool: (def = false) => ({ kind: 'bool', def }),
  oneOf: (values, def = values[0]) => ({ kind: 'oneOf', values, def }),
  obj: (shape) => ({ kind: 'obj', shape }),
  arr: (item, max = 500) => ({ kind: 'arr', item, max }),
  map: (value) => ({ kind: 'map', value }),
  nullable: (inner) => ({ kind: 'nullable', inner }),
  any: () => ({ kind: 'any' }),
}

const defaultOf = (schema) => {
  switch (schema.kind) {
    case 'obj':
      return Object.fromEntries(Object.entries(schema.shape).map(([k, v]) => [k, defaultOf(v)]))
    case 'arr':
      return []
    case 'map':
      return {}
    case 'nullable':
      return null
    case 'any':
      return undefined
    default:
      return schema.def
  }
}

/** True when a primitive value satisfies its schema. */
function primitiveOk(schema, value) {
  switch (schema.kind) {
    case 'str':
      return typeof value === 'string'
    case 'num':
      return typeof value === 'number' && Number.isFinite(value) && (!schema.int || Number.isInteger(value)) && value >= schema.min && value <= schema.max
    case 'bool':
      return typeof value === 'boolean'
    case 'oneOf':
      return schema.values.includes(value)
    default:
      return true
  }
}

const PRIMITIVES = ['str', 'num', 'bool', 'oneOf']

/** Returns a value matching `schema`, built from `value` where valid and `fallback` (or the schema default) elsewhere. */
export function parse(schema, value, fallback) {
  const fb = () => (fallback !== undefined ? clone(fallback) : defaultOf(schema))
  switch (schema.kind) {
    case 'str':
      return primitiveOk(schema, value) ? value.slice(0, schema.max) : fb()
    case 'num':
    case 'bool':
    case 'oneOf':
      return primitiveOk(schema, value) ? value : fb()
    case 'nullable': {
      // Missing or invalid → null ("not set"), never a made-up value.
      const unset = () => (fallback === undefined || fallback === null ? null : clone(fallback))
      if (value === null || value === undefined) return unset()
      if (PRIMITIVES.includes(schema.inner.kind) && !primitiveOk(schema.inner, value)) return unset()
      return parse(schema.inner, value, fallback ?? undefined)
    }
    case 'obj': {
      if (!isObject(value)) return fb()
      const out = {}
      for (const [key, sub] of Object.entries(schema.shape)) out[key] = parse(sub, value[key], fallback?.[key])
      return out
    }
    case 'arr': {
      if (!Array.isArray(value)) return fb()
      const out = []
      for (const item of value.slice(0, schema.max)) {
        // Array items have no per-item fallback; malformed objects are skipped rather than blanked.
        if (schema.item.kind === 'obj' && !isObject(item)) continue
        if (schema.item.kind === 'str' && typeof item !== 'string') continue
        out.push(parse(schema.item, item, undefined))
      }
      // Items with an id must have a unique, non-empty one.
      if (schema.item.kind === 'obj' && 'id' in schema.item.shape) {
        const seen = new Set()
        for (const item of out) {
          if (!item.id || seen.has(item.id)) item.id = makeId('item')
          seen.add(item.id)
        }
      }
      return out
    }
    case 'map': {
      if (!isObject(value)) return fb()
      const out = {}
      for (const [k, v] of Object.entries(value)) {
        if (schema.value.kind === 'obj' && !isObject(v)) continue
        out[k] = parse(schema.value, v, undefined)
      }
      return out
    }
    default:
      return value === undefined ? fb() : clone(value)
  }
}

/** Builds a schema from an example value (used for content, whose shape is defined by DEFAULT_CONTENT). */
export function schemaFromExample(example) {
  if (Array.isArray(example)) {
    if (!example.length || typeof example[0] === 'string') return s.arr(s.str())
    return s.arr(schemaFromExample(example[0]))
  }
  if (isObject(example)) return s.obj(Object.fromEntries(Object.entries(example).map(([k, v]) => [k, schemaFromExample(v)])))
  if (typeof example === 'number') return s.num(0, { min: 0, max: 1e6 })
  if (typeof example === 'boolean') return s.bool(example)
  return s.str('', 5000)
}

// ─── Products ────────────────────────────────────────────────────────────────

const optionBase = { id: s.str(''), name: s.str('', 120), enabled: s.bool(true) }
const PRODUCT_SCHEMA = s.obj({
  id: s.str(''),
  slug: s.str(''),
  name: s.str('', 160),
  category: s.oneOf(CATEGORIES.map((c) => c.id)),
  tagline: s.str('', 300),
  description: s.str('', 5000),
  status: s.oneOf(['active', 'draft', 'archived'], 'active'),
  featured: s.bool(false),
  bestSeller: s.bool(false),
  isNew: s.bool(false),
  createdAt: s.str('2025-01-01', 40),
  updatedAt: s.nullable(s.str('', 40)),
  skuPrefix: s.str('', 40),
  images: s.arr(s.str('', 1000), 30),
  imageAlts: s.map(s.str('', 300)),
  colorImages: s.map(s.arr(s.str('', 1000), 30)),
  specs: s.arr(s.arr(s.str('', 500), 2), 40),
  care: s.arr(s.str('', 500), 40),
  relatedProducts: s.arr(s.str(''), 20),
  rating: s.obj({ average: s.num(0, { min: 0, max: 5 }), count: s.num(0, { min: 0, int: true }) }),
  setEligible: s.bool(true),
  materials: s.arr(s.obj({ ...optionBase, short: s.str('', 60), description: s.str('', 1000), surcharge: s.num(0, { min: -100000, max: 100000 }) }), 30),
  colors: s.arr(s.obj({ ...optionBase, hex: s.str('#FFFFFF', 9) }), 40),
  sizes: s.arr(s.obj({ ...optionBase, dims: s.str('', 80), price: s.num(0, { min: 0, max: 1000000 }) }), 30),
  unavailable: s.arr(s.map(s.str('', 80)), 200),
  variantSettings: s.map(
    s.obj({
      available: s.nullable(s.bool(true)),
      stock: s.nullable(s.num(0, { min: 0, max: 1000000, int: true })),
      price: s.nullable(s.num(0, { min: 0, max: 1000000 })),
    }),
  ),
  defaultStock: s.num(10, { min: 0, max: 1000000, int: true }),
  bundle: s.nullable(
    s.obj({
      components: s.arr(s.obj({ productId: s.str(''), quantity: s.num(1, { min: 1, max: 10, int: true }) }), 10),
      discountPercent: s.num(0, { min: 0, max: 90 }),
    }),
  ),
})

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const compact = (settings) => Object.fromEntries(Object.entries(settings).filter(([, v]) => v !== null && v !== undefined))

/** Validates one stored product. Returns null when it can't be used at all. */
export function sanitizeProduct(raw) {
  if (!isObject(raw) || typeof raw.id !== 'string' || !raw.id || typeof raw.slug !== 'string' || !raw.slug) return null
  if (!CATEGORIES.some((c) => c.id === raw.category)) return null
  const p = parse(PRODUCT_SCHEMA, raw, undefined)
  if (!p.name.trim()) return null
  const dedupe = (list) => {
    const seen = new Set()
    return list.filter((o) => o.id && !o.id.includes('|') && !seen.has(o.id) && seen.add(o.id))
  }
  p.materials = dedupe(p.materials)
  p.colors = dedupe(p.colors).map((c) => (HEX.test(c.hex) ? c : { ...c, hex: '#FFFFFF' }))
  p.sizes = dedupe(p.sizes)
  p.images = p.images.filter(isImageRef)
  p.colorImages = Object.fromEntries(Object.entries(p.colorImages).map(([k, v]) => [k, v.filter(isImageRef)]).filter(([, v]) => v.length))
  p.specs = p.specs.filter((pair) => pair.length === 2 && pair[0].trim())
  p.unavailable = p.unavailable
    .map((rule) => Object.fromEntries(Object.entries(rule).filter(([k, v]) => DIMENSIONS.includes(k) && v)))
    .filter((rule) => Object.keys(rule).length)
  p.variantSettings = Object.fromEntries(
    Object.entries(p.variantSettings)
      .filter(([key]) => key.split('|').length === 3)
      .map(([key, v]) => [key, compact(v)])
      .filter(([, v]) => Object.keys(v).length),
  )
  if (p.bundle) {
    p.bundle.components = p.bundle.components.filter((c) => c.productId && c.productId !== p.id)
    if (!p.bundle.components.length) p.bundle = null
  }
  if (!p.bundle) delete p.bundle
  return p
}

// ─── Collections, settings, Build a Set ─────────────────────────────────────

const COLLECTION_SCHEMA = s.obj({
  id: s.str(''),
  title: s.str('', 120),
  subtitle: s.str('', 400),
  image: s.str('', 1000),
  enabled: s.bool(true),
  listed: s.bool(true),
  productIds: s.arr(s.str(''), 500),
})

const SETTINGS_SCHEMA = s.obj({
  storeName: s.str('FLONEA', 60),
  logoUrl: s.str('', 1000),
  contact: s.obj({ email: s.str('', 160), phone: s.str('', 40), hours: s.str('', 160) }),
  social: s.obj({ instagram: s.str('', 300), facebook: s.str('', 300), pinterest: s.str('', 300) }),
  currency: s.obj({ code: s.oneOf(CURRENCIES.map((c) => c.code), 'USD') }),
  shipping: s.obj({
    freeThreshold: s.num(100, { min: 0, max: 1000000 }),
    methods: s.arr(
      s.obj({
        id: s.str(''),
        name: s.str('', 80),
        eta: s.str('', 80),
        price: s.num(0, { min: 0, max: 100000 }),
        freeOverThreshold: s.bool(false),
        enabled: s.bool(true),
      }),
      10,
    ),
  }),
  inventory: s.obj({ lowStockThreshold: s.num(4, { min: 0, max: 100000, int: true }) }),
  checkout: s.obj({ defaultCountry: s.str('', 80), countries: s.arr(s.str('', 80), 250) }),
})

const SET_BUILDER_SCHEMA = s.obj({
  roles: s.obj({
    pillow: s.obj({ hint: s.str('', 300), maxQuantity: s.num(10, { min: 1, max: 10, int: true }) }),
    // One duvet cover per bed — fixed.
    duvet: s.obj({ hint: s.str('', 300), maxQuantity: s.num(1, { min: 1, max: 1, int: true }) }),
  }),
})

export function sanitizeSettings(raw, defaults) {
  const settings = parse(SETTINGS_SCHEMA, raw, defaults)
  if (!settings.shipping.methods.length) settings.shipping.methods = clone(defaults.shipping.methods)
  if (!settings.shipping.methods.some((m) => m.enabled)) settings.shipping.methods[0].enabled = true
  if (!settings.checkout.countries.length) settings.checkout.countries = clone(defaults.checkout.countries)
  if (!settings.checkout.countries.includes(settings.checkout.defaultCountry)) settings.checkout.defaultCountry = settings.checkout.countries[0]
  return settings
}

export const sanitizeSetBuilder = (raw, defaults) => parse(SET_BUILDER_SCHEMA, raw, defaults)

export function sanitizeContent(raw, defaults) {
  const content = parse(schemaFromExample(defaults), raw, defaults)
  // The Popular Collections tabs are a fixed set; only their labels, links, visibility and order are editable.
  const stored = content.home.popular.tabs
  content.home.popular.tabs = defaults.home.popular.tabs.map((d) => {
    const tab = stored.find((t) => t.id === d.id)
    return tab ? { ...tab, flag: d.flag } : clone(d)
  })
  return content
}

function sanitizeCollections(raw, defaults, productIds) {
  if (!Array.isArray(raw)) return clone(defaults)
  const seen = new Set()
  const list = []
  for (const item of raw) {
    if (!isObject(item) || typeof item.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) || seen.has(item.id)) continue
    const c = parse(COLLECTION_SCHEMA, item, defaults.find((d) => d.id === item.id))
    c.productIds = [...new Set(c.productIds.filter((id) => productIds.has(id)))]
    if (!c.title.trim()) c.title = item.id
    seen.add(c.id)
    list.push(c)
  }
  // Core collections are linked all over the site, so they always exist.
  for (const d of defaults) if (CORE_COLLECTION_IDS.includes(d.id) && !seen.has(d.id)) list.push(clone(d))
  return list
}

/**
 * Validates the whole persisted store. Returns { data, issues } — `issues` lists what was dropped
 * or reset so the Admin can tell the user.
 */
export function sanitizeStoreData(stored, seed, version) {
  const issues = []
  if (stored == null) return { data: seed, issues }
  if (!isObject(stored) || stored.version !== version) {
    issues.push('Saved store data was unreadable or from another version, so the default catalog was loaded.')
    return { data: seed, issues }
  }

  let products = seed.products
  if (Array.isArray(stored.products)) {
    const ids = new Set()
    const slugs = new Set()
    products = []
    for (const raw of stored.products) {
      const p = sanitizeProduct(raw)
      if (!p || ids.has(p.id) || slugs.has(p.slug)) {
        issues.push(`A saved product (${raw?.name ?? raw?.id ?? 'unknown'}) was invalid and was skipped.`)
        continue
      }
      ids.add(p.id)
      slugs.add(p.slug)
      products.push(p)
    }
    // Bundles may only reference simple products that still exist.
    for (const p of products) {
      if (p.bundle) p.bundle.components = p.bundle.components.filter((c) => ids.has(c.productId) && !products.find((x) => x.id === c.productId)?.bundle)
      if (p.bundle && !p.bundle.components.length) {
        delete p.bundle
        p.status = 'draft'
        issues.push(`Ready-made set “${p.name}” lost its contents and was moved to drafts.`)
      }
      p.relatedProducts = p.relatedProducts.filter((id) => ids.has(id) && id !== p.id)
    }
  } else {
    issues.push('Saved products were missing, so the default catalog was loaded.')
  }

  const productIds = new Set(products.map((p) => p.id))
  return {
    data: {
      products,
      collections: sanitizeCollections(stored.collections, seed.collections, productIds),
      content: sanitizeContent(stored.content, seed.content),
      settings: sanitizeSettings(stored.settings, seed.settings),
      setBuilder: sanitizeSetBuilder(stored.setBuilder, seed.setBuilder),
    },
    issues,
  }
}

// ─── Orders & activity ───────────────────────────────────────────────────────

export const ORDER_STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'cancelled']

const ORDER_COMPONENT = s.obj({
  role: s.str(''),
  roleLabel: s.str(''),
  productId: s.str(''),
  name: s.str(''),
  quantity: s.num(1, { min: 0, int: true }),
  unitPrice: s.num(0, { min: 0 }),
  details: s.str(''),
})

const ORDER_SCHEMA = s.obj({
  id: s.str(''),
  number: s.str(''),
  createdAt: s.str(''),
  updatedAt: s.nullable(s.str('')),
  status: s.oneOf(ORDER_STATUSES, 'placed'),
  sample: s.bool(false),
  customer: s.obj({ email: s.str(''), phone: s.str(''), firstName: s.str(''), lastName: s.str('') }),
  shippingAddress: s.obj({ address: s.str(''), apartment: s.str(''), city: s.str(''), postalCode: s.str(''), country: s.str('') }),
  shippingMethod: s.obj({ id: s.str(''), name: s.str(''), eta: s.str(''), price: s.num(0, { min: 0 }) }),
  notes: s.str(''),
  items: s.arr(
    s.obj({
      type: s.str('product'),
      productId: s.str(''),
      name: s.str(''),
      quantity: s.num(1, { min: 0, int: true }),
      unitPrice: s.num(0, { min: 0 }),
      total: s.num(0, { min: 0 }),
      options: s.str(''),
      imageKey: s.str(''),
      components: s.arr(ORDER_COMPONENT, 10),
    }),
    100,
  ),
  totals: s.obj({
    subtotal: s.num(0, { min: 0 }),
    savings: s.num(0, { min: 0 }),
    merchandise: s.num(0, { min: 0 }),
    shipping: s.num(0, { min: 0 }),
    total: s.num(0, { min: 0 }),
    itemCount: s.num(0, { min: 0, int: true }),
  }),
  history: s.arr(s.obj({ at: s.str(''), status: s.str(''), note: s.str('', 500) }), 100),
})

/** Normalises a stored order. Also accepts the older single "last demo order" snapshot shape. */
export function sanitizeOrder(raw) {
  if (!isObject(raw)) return null
  const number = typeof raw.number === 'string' ? raw.number : typeof raw.id === 'string' ? raw.id : ''
  if (!number || typeof raw.createdAt !== 'string' || Number.isNaN(Date.parse(raw.createdAt))) return null
  const legacy = !raw.customer && isObject(raw.address)
  const source = legacy
    ? {
        ...raw,
        customer: { email: raw.email ?? raw.address.email, phone: raw.address.phone, firstName: raw.address.firstName, lastName: raw.address.lastName },
        shippingAddress: raw.address,
        shippingMethod: raw.shipping,
        notes: raw.address.notes,
        items: (raw.items ?? []).map((i) => ({ ...i, unitPrice: i.quantity ? i.total / i.quantity : 0 })),
        history: [{ at: raw.createdAt, status: 'placed', note: 'Demo order placed at checkout.' }],
      }
    : raw
  const order = parse(ORDER_SCHEMA, { ...source, id: number, number }, undefined)
  if (!order.history.length) order.history = [{ at: order.createdAt, status: order.status, note: '' }]
  return order
}

export function sanitizeOrders(raw) {
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  return raw.map(sanitizeOrder).filter((o) => o && !seen.has(o.id) && seen.add(o.id))
}

const ACTIVITY_SCHEMA = s.obj({
  id: s.str(''),
  at: s.str(''),
  actor: s.str('', 160),
  type: s.str('', 60),
  message: s.str('', 400),
  target: s.obj({ kind: s.str('', 40), id: s.str('', 200) }),
})

export function sanitizeActivity(raw) {
  if (!Array.isArray(raw)) return []
  return raw.filter((e) => isObject(e) && typeof e.at === 'string' && typeof e.message === 'string').map((e) => parse(ACTIVITY_SCHEMA, e, undefined))
}
