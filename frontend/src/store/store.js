/**
 * FLONEA frontend store — the single source of truth shared by the storefront and the Admin.
 *
 * Holds the editable catalog (products with their own sizes / colours / materials / variants),
 * collections, homepage & site content, store settings, Build a Set settings, demo orders and a
 * local activity history. Everything the storefront shows is derived from here, so an Admin change
 * is immediately what customers see.
 *
 * Persistence is LOCAL DEMO ONLY: data is saved to this browser's localStorage under its own keys
 * (cart, wishlist and set-builder keys are never touched). It is not a shared database, it is not
 * secure, and anyone using this browser can read or change it. To connect a backend later, replace
 * `load*` / `persist*` below with API calls — every mutation already goes through `commit()`.
 *
 * Framework-agnostic: React reads it through the hooks in ./hooks.js (useSyncExternalStore).
 */
import { buildCatalog, buildOptionIndex, buildProduct, variantKey } from '../lib/variants.js'
import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from '../lib/storage.js'
import { CORE_COLLECTION_IDS, createSeedData } from './seed.js'
import { makeId, ORDER_STATUSES, sanitizeActivity, sanitizeOrder, sanitizeOrders, sanitizeStoreData } from './schema.js'

export const STORE_SCHEMA_VERSION = 1
const MAX_ACTIVITY = 200

const clone = (v) => JSON.parse(JSON.stringify(v))
const nowIso = () => new Date().toISOString()

// ─── State ───────────────────────────────────────────────────────────────────

function loadData() {
  return sanitizeStoreData(readStorage(STORAGE_KEYS.store, null), createSeedData(), STORE_SCHEMA_VERSION)
}

function loadOrders() {
  const orders = sanitizeOrders(readStorage(STORAGE_KEYS.orders, []))
  // Before the orders log existed, checkout kept only the last demo order — bring it in once.
  const last = sanitizeOrder(readStorage(STORAGE_KEYS.lastOrder, null))
  if (last && !orders.some((o) => o.id === last.id)) orders.push(last)
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

let loaded = loadData()
let data = loaded.data
let loadIssues = loaded.issues
let orders = loadOrders()
let activity = sanitizeActivity(readStorage(STORAGE_KEYS.activity, []))
let lastSave = { ok: true, at: null }
let actor = 'admin'
let snapshot = makeSnapshot()
const listeners = new Set()

function makeCatalog(d) {
  const all = buildCatalog(d.products)
  const allById = Object.fromEntries(all.map((p) => [p.id, p]))
  // Storefront view: active products that can actually be bought.
  const products = all.filter((p) => p.isPurchasable)
  const byId = Object.fromEntries(products.map((p) => [p.id, p]))
  const collections = d.collections.map((c) => ({
    ...c,
    core: CORE_COLLECTION_IDS.includes(c.id),
    products: c.productIds.map((id) => byId[id]).filter(Boolean),
  }))
  return {
    all,
    allById,
    products,
    byId,
    bySlug: Object.fromEntries(products.map((p) => [p.slug, p])),
    collections,
    collectionsById: Object.fromEntries(collections.map((c) => [c.id, c])),
    optionIndex: buildOptionIndex(products),
  }
}

function makeSnapshot() {
  return { data, catalog: makeCatalog(data), orders, activity, lastSave, loadIssues }
}

function emit() {
  snapshot = makeSnapshot()
  for (const fn of listeners) fn()
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const getSnapshot = () => snapshot
export const getCatalog = () => snapshot.catalog
export const getStoreData = () => data
export const getSettings = () => data.settings
export const getContent = () => data.content

/** Storefront lookups: only active, purchasable products. */
export const getProducts = () => snapshot.catalog.products
export const getProductById = (id) => snapshot.catalog.byId[id] ?? null
export const getProductBySlug = (slug) => snapshot.catalog.bySlug[slug] ?? null
/** Any product, whatever its status (Admin, and labels for items set aside in a cart). */
export const getAnyProductById = (id) => snapshot.catalog.allById[id] ?? null

/** Who the activity history attributes changes to (set by the Admin session). */
export const setActivityActor = (name) => {
  actor = name || 'admin'
}

// Keep several tabs in sync: an Admin tab's edits show up in an open storefront tab.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === null || e.key === STORAGE_KEYS.store) {
      loaded = loadData()
      data = loaded.data
      loadIssues = loaded.issues
    }
    if (e.key === null || e.key === STORAGE_KEYS.orders || e.key === STORAGE_KEYS.lastOrder) orders = loadOrders()
    if (e.key === null || e.key === STORAGE_KEYS.activity) activity = sanitizeActivity(readStorage(STORAGE_KEYS.activity, []))
    if (e.key === null || [STORAGE_KEYS.store, STORAGE_KEYS.orders, STORAGE_KEYS.lastOrder, STORAGE_KEYS.activity].includes(e.key)) emit()
  })
}

