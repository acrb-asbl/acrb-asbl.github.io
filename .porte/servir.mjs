// Serveur statique minimal pour la porte (remplace python -m http.server dans le conteneur Playwright). build by Uxlab.ai
import http from 'http'; import fs from 'fs'; import path from 'path'
const [port = '8765', racine = '.'] = process.argv.slice(2), R = path.resolve(racine)
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain' }
http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); let f = path.join(R, p)
  if (!f.startsWith(R)) { r.writeHead(403); return r.end() }
  try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html') } catch {}
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end('404') } r.writeHead(200, { 'content-type': T[path.extname(f).toLowerCase()] || 'application/octet-stream' }); r.end(d) })
}).listen(+port, () => console.log('servi sur', port))
