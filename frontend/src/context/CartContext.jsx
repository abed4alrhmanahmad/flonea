import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { addLineToCart, removeLine, sanitizeCart, setLineQuantity } from '../lib/cart.js'
import { calculateTotals, resolveCartLine } from '../lib/pricing.js'
import { readStorage, STORAGE_KEYS, writeStorage } from '../lib/storage.js'

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

  const resolvedLines = useMemo(() => lines.map(resolveCartLine).filter(Boolean), [lines])
  const totals = useMemo(() => calculateTotals(resolvedLines), [resolvedLines])

  const value = useMemo(
    () => ({ lines: resolvedLines, totals, count: totals.itemCount, addLine, updateQuantity, remove, clear }),
    [resolvedLines, totals, addLine, updateQuantity, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
