import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ANNOUNCEMENTS } from '../../data/content.js'

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0)
  const item = ANNOUNCEMENTS[index]
  const go = (d) => setIndex((i) => (i + d + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length)

  return (
    <div className="announcement" role="region" aria-label="Announcements">
      <div className="container announcement__inner">
        <button type="button" className="announcement__nav" onClick={() => go(-1)} aria-label="Previous announcement">
          <ChevronLeft size={14} />
        </button>
        <p aria-live="polite">
          {item.text}
          <span className="announcement__sep" aria-hidden="true">|</span>
          <Link to={item.link.to}>{item.link.label}</Link>
        </p>
        <button type="button" className="announcement__nav" onClick={() => go(1)} aria-label="Next announcement">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
