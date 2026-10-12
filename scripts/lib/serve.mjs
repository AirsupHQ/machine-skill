// Tiny static file server on a free port (pages load three.js from the CDN; the kit and assets from here).
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.hdr': 'application/octet-stream', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2' }
export function serve(root, port = 0) {
  return new Promise((ok) => {
    const s = createServer(async (req, res) => {
      try {
        let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '')
        let f = join(root, p)
        if ((await stat(f)).isDirectory()) f = join(f, 'index.html')
        res.writeHead(200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
        res.end(await readFile(f))
      } catch { res.writeHead(404); res.end('not found') }
    })
    s.listen(port, '127.0.0.1', () => ok({ server: s, port: s.address().port, url: `http://127.0.0.1:${s.address().port}` }))
  })
}
