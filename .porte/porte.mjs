// PORTE de publication de la plateforme ACRB. Lecture seule garantie (aucune écriture ne sort du navigateur).
// 1. balayage des écrans publiés (iPhone 13 sur WebKit, Pixel 7 sur Chromium), sans session, clics sur les boutons sans effet engageant
// 2. parcours du trésorier sur l'espace privé (session et base simulées dans le navigateur : la vraie page, les vrais boutons)
// 3. aucune donnée d'essai restante dans la vraie base
// Cliquet : un rouge déjà connu (.porte/rouges-connus.json) ne bloque pas ; tout rouge nouveau bloque.
// Usage : node .porte/porte.mjs <base> <sortie>   → code 0 = vert, 1 = rouge, 2 = test non valable (site injoignable)
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
const require = createRequire(process.env.PW_PACKAGE || import.meta.url)
const { chromium, webkit, devices } = require('playwright')
const [BASE0 = 'https://acrb-asbl.github.io', OUT = 'porte-sortie'] = process.argv.slice(2)
const BASE = BASE0.replace(/\/$/, '')
const DIR = path.dirname(new URL(import.meta.url).pathname)
fs.mkdirSync(OUT, { recursive: true })
const SB = 'https://movoukcjirtjnqjgwndw.supabase.co', CLE = 'sb_publishable_jVXX4nAfC5F0wzj_FedaAQ_WhzzN_O6'
const PAGES = ['index.html', 'acrb/index.html', 'acrb/index-nl.html', 'acrb/annuaire.html', 'acrb/fiche.html', 'acrb/valider.html', 'acrb/confidentialite.html', 'espace/ca.html',
  'shopping/index.html', 'shopping/fiche.html', 'shopping/guide.html', 'quartier/index.html', 'stagiaires/index.html', 'espace/index.html', 'espace/commercant.html', 'espace/terrain.html', 'espace/signer.html']
// faute du 25/11 : le bouton « Prix de l'aide de l'IA » coupé sur ordinateur et les rubriques suivantes inaccessibles ; la porte teste aussi l'écran d'ordinateur
const PROFILS = { iphone13: [webkit, devices['iPhone 13']], android: [chromium, devices['Pixel 7']], bureau: [chromium, { viewport: { width: 1366, height: 800 }, deviceScaleFactor: 1 }] }
const DANGER = /envoyer|supprim|retir|valider|signer|payer|publier|enregistr|émettre|emettre|confirmer|google|déconnect|deconnect|inscri|ajouter|créer|creer|adhérer|adherer|commander|voter|demander|ouvrir le vote|relier|déposer|deposer|annuler|lien de connexion|invitation/i
const ECRITURE = /\/rest\/v1\/rpc\/[a-z_]*(creer|ajout|maj|inscri|signal|adher|demande|soumet|enregistr|envoy|valid|retir|regler|import|bulk|utiliser|voter|annuler|pousser|rectifier|rappels)|\/rest\/v1\/(?!rpc)|\/storage\/v1\/object\/(?!sign|public)|\/functions\/v1\//i
// clé d'un rouge pour le cliquet : sans les chiffres qui varient d'une machine à l'autre (pixels, millisecondes)
// clé stable : sans pixels ni millisecondes, et le nom du commerce cliqué (tiré au hasard) remplacé par « fiche »
const cle = (pg, pr, x) => pg + '|' + pr + '|' + x.split(':')[0] + (/^(debordement|lent)/.test(x) ? '' : '|' + x.slice(x.indexOf(':') + 1, x.indexOf(':') + 60).replace(/\s+/g, ' ').replace(/« N° [^»]*»/, '« fiche »'))
const t0 = Date.now(), rouges = [], ecrans = [], bloquees = []

