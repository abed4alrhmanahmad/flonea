/**
 * Custom bedding set logic (no React).
 *
 * A draft set is { pillow: Component | null, duvet: Component | null } where a component is
 * { productId, selection: { material, color, size }, quantity }. Like cart lines, components only
 * store identifiers — names, variants and prices are always resolved from the live catalog, so
 * Admin price or option changes apply immediately.
 *
 * Functions take the catalog as an optional last argument (defaults to the current store catalog),
 * which lets React hooks recompute when it changes.
 */
import { getCatalog } from '../store/store.js'

const catalogOrCurrent = (catalog) => (catalog?.byId ? catalog : getCatalog())
import { MAX_LINE_QUANTITY } from '../data/catalog.js'
import { SET_ROLES, SET_ROLES_BY_ID } from '../data/setBuilder.js'
import { findVariant, getOptionInfo, getProductImageKeys, optionLabel, roundMoney, variantKey } from './variants.js'

/**
 * The set role a product can fill (e.g. 'pillow' for anything in Pillows & Pillowcases), or null.
 * Products the Admin marked as not eligible for Build a Set fill no role.
 */
export const roleForProduct = (product) =>
  (product && product.setEligible !== false ? SET_ROLES.find((r) => r.categories.includes(product.category)) : null) ?? null

export const emptyDraft = () => Object.fromEntries(SET_ROLES.map((r) => [r.id, null]))

/** How many of a component one set may include in its selected variant. */
export const maxComponentQuantity = (roleId, variant) =>
  Math.max(0, Math.min(variant?.stock ?? 0, SET_ROLES_BY_ID[roleId]?.maxQuantity ?? 1, MAX_LINE_QUANTITY))

/** Resolves one stored component against the catalog. Null when the product can't fill this role. */
export function resolveSetComponent(roleId, item, catalogArg) {
  const role = SET_ROLES_BY_ID[roleId]
  const product = item && catalogOrCurrent(catalogArg).byId[item.productId]
  if (!role || !product || !item.selection || roleForProduct(product)?.id !== roleId) return null
  const selection = { material: item.selection.material, color: item.selection.color, size: item.selection.size }
  const variant = findVariant(product, selection)
  const unitPrice = variant?.price ?? 0
  const size = getOptionInfo(product, 'size', selection.size)
  const options = [
    { label: 'Size', value: size ? (size.dims ? `${size.name} (${size.dims})` : size.name) : null },
    { label: 'Material', value: optionLabel(product, 'material', selection.material) },
    { label: 'Colour', value: optionLabel(product, 'color', selection.color) },
  ].filter((o) => o.value)
  return {
    role: roleId,
    roleLabel: role.label,
    productId: product.id,
    product,
    name: product.name,
    href: `/products/${product.slug}`,
    selection,
    variant,
    variantId: variant?.sku ?? null,
    quantity: item.quantity,
    unitPrice,
    lineTotal: roundMoney(unitPrice * item.quantity),
    imageKey: getProductImageKeys(product, selection.color)[0],
    options,
    details: options.map((o) => o.value).join(' · '),
  }
}

function componentError(role, c) {
  if (!c) return role.missingMessage
  if (!c.variant) return `${c.name} isn’t available in ${c.details}. Please choose another option.`
  if (c.variant.stock <= 0) return `${c.name} is sold out in ${c.details}. Please choose another option.`
  const max = maxComponentQuantity(role.id, c.variant)
  if (!Number.isInteger(c.quantity) || c.quantity < 1 || c.quantity > max) return `Please choose between 1 and ${max} of ${c.name}.`
  return null
}

/** "1 Pillow Product + 1 Duvet Cover" */
export const describeSetContents = (components) =>
  SET_ROLES.map((role) => {
    const qty = components.filter((c) => c?.role === role.id).reduce((s, c) => s + c.quantity, 0)
    return qty ? `${qty} ${qty === 1 ? role.unit[0] : role.unit[1]}` : null
  })
    .filter(Boolean)
    .join(' + ')

const validQuantity = (role, qty) => Number.isInteger(qty) && qty >= 1 && qty <= role.maxQuantity

/**
 * Resolves and validates a draft.
 * - `isConfigured`: every role has a product whose selected variant exists and a valid quantity (the set can be priced).
 * - `isComplete`:   configured and in stock for the chosen quantities (the set can be added to the cart).
 * The total is always the plain sum of each component's regular price × quantity — no set discount.
 */
export function resolveSet(draft, catalogArg) {
  const catalog = catalogOrCurrent(catalogArg)
  const components = SET_ROLES.map((role) => resolveSetComponent(role.id, draft?.[role.id], catalog))
  const errors = SET_ROLES.map((role, i) => ({ role: role.id, message: componentError(role, components[i]) })).filter((e) => e.message)
  const chosen = components.filter(Boolean)
  const isConfigured = SET_ROLES.every((role, i) => components[i]?.variant && validQuantity(role, components[i].quantity))
  const stock = isConfigured ? Math.min(...chosen.map((c) => Math.floor(c.variant.stock / c.quantity))) : 0
  return {
    components,
    chosen,
    errors,
    isConfigured,
    isComplete: isConfigured && errors.length === 0,
    total: roundMoney(chosen.reduce((s, c) => s + c.lineTotal, 0)),
    stock,
    summary: describeSetContents(chosen),
  }
}

/** Stored cart line for a draft set — one line holding every component. */
export function makeCustomSetLine(draft, quantity = 1) {
  return {
    type: 'custom-set',
    components: SET_ROLES.filter((role) => draft?.[role.id]).map((role) => {
      const { productId, selection, quantity: qty } = draft[role.id]
      return { role: role.id, productId, selection: { ...selection }, quantity: qty }
    }),
    quantity,
  }
}

/** Turns stored line components back into a draft. Null when malformed (missing / duplicate / unknown roles). */
export function draftFromComponents(components) {
  if (!Array.isArray(components) || components.length !== SET_ROLES.length) return null
  const draft = emptyDraft()
  for (const c of components) {
    if (!c || typeof c !== 'object' || !SET_ROLES_BY_ID[c.role] || draft[c.role]) return null
    draft[c.role] = { productId: c.productId, selection: c.selection, quantity: c.quantity }
  }
  return draft
}

/** Stable configuration id — identical sets share it, any difference in product, variant or quantity changes it. */
export const setConfigurationId = (components) =>
  SET_ROLES.map((role) => components.find((c) => c.role === role.id))
    .filter(Boolean)
    .map((c) => `${c.role}=${c.productId}:${variantKey(c.selection ?? {})}x${c.quantity}`)
    .join('|')

/** Validates a draft read from localStorage: drops unknown products, wrong roles and variants that don't exist. */
export function sanitizeDraft(raw, catalogArg) {
  const catalog = catalogOrCurrent(catalogArg)
  const draft = emptyDraft()
  if (!raw || typeof raw !== 'object') return draft
  for (const role of SET_ROLES) {
    const c = resolveSetComponent(role.id, raw[role.id], catalog)
    if (!c?.variant) continue
    const quantity = Math.min(Math.max(1, Math.floor(Number(raw[role.id].quantity)) || 1), role.maxQuantity)
    draft[role.id] = { productId: c.productId, selection: c.selection, quantity }
  }
  return draft
}
