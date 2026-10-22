/**
 * Default site copy & navigation. The store starts from DEFAULT_CONTENT and the Admin (Content page)
 * edits a copy of it, so this file is only the factory default. Customer reviews are clearly-labelled
 * sample content.
 */

const NAV_LINKS = [
  { id: 'nav-home', to: '/', label: 'Home', enabled: true },
  { id: 'nav-shop', to: '/shop', label: 'Shop', enabled: true },
  { id: 'nav-duvets', to: '/collections/duvet-covers', label: 'Duvet Covers', enabled: true },
  { id: 'nav-pillows', to: '/collections/pillows', label: 'Pillows', enabled: true },
  { id: 'nav-sets', to: '/collections/bedding-sets', label: 'Bedding Sets', enabled: true },
  { id: 'nav-about', to: '/about', label: 'About', enabled: true },
]

const ANNOUNCEMENTS = [
  { id: 'ann-shipping', text: 'Free shipping on orders over $100', linkLabel: 'Details', linkTo: '/help/shipping-returns', enabled: true },
  { id: 'ann-sets', text: 'Save up to 15% on ready-made bedding sets', linkLabel: 'Shop sets', linkTo: '/collections/bedding-sets', enabled: true },
  { id: 'ann-story', text: 'Gentle on your skin. Considered in every detail.', linkLabel: 'Our story', linkTo: '/about', enabled: true },
]

const HERO_SLIDES = [
  {
    id: 'slide-hero',
    enabled: true,
    image: 'hero',
    eyebrow: 'Skin friendly bedding',
    title1: 'Comfort Your Skin.',
    title2: 'Elevate Your Sleep.',
    text: 'Premium bedding and pillow collections in carefully selected natural fabrics, made with sensitive skin in mind.',
    primaryLabel: 'Shop Bedding',
    primaryTo: '/shop',
    secondaryLabel: 'Explore Sets',
    secondaryTo: '/collections/bedding-sets',
  },
  {
    id: 'slide-builder',
    enabled: true,
    image: 'sageHeadboard',
    eyebrow: 'Bedding Set Builder',
    title1: 'Create Your',
    title2: 'Perfect Set.',
    text: 'Pair Pillows & Pillowcases with a duvet cover — each in its own size, fabric and colour.',
    primaryLabel: 'Build a Set',
    primaryTo: '/bedding-sets/builder',
    secondaryLabel: 'Ready-made Sets',
    secondaryTo: '/collections/bedding-sets',
  },
  {
    id: 'slide-silk',
    enabled: true,
    image: 'goldSilk',
    eyebrow: 'New arrivals',
    title1: 'Quietly Luminous.',
    title2: 'Softly Silk.',
    text: 'Our new Silk Blend Duvet Cover and Mulberry Silk Pillowcases, in Champagne, Beige and White.',
    primaryLabel: 'Discover Silk',
    primaryTo: '/products/silk-blend-duvet-cover',
    secondaryLabel: 'All New Arrivals',
    secondaryTo: '/shop?sort=newest',
  },
]

const SAMPLE_REVIEWS = [
  {
    id: 'review-1',
    enabled: true,
    name: 'Maya K.',
    location: 'Beirut',
    rating: 5,
    product: 'Signature Duvet Cover',
    text: 'The organic cotton is so soft and it feels light even on warm nights. The sage colour is beautiful in person.',
  },
  {
    id: 'review-2',
    enabled: true,
    name: 'Daniel R.',
    location: 'Dubai',
    rating: 5,
    product: 'Linen Bedding Set',
    text: 'I love how relaxed the linen looks. It got even softer after the first couple of washes.',
  },
  {
    id: 'review-3',
    enabled: true,
    name: 'Lina S.',
    location: 'Paris',
    rating: 4,
    product: 'Mulberry Silk Pillowcase',
    text: 'Smooth and lovely to sleep on. The champagne shade is subtle and elegant. I ordered a second one.',
  },
]

