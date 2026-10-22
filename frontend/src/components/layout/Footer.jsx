import { Link } from 'react-router-dom'
import NewsletterForm from '../ui/NewsletterForm.jsx'
import SocialIcons from '../ui/SocialIcons.jsx'
import Logo from './Logo.jsx'
import { useContent, useSettings } from '../../store/hooks.js'
import { safePath } from '../../lib/links.js'

export default function Footer() {
  const { footer } = useContent()
  const { storeName, contact } = useSettings()
  const showContact = footer.showContact && (contact.email || contact.phone)

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo className="logo--footer" />
          {footer.tagline && <p>{footer.tagline}</p>}
          {showContact && (
            <p className="footer__contact">
              {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
              {contact.email && contact.phone && <br />}
              {contact.phone && <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}>{contact.phone}</a>}
            </p>
          )}
          <SocialIcons />
        </div>
        {footer.columns.map((col) => (
          <nav key={col.id} className="footer__col" aria-label={col.title}>
            <h2 className="footer__title">{col.title}</h2>
            <ul role="list">
              {col.links
                .filter((l) => l.label.trim())
                .map((l) => (
                  <li key={l.id}>
                    <Link to={safePath(l.to)}>{l.label}</Link>
                  </li>
                ))}
            </ul>
          </nav>
        ))}
        <div className="footer__col footer__news">
          <h2 className="footer__title">{footer.newsletterHeading}</h2>
          <p>{footer.newsletterText}</p>
          <NewsletterForm variant="footer" />
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>
            © {new Date().getFullYear()} {storeName}. {footer.bottomNote}
          </p>
          <ul role="list">
            <li><Link to="/help/privacy">Privacy Policy</Link></li>
            <li><Link to="/help/terms">Terms &amp; Conditions</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
