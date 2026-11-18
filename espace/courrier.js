/* Courrier postal par Pingen, au nom de l'ACRB, avec le compte Pingen du trésorier.
   Le trésorier relie son compte une fois ; ensuite il dépose un PDF, voit le prix, puis envoie. Les identifiants ne reviennent jamais au navigateur. */
(function(){
var sb, FN="acrb-courrier", etatC=null;
function $(i){return document.getElementById(i);}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function msg(t,c){var e=$("co_state");e.textContent=t||"";e.className="soon"+(c?" "+c:"");}
function dt(s){if(!s)return "";var d=new Date(s);return d.toLocaleDateString("fr-BE")+" "+d.toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"});}
var ST={validating:"Vérification par Pingen",valid:"Prête à envoyer",action_required:"À corriger (adresse illisible ?)",submitted:"Envoyée à l’imprimerie",accepted:"Acceptée",sent:"Postée",delivered:"Distribuée",undeliverable:"Non distribuable",cancelled:"Annulée",annule:"Annulée",expired:"Expirée",valider:"Vérification par Pingen"};
function appel(corps){return sb.functions.invoke(FN,{body:corps}).then(function(x){if(x.error){var c=x.error.context;if(c&&c.json)return c.json().then(function(j){throw new Error(j.error||x.error.message);});throw x.error;}return x.data;});}

function charger(){
  return sb.rpc("acrb_pingen_etat").then(function(x){
    if(x.error){msg("Lecture impossible : "+x.error.message,"bad");return;}
    etatC=x.data;var d=x.data;
    $("co_lien").innerHTML=d.relie?('Compte Pingen relié : organisation <b>'+esc(d.org)+'</b>, client '+esc(d.client)+', mode <b>'+(d.mode==="test"?"test (aucun envoi réel)":"réel")+'</b>'+(d.par?' · relié par '+esc(d.par)+' le '+esc(dt(d.le)):'')+'.'):'Aucun compte Pingen relié pour l’instant.';
    $("co_cfg").open=!d.relie; $("co_envoi").hidden=!d.relie;
    var l=d.courriers||[];
    $("co_list").innerHTML=l.length?l.map(function(c){
      var fin=/sent|delivered|submitted|accepted|cancelled|annule|undeliverable|expired/.test(c.statut||"");
      return '<div class="carow"><div class="id"><b>'+esc(c.nom_fichier||"Courrier")+(c.mode==="test"?' <span class="st warn">test</span>':'')+'</b><span>'+esc(ST[c.statut]||c.statut||"")+(c.prix!=null?' · '+esc(Number(c.prix).toLocaleString("fr-BE",{minimumFractionDigits:2}))+' '+esc(c.devise||"EUR"):'')+(c.pages?' · '+c.pages+' page(s)':'')+(c.destinataire?' · '+esc(c.destinataire.replace(/\n/g,", ")):'')+'<br>Déposé le '+esc(dt(c.cree_le))+' par '+esc(c.cree_par||"")+(c.envoye_le?' · envoyé le '+esc(dt(c.envoye_le)):'')+(c.note?' · '+esc(c.note):'')+'</span></div>'+
        '<div class="acts tx">'+(!fin?'<button data-co="statut" data-id="'+c.id+'">Actualiser</button>':'')+
        (c.statut==="valid"?'<select data-prod="'+c.id+'"><option value="cheap">Économique</option><option value="fast">Rapide</option><option value="registered">Recommandé</option></select><button class="p" data-co="envoyer" data-id="'+c.id+'">Envoyer</button>':'')+
        (!fin?'<button class="d" data-co="annuler" data-id="'+c.id+'">Annuler</button>':'')+'</div></div>';
    }).join(""):'<p class="soon">Aucun courrier pour l’instant.</p>';
  });
}

function relier(e){e.preventDefault();var o=$("co_org").value.trim(),c=$("co_cid").value.trim(),s=$("co_sec").value.trim(),m=$("co_mode").value,b=e.target.querySelector("button");
  if(!o||!c||(!s&&!(etatC&&etatC.relie))){msg("Indiquez l’organisation, l’identifiant client et le secret.","bad");return;}
  b.disabled=true;msg("Enregistrement…");
  sb.rpc("acrb_pingen_regler",{p_org:o,p_client_id:c,p_client_secret:s,p_mode:m}).then(function(x){
    if(x.error)throw new Error(x.error.message);$("co_sec").value="";msg("Vérification auprès de Pingen…");return appel({action:"verifier"});
  }).then(function(r){b.disabled=false;msg("Compte Pingen relié : "+r.organisation+" (mode "+r.mode+").","ok");charger();})
  .catch(function(er){b.disabled=false;msg(er.message||String(er),"bad");charger();});}

function deposer(e){e.preventDefault();var f=$("co_pdf").files[0],b=e.target.querySelector("button");
  if(!f){msg("Choisissez le PDF de la lettre.","bad");return;}
  if(f.type!=="application/pdf"){msg("La lettre doit être un PDF (format A4).","bad");return;}
  if(f.size>20*1024*1024){msg("PDF trop lourd (20 Mo au plus).","bad");return;}
  b.disabled=true;msg("Dépôt du PDF…");
  var path="courriers/"+Date.now()+"-"+f.name.toLowerCase().replace(/[^a-z0-9.]+/g,"-").slice(0,60);
  sb.storage.from("acrb-actes").upload(path,f,{contentType:"application/pdf"}).then(function(r){if(r.error)throw r.error;
    msg("Transmission à Pingen…");return appel({action:"creer",chemin:path,nom:f.name,note:$("co_note").value.trim(),adresse:$("co_pos").value});
  }).then(function(r){msg("Lettre déposée chez Pingen. Pingen vérifie l’adresse et calcule le prix (quelques secondes)…");e.target.reset();
    return new Promise(function(ok){setTimeout(ok,6000);}).then(function(){return appel({action:"statut",id:r.id});});
  }).then(function(s){b.disabled=false;msg(s.statut==="valid"?"Prête : vérifiez l’adresse et le prix, puis touchez « Envoyer ».":"État : "+(ST[s.statut]||s.statut)+". Touchez « Actualiser » dans un instant.","ok");charger();})
  .catch(function(er){b.disabled=false;msg(er.message||String(er),"bad");charger();});}

function clic(e){var t=e.target.closest("[data-co]");if(!t)return;var id=+t.dataset.id,a=t.dataset.co,corps={action:a,id:id};
  if(a==="envoyer"){var p=document.querySelector('[data-prod="'+id+'"]');corps.produit=p?p.value:"cheap";
    if(!window.confirm("Envoyer ce courrier par la poste ? Le prix sera débité du solde Pingen de l’association."))return;}
  if(a==="annuler"&&!window.confirm("Annuler ce courrier ?"))return;
  t.disabled=true;msg("…");appel(corps).then(function(r){msg(a==="envoyer"?"Courrier envoyé.":a==="annuler"?"Courrier annulé.":"État : "+(ST[r.statut]||r.statut),"ok");charger();}).catch(function(er){t.disabled=false;msg(er.message||String(er),"bad");});}

window.COURRIER={init:function(_sb){sb=_sb;
  if(!window.COURRIER._lie){window.COURRIER._lie=1;$("co_form").addEventListener("submit",relier);$("co_envoi").addEventListener("submit",deposer);$("c_courrier").addEventListener("click",clic);}
  charger();}};
})();
