/**
 * Help-page sections that are written from live store settings, so policy copy always matches the
 * shipping prices and contact details configured in the Admin.
 */
import { HELP_PAGES } from '../data/content.js'
import { getSettings } from '../store/store.js'
import { formatPrice } from './format.js'
import { getFreeShippingThreshold, getShippingMethods } from './pricing.js'

export function shippingPolicyText() {
  const threshold = formatPrice(getFreeShippingThreshold())
  const parts = getShippingMethods().map((m) => {
    const price = m.price === 0 ? 'is free' : `costs ${formatPrice(m.price)}`
    const free = m.freeOverThreshold && m.price > 0 ? `, or is free on orders over ${threshold}` : ''
    return `${m.name} (${m.eta}) ${price}${free}.`
  })
  return parts.join(' ')
}

function generatedText(kind) {
  const { contact } = getSettings()
  if (kind === 'shipping') return shippingPolicyText()
  if (kind === 'contact') {
    const email = contact.email ? `Email ${contact.email} (demo address)` : 'Use the contact details on this page'
    return `${email}${contact.phone ? ` or call ${contact.phone}` : ''} — we usually reply within one business day.`
  }
  if (kind === 'hours') return contact.hours || 'Monday to Friday.'
  return ''
}

/** A help page with its generated sections filled in: { title, intro, sections: [[title, text]] }. */
export function getHelpPage(topic) {
  const page = HELP_PAGES[topic]
  if (!page) return null
  return { ...page, sections: page.sections.map(([title, text]) => [title, typeof text === 'string' ? text : generatedText(text.generated)]) }
}

export const HELP_TOPICS = Object.keys(HELP_PAGES)
