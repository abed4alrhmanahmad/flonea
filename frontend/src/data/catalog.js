/**
 * Shared option libraries and store defaults.
 *
 * MATERIALS, COLORS and SIZES are presets: the seed products in ./products.js reference them by id,
 * and the Admin offers them when adding an option. Once loaded, every product keeps its OWN copy of
 * its sizes, colours and materials (see src/store/seed.js), so editing one product's options never
 * changes another product. COLLECTIONS and SHIPPING are the defaults the store starts from.
 */

export const CATEGORIES = [
  { id: 'duvet-covers', name: 'Duvet Covers', singular: 'Duvet Cover', blurb: 'Soft & breathable', image: 'duvetSage1' },
  { id: 'pillows', name: 'Pillows', singular: 'Pillow', blurb: 'Supportive & gentle', image: 'pillowPair' },
  { id: 'pillowcases', name: 'Pillowcases', singular: 'Pillowcase', blurb: 'Smooth against your skin', image: 'goldPillows' },
  { id: 'bedding-sets', name: 'Bedding Sets', singular: 'Bedding Set', blurb: 'Complete your sleep space', image: 'duvetWhite3' },
]

/**
 * Default collections for the /collections/:id pages. The store turns `categories` into an explicit,
 * ordered product list that the Admin can edit. The "Pillows" collection includes pillow inserts and
 * pillowcases.
 */
export const COLLECTIONS = {
  'duvet-covers': {
    id: 'duvet-covers',
    title: 'Duvet Covers',
    subtitle: 'Soft layers. Healthier skin.',
    categories: ['duvet-covers'],
    image: 'duvetSage2',
  },
  pillows: {
    id: 'pillows',
    title: 'Pillows & Pillowcases',
    subtitle: 'Gentle support, night after night.',
    categories: ['pillows', 'pillowcases'],
    image: 'pillowStack',
  },
  'bedding-sets': {
    id: 'bedding-sets',
    title: 'Bedding Sets',
    subtitle: 'Thoughtfully matched, ready for your bed.',
    categories: ['bedding-sets'],
    image: 'sageHeadboard',
  },
}

export const MATERIALS = {
  'organic-cotton': {
    id: 'organic-cotton',
    name: 'Organic Cotton',
    short: 'Organic Cotton',
    description: 'Long-staple cotton grown without synthetic pesticides. Smooth, breathable and easy to care for.',
  },
  bamboo: {
    id: 'bamboo',
    name: 'Bamboo Lyocell',
    short: 'Bamboo',
    description: 'A silky, cool-to-the-touch fabric made from bamboo pulp. Naturally soft with a gentle drape.',
  },
  linen: {
    id: 'linen',
    name: 'Stonewashed Linen',
    short: 'Linen',
    description: 'European flax linen, stonewashed for a lived-in softness. Breathable in summer, cosy in winter.',
  },
  percale: {
    id: 'percale',
    name: 'Cotton Percale',
    short: 'Percale',
    description: 'A crisp, matte one-over-one-under cotton weave that feels cool and fresh.',
  },
  sateen: {
    id: 'sateen',
    name: 'Cotton Sateen',
    short: 'Sateen',
    description: 'A four-over-one-under cotton weave with a soft, subtle sheen and a buttery hand-feel.',
  },
  'silk-blend': {
    id: 'silk-blend',
    name: 'Silk & Cotton Blend',
    short: 'Silk Blend',
    description: 'Mulberry silk woven with fine cotton for a smooth, lustrous surface that is easier to care for.',
  },
  'mulberry-silk': {
    id: 'mulberry-silk',
    name: '22 Momme Mulberry Silk',
    short: 'Mulberry Silk',
    description: 'Smooth, densely woven mulberry silk that glides against skin and hair.',
  },
  'down-alternative': {
    id: 'down-alternative',
    name: 'Cotton Shell, Down-Alternative Fill',
    short: 'Down Alternative',
    description: 'A soft cotton shell filled with a lofty, washable down-alternative fibre.',
  },
}

/** Brand palette swatches. `hex` values use the exact FLONEA palette. */
export const COLORS = {
  white: { id: 'white', name: 'White', hex: '#FFFFFF' },
  beige: { id: 'beige', name: 'Soft Beige', hex: '#DDC9BA' },
  taupe: { id: 'taupe', name: 'Warm Taupe', hex: '#B8AEA4' },
  gold: { id: 'gold', name: 'Champagne', hex: '#C9AB78' },
  sage: { id: 'sage', name: 'Forest Green', hex: '#4D644F' },
  black: { id: 'black', name: 'Black', hex: '#000000' },
}

/** Sizes are grouped by product type — duvet covers, pillowcases and pillows use different sizing. */
export const SIZES = {
  // Duvet covers & bedding sets
  single: { id: 'single', name: 'Single', dims: '140 × 200 cm', order: 1 },
  double: { id: 'double', name: 'Double', dims: '200 × 200 cm', order: 2 },
  queen: { id: 'queen', name: 'Queen', dims: '220 × 240 cm', order: 3 },
  king: { id: 'king', name: 'King', dims: '240 × 260 cm', order: 4 },
  'super-king': { id: 'super-king', name: 'Super King', dims: '260 × 260 cm', order: 5 },
  // Pillows & pillowcases
  standard: { id: 'standard', name: 'Standard', dims: '50 × 75 cm', order: 10 },
  'king-pillow': { id: 'king-pillow', name: 'King', dims: '50 × 90 cm', order: 11 },
  euro: { id: 'euro', name: 'Euro Square', dims: '65 × 65 cm', order: 12 },
  cushion: { id: 'cushion', name: 'Cushion', dims: '45 × 45 cm', order: 13 },
  lumbar: { id: 'lumbar', name: 'Lumbar', dims: '35 × 55 cm', order: 14 },
}

/**
 * Compatibility rule for pre-made bedding sets: pillowcases and pillows are sized to match the bed (duvet) size.
 * (Custom sets from the Set Builder let each component keep its own size.)
 */
export const PILLOW_SIZE_FOR_BED = {
  single: 'standard',
  double: 'standard',
  queen: 'standard',
  king: 'king-pillow',
  'super-king': 'king-pillow',
}

/** Price-range buckets used by the shop filters (labels are formatted in the display currency, see formatPriceBucket). */
export const PRICE_RANGES = [
  { id: '0-50', min: 0, max: 50 },
  { id: '50-100', min: 50, max: 100 },
  { id: '100-150', min: 100, max: 150 },
  { id: '150+', min: 150, max: Infinity },
]

/** Default demo shipping rules (editable in Admin → Settings) — shared by cart and checkout. */
export const SHIPPING = {
  freeThreshold: 100,
  methods: [
    { id: 'standard', name: 'Standard Delivery', eta: '3–5 business days', price: 8, freeOverThreshold: true },
    { id: 'express', name: 'Express Delivery', eta: '1–2 business days', price: 18, freeOverThreshold: false },
    { id: 'pickup', name: 'Studio Pick-up (demo)', eta: 'Ready in 2 business days', price: 0, freeOverThreshold: false },
  ],
}

export const MAX_LINE_QUANTITY = 10

/** Currencies the storefront can DISPLAY prices in. Display only — amounts are never converted. */
export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'AED', label: 'UAE Dirham' },
  { code: 'SAR', label: 'Saudi Riyal' },
  { code: 'LBP', label: 'Lebanese Pound' },
]
