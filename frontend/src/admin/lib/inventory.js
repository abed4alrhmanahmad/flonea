/**
 * Inventory rows and summaries derived from the editable catalog. One row per variant combination
 * of every single-item product (combinations removed by a restriction rule are not stock-keeping
 * units, so they are left out). Ready-made sets have no stock of their own: it is derived from the
 * products they contain.
 *
 * Stock is never deducted automatically — neither by carts nor by demo orders (the demo checkout
 * never did). Quantities only change when someone edits them here or in the product editor.
 */
import { listCombinations, optionLabel, variantSku } from '../../lib/variants.js'

export const stockState = (stock, threshold) => (stock <= 0 ? 'out' : stock <= threshold ? 'low' : 'in')

export function inventoryRows(products, processedById, threshold) {
  const rows = []
  for (const product of products) {
    if (product.bundle) continue
    const processed = processedById[product.id]
    for (const c of listCombinations(product)) {
      if (c.restricted) continue
      const selection = { material: c.material, color: c.color, size: c.size }
      rows.push({
        id: `${product.id}::${c.key}`,
        productId: product.id,
        product,
        processed,
        key: c.key,
        selection,
        label: [optionLabel(processed, 'size', c.size), optionLabel(processed, 'material', c.material), optionLabel(processed, 'color', c.color)].join(' / '),
        sku: variantSku(product, selection),
        stock: c.stock,
        stockOverride: c.stockOverride,
        offered: c.offered,
        price: c.price,
        state: c.offered ? stockState(c.stock, threshold) : 'off',
      })
    }
  }
  return rows
}

/** Counts per state, plus which active products are low / fully sold out (offered variants only). */
export function inventorySummary(rows) {
  const counts = { in: 0, low: 0, out: 0, off: 0 }
  const byProduct = new Map()
  for (const r of rows) {
    counts[r.state] += 1
    if (r.product.status !== 'active' || !r.offered) continue
    const entry = byProduct.get(r.productId) ?? { product: r.product, offered: 0, out: 0, low: 0 }
    entry.offered += 1
    if (r.state === 'out') entry.out += 1
    if (r.state === 'low') entry.low += 1
    byProduct.set(r.productId, entry)
  }
  const entries = [...byProduct.values()]
  return {
    counts,
    offered: counts.in + counts.low + counts.out,
    lowProducts: entries.filter((e) => e.low > 0),
    soldOutProducts: entries.filter((e) => e.offered > 0 && e.out === e.offered),
    productsWithSoldOutVariants: entries.filter((e) => e.out > 0),
  }
}
