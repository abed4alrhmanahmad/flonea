import { Link } from 'react-router-dom'
import Img from '../components/ui/Img.jsx'
import { MATERIALS } from '../data/catalog.js'
import { useContent } from '../store/hooks.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import '../styles/pages.css'

const FEATURED_MATERIALS = ['organic-cotton', 'linen', 'bamboo', 'mulberry-silk']
const MATERIAL_IMAGES = ['creamLinen', 'taupeLinen', 'duvetWhite2', 'goldSilk']

export default function AboutPage() {
  useDocumentTitle('About')
  const { about } = useContent()
  return (
    <div className="about">
      <section className="about-hero">
        <Img name={about.heroImage} alt="" sizes="100vw" priority className="about-hero__img" />
        <div className="about-hero__overlay" />
        <div className="container about-hero__content">
          {about.heroEyebrow && <p className="eyebrow eyebrow--light">{about.heroEyebrow}</p>}
          <h1>{about.heroTitle}</h1>
        </div>
      </section>

      <section className="section">
        <div className="container about-intro">
          <h2>{about.introHeading}</h2>
          <div>
            {about.introParagraphs
              .filter((p) => p.trim())
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </div>
        </div>
      </section>

      <section className="section section--beige">
        <div className="container editorial">
          <Img name={about.philosophyImage} ratio="4 / 5" sizes="(max-width: 900px) 100vw, 45vw" />
          <div className="editorial__text">
            {about.philosophyEyebrow && <p className="eyebrow">{about.philosophyEyebrow}</p>}
            <h2>{about.philosophyHeading}</h2>
            <ul className="principles" role="list">
              {about.principles.map((p, i) => (
                <li key={p.id}>
                  <span className="principles__num">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{p.title}</h3>
                    <p>{p.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="materials" aria-labelledby="mat-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Material selection</p>
              <h2 id="mat-title">Our fabrics</h2>
            </div>
          </div>
          <ul className="material-grid" role="list">
            {FEATURED_MATERIALS.map((id, i) => (
              <li key={id} className="material-tile">
                <Img name={MATERIAL_IMAGES[i]} alt="" ratio="4 / 3" sizes="(max-width: 700px) 100vw, 25vw" />
                <h3>{MATERIALS[id].name}</h3>
                <p>{MATERIALS[id].description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--beige">
        <div className="container editorial editorial--reverse">
          <Img name={about.approachImage} ratio="4 / 3" sizes="(max-width: 900px) 100vw, 50vw" />
          <div className="editorial__text">
            {about.approachEyebrow && <p className="eyebrow">{about.approachEyebrow}</p>}
            <h2>{about.approachHeading}</h2>
            <p>{about.approachText}</p>
            <div className="editorial__ctas">
              <Link to="/shop" className="btn">Shop the Collection</Link>
              <Link to="/help/care" className="btn btn--outline">Read the Care Guide</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
