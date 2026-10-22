/** Products carrying a flag, in the Admin's chosen order (unordered ones follow in catalog order). */
export function orderedByFlag(products, flag, order = []) {
  const position = (id) => {
    const i = order.indexOf(id)
    return i === -1 ? Infinity : i
  }
  return products
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p[flag])
    .sort((a, b) => position(a.p.id) - position(b.p.id) || a.i - b.i)
    .map(({ p }) => p)
}
