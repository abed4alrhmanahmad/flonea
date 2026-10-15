/**
 * Cart pricing. Cart lines only store identifiers (product, selected options, quantity);
 * prices are always recalculated from the catalog so the product page, set builder,
 * cart and checkout can never disagree.
 */
import { PRODUCTS_BY_ID } from '../data/products.js'
import { MAX_LINE_QUANTITY, SHIPPING, MATERIALS, COLORS, SIZES } from '../data/catalog.js'
import { getBuilderDiscountPercent } from '../data/setBuilder.js'
import { expandBundle, findVariant, getProductImageKeys, resolveComponentSelection, roundMoney, variantKey } from './variants.js'

/** Stable id for a cart line — identical configurations merge, different variants stay separate. */
export function getLineId(line) {
  const key = variantKey(line.selection)
  if (line.type === 'custom-set') {
    const parts = line.components.map((c) => `${c.productId}x${c.quantity}`).join(',')
    return `custom:${key}:${parts}`
  }
  return `${line.type}:${line.productId}:${key}`
}

const optionLabels = (selection) =>
  [
    { label: 'Size', value: SIZES[selection.size]?.name },
    { label: 'Material', value: MATERIALS[selection.material]?.short },
    { label: 'Colour', value: COLORS[selection.color]?.name },
  ].filter((o) => o.value)

function describeComponents(components) {
  return components.map((c) => {
    const product = PRODUCTS_BY_ID[c.productId]
    const variant = product?.variantsByKey[c.variantKey]
    return {
      productId: c.productId,
      name: product?.name ?? 'Unavailable item',
      slug: product?.slug,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      details: variant ? [SIZES[variant.size]?.name, COLORS[variant.color]?.name].filter(Boolean).join(' · ') : '',
    }
  })
}

/**
 * Resolves a stored cart line against the catalog.
 * Returns null when the product or configuration no longer exists.
 */
export function resolveCartLine(line) {
  if (!line || !line.selection || !line.type) return null

  if (line.type === 'custom-set') {
    const discountPercent = getBuilderDiscountPercent(line.components)
    const lead = PRODUCTS_BY_ID[line.components[0]?.productId]
    if (!lead) return null
    const [variant] = expandBundle(
      {
        components: line.components,
        discountPercent,
        candidates: { materials: [line.selection.material], colors: [line.selection.color], sizes: [line.selection.size] },
      },
      PRODUCTS_BY_ID,
    )
    if (!variant) return null
    return buildResolved(line, {
      name: discountPercent ? 'Custom Bedding Set' : 'Custom Bedding Bundle',
      href: '/bedding-sets/builder',
      imageKey: getProductImageKeys(lead, line.selection.color)[0],
      variant,
      kindLabel: discountPercent ? `Full Set · ${discountPercent}% set saving` : 'Bundle',
      options: optionLabels(line.selection),
      components: describeComponents(variant.components),
    })
  }

  const product = PRODUCTS_BY_ID[line.productId]
  if (!product) return null
  const variant = findVariant(product, line.selection)
  if (!variant) return null
  return buildResolved(line, {
    name: product.name,
    href: `/products/${product.slug}`,
    imageKey: getProductImageKeys(product, line.selection.color)[0],
    product,
    variant,
    kindLabel: product.isBundle ? `Bedding Set · ${product.bundle.discountPercent}% set saving` : null,
    options: optionLabels(line.selection),
    components: product.isBundle ? describeComponents(variant.components) : null,
  })
}

function buildResolved(line, info) {
  const { variant } = info
  const maxQuantity = Math.max(0, Math.min(variant.stock, MAX_LINE_QUANTITY))
  const quantity = Math.min(line.quantity, maxQuantity)
  const unitCompare = variant.compareAtPrice ?? variant.price
  return {
    ...line,
    ...info,
    id: getLineId(line),
    quantity,
    maxQuantity,
    unitPrice: variant.price,
    compareAtUnitPrice: variant.compareAtPrice,
    lineTotal: roundMoney(variant.price * quantity),
    lineCompareTotal: roundMoney(unitCompare * quantity),
    savings: roundMoney((unitCompare - variant.price) * quantity),
  }
}

/** Shipping cost for a method, given the merchandise total after set savings. */
export function getShippingCost(methodId, merchandiseTotal) {
  const method = SHIPPING.methods.find((m) => m.id === methodId) ?? SHIPPING.methods[0]
  if (merchandiseTotal <= 0) return 0
  if (method.freeOverThreshold && merchandiseTotal >= SHIPPING.freeThreshold) return 0
  return method.price
}

/** Totals shared by cart and checkout. */
export function calculateTotals(resolvedLines, shippingMethodId = 'standard') {
  const subtotal = roundMoney(resolvedLines.reduce((s, l) => s + l.lineCompareTotal, 0))
  const savings = roundMoney(resolvedLines.reduce((s, l) => s + l.savings, 0))
  const merchandise = roundMoney(subtotal - savings)
  const shipping = getShippingCost(shippingMethodId, merchandise)
  const itemCount = resolvedLines.reduce((s, l) => s + l.quantity, 0)
  return {
    subtotal,
    savings,
    merchandise,
    shipping,
    total: roundMoney(merchandise + shipping),
    itemCount,
    amountToFreeShipping: Math.max(0, roundMoney(SHIPPING.freeThreshold - merchandise)),
  }
}

/** Builds the stored line for a builder configuration (used by both the builder and tests). */
export function makeCustomSetLine(selection, components, quantity = 1) {
  return {
    type: 'custom-set',
    selection: { ...selection },
    components: components.filter((c) => c.quantity > 0).map((c) => ({ productId: c.productId, quantity: c.quantity })),
    quantity,
  }
}

/** Selection for a single component of the builder (used in Individual Items mode). */
export const componentSelection = (productId, selection) => {
  const product = PRODUCTS_BY_ID[productId]
  return product ? resolveComponentSelection(product, selection) : null
}
