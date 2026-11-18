// Attend que GitHub Pages serve exactement les fichiers de ce commit (empreintes identiques), 12 minutes au plus.
import fs from 'fs'
import crypto from 'crypto'
const BASE = 'https://acrb-asbl.github.io'
const F = ['index.html', 'espace/index.html', 'shopping/index.html', 'acrb/index.html', 'quartier/index.html']
const h = b => crypto.createHash('sha256').update(b).digest('hex')
const attendu = Object.fromEntries(F.map(f => [f, h(fs.readFileSync(f))]))
const fin = Date.now() + 12 * 60 * 1000
while (Date.now() < fin) {
  let ok = 0
  for (const f of F) { try { const r = await fetch(`${BASE}/${f}?v=${Date.now()}`, { cache: 'no-store' }); if (h(Buffer.from(await r.arrayBuffer())) === attendu[f]) ok++ } catch {} }
  console.log(`${new Date().toISOString()} ${ok}/${F.length} fichiers en ligne`)
  if (ok === F.length) process.exit(0)
  await new Promise(r => setTimeout(r, 20000))
}
console.log('La mise en ligne n’est pas arrivée à temps'); process.exit(2)
