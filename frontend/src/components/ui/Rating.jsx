import { Star } from 'lucide-react'

export default function Rating({ value, count, size = 14, showLabel = true }) {
  const rounded = Math.round(value * 2) / 2
  return (
    <span className="rating" aria-label={`Rated ${value} out of 5${count ? `, ${count} sample reviews` : ''}`}>
      <span className="rating__stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} className={i <= rounded ? 'is-full' : i - 0.5 === rounded ? 'is-half' : ''} />
        ))}
      </span>
      {showLabel && count != null && (
        <span className="rating__count" aria-hidden="true">
          {value.toFixed(1)} ({count})
        </span>
      )}
    </span>
  )
}
