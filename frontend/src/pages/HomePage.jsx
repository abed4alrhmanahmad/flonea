import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Feather, Heart, Leaf, Moon, Quote, Sparkles, Sun, WashingMachine, Wind } from 'lucide-react'
import Img from '../components/ui/Img.jsx'
import ProductGrid from '../components/product/ProductGrid.jsx'
import NewsletterForm from '../components/ui/NewsletterForm.jsx'
import Rating from '../components/ui/Rating.jsx'
import { useCatalog, useContent } from '../store/hooks.js'
import { safePath } from '../lib/links.js'
import { orderedByFlag } from '../lib/merchandising.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import '../styles/home.css'

const BENEFIT_ICONS = { Leaf, Wind, Feather, WashingMachine, Sparkles, Heart, Moon, Sun }

function Hero({ slides }) {
  const [index, setIndex] = useState(0)
  const current = index % slides.length
  const go = (i) => setIndex((i + slides.length) % slides.length)
  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Featured">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`hero__slide ${i === current ? 'is-active' : ''}`}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${slides.length}`}
          aria-hidden={i !== current}
          inert={i !== current ? true : undefined}
        >
          <Img name={slide.image} alt="" sizes="100vw" priority={i === 0} className="hero__img" />
          <div className="hero__overlay" />
          <div className="container hero__content">
            {slide.eyebrow && <p className="eyebrow eyebrow--light">{slide.eyebrow}</p>}
            {i === 0 ? (
              <h1 className="hero__title">
                {slide.title1} <br />
                {slide.title2}
              </h1>
            ) : (
              <h2 className="hero__title">
                {slide.title1} <br />
                {slide.title2}
              </h2>
            )}
            {slide.text && <p className="hero__text">{slide.text}</p>}
            <div className="hero__ctas">
              {slide.primaryLabel && (
                <Link to={safePath(slide.primaryTo)} className="btn">
                  {slide.primaryLabel}
                </Link>
              )}
              {slide.secondaryLabel && (
                <Link to={safePath(slide.secondaryTo)} className="btn btn--ghost-light">
                  {slide.secondaryLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
      {slides.length > 1 && (
        <div className="hero__controls">
          <button type="button" className="hero__arrow" onClick={() => go(current - 1)} aria-label="Previous slide">
            <ChevronLeft size={18} />
          </button>
          <div className="hero__dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`hero__dot ${i === current ? 'is-active' : ''}`}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === current}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <button type="button" className="hero__arrow" onClick={() => go(current + 1)} aria-label="Next slide">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </section>
  )
}

function PopularCollections({ section, products }) {
  const tabs = section.tabs.filter((t) => t.enabled)
  const [tab, setTab] = useState(tabs[0]?.id)
  const active = tabs.find((t) => t.id === tab) ?? tabs[0]
  const limit = Math.min(Math.max(1, section.limit || 4), 12)
  const shown = active ? orderedByFlag(products, active.flag, active.order).slice(0, limit) : []
  if (!active) return null
  return (
    <section className="section" aria-labelledby="popular-title">
      <div className="container">
        <div className="section-head">
          <div>
            <h2 id="popular-title">{section.heading}</h2>
            <div className="text-tabs" role="tablist" aria-label="Product groups">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active.id === t.id}
                  aria-controls="popular-panel"
                  className={`text-tabs__tab ${active.id === t.id ? 'is-active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <Link to={safePath(active.link, '/shop')} className="link-arrow">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div id="popular-panel" role="tabpanel" aria-label={active.label}>
          {shown.length ? <ProductGrid products={shown} /> : <p className="muted">New pieces are on their way.</p>}
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  useDocumentTitle(null)
  const { home } = useContent()
  const { products, collectionsById } = useCatalog()
  const slides = home.hero.slides.filter((s) => s.enabled)
  const cards = home.categories.cards.filter((c) => c.enabled && collectionsById[c.collectionId]?.enabled)
  const chips = home.colors.chips.filter((c) => c.enabled && c.colorId)
  const reviews = home.testimonials.items.filter((r) => r.enabled && r.text.trim())

  return (
    <>
      {home.hero.enabled && slides.length > 0 && <Hero slides={slides} />}

      {home.categories.enabled && cards.length > 0 && (
        <section className="section" aria-labelledby="cat-title">
          <div className="container">
            <div className="section-head">
              <div>
                <h2 id="cat-title">{home.categories.heading}</h2>
                {home.categories.subheading && <p>{home.categories.subheading}</p>}
              </div>
            </div>
            <ul className="category-grid" role="list">
              {cards.map((c) => (
                <li key={c.id}>
                  <Link to={`/collections/${c.collectionId}`} className="category-card">
                    <Img name={c.image || collectionsById[c.collectionId].image} alt="" ratio="4 / 3" sizes="(max-width: 700px) 100vw, 33vw" />
                    <span className="category-card__body">
                      <span className="category-card__name">{c.name || collectionsById[c.collectionId].title}</span>
                      <span className="category-card__blurb">{c.blurb}</span>
                    </span>
                    <ArrowRight size={16} className="category-card__arrow" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {home.popular.enabled && <PopularCollections section={home.popular} products={products} />}

      {home.materials.enabled && (
        <section className="materials-band" aria-labelledby="materials-title">
          <Img name={home.materials.image} alt="" sizes="100vw" className="materials-band__bg" />
          <div className="container materials-band__inner">
            <h2 id="materials-title">
              {home.materials.heading1} <br />
              {home.materials.heading2}
            </h2>
            <ul className="benefits" role="list">
              {home.materials.benefits.map((b) => {
                const Icon = BENEFIT_ICONS[b.icon] ?? Leaf
                return (
                  <li key={b.id} className="benefit">
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
      )}

      {home.colors.enabled && chips.length > 0 && (
        <section className="section" aria-labelledby="color-title">
          <div className="container">
            <div className="section-head">
              <h2 id="color-title">{home.colors.heading}</h2>
              {home.colors.linkLabel && (
                <Link to="/shop" className="link-arrow">
                  {home.colors.linkLabel} <ArrowRight size={14} />
                </Link>
              )}
            </div>
            <ul className="color-row" role="list">
              {chips.map((c) => {
                const base = c.collectionId && collectionsById[c.collectionId]?.enabled ? `/collections/${c.collectionId}` : '/shop'
                return (
                  <li key={c.id}>
                    <Link to={`${base}?color=${encodeURIComponent(c.colorId)}`} className="color-chip">
                      <span className="color-chip__dot" style={{ '--swatch': c.hex }} aria-hidden="true" />
                      <span>{c.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      {home.builder.enabled && (
        <section className="section section--beige" aria-labelledby="builder-title">
          <div className="container builder-promo">
            <div className="builder-promo__media">
              <Img name={home.builder.image} alt="" ratio="4 / 3" sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
            <div className="builder-promo__text">
              {home.builder.eyebrow && <p className="eyebrow">{home.builder.eyebrow}</p>}
              <h2 id="builder-title">{home.builder.heading}</h2>
              <p>{home.builder.text}</p>
              {home.builder.bullets.some((b) => b.trim()) && (
                <ul className="tick-list" role="list">
                  {home.builder.bullets
                    .filter((b) => b.trim())
                    .map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                </ul>
              )}
              <Link to="/bedding-sets/builder" className="btn">
                {home.builder.buttonLabel || 'Start Building'}
              </Link>
            </div>
          </div>
        </section>
      )}

      {home.story.enabled && (
        <section className="section" aria-labelledby="story-title">
          <div className="container story">
            <Img name={home.story.image} alt={home.story.imageAlt} ratio="16 / 11" sizes="(max-width: 900px) 100vw, 50vw" className="story__img" />
            <div className="story__text">
              <h2 id="story-title">
                {home.story.heading1} <br />
                {home.story.heading2}
              </h2>
              <p>{home.story.text}</p>
              {home.story.buttonLabel && (
                <Link to={safePath(home.story.buttonTo, '/about')} className="btn btn--outline">
                  {home.story.buttonLabel}
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {home.testimonials.enabled && reviews.length > 0 && (
        <section className="section section--beige" aria-labelledby="reviews-title">
          <div className="container">
            <div className="section-head">
              <div>
                <h2 id="reviews-title">{home.testimonials.heading}</h2>
                <p>{home.testimonials.note || 'Sample reviews shown for demonstration purposes.'}</p>
              </div>
            </div>
            <ul className="reviews" role="list">
              {reviews.map((r) => (
                <li key={r.id} className="review">
                  <Quote size={22} className="review__quote" aria-hidden="true" />
                  <Rating value={Math.min(5, Math.max(0, r.rating))} showLabel={false} />
                  <blockquote>
                    <p>{r.text}</p>
                  </blockquote>
                  <p className="review__by">
                    <strong>{r.name}</strong>
                    {r.location && `, ${r.location}`}
                    {r.product && <span className="review__product">on {r.product}</span>}
                  </p>
                  {/* Testimonials are demo content and always say so. */}
                  <span className="badge badge--outline review__demo">Sample review</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {home.newsletter.enabled && (
        <section className="section newsletter-band" aria-labelledby="news-title">
          <div className="container newsletter-band__inner">
            <div>
              <h2 id="news-title">{home.newsletter.heading}</h2>
              <p>{home.newsletter.text}</p>
            </div>
            <NewsletterForm buttonLabel={home.newsletter.buttonLabel || 'Subscribe'} />
          </div>
        </section>
      )}
    </>
  )
}
