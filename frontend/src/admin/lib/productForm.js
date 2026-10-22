/**
 * Product editor helpers: blank products, draft → model conversion and validation.
 *
 * While editing, number fields may hold strings (so a half-typed "12." or an empty box is allowed);
 * `toProduct()` converts them, and `validateProduct()` reports anything that isn't valid yet.
 */
import { CATEGORIES, COLLECTIONS } from '../../data/catalog.js'
import { isImageRef } from '../../data/images.js'
import { DIMENSIONS, OPTION_FIELDS, listCombinations } from '../../lib/variants.js'
import { SET_ROLES } from '../../data/setBuilder.js'
import { deepClone } from './listUtils.js'

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const RESERVED_SLUGS = new Set(['new', 'admin'])

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active — visible and purchasable' },
  { value: 'draft', label: 'Draft — hidden from customers' },
  { value: 'archived', label: 'Archived — hidden, kept for records' },
]

export const categoryName = (id) => CATEGORIES.find((c) => c.id === id)?.name ?? id
export const isPillowCategory = (category) => SET_ROLES.find((r) => r.id === 'pillow').categories.includes(category)
export const setRoleForCategory = (category) => SET_ROLES.find((r) => r.categories.includes(category)) ?? null

/** Collections a new product of this category would normally belong to (pre-ticked, editable). */
export const defaultCollectionsFor = (category) => Object.values(COLLECTIONS).filter((c) => c.categories.includes(category)).map((c) => c.id)

export function blankProduct({ id, type = 'single', category = 'duvet-covers', today }) {
  const base = {
    id,
    slug: id,
    name: '',
    category: type === 'bundle' ? 'bedding-sets' : category,
    tagline: '',
    description: '',
    status: 'draft',
    featured: false,
    bestSeller: false,
    isNew: true,
    createdAt: today,
    updatedAt: null,
    skuPrefix: '',
    images: [],
    imageAlts: {},
    colorImages: {},
    specs: [],
    care: [],
    relatedProducts: [],
    rating: { average: 0, count: 0 },
    setEligible: true,
    materials: [],
    colors: [],
    sizes: [],
    unavailable: [],
    variantSettings: {},
    defaultStock: 10,
  }
  return type === 'bundle' ? { ...base, bundle: { components: [], discountPercent: 0 } } : base
}

const num = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v))
const isNum = (v) => Number.isFinite(num(v))
const isInt = (v) => Number.isInteger(num(v))

/** Converts an editor draft into the stored product model (numbers as numbers, blanks removed). */
export function toProduct(draft) {
  const p = deepClone(draft)
  p.name = p.name.trim()
  p.slug = p.slug.trim()
  p.tagline = p.tagline.trim()
  p.skuPrefix = p.skuPrefix.trim().toUpperCase()
  p.defaultStock = isInt(p.defaultStock) ? num(p.defaultStock) : 0
  p.sizes = p.sizes.map((s) => ({ ...s, name: s.name.trim(), dims: (s.dims ?? '').trim(), price: isNum(s.price) ? num(s.price) : 0 }))
  p.materials = p.materials.map((m) => ({ ...m, name: m.name.trim(), short: (m.short || m.name).trim(), surcharge: isNum(m.surcharge) ? num(m.surcharge) : 0 }))
  p.colors = p.colors.map((c) => ({ ...c, name: c.name.trim(), hex: c.hex.trim().toUpperCase() }))
  p.variantSettings = Object.fromEntries(
    Object.entries(p.variantSettings ?? {})
      .map(([key, v]) => {
        const out = {}
        if (v.available === false) out.available = false
        if (isInt(v.stock) && num(v.stock) >= 0) out.stock = num(v.stock)
        if (isNum(v.price) && num(v.price) >= 0) out.price = num(v.price)
        return [key, out]
      })
      .filter(([, v]) => Object.keys(v).length),
  )
  p.specs = p.specs.map(([k, v]) => [k.trim(), v.trim()]).filter(([k]) => k)
  p.care = p.care.map((c) => c.trim()).filter(Boolean)
  p.imageAlts = Object.fromEntries(Object.entries(p.imageAlts ?? {}).filter(([k, v]) => p.images.includes(k) && v.trim()))
  p.colorImages = Object.fromEntries(Object.entries(p.colorImages ?? {}).filter(([, list]) => list.length))
  p.rating = { average: isNum(p.rating.average) ? Math.min(5, Math.max(0, num(p.rating.average))) : 0, count: isInt(p.rating.count) ? Math.max(0, num(p.rating.count)) : 0 }
  if (p.bundle) {
    p.bundle = {
      components: p.bundle.components.map((c) => ({ productId: c.productId, quantity: isInt(c.quantity) ? num(c.quantity) : 1 })),
      discountPercent: isNum(p.bundle.discountPercent) ? num(p.bundle.discountPercent) : 0,
    }
  }
  return p
}

