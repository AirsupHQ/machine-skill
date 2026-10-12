// rec-guard: never let a magenta frame reach a film.
// Headless Chromium returns a SOLID #FF00FF screenshot when its GPU process stalls or dies under
// memory pressure. Every page.screenshot() is checked: solid magenta is retried after the page renders
// again and throws after 8 tries (nothing is written); a frame that is more than 25 % pink is retried
// and kept only if it comes back identical (a real pink scene). { path } writes are atomic.
import { writeFileSync, renameSync } from 'node:fs'
import { decodePNG, pinkStats } from './png.mjs'
const RETRIES = 8
export function guardPage(page) {
  if (page.__guarded) return page
  const orig = page.screenshot.bind(page)
  page.screenshot = async (opts = {}) => {
    const { path, type, quality, ...rest } = opts
    let prev = null
    for (let k = 0; ; k++) {
      const png = await orig({ ...rest, type: 'png' })
      const s = pinkStats(decodePNG(png))
      const bad = s.solid > 0.5 ? 'solid magenta' : s.pink > 0.25 ? 'pink' : null
      const same = prev && prev.equals(png)
      if (!bad || (bad === 'pink' && same) || (bad === 'pink' && k >= RETRIES)) {
        let out = png
        if (type === 'jpeg') out = await orig({ ...rest, type: 'jpeg', quality: quality ?? 92 })
        if (path) { const tmp = `${path}.tmp-${process.pid}`; writeFileSync(tmp, out); renameSync(tmp, path) }
        return out
      }
      if (k >= RETRIES) throw new Error(`rec-guard: solid magenta frame persisted after ${RETRIES} retries; not written`)
      console.log(`rec-guard: ${bad} frame, retry ${k + 1}`)
      prev = png
      await page.waitForTimeout(250 * (k + 1)).catch(() => {})
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))).catch(() => {})
    }
  }
  page.__guarded = true
  return page
}
