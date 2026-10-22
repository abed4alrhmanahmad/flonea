import { beforeEach, describe, expect, it } from 'vitest'
import { COLORS } from '../data/catalog.js'
import { DEFAULT_CONTENT } from '../data/content.js'
import {
  addSampleOrders,
  createProduct,
  deleteProduct,
  findEditableProduct,
  getCatalog,
  getProductById,
  getSnapshot,
  patchProduct,
  recordDemoOrder,
  resetToDefaults,
  saveCollection,
  setVariantAvailable,
  setVariantStock,
  updateOrderStatus,
  updateProduct,
  updateSetBuilder,
  updateSettings,
} from './store.js'
import { createSeedData } from './seed.js'
import { sanitizeOrder, sanitizeStoreData } from './schema.js'
import { findVariant, getAvailability, listCombinations } from '../lib/variants.js'
import { calculateTotals, resolveCartLine } from '../lib/pricing.js'
import { addLineToCart, sanitizeCart } from '../lib/cart.js'
import { makeCustomSetLine, resolveSet, roleForProduct } from '../lib/customSet.js'
import { validateContent } from '../admin/pages/content/contentValidation.js'
import { blankProduct, toProduct, validateProduct } from '../admin/lib/productForm.js'
import { buildSampleOrders } from '../admin/lib/sampleOrders.js'

const DUVET = 'signature-duvet-cover'
const PILLOWCASES = 'signature-pillowcase-set'
const cotton = (color, size) => ({ material: 'organic-cotton', color, size })
const edit = (id, mutate) => {
  const p = structuredClone(findEditableProduct(id))
  mutate(p)
  const result = updateProduct(id, p)
  expect(result.ok, result.error).toBe(true)
}
const productLine = (productId, selection, quantity = 1) => ({ type: 'product', productId, selection, quantity })

beforeEach(() => resetToDefaults('all'))

describe('per-product options', () => {
  it('adding a colour to the duvet cover does not add it to pillow products or the shared presets', () => {
    edit(DUVET, (p) => p.colors.push({ id: 'terracotta', name: 'Terracotta', hex: '#C46A4A', enabled: true }))
    const duvet = getProductById(DUVET)
    expect(duvet.availableColors).toContain('terracotta')
    expect(findVariant(duvet, cotton('terracotta', 'queen')).price).toBe(89)
    // Restriction rules still apply to the new colour (linen is never made in Single).
    expect(findVariant(duvet, { material: 'linen', color: 'terracotta', size: 'single' })).toBeNull()
    for (const id of [PILLOWCASES, 'cloud-pillow', 'linen-duvet-cover']) expect(getProductById(id).availableColors).not.toContain('terracotta')
    expect(COLORS.terracotta).toBeUndefined()
    expect(getCatalog().optionIndex.color.terracotta.name).toBe('Terracotta')
  })

  it('renaming a colour or size only changes that product', () => {
    edit(DUVET, (p) => {
      p.colors.find((c) => c.id === 'sage').name = 'Moss'
      p.sizes.find((s) => s.id === 'queen').dims = '230 × 250 cm'
    })
    expect(getProductById(DUVET).optionInfo.color.sage.name).toBe('Moss')
    expect(getProductById('linen-duvet-cover').optionInfo.color.sage.name).toBe('Forest Green')
    expect(getProductById('linen-duvet-cover').optionInfo.size.queen.dims).toBe('220 × 240 cm')
  })

  it('price edits reach product pages, carts and custom sets', () => {
    edit(DUVET, (p) => (p.sizes.find((s) => s.id === 'queen').price = 95))
    expect(findVariant(getProductById(DUVET), cotton('white', 'queen')).price).toBe(95)
    expect(resolveCartLine(productLine(DUVET, cotton('white', 'queen'))).unitPrice).toBe(95)
    // Per-variant override wins over size + material price.
    edit(DUVET, (p) => (p.variantSettings['organic-cotton|white|queen'] = { price: 80 }))
    expect(resolveCartLine(productLine(DUVET, cotton('white', 'queen'))).unitPrice).toBe(80)
    expect(findVariant(getProductById(DUVET), cotton('beige', 'queen')).price).toBe(95)
  })

  it('a disabled size is not selectable or purchasable, and cart lines for it are set aside, not deleted', () => {
    edit(DUVET, (p) => (p.sizes.find((s) => s.id === 'king').enabled = false))
    const duvet = getProductById(DUVET)
    expect(duvet.availableSizes).not.toContain('king')
    expect(addLineToCart([], productLine(DUVET, cotton('white', 'king'))).error).toBeTruthy()
    const stored = [productLine(DUVET, cotton('white', 'king'), 2), productLine(DUVET, cotton('white', 'queen'))]
    const lines = sanitizeCart(stored)
    expect(lines).toHaveLength(2)
    expect(lines.map((l) => resolveCartLine(l)).filter(Boolean)).toHaveLength(1)
    // Re-enabling brings the line back.
    edit(DUVET, (p) => (p.sizes.find((s) => s.id === 'king').enabled = true))
    expect(resolveCartLine(lines[0]).quantity).toBe(2)
  })

  it('a withdrawn or restricted combination (e.g. King / Beige / Cotton) cannot be bought, while others stay available', () => {
    expect(setVariantAvailable(DUVET, cotton('beige', 'king'), false).ok).toBe(true)
    const duvet = getProductById(DUVET)
    expect(findVariant(duvet, cotton('beige', 'king'))).toBeNull()
    expect(findVariant(duvet, cotton('white', 'king'))).toBeTruthy()
    expect(findVariant(duvet, cotton('beige', 'queen'))).toBeTruthy()
    expect(addLineToCart([], productLine(DUVET, cotton('beige', 'king'))).error).toBeTruthy()
    expect(setVariantAvailable(DUVET, cotton('beige', 'king'), true).ok).toBe(true)
    // The same restriction expressed as a rule:
    edit(DUVET, (p) => p.unavailable.push({ material: 'organic-cotton', color: 'beige', size: 'king' }))
    const combo = listCombinations(findEditableProduct(DUVET)).find((c) => c.key === 'organic-cotton|beige|king')
    expect(combo.restricted).toBe(true)
    expect(findVariant(getProductById(DUVET), cotton('beige', 'king'))).toBeNull()
  })
})

