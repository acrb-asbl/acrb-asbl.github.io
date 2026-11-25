/* File d'attente des courriels de l'ACRB (chantier « Envois et membres », 25/11/2026).
   Factures de cotisation, rappels et convocations d'AG déposent leurs courriels dans une file (table acrb_mails).
   Rien ne part tout seul : le trésorier ou le conseil touche « Envoyer la file maintenant », voit le nombre et la liste, puis confirme.
   Mode « essai » par défaut : les courriels partent seulement à une adresse de test, et la file reste intacte.
   L'envoi est fait par la fonction Edge acrb-courriels (clé du service d'envoi côté serveur, jamais dans le navigateur).
   Expose window.ENVOIS = { init(sb), rafraichir() }. */
(function(){
var sb,lie=false,apercu=null,FN="acrb-courriels";
function $(i){return document.getElementById(i);}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
var ORIG={facture:"Facture",rappel:"Rappel",convocation:"Convocation AG",preuve:"Copie interne",autre:"Autre"};
var CSS='.ev{margin-top:18px;padding-top:14px;border-top:1px solid var(--line,#dfe3ea)}.ev_t{font:800 14px "Libre Franklin",Arial,sans-serif}.ev_k{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.ev_k span{font:700 12px "Libre Franklin",Arial,sans-serif;padding:4px 8px;background:#f0f2f6;color:#5f6675}.ev_k span.w{background:#fff3d6;color:#8a5a00}.ev_k span.ok{background:#e4f3ea;color:#1f8a4c}.ev_k span.ko{background:#fbe9e6;color:#b23a2b}'+
 '.ev_box{border:1px solid var(--line,#dfe3ea);border-left:4px solid #af4057;background:#fafbfc;padding:12px;margin-top:10px}.ev_box h4{margin:0 0 6px;font:800 15px "Libre Franklin",Arial,sans-serif;color:#14233c}.ev_l{max-height:260px;overflow:auto;margin:8px 0;border:1px solid var(--line,#dfe3ea);background:#fff}'+
 '.ev_l div{display:grid;grid-template-columns:110px minmax(0,1fr) minmax(0,1.4fr);gap:8px;padding:6px 8px;border-bottom:1px solid #eef0f4;font-size:14px}.ev_l div:last-child{border-bottom:0}.ev_l b{font:700 12px "Libre Franklin",Arial,sans-serif;color:#5f6675;text-transform:uppercase}.ev_l span{overflow-wrap:anywhere}'+
 '.ev_r{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}.ev_r label{display:grid;gap:3px;font-size:12.5px;color:#5f6675;min-width:0}.ev_r input,.ev_r select{padding:8px 10px;border:1px solid #c6ccd6;font:15px "Source Sans 3",sans-serif;background:#fff;min-width:0}.ev_r .btn{margin:0;align-self:end}'+
 '.ev_msg{font-size:14px;font-weight:600;margin-top:6px}.ev_msg.ok{color:#1f8a4c}.ev_msg.bad{color:#b23a2b}'+
 '@media(max-width:700px){.ev_l div{grid-template-columns:1fr;gap:1px}.ev_r{grid-template-columns:1fr}}';
var HTML='<div class="ev" id="ev"><b class="ev_t">Courriels en attente d’envoi</b>'+
 '<p style="margin:4px 0 0;font-size:14.5px">Les factures, rappels et convocations attendent ici. Rien ne part sans votre confirmation.</p>'+
 '<div class="ev_k" id="ev_k">Chargement…</div>'+
 '<div class="docs" style="margin-top:4px"><button class="btn" type="button" id="ev_go" data-aide="Montre d’abord combien de courriels vont partir et à qui. Ils ne partent qu’après votre confirmation. En mode essai, ils vont seulement à l’adresse de test.">Envoyer la file maintenant</button>'+
 '<button class="btn o" type="button" id="ev_maj" data-aide="Recompte les courriels en attente.">Actualiser</button></div>'+
 '<div id="ev_ap"></div>'+
 '<details style="margin-top:10px" data-aide="Choisir entre le mode essai (tout part à une adresse de test) et le mode réel (chaque courriel part à son destinataire)."><summary style="cursor:pointer;font-weight:700">Réglages des envois</summary>'+
 '<form class="ev_r" id="ev_rg"><label>Mode<select name="mode" data-aide="Essai : tout part à l’adresse de test, rien n’est marqué envoyé. Réel : chaque courriel part à son destinataire."><option value="essai">Essai (adresse de test)</option><option value="reel">Réel (vrais destinataires)</option></select></label>'+
 '<label>Adresse de test<input name="essai" type="email" placeholder="votre adresse" data-aide="Adresse qui reçoit les courriels en mode essai, pour vérifier leur aspect."></label>'+
 '<label>Expéditeur (au nom de l’ACRB)<input name="exp" placeholder="ACRB asbl <info@…>" data-aide="Nom et adresse qui apparaissent comme expéditeur. Toujours une adresse de l’association."></label>'+
 '<button class="btn o" type="submit" data-aide="Enregistre le mode et les adresses. Le changement est tracé.">Enregistrer</button></form></details>'+
 '<div class="ev_msg" id="ev_msg"></div></div>';
function msg(t,k){var e=$("ev_msg");if(e){e.className="ev_msg"+(k?" "+k:"");e.textContent=t||"";}}
function appel(corps){return sb.functions.invoke(FN,{body:corps}).then(function(x){if(x.error){var c=x.error.context;if(c&&c.json)return c.json().then(function(j){throw new Error(j.error||x.error.message);});throw x.error;}return x.data;});}
function etat(){return sb.rpc("acrb_courriels_etat").then(function(x){var k=$("ev_k");if(!k)return;
  if(x.error){k.innerHTML='<span class="ko">'+esc(x.error.message)+'</span>';return;}var d=x.data;
  k.innerHTML='<span class="'+(d.attente?"w":"ok")+'">'+d.attente+' en attente</span>'+(d.sans_destinataire?'<span>'+d.sans_destinataire+' sans adresse</span>':'')+(d.echec?'<span class="ko">'+d.echec+' en échec</span>':'')+'<span>'+d.envoyes_30j+' envoyé(s) en 30 jours</span><span class="'+(d.mode==="reel"?"ok":"w")+'">Mode '+(d.mode==="reel"?"réel":"essai"+(d.essai?" → "+esc(d.essai):""))+'</span>';
  var f=$("ev_rg");if(f){f.mode.value=d.mode;f.exp.placeholder=d.expediteur||f.exp.placeholder;}});}
function montrer(a){apercu=a;var z=$("ev_ap"),n=a.liste.length,essai=a.mode!=="reel",nb=essai?Math.min(n,3):n;
  if(!n){z.innerHTML='<div class="ev_box"><h4>Rien à envoyer</h4><p class="soon" style="margin:0">Aucun courriel en attente avec une adresse.'+(a.bloques.length?" "+a.bloques.length+" courriel(s) sans destinataire restent de côté.":"")+'</p></div>';return;}
  z.innerHTML='<div class="ev_box"><h4>'+(essai?"Essai : "+nb+" courriel(s) iront à l’adresse de test "+esc(a.essai||"(à régler)"):n+" courriel(s) vont partir à leurs destinataires")+'</h4>'+
   '<p style="margin:0;font-size:14px">Expéditeur : '+esc(a.expediteur||"—")+(a.cle?'':' · <b style="color:#b23a2b">service d’envoi pas encore relié</b>')+(a.bloques.length?' · '+a.bloques.length+' sans destinataire, laissé(s) de côté':'')+'</p>'+
   '<div class="ev_l">'+a.liste.map(function(m,i){return '<div'+(essai&&i>=3?' style="opacity:.45"':'')+'><b>'+esc(ORIG[m.origine]||m.origine||"Autre")+'</b><span>'+esc(m.destinataire)+'</span><span>'+esc(m.sujet)+'</span></div>';}).join("")+'</div>'+
   '<div class="docs" style="margin:0"><button class="btn" type="button" id="ev_ok" data-aide="Envoie maintenant les courriels de la liste. En mode réel, ils partent aux commerçants et ne peuvent plus être rappelés."'+(a.cle?'':' disabled')+'>'+(essai?"Envoyer l’essai ("+nb+")":"Confirmer l’envoi de "+n+" courriel(s)")+'</button>'+
   '<button class="btn o" type="button" id="ev_no" data-aide="Ferme la liste sans rien envoyer.">Ne rien envoyer</button></div></div>';}
function envoyer(){var a=apercu;if(!a)return;var essai=a.mode!=="reel",ids=a.liste.map(function(m){return m.id;});if(essai)ids=ids.slice(0,3);
  if(!essai&&!window.confirm("Envoyer "+ids.length+" courriel(s) aux commerçants maintenant ?"))return;
  var b=$("ev_ok");b.disabled=true;var tot={envoyes:0,echecs:0},err=[],i=0,LOT=50;
  (function suite(){if(i>=ids.length){$("ev_ap").innerHTML="";apercu=null;
      msg((essai?"Essai : ":"")+tot.envoyes+" courriel(s) envoyé(s)"+(tot.echecs?", "+tot.echecs+" en échec ("+err.slice(0,3).join(" ; ")+")":"")+".",tot.echecs?"bad":"ok");etat();return;}
    var lot=ids.slice(i,i+LOT);i+=LOT;msg("Envoi… "+Math.min(i,ids.length)+" / "+ids.length);
    appel({action:"envoyer",ids:lot,confirme:true}).then(function(r){tot.envoyes+=r.envoyes;tot.echecs+=r.echecs;(r.details||[]).forEach(function(d){if(d.erreur)err.push(d.erreur);});suite();})
    .catch(function(e){b.disabled=false;msg("Envoi interrompu : "+(e.message||e)+" ("+tot.envoyes+" déjà envoyé(s)).","bad");etat();});})();}
function lier(){var c=$("c_fac");if(!c||$("ev"))return;var bk=$("bk_rappel"),hote=bk?bk.closest(".tx")||bk.parentNode:null;
  if(hote&&hote.parentNode)hote.insertAdjacentHTML("afterend",HTML);else c.insertAdjacentHTML("beforeend",HTML);
  var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
  $("ev_maj").onclick=function(){$("ev_ap").innerHTML="";etat();};
  $("ev_go").onclick=function(){var b=this;b.disabled=true;msg("Préparation de la liste…");appel({action:"apercu"}).then(function(a){b.disabled=false;msg("");montrer(a);}).catch(function(e){b.disabled=false;msg(e.message||String(e),"bad");});};
  $("ev_ap").addEventListener("click",function(e){if(e.target.id==="ev_ok")envoyer();if(e.target.id==="ev_no"){$("ev_ap").innerHTML="";apercu=null;msg("Rien n’a été envoyé.");}});
  $("ev_rg").onsubmit=function(e){e.preventDefault();var f=e.target,bt=f.querySelector("button");
    if(f.mode.value==="reel"&&!window.confirm("Passer en mode réel ? Les prochains envois partiront aux vrais destinataires."))return;
    bt.disabled=true;sb.rpc("acrb_courriels_regler",{p_mode:f.mode.value,p_essai:f.essai.value||null,p_expediteur:f.exp.value||null,p_repondre_a:null}).then(function(x){bt.disabled=false;
      if(x.error){msg("Non enregistré : "+x.error.message,"bad");return;}f.essai.value="";msg("Réglages enregistrés : mode "+(x.data.mode==="reel"?"réel":"essai")+".","ok");etat();});};}
window.ENVOIS={init:function(_sb){sb=_sb;if(!lie){lie=true;lier();}etat();},rafraichir:function(){return sb&&etat();}};
})();
