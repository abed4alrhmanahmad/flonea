import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { addLineToCart, removeLine, sanitizeCart, setLineQuantity } from '../lib/cart.js'
import { calculateTotals, getLineId, resolveCartLine } from '../lib/pricing.js'
import { readStorage, STORAGE_KEYS, writeStorage } from '../lib/storage.js'
import { useCatalog } from '../store/hooks.js'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [lines, setLines] = useState(() => sanitizeCart(readStorage(STORAGE_KEYS.cart, [])))
  const linesRef = useRef(lines)

  useEffect(() => {
    linesRef.current = lines
    writeStorage(STORAGE_KEYS.cart, lines)
  }, [lines])

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEYS.cart) setLines(sanitizeCart(readStorage(STORAGE_KEYS.cart, [])))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  /** Adds a line and returns { added, quantity, capped, maxQuantity, error } for user feedback. */
  const addLine = useCallback((line) => {
    const result = addLineToCart(linesRef.current, line)
    if (result.lines !== linesRef.current) {
      linesRef.current = result.lines
      setLines(result.lines)
    }
    return result
  }, [])

  const updateQuantity = useCallback((lineId, quantity) => setLines((l) => setLineQuantity(l, lineId, quantity)), [])
  const remove = useCallback((lineId) => setLines((l) => removeLine(l, lineId)), [])
  const clear = useCallback(() => setLines([]), [])

  // Re-priced against the live catalog, so Admin changes (price, stock, availability) apply at once.
  const catalog = useCatalog()
  const { resolvedLines, unavailableLines } = useMemo(() => {
    const resolved = []
    const unavailable = []
    for (const line of lines) {
      const r = resolveCartLine(line, catalog)
      // Sold-out lines can't be bought either, so they are listed with the unavailable ones.
      if (r && r.quantity > 0) resolved.push(r)
      else unavailable.push({ id: getLineId(line), line, resolved: r, name: r?.name ?? catalog.allById[line.productId]?.name ?? 'Custom Bedding Set' })
    }
    return { resolvedLines: resolved, unavailableLines: unavailable }
  }, [lines, catalog])
  const totals = useMemo(() => calculateTotals(resolvedLines), [resolvedLines])
  const removeUnavailable = useCallback(() => {
    const ids = new Set(unavailableLines.map((u) => u.id))
    setLines((l) => l.filter((line) => !ids.has(getLineId(line))))
  }, [unavailableLines])

  const value = useMemo(
    () => ({ lines: resolvedLines, unavailableLines, totals, count: totals.itemCount, addLine, updateQuantity, remove, removeUnavailable, clear }),
    [resolvedLines, unavailableLines, totals, addLine, updateQuantity, remove, removeUnavailable, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
