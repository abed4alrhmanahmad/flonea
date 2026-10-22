import { Link } from 'react-router-dom'
import logoSrc from '../../assets/brand/flonea-logo.png'
import { useSettings } from '../../store/hooks.js'

/** Intrinsic size of the original logo file (used to reserve space and avoid layout shift). */
const LOGO_SIZE = { width: 2172, height: 724 }

/**
 * The FLONEA wordmark (original file, unmodified). Size it with the `--logo-h` CSS variable;
 * see `.logo` in styles/layout.css. A logo URL set in Admin → Settings replaces it.
 */
export function LogoImage({ className = '', priority = false, alt = 'FLONEA' }) {
  const { logoUrl } = useSettings()
  if (logoUrl) {
    return <img src={logoUrl} alt={alt} className={`logo__img logo__img--custom ${className}`} decoding="async" loading={priority ? 'eager' : 'lazy'} draggable="false" />
  }
  return (
    <img
      src={logoSrc}
      alt={alt}
      width={LOGO_SIZE.width}
      height={LOGO_SIZE.height}
      className={`logo__img ${className}`}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      draggable="false"
    />
  )
}

/** Logo linking to the homepage. */
export default function Logo({ className = '', priority = false, ...rest }) {
  const { storeName } = useSettings()
  return (
    <Link to="/" className={`logo ${className}`} aria-label={`${storeName || 'FLONEA'} — home`} {...rest}>
      <LogoImage priority={priority} alt="" />
    </Link>
  )
}
