import { serve } from '/Users/pytro/Documents/Airsup Main/airsup-lab-skill/scripts/lib/serve.mjs'
import { launch } from '/Users/pytro/Documents/Airsup Main/airsup-lab-skill/scripts/lib/browser.mjs'
const srv = await serve('/Users/pytro/Documents/Airsup Main/airsup-lab-skill')
const { browser, page } = await launch({})
page.on('pageerror', (e) => console.log('STACK', e.stack))
await page.goto(`${srv.url}/${process.argv[2]}`)
await page.waitForTimeout(5000)
await browser.close(); srv.server.close()
