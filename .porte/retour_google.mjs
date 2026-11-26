// Test de connexion « retour de Google » (faute F-JETONS-EFFACES-TROP-TOT, 23/11/2026 ; famille CONNEXION_ETAT).
// Usage : node retour_google.mjs <site>. Sort en 0 si tout est vert, en 1 sinon (bloque la porte).
// Exige : aucune erreur de page ; un GET /auth/v1/user AVANT que les jetons soient effacés de l'adresse ; l'adresse nettoyée à la fin.
import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium, devices } = require('playwright');
const base = (process.argv[2] || '').replace(/\/$/, '');
if (!base) { console.error('usage : node retour_google.mjs <site>'); process.exit(2); }
const b = await chromium.launch(); const c = await b.newContext({ ...devices['iPhone 13'], locale: 'fr-BE' }); const p = await c.newPage();
const fil = [], errs = [];
await p.exposeFunction('__fil', (x) => { fil.push(x); });
await p.addInitScript(() => { const rs = history.replaceState.bind(history); history.replaceState = function (a, t, u) { try { window.__fil('efface ' + (/access_token=/.test(String(u)) ? 'non' : 'oui')); } catch (e) {} return rs(a, t, u); }; });
p.on('request', r => { if (/\/auth\/v1\/user/.test(r.url()) && r.method() === 'GET') fil.push('user'); });
p.on('pageerror', e => errs.push(e.message));
await p.goto(base + '/espace/commercant.html#access_token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.x&refresh_token=abc&expires_in=3600&expires_at=9999999999&token_type=bearer&provider_token=z', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
const iUser = fil.indexOf('user'), iEfface = fil.indexOf('efface oui');
const R = {
  aucune_erreur_de_page: errs.length === 0,
  user_appele: iUser >= 0,
  user_avant_effacement: iUser >= 0 && (iEfface < 0 || iUser < iEfface),
  adresse_nettoyee: !/access_token=/.test(p.url()),
};
await b.close();
const ok = Object.values(R).every(Boolean);
console.log(JSON.stringify({ test: 'retour_google', ok, R, fil, errs }, null, 1));
console.log(ok ? 'RETOUR GOOGLE VERT' : 'RETOUR GOOGLE ROUGE');
process.exit(ok ? 0 : 1);