// ─── Persistence & activity ──────────────────────────────────────────────────

function persistData() {
  return writeStorage(STORAGE_KEYS.store, { version: STORE_SCHEMA_VERSION, savedAt: nowIso(), ...data })
}

function logActivity(entry) {
  if (!entry) return
  activity = [{ id: makeId('act'), at: nowIso(), actor: entry.actor ?? actor, type: entry.type, message: entry.message, target: entry.target ?? { kind: '', id: '' } }, ...activity].slice(0, MAX_ACTIVITY)
  writeStorage(STORAGE_KEYS.activity, activity)
}

/** Applies a change to the editable data, saves it and notifies subscribers. */
function commit(nextData, entry) {
  data = nextData
  const persisted = persistData()
  lastSave = { ok: persisted, at: nowIso() }
  logActivity(entry)
  emit()
  return { ok: true, persisted }
}

const fail = (error) => ({ ok: false, error })

// ─── Products ────────────────────────────────────────────────────────────────

export const findEditableProduct = (id) => data.products.find((p) => p.id === id) ?? null

/** Builds the storefront view of an unsaved draft (Admin preview). */
export function previewProduct(draft) {
  const byId = { ...snapshot.catalog.allById }
  return buildProduct(draft, byId)
}

/** A slug-safe id that no product uses yet. */
export function uniqueProductId(base) {
  const root = base || 'product'
  let id = root
  for (let n = 2; data.products.some((p) => p.id === id || p.slug === id); n++) id = `${root}-${n}`
  return id
}

/** Removes per-variant settings for option ids the product no longer has. */
function pruneVariantSettings(product) {
  if (product.bundle) return { ...product, variantSettings: {} }
  const ids = { material: new Set(product.materials.map((o) => o.id)), color: new Set(product.colors.map((o) => o.id)), size: new Set(product.sizes.map((o) => o.id)) }
  const variantSettings = Object.fromEntries(
    Object.entries(product.variantSettings ?? {}).filter(([key, v]) => {
      const [m, c, sz] = key.split('|')
      return ids.material.has(m) && ids.color.has(c) && ids.size.has(sz) && Object.keys(v).length
    }),
  )
  const colorImages = Object.fromEntries(Object.entries(product.colorImages ?? {}).filter(([colorId, list]) => ids.color.has(colorId) && list.length))
  return { ...product, variantSettings, colorImages }
}

/** Keeps collection membership in sync with the product's chosen collections. */
function withCollectionMembership(collections, productId, collectionIds) {
  if (!collectionIds) return collections
  return collections.map((c) => {
    const has = c.productIds.includes(productId)
    const wants = collectionIds.includes(c.id)
    if (has === wants) return c
    return { ...c, productIds: wants ? [...c.productIds, productId] : c.productIds.filter((id) => id !== productId) }
  })
}

export function createProduct(product, { collectionIds } = {}) {
  if (data.products.some((p) => p.id === product.id)) return fail('A product with this id already exists.')
  if (data.products.some((p) => p.slug === product.slug)) return fail('Another product already uses this URL slug.')
  const next = pruneVariantSettings({ ...clone(product), updatedAt: nowIso() })
  const result = commit(
    { ...data, products: [...data.products, next], collections: withCollectionMembership(data.collections, next.id, collectionIds ?? []) },
    { type: 'product.create', message: `Created product “${next.name}” (${next.status}).`, target: { kind: 'product', id: next.id } },
  )
  return { ...result, id: next.id }
}

