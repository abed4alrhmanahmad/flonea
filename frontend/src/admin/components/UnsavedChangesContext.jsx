import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef } from 'react'
import { useConfirm } from './ConfirmContext.jsx'

const UnsavedChangesContext = createContext(null)

/**
 * Tracks forms with unsaved edits. Leaving the tab (refresh / close) shows the browser's own
 * warning; Admin navigation (sidebar, account menu, sign out) asks before discarding.
 * The browser Back button is not intercepted (the app uses a declarative router).
 */
export function UnsavedChangesProvider({ children }) {
  const dirty = useRef(new Set())
  const confirm = useConfirm()

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!dirty.current.size) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  const setDirty = useCallback((id, isDirty) => {
    if (isDirty) dirty.current.add(id)
    else dirty.current.delete(id)
  }, [])

  /** Resolves true when it is fine to leave (nothing unsaved, or the user chose to discard). */
  const confirmLeave = useCallback(async () => {
    if (!dirty.current.size) return true
    const ok = await confirm({
      title: 'Discard unsaved changes?',
      message: 'You have changes that haven’t been saved. If you leave now they will be lost.',
      confirmLabel: 'Discard changes',
      cancelLabel: 'Keep editing',
      tone: 'danger',
    })
    if (ok) dirty.current.clear()
    return ok
  }, [confirm])

  const value = useMemo(() => ({ setDirty, confirmLeave }), [setDirty, confirmLeave])
  return <UnsavedChangesContext.Provider value={value}>{children}</UnsavedChangesContext.Provider>
}

export function useUnsavedChangesGuard() {
  const ctx = useContext(UnsavedChangesContext)
  if (!ctx) throw new Error('useUnsavedChangesGuard must be used inside <UnsavedChangesProvider>')
  return ctx
}

/** Registers a form's dirty state for the leave-page warnings. */
export function useUnsavedChanges(isDirty) {
  const { setDirty } = useUnsavedChangesGuard()
  const id = useId()
  useEffect(() => {
    setDirty(id, isDirty)
    return () => setDirty(id, false)
  }, [id, isDirty, setDirty])
}
