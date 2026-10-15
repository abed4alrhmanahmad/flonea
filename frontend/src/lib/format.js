const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export const formatPrice = (amount) => currency.format(amount ?? 0)

/** "$69.00" or "From $69.00" when a product's variants have different prices. */
export const formatPriceRange = ({ min, max }) => (min === max ? formatPrice(min) : `From ${formatPrice(min)}`)

export const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`
