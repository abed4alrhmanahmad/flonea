/**
 * Pure cart operations (no React). Stored lines look like:
 *   { type: 'product' | 'set', productId, selection: { material, color, size }, quantity }
 *   { type: 'custom-set', selection, components: [{ productId, quantity }], quantity }
 *
 * Merging rule: adding a line with the same id (same product + same variant, or the same
 * custom set configuration) increases its quantity, capped at available stock and
 * MAX_LINE_QUANTITY. Different variants of one product are always separate lines.
 */
import { getLineId, resolveCartLine } from './pricing.js'

const strip = ({ type, productId, selection, components, quantity }) =>
  type === 'custom-set' ? { type, selection, components, quantity } : { type, productId, selection, quantity }

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

/** Validates data read from localStorage: drops unknown/invalid lines, merges duplicates, clamps quantities. */
export function sanitizeCart(stored) {
  if (!Array.isArray(stored)) return []
  let lines = []
  for (const raw of stored) {
    if (!raw || typeof raw !== 'object' || !raw.selection) continue
    const quantity = Math.floor(Number(raw.quantity))
    if (!Number.isFinite(quantity) || quantity < 1) continue
    if (raw.type === 'custom-set' && !Array.isArray(raw.components)) continue
    lines = addLineToCart(lines, { ...raw, quantity }).lines
  }
  return lines
}
