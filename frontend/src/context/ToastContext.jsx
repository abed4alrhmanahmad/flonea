import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck, CircleAlert, Info, X } from 'lucide-react'
import '../styles/toast.css'

const ToastContext = createContext(null)
const ICONS = { success: CircleCheck, error: CircleAlert, info: Info }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  /** notify({ title, message?, tone?: 'success' | 'error' | 'info', action?: { label, to } }) */
  const notify = useCallback(
    (toast) => {
      const id = ++idRef.current
      setToasts((list) => [...list.slice(-2), { tone: 'success', ...toast, id }])
      window.setTimeout(() => dismiss(id), toast.duration ?? 4000)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => {
          const Icon = ICONS[t.tone] ?? Info
          return (
            <div key={t.id} className={`toast toast--${t.tone}`}>
              <Icon size={18} aria-hidden="true" className="toast__icon" />
              <div className="toast__body">
                <p className="toast__title">{t.title}</p>
                {t.message && <p className="toast__msg">{t.message}</p>}
                {t.action && (
                  <Link className="toast__action" to={t.action.to} onClick={() => dismiss(t.id)}>
                    {t.action.label}
                  </Link>
                )}
              </div>
              <button className="toast__close" type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