export function updateProduct(id, product, { collectionIds, message } = {}) {
  const current = findEditableProduct(id)
  if (!current) return fail('This product no longer exists.')
  if (data.products.some((p) => p.id !== id && p.slug === product.slug)) return fail('Another product already uses this URL slug.')
  const next = pruneVariantSettings({ ...clone(product), id, updatedAt: nowIso() })
  return commit(
    { ...data, products: data.products.map((p) => (p.id === id ? next : p)), collections: withCollectionMembership(data.collections, id, collectionIds) },
    { type: 'product.update', message: message ?? `Updated product “${next.name}”.`, target: { kind: 'product', id } },
  )
}

/** Small field changes from lists (status, flags, eligibility) without opening the editor. */
export function patchProduct(id, patch, message) {
  const current = findEditableProduct(id)
  if (!current) return fail('This product no longer exists.')
  return updateProduct(id, { ...current, ...patch }, { message })
}

export function duplicateProduct(id) {
  const source = findEditableProduct(id)
  if (!source) return fail('This product no longer exists.')
  const newId = uniqueProductId(`${source.slug}-copy`)
  const copy = { ...clone(source), id: newId, slug: newId, name: `${source.name} (Copy)`, status: 'draft', createdAt: nowIso().slice(0, 10) }
  const collectionIds = data.collections.filter((c) => c.productIds.includes(id)).map((c) => c.id)
  return createProduct(copy, { collectionIds })
}

/** Ready-made sets that contain a product (a product can't be deleted while a set needs it). */
export const bundlesUsing = (id) => data.products.filter((p) => p.bundle?.components.some((c) => c.productId === id))

export function deleteProduct(id) {
  const current = findEditableProduct(id)
  if (!current) return fail('This product no longer exists.')
  const sets = bundlesUsing(id)
  if (sets.length) return fail(`“${current.name}” is part of ${sets.map((s) => `“${s.name}”`).join(', ')}. Remove it from those sets first, or archive it instead.`)
  const products = data.products.filter((p) => p.id !== id).map((p) => (p.relatedProducts.includes(id) ? { ...p, relatedProducts: p.relatedProducts.filter((r) => r !== id) } : p))
  const collections = data.collections.map((c) => (c.productIds.includes(id) ? { ...c, productIds: c.productIds.filter((p) => p !== id) } : c))
  const content = clone(data.content)
  for (const tab of content.home.popular.tabs) tab.order = tab.order.filter((p) => p !== id)
  return commit({ ...data, products, collections, content }, { type: 'product.delete', message: `Deleted product “${current.name}”.`, target: { kind: 'product', id } })
}

// ─── Variants & inventory ────────────────────────────────────────────────────

function updateVariantSetting(productId, key, patch, message) {
  const product = findEditableProduct(productId)
  if (!product || product.bundle) return fail('Stock for ready-made sets comes from the products they contain.')
  const current = { ...(product.variantSettings?.[key] ?? {}), ...patch }
  for (const k of Object.keys(current)) if (current[k] === null || current[k] === undefined) delete current[k]
  const variantSettings = { ...product.variantSettings, [key]: current }
  if (!Object.keys(current).length) delete variantSettings[key]
  return commit(
    { ...data, products: data.products.map((p) => (p.id === productId ? { ...p, variantSettings, updatedAt: nowIso() } : p)) },
    { type: 'inventory.update', message, target: { kind: 'product', id: productId } },
  )
}

/** Sets a variant's stock. Quantities must be whole numbers ≥ 0. */
export function setVariantStock(productId, selection, quantity) {
  const qty = Number(quantity)
  if (!Number.isInteger(qty) || qty < 0) return fail('Stock must be a whole number of 0 or more.')
  const product = findEditableProduct(productId)
  return updateVariantSetting(productId, variantKey(selection), { stock: qty }, `Set stock of “${product?.name}” ${variantKey(selection).replaceAll('|', ' / ')} to ${qty}.`)
}

