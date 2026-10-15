/**
 * Safe localStorage helpers — storage can be unavailable (private mode, blocked cookies)
 * or contain corrupted data, so every access is guarded.
 */
export function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export const STORAGE_KEYS = {
  cart: 'flonea.cart.v1',
  wishlist: 'flonea.wishlist.v1',
  lastOrder: 'flonea.demoOrder.v1',
}
