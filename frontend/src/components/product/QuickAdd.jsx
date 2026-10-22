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
import { useSetActions } from '../../hooks/useSetActions.js'
import { getProductImageKeys } from '../../lib/variants.js'
import { roleForProduct } from '../../lib/customSet.js'
import { MAX_LINE_QUANTITY } from '../../data/catalog.js'
import { SET_MODE_PARAM, SET_MODE_VALUE } from '../../data/setBuilder.js'
import { useCatalog } from '../../store/hooks.js'

const QuickAddContext = createContext(() => {})

/**
 * Opens a modal to choose options before adding to cart (so we never guess a size for the customer).
 * In Build a Set mode the same modal adds the chosen variant to the pending set instead.
 */
export function QuickAddProvider({ children }) {
  const [target, setTarget] = useState(null)
  const catalog = useCatalog()
  const open = useCallback((product, color, { setMode = false } = {}) => setTarget({ productId: product.id, name: product.name, color, setMode }), [])
  const close = useCallback(() => setTarget(null), [])
  // Looked up live, so the modal never shows prices or options the catalog no longer has.
  const product = target ? catalog.byId[target.productId] : null
  const title = target ? `${target.setMode ? 'Add to set' : 'Quick add'}: ${target.name}` : 'Quick add'
  return (
    <QuickAddContext.Provider value={open}>
      {children}
      <Drawer open={Boolean(target)} onClose={close} title={title} side="center" className="quick-add">
        {target &&
          (product ? (
            <QuickAddBody key={product.id} product={product} color={target.color} setMode={target.setMode} onDone={close} />
          ) : (
            <p className="muted">This product is no longer available.</p>
          ))}
      </Drawer>
    </QuickAddContext.Provider>
  )
}

export const useQuickAdd = () => useContext(QuickAddContext)

function QuickAddBody({ product, color, setMode, onDone }) {
  const { selection, variant, select, notice } = useVariantSelection(product, { color })
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useShopActions()
  const { addToSet } = useSetActions()
  const setRole = setMode ? roleForProduct(product) : null
  const max = Math.max(1, Math.min(variant?.stock ?? 1, MAX_LINE_QUANTITY, setRole?.maxQuantity ?? MAX_LINE_QUANTITY))
  const canAdd = variant && variant.stock > 0
  const detailsHref = `/products/${product.slug}?${setRole ? `${SET_MODE_PARAM}=${SET_MODE_VALUE}&` : ''}color=${selection.color}`

  const onAdd = () => {
    const qty = Math.min(quantity, max)
    const result = setRole ? addToSet(product, selection, qty) : addToCart(product, selection, qty)
    if (!result.error) onDone()
  }

  return (
    <div className="quick-add__grid">
      <Img name={getProductImageKeys(product, selection.color)[0]} ratio="1 / 1" sizes="(max-width: 700px) 100vw, 320px" className="quick-add__img" />
      <div className="quick-add__info">
        <p className="eyebrow">{setRole ? `Your set · ${setRole.label}` : product.categoryName}</p>
        <PriceTag price={variant?.price} compareAt={variant?.compareAtPrice} size="lg" />
        <VariantPicker product={product} selection={selection} onSelect={select} notice={notice} />
        <Availability variant={variant} />
        <div className="quick-add__actions">
          {(!setRole || setRole.maxQuantity > 1) && (
            <QuantitySelector value={Math.min(quantity, max)} onChange={setQuantity} max={max} disabled={!canAdd} />
          )}
          <button type="button" className="btn" disabled={!canAdd} onClick={onAdd}>
            {!canAdd ? 'Sold Out' : setRole ? 'Add to Set' : 'Add to Cart'}
          </button>
        </div>
        <Link to={detailsHref} className="link-arrow" onClick={onDone}>
          View full details
        </Link>
      </div>
    </div>
  )
}
