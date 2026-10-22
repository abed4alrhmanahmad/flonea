import { useToast } from '../../context/ToastContext.jsx'
import { useSettings } from '../../store/hooks.js'
import { isHttpsUrl } from '../../lib/links.js'

const ICONS = {
  Instagram: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M14 8h2.5V4.5H14c-2.5 0-4 1.6-4 4.1V11H7.5v3.5H10V21h3.5v-6.5H16l.5-3.5h-3V8.8c0-.5.3-.8.5-.8Z" />
    </svg>
  ),
  Pinterest: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M11 9.5c.4-1.5 3.8-1.6 4 .8.2 2.4-1.6 4.4-3.3 3.6M11.5 10l-2 9" strokeLinecap="round" />
    </svg>
  ),
}

/**
 * Social links from Admin → Settings. Channels without a link aren't live yet, so their icons explain
 * that instead of linking to someone else's page.
 */
export default function SocialIcons() {
  const { notify } = useToast()
  const { social, storeName } = useSettings()
  return (
    <ul className="social" role="list">
      {Object.entries(ICONS).map(([name, icon]) => (
        <li key={name}>
          {isHttpsUrl(social[name.toLowerCase()]) ? (
            <a className="social__btn" href={social[name.toLowerCase()].trim()} target="_blank" rel="noopener noreferrer" aria-label={`${storeName} on ${name} (opens in a new tab)`}>
              {icon}
            </a>
          ) : (
            <button
              type="button"
              className="social__btn"
              aria-label={`${storeName} on ${name} (coming soon)`}
              onClick={() => notify({ tone: 'info', title: `${storeName} on ${name}`, message: 'Our social channels launch soon — join the newsletter to hear first.' })}
            >
              {icon}
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