/** Offers or withdraws one variant (withdrawn variants can't be selected or bought). */
export function setVariantAvailable(productId, selection, available) {
  const product = findEditableProduct(productId)
  return updateVariantSetting(
    productId,
    variantKey(selection),
    { available: available ? null : false },
    `${available ? 'Offered' : 'Withdrew'} “${product?.name}” ${variantKey(selection).replaceAll('|', ' / ')}.`,
  )
}

// ─── Collections ─────────────────────────────────────────────────────────────

/**
 * Creates or updates a collection. `previousId` renames a (non-core) collection's slug and updates
 * homepage references to it.
 */
export function saveCollection(collection, { isNew = false, previousId = collection.id } = {}) {
  const exists = (id) => data.collections.some((c) => c.id === id)
  if (isNew && exists(collection.id)) return fail('Another collection already uses this URL slug.')
  if (!isNew && !exists(previousId)) return fail('This collection no longer exists.')
  const renamed = !isNew && previousId !== collection.id
  if (renamed && CORE_COLLECTION_IDS.includes(previousId)) return fail('Core collection URLs can’t change — they are linked across the storefront.')
  if (renamed && exists(collection.id)) return fail('Another collection already uses this URL slug.')
  const next = clone(collection)
  const collections = isNew ? [...data.collections, next] : data.collections.map((c) => (c.id === previousId ? next : c))
  let content = data.content
  if (renamed) {
    content = clone(data.content)
    for (const card of content.home.categories.cards) if (card.collectionId === previousId) card.collectionId = next.id
    for (const chip of content.home.colors.chips) if (chip.collectionId === previousId) chip.collectionId = next.id
  }
  return commit(
    { ...data, collections, content },
    {
      type: isNew ? 'collection.create' : 'collection.update',
      message: `${isNew ? 'Created' : 'Updated'} collection “${next.title}”${renamed ? ` (URL /collections/${previousId} → /collections/${next.id})` : ''}.`,
      target: { kind: 'collection', id: next.id },
    },
  )
}

export function deleteCollection(id) {
  if (CORE_COLLECTION_IDS.includes(id)) return fail('Core collections are linked across the storefront and can’t be deleted. Disable it instead.')
  const current = data.collections.find((c) => c.id === id)
  if (!current) return fail('This collection no longer exists.')
  const content = clone(data.content)
  content.home.categories.cards = content.home.categories.cards.filter((card) => card.collectionId !== id)
  for (const chip of content.home.colors.chips) if (chip.collectionId === id) chip.collectionId = ''
  return commit(
    { ...data, collections: data.collections.filter((c) => c.id !== id), content },
    { type: 'collection.delete', message: `Deleted collection “${current.title}”.`, target: { kind: 'collection', id } },
  )
}

// ─── Content, settings, Build a Set ──────────────────────────────────────────

export function updateContent(section, value, message) {
  return commit({ ...data, content: { ...data.content, [section]: clone(value) } }, { type: 'content.update', message: message ?? `Updated ${section} content.`, target: { kind: 'content', id: section } })
}

export function updateSettings(settings, message = 'Updated store settings.') {
  return commit({ ...data, settings: clone(settings) }, { type: 'settings.update', message, target: { kind: 'settings', id: '' } })
}

export function updateSetBuilder(setBuilder, message = 'Updated Build a Set settings.') {
  return commit({ ...data, setBuilder: clone(setBuilder) }, { type: 'setBuilder.update', message, target: { kind: 'setBuilder', id: '' } })
}

