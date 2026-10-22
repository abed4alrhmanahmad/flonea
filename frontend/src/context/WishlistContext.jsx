import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { readStorage, STORAGE_KEYS, writeStorage } from '../lib/storage.js'
import { useCatalog } from '../store/hooks.js'

const WishlistContext = createContext(null)

// Saved ids are kept even while a product is hidden (draft / archived), so it comes back if the
// Admin re-activates it; only purchasable products are shown and counted.
const sanitize = (value) => (Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === 'string' && id))] : [])

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => sanitize(readStorage(STORAGE_KEYS.wishlist, [])))

  useEffect(() => {
    writeStorage(STORAGE_KEYS.wishlist, ids)
  }, [ids])

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEYS.wishlist) setIds(sanitize(readStorage(STORAGE_KEYS.wishlist, [])))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const has = useCallback((id) => ids.includes(id), [ids])
  const remove = useCallback((id) => setIds((list) => list.filter((x) => x !== id)), [])
  /** Toggles a product and returns true when it was added. */
  const toggle = useCallback(
    (id) => {
      const adding = !ids.includes(id)
      setIds((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
      return adding
    },
    [ids],
  )

  const catalog = useCatalog()
  const items = useMemo(() => ids.map((id) => catalog.byId[id]).filter(Boolean), [ids, catalog])
  const value = useMemo(() => ({ ids, items, count: items.length, has, toggle, remove }), [ids, items, has, toggle, remove])
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>')
  return ctx
}