/**
 * Validates a draft. Returns { errors, warnings }: `errors` (field → message) block saving;
 * `warnings` are shown but don't block.
 * Active products must be complete (images and at least one purchasable variant); drafts may be unfinished.
 */
export function validateProduct(draft, { products, previewVariants = null }) {
  const errors = {}
  const warnings = []
  const active = draft.status === 'active'
  const name = draft.name.trim()
  if (!name) errors.name = 'Enter a product name.'
  else if (name.length > 120) errors.name = 'Keep the name under 120 characters.'

  const slug = draft.slug.trim()
  if (!slug) errors.slug = 'Enter a URL slug.'
  else if (!SLUG_PATTERN.test(slug)) errors.slug = 'Use lowercase letters, numbers and single hyphens only (e.g. linen-duvet-cover).'
  else if (RESERVED_SLUGS.has(slug)) errors.slug = 'This slug is reserved — choose another.'
  else if (products.some((p) => p.id !== draft.id && p.slug === slug)) errors.slug = 'Another product already uses this slug.'

  if (!CATEGORIES.some((c) => c.id === draft.category)) errors.category = 'Choose a category.'
  if (draft.skuPrefix && !/^[A-Za-z0-9-]{1,30}$/.test(draft.skuPrefix.trim())) errors.skuPrefix = 'Use letters, numbers and hyphens (max 30).'
  if (draft.description.length > 5000) errors.description = 'Keep the description under 5,000 characters.'

  if (draft.images.some((i) => !isImageRef(i))) errors.images = 'One of the images isn’t a library image or a valid URL.'
  if (active && !draft.images.length) errors.images = 'Add at least one image before publishing.'

  if (!/^\d{4}-\d{2}-\d{2}/.test(draft.createdAt ?? '')) errors.createdAt = 'Enter a date (YYYY-MM-DD).'

  if (!draft.bundle) {
    const checkList = (dim, label) => {
      const list = draft[OPTION_FIELDS[dim]]
      const ids = new Set()
      list.forEach((o, i) => {
        if (!o.id || !SLUG_PATTERN.test(o.id)) errors[`${dim}.${i}.id`] = `${label} ${i + 1} has an invalid id.`
        if (ids.has(o.id)) errors[`${dim}.${i}.id`] = `Two ${label.toLowerCase()}s use the id “${o.id}”.`
        ids.add(o.id)
        if (!o.name.trim()) errors[`${dim}.${i}.name`] = `${label} ${i + 1} needs a name.`
        if (dim === 'size' && (!isNum(o.price) || num(o.price) < 0)) errors[`${dim}.${i}.price`] = `Enter a price of 0 or more for ${o.name || `size ${i + 1}`}.`
        if (dim === 'size' && isNum(o.price) && num(o.price) > 100000) errors[`${dim}.${i}.price`] = 'That price looks too high.'
        if (dim === 'material' && o.surcharge !== '' && o.surcharge != null && !isNum(o.surcharge)) errors[`${dim}.${i}.surcharge`] = `Enter a number for the ${o.name || 'material'} surcharge.`
        if (dim === 'color' && !HEX_PATTERN.test(o.hex.trim())) errors[`${dim}.${i}.hex`] = `Enter a valid hex colour for ${o.name || `colour ${i + 1}`} (e.g. #DDC9BA).`
      })
    }
    checkList('size', 'Size')
    checkList('material', 'Material')
    checkList('color', 'Colour')

    if (!isInt(draft.defaultStock) || num(draft.defaultStock) < 0) errors.defaultStock = 'Default stock must be a whole number of 0 or more.'
    for (const [key, v] of Object.entries(draft.variantSettings ?? {})) {
      if (v.stock !== undefined && v.stock !== null && v.stock !== '' && (!isInt(v.stock) || num(v.stock) < 0)) errors[`variant.${key}.stock`] = `Stock for ${key.replaceAll('|', ' / ')} must be a whole number of 0 or more.`
      if (v.price !== undefined && v.price !== null && v.price !== '' && (!isNum(v.price) || num(v.price) < 0)) errors[`variant.${key}.price`] = `Price for ${key.replaceAll('|', ' / ')} must be 0 or more.`
    }
    draft.unavailable.forEach((rule, i) => {
      if (!DIMENSIONS.some((d) => rule[d])) errors[`rule.${i}`] = `Restriction ${i + 1} must name at least one size, colour or material.`
    })

    if (!errors.defaultStock) {
      const product = toProduct(draft)
      const negative = listCombinations(product).find((c) => c.offered && c.price < 0)
      if (negative) errors.pricing = `${negative.key.replaceAll('|', ' / ')} would cost less than 0 — check the material surcharges.`
      const offered = previewVariants ?? listCombinations(product).filter((c) => c.offered)
      if (active && !offered.length) errors.variants = 'An active product needs at least one enabled size, colour and material combination that is offered.'
      if (!active && !offered.length) warnings.push('No purchasable variants yet — customers can’t buy this product until it has one.')
    }
  } else {
    const comps = draft.bundle.components
    if (!comps.length) errors.bundle = 'Add at least one product to this ready-made set.'
    comps.forEach((c, i) => {
      const target = products.find((p) => p.id === c.productId)
      if (!target) errors[`bundle.${i}`] = `Choose a product for item ${i + 1}.`
      else if (target.bundle) errors[`bundle.${i}`] = 'A set can’t contain another set.'
      if (!isInt(c.quantity) || num(c.quantity) < 1 || num(c.quantity) > 10) errors[`bundle.${i}.quantity`] = 'Quantity must be a whole number from 1 to 10.'
    })
    if (comps[0] && products.find((p) => p.id === comps[0].productId)?.category !== 'duvet-covers') warnings.push('The first item sets the size, colour and material options — usually the duvet cover.')
    if (!isNum(draft.bundle.discountPercent) || num(draft.bundle.discountPercent) < 0 || num(draft.bundle.discountPercent) > 90) errors.discount = 'The set saving must be between 0 and 90%.'
    if (active && previewVariants && !previewVariants.length) errors.variants = 'This set has no combination that all of its products share, or one of them is not active.'
  }

  draft.specs.forEach(([k, v], i) => {
    if (!k.trim() && v.trim()) errors[`spec.${i}`] = `Specification ${i + 1} needs a label.`
  })
  if (!isNum(draft.rating.average) || num(draft.rating.average) < 0 || num(draft.rating.average) > 5) errors.rating = 'Sample rating must be between 0 and 5.'
  if (!isInt(draft.rating.count) || num(draft.rating.count) < 0) errors.ratingCount = 'Sample review count must be a whole number.'

  return { errors, warnings }
}

/** Short summary of what changed between two saved products (for the activity history). */
export function describeProductChanges(before, after) {
  if (!before) return null
  const changes = []
  const changed = (k) => JSON.stringify(before[k]) !== JSON.stringify(after[k])
  if (changed('name') || changed('slug') || changed('tagline') || changed('description')) changes.push('details')
  if (changed('status')) changes.push(`status → ${after.status}`)
  if (changed('featured') || changed('bestSeller') || changed('isNew')) changes.push('merchandising flags')
  if (changed('images') || changed('colorImages') || changed('imageAlts')) changes.push('images')
  if (changed('sizes')) changes.push('sizes')
  if (changed('colors')) changes.push('colours')
  if (changed('materials')) changes.push('materials')
  if (changed('unavailable') || changed('variantSettings') || changed('defaultStock')) changes.push('variants & stock')
  if (changed('bundle')) changes.push('set contents')
  if (changed('specs') || changed('care') || changed('relatedProducts') || changed('rating')) changes.push('product information')
  if (changed('setEligible')) changes.push(`Build a Set ${after.setEligible ? 'eligible' : 'not eligible'}`)
  return changes
}
