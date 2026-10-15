import { Link } from 'react-router-dom'
import NewsletterForm from '../ui/NewsletterForm.jsx'
import SocialIcons from '../ui/SocialIcons.jsx'
import Logo from './Logo.jsx'

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      ['/collections/duvet-covers', 'Duvet Covers'],
      ['/collections/pillows', 'Pillows & Pillowcases'],
      ['/collections/bedding-sets', 'Bedding Sets'],
      ['/bedding-sets/builder', 'Build a Set'],
      ['/shop', 'Shop All'],
    ],
  },
  {
    title: 'About',
    links: [
      ['/about', 'Our Story'],
      ['/about#materials', 'Materials'],
      ['/help/care', 'Care Guide'],
    ],
  },
  {
    title: 'Customer Care',
    links: [
      ['/help/shipping-returns', 'Shipping & Returns'],
      ['/help/faq', 'FAQ'],
      ['/help/contact', 'Contact'],
      ['/account', 'My Account'],
    ],
  },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo className="logo--footer" />
          <p>Skin friendly bedding &amp; pillow collection.</p>
          <SocialIcons />
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} className="footer__col" aria-label={col.title}>
            <h2 className="footer__title">{col.title}</h2>
            <ul role="list">
              {col.links.map(([to, label]) => (
                <li key={to}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="footer__col footer__news">
          <h2 className="footer__title">Join our newsletter</h2>
          <p>New collections, care tips and quiet offers — never more than twice a month.</p>
          <NewsletterForm variant="footer" />
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>© {new Date().getFullYear()} FLONEA. All rights reserved. Demo storefront — no real orders or payments.</p>
          <ul role="list">
            <li><Link to="/help/privacy">Privacy Policy</Link></li>
            <li><Link to="/help/terms">Terms &amp; Conditions</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
