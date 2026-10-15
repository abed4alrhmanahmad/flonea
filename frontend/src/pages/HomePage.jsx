import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Feather, Leaf, Quote, WashingMachine, Wind } from 'lucide-react'
import Img from '../components/ui/Img.jsx'
import ProductGrid from '../components/product/ProductGrid.jsx'
import NewsletterForm from '../components/ui/NewsletterForm.jsx'
import Rating from '../components/ui/Rating.jsx'
import { PRODUCTS } from '../data/products.js'
import { COLORS, COLLECTIONS } from '../data/catalog.js'
import { BENEFITS, SAMPLE_REVIEWS } from '../data/content.js'
import { SET_BUILDER } from '../data/setBuilder.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import '../styles/home.css'

const BENEFIT_ICONS = { Leaf, Wind, Feather, WashingMachine }

const SLIDES = [
  {
    image: 'hero',
    eyebrow: 'Skin friendly bedding',
    title: ['Comfort Your Skin.', 'Elevate Your Sleep.'],
    text: 'Premium bedding and pillow collections in carefully selected natural fabrics, made with sensitive skin in mind.',
    primary: { to: '/shop', label: 'Shop Bedding' },
    secondary: { to: '/collections/bedding-sets', label: 'Explore Sets' },
  },
  {
    image: 'sageHeadboard',
    eyebrow: 'Bedding Set Builder',
    title: ['Create Your', 'Perfect Set.'],
    text: 'Match your duvet cover, pillowcases and pillows in one fabric and colour — and save on the full set.',
    primary: { to: '/bedding-sets/builder', label: 'Build a Set' },
    secondary: { to: '/collections/bedding-sets', label: 'Ready-made Sets' },
  },
  {
    image: 'goldSilk',
    eyebrow: 'New arrivals',
    title: ['Quietly Luminous.', 'Softly Silk.'],
    text: 'Our new Silk Blend Duvet Cover and Mulberry Silk Pillowcases, in Champagne, Beige and White.',
    primary: { to: '/products/silk-blend-duvet-cover', label: 'Discover Silk' },
    secondary: { to: '/shop?sort=newest', label: 'All New Arrivals' },
  },
]