/** Shop by Color chips: `colorId` is the filter value; `collectionId` ('' = all products) is where the chip links. */
const COLOR_CHIPS = [
  { id: 'chip-white', colorId: 'white', name: 'White', hex: '#FFFFFF', collectionId: '', enabled: true },
  { id: 'chip-beige', colorId: 'beige', name: 'Soft Beige', hex: '#DDC9BA', collectionId: '', enabled: true },
  { id: 'chip-taupe', colorId: 'taupe', name: 'Warm Taupe', hex: '#B8AEA4', collectionId: '', enabled: true },
  { id: 'chip-gold', colorId: 'gold', name: 'Champagne', hex: '#C9AB78', collectionId: '', enabled: true },
  { id: 'chip-sage', colorId: 'sage', name: 'Forest Green', hex: '#4D644F', collectionId: '', enabled: true },
  { id: 'chip-black', colorId: 'black', name: 'Black', hex: '#000000', collectionId: '', enabled: true },
]

const FOOTER_COLUMNS = [
  {
    id: 'col-shop',
    title: 'Shop',
    links: [
      { id: 'f-duvets', to: '/collections/duvet-covers', label: 'Duvet Covers' },
      { id: 'f-pillows', to: '/collections/pillows', label: 'Pillows & Pillowcases' },
      { id: 'f-sets', to: '/collections/bedding-sets', label: 'Bedding Sets' },
      { id: 'f-builder', to: '/bedding-sets/builder', label: 'Build a Set' },
      { id: 'f-shop', to: '/shop', label: 'Shop All' },
    ],
  },
  {
    id: 'col-about',
    title: 'About',
    links: [
      { id: 'f-story', to: '/about', label: 'Our Story' },
      { id: 'f-materials', to: '/about#materials', label: 'Materials' },
      { id: 'f-care', to: '/help/care', label: 'Care Guide' },
    ],
  },
  {
    id: 'col-care',
    title: 'Customer Care',
    links: [
      { id: 'f-shipping', to: '/help/shipping-returns', label: 'Shipping & Returns' },
      { id: 'f-faq', to: '/help/faq', label: 'FAQ' },
      { id: 'f-contact', to: '/help/contact', label: 'Contact' },
      { id: 'f-account', to: '/account', label: 'My Account' },
    ],
  },
]

