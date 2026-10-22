import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { emptyDraft, resolveSet, sanitizeDraft } from '../lib/customSet.js'
import { readStorage, STORAGE_KEYS, writeStorage } from '../lib/storage.js'
import { useCatalog } from '../store/hooks.js'

const SetBuilderContext = createContext(null)

/**
 * The custom set being built (one Pillows & Pillowcases product + one duvet cover).
 * Kept in localStorage so the selection survives moving between collection, product and builder pages.
 */
export function SetBuilderProvider({ children }) {
  const [draft, setDraft] = useState(() => sanitizeDraft(readStorage(STORAGE_KEYS.setDraft, null)))

  useEffect(() => {
    writeStorage(STORAGE_KEYS.setDraft, draft)
  }, [draft])

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEYS.setDraft) setDraft(sanitizeDraft(readStorage(STORAGE_KEYS.setDraft, null)))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  /** Puts a product + variant + quantity into a role, replacing whatever was there. */
  const setComponent = useCallback((roleId, component) => {
    setDraft((d) => sanitizeDraft({ ...d, [roleId]: component }))
  }, [])
  const setComponentQuantity = useCallback((roleId, quantity) => {
    setDraft((d) => (d[roleId] ? sanitizeDraft({ ...d, [roleId]: { ...d[roleId], quantity } }) : d))
  }, [])
  const removeComponent = useCallback((roleId) => setDraft((d) => ({ ...d, [roleId]: null })), [])
  const clear = useCallback(() => setDraft(emptyDraft()), [])

  // Resolved against the live catalog: prices, stock and eligibility follow Admin changes.
  const catalog = useCatalog()
  const set = useMemo(() => resolveSet(draft, catalog), [draft, catalog])

  const value = useMemo(
    () => ({ draft, set, setComponent, setComponentQuantity, removeComponent, clear }),
    [draft, set, setComponent, setComponentQuantity, removeComponent, clear],
  )

  return <SetBuilderContext.Provider value={value}>{children}</SetBuilderContext.Provider>
}

export function useSetBuilder() {
  const ctx = useContext(SetBuilderContext)
  if (!ctx) throw new Error('useSetBuilder must be used inside <SetBuilderProvider>')
  return ctx
}
