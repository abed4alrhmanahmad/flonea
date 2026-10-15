import { useCallback, useMemo, useState } from 'react'
import { COLORS, MATERIALS, SIZES } from '../data/catalog.js'
import { changeSelection, findVariant, getDefaultSelection } from '../lib/variants.js'

const DIM_LABEL = { material: 'Material', color: 'Colour', size: 'Size' }
const valueName = (dim, value) => (dim === 'material' ? MATERIALS[value]?.short : dim === 'color' ? COLORS[value]?.name : SIZES[value]?.name)

/**
 * Selected material / colour / size for a product, always pointing at a real variant.
 * When a change forces other options to adjust, `notice` explains what changed.
 */
export function useVariantSelection(product, preferred) {
  const [state, setState] = useState(() => ({
    productId: product.id,
    selection: getDefaultSelection(product, preferred),
    notice: null,
  }))

  // Reset when navigating to another product (derived state pattern, no effect needed).
  let current = state
  if (state.productId !== product.id) {
    current = { productId: product.id, selection: getDefaultSelection(product, preferred), notice: null }
    setState(current)
  }

  const select = useCallback(
    (dimension, value) => {
      setState((s) => {
        const { selection, adjusted } = changeSelection(product, s.selection, dimension, value)
        const notice = adjusted.length
          ? `${valueName(dimension, value)} isn't available in ${adjusted
              .map((d) => valueName(d, s.selection[d]))
              .join(' / ')}, so we changed the ${adjusted
              .map((d) => `${DIM_LABEL[d].toLowerCase()} to ${valueName(d, selection[d])}`)
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
