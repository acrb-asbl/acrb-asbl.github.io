/* Menu des espaces privés : un long mur de rubriques devient un menu à deux niveaux (section, puis rubrique).
   Une seule rubrique à l'écran ; « Accueil » montre toutes les rubriques accessibles en tuiles, avec une recherche.
   Adresse de chaque rubrique : #/section/rubrique (lien partageable, bouton retour du navigateur).
   Le menu ne décide pas des droits : il ne montre que les rubriques que la page a déjà rendues visibles. */
(function(){
var C=null,grid=null,bar=null,home=null,obs=null,t=null,cur={s:"",r:""},B={},I={},T={},PRENOM="";
/* compteurs « à traiter » posés par les modules (ex. signalements non traités) : ESPNAV.badge(idCarte, n) */
function bd(n){return n>0?' <span class="bd" aria-label="'+n+' à traiter">'+n+'</span>':"";}
function bdS(s){return s.rs.reduce(function(a,r){return a+(+B[r.el.id]||0);},0);}
function $(i){return document.getElementById(i);}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function norm(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");}
var CSS='.nv{position:sticky;top:0;z-index:30;background:#fff;border:1px solid var(--line,#dfe3ea);border-top:4px solid var(--navy,#14233c);margin:0 0 16px;box-shadow:0 2px 8px rgba(20,35,60,.06)}'+
'.nv .r1,.nv .r2{display:flex;flex-wrap:wrap;gap:2px}'+
'.nv .r1 a{flex:0 0 auto;display:flex;align-items:center;gap:6px;min-height:46px;padding:0 14px;text-decoration:none;color:#222;font:700 15px "Libre Franklin",Arial,sans-serif;border-bottom:3px solid transparent;white-space:nowrap}'+
'.nv .r1 a.on{border-bottom-color:var(--brick,#b23a2b);color:var(--navy,#14233c)}.nv .r1 a .n{font:600 12px "Source Sans 3",sans-serif;color:var(--muted,#5f6675)}'+
'.nv .r2{border-top:1px solid var(--line,#dfe3ea);background:#f7f8fa;padding:6px 8px;gap:6px}.nv .r2[hidden]{display:none}'+
'.nv .r2 a{flex:0 0 auto;min-height:38px;display:flex;align-items:center;padding:0 12px;border:1px solid #c6ccd6;background:#fff;color:#222;text-decoration:none;font:600 14px "Source Sans 3",sans-serif;white-space:nowrap}'+
'.nv .r2 a.on{background:var(--navy,#14233c);border-color:var(--navy,#14233c);color:#fff}'+
'.nv .bd,.nvh .tl .bd{display:inline-block;min-width:20px;padding:0 6px;border-radius:10px;background:var(--brick,#b23a2b);color:#fff;font:700 12px/18px "Libre Franklin",Arial,sans-serif;text-align:center;margin-left:6px}.nv .r2 a.on .bd{background:#fff;color:var(--brick,#b23a2b)}'+
'.nv-off{display:none!important}.nvh{grid-column:1/-1}.nvh[hidden]{display:none}.nvh .q{width:100%;padding:12px 14px;border:1px solid #c6ccd6;font:16px "Source Sans 3",sans-serif;margin:0 0 14px}'+
'.nvh h3{font:800 13px "Libre Franklin",Arial,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#5f6675);margin:18px 0 8px}.nvh h3:first-of-type{margin-top:4px}'+
'.nvh .tl{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}'+
'.nvh .tl a{display:block;background:#fff;border:1px solid var(--line,#dfe3ea);border-left:4px solid var(--navy,#14233c);padding:12px 14px;text-decoration:none;color:#222;min-height:64px}'+
'.nvh .tl a:hover,.nvh .tl a:focus{border-left-color:var(--brick,#b23a2b)}.nvh .tl b{display:block;font:800 15.5px "Libre Franklin",Arial,sans-serif;color:var(--navy,#14233c)}.nvh .tl span{display:block;font-size:13.5px;color:var(--muted,#5f6675);line-height:1.35;margin-top:3px}'+
'#par_hub{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}'+
'#par_hub a{display:block;background:#fff;border:1px solid var(--line,#dfe3ea);border-left:4px solid var(--navy,#14233c);padding:12px 14px;text-decoration:none;color:#222;min-height:64px}'+
'#par_hub a:hover,#par_hub a:focus{border-left-color:var(--brick,#b23a2b)}#par_hub b{display:block;font:800 15.5px "Libre Franklin",Arial,sans-serif;color:var(--navy,#14233c)}#par_hub span{display:block;font-size:13.5px;color:var(--muted,#5f6675);line-height:1.35;margin-top:3px}'+
'.nvl-top{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;margin:0 0 14px}.nvl-hi{font:800 22px "Libre Franklin",Arial,sans-serif;color:var(--navy,#14233c)}.nvl-hi small{display:block;font:500 14px "Source Sans 3",sans-serif;color:var(--muted,#5f6675);margin-top:2px}'+
'.nvl-todo{background:#fff;border:1px solid var(--line,#dfe3ea);border-left:4px solid var(--brick,#b23a2b)}.nvl-todo>b{display:block;padding:10px 14px 4px;font:800 13px "Libre Franklin",Arial,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:var(--brick,#b23a2b)}'+
'.nvl-todo a{display:flex;gap:10px;align-items:center;padding:9px 14px;border-top:1px solid #eef0f4;text-decoration:none;color:#222;font-size:15px;min-height:44px}.nvl-todo a:hover,.nvl-todo a:focus{background:#f7f8fa}.nvl-todo a i{flex:0 0 10px;height:10px;border-radius:50%;background:#e2a400}.nvl-todo a i.r{background:var(--brick,#b23a2b)}.nvl-todo a i.ok{background:#2f8a4b}'+
'.nvl-todo a span{flex:1 1 auto}.nvl-todo a em{flex:0 0 auto;font-style:normal;font:700 13px "Source Sans 3",sans-serif;color:var(--muted,#5f6675)}.nvl-todo .rien{padding:10px 14px;color:var(--muted,#5f6675);font-size:14.5px;border-top:1px solid #eef0f4}'+
'.nvl-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:0 0 6px}'+
'.nvl-t{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-height:132px;padding:14px;background:#fff;border:1px solid var(--line,#dfe3ea);border-radius:14px;text-decoration:none;color:#222;box-shadow:0 1px 2px rgba(20,35,60,.05);transition:transform .12s,box-shadow .12s}'+
'.nvl-t:hover,.nvl-t:focus{transform:translateY(-2px);box-shadow:0 6px 16px rgba(20,35,60,.12);outline:none}.nvl-t:focus-visible{outline:3px solid var(--navy,#14233c);outline-offset:2px}'+
'.nvl-ic{display:flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:12px;background:var(--tc,#14233c);color:#fff}.nvl-ic svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'+
'.nvl-t b{font:800 15px/1.2 "Libre Franklin",Arial,sans-serif;color:var(--navy,#14233c)}.nvl-t small{font-size:13px;line-height:1.3;color:var(--muted,#5f6675)}.nvl-t small.u{color:var(--brick,#b23a2b);font-weight:700}.nvl-t small.d{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}'+
'.nvl-t .bd{position:absolute;top:10px;right:10px;margin:0;min-width:24px;padding:0 7px;border-radius:12px;background:var(--brick,#b23a2b);color:#fff;font:700 13px/22px "Libre Franklin",Arial,sans-serif;text-align:center}'+
'@media(max-width:700px){.nvl-g{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.nvl-t{min-height:120px;padding:12px}.nvl-hi{font-size:19px}}'+
'.nvh .vide{color:var(--muted,#5f6675);font-size:15px}'+
'@media(max-width:700px){.nv .r1{display:grid;grid-template-columns:repeat(3,1fr);gap:0}.nv .r1 a{justify-content:center;padding:0 4px;font-size:14px;min-height:44px}.nv .r1 a .n{display:none}.nv .r2{flex-wrap:wrap;overflow-x:visible}.nv .r2 a{min-height:36px;padding:0 10px;font-size:13.5px}}';


/* Icônes des fenêtres de l'accueil (traits simples, sans police d'icônes) et couleur par section */
var SEC_C={conseil:"#14233c",commercants:"#0f6e6e",finances:"#2f7a3e",quartier:"#6b3fa0",association:"#5b6573",autres:"#5b6573"};
var P={cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',list:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',vote:'<path d="M4 20h16"/><rect x="5" y="9" width="14" height="11" rx="1"/><path d="M9 13l2 2 4-4"/><path d="M8 9V4h8v5"/>',
 star:'<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 010 7M18 14.6c2 .7 3.2 2.5 3.5 5.4"/>',
 doc:'<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/>',euro:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5a4.5 4.5 0 100 7M7 11h6M7 13.5h6"/>',
 award:'<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',store:'<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 01-6 0 3 3 0 01-6 0 3 3 0 01-6 0z"/><path d="M5 13v8h14v-8"/>',
 map:'<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',alert:'<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.5"/>',chat:'<path d="M4 5h16v11H9l-5 4z"/>',
 news:'<rect x="3" y="4" width="15" height="16" rx="1"/><path d="M18 8h3v10a2 2 0 01-2 2M7 8h7M7 12h7M7 16h4"/>',book:'<path d="M4 4h6a3 3 0 013 3v13a2 2 0 00-2-2H4z"/><path d="M20 4h-6a3 3 0 00-3 3v13a2 2 0 012-2h7z"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1A1.6 1.6 0 007 19.4a1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 003.5 14H3a2 2 0 110-4h.1A1.6 1.6 0 004.6 7a1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 009 3.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"/>',
 key:'<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3M16 7l3 3"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',mega:'<path d="M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1z"/><path d="M15 9a4 4 0 010 6M18 6a8 8 0 010 12"/>',
 inbox:'<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 2h6l1-2h5"/>',pin:'<path d="M12 21s-7-6.3-7-12a7 7 0 0114 0c0 5.7-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',edit:'<path d="M4 20h4L20 8l-4-4L4 16z"/>',folder:'<path d="M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>'};
var ICK={reunions:"cal","plan-action":"list",votes:"vote",saisons:"star",administrateurs:"users",actes:"doc",statuts:"book",membres:"users",fiches:"store",signalements:"alert",avis:"chat",terrain:"pin","journal-terrain":"edit",revendications:"key",
 cotisations:"euro",subsides:"award",courrier:"mail","quartier-nord":"news",guide:"map",inscrits:"mega",obligations:"clock",reglages:"gear",acces:"key",permissions:"key",travail:"clock",sponsoring:"mega",demandes:"inbox",journal:"edit"};
function icone(k){var d=P[ICK[k]]||P[Object.keys(ICK).filter(function(x){return k.indexOf(x)===0;}).map(function(x){return ICK[x];})[0]]||P.folder;return '<svg viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>';}
function dc(s){var p=String(s||"").slice(0,10).split("-");return p.length===3?p[2]+"/"+p[1]:"";}
function auj(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
/* Ce qui attend le conseil, calculé à partir des données déjà chargées par les modules (aucune requête en plus) */
function aFaire(){var L=[],j=auj();
  try{var D=window.REUNIONS&&REUNIONS.donnees&&REUNIONS.donnees();if(D&&D.reunions){var TY={ca:"Conseil d’administration",ago:"Assemblée générale",age:"Assemblée générale extraordinaire",autre:"Réunion",ecrite_ca:"Décision écrite du conseil",ecrite_ag:"Décision écrite des membres"};
    var pro=D.reunions.filter(function(r){return (r.statut==="preparation"||r.statut==="convoquee")&&r.date_reunion>=j;}).sort(function(a,b){return a.date_reunion<b.date_reunion?-1:1;});
    if(pro[0]){var r=pro[0],ecr=/^ecrite/.test(r.type),quoi=ecr?(r.statut==="preparation"?" — texte à envoyer pour réponse":" — réponses attendues"):(r.statut==="preparation"&&r.type!=="autre"?" — convocation à envoyer":"");
      I.c_reunions={t:ecr?"Réponses avant le "+dc(r.date_reunion):"Prochaine : "+dc(r.date_reunion)+(r.heure?" à "+r.heure:""),u:r.date_reunion===j};L.push({n:r.date_reunion===j?"r":"w",t:(r.titre||TY[r.type]||"Réunion")+quoi,d:r.date_reunion,h:"#/conseil/reunions"});}
    else I.c_reunions={t:"Aucune réunion prévue"};
    D.reunions.filter(function(r){return r.statut==="tenue"&&r.type!=="autre";}).forEach(function(r){L.push({n:"w",t:"Procès-verbal à signer : "+(r.titre||r.numero),d:r.date_reunion,h:"#/conseil/reunions"});});}}catch(e){}
  try{var A=window.ENREG&&ENREG.actions&&ENREG.actions();if(A){var ouv=A.filter(function(a){return a.etat==="a_faire"||a.etat==="en_cours";}),ret=ouv.filter(function(a){return a.echeance&&a.echeance<j;}),nx=ouv.filter(function(a){return a.echeance&&a.echeance>=j;}).sort(function(a,b){return a.echeance<b.echeance?-1:1;})[0];
    I.c_actions={t:ret.length?ret.length+" en retard":nx?"Prochaine échéance : "+dc(nx.echeance):ouv.length?ouv.length+" ouverte"+(ouv.length>1?"s":""):"Tout est à jour",u:ret.length>0};
    ret.slice(0,3).forEach(function(a){L.push({n:"r",t:"En retard : "+a.titre+(a.responsable?" ("+a.responsable+")":""),d:a.echeance,h:"#/conseil/plan-action"});});
    if(nx)L.push({n:"w",t:nx.titre+(nx.responsable?" ("+nx.responsable+")":""),d:nx.echeance,h:"#/conseil/plan-action"});}}catch(e){}
  Object.keys(T).forEach(function(k){(T[k]||[]).forEach(function(x){L.push(x);});});
  return L.sort(function(a,b){if((a.n==="r")!==(b.n==="r"))return a.n==="r"?-1:1;return String(a.d||"9")<String(b.d||"9")?-1:1;}).slice(0,6);}

/* Trouve la carte d'une rubrique : par identifiant, ou par le début de son titre (« h2:Mes commerces »). */
function carte(sel){
  if(sel.indexOf("h2:")!==0)return $(sel);
  var t=norm(sel.slice(3)),hs=grid.querySelectorAll(".c > h2");
  for(var i=0;i<hs.length;i++)if(norm(hs[i].textContent).indexOf(t)===0)return hs[i].parentNode;return null;
}
function resume(el){var p=el.querySelector(":scope > p");var s=p?p.textContent.trim():"";var i=s.search(/[.!?](\s|$)/);if(i>0&&i<60){var j=s.slice(i+1).search(/[.!?](\s|$)/);if(j>0)i=i+1+j;}s=i>0?s.slice(0,i+1):s;return s.length>220?s.slice(0,217)+"…":s;}

/* Rubriques actuellement accessibles, dans l'ordre du menu. */
function dispo(){
  var out=[];C.sections.forEach(function(s){var rs=[];s.rubriques.forEach(function(r){var el=carte(r[0]);if(el&&!el.hidden)rs.push({k:r[1],l:r[2],el:el,d:r[3]||resume(el)});});
    if(rs.length)out.push({k:s.k,l:s.l,rs:rs});});
  /* une rubrique ajoutée plus tard sans être rangée dans le menu ne disparaît jamais : elle va dans « Autres » */
  var pris=[];out.forEach(function(s){s.rs.forEach(function(r){pris.push(r.el);});});
  var aut=toutes().filter(function(e){return e!==home&&!e.hidden&&pris.indexOf(e)<0;}).map(function(e,i){var h=e.querySelector("h2");return {k:e.id?e.id.replace(/^c_/,"").replace(/_/g,"-"):"r"+i,l:h?h.textContent.split(" — ")[0].trim():"Rubrique",el:e,d:resume(e)};});
  if(aut.length)out.push({k:"autres",l:"Autres",rs:aut});
  return out;
}
function toutes(){var a=[];grid.querySelectorAll(":scope > .c").forEach(function(e){a.push(e);});return a;}

function rendre(){
  var ss=dispo(),n=ss.reduce(function(a,s){return a+s.rs.length;},0);
  if(n<2){ /* une seule rubrique (ou aucune) : pas de menu, tout reste affiché */
    if(bar)bar.hidden=true;if(home)home.hidden=true;toutes().forEach(function(e){e.classList.remove("nv-off");});return;}
  if(!bar){bar=document.createElement("div");bar.className="nv";bar.setAttribute("role","navigation");bar.setAttribute("aria-label","Menu de l'espace");grid.parentNode.insertBefore(bar,grid);
    bar.addEventListener("click",function(e){var a=e.target.closest("a[href^='#/']");if(!a)return;e.preventDefault();aller(a.getAttribute("href"),true);});}
  if(!home){home=document.createElement("div");home.className="nvh c full";home.style.borderTop="0";home.style.background="transparent";home.style.border="0";home.style.padding="0";grid.insertBefore(home,grid.firstChild);
    home.addEventListener("click",function(e){var a=e.target.closest("a[href^='#/']");if(!a)return;e.preventDefault();aller(a.getAttribute("href"),true);});}
  bar.hidden=false;
  var h=location.hash||"",m=/^#\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?/.exec(h),sk=m?m[1]:"accueil",rk=m&&m[2]||"";
  var S=ss.filter(function(s){return s.k===sk;})[0];if(!S){sk="accueil";rk="";}
  var R=S?(S.rs.filter(function(r){return r.k===rk;})[0]||S.rs[0]):null;if(R)rk=R.k;
  cur={s:sk,r:rk};
  bar.innerHTML='<div class="r1"><a href="#/accueil"'+(sk==="accueil"?' class="on" aria-current="page"':'')+' data-aide="Revient à l’accueil : toutes vos rubriques en tuiles et une recherche pour aller droit au but.">Accueil</a>'+ss.map(function(s){return '<a href="#/'+s.k+'"'+(s.k===sk?' class="on" aria-current="page"':'')+' data-aide="'+esc("Ouvre la section « "+s.l+" » : "+s.rs.map(function(r){return r.l;}).join(", ")+".")+'">'+esc(s.l)+(s.rs.length>1?' <span class="n">'+s.rs.length+'</span>':'')+bd(bdS(s))+'</a>';}).join("")+'</div>'+
    '<div class="r2"'+(S&&S.rs.length>1?'':' hidden')+'>'+(S?S.rs.map(function(r){return '<a href="#/'+S.k+'/'+r.k+'"'+(r.k===rk?' class="on" aria-current="true"':'')+' data-nav-card="'+esc(r.el.id||"")+'" data-aide="'+esc(r.d||("Ouvre la rubrique « "+r.l+" »."))+'">'+esc(r.l)+bd(+B[r.el.id]||0)+'</a>';}).join(""):"")+'</div>';
  var on=bar.querySelector(".r1 a.on");if(on&&on.scrollIntoView)try{on.scrollIntoView({block:"nearest",inline:"nearest"});}catch(e){}
  var vis=R?R.el:null;
  toutes().forEach(function(e){if(e===home)return;e.classList.toggle("nv-off",e!==vis);});
  home.hidden=sk!=="accueil";
  if(sk==="accueil"&&!home.querySelector(".q")){
    home.innerHTML='<div class="nvl-top"></div><input class="q" type="search" placeholder="Chercher un dossier : facture, vote, réunion, accès…" aria-label="Rechercher un dossier"><div class="tls"></div>';setTimeout(function(){if(cur.s==="accueil")tuiles();},2500);setTimeout(function(){if(cur.s==="accueil")tuiles();},7000);
    home.querySelector(".q").addEventListener("input",tuiles);
    home.querySelector(".q").addEventListener("keydown",function(e){if(e.key==="Enter"){var a=home.querySelector(".tl a");if(a){e.preventDefault();aller(a.getAttribute("href"),true);}}});
  }
  if(sk==="accueil")tuiles();
  /* chaque bouton de rubrique porte l'identifiant de sa carte, même s'il n'est pas affiché (essais automatiques) */
  var idx=bar.querySelector(".nvidx");if(!idx){idx=document.createElement("div");idx.className="nvidx";idx.hidden=true;bar.appendChild(idx);}
  idx.innerHTML=ss.map(function(s){return s.rs.map(function(r){return '<a href="#/'+s.k+'/'+r.k+'" data-nav-go="'+esc(r.el.id||"")+'"></a>';}).join("");}).join("");
}
function tuiles(){
  if(!home)return;var q=norm((home.querySelector(".q")||{}).value||"").trim(),ss=dispo(),html="";
  var F=aFaire(),h=new Date().getHours(),sal=h<12?"Bonjour":h<18?"Bon après-midi":"Bonsoir";
  var top='<div class="nvl-hi">'+sal+(PRENOM?" "+esc(PRENOM):"")+'<small>'+esc(new Date().toLocaleDateString("fr-BE",{weekday:"long",day:"numeric",month:"long",year:"numeric"}))+'</small></div>'+
    '<div class="nvl-todo"><b>À faire maintenant'+(function(){var t=F.reduce(function(s,x){return s+(+x.m||0);},0);return F.length?' · '+(t?t.toFixed(2).replace(".",",")+' € à prévoir':'0 € à prévoir'):'';})()+'</b>'+(F.length?F.map(function(x){return '<a href="'+x.h+'" data-aide="Ouvre le dossier concerné."><i class="'+(x.n==="r"?"r":x.n==="ok"?"ok":"")+'"></i><span>'+esc(x.t)+'</span>'+(x.d?'<em>'+esc((x.n==="r"&&x.d<auj()?"en retard · ":"")+(dc(x.d)===dc(auj())?"aujourd’hui":dc(x.d)))+' · '+esc(x.c||"0 €")+'</em>':'<em>'+esc(x.c||"0 €")+'</em>')+'</a>';}).join(""):'<div class="rien">Rien d’urgent. Tout est à jour.</div>')+'</div>';
  var zt=home.querySelector(".nvl-top");if(zt)zt.innerHTML=top;
  ss.forEach(function(s){var rs=s.rs.filter(function(r){return !q||norm(s.l+" "+r.l+" "+r.d+" "+(r.el.textContent||"").slice(0,600)).indexOf(q)>=0;});
    if(rs.length)html+='<h3>'+esc(s.l)+'</h3><div class="nvl-g">'+rs.map(function(r){var inf=I[r.el.id],n=+B[r.el.id]||0;
      return '<a class="nvl-t" href="#/'+s.k+'/'+r.k+'" style="--tc:'+(SEC_C[s.k]||"#14233c")+'" data-aide="'+esc(r.d||r.l)+'"><span class="nvl-ic">'+icone(r.k)+'</span><b>'+esc(r.l)+'</b>'+(inf&&inf.t?'<small'+(inf.u?' class="u"':'')+'>'+esc(inf.t)+'</small>':(r.d?'<small class="d">'+esc(r.d)+'</small>':''))+(n>0?'<span class="bd" aria-label="'+n+' à traiter">'+n+'</span>':'')+'</a>';}).join("")+'</div>';});
  home.querySelector(".tls").innerHTML=html||'<p class="vide">Aucun dossier ne correspond. Essayez un autre mot.</p>';
}
function aller(h,pousser){
  if(pousser&&location.hash!==h){try{history.pushState(null,"",location.pathname+location.search+h);}catch(e){location.hash=h;return;}}
  rendre();var top=bar?bar.getBoundingClientRect().top+window.pageYOffset-8:0;if(window.pageYOffset>top)window.scrollTo(0,top);
}
function plus_tard(){clearTimeout(t);t=setTimeout(rendre,30);}

window.ESPNAV={init:function(conf){
  C=conf;grid=$(conf.grille);if(!grid)return;
  var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
  /* les rubriques apparaissent après la connexion et le chargement des rôles : on suit leurs changements */
  obs=new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var m=ms[i];if(home&&(m.target===home||home.contains(m.target)))continue;if((m.type==="childList"&&m.target===grid)||(m.type==="attributes"&&m.attributeName==="hidden")){plus_tard();return;}}});
  obs.observe(grid,{attributes:true,attributeFilter:["hidden"],subtree:true,childList:true});
  window.addEventListener("hashchange",function(){if(/^#\//.test(location.hash))rendre();});
  window.addEventListener("popstate",function(){rendre();});
  rendre();
},rendre:function(){rendre();},courant:function(){return cur;},
  badge:function(id,n){B[id]=+n||0;if(C&&grid)plus_tard();},
  info:function(id,txt,urgent){I[id]={t:txt,u:!!urgent};if(cur.s==="accueil")plus_tard();},
  aFaire:function(cle,items){T[cle]=items||[];if(cur.s==="accueil")plus_tard();},
  prenom:function(p){var x=String(p||"").split(/\s+/)[0];PRENOM=x?x.charAt(0).toUpperCase()+x.slice(1):"";},
  rafraichir:function(){if(cur.s==="accueil")tuiles();}};
})();
