/**
 * Downloads the photography referenced in src/data/images.js into public/images.
 * Usage: npm run images            (skips files that already exist)
 *        npm run images -- --force (re-downloads everything)
 */
import { mkdir, writeFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { IMAGE_SOURCES } from '../src/data/images.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(root, '../public/images')
const force = process.argv.includes('--force')
const SIZES = { sm: 700, lg: 1600 }

await mkdir(outDir, { recursive: true })

const exists = (file) => access(file).then(() => true, () => false)

let failed = 0
for (const [key, { id }] of Object.entries(IMAGE_SOURCES)) {
  for (const [suffix, width] of Object.entries(SIZES)) {
    const file = path.join(outDir, `${key}-${suffix}.jpg`)
    if (!force && (await exists(file))) continue
    const url = `https://images.unsplash.com/photo-${id}?w=${width}&q=72&fm=jpg&fit=crop`
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await writeFile(file, Buffer.from(await res.arrayBuffer()))
      console.log(`✓ ${key}-${suffix}.jpg`)
    } catch (err) {
      failed++
      console.error(`✗ ${key}-${suffix}.jpg — ${err.message}`)
    }
  }
}
console.log(failed ? `${failed} download(s) failed.` : 'All images ready.')
process.exitCode = failed ? 1 : 0
