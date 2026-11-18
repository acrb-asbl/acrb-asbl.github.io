/* « Demander une modification » depuis n'importe quel écran (Amir, conseil, bénévoles administratifs),
   et la rubrique « Demandes et coûts » : suivi des demandes + registre des coûts en ajout seul (3 colonnes jamais additionnées). */
(function(){
var sb,peutCouts=false,lie=false;
function $(i){return document.getElementById(i);}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function dt(s){if(!s)return "";var d=new Date(s);return d.toLocaleDateString("fr-BE")+(String(s).length>10?" "+d.toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"}):"");}
function n(v,dec){return v==null?"—":Number(v).toLocaleString("fr-BE",{minimumFractionDigits:dec||0,maximumFractionDigits:dec||0});}
var ST={nouvelle:"Nouvelle",en_cours:"En cours",a_valider:"À valider par vous",faite:"Faite",refusee:"Refusée",conseil:"Soumise au conseil"};
var ET={mesure:"mesuré",estime:"estimé",conventionnel:"conventionnel"};
var CSS='#dm_btn{position:fixed;right:16px;bottom:16px;z-index:60;background:var(--brick,#b23a2b);color:#fff;border:0;padding:13px 16px;font:700 15px "Libre Franklin",Arial,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.2);cursor:pointer}'+
'#dm_pan{position:fixed;right:16px;bottom:16px;z-index:61;width:min(420px,calc(100vw - 32px));background:#fff;border:1px solid var(--line,#dfe3ea);border-top:4px solid var(--brick,#b23a2b);padding:16px;box-shadow:0 8px 30px rgba(0,0,0,.25)}#dm_pan[hidden]{display:none}'+
'#dm_pan h3{margin:0 0 4px;font:800 17px "Libre Franklin",Arial,sans-serif}#dm_pan p{margin:0 0 10px;font-size:14px;color:var(--muted,#5f6675)}'+
'#dm_pan select,#dm_pan textarea{width:100%;padding:10px;border:1px solid #c6ccd6;font:16px "Source Sans 3",sans-serif;margin-bottom:8px}#dm_pan textarea{min-height:120px}'+
'#dm_pan .r{display:flex;gap:8px;align-items:center;flex-wrap:wrap}#dm_pan .r button{padding:11px 14px;font:700 15px "Libre Franklin",Arial,sans-serif;border:1px solid var(--navy,#14233c);background:var(--navy,#14233c);color:#fff;cursor:pointer}#dm_pan .r button.o{background:#fff;color:var(--navy,#14233c)}'+
'#dm_ok{font-size:14.5px;font-weight:600;margin-top:8px}#dm_ok.ok{color:var(--green,#1f8a4c)}#dm_ok.bad{color:var(--brick,#b23a2b)}#dm_pan label.e{font-size:13px;color:var(--muted,#5f6675);display:flex;gap:6px;align-items:center;margin:0 0 8px}'+
'.dmt{width:100%;border-collapse:collapse;font-size:14px;margin-top:8px}.dmt th,.dmt td{text-align:left;padding:7px 6px;border-bottom:1px solid var(--line,#dfe3ea);vertical-align:top}.dmt th{font:700 12px "Libre Franklin",Arial,sans-serif;text-transform:uppercase;letter-spacing:.04em;color:var(--muted,#5f6675)}'+
'.dmt .num{text-align:right;white-space:nowrap}.dmtot{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.dmtot div{background:#f7f8fa;border:1px solid var(--line,#dfe3ea);padding:10px}.dmtot b{display:block;font:800 20px "Libre Franklin",Arial,sans-serif}.dmtot span{font-size:12.5px;color:var(--muted,#5f6675)}'+
'#c_dem{min-width:0}.dmscroll{overflow-x:auto;max-width:100%}.dmt td{word-break:break-word}@media(max-width:700px){.dmtot{grid-template-columns:1fr}#dm_btn{right:12px;bottom:12px}}';

function ecran(){var c=window.ESPNAV&&ESPNAV.courant&&ESPNAV.courant();var a=document.querySelector(".nv .r1 a.on"),b=document.querySelector(".nv .r2 a.on");
  return "Espace privé"+(a?" › "+a.textContent.replace(/\s*\d+$/,"").trim():"")+(b?" › "+b.textContent.trim():"");}
function bouton(admin){
  if($("dm_btn"))return;
  document.body.insertAdjacentHTML("beforeend",'<button id="dm_btn" type="button">✎ Demander une modification</button>'+
    '<div id="dm_pan" hidden role="dialog" aria-label="Demander une modification"><h3>Demander une modification</h3><p>Décrivez ce que vous voulez changer, ajouter ou retirer. La modification est préparée, testée, puis vous la validez avant publication.</p>'+
    '<select id="dm_page"></select><textarea id="dm_txt" placeholder="Ex. : sur la page d’accueil de l’ACRB, remplacer le numéro de téléphone par … / ajouter une colonne « payé le » dans les cotisations …"></textarea>'+
    (admin?'<label class="e"><input type="checkbox" id="dm_essai"> Demande d’essai (non attribuée dans les coûts)</label>':'')+
    '<div class="r"><button type="button" id="dm_go">Envoyer la demande</button><button type="button" class="o" id="dm_x">Fermer</button></div><div id="dm_ok"></div></div>');
  $("dm_btn").onclick=function(){var s=$("dm_page"),e=ecran();s.innerHTML=[e,"Site de l’ACRB (association)","Shopping Brabant (annuaire)","Fiche commerçant (inscription)","Guide du quartier Nord","Quartier Nord (site d’information)","Espace commerçant","Toute la plateforme / autre"].map(function(x){return '<option>'+esc(x)+'</option>';}).join("");
    $("dm_pan").hidden=false;$("dm_btn").hidden=true;$("dm_ok").textContent="";$("dm_txt").focus();};
  $("dm_x").onclick=function(){$("dm_pan").hidden=true;$("dm_btn").hidden=false;};
  $("dm_ok").addEventListener("click",function(e){if(e.target.closest("a")){$("dm_pan").hidden=true;$("dm_btn").hidden=false;}});
  $("dm_go").onclick=function(){var b=this,t=$("dm_txt").value.trim(),ok=$("dm_ok");if(t.length<5){ok.className="bad";ok.textContent="Décrivez la modification souhaitée.";return;}
    b.disabled=true;b.textContent="Envoi…";ok.className="";ok.textContent="";
    sb.rpc("acrb_demande_creer",{p_page:$("dm_page").value,p_texte:t,p_essai:!!($("dm_essai")&&$("dm_essai").checked)}).then(function(x){b.disabled=false;b.textContent="Envoyer la demande";
      if(x.error){ok.className="bad";ok.textContent="Non envoyée : "+x.error.message;return;}
      ok.className="ok";ok.innerHTML="✓ Demande n°"+x.data+" envoyée à "+new Date().toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"})+'. Suivi : <a href="#/association/demandes">Association › Demandes et coûts</a>.';$("dm_txt").value="";charger();});};
}
function charger(){
  if(!$("dm_list"))return;
  sb.rpc("acrb_demandes_liste").then(function(x){var l=x.data||[];
    $("dm_list").innerHTML=x.error?'<p class="soon">'+esc(x.error.message)+'</p>':l.length?'<div class="dmscroll"><table class="dmt"><tr><th>N°</th><th>Date</th><th>Demandeur</th><th>Écran</th><th>Demande</th><th>État</th></tr>'+l.map(function(d){return '<tr><td>'+d.id+(d.essai?' <span class="st">essai</span>':'')+'</td><td>'+esc(dt(d.cree_le))+'</td><td>'+esc(d.auteur_nom||d.auteur_email)+'</td><td>'+esc(d.page||"")+'</td><td>'+esc(d.texte).replace(/\n/g,"<br>")+(d.reponse?'<br><i>'+esc(d.reponse)+'</i>':'')+'</td><td>'+esc(ST[d.statut]||d.statut)+'</td></tr>';}).join("")+'</table></div>':'<p class="soon">Aucune demande pour l’instant. Le bouton rouge « ✎ Demander une modification », en bas à droite de chaque écran, en crée une.</p>';});
  if(!peutCouts){$("dm_couts").innerHTML='<p class="soon">Le registre des coûts est lu par le conseil.</p>';return;}
  sb.rpc("acrb_couts_liste").then(function(x){if(x.error){$("dm_couts").innerHTML='<p class="soon">'+esc(x.error.message)+'</p>';return;}var d=x.data||{},t=d.totaux||{},l=d.lignes||[];
    $("dm_couts").innerHTML='<div class="dmtot"><div><b>'+n(t.decaisse_eur,2)+' €</b><span>Décaissé réel</span></div><div><b>'+n(t.equivalent_api_usd,2)+' $</b><span>Équivalent au tarif API (valeur de remplacement, pas une dépense)</span></div><div><b>'+n(t.heures,1)+' h</b><span>Heures bénévoles (non valorisées tant qu’aucun taux n’est voté)</span></div></div>'+
      '<p class="soon">Ces trois colonnes ne s’additionnent jamais. Chaque ligne dit si elle est mesurée, estimée ou conventionnelle. Registre en ajout seul : une erreur se corrige par une contre-écriture.</p>'+
      '<div class="dmscroll"><table class="dmt"><tr><th>Date</th><th>Demandeur</th><th>Nature</th><th class="num">Décaissé</th><th class="num">Équiv. API</th><th class="num">Heures</th><th>Type</th></tr>'+
      l.map(function(c){return '<tr><td>'+esc(dt(c.quand))+'</td><td>'+esc(c.demandeur)+(c.paye_par?'<br><span class="soon">payé par '+esc(c.paye_par)+'</span>':'')+'</td><td>'+esc(c.nature)+(c.quantite?'<br><span class="soon">'+esc(c.quantite)+'</span>':'')+(c.tarif?'<br><span class="soon">Tarif : '+esc(c.tarif)+'</span>':'')+(c.preuve?'<br><span class="soon">Preuve : '+esc(c.preuve)+'</span>':'')+'</td><td class="num">'+(c.decaisse_eur==null?'—':n(c.decaisse_eur,2)+' €')+'</td><td class="num">'+(c.equivalent_api_usd==null?'—':n(c.equivalent_api_usd,2)+' $')+'</td><td class="num">'+(c.heures==null?'—':n(c.heures,1))+'</td><td>'+esc(ET[c.etiquette]||c.etiquette)+'</td></tr>';}).join("")+'</table></div>';});
}
window.DEMANDES={init:function(_sb,roles){sb=_sb;
  if(!lie){lie=true;var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);}
  peutCouts=roles.some(function(r){return ["admin","ca","tresorier"].indexOf(r)>=0;});
  bouton(roles.indexOf("admin")>=0);charger();},recharger:charger};
})();
