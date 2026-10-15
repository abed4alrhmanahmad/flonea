import { describe, expect, it } from 'vitest'
import { PRODUCTS, getProductById } from '../data/products.js'
import { IMAGE_SOURCES } from '../data/images.js'
import { changeSelection, findVariant, getDefaultSelection, isOptionCompatible } from './variants.js'
import { calculateTotals, makeCustomSetLine, resolveCartLine } from './pricing.js'
import { addLineToCart, sanitizeCart, setLineQuantity } from './cart.js'
import { EMPTY_FILTERS, filterProducts, sortProducts } from './filters.js'
import { validateCheckout } from './validation.js'

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

  it('applies the builder discount only to qualifying full sets', () => {
    const sel = { material: 'organic-cotton', color: 'white', size: 'queen' }
    const full = resolveCartLine(
      makeCustomSetLine(sel, [
        { productId: 'signature-duvet-cover', quantity: 1 },
        { productId: 'signature-pillowcase-set', quantity: 2 },
      ]),
    )
    // 89 + 2×29 = 147 → 10% off = 132.30
    expect(full.unitPrice).toBe(132.3)
    expect(full.savings).toBe(14.7)
    const duvetOnly = resolveCartLine(makeCustomSetLine(sel, [{ productId: 'signature-duvet-cover', quantity: 1 }]))
    expect(duvetOnly.savings).toBe(0)
  })

  it('sanitizes corrupted storage', () => {
    expect(sanitizeCart('nope')).toEqual([])
    expect(sanitizeCart([null, { type: 'product', productId: 'missing', selection: {}, quantity: 1 }, line('queen', -2)])).toEqual([])
    expect(sanitizeCart([line('queen'), line('queen')])[0].quantity).toBe(2)
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
