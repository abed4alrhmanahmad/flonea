import { useCallback, useMemo, useState } from 'react'
import { changeSelection, findVariant, getDefaultSelection, optionLabel } from '../lib/variants.js'

const DIM_LABEL = { material: 'Material', color: 'Colour', size: 'Size' }

/**
 * Selected material / colour / size for a product, always pointing at a real variant.
 * When a change forces other options to adjust, `notice` explains what changed.
 */
export function useVariantSelection(product, preferred) {
  const [state, setState] = useState(() => ({
    product,
    selection: getDefaultSelection(product, preferred),
    notice: null,
  }))

  // Reset when navigating to another product, and re-check the selection when the catalog changes
  // underneath it (e.g. the Admin withdrew the selected colour) — derived state, no effect needed.
  let current = state
  if (state.product !== product) {
    const keep = state.product.id === product.id && findVariant(product, state.selection)
    current = { product, selection: keep ? state.selection : getDefaultSelection(product, preferred), notice: null }
    setState(current)
  }

  const select = useCallback(
    (dimension, value) => {
      setState((s) => {
        const name = (dim, id) => optionLabel(product, dim, id)
        const { selection, adjusted } = changeSelection(product, s.selection, dimension, value)
        const notice = adjusted.length
          ? `${name(dimension, value)} isn't available in ${adjusted
              .map((d) => name(d, s.selection[d]))
              .join(' / ')}, so we changed the ${adjusted
              .map((d) => `${DIM_LABEL[d].toLowerCase()} to ${name(d, selection[d])}`)
              .join(' and ')}.`
          : null
        return { ...s, selection, notice }
      })
    },
    [product],
  )

  const variant = useMemo(() => findVariant(product, current.selection), [product, current.selection])

  return { selection: current.selection, variant, select, notice: current.notice }
}
