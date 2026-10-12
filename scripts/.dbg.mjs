import { serve } from './lib/serve.mjs'
import { launch } from './lib/browser.mjs'
const srv = await serve(process.cwd())
const { browser, page } = await launch({})
await page.goto(`${srv.url}/${process.argv[2]}`)
await page.waitForTimeout(Number(process.argv[4] || 3000))
console.log(await page.evaluate(process.argv[3]))
await browser.close(); srv.server.close()