// santé : si le site ne répond pas, le test n'est pas valable (on ne conclut rien)
let sante = true
for (let i = 0; i < 3; i++) { try { const r = await fetch(BASE + '/index.html'); if (r.status >= 400) sante = false } catch { sante = false } }
if (!sante) { fs.writeFileSync(OUT + '/rapport.json', JSON.stringify({ base: BASE, valable: false })); console.log('FIN NON VALABLE : site injoignable'); process.exit(2) }

async function garde(ctx) {
  await ctx.route('**/*', r => {
    const q = r.request(), m = q.method(), u = q.url()
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return r.continue()
    if (u.startsWith(SB) && !ECRITURE.test(u)) return r.continue()   // lectures par fonction (annuaire, guide…)
    bloquees.push(m + ' ' + u.replace(SB, '').split('?')[0]); return r.abort()
  })
}

// faute du 25/11 (bouton « Signaler une erreur » caché sous « Demander une modification ») : un bouton fixe à l'écran doit rester visible et touchable, jamais recouvert par un autre
const CACHES_FIXES = () => [...document.querySelectorAll('button,a[href]')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').filter(e => { let z = e; while (z && z !== document.body) { if (getComputedStyle(z).position === 'fixed') return true; z = z.parentElement } return false })
  .filter(e => { const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) return false
    return [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 6, r.top + r.height / 2], [r.right - 6, r.top + r.height / 2]].filter(([x, y]) => x >= 0 && x <= innerWidth && y >= 0 && y <= innerHeight).some(([x, y]) => { const h = document.elementFromPoint(x, y); return h && !e.contains(h) && !h.contains(e) }) })
  .map(e => (e.innerText || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 40))
