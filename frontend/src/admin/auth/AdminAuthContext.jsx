import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { STORAGE_KEYS } from '../../lib/storage.js'
import { setActivityActor } from '../../store/store.js'
import { demoAuthProvider } from './demoAuthProvider.js'

const AdminAuthContext = createContext(null)

/**
 * Admin session state on top of an auth provider (the local demo provider by default).
 * Client-side only: it controls what this browser shows, it does not secure any data.
 */
export function AdminAuthProvider({ provider = demoAuthProvider, children }) {
  const [session, setSession] = useState(() => provider.getSession())

  useEffect(() => {
    setActivityActor(session?.email)
  }, [session])

  // Signing out (or in) in another tab applies here too.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === null || e.key === STORAGE_KEYS.adminSession) setSession(provider.getSession())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [provider])

  const signIn = useCallback(
    async (credentials) => {
      const result = await provider.signIn(credentials)
      if (result.ok) setSession(result.session)
      return result
    },
    [provider],
  )

  const signOut = useCallback(() => {
    provider.signOut()
    setSession(null)
  }, [provider])

  const value = useMemo(() => ({ session, provider, signIn, signOut }), [session, provider, signIn, signOut])
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>')
  return ctx
}

/**
 * Client-side route guard for the demo: without a demo session, admin URLs redirect to the login
 * page (remembering where the user was going). This is navigation only — not access control.
 */
export function RequireAdmin({ children }) {
  const { session } = useAdminAuth()
  const location = useLocation()
  if (!session) return <Navigate to="/admin/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />
  return children
}
