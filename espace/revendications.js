/* Gestion de l'ACRB : « Revendications et retraits de nom » (demande de Karim, 23/11/2026).
   Les gérants revendiquent leur fiche, retirent leur nom ou signalent un mauvais magasin depuis Shopping Brabant.
   L'équipe confirme, refuse ou envoie vérifier sur place. En cas de contestation, un lien un clic prépare le message
   au titulaire déjà vérifié : rien ne part tout seul. */
(function(){
  var sb;
  var TYPE={revendiquer:"Revendique la fiche",retirer_nom:"Retirer un nom",mauvais_magasin:"Pas le bon magasin"};
  var ETAT={provisoire:["Provisoire","#b45309"],a_confirmer:["À confirmer","#b45309"],contestation:["Contestation","#b42318"],a_verifier_terrain:["Vérification sur place","#1d4ed8"],
    confirmee:["Confirmée","#0a7a3f"],appliquee:["Appliquée","#0a7a3f"],refusee:["Refusée","#6b6b6b"],levee:["Annulée","#6b6b6b"]};
  function $(i){return document.getElementById(i);}
  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function d(s){if(!s)return "";var x=new Date(s);return ("0"+x.getDate()).slice(-2)+"/"+("0"+(x.getMonth()+1)).slice(-2)+" "+("0"+x.getHours()).slice(-2)+"h"+("0"+x.getMinutes()).slice(-2);}
  function lienTitulaire(r){var sujet="Votre fiche "+(r.enseigne||"")+" sur Shopping Brabant",
    corps="Bonjour,\n\nUne autre personne ("+r.nom+") dit gérer "+(r.enseigne||"ce commerce")+", "+(r.adresse||"")+".\nPouvez-vous nous confirmer qui gère aujourd’hui ce commerce ?\n\nMerci,\nL’association des commerçants de la rue de Brabant";
    return "mailto:"+encodeURIComponent(r.titulaire||"")+"?subject="+encodeURIComponent(sujet)+"&body="+encodeURIComponent(corps);}
  function dessiner(l){var box=$("rv_box");if(!box)return;
    var ouv=l.filter(function(r){return ["provisoire","a_confirmer","contestation","a_verifier_terrain"].indexOf(r.statut)>=0;});
    if(!l.length){box.innerHTML='<p class="soon">Aucune demande pour l’instant. Elles arrivent ici dès qu’un gérant utilise « C’est vous ? » sur sa fiche.</p>';return;}
    var h='<p class="soon">'+ouv.length+' demande'+(ouv.length>1?"s":"")+' à traiter, '+(l.length-ouv.length)+' traitée'+(l.length-ouv.length>1?"s":"")+'.</p><div style="display:grid;gap:10px">';
    l.forEach(function(r){var e=ETAT[r.statut]||[r.statut,"#444"],open=["provisoire","a_confirmer","contestation","a_verifier_terrain"].indexOf(r.statut)>=0;
      h+='<div style="border:1px solid #e3e3e0;border-radius:10px;padding:10px 12px'+(open?'':';opacity:.75')+'">'+
        '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>'+esc(r.enseigne||r.ue)+' <span style="font-weight:400;color:#6b6b6b">· '+esc(r.adresse||"")+'</span></b>'+
        '<span style="color:'+e[1]+';font-weight:700;font-size:13px">'+esc(e[0])+'</span></div>'+
        '<div style="font-size:14px;margin-top:4px">'+esc(TYPE[r.type]||r.type)+(r.nom_cible?' : « '+esc(r.nom_cible)+' »':'')+' — <b>'+esc(r.nom)+'</b> · '+
        (r.gsm?'<a href="tel:'+esc(r.gsm)+'">'+esc(r.gsm)+'</a>'+(r.gsm_verifie?' ✓ SMS':' <span style="color:#6b6b6b">(GSM non vérifié)</span>')+' · ':'')+(r.email?esc(r.email)+' ✓':'')+
        (r.type==="revendiquer"?(r.concordance?' · <span style="color:#0a7a3f">nom trouvé à la BCE</span>':' · <span style="color:#b45309">nom absent de la BCE</span>'):'')+'</div>'+
        (r.type==="revendiquer"?'<div style="font-size:13px;color:#444">'+(r.statut==="provisoire"&&r.controle_le?'Prend la main sur la fiche publique le '+d(r.controle_le)+' sauf contestation. ':'')+(r.afficher?'Veut afficher son nom. ':'Nom caché. ')+(r.pleins_pouvoirs_le?'<b style="color:#0a7a3f">Pleins pouvoirs confirmés en boutique le '+d(r.pleins_pouvoirs_le)+'</b>':'Pleins pouvoirs à confirmer en boutique.')+'</div>':'')+
        (r.note?'<div style="font-size:13px;color:#444">'+esc(r.note)+'</div>':'')+
        '<div style="font-size:12px;color:#6b6b6b">'+d(r.cree_le)+(r.decide_par?' · décidé par '+esc(r.decide_par)+(r.motif?' ('+esc(r.motif)+')':''):'')+'</div>'+
        (open||r.statut==="appliquee"||r.statut==="confirmee"?'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'+
          (open?'<button class="btn" data-rvd="confirmer" data-id="'+r.id+'" data-aide="Vous confirmez la demande : la personne garde son espace commerçant, ou le nom est retiré du site.">Confirmer</button>':'')+
          (open&&r.statut!=="a_verifier_terrain"?'<button class="btn" data-rvd="terrain" data-id="'+r.id+'" data-aide="Une tâche « à vérifier sur place » apparaît dans le mode terrain du tronçon.">Vérifier sur place</button>':'')+
          '<button class="btn" data-rvd="refuser" data-id="'+r.id+'" data-aide="'+(r.statut==="appliquee"?"Le nom réapparaît sur la fiche (rien n’a été supprimé).":"La demande est refusée ; la personne garde la possibilité de recommencer.")+'">'+(r.statut==="appliquee"||r.statut==="confirmee"?"Annuler":"Refuser")+'</button>'+
          (r.type==="revendiquer"&&!r.pleins_pouvoirs_le&&["provisoire","confirmee","contestation"].indexOf(r.statut)>=0?'<button class="btn" data-rvq="'+r.id+'" data-aide="À utiliser en boutique : affiche un code QR valable 20 minutes. Le gérant le scanne avec son téléphone, connecté à son espace : ses pleins pouvoirs sont confirmés.">Code QR pleins pouvoirs</button>':'')+
          (r.statut==="contestation"&&r.titulaire?'<a class="btn" href="'+lienTitulaire(r)+'" data-aide="Prépare un courriel au gérant déjà vérifié pour qu’il confirme. Rien ne part sans votre clic sur Envoyer.">Prévenir le titulaire</a>':'')+
          '</div>':'')+'</div>';});
    box.innerHTML=h+'</div><div id="rv_msg" class="soon" role="status"></div>';
    Array.prototype.forEach.call(box.querySelectorAll("[data-rvq]"),function(b){b.onclick=function(){montrerQR(+b.getAttribute("data-rvq"),b);};});
    Array.prototype.forEach.call(box.querySelectorAll("[data-rvd]"),function(b){b.onclick=function(){var dec=b.getAttribute("data-rvd"),motif=null;
      b.disabled=true;sb.rpc("acrb_revendication_decider",{p_id:+b.getAttribute("data-id"),p_decision:dec,p_motif:motif}).then(function(r){if(r.error){$("rv_msg").textContent="Non enregistré : "+r.error.message;b.disabled=false;return;}dessiner(r.data||[]);});};});}
  function qrLib(cb){if(window.qrcode)return cb();var sc=document.createElement("script");sc.src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js";sc.onload=cb;document.head.appendChild(sc);}
  function montrerQR(id,btn){btn.disabled=true;sb.rpc("acrb_pouvoir_qr",{p_revendication:id}).then(function(r){btn.disabled=false;if(r.error){$("rv_msg").textContent="Impossible : "+r.error.message;return;}
    var u="https://acrb-asbl.github.io/espace/commercant.html?pouvoir="+r.data.code,box=document.createElement("div");box.style.cssText="margin-top:8px;text-align:center;border:1px dashed #999;border-radius:10px;padding:10px";
    box.innerHTML='<b>Pour '+esc(r.data.nom)+' : scannez avec votre téléphone</b><div class="qr" style="margin:8px auto;width:220px"></div><div style="font-size:12px;color:#6b6b6b">Valable 20 minutes, une seule fois. Le gérant doit être connecté à son espace commerçant avec l’adresse de sa demande.</div>';
    btn.parentNode.insertAdjacentElement("afterend",box);qrLib(function(){var q=qrcode(0,"M");q.addData(u);q.make();box.querySelector(".qr").innerHTML=q.createSvgTag({cellSize:5,margin:2,scalable:true});});});}
  function charger(){sb.rpc("acrb_revendications_liste").then(function(r){if(r.error){var b=$("rv_box");if(b)b.innerHTML='<p class="soon">'+esc(r.error.message)+'</p>';return;}dessiner(r.data||[]);});}
  window.REVENDICATIONS={init:function(client){sb=client;var c=$("c_rev");if(c)c.hidden=false;charger();},dessiner:dessiner};
})();
