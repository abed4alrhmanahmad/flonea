/**
 * Central image registry.
 *
 * Every image used on the site is referenced by a stable key (e.g. `duvetSage1`).
 * Files live in `public/images/<key>-sm.jpg` (700px wide) and `<key>-lg.jpg` (1600px wide)
 * and were downloaded from Unsplash (free licence) with `npm run images`.
 *
 * To use real FLONEA product photography, replace the two files for a key with
 * new files of the same name — or point `src` at a different location below.
 *
 * Anywhere an image is referenced (products, collections, homepage content) the value may also be
 * an image URL: an absolute https:// address or a site path such as /images/my-photo.jpg.
 */

export const IMAGE_SOURCES = {
  hero: { id: '1617325247661-675ab4b64ae2', alt: 'Softly made bed with white linen and natural wood frame in a bright bedroom' },
  heroRoom: { id: '1780672823770-dc40e2181cdf', alt: 'Bright bedroom with white bedding and a wooden headboard' },
  sleeping: { id: '1686828752370-c0398d724e82', alt: 'Woman resting on soft neutral pillows' },

  duvetWhite1: { id: '1564019472231-4586c552dc27', alt: 'White duvet cover and pillows, gently rumpled' },
  duvetWhite2: { id: '1601276174812-63280a55656e', alt: 'Sunlit white bedding with soft shadows' },
  duvetWhite3: { id: '1762199904138-d163fe89540a', alt: 'Neatly made bed with white linens and pillows' },
  duvetWhiteRoom: { id: '1595526114035-0d45ed16cfbf', alt: 'White bedding in a calm, light bedroom' },
  duvetWhiteHotel: { id: '1698746044340-ae5559412fd5', alt: 'White duvet with layered pillows beside a bedside table' },
  duvetIvory: { id: '1564019472017-b51398323027', alt: 'Ivory bed linen with relaxed creases' },

  duvetSage1: { id: '1780672823857-c2bfe66a9b0e', alt: 'Sage green duvet cover on a bed in a softly lit bedroom' },
  duvetSage2: { id: '1780672823863-1f40d9c6435d', alt: 'Bedroom with sage green bedding and white pillows' },
  duvetSage3: { id: '1780672823896-fc266a8d5ecb', alt: 'Sage green duvet with white pillowcases' },
  sageRoom: { id: '1615874959474-d609969a20ed', alt: 'Green and white layered bedding' },
  sageHeadboard: { id: '1771466883546-a988d001f5ba', alt: 'Bed with green headboard, white linen and a wooden tray' },
  sageStripe: { id: '1775029918335-63951f10d962', alt: 'Made bed with green cushions and a striped throw' },
  forest: { id: '1639813806536-11895df1ff64', alt: 'Deep green bedding against a wooden headboard' },

  sand1: { id: '1614045955859-031b51af8ffb', alt: 'Sand-coloured duvet cover softly gathered on a bed' },
  sand2: { id: '1614045963521-189262b3c60b', alt: 'Close-up of soft sand-coloured bedding' },
  creamLinen: { id: '1634665810235-011d663754e7', alt: 'Close-up of cream linen fabric texture' },
  goldSilk: { id: '1699913028290-ffdcbd969bf7', alt: 'Champagne silk-blend bedding with a soft sheen' },
  goldPillows: { id: '1642786518358-45626f9ce9df', alt: 'Champagne and white pillowcases piled on a bed' },

  taupeLinen: { id: '1518019671582-55004f1bc9ab', alt: 'Grey-taupe linen in soft folds' },
  taupeTexture: { id: '1614226114676-8e02ac5f4763', alt: 'Close-up of taupe washed linen' },
  taupePillows: { id: '1638127815875-d8c930a8d467', alt: 'Taupe pillows in warm evening light' },
  taupeRoom: { id: '1766245456897-5c86726d084d', alt: 'Bedroom with neutral taupe pillows and bedding' },
  taupeStripe: { id: '1667915981646-3ec32877dfbf', alt: 'Bed with neutral pillows and a taupe throw' },
  charcoal: { id: '1586105251261-72a756497a11', alt: 'Black bedding with white pillows against a grey wall' },
  greyBedWindow: { id: '1506720186575-11354d325017', alt: 'White bed by the window in daylight' },

  pillowPair: { id: '1544947892-d6d2af87a2ee', alt: 'Two white pillows on a made bed' },
  pillowStack: { id: '1600414428640-f78a67c2aa3b', alt: 'Stacked white pillows with a ruffled edge' },
  pillowSingle: { id: '1620751852890-a89137ec78b9', alt: 'White pillow against a padded headboard' },
  pillowTower: { id: '1672017088948-9a26a16dd39e', alt: 'A stack of plump white pillows' },
  pillowWhite: { id: '1651936020103-65154077c003', alt: 'White pillow on soft bed linen' },
  pillowSoft: { id: '1653601983541-a70f6f1e715b', alt: 'Close-up of soft pillows by a window' },
  pillowRound: { id: '1685122121697-f4515ea401b0', alt: 'Beige round cushion on a bed' },
  pillowSquare: { id: '1629949009765-40fc74c9ec21', alt: 'Square white cushion on a knitted throw' },

  foldedLinen: { id: '1596433904747-e8b061219a71', alt: 'Folded linens in green and natural tones' },
  foldedLinen2: { id: '1596433904500-97b901c5d274', alt: 'Neatly folded soft-toned textiles' },
  makingBed: { id: '1597308451192-d17c89701ef5', alt: 'White pillows and linen in black and white' },
}

const BASE = `${import.meta.env?.BASE_URL ?? '/'}images`

/** Image keys available in the library, in registry order (used by the Admin image picker). */
export const IMAGE_KEYS = Object.keys(IMAGE_SOURCES)

/** True for an image URL (https://… or a /site/path) rather than a library key. */
export const isImageUrl = (ref) => typeof ref === 'string' && /^(https?:\/\/|\/(?!\/))\S+$/i.test(ref.trim())

/** True when `ref` is a library key or an image URL. */
export const isImageRef = (ref) => Boolean(IMAGE_SOURCES[ref]) || isImageUrl(ref)

/** Returns { src, srcSet, alt } for a key or URL. Falls back to the hero image if the key is unknown. */
export function getImage(key) {
  if (isImageUrl(key)) {
    const src = key.trim()
    return { key: src, src, srcSm: src, srcSet: undefined, alt: '' }
  }
  const entry = IMAGE_SOURCES[key] ? key : 'hero'
  return {
    key: entry,
    src: `${BASE}/${entry}-lg.jpg`,
    srcSm: `${BASE}/${entry}-sm.jpg`,
    srcSet: `${BASE}/${entry}-sm.jpg 700w, ${BASE}/${entry}-lg.jpg 1600w`,
    alt: IMAGE_SOURCES[entry].alt,
  }
}