async function ecran(moteur, prof, pg) {
  const ctx = await moteur.newContext({ ...prof[1], locale: 'fr-BE' }); await garde(ctx)
  const p = await ctx.newPage(); const pb = []
  p.on('console', m => { if (m.type() === 'error' && !/ERR_ABORTED|ERR_FAILED|net::|Failed to load resource|access control checks/i.test(m.text())) pb.push('console:' + m.text().slice(0, 120)) })
  p.on('pageerror', e => { if (!/maps\.googleapis|maps\/api|Could not load "util"|access control checks/i.test(e.message)) pb.push('script:' + e.message.slice(0, 120)) })
  p.on('response', s => { const u = s.url(); if (s.status() >= 400 && (u.startsWith(BASE) || u.startsWith(SB)) && !u.endsWith('/favicon.ico')) pb.push('requete:' + s.status() + ' ' + u.replace(BASE, '').replace(SB, '').split('?')[0]) })
  p.on('dialog', d => d.dismiss().catch(() => {}))
  let st = 0; const s0 = Date.now()
  try { const r = await p.goto(BASE + '/' + pg, { waitUntil: 'load', timeout: 30000 }); st = r ? r.status() : 0; await p.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {}) } catch (e) { pb.push('ouverture:' + e.message.slice(0, 80)) }
  const ms = Date.now() - s0; await p.waitForTimeout(600)
  if (st >= 400) pb.push('http:' + st)
  // faute du 25/11 : sur téléphone le navigateur élargit sa fenêtre pour englober une page trop large ; le débordement se mesure contre la largeur de l'écran
  const LARG = prof[1].viewport.width
  const m = await p.evaluate((W) => ({ texte: document.body.innerText.trim().length, debord: Math.max(document.documentElement.scrollWidth, innerWidth) - W,
    // bouton ou lien coupé par un conteneur qui défile ou masque (barre d'onglets) : on ne le voit pas, on ne l'atteint pas
    caches: [...document.querySelectorAll('a,button,[role=tab]')].filter(e => e.offsetParent !== null && e.getClientRects().length).map(e => { const r = e.getBoundingClientRect(); let a = e.parentElement
      while (a && a !== document.body) { const cs = getComputedStyle(a); if (/(auto|scroll|hidden)/.test(cs.overflowX)) { const q = a.getBoundingClientRect(); if (r.right > q.right + 2 || r.left < q.left - 2) return (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 40) } a = a.parentElement }
      return null }).filter(Boolean),
    liens: [...new Set([...document.querySelectorAll('a[href]')].map(a => a.href.split('#')[0]))] }), LARG).catch(() => ({ texte: 0, debord: 0, liens: [] }))
  for (const t of await p.evaluate(CACHES_FIXES).catch(() => [])) pb.push('bouton caché:« ' + t + ' » recouvert par un autre')
  if (m.texte < 40) pb.push('vide:ecran vide')
  if (m.debord > 2) pb.push('debordement:' + m.debord + ' px')
  // sur téléphone on fait défiler du doigt ; sur ordinateur, un bouton hors du cadre d'une barre qui défile est introuvable
  if (prof[2] === 'bureau') for (const t of [...new Set(m.caches || [])].slice(0, 5)) pb.push('bouton coupé:« ' + t + ' »')
  for (const l of m.liens) { if (!l.startsWith(BASE + '/')) continue; try { const g = await ctx.request.get(l, { timeout: 15000 }); if (g.status() >= 400) pb.push('lien:' + g.status() + ' ' + l.replace(BASE, '')) } catch { pb.push('lien:injoignable ' + l.replace(BASE, '')) } }
  const sel = 'button:visible,[role=button]:visible,summary:visible,[role=tab]:visible'
  const n = Math.min(await p.locator(sel).count().catch(() => 0), 30); let clics = 0
  for (let i = 0; i < n; i++) {
    const el = p.locator(sel).nth(i)
    let info; try { info = await el.evaluate(e => ({ t: (e.innerText || e.getAttribute('aria-label') || e.title || '').trim().slice(0, 40), sub: e.tagName === 'BUTTON' && (e.type || 'submit') === 'submit' && !!e.form })) } catch { continue }
    if (info.sub || DANGER.test(info.t)) continue
    const avant = pb.length, u0 = p.url()
    try { await el.click({ timeout: 2500 }); clics++; await p.waitForTimeout(300) } catch { continue }
    if (pb.length > avant) pb.push('clic:« ' + info.t + ' »')
    if (p.url().split('#')[0] !== u0.split('#')[0]) { await p.goto(u0, { waitUntil: 'load', timeout: 20000 }).catch(() => {}); await p.waitForTimeout(400) }
  }
  await p.screenshot({ path: `${OUT}/${prof[2]}_${pg.replace(/\//g, '_')}.png` }).catch(() => {})
  await ctx.close()
  const uniq = [...new Set(pb)]
  ecrans.push({ page: pg, profil: prof[2], http: st, ms, clics, problemes: uniq })
  for (const x of uniq) rouges.push(cle(pg, prof[2], x))
  console.log(`${uniq.length ? 'ROUGE' : 'vert '} ${prof[2].padEnd(8)} ${pg.padEnd(26)} ${st} ${ms} ms, ${clics} clics${uniq.length ? ' | ' + uniq.join(' ; ') : ''}`)
}