export const DEFAULT_CONTENT = {
  announcement: { enabled: true, items: ANNOUNCEMENTS },
  navigation: { links: NAV_LINKS, showBuildSet: true, buildSetLabel: 'Build a Set' },
  home: {
    hero: { enabled: true, slides: HERO_SLIDES },
    categories: {
      enabled: true,
      heading: 'Shop by Category',
      subheading: 'Find your perfect comfort.',
      cards: [
        { id: 'card-duvets', collectionId: 'duvet-covers', name: 'Duvet Covers', blurb: 'Soft & breathable', image: 'duvetSage1', enabled: true },
        { id: 'card-pillows', collectionId: 'pillows', name: 'Pillows', blurb: 'Supportive & gentle', image: 'pillowPair', enabled: true },
        { id: 'card-sets', collectionId: 'bedding-sets', name: 'Bedding Sets', blurb: 'Complete your sleep space', image: 'duvetWhite3', enabled: true },
      ],
    },
    /**
     * Popular Collections tabs. Which products appear is set by the product flags (Best Seller /
     * New Arrival / Featured); `order` lists product ids in display order (unlisted products follow
     * in catalog order).
     */
    popular: {
      enabled: true,
      heading: 'Popular Collections',
      limit: 4,
      tabs: [
        { id: 'best', label: 'Best Sellers', flag: 'bestSeller', link: '/shop', enabled: true, order: [] },
        { id: 'new', label: 'New Arrivals', flag: 'isNew', link: '/shop?sort=newest', enabled: true, order: [] },
        { id: 'featured', label: 'Featured', flag: 'featured', link: '/shop', enabled: true, order: [] },
      ],
    },
    materials: {
      enabled: true,
      heading1: 'Thoughtfully Selected Materials',
      heading2: 'for Sensitive Skin',
      image: 'creamLinen',
      benefits: [
        { id: 'benefit-fibres', icon: 'Leaf', title: 'Natural Fibres', text: 'Cotton, linen, bamboo lyocell and silk — selected for softness.' },
        { id: 'benefit-breathable', icon: 'Wind', title: 'Breathable & Cool', text: 'Fabrics that let air move, for more comfortable nights.' },
        { id: 'benefit-skin', icon: 'Feather', title: 'Chosen for Sensitive Skin', text: 'Smooth weaves and soft finishes, picked with sensitive skin in mind.' },
        { id: 'benefit-care', icon: 'WashingMachine', title: 'Easy Care, Long Lasting', text: 'Pre-washed fabrics that soften further with every wash.' },
      ],
    },
    colors: { enabled: true, heading: 'Shop by Color', linkLabel: 'View All Colors', chips: COLOR_CHIPS },
    builder: {
      enabled: true,
      eyebrow: 'Bedding Set Builder',
      heading: 'Create Your Perfect Set',
      text: 'Choose a Pillows & Pillowcases product, then a duvet cover — each in its own size, fabric and colour — and add them to your cart as one custom set. Or shop individual items on their own.',
      bullets: ['Pillows and a duvet cover, chosen together', 'Each piece in its own size, material & colour', 'Added to your cart as one set'],
      buttonLabel: 'Start Building',
      image: 'duvetSage2',
    },
    story: {
      enabled: true,
      heading1: 'Better Materials.',
      heading2: 'Softer on Skin. Calmer Sleep.',
      text: 'Every FLONEA piece starts with the fabric. We choose smooth, breathable weaves — organic cotton, stonewashed linen, bamboo lyocell and mulberry silk — and finish them softly, so your bed feels calm from the very first night.',
      image: 'sleeping',
      imageAlt: 'Woman resting on soft neutral pillows',
      buttonLabel: 'Learn More',
      buttonTo: '/about',
    },
    testimonials: { enabled: true, heading: 'Kind Words', note: 'Sample reviews shown for demonstration purposes.', items: SAMPLE_REVIEWS },
    newsletter: {
      enabled: true,
      heading: 'Rest well, hear first.',
      text: 'Join the FLONEA newsletter for new collections, fabric care tips and early access to quiet offers.',
      buttonLabel: 'Subscribe',
    },
  },
  footer: {
    tagline: 'Skin friendly bedding & pillow collection.',
    showContact: true,
    columns: FOOTER_COLUMNS,
    newsletterHeading: 'Join our newsletter',
    newsletterText: 'New collections, care tips and quiet offers — never more than twice a month.',
    bottomNote: 'All rights reserved. Demo storefront — no real orders or payments.',
  },
  about: {
    heroEyebrow: 'Our story',
    heroTitle: 'Bedding that begins with how it feels.',
    heroImage: 'heroRoom',
    introHeading: 'Soft luxury, natural comfort.',
    introParagraphs: [
      'FLONEA was created around a simple idea: the things that touch your skin for eight hours a night deserve careful thought. We design duvet covers, pillowcases, pillows and complete bedding sets in a small number of well-chosen fabrics, and we keep everything else quiet and considered.',
      'We are especially mindful of people with sensitive skin. That doesn’t mean making medical promises — everyone’s skin is different — it means choosing smooth, breathable materials, soft finishes and clear fabric information, so you can decide what feels right for you.',
    ],
    philosophyEyebrow: 'Design philosophy',
    philosophyHeading: 'Fewer, better things.',
    philosophyImage: 'foldedLinen',
    principles: [
      { id: 'pr-fabric', title: 'Fabric first', text: 'Every design starts with how a fabric feels against skin. We favour smooth, breathable weaves and soft, pre-washed finishes.' },
      { id: 'pr-quiet', title: 'Quiet design', text: 'A restrained palette — white, beige, taupe, champagne and forest green — so your bedroom feels calm and pieces mix easily.' },
      { id: 'pr-last', title: 'Made to last', text: 'Considered construction: hidden closures, corner ties and fabrics that soften with every wash rather than wearing out.' },
    ],
    approachEyebrow: 'Our approach to comfort',
    approachHeading: 'Care in every detail.',
    approachText:
      'From the first stitch to the final touch, every piece is designed for how you actually sleep: covers that stay in place, pillowcases that close neatly, sets matched in size and colour, and care guidance that keeps natural fabrics soft for years.',
    approachImage: 'sleeping',
  },
}

