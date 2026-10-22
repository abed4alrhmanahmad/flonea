import { useSyncExternalStore } from 'react'
import { getSnapshot, subscribe } from './store.js'

/** The whole store snapshot. It changes identity on every store update, so subscribers re-render. */
export const useStore = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

/**
 * Processed catalog: { products (storefront), byId, bySlug, all, allById (any status),
 * collections, collectionsById, optionIndex }.
 */
export const useCatalog = () => useStore().catalog
/** Editable data: { products, collections, content, settings, setBuilder }. */
export const useStoreData = () => useStore().data
export const useContent = () => useStore().data.content
export const useSettings = () => useStore().data.settings