// parcours du trésorier : vraie page de l'espace, session et réponses de la base simulées dans le navigateur (aucune requête ne part)
async function tresorier(moteur, prof) {
  const ctx = await moteur.newContext({ ...prof[1], locale: 'fr-BE' }); const pb = []
  const user = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'robot-tresorier@example.invalid', app_metadata: { provider: 'google' }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
  const now = Math.floor(Date.now() / 1000)
  const sess = { access_token: 'robot.' + now, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'robot', user }
  await ctx.addInitScript(s => { try { localStorage.setItem('sb-movoukcjirtjnqjgwndw-auth-token', s) } catch (e) {} }, JSON.stringify(sess))
  await ctx.route(SB + '/**', r => {
    const u = r.request().url()
    if (/\/auth\/v1\/user/.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) })
    if (/\/auth\/v1\/token/.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sess) })
    if (/rpc\/acrb_mes_roles/.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['tresorier', 'ca', 'admin', 'fondateur', 'commercant', 'terrain_troncon']) })
    if (/rpc\/acrb_scrutins_liste/.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ moi: 3, en_attente: [], scrutins: [{ id: 1, titre: 'Essai porte', statut: 'ouvert', secret: true, electeurs: [{ id: 3, nom: 'Robot' }], offres: [{ id: 1, prestataire: 'Offre A', notes: [] }, { id: 2, prestataire: 'Offre B', notes: [] }], bulletins: [], cree_le: '2026-01-01T00:00:00Z' }] }) })
    if (/rpc\/acrb_note_offre/.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
    if (/rpc\/acrb_pingen_etat/.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ relie: false, courriers: [] }) })
    if (/rpc\//.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    if (/\/rest\/v1\//.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    return r.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })
  const p = await ctx.newPage()
  p.on('pageerror', e => { if (!/maps\.googleapis|maps\/api|Could not load "util"|access control checks/i.test(e.message)) pb.push('script:' + e.message.slice(0, 120)) })
  await p.goto(BASE + '/espace/index.html', { waitUntil: 'load', timeout: 30000 }).catch(e => pb.push('ouverture:' + e.message.slice(0, 80)))
  await p.waitForFunction(() => /Trésorier/.test((document.getElementById('who_s') || {}).innerText || '') && (document.getElementById('co_lien') || {}).innerText !== 'Chargement…', null, { timeout: 20000 }).catch(() => {})
  await p.waitForTimeout(800)
  // chaque rubrique s'atteint par le menu, comme un humain : la section, puis la rubrique ; on vérifie qu'elle s'affiche
  const vis = id => p.evaluate(i => { const x = document.getElementById(i); return !!x && x.offsetParent !== null }, id).catch(() => false)
  const ouvrir = async id => {
    const h = await p.evaluate(i => { const a = document.querySelector('.nv [data-nav-go="' + i + '"]'); return a ? a.getAttribute('href') : '' }, id).catch(() => '')
    if (!h) return vis(id)
    const sec = h.split('/').slice(0, 2).join('/')
    try { await p.click(`.nv .r1 a[href="${sec}"]`, { timeout: 4000 }); await p.waitForTimeout(150)
      if (await p.isVisible(`.nv .r2 a[href="${h}"]`)) { await p.click(`.nv .r2 a[href="${h}"]`, { timeout: 4000 }); await p.waitForTimeout(150) } } catch (e) { pb.push('menu:' + id + ' inaccessible') }
    return vis(id)
  }
  const v = await p.evaluate(() => ({ acces: (document.getElementById('who_s') || {}).innerText || '', treso: document.body.classList.contains('treso'), menu: !!document.querySelector('.nv:not([hidden]) .r1 a') })).catch(() => ({}))
  if (!v.menu) pb.push('menu:absent')
  v.cotisations = await ouvrir('c_fac'); v.facturer = await vis('facadd')
  v.votes = await ouvrir('c_votes')
  // faute du 18/11 : un bouton qui agit sans rien montrer près de lui passe pour mort. Chaque bouton d'enregistrement doit afficher sa confirmation à côté de lui.
  try { await p.fill('#vo_nt_1', 'note de la porte'); await p.click('[data-note="1"]', { timeout: 4000 })
    await p.waitForFunction(() => { const e = document.getElementById('vo_nok_1'); if (!e || !/Enregistrée/.test(e.innerText)) return false; const r = e.getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.bottom <= innerHeight }, null, { timeout: 6000 })
  } catch (e) { pb.push('bouton muet:Enregistrer ma note (aucune confirmation visible à côté)') }
  v.courrier = await ouvrir('c_courrier'); v.relier = (await vis('co_form')) || await p.evaluate(() => (document.getElementById('co_cfg') || {}).open === true).catch(() => false)
  v.debord = await p.evaluate((W) => Math.max(document.documentElement.scrollWidth, innerWidth) - W, prof[1].viewport.width).catch(() => 0)
  for (const t of await p.evaluate(CACHES_FIXES).catch(() => [])) pb.push('bouton caché:« ' + t + ' » recouvert par un autre')
  // faute du 25/11 : chaque section du menu, puis chacune de ses rubriques, doit être visible en entier et cliquable (pas coupée, pas cachée sous un défilement)
  const sections = await p.$$eval('.nv .r1 a', l => l.map(a => a.getAttribute('href'))).catch(() => [])
  for (const sec of sections) {
    try { await p.click(`.nv .r1 a[href="${sec}"]`, { timeout: 4000 }); await p.waitForTimeout(200) } catch { pb.push('menu:section « ' + sec + ' » non cliquable'); continue }
    const coupes = await p.evaluate(() => { const nv = document.querySelector('.nv'), q = nv.getBoundingClientRect()
      return [...nv.querySelectorAll('.r2 a')].filter(a => a.offsetParent !== null).filter(a => { const r = a.getBoundingClientRect(); let z = a.parentElement, coupe = r.right > q.right + 1 || r.left < q.left - 1
        while (!coupe && z && z !== nv) { const cs = getComputedStyle(z); if (/(auto|scroll|hidden)/.test(cs.overflowX)) { const w = z.getBoundingClientRect(); coupe = r.right > w.right + 1 || r.left < w.left - 1 } z = z.parentElement }
        return coupe }).map(a => a.innerText.trim().slice(0, 40)) }).catch(() => [])
    for (const t of coupes) pb.push('menu:rubrique coupée ou inaccessible « ' + t + ' »')
    // récidive du 25/11 : chaque onglet, rubrique, bouton, lien, liste ou volet visible doit avoir son petit carré d'explication au survol
    const rubs = await p.$$eval('.nv .r2 a', l => l.map(a => a.getAttribute('href'))).catch(() => [])
    for (const r of (rubs.length ? rubs : [null])) {
      if (r) { await p.click(`.nv .r2 a[href="${r}"]`, { timeout: 3000 }).catch(() => {}); await p.waitForTimeout(350) }
      const sans = await p.evaluate(() => [...document.querySelectorAll('a[href],button,summary,select,[role=tab]')].filter(e => e.offsetParent !== null && e.getClientRects().length && !e.closest('[data-aide]') && !e.classList.contains('aide-btn')).map(e => (e.innerText || e.getAttribute('aria-label') || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 40))).catch(() => [])
      for (const t of sans.slice(0, 5)) pb.push('sans explication au survol:« ' + t + ' » (' + (r || sec) + ')')
      // faute du 25/11 : champ ou bouton écrasé (trop étroit pour être lu ou tapé, texte qui déborde de son bouton)
      const ecrases = await p.evaluate(() => [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=file]),select,textarea,button,a.btn')].filter(e => e.offsetParent !== null && e.getClientRects().length).filter(e => { const r = e.getBoundingClientRect(); if (r.width < 1) return false
        const t = (e.innerText || e.placeholder || '').trim(); return (/INPUT|SELECT|TEXTAREA/.test(e.tagName) ? (r.width < 56 || r.height < 30) : (r.width < 24 && t.length > 2)) || (e.tagName !== 'INPUT' && e.tagName !== 'SELECT' && e.tagName !== 'TEXTAREA' && e.scrollWidth > e.clientWidth + 3) }).map(e => (e.innerText || e.placeholder || e.name || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 40))).catch(() => [])
      for (const t of ecrases.slice(0, 5)) pb.push('élément écrasé:« ' + t + ' » (' + (r || sec) + ')')
    }
  }
  if (!/Trésorier/.test(v.acces || '')) pb.push('tresorier:rôle non affiché')
  if (!v.treso) pb.push('tresorier:mode trésorier inactif')
  if (!v.cotisations || !v.facturer) pb.push('tresorier:facturation invisible')
  if (!v.votes) pb.push('tresorier:votes invisibles')
  if (!v.courrier || !v.relier) pb.push('tresorier:courrier postal invisible')
  if (v.debord > 2) pb.push('debordement:' + v.debord + ' px')
  await p.screenshot({ path: `${OUT}/${prof[2]}_parcours_tresorier.png` }).catch(() => {})
  await ctx.close()
  ecrans.push({ page: 'parcours-tresorier', profil: prof[2], etat: v, problemes: pb })
  for (const x of pb) rouges.push(cle('parcours-tresorier', prof[2], x))
  console.log(`${pb.length ? 'ROUGE' : 'vert '} ${prof[2].padEnd(8)} parcours du trésorier${pb.length ? ' | ' + pb.join(' ; ') : ''}`)
}