function Hero() {
  const [index, setIndex] = useState(0)
  const go = (i) => setIndex((i + SLIDES.length) % SLIDES.length)
  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Featured">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.image}
          className={`hero__slide ${i === index ? 'is-active' : ''}`}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${SLIDES.length}`}
          aria-hidden={i !== index}
          inert={i !== index ? true : undefined}
        >
          <Img name={slide.image} sizes="100vw" priority={i === 0} className="hero__img" />
          <div className="hero__overlay" />
          <div className="container hero__content">
            <p className="eyebrow eyebrow--light">{slide.eyebrow}</p>
            {i === 0 ? (
              <h1 className="hero__title">
                {slide.title[0]} <br />
                {slide.title[1]}
              </h1>
            ) : (
              <h2 className="hero__title">
                {slide.title[0]} <br />
                {slide.title[1]}
              </h2>
            )}
            <p className="hero__text">{slide.text}</p>
            <div className="hero__ctas">
              <Link to={slide.primary.to} className="btn">
                {slide.primary.label}
              </Link>
              <Link to={slide.secondary.to} className="btn btn--ghost-light">
                {slide.secondary.label}
              </Link>
            </div>
          </div>
        </div>
      ))}
      <div className="hero__controls">
        <button type="button" className="hero__arrow" onClick={() => go(index - 1)} aria-label="Previous slide">
          <ChevronLeft size={18} />
        </button>
        <div className="hero__dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.image}
              type="button"
              className={`hero__dot ${i === index ? 'is-active' : ''}`}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <button type="button" className="hero__arrow" onClick={() => go(index + 1)} aria-label="Next slide">
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  )
}

const CATEGORY_CARDS = [
  { ...COLLECTIONS['duvet-covers'], name: 'Duvet Covers', blurb: 'Soft & breathable', image: 'duvetSage1' },
  { ...COLLECTIONS.pillows, name: 'Pillows', blurb: 'Supportive & gentle', image: 'pillowPair' },
  { ...COLLECTIONS['bedding-sets'], name: 'Bedding Sets', blurb: 'Complete your sleep space', image: 'duvetWhite3' },
]

const TABS = [
  { id: 'best', label: 'Best Sellers', filter: (p) => p.bestSeller, link: '/shop' },
  { id: 'new', label: 'New Arrivals', filter: (p) => p.isNew, link: '/shop?sort=newest' },
  { id: 'featured', label: 'Featured', filter: (p) => p.featured, link: '/shop' },
]

function PopularCollections() {
  const [tab, setTab] = useState('best')
  const active = TABS.find((t) => t.id === tab)
  const products = useMemo(() => PRODUCTS.filter(active.filter).slice(0, 4), [active])
  return (
    <section className="section" aria-labelledby="popular-title">
      <div className="container">
        <div className="section-head">
          <div>
            <h2 id="popular-title">Popular Collections</h2>
            <div className="text-tabs" role="tablist" aria-label="Product groups">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  aria-controls="popular-panel"
                  className={`text-tabs__tab ${tab === t.id ? 'is-active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <Link to={active.link} className="link-arrow">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div id="popular-panel" role="tabpanel" aria-label={active.label}>
          <ProductGrid products={products} />
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  useDocumentTitle(null)
  const builderDiscount = SET_BUILDER.fullSet.discountPercent
  return (
    <>
      <Hero />

      <section className="section" aria-labelledby="cat-title">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 id="cat-title">Shop by Category</h2>
              <p>Find your perfect comfort.</p>
            </div>
          </div>
          <ul className="category-grid" role="list">
            {CATEGORY_CARDS.map((c) => (
              <li key={c.id}>
                <Link to={`/collections/${c.id}`} className="category-card">
                  <Img name={c.image} alt="" ratio="4 / 3" sizes="(max-width: 700px) 100vw, 33vw" />
                  <span className="category-card__body">
                    <span className="category-card__name">{c.name}</span>
                    <span className="category-card__blurb">{c.blurb}</span>
                  </span>
                  <ArrowRight size={16} className="category-card__arrow" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <PopularCollections />

      <section className="materials-band" aria-labelledby="materials-title">
        <Img name="creamLinen" alt="" sizes="100vw" className="materials-band__bg" />
        <div className="container materials-band__inner">
          <h2 id="materials-title">
            Thoughtfully Selected Materials <br />
            for Sensitive Skin
          </h2>
          <ul className="benefits" role="list">
            {BENEFITS.map((b) => {
              const Icon = BENEFIT_ICONS[b.icon]
              return (
                <li key={b.title} className="benefit">
                  <span className="benefit__icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.4} />
                  </span>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="color-title">
        <div className="container">
          <div className="section-head">
            <h2 id="color-title">Shop by Color</h2>
            <Link to="/shop" className="link-arrow">
              View All Colors <ArrowRight size={14} />
            </Link>
          </div>
          <ul className="color-row" role="list">
            {Object.values(COLORS).map((c) => (
              <li key={c.id}>
                <Link to={`/shop?color=${c.id}`} className="color-chip">
                  <span className="color-chip__dot" style={{ '--swatch': c.hex }} aria-hidden="true" />
                  <span>{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--beige" aria-labelledby="builder-title">
        <div className="container builder-promo">
          <div className="builder-promo__media">
            <Img name="duvetSage2" alt="" ratio="4 / 3" sizes="(max-width: 900px) 100vw, 50vw" />
          </div>
          <div className="builder-promo__text">
            <p className="eyebrow">Bedding Set Builder</p>
            <h2 id="builder-title">Create Your Perfect Set</h2>
            <p>
              Choose your bed size, fabric and colour once — we&apos;ll match the duvet cover, pillowcases and pillows for you. Build a full set
              (duvet cover + pillowcases) and save {builderDiscount}%, or pick individual items at their regular price.
            </p>
            <ul className="tick-list" role="list">
              <li>Thoughtfully matched pieces</li>
              <li>{builderDiscount}% saving on full sets</li>
              <li>Only compatible sizes &amp; colours offered</li>
            </ul>
            <Link to="/bedding-sets/builder" className="btn">
              Start Building
            </Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="story-title">
        <div className="container story">
          <Img name="sleeping" alt="Woman resting on soft neutral pillows" ratio="16 / 11" sizes="(max-width: 900px) 100vw, 50vw" className="story__img" />
          <div className="story__text">
            <h2 id="story-title">
              Better Materials. <br />
              Softer on Skin. Calmer Sleep.
            </h2>
            <p>
              Every FLONEA piece starts with the fabric. We choose smooth, breathable weaves — organic cotton, stonewashed linen, bamboo
              lyocell and mulberry silk — and finish them softly, so your bed feels calm from the very first night.
            </p>
            <Link to="/about" className="btn btn--outline">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--beige" aria-labelledby="reviews-title">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 id="reviews-title">Kind Words</h2>
              <p>Sample reviews shown for demonstration purposes.</p>
            </div>
          </div>
          <ul className="reviews" role="list">
            {SAMPLE_REVIEWS.map((r) => (
              <li key={r.id} className="review">
                <Quote size={22} className="review__quote" aria-hidden="true" />
                <Rating value={r.rating} showLabel={false} />
                <blockquote>
                  <p>{r.text}</p>
                </blockquote>
                <p className="review__by">
                  <strong>{r.name}</strong>, {r.location}
                  <span className="review__product">on {r.product}</span>
                </p>
                <span className="badge badge--outline review__demo">Sample review</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section newsletter-band" aria-labelledby="news-title">
        <div className="container newsletter-band__inner">
          <div>
            <h2 id="news-title">Rest well, hear first.</h2>
            <p>Join the FLONEA newsletter for new collections, fabric care tips and early access to quiet offers.</p>
          </div>
          <NewsletterForm buttonLabel="Subscribe" />
        </div>
      </section>
    </>
  )
}
