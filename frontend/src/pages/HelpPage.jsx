import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx'
import Accordion, { AccordionItem } from '../components/ui/Accordion.jsx'
import { HELP_PAGES } from '../data/content.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import NotFoundPage from './NotFoundPage.jsx'
import '../styles/pages.css'

export default function HelpPage() {
  const { topic } = useParams()
  const page = HELP_PAGES[topic]
  useDocumentTitle(page?.title ?? 'Help')
  if (!page) return <NotFoundPage />

  return (
    <div className="container page help">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Help' }, { label: page.title }]} />
      <header className="page__head">
        <h1>{page.title}</h1>
        <p className="muted">{page.intro}</p>
      </header>
      <div className="help__layout">
        <nav className="help__nav" aria-label="Help topics">
          <ul role="list">
            {Object.entries(HELP_PAGES).map(([id, p]) => (
              <li key={id}>
                <Link to={`/help/${id}`} className={id === topic ? 'is-active' : ''} aria-current={id === topic ? 'page' : undefined}>
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Accordion className="help__content">
          {page.sections.map(([title, text], i) => (
            <AccordionItem key={title} title={title} defaultOpen={i === 0 || page.sections.length <= 3}>
              <p>{text}</p>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
