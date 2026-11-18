// Accès minimal à l'API GitHub (étiquettes, tickets) avec GH_TOKEN, sans le CLI gh. build by Uxlab.ai
const R = process.env.GITHUB_REPOSITORY || 'acrb-asbl/acrb-asbl.github.io', T = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
async function api(m, p, b) { const r = await fetch('https://api.github.com/repos/' + R + p, { method: m, headers: { authorization: 'Bearer ' + T, accept: 'application/vnd.github+json', 'content-type': 'application/json', 'user-agent': 'porte-acrb' }, body: b ? JSON.stringify(b) : undefined }); if (!r.ok && r.status !== 422) throw new Error(m + ' ' + p + ' ' + r.status + ' ' + (await r.text()).slice(0, 200)); return r.status === 204 ? null : r.json() }
export const etiquette = (name, color) => api('POST', '/labels', { name, color }).catch(() => null)
export async function titresOuverts() { const t = []; for (let p = 1; p <= 5; p++) { const l = await api('GET', '/issues?state=open&per_page=100&page=' + p); t.push(...l.map(i => i.title)); if (l.length < 100) break } return t }
export const ticket = (title, body, labels) => api('POST', '/issues', { title, body, labels })
// usage en ligne de commande : node .porte/github.mjs ticket "<titre>" "<corps>" "lab1,lab2"
if (process.argv[2] === 'ticket') { const [, , , ti, co, la] = process.argv; const ls = (la || '').split(',').filter(Boolean); for (const l of ls) await etiquette(l, 'b60205'); await ticket(ti, co, ls); console.log('ticket créé') }
