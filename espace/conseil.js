/* Conseil : lien personnel par administrateur (nomination confirmée ou démission déclarée par l'intéressé),
   envoi par WhatsApp ou e-mail, un par un ou pour tous ; changement de fonction soumis au vote unanime. */
(function(){
var sb,S={},rows=[],list,rerender,dejaActes=false;
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function fd(s){if(!s)return "";var d=new Date(s);return d.toLocaleDateString("fr-BE")+(String(s).length>10?" "+d.toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"}):"");}
function base(){return location.origin+location.pathname.replace(/[^\/]*$/,"");}
function texte(nom,url){return "Bonjour "+String(nom||"").split(" ")[0]+", l’ACRB met à jour la liste de son conseil d’administration. Pouvez-vous confirmer votre situation en un clic, sans mot de passe ? "+url+" Merci !";}
function wa(tel,t){var n=String(tel||"").replace(/[^0-9+]/g,"");if(n.indexOf("+")===0)n=n.slice(1);else if(n.indexOf("00")===0)n=n.slice(2);else if(n.indexOf("0")===0)n="32"+n.slice(1);return "https://wa.me/"+n+"?text="+encodeURIComponent(t);}
function mail(em,t){return "mailto:"+encodeURIComponent(em||"")+"?subject="+encodeURIComponent("ACRB — votre mandat d’administrateur")+"&body="+encodeURIComponent(t);}
function etatLien(s){var l=s&&s.lien;if(!l)return "Aucun lien envoyé";var r=l.reponse||{};
  return "Lien créé le "+fd(l.cree_le)+(l.ouvert_le?" · ouvert le "+fd(l.ouvert_le):" · pas encore ouvert")+(l.repondu_le?" · a répondu le "+fd(l.repondu_le)+(r.choix==="demission"?" (démission au "+fd(r.fin)+")":" (confirmé)"):"");}
function creer(id){return sb.rpc("acrb_ca_lien_creer",{p_ca:id}).then(function(x){if(x.error)throw x.error;return base()+"ca.html?t="+x.data;});}
function montrer(row,r,url){var s=S[r.id]||{},t=texte(r.nom,url),z=row.querySelector(".cp_go");
  z.innerHTML=(s.telephone?'<a class="btn p" target="_blank" rel="noopener" href="'+esc(wa(s.telephone,t))+'">WhatsApp</a>':'<a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text='+esc(encodeURIComponent(t))+'">WhatsApp (choisir le contact)</a>')+
    (s.email?'<a class="btn" href="'+esc(mail(s.email,t))+'">E-mail</a>':'')+'<button type="button" class="cp_cp">Copier le lien</button>';
  z.querySelector(".cp_cp").onclick=function(){var b=this;(navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(function(){b.textContent="Copié ✓";},function(){window.prompt("Lien personnel de "+r.nom,url);});};}
var CSS='.cp{grid-column:1/-1;margin-top:4px}.cp>summary{cursor:pointer;font-size:14px;color:var(--navy);font-weight:600}.cp .in{display:grid;grid-template-columns:1fr 1fr auto;gap:6px;margin:8px 0}'+
'.cp input,.cp select{padding:9px 10px;border:1px solid #c6ccd6;font:15px "Source Sans 3",sans-serif;min-width:0}.cp .l{font-size:13.5px;color:var(--muted);margin:2px 0 8px}'+
'.cp button,.cp .btn,.cpbulk button{font:700 13px "Libre Franklin",Arial,sans-serif;padding:9px 12px;border:1px solid var(--navy);background:#fff;color:var(--navy);cursor:pointer;text-decoration:none;display:inline-block;margin:0}'+
'.cp .btn.p,.cp button.p,.cpbulk button{background:var(--navy);color:#fff}.cp .cp_go{display:flex;gap:6px;flex-wrap:wrap}.cp .fx{display:grid;grid-template-columns:1fr auto;gap:6px;margin-top:10px}'+
'.cpbulk{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:10px 0 4px;padding:10px 12px;background:#f7f8fa;border:1px solid var(--line);font-size:14.5px}'+
'@media(max-width:700px){.cp .in{grid-template-columns:1fr}}';

function enrichir(rs,lst,rr){rows=rs;list=lst;rerender=rr;
  if(!dejaActes){dejaActes=true;sb.rpc("acrb_ca_actes_en_attente").then(function(x){if(x.data>0&&window.ACTES)window.ACTES.refresh();});}
  sb.rpc("acrb_ca_suivi").then(function(x){if(x.error)return;S={};(x.data||[]).forEach(function(s){S[s.ca_id]=s;});dessiner();});}
function dessiner(){
  var att=rows.filter(function(r){return r.statut==="a_confirmer";});
  var bk=document.getElementById("cpbulk");if(!bk){bk=document.createElement("div");bk.id="cpbulk";bk.className="cpbulk";list.parentNode.insertBefore(bk,list);}
  bk.innerHTML=att.length?'<span>'+att.length+' administrateur'+(att.length>1?'s':'')+' à confirmer. Chacun reçoit un lien personnel : « je suis administrateur » ou « je ne le suis plus depuis le… ».</span><button type="button" id="cp_all">Préparer les liens de tous</button>':'<span>Tous les administrateurs en fonction sont confirmés.</span>';
  var ba=document.getElementById("cp_all");if(ba)ba.onclick=function(){ba.disabled=true;ba.textContent="Préparation…";
    Promise.all(att.map(function(r){var row=list.querySelector('.carow[data-id="'+r.id+'"]');return creer(r.id).then(function(u){if(row){row.querySelector(".cp").open=true;montrer(row,r,u);}});}))
      .then(function(){ba.textContent="Liens prêts : touchez WhatsApp ou E-mail pour chacun";}).catch(function(e){ba.disabled=false;ba.textContent="Échec : "+(e.message||e);});};
  rows.forEach(function(r){var row=list.querySelector('.carow[data-id="'+r.id+'"]');if(!row||row.querySelector(".cp"))return;var s=S[r.id]||{},out=r.statut==="demissionne";
    if(out){row.insertAdjacentHTML("beforeend",'<div class="cp l">'+esc(etatLien(s))+'</div>');return;}
    var pres=/^président/i.test(r.fonction_fr||""),conf=r.statut==="confirme";
    row.insertAdjacentHTML("beforeend",'<details class="cp"'+(conf?'':' open')+'><summary>Lien personnel'+(conf?'':' — à envoyer')+(s.acces?' · accès à la plateforme ouvert':' · pas encore d’accès à la plateforme')+'</summary>'+
      '<div class="l">'+esc(etatLien(s))+'</div>'+
      '<form class="in"><input name="em" type="email" placeholder="E-mail" value="'+esc(s.email||"")+'"><input name="tel" type="tel" placeholder="GSM (WhatsApp)" value="'+esc(s.telephone||"")+'"><button type="submit">Enregistrer</button></form>'+
      '<div class="cp_go"><button type="button" class="p cp_mk">Préparer son lien</button></div>'+
      (conf&&!pres?'<div class="fx"><select class="cp_fct"><option value="">Changer de fonction (vote unanime)…</option>'+["Vice-président","Secrétaire","Trésorier","Administrateur"].filter(function(f){return f!==r.fonction_fr;}).map(function(f){return '<option>'+f+'</option>';}).join("")+'</select><button type="button" class="cp_vote">Proposer au vote</button></div>':'')+
      '<div class="l cp_m"></div></details>');
    var d=row.querySelector(".cp"),m=d.querySelector(".cp_m");
    d.querySelector("form").onsubmit=function(e){e.preventDefault();var f=e.target,b=f.querySelector("button");b.disabled=true;
      sb.rpc("acrb_ca_contact",{p_ca:r.id,p_email:f.em.value,p_tel:f.tel.value}).then(function(x){b.disabled=false;if(x.error){m.textContent="Échec : "+x.error.message;return;}
        S[r.id]=Object.assign(S[r.id]||{},{email:f.em.value.trim().toLowerCase()||null,telephone:f.tel.value.replace(/[^0-9+]/g,"")||null});m.textContent="Coordonnées enregistrées (visibles du seul conseil).";
        var mk=d.querySelector(".cp_mk");if(!mk&&d._url)montrer(row,r,d._url);});};
    var mk=d.querySelector(".cp_mk");mk.onclick=function(){mk.disabled=true;mk.textContent="…";creer(r.id).then(function(u){d._url=u;montrer(row,r,u);}).catch(function(e){mk.disabled=false;mk.textContent="Préparer son lien";m.textContent="Échec : "+(e.message||e);});};
    var bv=d.querySelector(".cp_vote");if(bv)bv.onclick=function(){var f=d.querySelector(".cp_fct").value;if(!f){m.textContent="Choisissez la nouvelle fonction.";return;}
      if(!window.confirm("Ouvrir un vote du conseil : « "+r.nom+" devient "+f+" » ? Le changement ne s’applique qu’à l’unanimité."))return;bv.disabled=true;
      sb.rpc("acrb_fonction_proposer",{p_ca:r.id,p_fonction:f}).then(function(x){bv.disabled=false;if(x.error){m.textContent="Échec : "+x.error.message;return;}
        m.innerHTML='Vote ouvert. Chaque administrateur vote dans <a href="#/conseil/votes">Conseil › Votes</a>.';if(window.VOTES&&window.VOTES.recharger)window.VOTES.recharger();});};
  });
}
window.CAPLUS={init:function(_sb){sb=_sb;if(!document.getElementById("cpcss")){var st=document.createElement("style");st.id="cpcss";st.textContent=CSS;document.head.appendChild(st);}},enrichir:enrichir};
})();
