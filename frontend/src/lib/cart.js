/**
 * Pure cart operations (no React). Stored lines look like:
 *   { type: 'product' | 'set', productId, selection: { material, color, size }, quantity }
 *   { type: 'custom-set', components: [{ role, productId, selection, quantity }], quantity }
 *
 * Merging rule: adding a line with the same id (same product + same variant, or the same
 * custom set configuration) increases its quantity, capped at available stock and
 * MAX_LINE_QUANTITY. Different variants of one product are always separate lines.
 */
import { MAX_LINE_QUANTITY } from '../data/catalog.js'
import { getAnyProductById } from '../store/store.js'
import { draftFromComponents } from './customSet.js'
import { getLineId, resolveCartLine } from './pricing.js'

const strip = ({ type, productId, selection, components, quantity }) =>
  type === 'custom-set'
    ? { type, components: components.map((c) => ({ role: c.role, productId: c.productId, selection: { ...c.selection }, quantity: c.quantity })), quantity }
    : { type, productId, selection: { ...selection }, quantity }

export function addLineToCart(lines, newLine) {
  const resolved = resolveCartLine({ ...newLine, quantity: 1 })
  if (!resolved) return { lines, added: 0, quantity: 0, capped: false, error: 'This option is no longer available.' }
  if (resolved.maxQuantity === 0) return { lines, added: 0, quantity: 0, capped: true, error: 'This option is sold out.' }

  const id = getLineId(newLine)
  const index = lines.findIndex((l) => getLineId(l) === id)
  const current = index >= 0 ? lines[index].quantity : 0
  const requested = current + Math.max(1, Math.floor(newLine.quantity || 1))
  const quantity = Math.min(requested, resolved.maxQuantity)
  const added = quantity - current
  const next = index >= 0 ? lines.map((l, i) => (i === index ? { ...l, quantity } : l)) : [...lines, strip({ ...newLine, quantity })]
  return { lines: next, added, quantity, capped: quantity < requested, maxQuantity: resolved.maxQuantity }
}

export function setLineQuantity(lines, lineId, quantity) {
  const qty = Math.floor(Number(quantity))
  if (!Number.isFinite(qty)) return lines
  if (qty <= 0) return removeLine(lines, lineId)
  return lines.map((l) => {
    if (getLineId(l) !== lineId) return l
    const resolved = resolveCartLine(l)
    return { ...l, quantity: Math.min(qty, resolved?.maxQuantity ?? qty) }
  })
}

export const removeLine = (lines, lineId) => lines.filter((l) => getLineId(l) !== lineId)

const isSelection = (s) => Boolean(s) && typeof s === 'object' && ['material', 'color', 'size'].every((d) => typeof s[d] === 'string' && s[d])
const isQuantity = (q) => Number.isInteger(q) && q >= 1

/** Structurally valid and referring to products that exist (in any status). */
function isKnownLine(raw) {
  if (raw.type === 'custom-set') {
    const draft = draftFromComponents(raw.components)
    return Boolean(draft) && Object.values(draft).every((c) => c && isSelection(c.selection) && isQuantity(c.quantity) && getAnyProductById(c.productId))
  }
  return (raw.type === 'product' || raw.type === 'set') && isSelection(raw.selection) && Boolean(getAnyProductById(raw.productId))
}

/**
 * Validates data read from localStorage: drops malformed lines and lines for products that no longer
 * exist, merges duplicates and clamps quantities. Lines that are valid but can't be bought right now
 * (product switched to draft, option withdrawn, sold out) are kept as they are, so they come back
 * if the Admin restores the item; the cart shows them separately as unavailable.
 */
export function sanitizeCart(stored) {
  if (!Array.isArray(stored)) return []
  let lines = []
  for (const raw of stored) {
    if (!raw || typeof raw !== 'object') continue
    const quantity = Math.floor(Number(raw.quantity))
    if (!Number.isFinite(quantity) || quantity < 1 || !isKnownLine(raw)) continue
    const result = addLineToCart(lines, { ...raw, quantity })
    if (!result.error) {
      lines = result.lines
      continue
    }
    const kept = strip({ ...raw, quantity: Math.min(quantity, MAX_LINE_QUANTITY) })
    if (!lines.some((l) => getLineId(l) === getLineId(kept))) lines = [...lines, kept]
  }
  return lines
}
