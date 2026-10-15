import { createContext, useCallback, useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import Drawer from '../ui/Drawer.jsx'
import Img from '../ui/Img.jsx'
import QuantitySelector from '../ui/QuantitySelector.jsx'
import Availability from './Availability.jsx'
import PriceTag from './PriceTag.jsx'
import { VariantPicker } from './Options.jsx'
import { useVariantSelection } from '../../hooks/useVariantSelection.js'
import { useShopActions } from '../../hooks/useShopActions.js'
import { getProductImageKeys } from '../../lib/variants.js'
import { MAX_LINE_QUANTITY } from '../../data/catalog.js'

const QuickAddContext = createContext(() => {})

/** Opens a modal to choose options before adding to cart (so we never guess a size for the customer). */
export function QuickAddProvider({ children }) {
  const [target, setTarget] = useState(null)
  const open = useCallback((product, color) => setTarget({ product, color }), [])
  const close = useCallback(() => setTarget(null), [])
  return (
    <QuickAddContext.Provider value={open}>
      {children}
      <Drawer open={Boolean(target)} onClose={close} title={target ? `Quick add: ${target.product.name}` : 'Quick add'} side="center" className="quick-add">
        {target && <QuickAddBody key={target.product.id} product={target.product} color={target.color} onDone={close} />}
      </Drawer>
    </QuickAddContext.Provider>
  )
}

export const useQuickAdd = () => useContext(QuickAddContext)

function QuickAddBody({ product, color, onDone }) {
  const { selection, variant, select, notice } = useVariantSelection(product, { color })
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useShopActions()
  const max = Math.max(1, Math.min(variant?.stock ?? 1, MAX_LINE_QUANTITY))
  const canAdd = variant && variant.stock > 0

  return (
    <div className="quick-add__grid">
      <Img name={getProductImageKeys(product, selection.color)[0]} ratio="1 / 1" sizes="(max-width: 700px) 100vw, 320px" className="quick-add__img" />
      <div className="quick-add__info">
        <p className="eyebrow">{product.categoryName}</p>
        <PriceTag price={variant?.price} compareAt={variant?.compareAtPrice} size="lg" />
        <VariantPicker product={product} selection={selection} onSelect={select} notice={notice} />
        <Availability variant={variant} />
        <div className="quick-add__actions">
          <QuantitySelector value={Math.min(quantity, max)} onChange={setQuantity} max={max} disabled={!canAdd} />
          <button
            type="button"
            className="btn"
            disabled={!canAdd}
            onClick={() => {
              const result = addToCart(product, selection, Math.min(quantity, max))
              if (!result.error) onDone()
            }}
          >
            {canAdd ? 'Add to Cart' : 'Sold Out'}
          </button>
        </div>
        <Link to={`/products/${product.slug}?color=${selection.color}`} className="link-arrow" onClick={onDone}>
          View full details
        </Link>
      </div>
    </div>
  )
}
