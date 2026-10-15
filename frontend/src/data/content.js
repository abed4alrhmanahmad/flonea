/** Site copy & navigation. Customer reviews are clearly-labelled sample content. */

export const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/collections/duvet-covers', label: 'Duvet Covers' },
  { to: '/collections/pillows', label: 'Pillows' },
  { to: '/collections/bedding-sets', label: 'Bedding Sets' },
  { to: '/about', label: 'About' },
]

export const ANNOUNCEMENTS = [
  { text: 'Free shipping on orders over $100', link: { to: '/help/shipping-returns', label: 'Details' } },
  { text: 'Save up to 15% when you build a full bedding set', link: { to: '/bedding-sets/builder', label: 'Build yours' } },
  { text: 'Gentle on your skin. Considered in every detail.', link: { to: '/about', label: 'Our story' } },
]

export const BENEFITS = [
  { icon: 'Leaf', title: 'Natural Fibres', text: 'Cotton, linen, bamboo lyocell and silk — selected for softness.' },
  { icon: 'Wind', title: 'Breathable & Cool', text: 'Fabrics that let air move, for more comfortable nights.' },
  { icon: 'Feather', title: 'Chosen for Sensitive Skin', text: 'Smooth weaves and soft finishes, picked with sensitive skin in mind.' },
  { icon: 'WashingMachine', title: 'Easy Care, Long Lasting', text: 'Pre-washed fabrics that soften further with every wash.' },
]

export const SAMPLE_REVIEWS = [
  {
    id: 1,
    name: 'Maya K.',
    location: 'Beirut',
    rating: 5,
    product: 'Signature Duvet Cover',
    text: 'The organic cotton is so soft and it feels light even on warm nights. The sage colour is beautiful in person.',
  },
  {
    id: 2,
    name: 'Daniel R.',
    location: 'Dubai',
    rating: 5,
    product: 'Linen Bedding Set',
    text: 'I love how relaxed the linen looks. It got even softer after the first couple of washes.',
  },
  {
    id: 3,
    name: 'Lina S.',
    location: 'Paris',
    rating: 4,
    product: 'Mulberry Silk Pillowcase',
    text: 'Smooth and lovely to sleep on. The champagne shade is subtle and elegant. I ordered a second one.',
  },
]

export const HELP_PAGES = {
  'shipping-returns': {
    title: 'Shipping & Returns',
    intro: 'How delivery and returns work at FLONEA (demo policy — for illustration only).',
    sections: [
      ['Delivery', 'Standard delivery takes 3–5 business days and costs $8, or is free on orders over $100. Express delivery takes 1–2 business days for $18.'],
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
      ['Customer care', 'Email hello@flonea.example (demo address) — we usually reply within one business day.'],
      ['Studio hours', 'Monday to Friday, 9:00–18:00.'],
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
