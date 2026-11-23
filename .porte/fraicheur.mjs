// Contrôle de fraîcheur des contenus (parade de la faute du 23/11/2026 : Quartier Nord resté à 3 brèves pendant 15 jours).
// Rouge si le site Quartier Nord a publié moins de MIN brèves sur 7 jours, ou si le guide a moins de MIN_GUIDE adresses.
// Un rouge ouvre un ticket « correction » (une seule fois tant qu'il est ouvert) et sort en code 1.
import { etiquette, titresOuverts, ticket } from './github.mjs'
const URL = 'https://blaehmatdmobhwlhqfjo.supabase.co/rest/v1/', KEY = 'sb_publishable_c1ovcVD1pbOGPedrJfDU3g_jtS1bY73'
const MIN = +(process.env.FRAICHEUR_MIN || 5), MIN_GUIDE = +(process.env.FRAICHEUR_GUIDE || 40)
const get = async q => { const r = await fetch(URL + q, { headers: { apikey: KEY, prefer: 'count=exact', range: '0-0' } }); return +((r.headers.get('content-range') || '/0').split('/')[1] || 0) }
const depuis = new Date(Date.now() - 7 * 864e5).toISOString()
const breves = await get('acrb_quartier_posts?select=id&statut=eq.publie&cree_le=gte.' + depuis)
const guide = await get('acrb_guide?select=id')
const rouges = []
if (breves < MIN) rouges.push(`Quartier Nord : ${breves} brève(s) publiée(s) en 7 jours (minimum ${MIN}).`)
if (guide < MIN_GUIDE) rouges.push(`Guide du quartier : ${guide} adresse(s) (minimum ${MIN_GUIDE}).`)
console.log(JSON.stringify({ breves_7j: breves, guide, rouges }))
if (rouges.length && process.env.GH_TOKEN) {
  const titre = 'Contenus pas assez frais (Quartier Nord / guide)'
  if (!(await titresOuverts()).includes(titre)) { await etiquette('correction', 'b60205'); await ticket(titre, rouges.join('\n'), ['correction']) }
}
process.exit(rouges.length ? 1 : 0)
