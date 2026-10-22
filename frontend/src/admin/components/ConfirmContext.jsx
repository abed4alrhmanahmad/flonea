import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import Drawer from '../../components/ui/Drawer.jsx'

const ConfirmContext = createContext(null)

/**
 * Promise-based confirmation dialog:
 *   const confirm = useConfirm()
 *   if (await confirm({ title, message, confirmLabel, tone: 'danger' })) …
 * Escape, the backdrop and "Cancel" all resolve false.
 */
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current?.(false)
        resolver.current = resolve
        setRequest({ confirmLabel: 'Confirm', cancelLabel: 'Cancel', tone: 'default', ...options })
      }),
    [],
  )

  const close = useCallback((result) => {
    resolver.current?.(result)
    resolver.current = null
    setRequest(null)
  }, [])

  const value = useMemo(() => confirm, [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Drawer open={Boolean(request)} onClose={() => close(false)} title={request?.title ?? 'Please confirm'} side="center" className="adm-dialog">
        {request && (
          <div className="adm-dialog__body">
            {request.tone === 'danger' && (
              <span className="adm-dialog__icon" aria-hidden="true">
                <TriangleAlert size={22} />
              </span>
            )}
            <div>
              {typeof request.message === 'string' ? <p>{request.message}</p> : request.message}
              <div className="adm-dialog__actions">
                <button type="button" className="btn btn--light btn--sm" onClick={() => close(false)} data-autofocus>
                  {request.cancelLabel}
                </button>
                <button type="button" className={`btn btn--sm ${request.tone === 'danger' ? 'btn--danger' : ''}`} onClick={() => close(true)}>
                  {request.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return ctx
}