describe('inventory', () => {
  it('rejects negative or fractional stock and updates availability', () => {
    expect(setVariantStock(DUVET, cotton('white', 'queen'), -1).ok).toBe(false)
    expect(setVariantStock(DUVET, cotton('white', 'queen'), 2.5).ok).toBe(false)
    expect(setVariantStock(DUVET, cotton('white', 'queen'), 0).ok).toBe(true)
    expect(addLineToCart([], productLine(DUVET, cotton('white', 'queen'))).error).toMatch(/sold out/)
    setVariantStock(DUVET, cotton('white', 'queen'), 3)
    const v = findVariant(getProductById(DUVET), cotton('white', 'queen'))
    expect(getAvailability(v, getSnapshot().data.settings.inventory.lowStockThreshold).state).toBe('low')
    updateSettings({ ...getSnapshot().data.settings, inventory: { lowStockThreshold: 2 } })
    expect(getAvailability(v, getSnapshot().data.settings.inventory.lowStockThreshold).state).toBe('in')
  })
})

describe('product status', () => {
  it('draft products disappear from the storefront and ready-made sets that contain them stop selling', () => {
    expect(patchProduct(PILLOWCASES, { status: 'draft' }).ok).toBe(true)
    expect(getProductById(PILLOWCASES)).toBeNull()
    expect(getCatalog().allById[PILLOWCASES]).toBeTruthy()
    expect(addLineToCart([], productLine(PILLOWCASES, cotton('white', 'standard'))).error).toBeTruthy()
    expect(getProductById('signature-bedding-set')).toBeNull()
    expect(getCatalog().collectionsById.pillows.products.map((p) => p.id)).not.toContain(PILLOWCASES)
    patchProduct(PILLOWCASES, { status: 'active' })
    expect(getProductById('signature-bedding-set').variants.length).toBeGreaterThan(0)
  })

  it('creates, validates and deletes a new product with its own options', () => {
    const draft = { ...blankProduct({ id: '', today: '2026-10-17' }), name: 'Test Duvet', slug: 'test-duvet', status: 'active', images: ['duvetWhite1'] }
    expect(validateProduct(draft, { products: getSnapshot().data.products }).errors.variants).toBeTruthy()
    draft.sizes = [{ id: 'queen', name: 'Queen', dims: '', price: '120', enabled: true }]
    draft.colors = [{ id: 'white', name: 'White', hex: '#FFFFFF', enabled: true }]
    draft.materials = [{ id: 'linen', name: 'Linen', short: 'Linen', description: '', surcharge: '', enabled: true }]
    expect(validateProduct(draft, { products: getSnapshot().data.products }).errors).toEqual({})
    const result = createProduct({ ...toProduct(draft), id: 'test-duvet' }, { collectionIds: ['duvet-covers'] })
    expect(result.ok).toBe(true)
    expect(findVariant(getProductById('test-duvet'), { material: 'linen', color: 'white', size: 'queen' }).price).toBe(120)
    expect(getCatalog().collectionsById['duvet-covers'].productIds).toContain('test-duvet')
    expect(getCatalog().collectionsById.pillows.productIds).not.toContain('test-duvet')
    expect(roleForProduct(getProductById('test-duvet')).id).toBe('duvet')
    expect(deleteProduct('test-duvet').ok).toBe(true)
    expect(getCatalog().collectionsById['duvet-covers'].productIds).not.toContain('test-duvet')
    // Products inside a ready-made set can't be deleted.
    expect(deleteProduct(PILLOWCASES).ok).toBe(false)
  })

  it('flags invalid hex colours and duplicate slugs', () => {
    const p = structuredClone(findEditableProduct(DUVET))
    p.colors[0].hex = 'white'
    p.slug = 'cloud-pillow'
    const { errors } = validateProduct(p, { products: getSnapshot().data.products })
    expect(errors['color.0.hex']).toBeTruthy()
    expect(errors.slug).toMatch(/already/)
    for (const product of getSnapshot().data.products) expect(validateProduct(product, { products: getSnapshot().data.products, previewVariants: product.bundle ? getCatalog().allById[product.id].variants : null }).errors, product.id).toEqual({})
  })
})

