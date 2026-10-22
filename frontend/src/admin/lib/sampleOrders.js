/**
 * SAMPLE orders for trying the Orders screens. They are flagged `sample: true`, labelled "Sample"
 * everywhere, use example.com addresses and are never counted as demo sales. They are built from
 * the current catalog with the real pricing code, so totals are consistent.
 */
import { calculateTotals, getShippingMethods, resolveCartLine } from '../../lib/pricing.js'
import { makeCustomSetLine, roleForProduct } from '../../lib/customSet.js'
import { getDefaultSelection } from '../../lib/variants.js'

const CUSTOMERS = [
  { firstName: 'Sample', lastName: 'Customer A', email: 'sample.a@example.com', phone: '+961 70 000 001', city: 'Beirut', country: 'Lebanon' },
  { firstName: 'Sample', lastName: 'Customer B', email: 'sample.b@example.com', phone: '+971 50 000 002', city: 'Dubai', country: 'United Arab Emirates' },
  { firstName: 'Sample', lastName: 'Customer C', email: 'sample.c@example.com', phone: '+33 6 00 00 00 03', city: 'Paris', country: 'France' },
]

const toItem = (l) => ({
  type: l.type,
  productId: l.productId ?? '',
  name: l.name,
  quantity: l.quantity,
  unitPrice: l.unitPrice,
  total: l.lineTotal,
  imageKey: l.imageKey,
  options: l.type === 'custom-set' ? l.components.map((c) => `${c.quantity} × ${c.name} (${c.details})`).join(' + ') : l.options.map((o) => o.value).join(' · '),
  components: l.type === 'custom-set' ? l.components.map((c) => ({ role: c.role, roleLabel: c.roleLabel, productId: c.productId, name: c.name, quantity: c.quantity, unitPrice: c.unitPrice, details: c.details })) : [],
})

export function buildSampleOrders(catalog, now = new Date()) {
  const inStock = (p) => p.variants.some((v) => v.stock > 0)
  const products = catalog.products.filter(inStock)
  const single = products.find((p) => !p.isBundle && p.category === 'duvet-covers')
  const pillow = products.find((p) => roleForProduct(p)?.id === 'pillow')
  const duvet = products.find((p) => roleForProduct(p)?.id === 'duvet' && p.id !== single?.id) ?? single
  const readyMade = products.find((p) => p.isBundle)
  const line = (product, quantity = 1, type = product?.isBundle ? 'set' : 'product') => product && resolveCartLine({ type, productId: product.id, selection: getDefaultSelection(product), quantity })
  const customSet =
    pillow && duvet
      ? resolveCartLine(
          makeCustomSetLine({
            pillow: { productId: pillow.id, selection: getDefaultSelection(pillow), quantity: 2 },
            duvet: { productId: duvet.id, selection: getDefaultSelection(duvet), quantity: 1 },
          }),
        )
      : null

  const methods = getShippingMethods()
  const baskets = [
    { lines: [line(single), line(pillow, 2)], status: 'delivered', daysAgo: 9, method: methods[0] },
    { lines: [customSet], status: 'processing', daysAgo: 3, method: methods[1] ?? methods[0] },
    { lines: [line(readyMade)], status: 'placed', daysAgo: 0, method: methods[0] },
  ]

  return baskets
    .map((b) => ({ ...b, lines: b.lines.filter((l) => l && l.quantity > 0) }))
    .filter((b) => b.lines.length && b.method)
    .map((b, i) => {
      const customer = CUSTOMERS[i]
      const totals = calculateTotals(b.lines, b.method.id)
      const createdAt = new Date(now.getTime() - b.daysAgo * 86400000 - (i + 1) * 3600000).toISOString()
      const number = `SAMPLE-${1001 + i}`
      return {
        id: number,
        number,
        createdAt,
        status: b.status,
        sample: true,
        customer: { email: customer.email, phone: customer.phone, firstName: customer.firstName, lastName: customer.lastName },
        shippingAddress: { address: '1 Example Street', apartment: '', city: customer.city, postalCode: '', country: customer.country },
        shippingMethod: { id: b.method.id, name: b.method.name, eta: b.method.eta, price: totals.shipping },
        notes: 'Sample order for interface testing — not a real order.',
        items: b.lines.map(toItem),
        totals,
        history: [
          { at: createdAt, status: 'placed', note: 'Sample order created for interface testing.' },
          ...(b.status !== 'placed' ? [{ at: createdAt, status: b.status, note: 'Sample status.' }] : []),
        ],
      }
    })
}