/** Restores factory defaults: 'catalog' (products + collections), 'content', 'settings' or 'all'. */
export function resetToDefaults(part = 'all') {
  const seed = createSeedData()
  const next = { ...data }
  if (part === 'all' || part === 'catalog') {
    next.products = seed.products
    next.collections = seed.collections
    next.setBuilder = seed.setBuilder
  }
  if (part === 'all' || part === 'content') next.content = seed.content
  if (part === 'all' || part === 'settings') next.settings = seed.settings
  if (part === 'all') {
    removeStorage(STORAGE_KEYS.store)
    data = next
    loadIssues = []
    lastSave = { ok: true, at: nowIso() }
    logActivity({ type: 'store.reset', message: 'Reset the catalog, content and settings to factory defaults.' })
    emit()
    return { ok: true, persisted: true }
  }
  return commit(next, { type: 'store.reset', message: `Reset ${part} to factory defaults.` })
}

/** Everything the Admin can export as JSON (for backups or a future backend import). */
export const exportStoreData = () => ({ version: STORE_SCHEMA_VERSION, exportedAt: nowIso(), ...clone(data), orders: clone(orders) })

// ─── Demo orders ─────────────────────────────────────────────────────────────

function persistOrders(next, entry) {
  orders = next
  const persisted = writeStorage(STORAGE_KEYS.orders, orders)
  logActivity(entry)
  emit()
  return { ok: true, persisted }
}

/** A new demo order number and timestamp, e.g. { number: 'DEMO-K3F9QX', createdAt }. */
export const newDemoOrderStamp = () => ({ number: `DEMO-${Date.now().toString(36).toUpperCase().slice(-6)}`, createdAt: nowIso() })

/** Records a demo order from the storefront checkout. Stock is NOT deducted (the demo never did). */
export function recordDemoOrder(order) {
  const clean = sanitizeOrder({ ...order, history: [{ at: order.createdAt, status: 'placed', note: 'Demo order placed at checkout.' }] })
  if (!clean) return fail('The demo order could not be recorded.')
  return persistOrders([clean, ...orders.filter((o) => o.id !== clean.id)], {
    type: 'order.create',
    actor: 'storefront checkout',
    message: `Demo order ${clean.number} recorded (${clean.items.length} line${clean.items.length === 1 ? '' : 's'}).`,
    target: { kind: 'order', id: clean.id },
  })
}

/** Demo status change. Nothing is emailed, shipped or charged. */
export function updateOrderStatus(id, status, note = '') {
  if (!ORDER_STATUSES.includes(status)) return fail('Unknown order status.')
  const current = orders.find((o) => o.id === id)
  if (!current) return fail('This order no longer exists.')
  const at = nowIso()
  const next = { ...current, status, updatedAt: at, history: [...current.history, { at, status, note: note.trim().slice(0, 500) }] }
  return persistOrders(orders.map((o) => (o.id === id ? next : o)), { type: 'order.status', message: `Marked demo order ${current.number} as ${status}.`, target: { kind: 'order', id } })
}

export function deleteOrder(id) {
  const current = orders.find((o) => o.id === id)
  if (!current) return fail('This order no longer exists.')
  return persistOrders(orders.filter((o) => o.id !== id), { type: 'order.delete', message: `Deleted ${current.sample ? 'sample' : 'demo'} order ${current.number}.`, target: { kind: 'order', id } })
}

/** Adds clearly-flagged SAMPLE orders for trying the Orders screens (never counted as demo sales). */
export function addSampleOrders(samples) {
  const clean = samples.map((o) => sanitizeOrder({ ...o, sample: true })).filter(Boolean)
  return persistOrders([...clean, ...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), { type: 'order.sample', message: `Added ${clean.length} sample orders for interface testing.` })
}

export function removeSampleOrders() {
  return persistOrders(orders.filter((o) => !o.sample), { type: 'order.sample', message: 'Removed all sample orders.' })
}

export function clearActivity() {
  activity = []
  removeStorage(STORAGE_KEYS.activity)
  emit()
  return { ok: true, persisted: true }
}

// ─── Test helper ─────────────────────────────────────────────────────────────

/** Reloads everything from storage (used by tests after changing the storage stub). */
export function reloadFromStorage() {
  loaded = loadData()
  data = loaded.data
  loadIssues = loaded.issues
  orders = loadOrders()
  activity = sanitizeActivity(readStorage(STORAGE_KEYS.activity, []))
  emit()
}
