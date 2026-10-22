/**
 * Cart pricing. Cart lines only store identifiers (product, selected options, quantity);
 * prices are always recalculated from the live catalog so the product page, set builder,
 * cart and checkout can never disagree — and Admin price changes apply everywhere at once.
 */
import { getCatalog, getSettings } from '../store/store.js'
import { MAX_LINE_QUANTITY } from '../data/catalog.js'
import { BUILDER_PATH } from '../data/setBuilder.js'
import { findVariant, getProductImageKeys, optionLabel, roundMoney, variantKey } from './variants.js'
import { draftFromComponents, resolveSet, setConfigurationId } from './customSet.js'

/** Stable id for a cart line — identical configurations merge, different variants stay separate. */
export function getLineId(line) {
  if (line.type === 'custom-set') return `custom:${setConfigurationId(line.components)}`
  return `${line.type}:${line.productId}:${variantKey(line.selection)}`
}

const optionLabels = (product, selection) =>
  [
    { label: 'Size', value: optionLabel(product, 'size', selection.size) },
    { label: 'Material', value: optionLabel(product, 'material', selection.material) },
    { label: 'Colour', value: optionLabel(product, 'color', selection.color) },
  ].filter((o) => o.value)

function describeComponents(components, catalog) {
  return components.map((c) => {
    const product = catalog.allById[c.productId]
    const variant = product?.variantsByKey[c.variantKey]
    return {
      productId: c.productId,
      name: product?.name ?? 'Unavailable item',
      slug: product?.slug,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      details: variant ? [optionLabel(product, 'size', variant.size), optionLabel(product, 'color', variant.color)].filter(Boolean).join(' · ') : '',
    }
  })
}

/**
 * Resolves a stored cart line against the catalog.
 * Returns null when the product or configuration can't be bought right now (removed, switched off
 * in the Admin, or no longer offered in that combination).
 */
export function resolveCartLine(line, catalogArg) {
  if (!line || !line.type) return null
  // Tolerates being used as `lines.map(resolveCartLine)`, where the 2nd argument is an index.
  const catalog = catalogArg?.byId ? catalogArg : getCatalog()

  // Custom bedding set: one line, each component keeps its own options, priced at the sum of
  // the components' regular prices (no set discount).
  if (line.type === 'custom-set') {
    const draft = draftFromComponents(line.components)
    const set = draft && resolveSet(draft, catalog)
    if (!set?.isConfigured) return null
    const lead = set.chosen.find((c) => c.role === 'duvet') ?? set.chosen[0]
    return buildResolved(line, {
      name: 'Custom Bedding Set',
      href: BUILDER_PATH,
      imageKey: lead.imageKey,
      variant: { price: set.total, compareAtPrice: null, stock: set.stock },
      kindLabel: set.summary,
      options: set.chosen.map((c) => ({ label: c.roleLabel, value: c.name })),
      components: set.chosen,
    })
  }

  if (!line.selection) return null
  const product = catalog.byId[line.productId]
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
    options: optionLabels(product, line.selection),
    components: product.isBundle ? describeComponents(variant.components, catalog) : null,
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

// ─── Shipping (demo rules from Admin → Settings) ────────────────────────────

/** Delivery methods customers can choose. */
export const getShippingMethods = () => getSettings().shipping.methods.filter((m) => m.enabled)
export const getDefaultShippingMethodId = () => getShippingMethods()[0]?.id ?? 'standard'
/** True when at least one method becomes free over the threshold. */
export const offersFreeShipping = () => getShippingMethods().some((m) => m.freeOverThreshold)
export const getFreeShippingThreshold = () => getSettings().shipping.freeThreshold

/** Shipping cost for a method, given the merchandise total after set savings. */
export function getShippingCost(methodId, merchandiseTotal) {
  const methods = getShippingMethods()
  const method = methods.find((m) => m.id === methodId) ?? methods[0]
  if (!method || merchandiseTotal <= 0) return 0
  if (method.freeOverThreshold && merchandiseTotal >= getFreeShippingThreshold()) return 0
  return method.price
}

/** Totals shared by cart and checkout. */
export function calculateTotals(resolvedLines, shippingMethodId = getDefaultShippingMethodId()) {
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
    amountToFreeShipping: offersFreeShipping() ? Math.max(0, roundMoney(getFreeShippingThreshold() - merchandise)) : 0,
  }
}