// récidive du 26/11 (barre d'onglets de « Mon espace commerçant » coupée sur ordinateur : « Mes coordonnées » et « Historique » hors cadre) :
// les écrans CONNECTÉS n'étaient jamais regardés par la porte. Chaque espace connecté est ouvert avec une session simulée, chaque onglet
// est ouvert, et les mêmes contrôles visuels s'appliquent : débordement, bouton coupé par son conteneur, bouton caché, élément écrasé.
const ESPACE_COM = { personnes: [{ id: '00000000-0000-4000-8000-0000000000a1', nom: 'Robot Porte', prenom: 'Robot', email: 'robot-connecte@example.invalid', gsm: '+32400000000', langue: 'fr' }],
  magasins: [{ id: '00000000-0000-4000-8000-0000000000b1', enseigne: 'Commerce de la porte', rue: 'Rue de Brabant', numero: '1', code_postal: '1030', commune: 'Schaerbeek', rubrique: 'Mode', statut: 'actif', valide: false, cree_le: '2026-11-01T10:00:00Z' }],
  societes: [{ id: '00000000-0000-4000-8000-0000000000c1', denomination: 'Société de la porte', forme: 'SRL', bce: '0000.000.000' }], photos: [], factures: [], versions: [], journal: [], reglages: {} }