describe('collections', () => {
  it('uses the explicit, ordered product list and never adds products automatically', () => {
    const pillows = getCatalog().collectionsById.pillows
    expect(pillows.products.every((p) => ['pillows', 'pillowcases'].includes(p.category))).toBe(true)
    const reordered = [...pillows.productIds].reverse()
    expect(saveCollection({ ...findCollection('pillows'), productIds: reordered }).ok).toBe(true)
    expect(getCatalog().collectionsById.pillows.products.map((p) => p.id)).toEqual(reordered)
    expect(saveCollection({ id: 'summer', title: 'Summer', subtitle: '', image: 'sand1', enabled: true, listed: true, productIds: [DUVET] }, { isNew: true }).ok).toBe(true)
    expect(getCatalog().collectionsById.summer.products.map((p) => p.id)).toEqual([DUVET])
  })
})

const findCollection = (id) => structuredClone(getSnapshot().data.collections.find((c) => c.id === id))

describe('Build a Set', () => {
  const pillow = { productId: PILLOWCASES, selection: cotton('white', 'king-pillow'), quantity: 1 }
  const duvet = { productId: DUVET, selection: cotton('white', 'queen'), quantity: 1 }

  it('King pillows + Queen duvet is valid; the total is the plain sum; the set is ONE cart line with no savings', () => {
    const set = resolveSet({ pillow, duvet })
    expect(set.isComplete).toBe(true)
    expect(set.total).toBe(35 + 89)
    const { lines } = addLineToCart([], makeCustomSetLine({ pillow, duvet }))
    expect(lines).toHaveLength(1)
    const line = resolveCartLine(lines[0])
    expect(line.components).toHaveLength(2) // one Pillows & Pillowcases product + one duvet cover, nothing else
    expect(line.savings).toBe(0)
    expect(line.compareAtUnitPrice).toBeNull()
    expect(calculateTotals([line]).subtotal).toBe(124)
  })

  it('follows Admin price changes and eligibility', () => {
    edit(PILLOWCASES, (p) => (p.sizes.find((s) => s.id === 'king-pillow').price = 40))
    expect(resolveSet({ pillow, duvet }).total).toBe(40 + 89)
    patchProduct(PILLOWCASES, { setEligible: false })
    expect(roleForProduct(getProductById(PILLOWCASES))).toBeNull()
    expect(resolveSet({ pillow, duvet }).isComplete).toBe(false)
    expect(getProductById(PILLOWCASES)).toBeTruthy() // still sold on its own
  })

  it('respects the pillow quantity limit from settings', () => {
    updateSetBuilder({ roles: { pillow: { hint: 'x', maxQuantity: 2 }, duvet: { hint: 'y', maxQuantity: 1 } } })
    expect(resolveSet({ pillow: { ...pillow, quantity: 2 }, duvet }).isComplete).toBe(true)
    expect(resolveSet({ pillow: { ...pillow, quantity: 3 }, duvet }).isComplete).toBe(false)
  })
})

