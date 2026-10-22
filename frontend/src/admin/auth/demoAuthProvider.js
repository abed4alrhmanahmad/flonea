/**
 * ─── DEMO-ONLY ADMIN AUTHENTICATION — NOT SECURE ─────────────────────────────
 *
 * This provider exists so the Admin Dashboard can be opened locally without any backend. It is a
 * client-side convenience, not authentication:
 *   • the demo credentials below ship inside the JavaScript bundle and are visible to anyone;
 *   • the "session" is a marker in browser storage that anyone can create or edit;
 *   • the route guard only decides what this browser renders — it protects no data.
 * Do NOT reuse these credentials anywhere real, and do not treat this as production security.
 *
 * Replacing it: implement the same interface — { id, isAvailable, signIn, getSession, signOut } —
 * against a real identity provider (OIDC, Supabase Auth, Auth0, your own API…) and pass it to
 * <AdminAuthProvider provider={…}> in src/admin/AdminApp.jsx. Nothing else in the Admin needs to
 * change. A real backend must also enforce authorisation on every write; this demo has no server.
 *
 * Set VITE_ENABLE_DEMO_ADMIN=false at build time to switch the demo login off.
 */
import { STORAGE_KEYS } from '../../lib/storage.js'
import { isValidEmail } from '../../lib/validation.js'

/** Demo-only credentials (not production credentials). Shown on the login page. */
export const DEMO_CREDENTIALS = Object.freeze({ email: 'admin@flonea.local', password: 'FloneaDemo2026!' })

const DEMO_PROFILE = { name: 'Demo Admin', role: 'Store admin (demo)' }
const REMEMBER_DAYS = 7
const SIGN_IN_DELAY_MS = 450 // simulated round-trip so loading states are visible

const enabled = import.meta.env?.VITE_ENABLE_DEMO_ADMIN !== 'false'

function safeStorage(kind) {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

/** Reads a session marker and checks its shape and expiry. The password is never stored. */
function readSession(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEYS.adminSession)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (s?.provider !== 'demo' || typeof s.email !== 'string' || typeof s.signedInAt !== 'string') return null
    if (s.expiresAt && Date.parse(s.expiresAt) < Date.now()) {
      storage.removeItem(STORAGE_KEYS.adminSession)
      return null
    }
    return { provider: 'demo', email: s.email, name: s.name ?? DEMO_PROFILE.name, role: s.role ?? DEMO_PROFILE.role, signedInAt: s.signedInAt, expiresAt: s.expiresAt ?? null, remember: Boolean(s.remember) }
  } catch {
    return null
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const demoAuthProvider = {
  id: 'demo',
  label: 'Demo access (local only)',
  /** False when the demo login is switched off for this build. */
  isAvailable: enabled,

  /**
   * Checks the demo credentials. "Remember me" keeps the marker in localStorage for 7 days;
   * otherwise it lives in sessionStorage and ends when this browser tab session ends.
   * Resolves { ok: true, session } or { ok: false, error }.
   */
  async signIn({ email, password, remember = false }) {
    await wait(SIGN_IN_DELAY_MS)
    if (!enabled) return { ok: false, error: 'The demo admin login is disabled for this build.' }
    const normalized = String(email ?? '').trim().toLowerCase()
    if (!isValidEmail(normalized)) return { ok: false, error: 'Please enter a valid email address.' }
    if (normalized !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password) {
      return { ok: false, error: 'Incorrect email or password. Use the demo credentials shown on this page.' }
    }
    const now = new Date()
    const session = {
      provider: 'demo',
      email: normalized,
      ...DEMO_PROFILE,
      signedInAt: now.toISOString(),
      expiresAt: remember ? new Date(now.getTime() + REMEMBER_DAYS * 86400000).toISOString() : null,
      remember,
    }
    const target = safeStorage(remember ? 'local' : 'session')
    const other = safeStorage(remember ? 'session' : 'local')
    try {
      other?.removeItem(STORAGE_KEYS.adminSession)
      target?.setItem(STORAGE_KEYS.adminSession, JSON.stringify(session))
    } catch {
      // Storage blocked: the session still works until this page is reloaded.
    }
    return { ok: true, session }
  },

  getSession() {
    if (!enabled) return null
    return readSession(safeStorage('session')) ?? readSession(safeStorage('local'))
  },

  signOut() {
    for (const kind of ['session', 'local']) {
      try {
        safeStorage(kind)?.removeItem(STORAGE_KEYS.adminSession)
      } catch {
        // ignore
      }
    }
  },
}
