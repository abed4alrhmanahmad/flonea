/**
 * Validation for the editable site content. Keys look like "<section>.<itemId>.<field>" so each
 * form field can show its own message.
 */
import { isImageRef } from '../../../data/images.js'
import { isHttpsUrl, isSitePath } from '../../../lib/links.js'
import { HEX_PATTERN } from '../../lib/productForm.js'

const PATH_MSG = 'Use a site path starting with “/”, e.g. /collections/pillows.'

export function validateContent(content) {
  const e = {}
  const path = (key, value, { required = false } = {}) => {
    if (!value?.trim()) {
      if (required) e[key] = 'Enter a link.'
      return
    }
    if (!isSitePath(value)) e[key] = PATH_MSG
  }
  const image = (key, value) => {
    if (!isImageRef(value)) e[key] = 'Choose an image from the library or enter a valid image URL.'
  }
  const text = (key, value, label, max = 300) => {
    if (!value?.trim()) e[key] = `Enter ${label}.`
    else if (value.length > max) e[key] = `Keep it under ${max} characters.`
  }

  // Announcement bar
  for (const a of content.announcement.items) {
    if (a.enabled) text(`announcement.${a.id}.text`, a.text, 'the announcement text', 140)
    if (a.linkLabel.trim() || a.linkTo.trim()) {
      if (!a.linkLabel.trim()) e[`announcement.${a.id}.linkLabel`] = 'Add a link label, or clear the link.'
      path(`announcement.${a.id}.linkTo`, a.linkTo, { required: true })
    }
  }

  // Hero
  const { home } = content
  if (home.hero.enabled && !home.hero.slides.some((s) => s.enabled)) e['hero.slides'] = 'Turn on at least one slide, or hide the hero section.'
  for (const s of home.hero.slides) {
    text(`hero.${s.id}.title1`, s.title1, 'the first headline line', 80)
    image(`hero.${s.id}.image`, s.image)
    if (s.primaryLabel.trim()) path(`hero.${s.id}.primaryTo`, s.primaryTo, { required: true })
    if (s.secondaryLabel.trim()) path(`hero.${s.id}.secondaryTo`, s.secondaryTo, { required: true })
  }

  // Homepage sections
  for (const c of home.categories.cards) {
    if (!c.collectionId) e[`categories.${c.id}.collectionId`] = 'Choose a collection.'
    if (c.image) image(`categories.${c.id}.image`, c.image)
  }
  text('popular.heading', home.popular.heading, 'a heading', 80)
  for (const t of home.popular.tabs) {
    text(`popular.${t.id}.label`, t.label, 'a label', 40)
    path(`popular.${t.id}.link`, t.link, { required: true })
  }
  image('materials.image', home.materials.image)
  for (const b of home.materials.benefits) text(`materials.${b.id}.title`, b.title, 'a title', 60)
  for (const c of home.colors.chips) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.colorId)) e[`colors.${c.id}.colorId`] = 'Use the colour’s id, e.g. sage.'
    text(`colors.${c.id}.name`, c.name, 'a name', 40)
    if (!HEX_PATTERN.test(c.hex)) e[`colors.${c.id}.hex`] = 'Enter a hex colour such as #4D644F.'
  }
  image('builder.image', home.builder.image)
  text('builder.heading', home.builder.heading, 'a heading', 80)
  image('story.image', home.story.image)
  if (home.story.buttonLabel.trim()) path('story.buttonTo', home.story.buttonTo, { required: true })
  for (const r of home.testimonials.items) {
    text(`testimonials.${r.id}.text`, r.text, 'the testimonial', 600)
    text(`testimonials.${r.id}.name`, r.name, 'a name', 60)
    if (!Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5) e[`testimonials.${r.id}.rating`] = 'Rating must be 1–5.'
  }
  text('newsletter.heading', home.newsletter.heading, 'a heading', 80)

  // Navigation & footer
  for (const l of content.navigation.links) {
    text(`navigation.${l.id}.label`, l.label, 'a label', 30)
    path(`navigation.${l.id}.to`, l.to, { required: true })
  }
  if (content.navigation.showBuildSet) text('navigation.buildSetLabel', content.navigation.buildSetLabel, 'a label', 30)
  for (const col of content.footer.columns) {
    text(`footer.${col.id}.title`, col.title, 'a column title', 40)
    for (const l of col.links) {
      text(`footer.${l.id}.label`, l.label, 'a label', 40)
      path(`footer.${l.id}.to`, l.to, { required: true })
    }
  }

  // About
  const { about } = content
  text('about.heroTitle', about.heroTitle, 'a title', 120)
  for (const key of ['heroImage', 'philosophyImage', 'approachImage']) image(`about.${key}`, about[key])
  for (const p of about.principles) text(`about.${p.id}.title`, p.title, 'a title', 60)

  return e
}

export const validateSocial = (url) => !url.trim() || isHttpsUrl(url)