describe('content, settings & orders', () => {
  it('the default content passes validation', () => {
    expect(validateContent(DEFAULT_CONTENT)).toEqual({})
  })

  it('shipping settings drive cart totals', () => {
    const lines = addLineToCart([], productLine('cloud-pillow', { material: 'down-alternative', color: 'white', size: 'standard' })).lines.map((l) => resolveCartLine(l))
    expect(calculateTotals(lines).shipping).toBe(8)
    const settings = structuredClone(getSnapshot().data.settings)
    settings.shipping.freeThreshold = 40
    updateSettings(settings)
    expect(calculateTotals(lines).shipping).toBe(0)
  })

  it('records demo orders, updates their demo status and keeps sample orders flagged', () => {
    const before = getSnapshot().orders.length
    const result = recordDemoOrder({ id: 'DEMO-TEST1', number: 'DEMO-TEST1', createdAt: new Date().toISOString(), customer: { email: 'a@b.co', phone: '', firstName: 'A', lastName: 'B' }, items: [], totals: { total: 10 } })
    expect(result.ok).toBe(true)
    expect(getSnapshot().orders).toHaveLength(before + 1)
    expect(updateOrderStatus('DEMO-TEST1', 'shipped').ok).toBe(true)
    expect(getSnapshot().orders.find((o) => o.id === 'DEMO-TEST1').history.map((h) => h.status)).toEqual(['placed', 'shipped'])
    const samples = buildSampleOrders(getCatalog())
    expect(samples.length).toBe(3)
    addSampleOrders(samples)
    expect(getSnapshot().orders.filter((o) => o.sample)).toHaveLength(3)
    const customSet = samples.flatMap((o) => o.items).find((i) => i.type === 'custom-set')
    expect(customSet.components).toHaveLength(2)
  })

  it('reads the legacy single "last demo order" snapshot', () => {
    const legacy = { number: 'DEMO-OLD', createdAt: '2026-01-02T10:00:00.000Z', email: 'x@y.co', name: 'X Y', items: [{ name: 'Cloud Pillow', quantity: 2, options: 'Standard', total: 98, imageKey: 'pillowTower' }], totals: { subtotal: 98, savings: 0, merchandise: 98, shipping: 0, total: 98, itemCount: 2 }, shipping: { id: 'standard', name: 'Standard Delivery', eta: '3–5 days', price: 8 }, address: { firstName: 'X', lastName: 'Y', email: 'x@y.co', phone: '1', address: 'Street', city: 'Beirut', country: 'Lebanon' } }
    const order = sanitizeOrder(legacy)
    expect(order.id).toBe('DEMO-OLD')
    expect(order.customer.firstName).toBe('X')
    expect(order.items[0].unitPrice).toBe(49)
  })
})

describe('stored data sanitising', () => {
  const seed = () => createSeedData()

  it('falls back to the seed for missing, corrupt or old-version data', () => {
    expect(sanitizeStoreData(null, seed(), 1).data.products).toHaveLength(seed().products.length)
    expect(sanitizeStoreData('garbage', seed(), 1).issues.length).toBe(1)
    expect(sanitizeStoreData({ version: 0, products: [] }, seed(), 1).data.products.length).toBe(seed().products.length)
  })

  it('skips invalid products, repairs bad values and keeps core collections', () => {
    const s = seed()
    const products = structuredClone(s.products)
    products[0].colors[0].hex = 'not-a-colour'
    products[0].variantSettings['organic-cotton|white|queen'] = { stock: -5, price: 'x' }
    products.push({ id: 'broken' }, null, { ...structuredClone(products[1]) }) // invalid, null, duplicate id
    const { data, issues } = sanitizeStoreData({ version: 1, products, collections: [{ id: 'BAD ID' }], content: { home: 7 }, settings: { currency: { code: 'XXX' } } }, s, 1)
    expect(data.products).toHaveLength(s.products.length)
    expect(data.products[0].colors[0].hex).toBe('#FFFFFF')
    expect(data.products[0].variantSettings['organic-cotton|white|queen']).toBeUndefined()
    expect(issues.length).toBeGreaterThanOrEqual(2)
    expect(data.collections.map((c) => c.id).sort()).toEqual(['bedding-sets', 'duvet-covers', 'pillows'])
    expect(data.content.home.hero.slides.length).toBe(3)
    expect(data.settings.currency.code).toBe('USD')
  })
})
