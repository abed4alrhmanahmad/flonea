/**
 * Safe localStorage helpers — storage can be unavailable (private mode, blocked cookies, a full
 * quota) or contain corrupted data, so every access is guarded.
 *
 * localStorage is a LOCAL DEMO persistence layer: data lives only in this browser, is visible to
 * anyone using it, and is not shared with other devices or visitors. It is not a database.
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

export function removeStorage(key) {
  try {
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export const STORAGE_KEYS = {
  cart: 'flonea.cart.v1',
  wishlist: 'flonea.wishlist.v1',
  setDraft: 'flonea.setDraft.v1',
  lastOrder: 'flonea.demoOrder.v1',
  /** Catalog, collections, content, settings and Build a Set settings edited in the Admin. */
  store: 'flonea.store.v1',
  /** Demo orders placed through the storefront checkout (plus clearly-flagged sample orders). */
  orders: 'flonea.orders.v1',
  /** Local admin activity history (not an audit log). */
  activity: 'flonea.adminActivity.v1',
  /** Demo admin session marker — never contains a password. */
  adminSession: 'flonea.adminSession.v1',
}
