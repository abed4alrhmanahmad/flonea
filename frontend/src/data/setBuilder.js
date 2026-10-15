/**
 * Bedding Set Builder configuration.
 *
 * The builder combines items from the Signature line, which share materials and colours.
 * Compatibility comes from the catalog itself: a combination is only offered when every
 * selected item exists in that material / colour / size (see resolveComponentSelection).
 *
 * Discount rule (Full Set mode only): a duvet cover + at least one pillowcase set
 * qualifies for `discountPercent` off every item in the set. Individual Items mode is full price.
 */
export const SET_BUILDER = {
  items: [
    {
      id: 'duvet',
      productId: 'signature-duvet-cover',
      label: 'Duvet Cover',
      note: 'Sized to your bed',
      min: 0,
      max: 1,
      defaultQuantity: 1,
    },
    {
      id: 'pillowcases',
      productId: 'signature-pillowcase-set',
      label: 'Pillowcase Set (2 pcs)',
      note: 'Standard for Single–Queen, King for King–Super King',
      min: 0,
      max: 2,
      defaultQuantity: 1,
    },
    {
      id: 'pillows',
      productId: 'cloud-pillow',
      label: 'Cloud Pillow',
      note: 'White only · sized to match your pillowcases',
      min: 0,
      max: 4,
      defaultQuantity: 0,
    },
  ],
  /** Maximum pillowcase sets / pillows that make sense per bed size. */
  maxPerBedSize: {
    pillowcases: { single: 1, double: 2, queen: 2, king: 2, 'super-king': 2 },
    pillows: { single: 2, double: 4, queen: 4, king: 4, 'super-king': 4 },
  },
  fullSet: {
    discountPercent: 10,
    requiredItems: ['duvet', 'pillowcases'],
    label: 'Full Set saving',
  },
}

/** True when a set of builder components qualifies for the Full Set discount. */
export function qualifiesForSetDiscount(components) {
  return SET_BUILDER.fullSet.requiredItems.every((itemId) => {
    const item = SET_BUILDER.items.find((i) => i.id === itemId)
    return components.some((c) => c.productId === item.productId && c.quantity > 0)
  })
}

export const getBuilderDiscountPercent = (components) =>
  qualifiesForSetDiscount(components) ? SET_BUILDER.fullSet.discountPercent : 0