const CONNECTES = [['espace/commercant.html', ['commercant'], { acrb_mon_espace: ESPACE_COM }], ['espace/terrain.html', ['ca', 'admin'], {}]]
async function connecte(moteur, prof, pg, roles, rep) {
  const ctx = await moteur.newContext({ ...prof[1], locale: 'fr-BE' }); const pb = []
  const user = { id: '00000000-0000-4000-8000-000000000002', aud: 'authenticated', role: 'authenticated', email: 'robot-connecte@example.invalid', app_metadata: { provider: 'google' }, user_metadata: { full_name: 'Robot Porte' }, created_at: '2026-01-01T00:00:00Z' }
  const now = Math.floor(Date.now() / 1000), sess = { access_token: 'robot.' + now, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'robot', user }
  await ctx.addInitScript(s => { try { localStorage.setItem('sb-movoukcjirtjnqjgwndw-auth-token', s) } catch (e) {} }, JSON.stringify(sess))
  await ctx.route(SB + '/**', r => { const u = r.request().url(), j = o => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) })
    if (/\/auth\/v1\/user/.test(u)) return j(user); if (/\/auth\/v1\/token/.test(u)) return j(sess); if (/rpc\/acrb_mes_roles/.test(u)) return j(roles)
    const f = (u.match(/rpc\/([a-z_]+)/) || [])[1]; if (f && rep && rep[f] !== undefined) return j(rep[f])
    if (/rpc\//.test(u) || /\/rest\/v1\//.test(u)) return j([]); return j({}) })
  const p = await ctx.newPage()
  p.on('pageerror', e => { if (!/maps\.googleapis|maps\/api|Could not load "util"|access control checks/i.test(e.message)) pb.push('script:' + e.message.slice(0, 120)) })
  await p.goto(BASE + '/' + pg, { waitUntil: 'load', timeout: 30000 }).catch(e => pb.push('ouverture:' + e.message.slice(0, 80)))
  await p.waitForTimeout(2500)
  const W = prof[1].viewport.width
  const regarde = async (ou) => {
    const m = await p.evaluate((W) => ({ debord: Math.max(document.documentElement.scrollWidth, innerWidth) - W,
      coupes: [...document.querySelectorAll('a,button,[role=tab]')].filter(e => e.offsetParent !== null && e.getClientRects().length).map(e => { const r = e.getBoundingClientRect(); let a = e.parentElement
        while (a && a !== document.body) { const cs = getComputedStyle(a); if (/(auto|scroll|hidden)/.test(cs.overflowX) && !/(x|both)/.test(cs.scrollSnapType || '')) { const q = a.getBoundingClientRect(); if (r.right > q.right + 2 || r.left < q.left - 2) return (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 40) } a = a.parentElement }
        return null }).filter(Boolean),
      ecrases: [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=file]),select,textarea,button,a.btn')].filter(e => e.offsetParent !== null && e.getClientRects().length).filter(e => { const r = e.getBoundingClientRect(); const t = (e.innerText || e.placeholder || '').trim()
        return (/INPUT|SELECT|TEXTAREA/.test(e.tagName) ? (r.width < 56 || r.height < 30) : (r.width < 24 && t.length > 2)) || (!/INPUT|SELECT|TEXTAREA/.test(e.tagName) && e.scrollWidth > e.clientWidth + 3) }).map(e => (e.innerText || e.placeholder || e.name || e.tagName).trim().slice(0, 40)) }), W).catch(() => ({ debord: 0, coupes: [], ecrases: [] }))
    if (m.debord > 2) pb.push('debordement:' + m.debord + ' px (' + ou + ')')
    for (const t of [...new Set(m.coupes)].slice(0, 5)) pb.push('bouton coupé:« ' + t + ' » (' + ou + ')')
    for (const t of [...new Set(m.ecrases)].slice(0, 5)) pb.push('élément écrasé:« ' + t + ' » (' + ou + ')')
    for (const t of await p.evaluate(CACHES_FIXES).catch(() => [])) pb.push('bouton caché:« ' + t + ' » recouvert par un autre (' + ou + ')')
  }
  await regarde('ouverture')
  const onglets = await p.$$eval('[role=tab],.tabs button', l => l.filter(e => e.offsetParent !== null).map((e, i) => i)).catch(() => [])
  for (const i of onglets.slice(0, 15)) { try { await p.locator('[role=tab]:visible,.tabs button:visible').nth(i).click({ timeout: 3000 }); await p.waitForTimeout(350); await regarde('onglet ' + (i + 1)) } catch { pb.push('onglet:' + (i + 1) + ' non cliquable') } }
  await p.screenshot({ path: `${OUT}/${prof[2]}_connecte_${pg.replace(/\//g, '_')}.png` }).catch(() => {})
  await ctx.close()
  const uniq = [...new Set(pb)]
  ecrans.push({ page: 'connecte:' + pg, profil: prof[2], problemes: uniq })
  for (const x of uniq) rouges.push(cle('connecte:' + pg, prof[2], x))
  console.log(`${uniq.length ? 'ROUGE' : 'vert '} ${prof[2].padEnd(8)} connecté ${pg}${uniq.length ? ' | ' + uniq.join(' ; ') : ''}`)
}

