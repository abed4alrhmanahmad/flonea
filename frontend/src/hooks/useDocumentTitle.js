import { useEffect } from 'react'
import { useSettings } from '../store/hooks.js'

/** Sets the browser tab title. Pass null for the default home title. */
export function useDocumentTitle(title) {
  const base = useSettings().storeName || 'FLONEA'
  useEffect(() => {
    document.title = title ? `${title} | ${base}` : `${base} — Skin Friendly Bedding & Pillow Collection`
  }, [title, base])
}
