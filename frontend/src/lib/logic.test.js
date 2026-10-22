import { describe, expect, it } from 'vitest'
import { getProducts, getProductById } from '../store/store.js'
import { IMAGE_SOURCES } from '../data/images.js'
import { changeSelection, findVariant, getDefaultSelection, isOptionCompatible } from './variants.js'
import { calculateTotals, resolveCartLine } from './pricing.js'
import { addLineToCart, sanitizeCart, setLineQuantity } from './cart.js'
import { makeCustomSetLine, resolveSet, roleForProduct, sanitizeDraft } from './customSet.js'
import { EMPTY_FILTERS, filterProducts, sortProducts } from './filters.js'
import { validateCheckout } from './validation.js'

const PRODUCTS = getProducts()
const sig = () => getProductById('signature-duvet-cover')

describe('catalog', () => {
  it('every product has variants, images that exist and valid related products', () => {
    for (const p of PRODUCTS) {
      expect(p.variants.length, p.id).toBeGreaterThan(0)
      const keys = [...p.images, ...Object.values(p.colorImages ?? {}).flat()]
      for (const k of keys) expect(IMAGE_SOURCES[k], `${p.id}:${k}`).toBeTruthy()
      for (const r of p.relatedProducts) expect(getProductById(r), `${p.id}→${r}`).toBeTruthy()
    }
  })

  it('applies size + material pricing and removes unavailable combinations', () => {
    expect(findVariant(sig(), { material: 'organic-cotton', color: 'white', size: 'queen' }).price).toBe(89)
    expect(findVariant(sig(), { material: 'linen', color: 'white', size: 'queen' }).price).toBe(119)
    expect(findVariant(sig(), { material: 'linen', color: 'black', size: 'queen' })).toBeNull()
    expect(findVariant(sig(), { material: 'linen', color: 'white', size: 'single' })).toBeNull()
    expect(findVariant(sig(), { material: 'organic-cotton', color: 'sage', size: 'king' }).stock).toBe(0)
  })

  it('derives set prices from components minus the configured discount', () => {
    const set = getProductById('signature-bedding-set')
    const v = findVariant(set, { material: 'organic-cotton', color: 'white', size: 'queen' })
    // duvet queen $89 + standard pillowcase set $29 = $118, minus 10%
    expect(v.compareAtPrice).toBe(118)
    expect(v.price).toBe(106.2)
    // King bed → king pillowcases ($35)
    const k = findVariant(set, { material: 'organic-cotton', color: 'white', size: 'king' })
    expect(k.compareAtPrice).toBe(134)
    // sold-out duvet makes the set variant sold out
    expect(findVariant(set, { material: 'organic-cotton', color: 'sage', size: 'king' }).stock).toBe(0)
  })
})

describe('selection', () => {
  it('reports incompatible options and adjusts to the closest valid variant', () => {
    const p = sig()
    const sel = { material: 'organic-cotton', color: 'black', size: 'queen' }
    expect(isOptionCompatible(p, 'material', 'linen', sel)).toBe(false)
    const result = changeSelection(p, sel, 'material', 'linen')
    expect(result.selection.material).toBe('linen')
    expect(result.selection.color).not.toBe('black')
    expect(result.adjusted).toContain('color')
  })

  it('default selection is in stock', () => {
    for (const p of PRODUCTS) expect(findVariant(p, getDefaultSelection(p)).stock).toBeGreaterThan(0)
  })
})

