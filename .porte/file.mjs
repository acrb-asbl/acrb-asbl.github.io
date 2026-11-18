// FILE QUI SE REMPLIT SEULE : chaque rouge devient une tâche de correction (ticket GitHub), sans doublon.
// Usage : node .porte/file.mjs <dossier-sortie>  (lit rapport-robot.json, porte/rapport.json, alerte-valeur.md)
import fs from 'fs'
import { execFileSync } from 'child_process'
const D = process.argv[2] || 'sortie-nuit'
const gh = (...a) => execFileSync('gh', a, { encoding: 'utf8' })
for (const [n, c] of [['correction', 'd73a4a'], ['retour-arriere', 'b60205'], ['robot', '0e8a16']]) { try { gh('label', 'create', n, '--color', c, '--force') } catch {} }
const ouverts = JSON.parse(gh('issue', 'list', '--state', 'open', '--limit', '500', '--json', 'title')).map(i => i.title)
const taches = []
const lire = f => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null
const robot = lire(D + '/robot/rapport.json')
if (robot && robot.valable) for (const r of robot.rouges || []) for (const p of r.problemes) taches.push({ titre: `[robot] ${r.url} : ${p.slice(0, 90)}`, corps: `Écran : https://acrb-asbl.github.io/acrb${r.url}\nProblème : ${p}\nTrouvé par le robot universel de la nuit (lecture seule).`, labels: 'correction,robot' })
const porte = lire(D + '/porte/rapport.json')
if (porte && porte.valable) for (const r of porte.rouges || []) taches.push({ titre: `[porte] ${r.slice(0, 110)}`, corps: `Rouge trouvé par la porte sur le site en ligne${(porte.nouveaux || []).includes(r) ? ' (nouveau)' : ' (déjà connu, toléré par le cliquet)'}.\nClé : ${r}`, labels: 'correction' })
if (fs.existsSync(D + '/alerte-valeur.md')) taches.push({ titre: `[valeur] Baisse d'activité ${new Date(Date.now() - 864e5).toISOString().slice(0, 10)}`, corps: fs.readFileSync(D + '/alerte-valeur.md', 'utf8'), labels: 'retour-arriere' })
let crees = 0
for (const t of taches) { if (ouverts.includes(t.titre)) continue; gh('issue', 'create', '--title', t.titre, '--body', t.corps, '--label', t.labels); ouverts.push(t.titre); crees++ }
console.log(`${taches.length} rouge(s), ${crees} nouvelle(s) tâche(s) de correction créée(s)`)
