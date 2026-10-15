import { useEffect } from 'react'

const BASE = 'FLONEA'

/** Sets the browser tab title. Pass null for the default home title. */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE}` : `${BASE} — Skin Friendly Bedding & Pillow Collection`
  }, [title])
}