describe('cart', () => {
  const line = (size, qty = 1, color = 'white') => ({
    type: 'product',
    productId: 'signature-duvet-cover',
    selection: { material: 'organic-cotton', color, size },
    quantity: qty,
  })

  it('merges identical variants and keeps different variants separate', () => {
    let lines = addLineToCart([], line('queen')).lines
    lines = addLineToCart(lines, line('queen', 2)).lines
    lines = addLineToCart(lines, line('king')).lines
    expect(lines).toHaveLength(2)
    expect(lines[0].quantity).toBe(3)
  })

  it('caps quantity at stock and refuses sold-out variants', () => {
    const low = { type: 'product', productId: 'silk-blend-duvet-cover', selection: { material: 'silk-blend', color: 'gold', size: 'king' }, quantity: 5 }
    const r = addLineToCart([], low)
    expect(r.quantity).toBe(2)
    expect(r.capped).toBe(true)
    expect(addLineToCart([], line('king', 1, 'sage')).added).toBe(0)
  })

  it('updates quantities, removes at zero and recomputes totals', () => {
    let lines = addLineToCart([], line('queen')).lines
    const id = resolveCartLine(lines[0]).id
    lines = setLineQuantity(lines, id, 2)
    let totals = calculateTotals(lines.map(resolveCartLine))
    expect(totals.subtotal).toBe(178)
    expect(totals.shipping).toBe(0)
    lines = setLineQuantity(lines, id, 0)
    expect(lines).toHaveLength(0)
    totals = calculateTotals([])
    expect(totals.total).toBe(0)
  })

  it('charges shipping under the free-shipping threshold', () => {
    const lines = addLineToCart([], { type: 'product', productId: 'cloud-pillow', selection: { material: 'down-alternative', color: 'white', size: 'standard' }, quantity: 1 }).lines
    const totals = calculateTotals(lines.map(resolveCartLine), 'standard')
    expect(totals.shipping).toBe(8)
    expect(totals.total).toBe(57)
    expect(calculateTotals(lines.map(resolveCartLine), 'express').shipping).toBe(18)
  })

  it('sanitizes corrupted storage', () => {
    expect(sanitizeCart('nope')).toEqual([])
    expect(sanitizeCart([null, { type: 'product', productId: 'missing', selection: {}, quantity: 1 }, line('queen', -2)])).toEqual([])
    expect(sanitizeCart([line('queen'), line('queen')])[0].quantity).toBe(2)
  })
})