const wk = await webkit.launch(), ch = await chromium.launch()
setTimeout(() => { console.log('FIN ROUGE : la porte a dépassé 20 minutes'); process.exit(1) }, 20 * 60 * 1000).unref()
const moteurs = { iphone13: wk, android: ch, bureau: ch }
for (const [k, v] of Object.entries(PROFILS)) v[2] = k
const jobs = []
for (const k of Object.keys(PROFILS)) { if (process.env.PORTE_SEUL === 'connecte') { for (const [pg, ro, rep] of CONNECTES) jobs.push(() => connecte(moteurs[k], PROFILS[k], pg, ro, rep)); continue }
  for (const pg of PAGES) jobs.push(() => ecran(moteurs[k], PROFILS[k], pg)); jobs.push(() => tresorier(moteurs[k], PROFILS[k])); for (const [pg, ro, rep] of CONNECTES) jobs.push(() => connecte(moteurs[k], PROFILS[k], pg, ro, rep)) }
// chaque écran a 2 minutes au plus : un écran qui fige devient un rouge, jamais une porte bloquée
const delai = (f, n) => { let t; return Promise.race([f(), new Promise(r => { t = setTimeout(() => { rouges.push('delai|' + n + '|fige'); console.log('ROUGE délai dépassé ' + n); r() }, 120000) })]).finally(() => clearTimeout(t)) }
let i = 0; await Promise.all(Array.from({ length: 4 }, async () => { while (i < jobs.length) { const k = i++; await delai(jobs[k], 'tache-' + k) } }))
await wk.close(); await ch.close()

