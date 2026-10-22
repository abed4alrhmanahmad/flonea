/** Returns a copy of `list` with the item at `from` moved to `to` (no-op when out of range). */
export function moveItem(list, from, to) {
  if (to < 0 || to >= list.length || from === to) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export const removeAt = (list, index) => list.filter((_, i) => i !== index)
export const replaceAt = (list, index, value) => list.map((item, i) => (i === index ? value : item))

/** Lower-case, hyphenated id: "Terracotta Red" → "terracotta-red". */
export const slugify = (value) =>
  String(value ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

/** A slug that is not in `taken` (adds -2, -3 …). */
export function uniqueSlug(base, taken) {
  const root = slugify(base) || 'item'
  let candidate = root
  for (let n = 2; taken.has(candidate); n++) candidate = `${root}-${n}`
  return candidate
}

export const isEqualJson = (a, b) => JSON.stringify(a) === JSON.stringify(b)
export const deepClone = (v) => JSON.parse(JSON.stringify(v))

/** "2 minutes ago" style relative time (falls back to a date). */
export function timeAgo(iso, now = new Date()) {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const s = Math.round((now.getTime() - t) / 1000)
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`
  return new Date(t).toLocaleDateString()
}

export const formatDateTime = (iso) => {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? '' : new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** Today's date as YYYY-MM-DD (local time). */
export function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
