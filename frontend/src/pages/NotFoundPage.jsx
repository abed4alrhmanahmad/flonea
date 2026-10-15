import { Link } from 'react-router-dom'
import Img from '../components/ui/Img.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import '../styles/pages.css'

export default function NotFoundPage({ title = 'This page has drifted off to sleep' }) {
  useDocumentTitle('Page not found')
  return (
    <div className="container not-found">
      <div className="not-found__text">
        <p className="eyebrow">Error 404</p>
        <h1>{title}</h1>
        <p className="muted">The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you somewhere comfortable.</p>
        <div className="not-found__actions">
          <Link to="/" className="btn">Back to Homepage</Link>
          <Link to="/shop" className="btn btn--outline">Shop Bedding</Link>
        </div>
      </div>
      <Img name="pillowSoft" alt="" ratio="4 / 5" sizes="(max-width: 800px) 100vw, 40vw" className="not-found__img" />
    </div>
  )
}
