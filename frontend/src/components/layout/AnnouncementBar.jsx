import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useContent } from '../../store/hooks.js'
import { safePath } from '../../lib/links.js'

export default function AnnouncementBar() {
  const { announcement } = useContent()
  const [index, setIndex] = useState(0)
  const items = announcement.items.filter((a) => a.enabled && a.text.trim())
  if (!announcement.enabled || !items.length) return null
  const item = items[index % items.length]
  const go = (d) => setIndex((i) => (((i + d) % items.length) + items.length) % items.length)

  return (
    <div className="announcement" role="region" aria-label="Announcements">
      <div className="container announcement__inner">
        {items.length > 1 && (
          <button type="button" className="announcement__nav" onClick={() => go(-1)} aria-label="Previous announcement">
            <ChevronLeft size={14} />
          </button>
        )}
        <p aria-live="polite">
          {item.text}
          {item.linkLabel && item.linkTo && (
            <>
              <span className="announcement__sep" aria-hidden="true">|</span>
              <Link to={safePath(item.linkTo)}>{item.linkLabel}</Link>
            </>
          )}
        </p>
        {items.length > 1 && (
          <button type="button" className="announcement__nav" onClick={() => go(1)} aria-label="Next announcement">
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
