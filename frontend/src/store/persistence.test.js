import { beforeAll, describe, expect, it } from 'vitest'

// A minimal in-memory localStorage so the store's persistence can be exercised in Node.
const memory = new Map()
const localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: (k) => memory.delete(k),
}

let store
let keys
beforeAll(async () => {
  globalThis.window = { localStorage, addEventListener() {}, removeEventListener() {} }
  // Existing shopper data that must survive the store's initialisation and every Admin change.
  memory.set('flonea.cart.v1', JSON.stringify([{ type: 'product', productId: 'cloud-pillow', selection: { material: 'down-alternative', color: 'white', size: 'standard' }, quantity: 2 }]))
  memory.set('flonea.wishlist.v1', JSON.stringify(['cloud-pillow']))
  store = await import('./store.js')
  keys = (await import('../lib/storage.js')).STORAGE_KEYS
})

describe('localStorage persistence', () => {
  it('starts from the seed without writing anything, and never touches cart or wishlist keys', () => {
    expect(memory.has(keys.store)).toBe(false)
    expect(store.getProductById('cloud-pillow')).toBeTruthy()
    expect(JSON.parse(memory.get(keys.cart))[0].quantity).toBe(2)
  })

  it('saves Admin changes and reloads them (survives a "refresh")', () => {
    const p = structuredClone(store.findEditableProduct('cloud-pillow'))
    p.sizes.find((s) => s.id === 'standard').price = 52
    expect(store.updateProduct('cloud-pillow', p).persisted).toBe(true)
    const saved = JSON.parse(memory.get(keys.store))
    expect(saved.version).toBe(1)
    expect(saved.products.find((x) => x.id === 'cloud-pillow').sizes[0].price).toBe(52)
    store.reloadFromStorage()
    expect(store.getProductById('cloud-pillow').priceRange.min).toBe(52)
    expect(memory.get(keys.wishlist)).toBe('["cloud-pillow"]')
    expect(JSON.parse(memory.get(keys.cart))[0].productId).toBe('cloud-pillow')
    expect(JSON.parse(memory.get(keys.activity))[0].message).toMatch(/Cloud Pillow/)
  })

  it('recovers from corrupted saved data without crashing', () => {
    memory.set(keys.store, '{not json')
    store.reloadFromStorage()
    expect(store.getProductById('cloud-pillow').priceRange.min).toBe(49)
    memory.set(keys.store, JSON.stringify({ version: 1, products: 'nope' }))
    store.reloadFromStorage()
    expect(store.getSnapshot().loadIssues.length).toBeGreaterThan(0)
    expect(store.getProducts().length).toBeGreaterThan(10)
  })

  it('"Reset everything" removes only the store key', () => {
    store.resetToDefaults('all')
    expect(memory.has(keys.store)).toBe(false)
    expect(memory.has(keys.cart)).toBe(true)
    expect(memory.has(keys.wishlist)).toBe(true)
  })
})