/** Icons available for the homepage benefit tiles (lucide icon names). */
export const BENEFIT_ICON_NAMES = ['Leaf', 'Wind', 'Feather', 'WashingMachine', 'Sparkles', 'Heart', 'Moon', 'Sun']

/**
 * Help & policy pages. Sections marked `generated` are written from live store settings
 * (shipping prices, contact details) by lib/helpContent.js, so they never go stale.
 */
export const HELP_PAGES = {
  'shipping-returns': {
    title: 'Shipping & Returns',
    intro: 'How delivery and returns work at FLONEA (demo policy — for illustration only).',
    sections: [
      ['Delivery', { generated: 'shipping' }],
      ['Returns', 'Unused items in their original packaging can be returned within 30 days of delivery. Pillows and pillow inserts can only be returned unopened.'],
      ['Exchanges', 'Need a different size or colour? Contact us and we will help you arrange an exchange.'],
    ],
  },
  faq: {
    title: 'Frequently Asked Questions',
    intro: 'Quick answers to common questions.',
    sections: [
      ['Which material should I choose?', 'Organic cotton is a breathable everyday classic, linen is relaxed and textured, bamboo lyocell feels cool and silky, and sateen has a soft sheen. Every product page describes each fabric.'],
      ['How do bedding set sizes work?', 'Duvet covers follow your bed size. Pillowcases in sets are Standard for Single to Queen beds and King for King and Super King beds.'],
      ['Is the duvet insert included?', 'No — duvet covers and bedding sets include covers only. Pillows are included only where stated (e.g. the Complete Sleep Set).'],
      ['Are your products suitable for sensitive skin?', 'We choose smooth, breathable fabrics with sensitive skin in mind, but everyone is different. If you have a skin condition, please check fabric details with your doctor.'],
    ],
  },
  care: {
    title: 'Care Guide',
    intro: 'A little care keeps natural fabrics soft for years.',
    sections: [
      ['Washing', 'Wash at 30–40°C on a gentle cycle with a mild, fragrance-free detergent. Wash darker colours separately the first few times.'],
      ['Drying', 'Tumble dry on low or line dry in the shade. Remove linen while slightly damp for the softest finish.'],
      ['Silk', 'Hand wash or use a silk cycle in a laundry bag with a pH-neutral detergent. Do not tumble dry.'],
    ],
  },
  contact: {
    title: 'Contact Us',
    intro: 'We would love to hear from you.',
    sections: [
      ['Customer care', { generated: 'contact' }],
      ['Studio hours', { generated: 'hours' }],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'This is a demo storefront.',
    sections: [
      ['What we store', 'Your cart and wishlist are saved only in your own browser (localStorage). Nothing is sent to a server.'],
      ['Forms', 'The newsletter and checkout forms are demonstrations. Information you type is not transmitted or stored remotely.'],
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    intro: 'This website is a demonstration of the FLONEA shopping experience.',
    sections: [
      ['Orders', 'No real orders are placed and no payments are taken on this website.'],
      ['Content', 'Product information, prices, stock levels and reviews are sample content for demonstration purposes.'],
    ],
  },
}
