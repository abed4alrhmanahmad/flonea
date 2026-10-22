/**
 * Link helpers for Admin-edited destinations. Storefront links are internal paths only
 * ("/shop", "/collections/pillows?color=sage", "/about#materials"); social links must be https.
 */

/** Internal site path: starts with a single "/" and contains no whitespace. */
export const isSitePath = (value) => typeof value === 'string' && /^\/(?!\/)[^\s]*$/.test(value.trim())

/** Returns the path when it is a safe internal path, otherwise the homepage. */
export const safePath = (value, fallback = '/') => (isSitePath(value) ? value.trim() : fallback)

export const isHttpsUrl = (value) => {
  if (typeof value !== 'string' || !/^https:\/\//i.test(value.trim())) return false
  try {
    return Boolean(new URL(value.trim()).hostname)
  } catch {
    return false
  }
}

/** Storefront routes, offered as suggestions in Admin link fields. */
export const KNOWN_PATHS = [
  '/',
  '/shop',
  '/shop?sort=newest',
  '/collections/duvet-covers',
  '/collections/pillows',
  '/collections/bedding-sets',
  '/bedding-sets/builder',
  '/cart',
  '/wishlist',
  '/about',
  '/about#materials',
  '/account',
  '/help/shipping-returns',
  '/help/faq',
  '/help/care',
  '/help/contact',
  '/help/privacy',
  '/help/terms',
]
