import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Img from '../ui/Img.jsx'
import { getImage } from '../../data/images.js'

/**
 * Main image + thumbnails (desktop: vertical rail, mobile: swipeable with dots).
 * `alts` maps an image key/URL to the alt text set for it in the Admin.
 */
export default function ProductGallery({ images, productName, alts = {} }) {
  const [state, setState] = useState({ images, index: 0 })
  const touchX = useRef(null)

  // Reset to the first image when the colour (image set) changes.
  let index = state.index
  if (state.images !== images) {
    index = 0
    setState({ images, index: 0 })
  }
  const go = (i) => setState({ images, index: (i + images.length) % images.length })

  return (
    <div className="gallery">
      <ul className="gallery__thumbs" role="list" aria-label="Product images">
        {images.map((key, i) => (
          <li key={`${key}-${i}`}>
            <button
              type="button"
              className={`gallery__thumb ${i === index ? 'is-active' : ''}`}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === index}
              onClick={() => go(i)}
            >
              <Img name={key} alt="" ratio="1 / 1" sizes="96px" />
            </button>
          </li>
        ))}
      </ul>
      <div
        className="gallery__main"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
          touchX.current = null
        }}
      >
        <Img
          key={images[index]}
          name={images[index]}
          alt={alts[images[index]] || [productName, getImage(images[index]).alt].filter(Boolean).join(' — ')}
          ratio="1 / 1"
          sizes="(max-width: 900px) 100vw, 55vw"
          priority
          className="gallery__image"
        />
        {images.length > 1 && (
          <>
            <button type="button" className="gallery__nav gallery__nav--prev" onClick={() => go(index - 1)} aria-label="Previous image">
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="gallery__nav gallery__nav--next" onClick={() => go(index + 1)} aria-label="Next image">
              <ChevronRight size={18} />
            </button>
            <div className="gallery__dots" aria-hidden="true">
              {images.map((k, i) => (
                <span key={`${k}-${i}`} className={i === index ? 'is-active' : ''} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
