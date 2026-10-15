import { Link } from 'react-router-dom'
import logoSrc from '../../assets/brand/flonea-logo.png'

/** Intrinsic size of the original logo file (used to reserve space and avoid layout shift). */
const LOGO_SIZE = { width: 2172, height: 724 }

/**
 * The FLONEA wordmark (original file, unmodified). Size it with the `--logo-h` CSS variable;
 * see `.logo` in styles/layout.css.
 */
export function LogoImage({ className = '', priority = false, alt = 'FLONEA' }) {
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
  return (
    <Link to="/" className={`logo ${className}`} aria-label="FLONEA — home" {...rest}>
      <LogoImage priority={priority} alt="" />
    </Link>
  )
}
