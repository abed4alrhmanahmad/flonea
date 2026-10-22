import { useState } from 'react'
import { ImagePlus } from 'lucide-react'
import Img from '../../components/ui/Img.jsx'
import { getImage } from '../../data/images.js'
import { ImageLibraryDialog } from './ImagePicker.jsx'
import { ReorderButtons } from './ui.jsx'
import { moveItem, removeAt } from '../lib/listUtils.js'

/**
 * Ordered image gallery editor. The first image is the main one (used on product cards).
 * With `alts`/`onAltsChange`, each image gets its own alt text field.
 */
export default function ImageListEditor({ images, onChange, alts, onAltsChange, label = 'Images', emptyHint }) {
  const [open, setOpen] = useState(false)
  const add = (ref) => {
    if (!images.includes(ref)) onChange([...images, ref])
    setOpen(false)
  }
  return (
    <div className="adm-stack" style={{ gap: 'var(--space-2)' }}>
      <ul className="adm-images" role="list" aria-label={label}>
        {images.map((ref, i) => (
          <li key={ref} className="adm-image-item">
            <Img name={ref} alt="" ratio="1 / 1" sizes="170px" />
            <div className="adm-image-item__bar">
              <span className="adm-image-item__badge">{i === 0 ? 'Main image' : `#${i + 1}`}</span>
              <ReorderButtons index={i} count={images.length} label={`image ${i + 1}`} onMove={(from, to) => onChange(moveItem(images, from, to))} onRemove={(index) => onChange(removeAt(images, index))} />
            </div>
            <code className="adm-code" title={ref}>
              {ref.length > 34 ? `${ref.slice(0, 32)}…` : ref}
            </code>
            {onAltsChange && (
              <label className="adm-field">
                <span className="adm-field__hint">Alt text</span>
                <input className="input" value={alts?.[ref] ?? ''} placeholder={getImage(ref).alt || 'Describe the image'} onChange={(e) => onAltsChange({ ...alts, [ref]: e.target.value })} />
              </label>
            )}
          </li>
        ))}
        <li>
          <button type="button" className="adm-image-add" onClick={() => setOpen(true)}>
            <ImagePlus size={22} aria-hidden="true" />
            Add image
          </button>
        </li>
      </ul>
      {!images.length && emptyHint && <p className="adm-field__hint">{emptyHint}</p>}
      <ImageLibraryDialog open={open} onClose={() => setOpen(false)} onSelect={add} title={`${label}: add an image`} />
    </div>
  )
}
