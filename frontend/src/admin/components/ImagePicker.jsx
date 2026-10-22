import { useId, useState } from 'react'
import { ImagePlus, Link2 } from 'lucide-react'
import Drawer from '../../components/ui/Drawer.jsx'
import Img from '../../components/ui/Img.jsx'
import { IMAGE_KEYS, IMAGE_SOURCES, isImageRef, isImageUrl } from '../../data/images.js'

/**
 * Chooses an image from the photo library (public/images) or by URL (https://… or /site/path).
 * Image files are not uploaded or stored in the browser — only the reference is saved.
 */
export function ImageLibraryDialog({ open, onClose, onSelect, title = 'Choose an image', current }) {
  const [query, setQuery] = useState('')
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const urlId = useId()
  const keys = IMAGE_KEYS.filter((k) => !query.trim() || `${k} ${IMAGE_SOURCES[k].alt}`.toLowerCase().includes(query.trim().toLowerCase()))

  const submitUrl = (e) => {
    e.preventDefault()
    if (!isImageUrl(url)) {
      setUrlError('Enter an https:// image address or a site path starting with “/”.')
      return
    }
    onSelect(url.trim())
    setUrl('')
    setUrlError('')
  }

  return (
    <Drawer open={open} onClose={onClose} title={title} side="center" className="adm-image-dialog">
      <div className="adm-image-dialog__tools">
        <label className="visually-hidden" htmlFor={`${urlId}-q`}>
          Filter images
        </label>
        <input id={`${urlId}-q`} className="input" type="search" placeholder="Filter the photo library (e.g. sage, pillow, linen)" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <ul className="adm-image-grid" role="list">
        {keys.map((key) => (
          <li key={key}>
            <button type="button" className={`adm-image-option ${current === key ? 'is-selected' : ''}`} onClick={() => onSelect(key)} aria-pressed={current === key} title={IMAGE_SOURCES[key].alt}>
              <Img name={key} alt="" ratio="1 / 1" sizes="140px" />
              <span className="adm-image-option__key">{key}</span>
            </button>
          </li>
        ))}
        {!keys.length && <li className="muted">No library images match “{query}”.</li>}
      </ul>
      <form className="adm-image-dialog__url" onSubmit={submitUrl} noValidate>
        <label htmlFor={urlId} className="adm-field__label">
          <Link2 size={14} aria-hidden="true" /> Or use an image URL
        </label>
        <div className="adm-inline">
          <input
            id={urlId}
            className="input"
            placeholder="https://example.com/photo.jpg or /images/my-photo.jpg"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setUrlError('')
            }}
            aria-invalid={Boolean(urlError) || undefined}
            aria-describedby={`${urlId}-hint`}
          />
          <button type="submit" className="btn btn--sm">
            Use URL
          </button>
        </div>
        <span id={`${urlId}-hint`} className={urlError ? 'adm-field__error' : 'adm-field__hint'}>
          {urlError || 'External images must allow hot-linking. Nothing is uploaded — only the address is saved.'}
        </span>
      </form>
    </Drawer>
  )
}

/** A single image field: preview + change / clear. */
export default function ImagePicker({ label, value, onChange, hint, error, allowEmpty = false }) {
  const [open, setOpen] = useState(false)
  const valid = isImageRef(value)
  return (
    <div className={`adm-field adm-image-field ${error ? 'has-error' : ''}`}>
      <span className="adm-field__label">{label}</span>
      <div className="adm-image-field__row">
        <span className="adm-image-field__preview">{valid ? <Img name={value} alt="" ratio="4 / 3" sizes="160px" /> : <span className="adm-image-field__empty">No image</span>}</span>
        <span className="adm-image-field__meta">
          <code className="adm-code">{value || '—'}</code>
          <span className="adm-inline">
            <button type="button" className="btn btn--light btn--sm" onClick={() => setOpen(true)}>
              <ImagePlus size={14} aria-hidden="true" /> {value ? 'Change image' : 'Choose image'}
            </button>
            {allowEmpty && value && (
              <button type="button" className="text-btn" onClick={() => onChange('')}>
                Remove
              </button>
            )}
          </span>
        </span>
      </div>
      {hint && !error && <span className="adm-field__hint">{hint}</span>}
      {error && <span className="adm-field__error">{error}</span>}
      <ImageLibraryDialog
        open={open}
        current={value}
        title={`${label}: choose an image`}
        onClose={() => setOpen(false)}
        onSelect={(ref) => {
          onChange(ref)
          setOpen(false)
        }}
      />
    </div>
  )
}
