import { useCallback } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { getDefaultSelection, describeSelection } from '../lib/variants.js'

/** Add-to-cart / wishlist actions with consistent user feedback. */
export function useShopActions() {
  const { addLine } = useCart()
  const wishlist = useWishlist()
  const { notify } = useToast()

  const addToCart = useCallback(
    (product, selection, quantity = 1) => {
      const sel = selection ?? getDefaultSelection(product)
      const type = product.isBundle ? 'set' : 'product'
      const result = addLine({ type, productId: product.id, selection: sel, quantity })
      if (result.error) {
        notify({ tone: 'error', title: result.error, message: 'Please choose another option.' })
      } else if (result.added === 0) {
        notify({ tone: 'info', title: `You already have the maximum available (${result.maxQuantity}) in your cart.`, action: { label: 'View cart', to: '/cart' } })
      } else {
        notify({
          title: `${product.name} added to cart`,
          message: `${describeSelection(product, sel).join(' · ')}${result.capped ? ` — limited to ${result.added} by available stock` : ''}`,
          action: { label: 'View cart', to: '/cart' },
        })
      }
      return result
    },
    [addLine, notify],
  )

  const toggleWishlist = useCallback(
    (product) => {
      const added = wishlist.toggle(product.id)
      notify(
        added
          ? { title: 'Saved to your wishlist', message: product.name, action: { label: 'View wishlist', to: '/wishlist' } }
          : { tone: 'info', title: 'Removed from your wishlist', message: product.name },
      )
    },
    [wishlist, notify],
  )

  return { addToCart, toggleWishlist, isWishlisted: wishlist.has }
}
