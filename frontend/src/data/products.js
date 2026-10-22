/**
 * FLONEA seed product catalog (frontend only — no database).
 *
 * This is the factory default the store starts from. Admin edits are saved in the browser
 * (localStorage, see src/store/) on top of it, and "Reset catalog" in Admin → Settings returns here.
 * src/store/seed.js converts each raw product into the editable per-product model, where every
 * product owns its sizes, colours and materials.
 *
 * ── Raw product shape ─────────────────────────────────────────────────────────
 * id / slug         Unique identifiers (slug is used in /products/:slug).
 * name, category    Category is one of CATEGORIES in ./catalog.js.
 * tagline           One-line summary shown on cards & product page.
 * description       Long description (product page "Description" tab).
 * materials         Material ids offered for this product (presets in MATERIALS).
 * colors            Colour ids offered (presets in COLORS).
 * sizes             Size ids offered (presets in SIZES) — sizing differs per product type.
 * pricing.sizes     Base price per size, in USD.
 * pricing.materials Optional surcharge per material, added to the size price.
 * unavailable       Combinations that are NOT produced. Each rule is a partial match,
 *                   e.g. { material: 'linen', color: 'black' } removes every linen/black variant.
 * stock             { default, overrides: [{ match: {…partial}, qty }] } — demo inventory.
 *                   qty 0 = sold out, 1–4 = low stock.
 * images            Default gallery (keys from ./images.js).
 * colorImages       Optional gallery per colour; the first image is used on product cards.
 * bundle            (Bedding sets only) { components: [{ productId, quantity }], discountPercent }.
 *                   Set variants, prices and stock are derived from the components — a set variant
 *                   only exists when every component variant exists, and its price is the sum of
 *                   component prices minus the configured discount. (Custom sets from Build a Set
 *                   never get a discount.)
 * specs / care      Product information shown in the product page tabs.
 * relatedProducts   Product ids shown under "You may also like".
 * flags             featured, bestSeller, isNew, createdAt (used for "Newest" sort).
 * rating            Demo rating data — clearly labelled as sample content in the UI.
 *
 * Pillows & Pillowcases: every product in the pillows / pillowcases categories is ONE purchasable
 * item (e.g. a pillowcase pair, or a pillow insert). It is never split into separately priced parts.
 */
const DEFAULT_CARE = [
  'Machine wash cold or warm (max. 40°C) on a gentle cycle.',
  'Use a mild, fragrance-free detergent; avoid bleach and fabric softener.',
  'Tumble dry low or line dry in the shade.',
  'Warm iron if desired.',
]

