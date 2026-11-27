/* Modes de saison de l'annuaire Shopping Brabant, vus et réglés depuis Gestion de l'ACRB (demande 19 du 23/11/2026).
   Le calendrier ci-dessous reprend celui du site (themes_annuaire.py) : Noël, soldes, Pâques et rentrée calculés chaque année,
   Ramadan, Aïd et vacances scolaires (FWB) préprogrammés. Les journées commerçantes et toute correction sont enregistrées dans le
   réglage public « annuaire_saisons » par la fonction acrb_saisons_regler (conseil d'administration). */
(function(){
  var NOMS={braderie:"Journée commerçante",aid:"Aïd",avant_ramadan:"Avant le Ramadan",ramadan:"Ramadan (jours 1 à 12)",ramadan_milieu:"Ramadan (jours 13 à 22)",ramadan_fin:"Fin du Ramadan (l’Aïd approche)",fetes:"Fêtes de fin d’année",paques:"Pâques",soldes:"Soldes",vacances:"Vacances scolaires",rentree:"Rentrée"};
  var PRIO={braderie:1,aid:2,avant_ramadan:3,ramadan:3,ramadan_milieu:3,ramadan_fin:3,fetes:4,paques:5,soldes:6,vacances:7,rentree:8};
  var PER=[["avant_ramadan","2027-01-24","2027-02-07"],["ramadan","2027-02-08","2027-02-19"],["ramadan_milieu","2027-02-20","2027-03-01"],["ramadan_fin","2027-03-02","2027-03-08"],["aid","2027-03-09","2027-03-12"],["aid","2027-05-16","2027-05-19"],
    ["avant_ramadan","2028-01-13","2028-01-27"],["ramadan","2028-01-28","2028-02-08"],["ramadan_milieu","2028-02-09","2028-02-18"],["ramadan_fin","2028-02-19","2028-02-25"],["aid","2028-02-26","2028-02-29"],["aid","2028-05-05","2028-05-08"],
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
  var MOIS=["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
  function court(s){var p=s.split("-");return (+p[2])+" "+MOIS[+p[1]-1]+" "+p[0];}
  var COUL={braderie:"#e63946",aid:"#0f766e",avant_ramadan:"#7a3e1d",ramadan:"#1e3a5f",ramadan_milieu:"#26306b",ramadan_fin:"#5b2a6e",fetes:"#9b1c1c",paques:"#8a6bbf",soldes:"#111111",vacances:"#0077b6",rentree:"#e76f51"};
  var SRC={calendrier:"Calendrier officiel",calculé:"Revient chaque année",loi:"Loi belge (soldes)",association:"Ajoutée par l’association"};
  var DETAIL={vacances:"Écoles francophones (Fédération Wallonie-Bruxelles)",avant_ramadan:"Les 15 jours avant : pâtisseries, nourriture, habits de Ramadan et de prière",ramadan:"À confirmer par l’observation de la lune ; corrigez ici si la date change",ramadan_milieu:"Soirées, iftars, restaurants ; commandes de tenues de l’Aïd",ramadan_fin:"La fête approche : tenues, robes, habits d’enfants, cadeaux",aid:"À confirmer par l’observation de la lune ; corrigez ici si la date change",soldes:"Dates légales en Belgique",paques:"Deux semaines avant Pâques jusqu’au lundi de Pâques",fetes:"Du 1er décembre au 2 janvier",rentree:"Fin août, début septembre",braderie:"À ajouter chaque année par l’association"};
  // les deux Aïd ont la même clé : on les distingue par leur place après le Ramadan
  function nom(p,lst){if(p[0]!=="aid")return NOMS[p[0]]||p[0];var fitr=lst.some(function(r){return r[0].indexOf("ramadan")>=0&&r[2]<p[1]&&jours(r[2],p[1])<=3;});return fitr?"Aïd al-Fitr (fin du Ramadan)":"Aïd al-Adha (fête du sacrifice)";}
  function jours(a,b){return Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/864e5);}
  function dessiner(){var box=$("sz_box");if(!box)return;var auj=ymd(new Date()),fin=ymd(add(new Date(),366)),off=cfg.desactives||[];
    var tout=toutes(),lst=tout.filter(function(p){return p[2]>=auj&&p[1]<=fin;}).sort(function(a,b){return a[1]<b[1]?-1:a[1]>b[1]?1:PRIO[a[0]]-PRIO[b[0]];});
    var actifs=lst.filter(function(p){return off.indexOf(p[0])<0;}),enc=actifs.filter(function(p){return p[1]<=auj&&auj<=p[2];}).sort(function(a,b){return PRIO[a[0]]-PRIO[b[0]];})[0],
        proch=actifs.filter(function(p){return p[1]>auj;})[0];
    var h='<div class="sz_etat"><b>Aujourd’hui sur le site :</b> '+(enc?'<span class="sz_pt" style="background:'+COUL[enc[0]]+'"></span>'+esc(nom(enc,tout))+' jusqu’au '+court(enc[2])+' · <a href="'+APERCU+enc[0]+'" target="_blank" rel="noopener">voir</a>':'aucun mode, présentation habituelle')+
      (proch?'<br><span class="soon" style="margin:0">Prochain : '+esc(nom(proch,tout))+' le '+court(proch[1])+' (dans '+jours(auj,proch[1])+' jours).</span>':'')+'</div>';
    h+='<div class="sz_grille">'+Object.keys(NOMS).map(function(k){var on=off.indexOf(k)<0,pr=lst.filter(function(p){return p[0]===k;})[0];
      return '<div class="sz_carte'+(on?'':' sz_off')+'"><div class="sz_t"><span class="sz_pt" style="background:'+COUL[k]+'"></span><b>'+esc(NOMS[k])+'</b></div>'+
        '<div class="sz_d">'+(pr?(pr[1]<=auj?'En cours jusqu’au '+court(pr[2]):'Prochaine fois : '+court(pr[1])):'Aucune date : ajoutez-la ci-dessous')+'</div>'+
        '<div class="sz_a"><a class="btn o" href="'+APERCU+k+'" target="_blank" rel="noopener" data-aide="Ouvre l’annuaire tel qu’il apparaîtra pendant ce mode. Rien ne change sur le site.">Voir l’aperçu</a>'+
        '<label class="sz_sw" data-aide="Activé : le mode s’affiche seul à ses dates. Désactivé : il ne s’affiche jamais. Enregistré aussitôt."><input type="checkbox" class="sz_on" role="switch" value="'+k+'"'+(on?' checked':'')+'><span>'+(on?'Activé':'Désactivé')+'</span></label></div></div>';}).join('')+'</div>';
    h+='<h3 style="margin:18px 0 6px;font-size:16px">Calendrier des douze prochains mois</h3><div style="overflow-x:auto"><table class="sz_tab"><thead><tr><th>Mode</th><th>Du</th><th>Au</th><th>D’où vient la date</th><th></th></tr></thead><tbody>'+
      lst.map(function(p){var coupe=off.indexOf(p[0])>=0,i=(cfg.periodes||[]).findIndex(function(x){return x.cle===p[0]&&x.du===p[1]&&x.au===p[2];});
        return '<tr'+(coupe?' class="sz_coupe"':'')+'><td><span class="sz_pt" style="background:'+COUL[p[0]]+'"></span>'+esc(nom(p,tout))+(coupe?' <i>(désactivé)</i>':'')+(p[1]<=auj&&auj<=p[2]?' <b>· en cours</b>':'')+'<span class="sz_m">'+fr(p[1])+' → '+fr(p[2])+'</span></td><td>'+fr(p[1])+'</td><td>'+fr(p[2])+'</td><td>'+esc(/ramadan|aid/.test(p[0])&&p[3]==="calendrier"?"Calcul astronomique":(SRC[p[3]]||p[3]))+(DETAIL[p[0]]&&p[3]!=="association"?'<br><span class="soon" style="margin:0;font-size:12.5px">'+esc(DETAIL[p[0]])+'</span>':'')+'</td><td style="white-space:nowrap"><a href="'+APERCU+p[0]+'" target="_blank" rel="noopener" data-aide="Ouvre l’annuaire comme il apparaîtra pendant ce mode, sans rien changer au site.">Aperçu</a>'+(i>=0?' · <a href="#" class="sz_del" data-i="'+i+'" data-aide="Retire cette date ajoutée par l’association.">Retirer</a>':'')+'</td></tr>';}).join("")+'</tbody></table></div>';
    h+='<form id="sz_form" class="sz_form"><b>Ajouter ou corriger une date</b>'+
      '<select id="sz_cle" aria-label="Mode" data-aide="Choisissez le mode. Pour corriger une date du calendrier (par exemple l’Aïd annoncé un jour plus tard), ajoutez ici la bonne date : elle passe avant le calendrier.">'+Object.keys(NOMS).map(function(k){return '<option value="'+k+'">'+esc(NOMS[k])+'</option>';}).join("")+'</select>'+
      '<label>Du<input id="sz_du" type="date" required data-aide="Premier jour où le mode s’affiche sur le site."></label>'+
      '<label>Au<input id="sz_au" type="date" required data-aide="Dernier jour inclus. Le lendemain, le site revient seul à la normale."></label>'+
      '<button class="btn" type="submit" data-aide="Enregistre la date et met le site à jour aussitôt.">Ajouter</button></form><div class="soon" id="sz_msg" role="status"></div>';
    box.innerHTML=h;
    $("sz_form").addEventListener("submit",function(e){e.preventDefault();var du=$("sz_du").value,au=$("sz_au").value;
      if(!du||!au){msg("Indiquez les deux dates.");return;}if(du>au){msg("La date de fin doit suivre la date de début.");return;}
      var p=(cfg.periodes||[]).slice();p.push({cle:$("sz_cle").value,du:du,au:au});enregistrer({desactives:cfg.desactives||[],periodes:p});});
    Array.prototype.forEach.call(document.querySelectorAll(".sz_on"),function(c){c.addEventListener("change",function(){var d=[];Array.prototype.forEach.call(document.querySelectorAll(".sz_on"),function(x){if(!x.checked)d.push(x.value);});enregistrer({desactives:d,periodes:cfg.periodes||[]});});});
    Array.prototype.forEach.call(document.querySelectorAll(".sz_del"),function(a){a.addEventListener("click",function(e){e.preventDefault();var p=(cfg.periodes||[]).slice();p.splice(+a.getAttribute("data-i"),1);enregistrer({desactives:cfg.desactives||[],periodes:p});});});
  }
  var css=document.createElement("style");css.textContent=".sz_etat{padding:12px 14px;border:1px solid var(--line,#d9dee7);background:#f7f9fc;margin:6px 0 14px;font-size:15px;line-height:1.5}.sz_pt{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:7px;vertical-align:middle}"
    +".sz_grille{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.sz_carte{border:1px solid var(--line,#d9dee7);padding:12px;background:#fff;min-width:0;display:flex;flex-direction:column;gap:6px}.sz_carte.sz_off{opacity:.6}.sz_t{display:flex;align-items:center}.sz_t b{font-size:15px}.sz_d{font-size:13.5px;color:#4a5466;flex:1}"
    +".sz_a{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.sz_a .btn{margin:0;padding:7px 11px;font-size:13.5px}.sz_sw{display:inline-flex;align-items:center;gap:6px;font-size:13.5px;cursor:pointer}.sz_sw input{width:18px;height:18px;margin:0}"
    +".sz_tab{width:100%;border-collapse:collapse;font-size:14px;min-width:560px}.sz_tab th{text-align:left;padding:6px 8px 6px 0;border-bottom:1px solid #c6ccd6}.sz_tab td{padding:7px 8px 7px 0;border-top:1px solid #e5e5e5;vertical-align:top}.sz_coupe{opacity:.45}"
    +".sz_form{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-top:16px}.sz_form b{flex-basis:100%}.sz_form label{display:flex;flex-direction:column;gap:3px;font-size:13px}.sz_form select,.sz_form input{padding:9px 10px;border:1px solid #c6ccd6;font:15px 'Source Sans 3',sans-serif;background:#fff;min-width:0}.sz_form .btn{margin:0;padding:11px 20px}"
    +".sz_m{display:none}@media(max-width:640px){.sz_tab{min-width:0}.sz_tab thead{display:none}.sz_tab tr{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:10px;border-top:1px solid #e5e5e5;padding:8px 0}.sz_tab td{border:0;padding:0}.sz_tab td:nth-child(2),.sz_tab td:nth-child(3){display:none}.sz_tab td:nth-child(4){grid-column:1;grid-row:2;font-size:13px;color:#4a5466}.sz_tab td:nth-child(5){grid-column:2;grid-row:1/3;align-self:center}.sz_m{display:block;font-size:13.5px;color:#14213d;margin-top:2px}.sz_form label{flex:1 1 130px}.sz_form input{width:100%;min-height:42px}.sz_form select{flex:1 1 100%}}"+"@media(max-width:900px){.sz_grille{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:340px){.sz_grille{grid-template-columns:1fr}}";document.head.appendChild(css);
  function msg(t){var m=$("sz_msg");if(m)m.textContent=t;}
  function enregistrer(v){msg("Enregistrement…");sb.rpc("acrb_saisons_regler",{p:v}).then(function(r){if(r.error){msg("Non enregistré : "+r.error.message);return;}cfg=r.data||v;dessiner();msg("Enregistré. Le site suit ce réglage dès maintenant.");});}
  function charger(){sb.from("acrb_reglages").select("valeur").eq("cle","annuaire_saisons").then(function(r){var v=r.data&&r.data[0]&&r.data[0].valeur;if(v)cfg={desactives:v.desactives||[],periodes:v.periodes||[]};dessiner();});}
  window.SAISONS_GESTION={init:function(client){sb=client;var c=$("c_saisons");if(c)c.hidden=false;charger();},toutes:toutes};
})();
