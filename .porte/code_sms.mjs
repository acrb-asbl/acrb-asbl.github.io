import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium, devices } = require('playwright');
const base=(process.argv[2]||'').replace(/\/$/,''), o=process.argv[3]||'code_sms'; if(!base){console.error('usage : node code_sms.mjs <site> [sortie]');process.exit(2);} const b=await chromium.launch(); const c=await b.newContext({...devices['iPhone 13'],locale:'fr-BE'}); const p=await c.newPage();
const appels=[]; const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.route('**/functions/v1/acrb-verif',async r=>{const d=JSON.parse(r.request().postData()||'{}');appels.push(d.action+(d.appareil?'+appareil':''));
  let body; if(d.action==='start') body=d.appareil?{ok:true,jeton:'11111111-1111-1111-1111-111111111111',sans_sms:true}:{ok:true,envoye_le:new Date().toISOString()};
  else body={ok:true,jeton:'22222222-2222-2222-2222-222222222222',appareil:'33333333-3333-3333-3333-333333333333'};
  r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(body)});});
await p.route('**/rpc/acrb_revendiquer2',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({statut:'appliquee',message:'C’est fait (essai).'})}));
const R={};
await p.goto(base+'/shopping/#c-2341579307',{waitUntil:'networkidle'}); await p.waitForTimeout(1500);
await p.click('button.rv-claim'); await p.waitForTimeout(300);
await p.evaluate(()=>{[...document.querySelectorAll('.rv-ch')][1].click();}); await p.waitForTimeout(300);
await p.evaluate(()=>{const r=document.querySelector('input[name=rv_qui]');if(r)r.click();}); await p.fill('#rv_gsm','0484400756');
await p.evaluate(()=>document.querySelector('#rv_f button[type=submit]').click()); await p.waitForTimeout(800);
R.etape3=!!await p.$('#rv_code'); R.texte=await p.evaluate(()=>document.querySelector('#rv_v')?.innerText.replace(/\s+/g,' ').slice(0,160));
// clic à côté
await p.mouse.click(195,60); await p.waitForTimeout(300); R.apresClicCote=!!await p.$('#rv_code');
await p.keyboard.press('Escape'); await p.waitForTimeout(300); R.apresEchap=!!await p.$('#rv_code');
await p.click('.rv-x'); await p.waitForTimeout(300); R.confirmation=await p.evaluate(()=>document.getElementById('rv_ab')?.innerText.replace(/\s+/g,' '));
await p.click('#rv_ab_non'); R.apresContinuer=!!await p.$('#rv_code');
await p.screenshot({path:o+'-code.png'});
// recharger la page
await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(1800); R.apresRecharge=!!await p.$('#rv_code'); R.texteRecharge=await p.evaluate(()=>document.querySelector('#rv_v')?.innerText.replace(/\s+/g,' ').slice(0,120));
// abandonner puis redemander : pas de nouvel envoi
await p.click('.rv-x'); await p.click('#rv_ab_oui'); await p.waitForTimeout(200);
await p.click('button.rv-claim'); await p.waitForTimeout(500); R.redemande=!!await p.$('#rv_code');
// valider un code : appareil mémorisé
await p.fill('#rv_code','123456'); await p.waitForTimeout(1200); R.fini=await p.evaluate(()=>document.querySelector('.rv-done')?.innerText.replace(/\s+/g,' '));
R.appareil=await p.evaluate(()=>localStorage.getItem('acrb_appareil'));
// nouvelle demande sur le même appareil : pas de SMS
await p.evaluate(()=>{localStorage.removeItem('acrb_rev_attente');window.REVEND.fermer();});
await p.click('button.rv-claim'); await p.waitForTimeout(300); await p.evaluate(()=>{[...document.querySelectorAll('.rv-ch')][1].click();}); await p.waitForTimeout(300);
await p.evaluate(()=>{const r=document.querySelector('input[name=rv_qui]');if(r)r.click();}); await p.fill('#rv_gsm','0484400756');
await p.evaluate(()=>document.querySelector('#rv_f button[type=submit]').click()); await p.waitForTimeout(1200);
R.sansSms=await p.evaluate(()=>document.querySelector('.rv-done')?.innerText.replace(/\s+/g,' '));
await b.close();
// Verdict (famille de fautes CODE_SMS / CONNEXION_ETAT) : sort en 1 si un contrôle est faux, si une erreur de page survient,
// ou si plus d'un « start » sans appareil part (un seul SMS doit être envoyé sur tout le parcours).
const V={etape3:R.etape3,apresClicCote:R.apresClicCote,apresEchap:R.apresEchap,apresContinuer:R.apresContinuer,apresRecharge:R.apresRecharge,redemande:R.redemande,
  fini:!!R.fini,appareil:!!R.appareil,sansSms:!!R.sansSms,aucune_erreur_de_page:errs.length===0,un_seul_sms:appels.filter(a=>a==='start').length<=1};
const ok=Object.values(V).every(Boolean);
console.log(JSON.stringify({test:'code_sms',ok,V,R,appels,errs},null,1)); console.log(ok?'CODE SMS VERT':'CODE SMS ROUGE'); process.exit(ok?0:1);