const RAW_PRODUCTS = [
  // ─── Duvet covers ──────────────────────────────────────────────────────────
  {
    id: 'signature-duvet-cover',
    slug: 'signature-duvet-cover',
    name: 'Signature Duvet Cover',
    category: 'duvet-covers',
    tagline: 'Our everyday essential, in three natural fabrics.',
    description:
      'The Signature Duvet Cover is designed to feel calm against your skin from the first night. Choose organic cotton for a smooth, breathable classic, bamboo lyocell for a cool and silky drape, or stonewashed linen for relaxed texture. Finished with a hidden button closure and interior corner ties that keep your duvet in place.',
    materials: ['organic-cotton', 'bamboo', 'linen'],
    colors: ['white', 'beige', 'taupe', 'sage', 'black'],
    sizes: ['single', 'double', 'queen', 'king', 'super-king'],
    pricing: {
      sizes: { single: 69, double: 79, queen: 89, king: 99, 'super-king': 109 },
      materials: { 'organic-cotton': 0, bamboo: 10, linen: 30 },
    },
    unavailable: [
      { material: 'bamboo', color: 'black' },
      { material: 'linen', color: 'black' },
      { material: 'linen', size: 'single' },
    ],
    stock: {
      default: 14,
      overrides: [
        { match: { material: 'organic-cotton', color: 'sage', size: 'king' }, qty: 0 },
        { match: { material: 'linen', color: 'taupe' }, qty: 3 },
      ],
    },
    images: ['duvetWhite3', 'duvetWhite1', 'duvetWhiteRoom'],
    colorImages: {
      white: ['duvetWhite3', 'duvetWhite1', 'duvetWhiteRoom', 'creamLinen'],
      beige: ['sand1', 'sand2', 'creamLinen'],
      taupe: ['taupeRoom', 'taupeLinen', 'taupeTexture'],
      sage: ['duvetSage1', 'duvetSage2', 'sageRoom', 'duvetSage3'],
      black: ['charcoal', 'taupeTexture'],
    },
    specs: [
      ['Closure', 'Hidden button closure'],
      ['Ties', 'Eight interior corner ties'],
      ['Finish', 'Pre-washed for softness'],
      ['Includes', 'One duvet cover (duvet insert not included)'],
    ],
    care: DEFAULT_CARE,
    relatedProducts: ['signature-pillowcase-set', 'signature-bedding-set', 'cloud-pillow', 'linen-duvet-cover'],
    featured: true,
    bestSeller: true,
    isNew: false,
    createdAt: '2025-03-02',
    rating: { average: 4.8, count: 124 },
  },
  {
    id: 'linen-duvet-cover',
    slug: 'stonewashed-linen-duvet-cover',
    name: 'Stonewashed Linen Duvet Cover',
    category: 'duvet-covers',
    tagline: 'Relaxed, breathable linen with a lived-in softness.',
    description:
      'Woven from European flax and stonewashed for a soft, relaxed finish, this duvet cover breathes beautifully in warm months and layers warmly in cool ones. Linen softens further with every wash, so it only becomes more comfortable over time.',
    materials: ['linen'],
    colors: ['white', 'beige', 'taupe', 'sage'],
    sizes: ['double', 'queen', 'king', 'super-king'],
    pricing: { sizes: { double: 129, queen: 149, king: 169, 'super-king': 185 } },
    unavailable: [],
    stock: {
      default: 9,
      overrides: [
        { match: { color: 'sage', size: 'super-king' }, qty: 0 },
        { match: { color: 'beige', size: 'king' }, qty: 2 },
      ],
    },
    images: ['duvetIvory', 'creamLinen'],
    colorImages: {
      white: ['duvetIvory', 'creamLinen', 'greyBedWindow'],
      beige: ['sand2', 'sand1', 'creamLinen'],
      taupe: ['taupeLinen', 'taupeStripe', 'taupeTexture'],
      sage: ['duvetSage3', 'sageStripe', 'duvetSage1'],
    },
    specs: [
      ['Closure', 'Coconut-shell button closure'],
      ['Ties', 'Four interior corner ties'],
      ['Finish', 'Stonewashed'],
      ['Includes', 'One duvet cover (duvet insert not included)'],
    ],
    care: [
      'Machine wash at 30–40°C with similar colours.',
      'Use a mild, fragrance-free detergent.',
      'Tumble dry low and remove while slightly damp, or line dry.',
      'Linen is meant to look relaxed — ironing is optional.',
    ],
    relatedProducts: ['linen-pillowcase-set', 'linen-bedding-set', 'linen-euro-pillow', 'signature-duvet-cover'],
    featured: true,
    bestSeller: true,
    isNew: false,
    createdAt: '2025-02-10',
    rating: { average: 4.9, count: 86 },
  },
  {
    id: 'bamboo-duvet-cover',
    slug: 'bamboo-lyocell-duvet-cover',
    name: 'Bamboo Lyocell Duvet Cover',
    category: 'duvet-covers',
    tagline: 'Cool, silky and fluid — made for warm sleepers.',
    description:
      'Bamboo lyocell has a naturally cool, silky hand-feel and a soft, fluid drape. If you tend to sleep warm, this is the duvet cover we reach for first.',
    materials: ['bamboo'],
    colors: ['white', 'beige', 'sage', 'gold'],
    sizes: ['single', 'double', 'queen', 'king'],
    pricing: { sizes: { single: 79, double: 89, queen: 99, king: 109 } },
    unavailable: [{ color: 'gold', size: 'single' }],
    stock: { default: 11, overrides: [{ match: { color: 'gold', size: 'king' }, qty: 4 }] },
    images: ['duvetWhite2', 'pillowSoft'],
    colorImages: {
      white: ['duvetWhite2', 'pillowSoft', 'duvetWhite1'],
      beige: ['sand1', 'sand2'],
      sage: ['sageHeadboard', 'duvetSage2', 'sageRoom'],
      gold: ['goldSilk', 'goldPillows'],
    },
    specs: [
      ['Closure', 'Hidden button closure'],
      ['Ties', 'Eight interior corner ties'],
      ['Feel', 'Cool and silky'],
      ['Includes', 'One duvet cover (duvet insert not included)'],
    ],
    care: [
      'Machine wash cold on a delicate cycle.',
      'Use a mild, fragrance-free detergent; avoid fabric softener.',
      'Line dry or tumble dry on the lowest setting.',
      'Do not iron on high heat.',
    ],
    relatedProducts: ['bamboo-support-pillow', 'signature-pillowcase-set', 'signature-duvet-cover', 'percale-duvet-cover'],
    featured: true,
    bestSeller: false,
    isNew: false,
    createdAt: '2025-05-18',
    rating: { average: 4.7, count: 58 },
  },
  {
    id: 'sateen-duvet-cover',
    slug: 'cotton-sateen-duvet-cover',
    name: 'Cotton Sateen Duvet Cover',
    category: 'duvet-covers',
    tagline: 'A soft sheen and a buttery, hotel-style finish.',
    description:
      'Our sateen weave floats more cotton yarns on the surface, giving a smooth, subtly lustrous finish that feels buttery against skin. A refined choice for those who love the feel of a well-made hotel bed.',
    materials: ['sateen'],
    colors: ['white', 'taupe', 'black'],
    sizes: ['queen', 'king', 'super-king'],
    pricing: { sizes: { queen: 95, king: 105, 'super-king': 115 } },
    unavailable: [],
    stock: { default: 10, overrides: [{ match: { color: 'black', size: 'super-king' }, qty: 0 }] },
    images: ['duvetWhiteHotel', 'duvetWhite3'],
    colorImages: {
      white: ['duvetWhiteHotel', 'duvetWhite3', 'pillowPair'],
      taupe: ['taupeRoom', 'taupeStripe'],
      black: ['charcoal', 'taupeTexture'],
    },
    specs: [
      ['Closure', 'Hidden button closure'],
      ['Weave', 'Sateen, four-over-one-under'],
      ['Feel', 'Smooth with a soft sheen'],
      ['Includes', 'One duvet cover (duvet insert not included)'],
    ],
    care: DEFAULT_CARE,
    relatedProducts: ['sateen-pillowcase-set', 'sateen-hotel-set', 'lumbar-pillow', 'silk-blend-duvet-cover'],
    featured: false,
    bestSeller: false,
    isNew: false,
    createdAt: '2025-04-01',
    rating: { average: 4.6, count: 41 },
  },
  {
    id: 'percale-duvet-cover',
    slug: 'crisp-percale-duvet-cover',
    name: 'Crisp Percale Duvet Cover',
    category: 'duvet-covers',
    tagline: 'Cool, matte and fresh — like a just-made bed.',
    description:
      'Percale is a tight, matte one-over-one-under weave with a crisp, cool feel. Light, breathable and fresh, it is a lovely choice for warmer bedrooms and anyone who loves a classic, clean finish.',
    materials: ['percale'],
    colors: ['white', 'beige', 'sage'],
    sizes: ['single', 'double', 'queen', 'king'],
    pricing: { sizes: { single: 59, double: 69, queen: 79, king: 89 } },
    unavailable: [],
    stock: { default: 16, overrides: [{ match: { color: 'sage', size: 'single' }, qty: 0 }] },
    images: ['greyBedWindow', 'duvetWhiteRoom'],
    colorImages: {
      white: ['greyBedWindow', 'duvetWhiteRoom', 'duvetWhite2'],
      beige: ['sand2', 'creamLinen'],
      sage: ['duvetSage3', 'sageRoom'],
    },
    specs: [
      ['Closure', 'Hidden button closure'],
      ['Weave', 'Percale, one-over-one-under'],
      ['Feel', 'Crisp and cool'],
      ['Includes', 'One duvet cover (duvet insert not included)'],
    ],
    care: DEFAULT_CARE,
    relatedProducts: ['signature-pillowcase-set', 'cloud-pillow', 'bamboo-duvet-cover', 'signature-duvet-cover'],
    featured: false,
    bestSeller: false,
    isNew: true,
    createdAt: '2026-08-20',
    rating: { average: 4.7, count: 19 },
  },
  {
    id: 'silk-blend-duvet-cover',
    slug: 'silk-blend-duvet-cover',
    name: 'Silk Blend Duvet Cover',
    category: 'duvet-covers',
    tagline: 'Mulberry silk and fine cotton, quietly luminous.',
    description:
      'Mulberry silk is woven together with fine cotton for a smooth, gently luminous surface that is easier to live with than pure silk. A considered indulgence for the bedroom.',
    materials: ['silk-blend'],
    colors: ['gold', 'beige', 'white'],
    sizes: ['queen', 'king'],
    pricing: { sizes: { queen: 189, king: 209 } },
    unavailable: [],
    stock: { default: 6, overrides: [{ match: { color: 'gold', size: 'king' }, qty: 2 }] },
    images: ['goldSilk', 'goldPillows'],
    colorImages: {
      gold: ['goldSilk', 'goldPillows'],
      beige: ['sand1', 'sand2'],
      white: ['duvetWhite1', 'duvetWhite3'],
    },
    specs: [
      ['Closure', 'Hidden button closure'],
      ['Composition', 'Mulberry silk & cotton blend'],
      ['Feel', 'Smooth with a natural lustre'],
      ['Includes', 'One duvet cover (duvet insert not included)'],
    ],
    care: [
      'Hand wash or machine wash cold on a delicate cycle in a laundry bag.',
      'Use a pH-neutral detergent suitable for silk.',
      'Line dry away from direct sunlight.',
      'Cool iron on the reverse side if needed.',
    ],
    relatedProducts: ['silk-pillowcase', 'lumbar-pillow', 'sateen-duvet-cover', 'signature-duvet-cover'],
    featured: false,
    bestSeller: false,
    isNew: true,
    createdAt: '2026-09-12',
    rating: { average: 4.9, count: 12 },
  },

  // ─── Pillowcases ───────────────────────────────────────────────────────────
  {
    id: 'signature-pillowcase-set',
    slug: 'signature-pillowcase-set',
    name: 'Signature Pillowcase Set',
    category: 'pillowcases',
    tagline: 'Set of 2 — matches the Signature Duvet Cover.',
    description:
      'A pair of envelope-closure pillowcases in the same three fabrics and colours as our Signature Duvet Cover, so your bed always looks considered. Sold as a set of two.',
    materials: ['organic-cotton', 'bamboo', 'linen'],
    colors: ['white', 'beige', 'taupe', 'sage', 'black'],
    sizes: ['standard', 'king-pillow'],
    pricing: {
      sizes: { standard: 29, 'king-pillow': 35 },
      materials: { 'organic-cotton': 0, bamboo: 6, linen: 12 },
    },
    unavailable: [
      { material: 'bamboo', color: 'black' },
      { material: 'linen', color: 'black' },
    ],
    stock: {
      default: 20,
      overrides: [
        { match: { material: 'bamboo', color: 'beige', size: 'king-pillow' }, qty: 0 },
        { match: { material: 'linen', color: 'taupe' }, qty: 4 },
      ],
    },
    images: ['pillowPair', 'pillowWhite'],
    colorImages: {
      white: ['pillowPair', 'pillowWhite', 'pillowStack'],
      beige: ['goldPillows', 'pillowRound'],
      taupe: ['taupePillows', 'taupeRoom'],
      sage: ['sageStripe', 'duvetSage2'],
      black: ['charcoal'],
    },
    specs: [
      ['Pieces', 'Two pillowcases'],
      ['Closure', 'Envelope closure'],
      ['Finish', 'Pre-washed for softness'],
    ],
    care: DEFAULT_CARE,
    relatedProducts: ['signature-duvet-cover', 'cloud-pillow', 'silk-pillowcase', 'signature-bedding-set'],
    featured: false,
    bestSeller: true,
    isNew: false,
    createdAt: '2025-03-02',
    rating: { average: 4.8, count: 97 },
  },
  {
    id: 'linen-pillowcase-set',
    slug: 'linen-pillowcase-set',
    name: 'Linen Pillowcase Set',
    category: 'pillowcases',
    tagline: 'Set of 2 — stonewashed European linen.',
    description:
      'Relaxed, breathable linen pillowcases that pair with our Stonewashed Linen Duvet Cover. Envelope closure, sold as a set of two.',
    materials: ['linen'],
    colors: ['white', 'beige', 'taupe', 'sage'],
    sizes: ['standard', 'king-pillow'],
    pricing: { sizes: { standard: 39, 'king-pillow': 45 } },
    unavailable: [],
    stock: { default: 18, overrides: [{ match: { color: 'sage', size: 'king-pillow' }, qty: 3 }] },
    images: ['pillowSoft', 'creamLinen'],
    colorImages: {
      white: ['pillowSoft', 'creamLinen'],
      beige: ['pillowRound', 'sand2'],
      taupe: ['taupePillows', 'taupeLinen'],
      sage: ['sageStripe', 'duvetSage3'],
    },
    specs: [
      ['Pieces', 'Two pillowcases'],
      ['Closure', 'Envelope closure'],
      ['Finish', 'Stonewashed'],
    ],
    care: [
      'Machine wash at 30–40°C with similar colours.',
      'Use a mild, fragrance-free detergent.',
      'Tumble dry low or line dry.',
    ],
    relatedProducts: ['linen-duvet-cover', 'linen-euro-pillow', 'linen-bedding-set', 'silk-pillowcase'],
    featured: false,
    bestSeller: false,
    isNew: false,
    createdAt: '2025-02-10',
    rating: { average: 4.8, count: 44 },
  },
  {
    id: 'silk-pillowcase',
    slug: 'mulberry-silk-pillowcase',
    name: 'Mulberry Silk Pillowcase',
    category: 'pillowcases',
    tagline: 'Single pillowcase — smooth against skin and hair.',
    description:
      'Densely woven 22 momme mulberry silk with a hidden zip closure. Smooth and gliding against skin and hair, it is a small luxury that makes a noticeable difference to how your pillow feels. Sold individually.',
    materials: ['mulberry-silk'],
    colors: ['white', 'gold', 'beige', 'taupe'],
    sizes: ['standard', 'king-pillow'],
    pricing: { sizes: { standard: 59, 'king-pillow': 69 } },
    unavailable: [{ color: 'taupe', size: 'king-pillow' }],
    stock: { default: 15, overrides: [{ match: { color: 'gold', size: 'standard' }, qty: 3 }] },
    images: ['goldPillows', 'goldSilk'],
    colorImages: {
      gold: ['goldPillows', 'goldSilk'],
      white: ['pillowSingle', 'pillowWhite'],
      beige: ['pillowRound', 'sand1'],
      taupe: ['taupePillows', 'taupeTexture'],
    },
    specs: [
      ['Pieces', 'One pillowcase'],
      ['Weight', '22 momme'],
      ['Closure', 'Hidden zip'],
    ],
    care: [
      'Hand wash cold or machine wash on a silk cycle in a laundry bag.',
      'Use a pH-neutral detergent suitable for silk.',
      'Line dry away from direct sunlight; do not tumble dry.',
    ],
    relatedProducts: ['silk-blend-duvet-cover', 'cloud-pillow', 'signature-pillowcase-set', 'lumbar-pillow'],
    featured: true,
    bestSeller: true,
    isNew: false,
    createdAt: '2025-06-01',
    rating: { average: 4.9, count: 132 },
  },
  {
    id: 'sateen-pillowcase-set',
    slug: 'sateen-pillowcase-set',
    name: 'Sateen Pillowcase Set',
    category: 'pillowcases',
    tagline: 'Set of 2 — a smooth, subtle sheen.',
    description:
      'Buttery cotton sateen pillowcases that pair with our Cotton Sateen Duvet Cover. Envelope closure, sold as a set of two.',
    materials: ['sateen'],
    colors: ['white', 'taupe', 'black'],
    sizes: ['standard', 'king-pillow'],
    pricing: { sizes: { standard: 32, 'king-pillow': 38 } },
    unavailable: [],
    stock: { default: 16, overrides: [] },
    images: ['pillowStack', 'pillowPair'],
    colorImages: {
      white: ['pillowStack', 'pillowPair'],
      taupe: ['taupePillows', 'taupeRoom'],
      black: ['charcoal'],
    },
    specs: [
      ['Pieces', 'Two pillowcases'],
      ['Weave', 'Sateen'],
      ['Closure', 'Envelope closure'],
    ],
    care: DEFAULT_CARE,
    relatedProducts: ['sateen-duvet-cover', 'sateen-hotel-set', 'cloud-pillow', 'silk-pillowcase'],
    featured: false,
    bestSeller: false,
    isNew: true,
    createdAt: '2026-07-04',
    rating: { average: 4.6, count: 21 },
  },

  // ─── Pillows ───────────────────────────────────────────────────────────────
  {
    id: 'cloud-pillow',
    slug: 'cloud-pillow',
    name: 'Cloud Pillow',
    category: 'pillows',
    tagline: 'Plump, washable and softly supportive.',
    description:
      'A soft cotton shell filled with lofty down-alternative fibre that springs back night after night. Medium support suits most back and side sleepers, and the whole pillow is machine washable.',
    materials: ['down-alternative'],
    colors: ['white'],
    sizes: ['standard', 'king-pillow'],
    pricing: { sizes: { standard: 49, 'king-pillow': 59 } },
    unavailable: [],
    stock: { default: 24, overrides: [] },
    images: ['pillowTower', 'pillowStack', 'pillowSoft'],
    specs: [
      ['Shell', 'Cotton'],
      ['Fill', 'Down-alternative fibre'],
      ['Support', 'Medium'],
      ['Includes', 'One pillow insert'],
    ],
    care: [
      'Machine wash warm on a gentle cycle; wash two pillows together to balance the drum.',
      'Tumble dry low with dryer balls until completely dry.',
      'Fluff daily to keep its loft.',
    ],
    relatedProducts: ['signature-pillowcase-set', 'silk-pillowcase', 'bamboo-support-pillow', 'complete-sleep-set'],
    featured: true,
    bestSeller: true,
    isNew: false,
    createdAt: '2025-01-15',
    rating: { average: 4.7, count: 210 },
  },
  {
    id: 'bamboo-support-pillow',
    slug: 'bamboo-support-pillow',
    name: 'Bamboo Support Pillow',
    category: 'pillows',
    tagline: 'Adjustable fill under a cool bamboo cover.',
    description:
      'A removable bamboo lyocell cover over an adjustable fill — open the inner zip to add or remove fill until the height feels right for you.',
    materials: ['bamboo'],
    colors: ['white'],
    sizes: ['standard', 'king-pillow'],
    pricing: { sizes: { standard: 65, 'king-pillow': 75 } },
    unavailable: [],
    stock: { default: 8, overrides: [{ match: { size: 'king-pillow' }, qty: 2 }] },
    images: ['pillowSingle', 'pillowWhite'],
    specs: [
      ['Cover', 'Bamboo lyocell, removable'],
      ['Fill', 'Adjustable shredded fibre'],
      ['Support', 'Adjustable'],
      ['Includes', 'One pillow with removable cover'],
    ],
    care: [
      'Remove the cover and machine wash cold on a gentle cycle.',
      'Spot clean the inner pillow.',
      'Air the pillow regularly in a well-ventilated room.',
    ],
    relatedProducts: ['cloud-pillow', 'bamboo-duvet-cover', 'silk-pillowcase', 'signature-pillowcase-set'],
    featured: false,
    bestSeller: false,
    isNew: true,
    createdAt: '2026-09-01',
    rating: { average: 4.5, count: 16 },
  },
  {
    id: 'linen-euro-pillow',
    slug: 'linen-euro-pillow',
    name: 'Linen Decorative Pillow',
    category: 'pillows',
    tagline: 'A relaxed linen cushion to finish the bed.',
    description:
      'A stonewashed linen cover with a soft insert, made to layer in front of your sleeping pillows. Available as a generous Euro square or a smaller cushion.',
    materials: ['linen'],
    colors: ['beige', 'taupe', 'sage', 'white'],
    sizes: ['euro', 'cushion'],
    pricing: { sizes: { euro: 49, cushion: 39 } },
    unavailable: [{ color: 'white', size: 'cushion' }],
    stock: { default: 12, overrides: [{ match: { color: 'sage', size: 'euro' }, qty: 0 }] },
    images: ['pillowRound', 'pillowSquare'],
    colorImages: {
      beige: ['pillowRound', 'creamLinen'],
      taupe: ['taupePillows', 'taupeLinen'],
      sage: ['sageStripe', 'foldedLinen'],
      white: ['pillowSquare', 'pillowWhite'],
    },
    specs: [
      ['Cover', 'Stonewashed linen, removable'],
      ['Insert', 'Down-alternative, included'],
      ['Closure', 'Hidden zip'],
    ],
    care: [
      'Remove the insert and machine wash the cover at 30°C.',
      'Line dry; spot clean the insert.',
    ],
    relatedProducts: ['linen-duvet-cover', 'linen-pillowcase-set', 'lumbar-pillow', 'linen-bedding-set'],
    featured: false,
    bestSeller: true,
    isNew: false,
    createdAt: '2025-04-22',
    rating: { average: 4.8, count: 37 },
  },
  {
    id: 'lumbar-pillow',
    slug: 'sateen-lumbar-pillow',
    name: 'Sateen Lumbar Pillow',
    category: 'pillows',
    tagline: 'A slim accent pillow with a soft sheen.',
    description:
      'A long, slim accent pillow in cotton sateen with a soft insert. Lovely layered across the front of the bed or used for lower-back support while reading.',
    materials: ['sateen'],
    colors: ['gold', 'white', 'black'],
    sizes: ['lumbar'],
    pricing: { sizes: { lumbar: 35 } },
    unavailable: [],
    stock: { default: 10, overrides: [{ match: { color: 'black' }, qty: 0 }] },
    images: ['goldPillows', 'pillowSoft'],
    colorImages: {
      gold: ['goldPillows', 'goldSilk'],
      white: ['pillowSoft', 'pillowWhite'],
      black: ['charcoal'],
    },
    specs: [
      ['Cover', 'Cotton sateen, removable'],
      ['Insert', 'Down-alternative, included'],
      ['Closure', 'Hidden zip'],
    ],
    care: ['Remove the insert and machine wash the cover cold.', 'Line dry; cool iron on the reverse.'],
    relatedProducts: ['sateen-duvet-cover', 'linen-euro-pillow', 'silk-blend-duvet-cover', 'silk-pillowcase'],
    featured: false,
    bestSeller: false,
    isNew: true,
    createdAt: '2026-06-18',
    rating: { average: 4.6, count: 9 },
  },

  // ─── Bedding sets (derived from components) ────────────────────────────────
  {
    id: 'signature-bedding-set',
    slug: 'signature-bedding-set',
    name: 'Signature Bedding Set',
    category: 'bedding-sets',
    tagline: 'Duvet cover + pillowcase pair, perfectly matched.',
    description:
      'Our Signature Duvet Cover and a matching Signature Pillowcase Set (2 pillowcases) in the same fabric and colour. Pillowcase size is matched to your bed: Standard for Single to Queen, King for King and Super King.',
    bundle: {
      components: [
        { productId: 'signature-duvet-cover', quantity: 1 },
        { productId: 'signature-pillowcase-set', quantity: 1 },
      ],
      discountPercent: 10,
    },
    images: ['duvetWhite3', 'pillowPair'],
    colorImages: {
      white: ['duvetWhite3', 'pillowPair', 'duvetWhiteRoom'],
      beige: ['sand1', 'goldPillows'],
      taupe: ['taupeRoom', 'taupePillows'],
      sage: ['duvetSage2', 'sageStripe', 'duvetSage1'],
      black: ['charcoal'],
    },
    specs: [
      ['Includes', '1 Signature Duvet Cover, 1 Signature Pillowcase Set (2 pillowcases)'],
      ['Set saving', '10% compared with buying separately'],
      ['Pillowcase size', 'Standard (Single–Queen) · King (King–Super King)'],
    ],
    care: DEFAULT_CARE,
    relatedProducts: ['complete-sleep-set', 'signature-duvet-cover', 'signature-pillowcase-set', 'cloud-pillow'],
    featured: true,
    bestSeller: true,
    isNew: false,
    createdAt: '2025-03-02',
    rating: { average: 4.8, count: 63 },
  },
  {
    id: 'linen-bedding-set',
    slug: 'linen-bedding-set',
    name: 'Linen Bedding Set',
    category: 'bedding-sets',
    tagline: 'Linen duvet cover + two pillowcase pairs.',
    description:
      'A complete stonewashed linen bed: one Stonewashed Linen Duvet Cover and two Linen Pillowcase Sets (4 pillowcases in total), in one colour.',
    bundle: {
      components: [
        { productId: 'linen-duvet-cover', quantity: 1 },
        { productId: 'linen-pillowcase-set', quantity: 2 },
      ],
      discountPercent: 12,
    },
    images: ['duvetSage3', 'sageStripe'],
    colorImages: {
      white: ['duvetIvory', 'pillowSoft'],
      beige: ['sand2', 'pillowRound'],
      taupe: ['taupeStripe', 'taupePillows'],
      sage: ['duvetSage3', 'sageStripe', 'duvetSage1'],
    },
    specs: [
      ['Includes', '1 Linen Duvet Cover, 2 Linen Pillowcase Sets (4 pillowcases)'],
      ['Set saving', '12% compared with buying separately'],
      ['Pillowcase size', 'Standard (Double–Queen) · King (King–Super King)'],
    ],
    care: [
      'Machine wash at 30–40°C with similar colours.',
      'Tumble dry low or line dry.',
    ],
    relatedProducts: ['linen-duvet-cover', 'linen-euro-pillow', 'signature-bedding-set', 'complete-sleep-set'],
    featured: true,
    bestSeller: false,
    isNew: false,
    createdAt: '2025-02-10',
    rating: { average: 4.9, count: 28 },
  },
  {
    id: 'sateen-hotel-set',
    slug: 'sateen-hotel-set',
    name: 'Sateen Hotel Set',
    category: 'bedding-sets',
    tagline: 'Sateen duvet cover + two pillowcase pairs.',
    description:
      'The hotel-bed feeling at home: one Cotton Sateen Duvet Cover and two Sateen Pillowcase Sets (4 pillowcases in total), in one colour.',
    bundle: {
      components: [
        { productId: 'sateen-duvet-cover', quantity: 1 },
        { productId: 'sateen-pillowcase-set', quantity: 2 },
      ],
      discountPercent: 10,
    },
    images: ['duvetWhiteHotel', 'pillowStack'],
    colorImages: {
      white: ['duvetWhiteHotel', 'pillowStack', 'duvetWhite3'],
      taupe: ['taupeRoom', 'taupePillows'],
      black: ['charcoal'],
    },
    specs: [
      ['Includes', '1 Sateen Duvet Cover, 2 Sateen Pillowcase Sets (4 pillowcases)'],
      ['Set saving', '10% compared with buying separately'],
      ['Pillowcase size', 'Standard (Queen) · King (King–Super King)'],
    ],
    care: DEFAULT_CARE,
    relatedProducts: ['sateen-duvet-cover', 'lumbar-pillow', 'signature-bedding-set', 'cloud-pillow'],
    featured: false,
    bestSeller: false,
    isNew: true,
    createdAt: '2026-07-04',
    rating: { average: 4.7, count: 11 },
  },
  {
    id: 'complete-sleep-set',
    slug: 'complete-sleep-set',
    name: 'Complete Sleep Set',
    category: 'bedding-sets',
    tagline: 'Duvet cover, pillowcases and two Cloud Pillows.',
    description:
      'Everything for a fresh start: a Signature Duvet Cover, a matching Signature Pillowcase Set (2 pillowcases) and two Cloud Pillows sized to fit. Our most complete set, with our largest set saving.',
    bundle: {
      components: [
        { productId: 'signature-duvet-cover', quantity: 1 },
        { productId: 'signature-pillowcase-set', quantity: 1 },
        { productId: 'cloud-pillow', quantity: 2 },
      ],
      discountPercent: 15,
    },
    images: ['heroRoom', 'pillowTower'],
    colorImages: {
      white: ['heroRoom', 'pillowTower', 'duvetWhite3'],
      beige: ['sand1', 'pillowTower'],
      taupe: ['taupeRoom', 'pillowTower'],
      sage: ['sageHeadboard', 'pillowTower', 'duvetSage1'],
      black: ['charcoal', 'pillowTower'],
    },
    specs: [
      ['Includes', '1 Signature Duvet Cover, 1 Signature Pillowcase Set, 2 Cloud Pillows'],
      ['Set saving', '15% compared with buying separately'],
      ['Pillow size', 'Standard (Single–Queen) · King (King–Super King)'],
    ],
    care: DEFAULT_CARE,
    relatedProducts: ['signature-bedding-set', 'cloud-pillow', 'signature-duvet-cover', 'linen-bedding-set'],
    featured: true,
    bestSeller: true,
    isNew: false,
    createdAt: '2025-08-01',
    rating: { average: 4.9, count: 47 },
  },
]

export const SEED_PRODUCTS = RAW_PRODUCTS