describe('custom bedding set', () => {
  // King pillowcase set + Queen duvet cover: sizes deliberately differ.
  const pillow = { productId: 'signature-pillowcase-set', selection: { material: 'organic-cotton', color: 'white', size: 'king-pillow' }, quantity: 1 }
  const duvet = { productId: 'signature-duvet-cover', selection: { material: 'organic-cotton', color: 'white', size: 'queen' }, quantity: 1 }

  it('assigns every Pillows & Pillowcases product to the pillow role and duvet covers to the duvet role', () => {
    for (const p of PRODUCTS) {
      const role = roleForProduct(p)?.id ?? null
      if (['pillows', 'pillowcases'].includes(p.category)) expect(role, p.id).toBe('pillow')
      else if (p.category === 'duvet-covers') expect(role, p.id).toBe('duvet')
      else expect(role, p.id).toBeNull()
    }
  })

  it('requires both components and reports what is missing', () => {
    const empty = resolveSet({ pillow: null, duvet: null })
    expect(empty.isComplete).toBe(false)
    expect(empty.errors.map((e) => e.role)).toEqual(['pillow', 'duvet'])
    const half = resolveSet({ pillow, duvet: null })
    expect(half.isComplete).toBe(false)
    expect(half.errors).toEqual([{ role: 'duvet', message: 'Add a duvet cover to your set.' }])
    expect(addLineToCart([], makeCustomSetLine({ pillow, duvet: null })).error).toBeTruthy()
  })

  it('keeps independent options per component and prices at the sum of regular prices', () => {
    const set = resolveSet({ pillow, duvet })
    expect(set.isComplete).toBe(true)
    expect(set.components.map((c) => c.selection.size)).toEqual(['king-pillow', 'queen'])
    expect(set.total).toBe(35 + 89) // no discount
    expect(set.summary).toBe('1 Pillow Product + 1 Duvet Cover')

    const mixed = resolveSet({ pillow: { ...pillow, selection: { material: 'linen', color: 'sage', size: 'standard' } }, duvet })
    expect(mixed.isComplete).toBe(true)
    expect(mixed.total).toBe(29 + 12 + 89)
  })

  it('adds the set to the cart as ONE line with both components and no savings', () => {
    const { lines } = addLineToCart([], makeCustomSetLine({ pillow: { ...pillow, quantity: 2 }, duvet }))
    expect(lines).toHaveLength(1)
    const line = resolveCartLine(lines[0])
    expect(line.type).toBe('custom-set')
    expect(line.name).toBe('Custom Bedding Set')
    expect(line.kindLabel).toBe('2 Pillow Products + 1 Duvet Cover')
    expect(line.components.map((c) => [c.role, c.productId, c.selection.size, c.quantity, c.unitPrice])).toEqual([
      ['pillow', 'signature-pillowcase-set', 'king-pillow', 2, 35],
      ['duvet', 'signature-duvet-cover', 'queen', 1, 89],
    ])
    expect(line.unitPrice).toBe(2 * 35 + 89)
    expect(line.savings).toBe(0)
    expect(calculateTotals([line]).itemCount).toBe(1)
  })

  it('merges identical sets and keeps different configurations separate', () => {
    let lines = addLineToCart([], makeCustomSetLine({ pillow, duvet })).lines
    lines = addLineToCart(lines, makeCustomSetLine({ pillow, duvet })).lines
    expect(lines).toHaveLength(1)
    expect(lines[0].quantity).toBe(2)
    lines = addLineToCart(lines, makeCustomSetLine({ pillow, duvet: { ...duvet, selection: { ...duvet.selection, size: 'king' } } })).lines
    expect(lines).toHaveLength(2)
  })

  it('rejects wrong roles, unavailable or sold-out variants and bad quantities', () => {
    const asLine = (draft) => resolveCartLine(makeCustomSetLine(draft))
    expect(asLine({ pillow: { ...duvet }, duvet })).toBeNull() // a duvet cover can't fill the pillow role
    expect(asLine({ pillow, duvet: { ...duvet, selection: { ...duvet.selection, color: 'black', material: 'linen' } } })).toBeNull()
    expect(asLine({ pillow, duvet: { ...duvet, quantity: 2 } })).toBeNull() // one duvet cover per set
    const soldOut = { ...duvet, selection: { material: 'organic-cotton', color: 'sage', size: 'king' } }
    expect(resolveSet({ pillow, duvet: soldOut }).errors[0].message).toMatch(/sold out/)
    expect(addLineToCart([], makeCustomSetLine({ pillow, duvet: soldOut })).error).toMatch(/sold out/)
  })

  it('sanitizes stored drafts and drops legacy builder lines', () => {
    expect(sanitizeDraft('nope')).toEqual({ pillow: null, duvet: null })
    expect(sanitizeDraft({ pillow: { ...duvet }, duvet: { ...duvet, quantity: 9 } })).toEqual({ pillow: null, duvet: { ...duvet, quantity: 1 } })
    const legacy = { type: 'custom-set', selection: duvet.selection, components: [{ productId: 'signature-duvet-cover', quantity: 1 }], quantity: 1 }
    expect(sanitizeCart([legacy])).toEqual([])
  })
})

describe('filters & sorting', () => {
  it('matches size, material and colour on the same variant', () => {
    const res = filterProducts(PRODUCTS, { filters: { ...EMPTY_FILTERS, material: ['linen'], color: ['black'] } })
    expect(res).toHaveLength(0)
    const linen = filterProducts(PRODUCTS, { filters: { ...EMPTY_FILTERS, material: ['linen'] } })
    expect(linen.map((p) => p.id)).toContain('linen-duvet-cover')
  })

  it('searches and sorts', () => {
    expect(filterProducts(PRODUCTS, { query: 'silk' }).length).toBeGreaterThan(0)
    expect(filterProducts(PRODUCTS, { query: 'zzzz' })).toHaveLength(0)
    const asc = sortProducts(PRODUCTS, 'price-asc').map((p) => p.priceRange.min)
    expect(asc).toEqual([...asc].sort((a, b) => a - b))
  })
})

describe('checkout validation', () => {
  it('flags missing and malformed fields', () => {
    const errors = validateCheckout({ email: 'bad', phone: '12', shippingMethod: 'standard' })
    expect(errors.email).toMatch(/valid/)
    expect(errors.phone).toMatch(/valid/)
    expect(errors.firstName).toBeTruthy()
    const ok = validateCheckout({
      email: 'a@b.co', firstName: 'A', lastName: 'B', phone: '+961 70 000 000', address: 'x', city: 'Beirut', country: 'Lebanon', shippingMethod: 'standard',
    })
    expect(ok).toEqual({})
  })
})
