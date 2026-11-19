/* Menu des espaces privés : un long mur de rubriques devient un menu à deux niveaux (section, puis rubrique).
   Une seule rubrique à l'écran ; « Accueil » montre toutes les rubriques accessibles en tuiles, avec une recherche.
   Adresse de chaque rubrique : #/section/rubrique (lien partageable, bouton retour du navigateur).
   Le menu ne décide pas des droits : il ne montre que les rubriques que la page a déjà rendues visibles. */
(function(){
var C=null,grid=null,bar=null,home=null,obs=null,t=null,cur={s:"",r:""};
function $(i){return document.getElementById(i);}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function norm(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");}
var CSS='.nv{position:sticky;top:0;z-index:30;background:#fff;border:1px solid var(--line,#dfe3ea);border-top:4px solid var(--navy,#14233c);margin:0 0 16px;box-shadow:0 2px 8px rgba(20,35,60,.06)}'+
'.nv .r1,.nv .r2{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}.nv .r1::-webkit-scrollbar,.nv .r2::-webkit-scrollbar{display:none}'+
'.nv .r1 a{flex:0 0 auto;display:flex;align-items:center;gap:6px;min-height:46px;padding:0 14px;text-decoration:none;color:#222;font:700 15px "Libre Franklin",Arial,sans-serif;border-bottom:3px solid transparent;white-space:nowrap}'+
'.nv .r1 a.on{border-bottom-color:var(--brick,#b23a2b);color:var(--navy,#14233c)}.nv .r1 a .n{font:600 12px "Source Sans 3",sans-serif;color:var(--muted,#5f6675)}'+
'.nv .r2{border-top:1px solid var(--line,#dfe3ea);background:#f7f8fa;padding:6px 8px;gap:6px}.nv .r2[hidden]{display:none}'+
'.nv .r2 a{flex:0 0 auto;min-height:38px;display:flex;align-items:center;padding:0 12px;border:1px solid #c6ccd6;background:#fff;color:#222;text-decoration:none;font:600 14px "Source Sans 3",sans-serif;white-space:nowrap}'+
'.nv .r2 a.on{background:var(--navy,#14233c);border-color:var(--navy,#14233c);color:#fff}'+
'.nv-off{display:none!important}.nvh{grid-column:1/-1}.nvh[hidden]{display:none}.nvh .q{width:100%;padding:12px 14px;border:1px solid #c6ccd6;font:16px "Source Sans 3",sans-serif;margin:0 0 14px}'+
'.nvh h3{font:800 13px "Libre Franklin",Arial,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#5f6675);margin:18px 0 8px}.nvh h3:first-of-type{margin-top:4px}'+
'.nvh .tl{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}'+
'.nvh .tl a{display:block;background:#fff;border:1px solid var(--line,#dfe3ea);border-left:4px solid var(--navy,#14233c);padding:12px 14px;text-decoration:none;color:#222;min-height:64px}'+
'.nvh .tl a:hover,.nvh .tl a:focus{border-left-color:var(--brick,#b23a2b)}.nvh .tl b{display:block;font:800 15.5px "Libre Franklin",Arial,sans-serif;color:var(--navy,#14233c)}.nvh .tl span{display:block;font-size:13.5px;color:var(--muted,#5f6675);line-height:1.35;margin-top:3px}'+
'.nvh .vide{color:var(--muted,#5f6675);font-size:15px}'+
'@media(max-width:700px){.nv .r1{display:grid;grid-template-columns:repeat(3,1fr);gap:0}.nv .r1 a{justify-content:center;padding:0 4px;font-size:14px;min-height:44px}.nv .r1 a .n{display:none}.nv .r2{flex-wrap:wrap;overflow-x:visible}.nv .r2 a{min-height:36px;padding:0 10px;font-size:13.5px}}';

/* Trouve la carte d'une rubrique : par identifiant, ou par le début de son titre (« h2:Mes commerces »). */
function carte(sel){
  if(sel.indexOf("h2:")!==0)return $(sel);
  var t=norm(sel.slice(3)),hs=grid.querySelectorAll(".c > h2");
  for(var i=0;i<hs.length;i++)if(norm(hs[i].textContent).indexOf(t)===0)return hs[i].parentNode;return null;
}
function resume(el){var p=el.querySelector(":scope > p");var s=p?p.textContent.trim():"";var i=s.search(/[.:;!?](\s|$)/);s=i>0?s.slice(0,i+1):s;return s.length>110?s.slice(0,107)+"…":s;}

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
  bar.innerHTML='<div class="r1"><a href="#/accueil"'+(sk==="accueil"?' class="on" aria-current="page"':'')+'>Accueil</a>'+ss.map(function(s){return '<a href="#/'+s.k+'"'+(s.k===sk?' class="on" aria-current="page"':'')+'>'+esc(s.l)+(s.rs.length>1?' <span class="n">'+s.rs.length+'</span>':'')+'</a>';}).join("")+'</div>'+
    '<div class="r2"'+(S&&S.rs.length>1?'':' hidden')+'>'+(S?S.rs.map(function(r){return '<a href="#/'+S.k+'/'+r.k+'"'+(r.k===rk?' class="on" aria-current="true"':'')+' data-nav-card="'+esc(r.el.id||"")+'">'+esc(r.l)+'</a>';}).join(""):"")+'</div>';
  var on=bar.querySelector(".r1 a.on");if(on&&on.scrollIntoView)try{on.scrollIntoView({block:"nearest",inline:"nearest"});}catch(e){}
  var vis=R?R.el:null;
  toutes().forEach(function(e){if(e===home)return;e.classList.toggle("nv-off",e!==vis);});
  home.hidden=sk!=="accueil";
  if(sk==="accueil"&&!home.querySelector(".q")){
    home.innerHTML='<input class="q" type="search" placeholder="Aller à… (tapez un mot : facture, vote, accès, photo…)" aria-label="Rechercher une rubrique"><div class="tls"></div>';
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
  ss.forEach(function(s){var rs=s.rs.filter(function(r){return !q||norm(s.l+" "+r.l+" "+r.d+" "+(r.el.textContent||"").slice(0,600)).indexOf(q)>=0;});
    if(rs.length)html+='<h3>'+esc(s.l)+'</h3><div class="tl">'+rs.map(function(r){return '<a href="#/'+s.k+'/'+r.k+'"><b>'+esc(r.l)+'</b><span>'+esc(r.d)+'</span></a>';}).join("")+'</div>';});
  home.querySelector(".tls").innerHTML=html||'<p class="vide">Aucune rubrique ne correspond. Essayez un autre mot.</p>';
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
},rendre:function(){rendre();},courant:function(){return cur;}};
})();
