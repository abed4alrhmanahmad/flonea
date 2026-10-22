import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import Drawer from '../../../components/ui/Drawer.jsx'
import ProductGallery from '../../../components/product/ProductGallery.jsx'
import PriceTag from '../../../components/product/PriceTag.jsx'
import Availability from '../../../components/product/Availability.jsx'
import { VariantPicker } from '../../../components/product/Options.jsx'
import { useVariantSelection } from '../../../hooks/useVariantSelection.js'
import { getProductImageKeys } from '../../../lib/variants.js'
import { formatPriceRange, pluralize } from '../../../lib/format.js'
import { roleForProduct } from '../../../lib/customSet.js'
import { StatusBadge } from '../../components/ui.jsx'
import '../../../styles/product.css'

function PreviewBody({ product }) {
  const { selection, variant, select, notice } = useVariantSelection(product, {})
  const images = getProductImageKeys(product, selection?.color)
  const role = roleForProduct(product)
  return (
    <div className="adm-preview__grid">
      <ProductGallery images={images.length ? images : ['hero']} productName={product.name} alts={product.imageAlts} />
      <div className="pdp__info">
        <p className="adm-inline">
          <StatusBadge status={product.status} />
          <span className="muted">{product.categoryName}</span>
          {role && <span className="muted">· Build a Set: {role.label}</span>}
        </p>
        <h2 className="pdp__title">{product.name || 'Untitled product'}</h2>
        <PriceTag price={variant?.price ?? product.priceRange.min} compareAt={variant?.compareAtPrice} size="lg" />
        {product.tagline && <p className="pdp__tagline">{product.tagline}</p>}
        <VariantPicker product={product} selection={selection} onSelect={select} notice={notice} />
        <Availability variant={variant} />
        <p className="muted">
          {pluralize(product.variants.length, 'purchasable variant')} · {formatPriceRange(product.priceRange)}
          {variant?.sku && ` · SKU ${variant.sku}`}
        </p>
      </div>
    </div>
  )
}

/** Storefront-style preview of a product (saved or an unsaved draft), using the real storefront components. */
export default function ProductPreview({ product, open, onClose, unsaved = false }) {
  return (
    <Drawer open={open} onClose={onClose} title={`Preview: ${product?.name || 'Untitled product'}`} side="center" className="adm-preview">
      {product && (
        <div className="adm-stack">
          {unsaved && <p className="adm-note">Previewing unsaved changes — customers still see the last saved version.</p>}
          {product.status !== 'active' && <p className="adm-note adm-note--warning">This product is {product.status}, so customers can’t see it. The preview shows how it will look once active.</p>}
          {product.variants.length ? (
            <PreviewBody key={product.id} product={product} />
          ) : (
            <p className="adm-note adm-note--warning">
              {product.isBundle
                ? 'This set has no combination all of its products share, or one of them is not active, so it can’t be shown or bought.'
                : 'No purchasable variants yet: enable at least one size, colour and material and make sure the combination is offered.'}
            </p>
          )}
          {product.isPurchasable && !unsaved && (
            <Link to={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer" className="link-arrow">
              Open on the storefront <ExternalLink size={13} aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </Drawer>
  )
}
