import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { PRODUCTS_BY_ID } from '../data/products.js'
import { readStorage, STORAGE_KEYS, writeStorage } from '../lib/storage.js'

const WishlistContext = createContext(null)

const sanitize = (value) =>
  Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === 'string' && PRODUCTS_BY_ID[id]))] : []

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

  const value = useMemo(
    () => ({ ids, items: ids.map((id) => PRODUCTS_BY_ID[id]).filter(Boolean), count: ids.length, has, toggle, remove }),
    [ids, has, toggle, remove],
  )
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>')
  return ctx
}