// données d'essai restantes dans la vraie base
let essais = null
try { const r = await fetch(SB + '/rest/v1/rpc/acrb_essais_restants', { method: 'POST', headers: { apikey: CLE, Authorization: 'Bearer ' + CLE, 'Content-Type': 'application/json' }, body: '{}' })
  essais = await r.json(); if (!r.ok) throw new Error(JSON.stringify(essais)) } catch (e) { rouges.push('base|-|essais|vérification impossible'); console.log('ROUGE données d’essai : vérification impossible ' + e.message) }
if (essais) { const reste = Object.entries(essais).filter(([, n]) => n > 0); for (const [k, n] of reste) rouges.push('base|-|essais|' + k); console.log(`${reste.length ? 'ROUGE' : 'vert '} données d'essai restantes : ${JSON.stringify(essais)}`) }
// contrôle des comptes (ordre du cerveau 302, B4) : SIGNAL orange, non bloquant, tant que le fondateur n'a pas décidé la recopie des comptes (B5)
let comptes = null
try { const r = await fetch(SB + '/rest/v1/rpc/acrb_porte_comptes', { method: 'POST', headers: { apikey: CLE, Authorization: 'Bearer ' + CLE, 'Content-Type': 'application/json' }, body: '{}' })
  comptes = await r.json(); if (!r.ok) throw new Error(JSON.stringify(comptes)) } catch (e) { comptes = null; console.log('ORANGE comptes : vérification impossible ' + e.message) }
if (comptes) console.log(`${comptes.acces_sans_compte > 0 ? 'ORANGE' : 'vert  '} comptes : ${comptes.comptes} compte(s), ${comptes.acces_actifs} accès actif(s), ${comptes.acces_sans_compte} accès sans compte (signal, non bloquant)`)
if (bloquees.length) console.log('écritures bloquées par la garde : ' + [...new Set(bloquees)].join(', '))

// cliquet
const connus = fs.existsSync(DIR + '/rouges-connus.json') ? JSON.parse(fs.readFileSync(DIR + '/rouges-connus.json', 'utf8')) : []
const nouveaux = [...new Set(rouges)].filter(r => !connus.includes(r))
const gueris = connus.filter(r => !rouges.includes(r))
fs.writeFileSync(OUT + '/rapport.json', JSON.stringify({ base: BASE, valable: true, secondes: Math.round((Date.now() - t0) / 1000), ecrans, rouges: [...new Set(rouges)], nouveaux, gueris, ecrituresBloquees: [...new Set(bloquees)], essais, comptes }, null, 1))
fs.writeFileSync(OUT + '/nouveaux.txt', nouveaux.join('\n'))
console.log(`FIN ${nouveaux.length ? 'ROUGE' : 'VERT'} : ${ecrans.length} écrans, ${rouges.length} rouge(s) dont ${nouveaux.length} nouveau(x), ${gueris.length} guéri(s), ${bloquees.length} écriture(s) bloquée(s), ${Math.round((Date.now() - t0) / 1000)} s`)
if (nouveaux.length) console.log('NOUVEAUX ROUGES :\n' + nouveaux.join('\n'))
process.exit(nouveaux.length ? 1 : 0)
