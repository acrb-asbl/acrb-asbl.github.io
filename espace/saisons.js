/* Modes de saison de l'annuaire Shopping Brabant, vus et réglés depuis Gestion de l'ACRB (demande 19 du 23/11/2026).
   Le calendrier ci-dessous reprend celui du site (themes_annuaire.py) : Noël, soldes, Pâques et rentrée calculés chaque année,
   Ramadan, Aïd et vacances scolaires (FWB) préprogrammés. La braderie et toute correction sont enregistrées dans le
   réglage public « annuaire_saisons » par la fonction acrb_saisons_regler (conseil d'administration). */
(function(){
  var NOMS={braderie:"Braderie",aid:"Aïd",ramadan:"Ramadan",fetes:"Fêtes de fin d’année",paques:"Pâques",soldes:"Soldes",vacances:"Vacances scolaires",rentree:"Rentrée"};
  var PRIO={braderie:1,aid:2,ramadan:3,fetes:4,paques:5,soldes:6,vacances:7,rentree:8};
  var PER=[["ramadan","2027-02-08","2027-03-08"],["aid","2027-03-09","2027-03-12"],["aid","2027-05-15","2027-05-18"],
    ["ramadan","2028-01-28","2028-02-25"],["aid","2028-02-26","2028-02-29"],["aid","2028-05-04","2028-05-07"],
    ["vacances","2026-10-19","2026-11-01"],["vacances","2026-12-21","2027-01-03"],["vacances","2027-02-22","2027-03-07"],
    ["vacances","2027-04-26","2027-05-09"],["vacances","2027-07-03","2027-08-29"]];
  var APERCU="https://acrb-asbl.github.io/shopping/?saison=";
  var sb,cfg={desactives:[],periodes:[]};
  function $(i){return document.getElementById(i);}
  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function ymd(d){return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
  function add(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x;}
  function easter(y){var a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return new Date(y,mo-1,da);}
  function toutes(){var out=PER.map(function(p){return p.concat(["calendrier"]);}),y=new Date().getFullYear();
    [y,y+1].forEach(function(Y){out.push(["fetes",Y+"-12-01",(Y+1)+"-01-02","calculé"]);out.push(["soldes",Y+"-01-03",Y+"-01-31","loi"]);out.push(["soldes",Y+"-07-01",Y+"-07-31","loi"]);
      var e=easter(Y);out.push(["paques",ymd(add(e,-13)),ymd(add(e,1)),"calculé"]);out.push(["rentree",Y+"-08-20",Y+"-09-06","calculé"]);});
    (cfg.periodes||[]).forEach(function(p){out.push([p.cle,p.du,p.au,"association"]);});
    return out;}
  function fr(s){var p=s.split("-");return p[2]+"/"+p[1]+"/"+p[0];}
  function dessiner(){var box=$("sz_box");if(!box)return;var auj=ymd(new Date()),fin=ymd(add(new Date(),366));
    var lst=toutes().filter(function(p){return p[2]>=auj&&p[1]<=fin;}).sort(function(a,b){return a[1]<b[1]?-1:a[1]>b[1]?1:PRIO[a[0]]-PRIO[b[0]];});
    var off=cfg.desactives||[];
    var h='<p class="soon">Le site change de mode tout seul aux dates ci-dessous. Si deux périodes se chevauchent, la plus importante passe devant (braderie, puis Aïd, Ramadan, fêtes, Pâques, soldes, vacances, rentrée).</p>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:8px 16px;margin:8px 0 12px">'+Object.keys(NOMS).map(function(k){return '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" class="sz_on" value="'+k+'"'+(off.indexOf(k)<0?" checked":"")+' data-aide="Cochée : le mode « '+esc(NOMS[k])+' » s’active seul à ses dates. Décochée : il ne s’affiche jamais.">'+esc(NOMS[k])+'</label>';}).join("")+'</div>';
    h+='<table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr><th style="text-align:left">Mode</th><th style="text-align:left">Du</th><th style="text-align:left">Au</th><th style="text-align:left">Source</th><th></th></tr></thead><tbody>'+
      lst.map(function(p){var coupe=off.indexOf(p[0])>=0,i=(cfg.periodes||[]).findIndex(function(x){return x.cle===p[0]&&x.du===p[1]&&x.au===p[2];});
        return '<tr style="border-top:1px solid #e5e5e5'+(coupe?';opacity:.45':'')+'"><td>'+esc(NOMS[p[0]]||p[0])+(coupe?" (coupé)":"")+(p[1]<=auj&&auj<=p[2]?' <b>· en cours</b>':'')+'</td><td>'+fr(p[1])+'</td><td>'+fr(p[2])+'</td><td>'+esc(p[3])+'</td><td style="white-space:nowrap"><a href="'+APERCU+p[0]+'" target="_blank" rel="noopener" data-aide="Ouvre l’annuaire comme il apparaîtra pendant ce mode, sans rien changer au site.">Aperçu</a>'+(i>=0?' · <a href="#" class="sz_del" data-i="'+i+'" data-aide="Retire cette date ajoutée par l’association.">Retirer</a>':'')+'</td></tr>';}).join("")+'</tbody></table>';
    h+='<form id="sz_form" class="caadd" style="grid-template-columns:auto 1fr 1fr 1fr auto;margin-top:14px"><b>Ajouter une date</b>'+
      '<select id="sz_cle" data-aide="Choisissez le mode. Pour la braderie, choisissez « Braderie ». Pour corriger une date du calendrier (par exemple l’Aïd annoncé un jour plus tard), ajoutez ici la bonne date : elle passe avant le calendrier.">'+Object.keys(NOMS).map(function(k){return '<option value="'+k+'">'+esc(NOMS[k])+'</option>';}).join("")+'</select>'+
      '<input id="sz_du" type="date" required data-aide="Premier jour où le mode s’affiche sur le site." title="Du">'+
      '<input id="sz_au" type="date" required data-aide="Dernier jour inclus. Le lendemain, le site revient seul à la normale." title="Au">'+
      '<button class="btn" type="submit" data-aide="Enregistre la date et met le site à jour aussitôt, sans rien reconstruire.">Ajouter</button></form>'+
      '<p style="margin:10px 0 0"><button type="button" class="btn" id="sz_save" data-aide="Enregistre les modes cochés ou décochés ci-dessus.">Enregistrer les modes actifs</button></p><div class="soon" id="sz_msg"></div>';
    box.innerHTML=h;
    $("sz_form").addEventListener("submit",function(e){e.preventDefault();var du=$("sz_du").value,au=$("sz_au").value;
      if(!du||!au){msg("Indiquez les deux dates.");return;}if(du>au){msg("La date de fin doit suivre la date de début.");return;}
      var p=(cfg.periodes||[]).slice();p.push({cle:$("sz_cle").value,du:du,au:au});enregistrer({desactives:cfg.desactives||[],periodes:p});});
    $("sz_save").addEventListener("click",function(){var d=[];Array.prototype.forEach.call(document.querySelectorAll(".sz_on"),function(c){if(!c.checked)d.push(c.value);});enregistrer({desactives:d,periodes:cfg.periodes||[]});});
    Array.prototype.forEach.call(document.querySelectorAll(".sz_del"),function(a){a.addEventListener("click",function(e){e.preventDefault();var p=(cfg.periodes||[]).slice();p.splice(+a.getAttribute("data-i"),1);enregistrer({desactives:cfg.desactives||[],periodes:p});});});
  }
  function msg(t){var m=$("sz_msg");if(m)m.textContent=t;}
  function enregistrer(v){msg("Enregistrement…");sb.rpc("acrb_saisons_regler",{p:v}).then(function(r){if(r.error){msg("Non enregistré : "+r.error.message);return;}cfg=r.data||v;dessiner();msg("Enregistré. Le site suit ce réglage dès maintenant.");});}
  function charger(){sb.from("acrb_reglages").select("valeur").eq("cle","annuaire_saisons").then(function(r){var v=r.data&&r.data[0]&&r.data[0].valeur;if(v)cfg={desactives:v.desactives||[],periodes:v.periodes||[]};dessiner();});}
  window.SAISONS_GESTION={init:function(client){sb=client;var c=$("c_saisons");if(c)c.hidden=false;charger();},toutes:toutes};
})();
