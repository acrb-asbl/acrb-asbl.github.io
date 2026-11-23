// VALEUR : chiffres réels du jour d'hier (commerçants inscrits, fiches mises à jour, riverains, votes, connexions).
// Si hier < 50 % de la moyenne des 7 jours précédents, la publication d'hier est désignée pour retour arrière (fichier alerte-valeur.md).
import fs from 'fs'
import { execSync } from 'child_process'
const SB = 'https://movoukcjirtjnqjgwndw.supabase.co', CLE = 'sb_publishable_jVXX4nAfC5F0wzj_FedaAQ_WhzzN_O6'
const OUT = process.argv[2] || 'sortie-nuit'; fs.mkdirSync(OUT, { recursive: true })
const r = await fetch(SB + '/rest/v1/rpc/acrb_valeur', { method: 'POST', headers: { apikey: CLE, Authorization: 'Bearer ' + CLE, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_jours: 8 }) })
const jours = await r.json()
if (!r.ok || !Array.isArray(jours)) { console.log('VALEUR NON VALABLE : ' + JSON.stringify(jours).slice(0, 200)); process.exit(2) }
const hier = jours[1], avant = jours.slice(2, 9)
const moy = avant.reduce((s, j) => s + j.total, 0) / avant.length
fs.writeFileSync(OUT + '/valeur.json', JSON.stringify({ hier, moyenne7: moy, jours }, null, 1))
console.log(`Valeur d'hier (${hier.jour}) : ${hier.total} (inscrits ${hier.inscrits}, fiches ${hier.fiches}, riverains ${hier.riverains}, votes ${hier.votes}, connexions ${hier.connexions}) ; moyenne des 7 jours précédents : ${moy.toFixed(2)}`)
// moyenne d’au moins 1 action par jour : en dessous, une baisse n’a pas de sens statistique
if (moy >= 1 && hier.total < moy / 2) {
  let commits = ''
  try { commits = execSync(`git log HEAD --since="${hier.jour} 00:00:00 +0100" --until="${hier.jour} 23:59:59 +0100" --format="%h %s"`).toString().trim() } catch {}
  const md = `La valeur d'hier (${hier.jour}) est de ${hier.total}, sous la moitié de la moyenne des 7 jours précédents (${moy.toFixed(2)}).\n\n` +
    (commits ? `Publication(s) de ce jour désignée(s) pour retour arrière :\n\n${commits.split('\n').map(c => '- ' + c).join('\n')}\n\nRetour arrière : \`git revert --no-edit <commit>\` puis poussée sur la branche travail (la porte republie).` : `Aucune publication ce jour-là : la baisse ne vient pas d'une publication.`) +
    `\n\nDétail : ${JSON.stringify(hier)}`
  fs.writeFileSync(OUT + '/alerte-valeur.md', md); console.log('ALERTE VALEUR\n' + md); process.exit(1)
}
console.log('Valeur normale'); process.exit(0)
