import { getImage } from '../../data/images.js'

/**
 * Responsive image from the central registry.
 * `ratio` reserves space (prevents layout shift); `priority` loads eagerly (above the fold).
 */
export default function Img({ name, alt, sizes = '(max-width: 700px) 100vw, 50vw', ratio, priority = false, className = '', ...rest }) {
  const img = getImage(name)
  return (
    <span className={`img-frame ${className}`} style={ratio ? { aspectRatio: ratio } : undefined}>
      <img
        src={img.src}
        srcSet={img.srcSet}
        sizes={sizes}
        alt={alt ?? img.alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        {...rest}
      />
    </span>
  )
}
