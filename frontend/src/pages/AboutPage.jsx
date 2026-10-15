import { Link } from 'react-router-dom'
import Img from '../components/ui/Img.jsx'
import { MATERIALS } from '../data/catalog.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import '../styles/pages.css'

const PRINCIPLES = [
  { title: 'Fabric first', text: 'Every design starts with how a fabric feels against skin. We favour smooth, breathable weaves and soft, pre-washed finishes.' },
  { title: 'Quiet design', text: 'A restrained palette — white, beige, taupe, champagne and forest green — so your bedroom feels calm and pieces mix easily.' },
  { title: 'Made to last', text: 'Considered construction: hidden closures, corner ties and fabrics that soften with every wash rather than wearing out.' },
]

const FEATURED_MATERIALS = ['organic-cotton', 'linen', 'bamboo', 'mulberry-silk']

export default function AboutPage() {
  useDocumentTitle('About')
  return (
    <div className="about">
      <section className="about-hero">
        <Img name="heroRoom" alt="" sizes="100vw" priority className="about-hero__img" />
        <div className="about-hero__overlay" />
        <div className="container about-hero__content">
          <p className="eyebrow eyebrow--light">Our story</p>
          <h1>Bedding that begins with how it feels.</h1>
        </div>
      </section>

      <section className="section">
        <div className="container about-intro">
          <h2>Soft luxury, natural comfort.</h2>
          <div>
            <p>
              FLONEA was created around a simple idea: the things that touch your skin for eight hours a night deserve careful thought. We design
              duvet covers, pillowcases, pillows and complete bedding sets in a small number of well-chosen fabrics, and we keep everything else
              quiet and considered.
            </p>
            <p>
              We are especially mindful of people with sensitive skin. That doesn&apos;t mean making medical promises — everyone&apos;s skin is
              different — it means choosing smooth, breathable materials, soft finishes and clear fabric information, so you can decide what feels
              right for you.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--beige">
        <div className="container editorial">
          <Img name="foldedLinen" alt="Folded linens in green and natural tones" ratio="4 / 5" sizes="(max-width: 900px) 100vw, 45vw" />
          <div className="editorial__text">
            <p className="eyebrow">Design philosophy</p>
            <h2>Fewer, better things.</h2>
            <ul className="principles" role="list">
              {PRINCIPLES.map((p, i) => (
                <li key={p.title}>
                  <span className="principles__num">0{i + 1}</span>
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
                <Img name={['creamLinen', 'taupeLinen', 'duvetWhite2', 'goldSilk'][i]} alt="" ratio="4 / 3" sizes="(max-width: 700px) 100vw, 25vw" />
                <h3>{MATERIALS[id].name}</h3>
                <p>{MATERIALS[id].description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--beige">
        <div className="container editorial editorial--reverse">
          <Img name="sleeping" alt="Woman resting on soft neutral pillows" ratio="4 / 3" sizes="(max-width: 900px) 100vw, 50vw" />
          <div className="editorial__text">
            <p className="eyebrow">Our approach to comfort</p>
            <h2>Care in every detail.</h2>
            <p>
              From the first stitch to the final touch, every piece is designed for how you actually sleep: covers that stay in place, pillowcases
              that close neatly, sets matched in size and colour, and care guidance that keeps natural fabrics soft for years.
            </p>
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
