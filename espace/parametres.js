/* Gestion de l'ACRB › Association › Paramètres (décision de Karim Elbazi du 25/11/2026).
   Rend réglables à l'écran : prix des cotisations (formules et montants), canal de vérification (SMS ou courriel),
   plafonds de SMS, adresse de contact de l'association, barème de valorisation du travail.
   Chaque enregistrement passe par acrb_parametre_regler (conseil d'administration / administrateur ; trésorier aussi
   pour les cotisations ; fondateur seul pour le barème), qui valide et journalise l'ancienne et la nouvelle valeur.
   La confirmation s'affiche à côté du bouton. L'historique vient d'acrb_parametres_historique. */
(function(){
  if(window.PARAMETRES)return;
  var KEYS=["cotisations","verif_canal","sms_limites","contact_association","travail_bareme"];
  var NOMS={cotisations:"Prix des cotisations",verif_canal:"Canal de vérification",sms_limites:"Plafonds de SMS",contact_association:"Contact de l’association",travail_bareme:"Barème du travail"};
  var sb,roles=[],V={},M={};
  var EUR=(function(){try{var f=new Intl.NumberFormat("fr-BE",{style:"currency",currency:"EUR"});return function(n){return f.format(+n||0);};}catch(e){return function(n){return (Math.round((+n||0)*100)/100).toFixed(2).replace(".",",")+" €";};}})();
  function $(i){return document.getElementById(i);}
  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function has(l){return l.some(function(r){return roles.indexOf(r)>=0;});}
  function num(s){s=String(s==null?"":s).replace(/\s/g,"").replace(/€/g,"").replace(",",".");return s===""?NaN:+s;}
  function heure(d){try{return new Date(d||Date.now()).toLocaleString("fr-BE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});}catch(e){return "";}}
  function resume(cle,v){if(v==null)return "—";
    if(cle==="cotisations")return Object.keys(v).map(function(k){return k+" "+EUR(v[k]);}).join(" · ");
    if(cle==="verif_canal")return [v.sms?"SMS":"",v.email?"courriel":"",v.whatsapp?"WhatsApp":""].filter(Boolean).join(" + ")||"aucun";
    if(cle==="sms_limites")return v.delai_min+" min entre deux codes · "+v.par_numero_jour+" par numéro et par jour · "+v.plafond_jour+" par jour au total";
    if(cle==="contact_association")return (v.email||"")+(v.whatsapp?" · WhatsApp "+v.whatsapp:"");
    if(cle==="travail_bareme")return EUR(v.horaire)+" de l’heure ("+EUR(v.mensuel)+" par mois, "+v.heures_semaine+" h/semaine, au "+String(v.au||"").split("-").reverse().join("/")+")";
    return JSON.stringify(v);}
  function css(){if($("pa_css"))return;var s=document.createElement("style");s.id="pa_css";s.textContent=
    '.pa_g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:6px 0 18px}.pa_g>*{min-width:0}@media(max-width:860px){.pa_g{grid-template-columns:minmax(0,1fr)}}'+
    '.pa_b{border:1px solid var(--line);border-left:4px solid var(--navy);padding:14px 16px;background:#fbfcfd}.pa_b.full{grid-column:1/-1}.pa_b h3{font:800 16px "Libre Franklin",Arial,sans-serif;margin:0 0 4px;color:var(--navy)}'+
    '.pa_b .pa_now{font-size:13.5px;color:var(--muted);margin:0 0 4px}.pa_b .pa_qui{font-size:12.5px;color:var(--muted);margin:0}'+
    '#par_ed .caadd{margin-top:10px;align-items:end}#par_ed .caadd label{display:grid;gap:3px;font-size:12.5px;color:var(--muted);min-width:0}#par_ed .caadd input,#par_ed .caadd select{width:100%}'+
    '#par_ed .caadd .btn{margin-top:0;padding:9px 14px}#par_ed .pa_row{grid-template-columns:minmax(0,1fr) 130px auto}#par_ed .pa_row button.d{font:700 13px "Libre Franklin",Arial,sans-serif;padding:9px 11px;border:1px solid #c9ccd3;background:#fff;color:var(--muted);cursor:pointer}'+
    '#par_ed .pa_act{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin-top:10px}#par_ed .pa_act .btn{margin-top:0;padding:9px 14px}'+
    '.pa_ok{font-size:14px;font-weight:600;color:var(--green)}.pa_ok.bad{color:var(--brick)}.pa_ok:empty{display:none}'+
    '#par_ed .pa_3{grid-template-columns:repeat(3,minmax(0,1fr))}#par_ed .pa_2{grid-template-columns:repeat(2,minmax(0,1fr))}#par_ed .pa_1{grid-template-columns:minmax(0,1fr)}'+
    '.pa_note{font-size:13px;color:#8a5a00;background:#fff6e5;border-left:3px solid #c98a00;padding:6px 10px;margin:8px 0 0}'+
    '.pa_h .carow{grid-template-columns:1fr}.pa_h .carow .id span{display:block}'+
    '@media(max-width:700px){#par_ed .pa_row{grid-template-columns:minmax(0,1fr) auto!important}#par_ed .pa_row>label:first-child{grid-column:1/-1}#par_ed .pa_row>*{width:auto}#par_ed .pa_row>label{width:100%}#par_ed .pa_3,#par_ed .pa_2{grid-template-columns:minmax(0,1fr)!important}}';
    document.head.appendChild(s);}
  function etat(el,ok,txt){el.className="pa_ok"+(ok?"":" bad");el.textContent=(ok?"✓ ":"✗ ")+txt;}
  function qui(cle){var m=M[cle];return m&&m.le?"Dernière modification le "+heure(m.le)+(m.par?" par "+m.par:"")+".":"";}
  function enregistrer(cle,val,btn,st,apres){btn.disabled=true;st.className="pa_ok";st.textContent="Enregistrement…";
    sb.rpc("acrb_parametre_regler",{p_cle:cle,p_valeur:val}).then(function(x){btn.disabled=false;
      if(x.error){etat(st,false,"Non enregistré : "+x.error.message);return;}var d=x.data||{};
      if(d.inchange){etat(st,true,"Rien n’a changé, rien n’est enregistré.");return;}
      V[cle]=d.valeur;M[cle]={le:d.le||new Date().toISOString(),par:d.par};
      etat(st,true,"Enregistré à "+new Date().toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"})+". Avant : "+resume(cle,d.ancienne)+".");
      var b=btn.closest(".pa_b");if(b){var n=b.querySelector(".pa_now");if(n)n.textContent="Actuellement : "+resume(cle,d.valeur);var q=b.querySelector(".pa_qui");if(q)q.textContent=qui(cle);}
      if(apres)apres();historique();},function(e){btn.disabled=false;etat(st,false,"Non enregistré : "+(e&&e.message||"réseau"));});}
  function bloc(cle,intro,full){return '<section class="pa_b'+(full?' full':'')+'" id="pa_'+cle+'"><h3>'+esc(NOMS[cle])+'</h3><p class="pa_now">Actuellement : '+esc(resume(cle,V[cle]))+'</p><p class="pa_qui">'+esc(qui(cle))+'</p>'+intro+'</section>';}

  function rendCot(){var b=$("pa_cotisations"),ok=has(["ca","admin","tresorier"]),c=V.cotisations||{};
    var rows=Object.keys(c).map(function(k){return [k,c[k]];});if(!rows.length)rows=[["Complète",""],["Essentielle",""],["Membre adhérent",""]];
    function ligne(r){return '<div class="caadd pa_row"><label>Formule<input class="pa_cn" value="'+esc(r[0])+'" maxlength="40" data-aide="Nom de la formule tel qu’il apparaît sur la facture (ex. Complète)."'+(ok?'':' disabled')+'></label><label>Montant (€)<input class="pa_cm" inputmode="decimal" value="'+(r[1]===""?"":String(r[1]).replace(".",","))+'" data-aide="Prix annuel de cette formule, en euros (ex. 250 ou 150,50)."'+(ok?'':' disabled')+'></label>'+(ok?'<button type="button" class="d pa_rm" data-aide="Retire cette formule de la liste. Rien n’est changé tant que vous n’avez pas touché « Enregistrer les prix ».">Retirer</button>':'<span></span>')+'</div>';}
    b.insertAdjacentHTML("beforeend",'<div class="pa_rows">'+rows.map(ligne).join("")+'</div>'+(ok?'<div class="pa_act"><button type="button" class="btn o" id="pa_cadd" data-aide="Ajoute une ligne pour une nouvelle formule de cotisation.">Ajouter une formule</button><button type="button" class="btn" id="pa_csave" data-aide="Enregistre les formules et leurs prix. Les nouvelles factures de cotisation les proposeront aussitôt ; les factures déjà émises ne changent pas. Le changement est inscrit au journal.">Enregistrer les prix</button><span class="pa_ok" role="status" id="pa_cst"></span></div>':'<p class="pa_note">Réservé au conseil d’administration et au trésorier.</p>'));
    if(!ok)return;
    function liens(){b.querySelectorAll(".pa_rm").forEach(function(x){x.onclick=function(){if(b.querySelectorAll(".pa_row").length>1)x.closest(".pa_row").remove();};});}liens();
    $("pa_cadd").onclick=function(){b.querySelector(".pa_rows").insertAdjacentHTML("beforeend",ligne(["",""]));liens();var l=b.querySelectorAll(".pa_cn");l[l.length-1].focus();};
    $("pa_csave").onclick=function(){var st=$("pa_cst"),o={},err="";b.querySelectorAll(".pa_row").forEach(function(r){var n=r.querySelector(".pa_cn").value.trim(),m=num(r.querySelector(".pa_cm").value);if(!n&&isNaN(m))return;if(!n)err="Chaque formule a un nom.";else if(!(m>0))err="Montant invalide pour « "+n+" ».";else o[n]=Math.round(m*100)/100;});
      if(!err&&!Object.keys(o).length)err="Indiquez au moins une formule.";if(err){etat(st,false,err);return;}enregistrer("cotisations",o,this,st);};}

  function rendCanal(){var b=$("pa_verif_canal"),ok=has(["ca","admin"]),v=V.verif_canal||{};
    b.insertAdjacentHTML("beforeend",'<form class="caadd pa_1" onsubmit="return false"><label>Comment le commerçant confirme un geste (revendiquer sa fiche, retirer un nom…)<select id="pa_canal" data-aide="SMS : un code arrive par texto sur le GSM. Courriel : le code arrive par e-mail. Le changement vaut tout de suite sur Shopping Brabant."'+(ok?'':' disabled')+'><option value="sms"'+(v.sms?' selected':'')+'>SMS — code par texto (payant, voir les plafonds)</option><option value="email"'+(!v.sms&&v.email?' selected':'')+'>Courriel — code par e-mail (gratuit)</option></select></label></form>'+
      (ok?'<div class="pa_act"><button type="button" class="btn" id="pa_vsave" data-aide="Enregistre le canal choisi. Le changement est inscrit au journal.">Enregistrer le canal</button><span class="pa_ok" role="status" id="pa_vst"></span></div>':'<p class="pa_note">Réservé au conseil d’administration.</p>'));
    if(ok)$("pa_vsave").onclick=function(){var c=$("pa_canal").value;enregistrer("verif_canal",{sms:c==="sms",email:c==="email"},this,$("pa_vst"));};}

  function rendSms(){var b=$("pa_sms_limites"),ok=has(["ca","admin"]),v=V.sms_limites||{},d=ok?'':' disabled';
    b.insertAdjacentHTML("beforeend",'<form class="caadd pa_3" onsubmit="return false"><label>Minutes avant de renvoyer un code<input id="pa_sd" type="number" min="1" max="1440" step="1" value="'+esc(v.delai_min)+'" data-aide="Un code déjà envoyé au même numéro n’est pas renvoyé avant ce délai (évite les SMS en double)."'+d+'></label><label>SMS par numéro et par jour<input id="pa_sn" type="number" min="1" max="10" step="1" value="'+esc(v.par_numero_jour)+'" data-aide="Nombre maximum de SMS envoyés au même GSM sur une journée."'+d+'></label><label>SMS par jour, en tout<input id="pa_sp" type="number" min="1" max="1000" step="1" value="'+esc(v.plafond_jour)+'" data-aide="Plafond global : au-delà, plus aucun SMS ce jour-là et une alerte est inscrite au journal. Protège le budget de l’association."'+d+'></label></form>'+
      (ok?'<div class="pa_act"><button type="button" class="btn" id="pa_ssave" data-aide="Enregistre les trois plafonds. Ils valent dès le prochain SMS. Le changement est inscrit au journal.">Enregistrer les plafonds</button><span class="pa_ok" role="status" id="pa_sst"></span></div>':'<p class="pa_note">Réservé au conseil d’administration.</p>'));
    if(ok)$("pa_ssave").onclick=function(){var a=num($("pa_sd").value),n=num($("pa_sn").value),p=num($("pa_sp").value),st=$("pa_sst");
      if(!(a>=1&&a<=1440&&a%1===0))return etat(st,false,"Délai : un nombre entier de 1 à 1440 minutes.");if(!(n>=1&&n<=10&&n%1===0))return etat(st,false,"Par numéro : de 1 à 10.");if(!(p>=1&&p<=1000&&p%1===0))return etat(st,false,"Par jour : de 1 à 1000.");
      enregistrer("sms_limites",{delai_min:a,par_numero_jour:n,plafond_jour:p},this,st);};}

  function rendContact(){var b=$("pa_contact_association"),ok=has(["ca","admin"]),v=V.contact_association||{},d=ok?'':' disabled';
    b.insertAdjacentHTML("beforeend",'<form class="caadd pa_2" onsubmit="return false"><label>Adresse e-mail<input id="pa_ce" type="email" value="'+esc(v.email)+'" data-aide="L’adresse affichée aux commerçants et visiteurs pour écrire à l’association (formulaires « en un toucher », dossiers de subsides)."'+d+'></label><label>WhatsApp (facultatif)<input id="pa_cw" type="tel" value="'+esc(v.whatsapp||"")+'" placeholder="+32 470 12 34 56" data-aide="Numéro WhatsApp de l’association, au format international. Laissez vide s’il n’y en a pas."'+d+'></label></form>'+
      (ok?'<div class="pa_act"><button type="button" class="btn" id="pa_ksave" data-aide="Enregistre l’adresse de contact. Elle apparaît aussitôt sur les sites. Le changement est inscrit au journal.">Enregistrer le contact</button><span class="pa_ok" role="status" id="pa_kst"></span></div>':'<p class="pa_note">Réservé au conseil d’administration.</p>'));
    if(ok)$("pa_ksave").onclick=function(){var e=$("pa_ce").value.trim(),st=$("pa_kst");if(!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e))return etat(st,false,"Adresse e-mail invalide.");enregistrer("contact_association",{email:e,whatsapp:$("pa_cw").value.trim()},this,st);};}

  function rendBareme(){var b=$("pa_travail_bareme"),ok=has(["fondateur"]),v=V.travail_bareme||{},d=ok?'':' disabled';
    function ch(id,lab,val,aide,typ){return '<label>'+lab+'<input id="'+id+'" '+(typ||'')+' value="'+esc(val==null?"":String(val))+'" data-aide="'+esc(aide)+'"'+d+'></label>';}
    b.insertAdjacentHTML("beforeend",'<form class="caadd pa_3" onsubmit="return false">'+
      ch("pa_bh","Taux horaire (€)",String(v.horaire==null?"":v.horaire).replace(".",","),"Valeur d’une heure de travail : sert à valoriser les heures dans « Travail et valorisation ».",'inputmode="decimal"')+
      ch("pa_bm","Salaire mensuel de référence (€)",String(v.mensuel==null?"":v.mensuel).replace(".",","),"Salaire mensuel minimum du barème choisi, pour mémoire et contrôle du taux horaire.",'inputmode="decimal"')+
      ch("pa_bs","Heures par semaine",v.heures_semaine,"Durée de travail hebdomadaire du barème (ex. 38 h).",'inputmode="decimal"')+
      ch("pa_bc","Commission paritaire",v.commission,"Ex. CP 200 (employés).")+ch("pa_bk","Classe",v.classe,"Classe de fonction du barème (ex. D).")+ch("pa_ba","Barème au",v.au,"Date d’entrée en vigueur du barème.",'type="date"')+
      '<label style="grid-column:1/-1">Source<input id="pa_bsrc" value="'+esc(v.source||"")+'" data-aide="D’où vient le chiffre (barème officiel, site consulté). Gardez une source vérifiable."'+d+'></label></form>'+
      (ok?'<div class="pa_act"><button type="button" class="btn" id="pa_bsave" data-aide="Enregistre le barème. Les valorisations du travail l’utilisent aussitôt. Réservé au fondateur ; inscrit au journal.">Enregistrer le barème</button><span class="pa_ok" role="status" id="pa_bst"></span></div>':'<p class="pa_note">Seul le fondateur modifie ce barème. Vous le voyez ici pour information.</p>'));
    if(ok)$("pa_bsave").onclick=function(){var h=num($("pa_bh").value),m=num($("pa_bm").value),s=num($("pa_bs").value),au=$("pa_ba").value,st=$("pa_bst");
      if(!(h>=1&&h<=500))return etat(st,false,"Taux horaire entre 1 € et 500 €.");if(!(m>=1&&m<=50000))return etat(st,false,"Salaire mensuel entre 1 € et 50 000 €.");if(!(s>=1&&s<=60))return etat(st,false,"Heures par semaine entre 1 et 60.");if(!au)return etat(st,false,"Indiquez la date du barème.");
      enregistrer("travail_bareme",{horaire:h,mensuel:m,heures_semaine:s,au:au,commission:$("pa_bc").value,classe:$("pa_bk").value,source:$("pa_bsrc").value},this,st);};}

  function historique(){var h=$("pa_hist");if(!h)return;sb.rpc("acrb_parametres_historique",{p_limite:30}).then(function(x){var l=x.data||[];
    h.innerHTML=l.length?l.map(function(r){return '<div class="carow"><div class="id"><b>'+esc(NOMS[r.cle]||r.cle)+' <span class="st">'+esc(heure(r.le))+'</span></b><span>Par '+esc(r.par||"?")+'</span><span>Avant : '+esc(resume(r.cle,r.ancienne))+'</span><span>Après : '+esc(resume(r.cle,r.nouvelle))+'</span></div></div>';}).join(""):'<p class="soon">Aucun changement enregistré depuis cette rubrique.</p>';});}

  function init(s,user,rs){var box=$("par_ed");if(!box)return;var cle=(rs||[]).slice().sort().join(",");
    /* la page peut appeler init plusieurs fois (événements de session) : on ne redessine jamais par-dessus une saisie en cours */
    if(box.dataset.pret===cle)return;box.dataset.pret=cle;sb=s;roles=rs||[];css();box.innerHTML='<p class="soon">Chargement…</p>';
    sb.from("acrb_reglages").select("cle,valeur,modifie_le,modifie_par").in("cle",KEYS).then(function(x){if(x.error){box.innerHTML='<p class="soon">Lecture impossible : '+esc(x.error.message)+'</p>';return;}
      (x.data||[]).forEach(function(r){V[r.cle]=r.valeur;M[r.cle]={le:r.modifie_le,par:r.modifie_par};});
      box.innerHTML='<div class="pa_g">'+bloc("cotisations","",true)+bloc("verif_canal","")+bloc("contact_association","")+bloc("sms_limites","",true)+bloc("travail_bareme","",true)+'</div>'+
        '<details class="pa_h" style="margin:0 0 16px"><summary style="cursor:pointer;font-weight:700" data-aide="Montre chaque changement fait ici : qui, quand, l’ancienne et la nouvelle valeur.">Historique des changements</summary><div class="calist" id="pa_hist"><p class="soon">Chargement…</p></div></details>';
      rendCot();rendCanal();rendContact();rendSms();rendBareme();historique();});}
  window.PARAMETRES={init:init,_resume:resume};
})();
