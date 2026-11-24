/* Subsides et aides (demande de Karim du 24/11/2026) : de l'aide proposée au dossier complet prêt à envoyer.
   Parcours en 7 étapes, pensé pour le téléphone : 1 aide · 2 questions (préremplies) · 3 aide de l'IA (prix annoncé
   avant confirmation, puis prix facturé) · 4 pièces · 5 contrôle automatique · 6 validation (quatre yeux pour l'ACRB)
   · 7 dossier complet en PDF (DOCACRB), brouillon de courriel (jamais envoyé seul) et « Marquer comme envoyé ».
   Deux espaces : Gestion de l'ACRB (dossiers de l'ASBL) et Mon espace commerçant (dossiers du commerce ou de la société).
   Le portail du fondateur (#iaf_box) reçoit ses libellés de la base : cet écran n'en contient aucun pour les autres.
   Expose window.SUBSIDES = { init(sb, {espace, roles, box}), recharger(), controle(dossier, aide) }. */
(function(){
var sb,O={},D=null,ORG=null,DOS=null,ET=1,SALE=false,BOX=null,lie=false,MESREQ=[];
function $(i){return document.getElementById(i);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
/* montants à la belge : 3.000,00 € (séparateurs simples, que le PDF sait dessiner) */
function grp(n,d){var s=Math.abs(+n||0).toFixed(d),p=s.split(".");return ((+n||0)<0?"-":"")+p[0].replace(/\B(?=(\d{3})+(?!\d))/g,".")+(d?","+p[1]:"");}
function eur(n){return grp(Math.round((+n||0)*100)/100,2)+" €";}
function eur0(n){return grp(Math.round(+n||0),0)+" €";}
function dfr(s){if(!s)return "";var p=String(s).slice(0,10).split("-");return p.length===3?p[2]+"/"+p[1]+"/"+p[0]:s;}
function dth(s){if(!s)return "";var d=new Date(s);return d.toLocaleDateString("fr-BE")+" "+d.toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"});}
function auj(){var d=new Date();return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
function jours(s){if(!s)return null;return Math.round((new Date(String(s).slice(0,10)+"T12:00:00")-new Date(auj()+"T12:00:00"))/864e5);}
function norm(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");}
function num(v){var t=String(v==null?"":v).replace(/[\s €]/g,"");if(/\./.test(t)&&/,/.test(t))t=t.replace(/\./g,"");t=t.replace(",",".").replace(/[^0-9.\-]/g,"");var n=parseFloat(t);return isNaN(n)?null:n;}
function err(x){return x&&x.error?(x.error.message||String(x.error)):"";}

var CSS='#sub_box,#iaf_box{min-width:0}.sb-org{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 12px}.sb-org button{min-height:40px;padding:0 12px;border:1px solid #c6ccd6;background:#fff;font:700 14px "Libre Franklin",Arial,sans-serif;cursor:pointer;color:#222}.sb-org button.on{background:var(--navy,#14233c);border-color:var(--navy,#14233c);color:#fff}'+
'.sb h3{font:800 15px "Libre Franklin",Arial,sans-serif;margin:18px 0 8px;color:var(--navy,#14233c)}.sb-aide{border:1px solid var(--line,#dfe3ea);border-left:4px solid var(--navy,#14233c);padding:12px 14px;margin:0 0 10px;background:#fff}.sb-aide.ex{border-left-color:#c98a00}'+
'.sb-aide b{display:block;font:800 16px "Libre Franklin",Arial,sans-serif}.sb-aide .m{font-size:13.5px;color:var(--muted,#5f6675);margin:2px 0 6px}.sb-aide p{font-size:14.5px;margin:4px 0 8px}.sb-pill{display:inline-block;font:700 11px "Libre Franklin",Arial,sans-serif;letter-spacing:.05em;text-transform:uppercase;padding:3px 7px;margin:0 6px 4px 0;background:#f0f2f6;color:var(--muted,#5f6675)}'+
'.sb-pill.ok{background:#e4f3ea;color:var(--green,#1f8a4c)}.sb-pill.warn{background:#fff3d6;color:#8a5a00}.sb-pill.bad{background:#fbe9e6;color:var(--brick,#b23a2b)}'+
'.sb-b{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;background:var(--navy,#14233c);color:#fff;border:1px solid var(--navy,#14233c);font:700 15px "Libre Franklin",Arial,sans-serif;cursor:pointer;text-decoration:none;margin:4px 6px 4px 0}.sb-b.o{background:#fff;color:var(--navy,#14233c)}.sb-b.d{background:#fff;color:var(--muted,#5f6675);border-color:#c9ccd3}.sb-b:disabled{opacity:.5;cursor:default}'+
'.sb-row{display:grid;grid-template-columns:1fr auto;gap:6px 12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line,#dfe3ea)}.sb-row b{display:block;font:800 15px "Libre Franklin",Arial,sans-serif}.sb-row span{font-size:13.5px;color:var(--muted,#5f6675)}'+
'.sb-steps{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;margin:10px 0 14px;padding-bottom:2px}.sb-steps::-webkit-scrollbar{display:none}.sb-steps button{flex:0 0 auto;min-height:40px;padding:0 10px;border:1px solid #c6ccd6;background:#fff;font:700 13px "Libre Franklin",Arial,sans-serif;color:#222;cursor:pointer}.sb-steps button.on{background:var(--navy,#14233c);color:#fff;border-color:var(--navy,#14233c)}.sb-steps button.ok{border-color:var(--green,#1f8a4c)}'+
'.sb-f{display:grid;grid-template-columns:1fr 1fr;gap:10px}.sb-f label{display:grid;gap:3px;font-size:13px;color:var(--muted,#5f6675);min-width:0}.sb-f .w{grid-column:1/-1}.sb-f input,.sb-f textarea,.sb-f select{width:100%;padding:11px 10px;border:1px solid #c6ccd6;font:16px "Source Sans 3",sans-serif;color:#222;background:#fff;min-width:0}.sb-f textarea{min-height:90px}'+
'.sb-f .rep{color:var(--green,#1f8a4c);font-size:11.5px;font-weight:700}.sb-f .acompl{border-color:var(--brick,#b23a2b);background:#fff7f6}.sb-bud{display:grid;grid-template-columns:1fr 110px 44px;gap:6px;margin:4px 0}.sb-bud input{padding:10px;border:1px solid #c6ccd6;font:16px "Source Sans 3",sans-serif;min-width:0}.sb-bud button{border:1px solid #c9ccd3;background:#fff;cursor:pointer;font-size:18px}'+
'.sb-tot{background:#f6f7fa;border:1px solid var(--line,#dfe3ea);padding:10px 12px;font-size:14.5px;margin:8px 0}.sb-ia{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:8px 0}.sb-ia button{min-height:56px;border:1px solid var(--navy,#14233c);background:#fff;color:var(--navy,#14233c);font:800 15px "Libre Franklin",Arial,sans-serif;cursor:pointer;padding:6px}'+
'.sb-devis{border:2px solid var(--navy,#14233c);background:#f7f9fc;padding:14px;margin:10px 0}.sb-devis .px{font:800 20px "Libre Franklin",Arial,sans-serif;color:var(--navy,#14233c);margin:4px 0 8px}.sb-res{border:1px solid var(--line,#dfe3ea);padding:12px;margin:10px 0;background:#fff}.sb-res .ch{border-top:1px dashed var(--line,#dfe3ea);padding:8px 0}.sb-res .ch b{font-size:13px;color:var(--muted,#5f6675)}.sb-res .ch div{white-space:pre-wrap;font-size:14.5px}'+
'.sb-ck{list-style:none;padding:0;margin:8px 0}.sb-ck li{padding:9px 10px 9px 34px;position:relative;border-bottom:1px solid var(--line,#dfe3ea);font-size:14.5px}.sb-ck li:before{position:absolute;left:8px;top:8px;font-weight:800}.sb-ck li.ok:before{content:"✓";color:var(--green,#1f8a4c)}.sb-ck li.ko:before{content:"✗";color:var(--brick,#b23a2b)}.sb-ck li.ko{background:#fff7f6}'+
'.sb-pc label{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line,#dfe3ea);font-size:15px;cursor:pointer}.sb-pc input{width:22px;height:22px;flex:none;margin-top:1px}.sb-msg{font-size:14px;font-weight:600;margin:6px 0;min-height:1em}.sb-msg.ok{color:var(--green,#1f8a4c)}.sb-msg.bad{color:var(--brick,#b23a2b)}'+
'.sb-nav{display:flex;justify-content:space-between;gap:8px;margin-top:16px;border-top:1px solid var(--line,#dfe3ea);padding-top:12px}.sb-note{font-size:13.5px;color:var(--muted,#5f6675);margin:6px 0}.sb-ex{background:#fff6e5;border-left:3px solid #c98a00;padding:8px 10px;font-size:13.5px;color:#6b4a00;margin:6px 0}'+
'.sb-t{overflow-x:auto}.sb-t table{border-collapse:collapse;width:100%;font-size:14px}.sb-t th,.sb-t td{border-bottom:1px solid var(--line,#dfe3ea);padding:7px 6px;text-align:left;vertical-align:top}.sb-t th{font-size:12px;color:var(--muted,#5f6675);text-transform:uppercase;letter-spacing:.04em}.sb-t .n{text-align:right;white-space:nowrap}'+
'@media(max-width:700px){.sb-f{grid-template-columns:1fr}.sb-row{grid-template-columns:1fr}.sb-bud{grid-template-columns:1fr 96px 44px}.sb-nav .sb-b{flex:1}}';

/* Vocabulaire et champs propres à chaque type d'organisation */
var VOC={
  asbl:{org:"l’association",nom:"Dénomination de l’association",objet:"Objet social (statuts)",rep:"Représentant (administrateur)",act:"Activités de l’association",iban:"Compte de l’association (IBAN)",membres:"Membres",depuis:null,sig:"Pour l’association"},
  commercant:{org:"votre commerce",nom:"Nom de l’exploitant",objet:"Activité (Banque-Carrefour)",rep:"Exploitant",act:"Vos commerces",iban:"Votre compte professionnel (IBAN)",membres:null,depuis:"Actif depuis",sig:"L’exploitant"},
  societe:{org:"votre société",nom:"Dénomination de la société",objet:"Activité (Banque-Carrefour)",rep:"Gérant",act:"Commerces exploités",iban:"Compte de la société (IBAN)",membres:null,depuis:"Active depuis",sig:"Pour la société"}};
var TYPE={asbl:"ASBL",commercant:"Commerçant",societe:"Société"};
var ST={brouillon:["Brouillon",""],a_controler:["À corriger","warn"],controle:["Contrôlé","ok"],valide:["Validé","ok"],envoye:["Envoyé","ok"],refuse_interne:["Refusé en interne","bad"]};
var ETAPES=["Aide","Questions","Aide de l’IA","Pièces","Contrôle","Validation","Dossier complet"];
var ACT=[["completer","Compléter","Remplit les champs vides à partir de ce que la plateforme sait déjà ; ce qui manque est marqué « À COMPLÉTER »."],
  ["corriger","Corriger","Corrige l’orthographe, la clarté et la cohérence, sans changer les faits ni les chiffres."],
  ["argumenter","Argumenter","Rédige un argument factuel pour chaque critère publié de l’aide."],
  ["documenter","Documenter","Rédige la présentation et la liste des annexes à joindre."],
  ["verifier","Vérifier","Relit le dossier comme l’administration : points bloquants, puis points à améliorer. Ne modifie rien."]];
var LIB={nom:"Nom",forme:"Forme",bce:"Numéro d’entreprise",adresse:"Adresse",iban:"IBAN",representant:"Représentant",representant_qualite:"Qualité",email:"Courriel",tel:"Téléphone",objet:"Objet / activité",activites:"Activités",membres:"Membres",depuis:"Depuis",
  titre:"Titre du projet",resume:"Résumé du projet",objectifs:"Objectifs",public:"Public visé",lieu:"Lieu",debut:"Début",fin:"Fin",montant_demande:"Montant demandé",documentation:"Documentation"};
var REQ=["nom","bce","adresse","iban","representant","email","titre","resume","debut","fin","montant_demande"];

function aideDe(d){return (D.aides||[]).filter(function(a){return a.id===(d&&d.aide_id);})[0]||null;}
function orgDe(id){return (D.organisations||[]).filter(function(o){return o.id===id;})[0]||null;}

/* Contrôle automatique : mêmes règles que la base (acrb_sub_controle_calc), affichées en direct */
function controle(d,a){var c=d.champs||{},it=[],req=REQ.concat(a&&a.conditions&&a.conditions.champs_obligatoires||[]),m=req.filter(function(k){return !String(c[k]==null?"":c[k]).trim();});
  it.push({k:"champs",ok:!m.length,txt:m.length?"Champs obligatoires vides : "+m.map(function(k){return LIB[k]||k;}).join(", "):"Tous les champs obligatoires sont remplis"});
  var r=Object.keys(c).filter(function(k){return /[àa] compl[ée]ter/i.test(JSON.stringify(c[k]));});
  it.push({k:"a_completer",ok:!r.length,txt:r.length?"« À COMPLÉTER » reste dans : "+r.map(function(k){return LIB[k]||(k==="argu"?"Argumentaire":k);}).join(", "):"Aucune mention « À COMPLÉTER » restante"});
  var pm=(a&&a.pieces||[]).filter(function(p){return p.obligatoire!==false&&!(d.pieces||{})[p.id];});
  it.push({k:"pieces",ok:!pm.length,txt:pm.length?"Pièces manquantes : "+pm.map(function(p){return p.libelle;}).join(" ; "):"Toutes les pièces obligatoires sont cochées"});
  var j=a&&a.echeance?jours(a.echeance):null;it.push({k:"echeance",ok:j==null||j>=0,txt:j==null?"Pas d’échéance publiée":j>=0?"Échéance respectée ("+dfr(a.echeance)+")":"Échéance dépassée ("+dfr(a.echeance)+")"});
  var tot=(c.budget||[]).reduce(function(s,x){return s+(num(x.montant)||0);},0),cof=(c.cofinancement||[]).reduce(function(s,x){return s+(num(x.montant)||0);},0),dem=num(c.montant_demande),k=a&&a.conditions||{},t="Budget cohérent",ok=true;
  if(!(tot>0)){ok=false;t="Budget vide";}else if(!(dem>0)){ok=false;t="Montant demandé absent";}else if(dem>tot){ok=false;t="Le montant demandé dépasse le budget total";}
  else if(Math.abs(dem+cof-tot)>1){ok=false;t="Budget non équilibré : demandé + autres financements ≠ total";}
  else if(k.taux_max_pct!=null&&dem>tot*k.taux_max_pct/100+0.005){ok=false;t="Le montant demandé dépasse "+k.taux_max_pct+" % du budget";}
  else if(k.montant_max_eur!=null&&dem>k.montant_max_eur){ok=false;t="Le montant demandé dépasse le maximum de l’aide";}
  else if(k.montant_min_eur!=null&&dem<k.montant_min_eur){ok=false;t="Le montant demandé est sous le minimum de l’aide";}
  it.push({k:"budget",ok:ok,txt:t});
  var cm=(a&&a.criteres||[]).filter(function(x){return String((c.argu||{})[x.id]||"").length<40;});
  it.push({k:"criteres",ok:!cm.length,txt:cm.length?"Critères sans argument (40 caractères au moins) : "+cm.map(function(x){return x.libelle;}).join(" ; "):"Chaque critère de l’aide est argumenté"});
  it.push({k:"dates",ok:!!(c.debut&&c.fin&&c.debut<=c.fin),txt:"Dates du projet : début avant fin"});
  return {ok:it.every(function(x){return x.ok;}),items:it};}

/* Pertinence d'une aide pour l'organisation : public visé, thèmes retrouvés dans son activité, échéance */
function pertinence(a,o){if((a.publics||[]).indexOf(o.type)<0)return null;var p=o.profil||{},txt=norm([p.objet,p.activites,p.nom,(p.magasins||[]).map(function(m){return m.activite;}).join(" ")].join(" ")),s=50,th=[];
  (a.themes||[]).forEach(function(t){if(txt.indexOf(norm(t))>=0){s+=10;th.push(t);}});s=Math.min(s,80);var j=jours(a.echeance);if(j!=null&&j<0)return {s:-1,j:j,th:th};if(j!=null&&j<=45)s+=15;
  return {s:s,j:j,th:th,l:s>=70?["très pertinente","ok"]:s>=55?["pertinente","ok"]:["à examiner",""]};}

function rendreAccueil(){var os=D.organisations;if(!os.length){BOX.innerHTML=O.espace==="commercant"?'<p class="sb-note">Aucune organisation reliée à votre compte pour les subsides. Votre fiche commerçant ouvre cet espace ; si elle existe déjà, la permission « subsides » de votre compte a peut-être été retirée.</p>':'<p class="sb-note">Votre compte n’a pas la permission « subsides ».</p>';return;}
  if(!ORG||!orgDe(ORG.id))ORG=os[0];var V=VOC[ORG.type],h='';
  if(os.length>1)h+='<div class="sb-org" role="tablist">'+os.map(function(o){return '<button type="button" data-org="'+esc(o.id)+'" class="'+(o.id===ORG.id?'on':'')+'" data-aide="Les dossiers et les aides proposées dépendent de l’organisation qui demande : '+esc(TYPE[o.type])+'.">'+esc(TYPE[o.type])+' · '+esc(o.nom)+'</button>';}).join("")+'</div>';
  var ds=(D.dossiers||[]).filter(function(d){return d.organisation_id===ORG.id;});
  h+='<div class="sb"><h3>Dossiers de '+esc(ORG.nom)+' ('+ds.length+')</h3>'+(ds.length?ds.map(function(d){var a=aideDe(d),s=ST[d.statut]||[d.statut,""];
      return '<div class="sb-row"><div><b>'+esc(d.titre||"Dossier")+'</b><span>'+esc(a?a.nom:"Aide hors catalogue")+' · modifié le '+esc(dth(d.maj_le))+'</span><br><span class="sb-pill '+s[1]+'">'+esc(s[0])+'</span></div><div><button class="sb-b" type="button" data-ouvrir="'+d.id+'" data-aide="Reprend ce dossier là où vous l’avez laissé.">Ouvrir</button></div></div>';}).join(""):'<p class="sb-note">Aucun dossier pour l’instant. Choisissez une aide ci-dessous : le dossier se crée déjà rempli avec ce que la plateforme sait de '+esc(V.org)+'.</p>');
  var av=(D.aides||[]).map(function(a){return {a:a,p:pertinence(a,ORG)};}).filter(function(x){return x.p;}),ok=av.filter(function(x){return x.p.s>=0;}).sort(function(x,y){return y.p.s-x.p.s||(x.p.j==null?9e9:x.p.j)-(y.p.j==null?9e9:y.p.j);}),pas=av.filter(function(x){return x.p.s<0;});
  h+='<h3>Aides proposées pour '+esc(V.org)+' ('+ok.length+')</h3>'+(ok.length?ok.map(function(x){var a=x.a,p=x.p;
      return '<div class="sb-aide'+(a.exemple?' ex':'')+'"><b>'+esc(a.nom)+'</b><div class="m">'+esc(a.organisme||"")+(a.niveau?' · '+esc(a.niveau):'')+'</div>'+
        '<span class="sb-pill '+p.l[1]+'">'+esc(p.l[0])+'</span>'+(a.echeance?'<span class="sb-pill '+(p.j<=45?'warn':'')+'">échéance '+esc(dfr(a.echeance))+' · dans '+p.j+' j</span>':'<span class="sb-pill">sans échéance publiée</span>')+
        (a.montant_texte||a.taux_texte?'<div class="m">'+esc([a.montant_texte,a.taux_texte].filter(Boolean).join(" · "))+'</div>':'')+(a.resume?'<p>'+esc(a.resume)+'</p>':'')+
        (a.exemple?'<div class="sb-ex">Fiche d’exemple : elle sera remplacée par le catalogue vérifié. Ne l’utilisez pas pour une vraie demande.</div>':'')+
        (a.verifie_le?'<div class="m">Vérifiée à la source le '+esc(dfr(a.verifie_le))+(a.url?' · <a href="'+esc(a.url)+'" target="_blank" rel="noopener">page officielle</a>':'')+'</div>':'')+
        '<button class="sb-b" type="button" data-creer="'+esc(a.id)+'" data-aide="Crée le dossier, déjà rempli avec ce que la plateforme sait de '+esc(V.org)+'. Rien n’est envoyé.">Préparer la demande</button></div>';}).join(""):'<p class="sb-note">Aucune aide du catalogue ne vise ce type d’organisation pour l’instant.</p>')+
    '<button class="sb-b o" type="button" data-creer="" data-aide="Pour toute autre aide (commune, fondation, appel à projets) : même parcours, sans fiche du catalogue.">Autre aide, hors catalogue</button>'+
    (pas.length?'<details><summary class="sb-note" style="cursor:pointer">Échéance passée ('+pas.length+')</summary>'+pas.map(function(x){return '<div class="sb-note">'+esc(x.a.nom)+' — '+esc(dfr(x.a.echeance))+'</div>';}).join("")+'</details>':'')+
    '<h3>Mes aides de l’IA</h3><div id="sb_req"><p class="sb-note">Chargement…</p></div></div>';
  BOX.innerHTML=h;
  BOX.querySelectorAll("[data-org]").forEach(function(b){b.onclick=function(){ORG=orgDe(b.dataset.org);rendreAccueil();};});
  BOX.querySelectorAll("[data-ouvrir]").forEach(function(b){b.onclick=function(){ouvrir(+b.dataset.ouvrir,1);};});
  BOX.querySelectorAll("[data-creer]").forEach(function(b){b.onclick=function(){var id=b.dataset.creer||null,t=null;if(!id){t=window.prompt("Nom de l’aide ou de l’appel à projets visé :","");if(t===null)return;}
    b.disabled=true;sb.rpc("acrb_sub_creer",{p_org:ORG.id,p_aide:id,p_titre:t}).then(function(x){b.disabled=false;if(x.error){alert("Non créé : "+err(x));return;}D.dossiers.unshift(x.data);ouvrir(x.data.id,2);});};});
  mesRequetes();}

function mesRequetes(){sb.rpc("acrb_ia_mes_requetes").then(function(x){var R=MESREQ=Array.isArray(x.data)?x.data:[];var z=$("sb_req");if(!z)return;var m=auj().slice(0,7),tm=R.filter(function(r){return String(r.quand).slice(0,7)===m&&r.statut==="execute";}).reduce(function(s,r){return s+(+r.prix_eur||0);},0);
  z.innerHTML=R.length?'<p class="sb-note">Ce mois-ci : '+eur(tm)+' pour '+R.filter(function(r){return String(r.quand).slice(0,7)===m&&r.statut==="execute";}).length+' requête(s), facturé à '+esc(ORG?ORG.nom:"votre organisation")+'.</p><div class="sb-t"><table><tr><th>Quand</th><th>Aide demandée</th><th class="n">Prix</th></tr>'+R.slice(0,20).map(function(r){var a=ACT.filter(function(q){return q[0]===r.action;})[0];return '<tr><td>'+esc(dth(r.quand))+'</td><td>'+esc(a?a[1]:r.action)+(r.statut!=="execute"?' <span class="sb-pill">'+(r.statut==="plafond"?"plafond atteint":"non abouti, non facturé")+'</span>':'')+'</td><td class="n">'+eur(r.prix_eur)+'</td></tr>';}).join("")+'</table></div>':'<p class="sb-note">Aucune pour l’instant. Chaque aide de l’IA annonce son prix avant que vous la confirmiez.</p>';});}

/* ---------- dossier ---------- */
function ouvrir(id,et){DOS=JSON.parse(JSON.stringify((D.dossiers||[]).filter(function(d){return d.id===id;})[0]||null));if(!DOS)return;ORG=orgDe(DOS.organisation_id)||ORG;DOS.champs=DOS.champs||{};DOS.pieces=DOS.pieces||{};ET=et||1;SALE=false;rendreDossier();try{BOX.scrollIntoView({block:"start"});}catch(e){}}
function majLocal(d){DOS=JSON.parse(JSON.stringify(d));DOS.champs=DOS.champs||{};DOS.pieces=DOS.pieces||{};var i=D.dossiers.map(function(x){return x.id;}).indexOf(d.id);if(i>=0)D.dossiers[i]=d;else D.dossiers.unshift(d);}
function enregistrer(){if(!SALE)return Promise.resolve(true);if(DOS.statut==="valide"||DOS.statut==="envoye"){SALE=false;return Promise.resolve(true);}
  SALE=false;return sb.rpc("acrb_sub_enregistrer",{p_id:DOS.id,p_champs:DOS.champs,p_pieces:DOS.pieces,p_titre:DOS.champs.titre||null}).then(function(x){if(x.error){SALE=true;dire("Non enregistré : "+err(x),1);return false;}
    /* la saisie faite pendant l'enregistrement est gardée : seuls l'état et les dates viennent de la base */
    var ch=DOS.champs,pc=DOS.pieces;majLocal(x.data);DOS.champs=ch;DOS.pieces=pc;dire("Enregistré à "+new Date().toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"}));return true;});}
function dire(t,bad){var m=$("sb_msg");if(m){m.className="sb-msg "+(bad?"bad":"ok");m.textContent=t;}}
function verrou(){return DOS.statut==="valide"||DOS.statut==="envoye";}

function rendreDossier(){var a=aideDe(DOS),s=ST[DOS.statut]||[DOS.statut,""],ck=controle(DOS,a);
  var h='<div class="sb"><button class="sb-b d" type="button" id="sb_ret" data-aide="Revient à la liste des dossiers et des aides. Ce que vous avez saisi est enregistré.">← Dossiers et aides</button>'+
    '<h3 style="margin-top:10px">'+esc(DOS.titre||"Dossier")+' <span class="sb-pill '+s[1]+'">'+esc(s[0])+'</span></h3><div class="sb-note">'+esc(TYPE[ORG.type])+' · '+esc(ORG.nom)+' · '+esc(a?a.nom:"Aide hors catalogue")+' · réf. SUB-'+DOS.id+'</div>'+
    '<div class="sb-steps" role="tablist">'+ETAPES.map(function(e,i){var n=i+1,okk=(n===5&&(DOS.statut==="controle"||verrou()))||(n===6&&verrou())||(n===7&&DOS.statut==="envoye");return '<button type="button" role="tab" data-et="'+n+'" class="'+(n===ET?'on':'')+(okk?' ok':'')+'">'+n+'. '+esc(e)+'</button>';}).join("")+'</div>'+
    '<div id="sb_et"></div><div class="sb-msg" id="sb_msg" role="status"></div>'+
    '<div class="sb-nav">'+(ET>1?'<button class="sb-b o" type="button" id="sb_prev">← Précédent</button>':'<span></span>')+(ET<7?'<button class="sb-b" type="button" id="sb_next">Suivant →</button>':'')+'</div></div>';
  BOX.innerHTML=h;var Z=$("sb_et");
  $("sb_ret").onclick=function(){enregistrer().then(function(){DOS=null;rendreAccueil();});};
  BOX.querySelectorAll("[data-et]").forEach(function(b){b.onclick=function(){aller(+b.dataset.et);};});
  if($("sb_prev"))$("sb_prev").onclick=function(){aller(ET-1);};if($("sb_next"))$("sb_next").onclick=function(){aller(ET+1);};
  [et1,et2,et3,et4,et5,et6,et7][ET-1](Z,a,ck);}
function aller(n){enregistrer().then(function(){ET=Math.max(1,Math.min(7,n));rendreDossier();try{BOX.scrollIntoView({block:"start"});}catch(e){}});}

function et1(Z,a){if(!a){Z.innerHTML='<p>Aide hors catalogue : indiquez dans les questions l’organisme, ses critères et sa procédure (champ « Documentation »). Le parcours reste le même.</p>';return;}
  Z.innerHTML=(a.exemple?'<div class="sb-ex">Fiche d’exemple : elle sera remplacée par le catalogue vérifié.</div>':'')+'<div class="sb-aide"><b>'+esc(a.nom)+'</b><div class="m">'+esc(a.organisme||"")+'</div>'+(a.resume?'<p>'+esc(a.resume)+'</p>':'')+
    '<div class="m">'+esc([a.montant_texte,a.taux_texte,a.echeance?"échéance "+dfr(a.echeance):""].filter(Boolean).join(" · "))+'</div></div>'+
    ((a.conditions&&a.conditions.echeance_texte)?'<p><b>Échéance :</b> '+esc(a.conditions.echeance_texte)+'</p>':'')+((a.conditions&&(a.conditions.liste||[]).length)?'<h3>Conditions d’accès</h3><ul>'+a.conditions.liste.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'')+((a.criteres||[]).length?'<h3>Critères publiés</h3><ul>'+a.criteres.map(function(c){return '<li>'+esc(c.libelle)+'</li>';}).join("")+'</ul>':'')+
    ((a.pieces||[]).length?'<h3>Pièces demandées</h3><ul>'+a.pieces.map(function(p){return '<li>'+esc(p.libelle)+(p.obligatoire===false?' (facultative)':'')+'</li>';}).join("")+'</ul>':'')+
    (a.procedure?'<h3>Procédure</h3><p>'+esc(a.procedure)+'</p>':'')+(a.url?'<p><a href="'+esc(a.url)+'" target="_blank" rel="noopener">Page officielle de l’aide</a></p>':'');}

function champ(k,lab,typ,w,aide){var v=DOS.champs[k]==null?"":DOS.champs[k],p=(ORG.profil||{})[k],rep=p!=null&&String(p)!==""&&String(p)===String(v),ac=/[àa] compl[ée]ter/i.test(String(v)),ro=verrou()?" disabled":"",da=aide?' data-aide="'+esc(aide)+'"':"";
  var inp=typ==="ta"?'<textarea data-k="'+k+'" class="'+(ac?'acompl':'')+'"'+ro+da+'>'+esc(v)+'</textarea>':'<input data-k="'+k+'" type="'+(typ||"text")+'" value="'+esc(v)+'" class="'+(ac?'acompl':'')+'"'+ro+da+(typ==="text"&&k==="montant_demande"?' inputmode="decimal"':'')+'>';
  return '<label class="'+(w?'w':'')+'">'+esc(lab)+(REQ.indexOf(k)>=0?' *':'')+(rep?' <span class="rep">repris de la fiche</span>':'')+inp+'</label>';}
function et2(Z,a){var V=VOC[ORG.type],c=DOS.champs,pre=Object.keys(ORG.profil||{}).filter(function(k){return c[k]!=null&&String(c[k])===String(ORG.profil[k]);}).length;
  var h='<p class="sb-note">Les champs marqués * sont obligatoires. '+pre+' champ(s) déjà repris de la fiche de '+esc(V.org)+' : vérifiez-les d’un coup d’œil.</p>'+
   '<details'+(!pre||["nom","bce","adresse","iban","representant","email"].some(function(k){return !String(c[k]==null?"":c[k]).trim()||/[àa] compl[ée]ter/i.test(String(c[k]));})?' open':'')+'><summary style="cursor:pointer;font-weight:700;min-height:40px;display:flex;align-items:center">Le demandeur ('+esc(TYPE[ORG.type])+')</summary><div class="sb-f">'+
   champ("nom",V.nom,"text",1)+champ("forme","Forme juridique")+champ("bce","Numéro d’entreprise (BCE)")+champ("adresse",ORG.type==="commercant"?"Adresse du commerce":"Siège","text",1)+
   champ("iban",V.iban,"text",0,"Compte sur lequel l’aide sera versée. Repris des réglages quand il est connu.")+champ("email","Courriel de contact","email")+champ("tel","Téléphone","tel")+
   champ("representant",V.rep,"text",0,"La personne qui signe la demande.")+champ("representant_qualite","Qualité")+champ("objet",V.objet,"ta",1)+champ("activites",V.act,"ta",1)+
   (V.membres?champ("membres","Nombre de membres","number"):"")+(V.depuis?champ("depuis",V.depuis):"")+'</div></details>'+
   '<h3>Le projet</h3><div class="sb-f">'+champ("titre","Titre du projet","text",1)+champ("resume","Résumé du projet (5 lignes)","ta",1,"Ce que vous voulez faire, pour qui, où et quand. L’IA peut le compléter et le corriger.")+
   champ("objectifs","Objectifs","ta",1)+champ("public","Public visé","text",1)+champ("lieu","Lieu")+'<span></span>'+champ("debut","Début","date")+champ("fin","Fin","date")+'</div>'+
   '<h3>Budget</h3><div id="sb_bud"></div>'+
   ((a&&a.criteres||[]).length?'<h3>Argumentaire, critère par critère</h3><div class="sb-f">'+a.criteres.map(function(cr){var v=(c.argu||{})[cr.id]||"",ac=/[àa] compl[ée]ter/i.test(v);return '<label class="w">'+esc(cr.libelle)+'<textarea data-argu="'+esc(cr.id)+'" class="'+(ac?'acompl':'')+'"'+(verrou()?' disabled':'')+' data-aide="Trois à six phrases factuelles. Le bouton « Argumenter » de l’étape 3 peut les rédiger.">'+esc(v)+'</textarea></label>';}).join("")+'</div>':'')+
   '<h3>Documentation</h3><div class="sb-f">'+champ("documentation","Présentation, références, annexes","ta",1)+'</div>';
  Z.innerHTML=h;budget();
  Z.querySelectorAll("[data-k]").forEach(function(e){e.addEventListener("input",function(){DOS.champs[e.dataset.k]=e.value;SALE=true;});e.addEventListener("change",function(){enregistrer();});});
  Z.querySelectorAll("[data-argu]").forEach(function(e){e.addEventListener("input",function(){DOS.champs.argu=DOS.champs.argu||{};DOS.champs.argu[e.dataset.argu]=e.value;SALE=true;});e.addEventListener("change",function(){enregistrer();});});}
function budget(){var z=$("sb_bud"),c=DOS.champs;c.budget=c.budget||[];c.cofinancement=c.cofinancement||[];var ro=verrou()?" disabled":"";
  function lignes(l,cle,ph){return l.map(function(x,i){return '<div class="sb-bud"><input data-l="'+cle+'" data-i="'+i+'" data-c="'+(cle==="budget"?"poste":"source")+'" placeholder="'+ph+'" value="'+esc(x.poste||x.source||"")+'"'+ro+'><input data-l="'+cle+'" data-i="'+i+'" data-c="montant" inputmode="decimal" placeholder="€" value="'+esc(x.montant||"")+'"'+ro+'><button type="button" data-x="'+cle+'" data-i="'+i+'" aria-label="Retirer la ligne"'+ro+'>×</button></div>';}).join("");}
  var tot=c.budget.reduce(function(s,x){return s+(num(x.montant)||0);},0),cof=c.cofinancement.reduce(function(s,x){return s+(num(x.montant)||0);},0),dem=num(c.montant_demande)||0;
  z.innerHTML='<div class="sb-note">Dépenses du projet</div>'+lignes(c.budget,"budget","Poste (ex. location de la scène)")+'<button class="sb-b o" type="button" data-plus="budget"'+ro+' data-aide="Ajoute une ligne de dépense.">+ Dépense</button>'+
    '<div class="sb-note" style="margin-top:10px">Autres financements (fonds propres, sponsors, autres aides)</div>'+lignes(c.cofinancement,"cofinancement","Source (ex. fonds propres)")+'<button class="sb-b o" type="button" data-plus="cofinancement"'+ro+'>+ Financement</button>'+
    '<div class="sb-f" style="margin-top:10px">'+champ("montant_demande","Montant demandé à l’aide (€)","text",0,"Total des dépenses moins les autres financements.")+'<label>&nbsp;<button class="sb-b o" type="button" id="sb_calc"'+ro+' data-aide="Calcule le montant demandé : total des dépenses moins les autres financements.">Calculer</button></label></div>'+
    '<div class="sb-tot">Total des dépenses : <b>'+eur0(tot)+'</b> · autres financements : <b>'+eur0(cof)+'</b> · demandé : <b>'+eur0(dem)+'</b>'+(tot>0?' ('+Math.round(dem/tot*100)+' % du budget)':'')+(Math.abs(dem+cof-tot)>1&&tot>0?' · <span style="color:var(--brick,#b23a2b)">non équilibré</span>':'')+'</div>';
  z.querySelectorAll("[data-l]").forEach(function(e){e.addEventListener("input",function(){DOS.champs[e.dataset.l][+e.dataset.i][e.dataset.c]=e.value;SALE=true;});e.addEventListener("change",function(){budget();enregistrer();});});
  z.querySelectorAll("[data-plus]").forEach(function(b){b.onclick=function(){DOS.champs[b.dataset.plus].push({});SALE=true;budget();};});
  z.querySelectorAll("[data-x]").forEach(function(b){b.onclick=function(){DOS.champs[b.dataset.x].splice(+b.dataset.i,1);SALE=true;budget();enregistrer();};});
  var md=z.querySelector('[data-k="montant_demande"]');md.addEventListener("input",function(){DOS.champs.montant_demande=md.value;SALE=true;});md.addEventListener("change",function(){budget();enregistrer();});
  $("sb_calc").onclick=function(){var c=DOS.champs,t=c.budget.reduce(function(s,x){return s+(num(x.montant)||0);},0)-c.cofinancement.reduce(function(s,x){return s+(num(x.montant)||0);},0);c.montant_demande=String(Math.max(0,Math.round(t*100)/100));SALE=true;budget();enregistrer();};}

/* ---------- étape 3 : aide de l'IA (prix annoncé, confirmation, prix facturé) ---------- */
function et3(Z){if(verrou()){Z.innerHTML='<p>Le dossier est validé. Rouvrez-le (étape 6) pour demander encore l’aide de l’IA.</p>';return;}
  Z.innerHTML='<p>L’IA complète, corrige, argumente, documente ou vérifie votre dossier à partir de ce qui est déjà saisi et de la fiche de l’aide. Elle n’invente aucun chiffre : ce qui manque est marqué « À COMPLÉTER ». Vous choisissez ensuite ce que vous gardez.</p>'+
   '<p class="sb-note">Chaque aide est facturée à '+esc(ORG.nom)+'. Son prix s’affiche avant que vous la confirmiez ; rien n’est facturé sans votre accord ni si l’IA ne répond pas.</p>'+
   '<div class="sb-ia">'+ACT.map(function(q){return '<button type="button" data-ia="'+q[0]+'" data-aide="'+esc(q[2])+' Son prix s’affiche avant confirmation.">'+esc(q[1])+'</button>';}).join("")+'</div><div id="sb_iaz"></div>';
  Z.querySelectorAll("[data-ia]").forEach(function(b){b.onclick=function(){devis(b.dataset.ia);};});}
function appelIA(corps){if(!sb.functions||!sb.functions.invoke)return Promise.resolve({error:{message:"Service indisponible"}});return sb.functions.invoke("acrb-ia",{body:corps}).then(function(x){if(x.error)return x;var d=x.data;if(typeof d==="string"){try{d=JSON.parse(d);}catch(e){}}return {data:d};});}
function devis(act){var z=$("sb_iaz"),q=ACT.filter(function(x){return x[0]===act;})[0];z.innerHTML='<div class="sb-devis">Calcul du prix…</div>';
  enregistrer().then(function(){return appelIA({dossier_id:DOS.id,action:act,champs:DOS.champs,mode:"devis"});}).then(function(x){var d=x.data||{};
    if(x.error||!d.ok){z.innerHTML='<div class="sb-devis"><b>Aide de l’IA indisponible pour l’instant.</b><div class="sb-note">'+esc(err(x)||d.message||"Réessayez plus tard.")+'</div></div>';return;}
    z.innerHTML='<div class="sb-devis"><b>'+esc(q[1])+'</b><div class="px" id="sb_px">Prix de cette aide de l’IA : '+eur(d.prix_max_eur)+' au maximum</div><div class="sb-note">Le prix réellement facturé, souvent plus bas, s’affiche après la réponse ; il ne dépasse jamais ce montant.</div>'+
      '<button class="sb-b" type="button" id="sb_ok" data-aide="Lance l’aide de l’IA au prix annoncé, facturé à '+esc(ORG.nom)+'.">Confirmer pour '+eur(d.prix_max_eur)+' au maximum</button><button class="sb-b d" type="button" id="sb_non">Annuler</button></div>';
    $("sb_non").onclick=function(){z.innerHTML='';};
    $("sb_ok").onclick=function(){var b=this;b.disabled=true;b.textContent="L’IA travaille…";
      appelIA({dossier_id:DOS.id,action:act,champs:DOS.champs,mode:"executer",prix_max_accepte:d.prix_max_eur}).then(function(y){var r=y.data||{};
        if(r.nouveau_devis){z.innerHTML='<div class="sb-devis">Le dossier a changé depuis l’annonce du prix : nouveau prix '+eur(r.prix_max_eur)+' au maximum. Touchez à nouveau le bouton pour confirmer.</div>';return;}
        if(y.error||!r.ok){z.innerHTML='<div class="sb-devis"><b>Rien n’est facturé.</b><div class="sb-note">'+esc(err(y)||r.message||"L’IA n’a pas répondu.")+'</div></div>';return;}
        resultat(z,q,r);mesRequetes();});};});}
function resultat(z,q,r){var res=r.resultat||{},ch=res.champs||{},ar=res.argu||{},rq=res.remarques||[],a=aideDe(DOS),props=[];
  Object.keys(ch).forEach(function(k){if(typeof ch[k]==="string")props.push({k:k,lib:LIB[k]||k,v:ch[k]});});
  Object.keys(ar).forEach(function(k){var cr=(a&&a.criteres||[]).filter(function(c){return c.id===k;})[0];props.push({k:"argu."+k,lib:"Argument : "+(cr?cr.libelle:k),v:String(ar[k])});});
  z.innerHTML='<div class="sb-res"><b>'+esc(q[1])+' — réponse de l’IA</b><div class="sb-msg ok" id="sb_fact">Prix facturé : '+eur(r.prix_eur)+'</div>'+
    (rq.length?'<h3>Remarques</h3><ul>'+rq.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ul>':'')+
    (props.length?'<h3>Propositions ('+props.length+')</h3>'+props.map(function(p,i){return '<div class="ch"><label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" data-p="'+i+'" checked style="width:22px;height:22px;flex:none"><span><b>'+esc(p.lib)+'</b><div>'+esc(p.v)+'</div></span></label></div>';}).join("")+
      '<button class="sb-b" type="button" id="sb_app" data-aide="Recopie les propositions cochées dans le dossier. Vous pouvez encore tout modifier à l’étape 2.">Appliquer au dossier</button>':(!rq.length&&r.texte?'<div style="white-space:pre-wrap">'+esc(r.texte)+'</div>':''))+'</div>';
  var ap=$("sb_app");if(ap)ap.onclick=function(){z.querySelectorAll("[data-p]").forEach(function(cb){if(!cb.checked)return;var p=props[+cb.dataset.p];if(p.k.indexOf("argu.")===0){DOS.champs.argu=DOS.champs.argu||{};DOS.champs.argu[p.k.slice(5)]=p.v;}else DOS.champs[p.k]=p.v;});
    SALE=true;enregistrer().then(function(ok){if(ok){ap.disabled=true;ap.textContent="Appliqué ✓";}});};}

/* ---------- étape 4 : pièces ---------- */
function et4(Z,a){var ps=a&&a.pieces||[];if(!ps.length){Z.innerHTML='<p>Aucune liste de pièces publiée pour cette aide. Notez les annexes dans « Documentation » (étape 2).</p>';return;}
  Z.innerHTML='<p>Cochez chaque pièce dès qu’elle est prête. Vous les joindrez au courriel d’envoi (étape 7).</p><div class="sb-pc">'+ps.map(function(p){return '<label><input type="checkbox" data-pc="'+esc(p.id)+'"'+(DOS.pieces[p.id]?' checked':'')+(verrou()?' disabled':'')+'><span>'+esc(p.libelle)+(p.obligatoire===false?' <span class="sb-pill">facultative</span>':' <span class="sb-pill warn">obligatoire</span>')+'</span></label>';}).join("")+'</div>';
  Z.querySelectorAll("[data-pc]").forEach(function(c){c.onchange=function(){DOS.pieces[c.dataset.pc]=c.checked;SALE=true;enregistrer();};});}

/* ---------- étape 5 : contrôle ---------- */
function liste(it){return '<ul class="sb-ck">'+it.map(function(x){return '<li class="'+(x.ok?'ok':'ko')+'">'+esc(x.txt)+'</li>';}).join("")+'</ul>';}
function et5(Z,a,ck){var srv=DOS.controle&&DOS.controle.items;
  Z.innerHTML='<p>Le contrôle automatique vérifie les champs obligatoires, les mentions « À COMPLÉTER », les pièces, l’échéance et la cohérence du budget.</p><h3>En direct</h3>'+liste(ck.items)+
    (verrou()?'':'<button class="sb-b" type="button" id="sb_ctl" data-aide="Fait vérifier le dossier par la plateforme. Tout vert : le dossier passe « Contrôlé » et peut être validé.">Lancer le contrôle</button>')+
    (srv?'<h3>Dernier contrôle enregistré ('+esc(dth(DOS.controle.le))+')</h3>'+liste(srv):'');
  var b=$("sb_ctl");if(b)b.onclick=function(){b.disabled=true;enregistrer().then(function(){return sb.rpc("acrb_sub_controler",{p_id:DOS.id});}).then(function(x){b.disabled=false;if(x.error){dire(err(x),1);return;}majLocal(x.data);
    if(DOS.statut==="controle"){ET=6;rendreDossier();dire("Contrôle réussi : le dossier peut être validé.");}else{rendreDossier();dire("Des points restent à corriger (en rouge).",1);}});};}

/* ---------- étape 6 : validation ---------- */
function et6(Z){var pv=DOS.peut_valider||{},h='';
  if(DOS.statut==="valide"||DOS.statut==="envoye")h='<p class="sb-msg ok">Validé par '+esc(DOS.valide_par||"")+' le '+esc(dth(DOS.valide_le))+'.</p>'+(DOS.statut==="valide"?'<button class="sb-b o" type="button" id="sb_rouv" data-aide="Remet le dossier en brouillon pour le modifier. Le contrôle et la validation seront à refaire.">Rouvrir pour modifier</button>':'');
  else if(DOS.statut!=="controle")h='<p>Le dossier doit d’abord réussir le contrôle automatique (étape 5).</p>'+(DOS.statut==="refuse_interne"?'<p class="sb-msg bad">Refusé en interne : '+esc(DOS.refus_motif||"")+'</p>':'');
  else h=(ORG.acrb?'<p>Règle des quatre yeux : un administrateur de l’ACRB autre que l’auteur du dossier ('+esc(DOS.auteur_email)+') le relit et le valide.</p>':'<p>Le contrôle automatique est réussi. Relisez le dossier complet (étape 7, aperçu) puis validez-le.</p>')+
    (pv.ok?'<button class="sb-b" type="button" id="sb_val" data-aide="Valide le dossier : il ne pourra plus être modifié sans être rouvert.">Valider le dossier</button>':'<p class="sb-msg bad">'+esc(pv.pourquoi||"Validation impossible avec ce compte.")+'</p>')+
    (ORG.acrb?'<button class="sb-b d" type="button" id="sb_ref" data-aide="Renvoie le dossier à son auteur avec un motif. Réservé à un autre administrateur que l’auteur.">Refuser avec un motif</button>':'');
  var j=DOS.journal||[];h+=j.length?'<h3>Historique</h3><div class="sb-t"><table>'+j.map(function(e){return '<tr><td>'+esc(dth(e.quand))+'</td><td>'+esc(e.email||"")+'</td><td>'+esc((ST[e.vers]||[e.vers])[0])+(e.note?' — '+esc(e.note):'')+'</td></tr>';}).join("")+'</table></div>':'';
  Z.innerHTML=h;
  var v=$("sb_val");if(v)v.onclick=function(){v.disabled=true;sb.rpc("acrb_sub_valider",{p_id:DOS.id}).then(function(x){if(x.error){v.disabled=false;dire(err(x),1);return;}majLocal(x.data);ET=7;rendreDossier();dire("Dossier validé.");});};
  var rf=$("sb_ref");if(rf)rf.onclick=function(){var m=window.prompt("Motif du refus (l’auteur le verra) :","");if(!m)return;sb.rpc("acrb_sub_refuser",{p_id:DOS.id,p_motif:m}).then(function(x){if(x.error){dire(err(x),1);return;}majLocal(x.data);rendreDossier();dire("Dossier renvoyé à son auteur.");});};
  var ro=$("sb_rouv");if(ro)ro.onclick=function(){if(!window.confirm("Rouvrir ce dossier ? Le contrôle et la validation seront à refaire."))return;sb.rpc("acrb_sub_rouvrir",{p_id:DOS.id}).then(function(x){if(x.error){dire(err(x),1);return;}majLocal(x.data);ET=2;rendreDossier();});};}

/* ---------- étape 7 : dossier complet ---------- */
function blocs(){var a=aideDe(DOS),c=DOS.champs,V=VOC[ORG.type],L=[],tot=(c.budget||[]).reduce(function(s,x){return s+(num(x.montant)||0);},0),dem=num(c.montant_demande)||0,cof=(c.cofinancement||[]).reduce(function(s,x){return s+(num(x.montant)||0);},0);
  var ok=DOS.statut==="valide"||DOS.statut==="envoye",AC=function(v){return v==null||String(v).trim()===""?"À COMPLÉTER":String(v);},rep=AC(c.representant)+(c.representant_qualite?", "+c.representant_qualite:"");
  if(!ok)L.push({encadre:"PROJET — dossier non encore validé ("+(ST[DOS.statut]||[DOS.statut])[0]+"). Ne pas envoyer avant le contrôle et la validation."});
  L.push({r2:"Bruxelles, le "+new Date().toLocaleDateString("fr-BE",{day:"numeric",month:"long",year:"numeric"})});
  L.push({r2:(a&&a.organisme?a.organisme:"À l’attention de l’organisme compétent")});
  L.push({pb:"Objet : demande de soutien — "+(a?a.nom:(DOS.titre||""))+" — projet « "+AC(c.titre)+" »"});
  L.push({p:"Madame, Monsieur,"});
  L.push({p:AC(c.nom)+(c.forme?", "+c.forme.charAt(0).toLowerCase()+c.forme.slice(1):"")+", numéro d’entreprise "+AC(c.bce)+", "+(ORG.type==="commercant"?"exploitant établi ":"dont le siège est établi ")+AC(c.adresse)+", sollicite "+(a?"l’aide « "+a.nom+" »":"votre soutien")+" pour le projet « "+AC(c.titre)+" »"+(c.debut?", mené du "+dfr(c.debut)+" au "+dfr(c.fin):"")+"."});
  L.push({p:"Le budget total du projet s’élève à "+eur0(tot)+" ; le soutien demandé est de "+eur0(dem)+(tot>0?", soit "+Math.round(dem/tot*100)+" % du budget":"")+(cof>0?", le solde ("+eur0(cof)+") étant couvert par d’autres financements":"")+"."});
  L.push({p:"Vous trouverez ci-après la présentation du demandeur, la description du projet, son budget, l’argumentaire au regard des critères de l’aide et la liste des pièces jointes. Nous restons à votre disposition pour tout renseignement complémentaire ("+AC(c.email)+(c.tel?", "+c.tel:"")+")."});
  L.push({p:"Veuillez agréer, Madame, Monsieur, l’expression de nos salutations distinguées."});
  L.push({sig:[[V.sig,AC(c.representant),c.representant_qualite||""]]});
  L.push({saut:1});L.push({h:"Dossier de demande — "+AC(c.titre)});
  L.push({h2:"1. Présentation du demandeur"});
  var kv=[["Demandeur",AC(c.nom)],["Forme juridique",c.forme||"À COMPLÉTER"],["Numéro d’entreprise",AC(c.bce)],[ORG.type==="commercant"?"Adresse":"Siège",AC(c.adresse)],["Représentant",rep],["Compte (IBAN)",AC(c.iban)],["Contact",[c.email,c.tel].filter(Boolean).join(" · ")||"À COMPLÉTER"]];
  if(V.membres&&c.membres)kv.push(["Membres",String(c.membres)]);if(V.depuis&&c.depuis)kv.push([V.depuis,String(c.depuis)]);L.push({kv:kv});
  if(c.objet){L.push({h3:V.objet});L.push({p:c.objet});}if(c.activites){L.push({h3:V.act});L.push({p:c.activites});}
  L.push({h2:"2. Le projet"});L.push({kv:[["Titre",AC(c.titre)],["Période",c.debut?dfr(c.debut)+" → "+dfr(c.fin):"À COMPLÉTER"],["Lieu",c.lieu||"À COMPLÉTER"],["Public visé",c.public||"À COMPLÉTER"]]});
  L.push({h3:"Résumé"});L.push({p:AC(c.resume)});if(c.objectifs){L.push({h3:"Objectifs"});L.push({p:c.objectifs});}
  L.push({h2:"3. Budget"});
  L.push({h3:"Dépenses"});L.push({table:{cols:["Poste","Montant"],w:[4,1.3],droite:[1],rows:(c.budget||[]).map(function(x){return [x.poste||"",eur(num(x.montant)||0)];}).concat([["Total des dépenses",eur(tot)]])}});
  L.push({h3:"Financement"});L.push({table:{cols:["Source","Montant"],w:[4,1.3],droite:[1],rows:[["Soutien demandé"+(a?" — "+a.nom:""),eur(dem)]].concat((c.cofinancement||[]).map(function(x){return [x.source||"",eur(num(x.montant)||0)];})).concat([["Total du financement",eur(dem+cof)]])}});
  if(a&&a.taux_texte)L.push({pi:"Règle de l’aide : "+a.taux_texte+". Part demandée : "+(tot>0?Math.round(dem/tot*100):0)+" % du budget."});
  if(a&&(a.criteres||[]).length){L.push({h2:"4. Argumentaire au regard des critères de l’aide"});a.criteres.forEach(function(cr){L.push({h3:cr.libelle});L.push({p:(c.argu||{})[cr.id]||"À COMPLÉTER"});});}
  L.push({h2:(a&&(a.criteres||[]).length?"5":"4")+". Documentation"});L.push({p:c.documentation||"—"});
  L.push({h2:(a&&(a.criteres||[]).length?"6":"5")+". Pièces jointes"});
  ((a&&a.pieces)||[]).forEach(function(p,i){L.push({li:(i+1)+". "+p.libelle+(DOS.pieces[p.id]?" — jointe":" — à joindre")+(p.obligatoire===false?" (facultative)":"")});});if(!(a&&(a.pieces||[]).length))L.push({p:"Voir la documentation ci-dessus."});
  L.push({h2:"Déclaration et signature"});L.push({p:"Le soussigné, "+rep+", certifie l’exactitude des renseignements fournis dans ce dossier et s’engage à utiliser le soutien obtenu conformément à l’objet de la demande et à en justifier l’emploi."});
  L.push({sig:[["Fait à Bruxelles, le",new Date().toLocaleDateString("fr-BE"),""],[V.sig,AC(c.representant),c.representant_qualite||""]]});
  L.push({f:"Dossier SUB-"+DOS.id+(ok?" — validé le "+dth(DOS.valide_le):" — projet")});
  return L;}
function courriel(){var a=aideDe(DOS),c=DOS.champs,to=(a&&a.conditions&&a.conditions.email_depot)||"",sujet="Demande de soutien — "+(a?a.nom:DOS.titre)+" — "+(c.nom||"");
  var corps="Madame, Monsieur,\n\nVeuillez trouver en pièce jointe la demande de "+(c.nom||"🔴 À COMPLÉTER")+" (n° d’entreprise "+(c.bce||"🔴 À COMPLÉTER")+") pour "+(a?"l’aide « "+a.nom+" »":"votre soutien")+", projet « "+(c.titre||"🔴 À COMPLÉTER")+" », ainsi que les pièces demandées :\n"+
    ((a&&a.pieces)||[]).map(function(p){return "- "+p.libelle;}).join("\n")+"\n\nMontant demandé : "+eur0(num(c.montant_demande)||0)+".\n\nNous restons à votre disposition.\n\n"+(c.representant||"🔴 À COMPLÉTER")+(c.representant_qualite?", "+c.representant_qualite:"")+"\n"+(c.nom||"")+"\n"+[c.email,c.tel].filter(Boolean).join(" · ");
  return "mailto:"+encodeURIComponent(to)+"?subject="+encodeURIComponent(sujet)+"&body="+encodeURIComponent(corps);}
function nomOrg(){var c=DOS.champs;return {nom:c.nom||ORG.nom,sous:[c.forme,c.bce?"N° d’entreprise "+c.bce:""].filter(Boolean).join(" · "),ligne:c.adresse||"",pied:[c.nom||ORG.nom,c.bce?"N° d’entreprise "+c.bce:"",c.adresse].filter(Boolean).join(" · ")};}
function et7(Z){var ok=DOS.statut==="valide"||DOS.statut==="envoye";
  Z.innerHTML=(ok?'':'<p class="sb-msg bad">Le dossier n’est pas encore validé : le PDF porte la mention « PROJET ». Validez-le (étape 6) avant l’envoi.</p>')+
    '<p>Le dossier complet comprend la lettre de demande, la présentation de '+esc(VOC[ORG.type].org)+', le projet, le budget, l’argumentaire face aux critères, la liste des pièces et la signature.</p>'+
    '<button class="sb-b" type="button" id="sb_pdf" data-aide="Crée le PDF du dossier complet, prêt à signer et à joindre au courriel.">Créer le PDF du dossier complet</button><div id="sb_pdfz"></div>'+
    '<h3>Envoi</h3><p class="sb-note">La plateforme n’envoie rien elle-même : le bouton ouvre un brouillon de courriel prérempli dans votre messagerie ; joignez le PDF et les pièces, relisez, puis envoyez.</p>'+
    '<a class="sb-b o" id="sb_mail" href="'+courriel()+'" data-aide="Ouvre un brouillon de courriel prérempli (destinataire, objet, texte). Rien n’est envoyé sans vous.">Préparer le courriel d’envoi</a>'+
    (DOS.statut==="envoye"?'<p class="sb-msg ok">Envoyé le '+esc(dfr(DOS.envoye_le))+' — preuve : '+esc(DOS.envoye_preuve||"")+'</p>':ok?'<div class="sb-f" style="margin-top:12px"><label>Date d’envoi<input type="date" id="sb_dte" value="'+auj()+'"></label><label>Preuve d’envoi<input id="sb_prv" placeholder="Accusé de réception, n° de dépôt…" data-aide="Ce qui prouve l’envoi : numéro de dépôt en ligne, accusé de réception, courriel envoyé le…"></label></div><button class="sb-b" type="button" id="sb_env" data-aide="Note la date et la preuve d’envoi. Le dossier ne pourra plus être modifié.">Marquer comme envoyé</button>':'');
  $("sb_pdf").onclick=function(){var b=this;if(!window.DOCACRB||!window.PDFLib){dire("Le moteur PDF n’est pas chargé.",1);return;}b.disabled=true;b.textContent="Création…";
    var o={reference:"SUB-"+DOS.id,date:new Date().toLocaleDateString("fr-BE")};if(!ORG.acrb)o.emetteur=nomOrg();
    enregistrer().then(function(){return window.DOCACRB.pdf(blocs(),"Demande de soutien — "+(DOS.champs.titre||DOS.titre||""),o);}).then(function(blob){b.disabled=false;b.textContent="Recréer le PDF";window.SUBSIDES.dernierPdf=blob;
      window.DOCACRB.actions($("sb_pdfz"),blob,"Dossier "+(DOS.champs.titre||DOS.titre||"subside")+" SUB-"+DOS.id);}).catch(function(e){b.disabled=false;b.textContent="Créer le PDF du dossier complet";dire("PDF impossible : "+(e.message||e),1);});};
  var en=$("sb_env");if(en)en.onclick=function(){en.disabled=true;sb.rpc("acrb_sub_envoye",{p_id:DOS.id,p_date:$("sb_dte").value||null,p_preuve:$("sb_prv").value}).then(function(x){en.disabled=false;if(x.error){dire(err(x),1);return;}majLocal(x.data);rendreDossier();dire("Envoi noté.");});};}

/* ---------- portail du fondateur : libellés fournis par la base au seul fondateur ---------- */
function portail(){var box=$("iaf_box");if(!box)return;
  sb.rpc("acrb_ia_portail").then(function(x){if(x.error||!x.data||!x.data.ui){box.innerHTML='<p class="sb-note">'+esc(err(x)||"Réservé au fondateur.")+'</p>';return;}var P=x.data,U=P.ui,g=P.reglage||{},ts=P.tarifs||[],ms=P.mois||[],os=P.organisations||[];
    var t=ts.filter(function(z){return z.modele===g.modele_defaut;})[0],ex=t?(3000*t.entree_usd_mtok+2000*t.sortie_usd_mtok)/1e6:null;
    var mois=[];ms.forEach(function(m){if(mois.indexOf(m.mois)<0)mois.push(m.mois);});if(mois.indexOf(auj().slice(0,7))<0)mois.unshift(auj().slice(0,7));
    var h='<form class="sb-f" id="iaf_f"><label>'+esc(U.t)+'<input name="taux" type="number" min="0" step="1" value="'+esc(g[U.k])+'"></label><label>'+esc(U.eur_usd)+'<input name="eur_usd" type="number" min="0.1" step="0.0001" value="'+esc(g.eur_usd)+'"></label>'+
      '<label>'+esc(U.modele)+'<select name="modele_defaut">'+ts.map(function(z){return '<option'+(z.modele===g.modele_defaut?' selected':'')+'>'+esc(z.modele)+'</option>';}).join("")+'</select></label><label>'+esc(U.plafond)+'<input name="plafond_mensuel_eur" type="number" min="0" step="1" value="'+esc(g.plafond_mensuel_eur)+'"></label>'+
      '<div class="w">'+os.map(function(o){return '<label style="display:grid;grid-template-columns:1fr 120px;gap:8px;align-items:center;margin:4px 0">'+esc(TYPE[o.type]+" · "+o.nom)+'<input data-pl="'+esc(o.id)+'" type="number" min="0" step="1" placeholder="défaut" value="'+esc(o.plafond==null?"":o.plafond)+'"></label>';}).join("")+'</div>'+
      '<div class="w"><button class="sb-b">Enregistrer</button><span class="sb-msg" id="iaf_ok"></span></div></form>'+
      (ex!=null?'<p class="sb-note">Requête type (3 000 jetons d’entrée, 2 000 de sortie) avec '+esc(g.modele_defaut)+' : '+esc(U.cout)+' '+eur(ex/g.eur_usd)+' → '+esc(U.prix)+' '+eur(Math.ceil(ex*(1+g[U.k]/100)/g.eur_usd*100)/100)+'.</p>':'')+
      '<h3>Tarifs du fournisseur</h3><div class="sb-t"><table><tr><th>Modèle</th><th class="n">'+esc(U.entree)+'</th><th class="n">'+esc(U.sortie)+'</th><th>Source</th></tr>'+ts.map(function(z){return '<tr><td>'+esc(z.modele)+'</td><td class="n">'+esc(z.entree_usd_mtok)+'</td><td class="n">'+esc(z.sortie_usd_mtok)+'</td><td>'+esc(z.source||"")+(z.verifie_le?' · vérifié le '+esc(dfr(z.verifie_le)):' · <b>à vérifier</b>')+'</td></tr>';}).join("")+'</table></div>'+
      '<form class="sb-f" id="iaf_t" style="margin-top:8px"><label>Modèle<input name="m" required></label><label>'+esc(U.entree)+'<input name="e" type="number" step="0.001" min="0" required></label><label>'+esc(U.sortie)+'<input name="s" type="number" step="0.001" min="0" required></label><label>Vérifié le<input name="v" type="date"></label><label class="w">Source<input name="src" placeholder="Page officielle des prix consultée"></label><div class="w"><button class="sb-b o">Ajouter ou mettre à jour le tarif</button></div></form>'+
      '<h3>Relevé de facturation par organisation</h3><div class="sb-f"><label>Mois<select id="iaf_m">'+mois.map(function(m){return '<option>'+m+'</option>';}).join("")+'</select></label><label>&nbsp;<button class="sb-b o" type="button" id="iaf_csv" data-aide="Télécharge le relevé du mois, organisation par organisation et requête par requête, pour la facture de la plateforme.">Exporter le relevé (CSV)</button></label></div><div id="iaf_rel"></div>'+
      '<h3>Dernières requêtes</h3><div class="sb-t"><table><tr><th>Quand</th><th>Qui</th><th>Action</th><th class="n">Jetons</th><th class="n">'+esc(U.cout)+'</th><th class="n">'+esc(U.prix)+'</th></tr>'+(P.recentes||[]).map(function(r){return '<tr><td>'+esc(dth(r.quand))+'</td><td>'+esc(r.email)+'</td><td>'+esc(r.action)+' · '+esc(r.statut)+'</td><td class="n">'+esc((r.jetons_entree||0)+" / "+(r.jetons_sortie||0))+'</td><td class="n">'+(r.cout_reel_usd!=null?esc(Number(r.cout_reel_usd).toFixed(4))+' $':'—')+'</td><td class="n">'+eur(r.prix_eur)+'</td></tr>';}).join("")+'</table></div>'+
      '<h3>Permission « subsides », personne par personne</h3><div id="iaf_perm"><p class="sb-note">Chargement…</p></div>';
    box.innerHTML=h;
    function releve(){var m=$("iaf_m").value;sb.rpc("acrb_ia_releve",{p_mois:m}).then(function(y){var rs=Array.isArray(y.data)?y.data:[];window.SUBSIDES.releve=rs;
      $("iaf_rel").innerHTML=rs.length?'<div class="sb-t"><table><tr><th>Organisation</th><th class="n">Requêtes</th><th class="n">'+esc(U.prix)+'</th><th class="n">'+esc(U.cout)+'</th><th class="n">'+esc(U.ecart)+'</th></tr>'+rs.map(function(r){return '<tr><td>'+esc(r.organisation)+'<br><span class="sb-note">'+esc(TYPE[r.type]||"")+(r.bce?' · '+esc(r.bce):'')+'</span></td><td class="n">'+r.requetes+'</td><td class="n">'+eur(r.prix_eur)+'</td><td class="n">'+eur(r.cout_reel_eur)+'</td><td class="n">'+eur(r.ecart_eur)+'</td></tr>';}).join("")+'</table></div>':'<p class="sb-note">Aucune requête facturée ce mois-là.</p>';});}
    releve();$("iaf_m").onchange=releve;
    $("iaf_csv").onclick=function(){var rs=window.SUBSIDES.releve||[],q=function(v){v=String(v==null?"":v);return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;},L=[["mois","organisation","type","bce","quand","demandeur","action","dossier",U.prix].map(q).join(";")];
      rs.forEach(function(r){(r.lignes||[]).forEach(function(l){L.push([r.mois,r.organisation,r.type,r.bce,l.quand,l.email,l.action,l.dossier_id,String(l.prix_eur).replace(".",",")].map(q).join(";"));});L.push([r.mois,r.organisation+" — total",r.type,r.bce,"","","",r.requetes+" requête(s)",String(r.prix_eur).replace(".",",")].map(q).join(";"));});
      var a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+L.join("\r\n")],{type:"text/csv"}));a.download="releve-ia-"+$("iaf_m").value+".csv";document.body.appendChild(a);a.click();a.remove();};
    $("iaf_f").onsubmit=function(e){e.preventDefault();var f=e.target,pl={},pr={};f.querySelectorAll("[data-pl]").forEach(function(i){pl[i.dataset.pl]=i.value===""?null:+i.value;});
      pr[U.k]=+f.taux.value;pr.eur_usd=+f.eur_usd.value;pr.modele_defaut=f.modele_defaut.value;pr.plafond_mensuel_eur=+f.plafond_mensuel_eur.value;pr.plafonds=pl;sb.rpc("acrb_ia_regler",{p:pr}).then(function(y){var o=$("iaf_ok");o.className="sb-msg "+(y.error?"bad":"ok");o.textContent=y.error?"Non enregistré : "+err(y):"✓ Enregistré";if(!y.error)setTimeout(portail,500);});};
    $("iaf_t").onsubmit=function(e){e.preventDefault();var f=e.target;sb.rpc("acrb_ia_tarif_maj",{p_modele:f.m.value,p_entree:+f.e.value,p_sortie:+f.s.value,p_source:f.src.value||null,p_verifie_le:f.v.value||null}).then(function(y){if(y.error)alert(err(y));else portail();});};
    sb.rpc("acrb_sub_personnes").then(function(y){var ps=Array.isArray(y.data)?y.data:[],z=$("iaf_perm");if(!z)return;
      z.innerHTML=ps.length?'<div class="sb-t"><table>'+ps.map(function(p){return '<tr><td>'+esc(p.email)+'<br><span class="sb-note">'+esc(p.qui||"")+'</span></td><td><select data-pe="'+esc(p.email)+'"><option value=""'+(p.reglage==null?' selected':'')+'>Par défaut</option><option value="1"'+(p.reglage===true?' selected':'')+'>Accordée</option><option value="0"'+(p.reglage===false?' selected':'')+'>Retirée</option></select></td></tr>';}).join("")+'</table></div><span class="sb-msg" id="iaf_pok"></span>':'<p class="sb-note">Personne pour l’instant.</p>';
      z.querySelectorAll("[data-pe]").forEach(function(s){s.onchange=function(){s.disabled=true;sb.rpc("acrb_perm_regler",{p_email:s.dataset.pe,p_cle:"subsides",p_valeur:s.value===""?null:s.value==="1"}).then(function(r){s.disabled=false;var o=$("iaf_pok");o.className="sb-msg "+(r.error?"bad":"ok");o.textContent=r.error?"Non enregistré : "+err(r):"✓ Enregistré";});};});});});}

function charger(){if(!BOX)return;sb.rpc("acrb_sub_accueil").then(function(x){var d=x&&x.data;if(!d||Array.isArray(d)||!Array.isArray(d.organisations))d={organisations:[],aides:[],dossiers:[]};
  d.organisations=d.organisations.filter(function(o){return O.espace==="commercant"?!o.acrb:o.acrb;});d.aides=d.aides||[];d.dossiers=(d.dossiers||[]).filter(function(x){return d.organisations.some(function(o){return o.id===x.organisation_id;});});D=d;
  var carte=O.carte&&$(O.carte);if(carte)carte.hidden=O.espace!=="commercant"&&!D.organisations.length;
  if(x&&x.error){BOX.innerHTML='<p class="sb-note">'+esc(err(x))+'</p>';return;}
  if(DOS){var f=D.dossiers.filter(function(z){return z.id===DOS.id;})[0];if(f){ouvrir(f.id,ET);return;}}rendreAccueil();});}

window.SUBSIDES={init:function(_sb,o){sb=_sb;O=o||{};BOX=$(O.box||"sub_box");
  if(!lie){lie=true;var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);}
  var roles=O.roles||[];if(roles.indexOf("fondateur")>=0&&$("c_iaf")){$("c_iaf").hidden=false;portail();}
  charger();},recharger:charger,controle:controle,portail:portail,etat:function(){return {dossier:DOS,etape:ET};}};
})();
