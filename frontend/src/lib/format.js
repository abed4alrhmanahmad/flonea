import { getSettings } from '../store/store.js'

const formatters = new Map()
function currencyFormatter(code, whole) {
  const id = `${code}:${whole}`
  if (!formatters.has(id)) {
    formatters.set(id, new Intl.NumberFormat('en-US', { style: 'currency', currency: code, ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}) }))
  }
  return formatters.get(id)
}

/**
 * Formats an amount in the store's display currency (Admin → Settings). Display only: amounts are
 * the same numbers whatever currency is chosen — nothing is converted.
 */
export const formatPrice = (amount, { whole = false } = {}) => currencyFormatter(getSettings().currency.code, whole).format(amount ?? 0)

/** "$69.00" or "From $69.00" when a product's variants have different prices. */
export const formatPriceRange = ({ min, max }) => (min === max ? formatPrice(min) : `From ${formatPrice(min)}`)

/** Label for a shop price filter bucket, e.g. "Under $50" or "$50 – $100". */
export function formatPriceBucket({ min, max }) {
  if (!min) return `Under ${formatPrice(max, { whole: true })}`
  if (max === Infinity) return `${formatPrice(min, { whole: true })} & above`
  return `${formatPrice(min, { whole: true })} – ${formatPrice(max, { whole: true })}`
}

/** The display currency's symbol, e.g. "$" or "€" (used as an input prefix in the Admin). */
export function currencySymbol() {
  return currencyFormatter(getSettings().currency.code, true).formatToParts(0).find((p) => p.type === 'currency')?.value ?? '$'
}

export const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`
