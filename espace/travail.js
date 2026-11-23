/* Gestion de l'ACRB : journal du terrain, travail et valorisation, permissions réglées par le fondateur */
(function(){
var sb,$=function(i){return document.getElementById(i);},lie=false;
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function n(x,d){if(x==null||x==="")return "—";return Number(x).toLocaleString("fr-BE",{minimumFractionDigits:d||0,maximumFractionDigits:d||0});}
function dt(s){if(!s)return "";var d=new Date(s);return d.toLocaleDateString("fr-BE",{day:"2-digit",month:"2-digit"})+(String(s).length>10?" "+d.toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"}):"");}
var CSS='.tvk{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:12px 0}.tvk div{background:#f4f5f8;padding:12px}.tvk b{display:block;font:800 24px "Libre Franklin",Arial,sans-serif;color:#14233c}.tvk span{font-size:13px;color:#5f6675}'+
 '.tvs{overflow-x:auto}.tvt{border-collapse:collapse;width:100%;font-size:14px}.tvt th,.tvt td{border-bottom:1px solid #dfe3ea;padding:7px 8px;text-align:left;vertical-align:top}.tvt th{font-size:12px;color:#5f6675;text-transform:uppercase;letter-spacing:.04em}.tvt .num{text-align:right;white-space:nowrap}.tvt td:nth-child(3){min-width:180px}'+
 '.tvf{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin:10px 0;padding:12px;border:1px solid #dfe3ea}.tvf label{display:flex;flex-direction:column;font-size:13px;color:#5f6675}.tvf input{font:inherit;padding:7px;border:1px solid #c9ced8;width:120px}.tvf .chk{flex-direction:row;align-items:center;gap:6px}.tvf .chk input{width:auto}'+
 '.tvbtn{font:700 14px "Libre Franklin",Arial,sans-serif;padding:8px 14px;background:#14233c;color:#fff;border:0;cursor:pointer}.tvok{font-size:13px;color:#1f8a4c}.tvok.bad{color:#b23a2b}.tvnote{font-size:13px;color:#5f6675}'+
 '.pv select{font:inherit;padding:4px;border:1px solid #c9ced8}.pv .def{color:#5f6675;font-size:12px}.pv .on{color:#1f8a4c;font-weight:700}.pv .off{color:#b23a2b;font-weight:700}';
var CH={validation:"commerce confirmé",enseigne:"enseigne corrigée",categorie:"rubrique corrigée",statut:"statut changé",vitrine:"vitrine",adresse:"déménagement"};
var ET={mesure:"mesuré",estime:"estimé",conventionnel:"conventionnel"};

function terrain(){var box=$("tj_box");if(!box)return;
  sb.rpc("acrb_terrain_journal").then(function(x){if(x.error){box.innerHTML='<p class="tvnote">'+esc(x.error.message)+'</p>';return;}var d=x.data||{},p=d.personnes||[],r=d.recents||[];
    var pc=d.total_commerces?Math.round(100*d.valides/d.total_commerces):0;
    box.innerHTML='<div class="tvk"><div><b>'+n(d.valides)+' / '+n(d.total_commerces)+'</b><span>commerces confirmés sur place ('+pc+' %)</span></div><div><b>'+n(p.length)+'</b><span>personne(s) sur le terrain</span></div><div><b>'+n(p.reduce(function(a,b){return a+(+b.validations||0);},0))+'</b><span>passages consignés</span></div></div>'+
      (p.length?'<div class="tvs"><table class="tvt"><tr><th>Qui</th><th class="num">Commerces vus</th><th class="num">Confirmations</th><th class="num">Corrections</th><th class="num">Jours</th><th>Dernier passage</th></tr>'+p.map(function(q){return '<tr><td>'+esc(q.qui)+'</td><td class="num">'+n(q.commerces)+'</td><td class="num">'+n(q.validations)+'</td><td class="num">'+n(q.corrections)+'</td><td class="num">'+n(q.jours)+'</td><td>'+esc(dt(q.dernier))+'</td></tr>';}).join("")+'</table></div>':'')+
      '<details style="margin-top:16px"><summary style="cursor:pointer;font-weight:700">Derniers passages ('+r.length+')</summary>'+(r.length?'<div class="tvs"><table class="tvt"><tr><th>Quand</th><th>Qui</th><th>Commerce</th><th>Ce qui a été consigné</th></tr>'+r.map(function(v){return '<tr><td>'+esc(dt(v.quand))+'</td><td>'+esc(v.qui)+'</td><td>'+esc(v.enseigne||"")+'<br><span class="tvnote">'+esc(v.adresse||"")+'</span></td><td>'+esc(CH[v.champ]||v.champ)+(v.champ!=="validation"&&(v.ancienne||v.nouvelle)?' : '+esc(v.ancienne||"—")+' → '+esc(v.nouvelle||"—"):(v.nouvelle&&v.nouvelle!=="ok"?' · '+esc(v.nouvelle):''))+'</td></tr>';}).join("")+'</table></div>':'<p class="tvnote">Aucun passage consigné pour l’instant.</p>')+'</details>';});}

function travail(){var box=$("tv_box");if(!box)return;
  sb.rpc("acrb_travail_resume").then(function(x){if(x.error){box.innerHTML='<p class="tvnote">'+esc(x.error.message)+'</p>';return;}var d=x.data||{},p=d.personnes||[],l=d.lignes||[],F=!!d.fondateur;
    var H=p.reduce(function(a,b){return a+(+b.heures||0);},0),J=p.reduce(function(a,b){return a+(+b.jours||0);},0),T=p.reduce(function(a,b){return a+(+b.demandes_faites||0)+(+b.terrain||0)+(+b.seances||0);},0),
        V=p.reduce(function(a,b){return a+(+b.valeur_eur||0);},0),C=p.reduce(function(a,b){return a+(+b.cout_marge_usd||0);},0);
    var h='<div class="tvk"><div><b>'+n(H,1)+' h</b><span>'+(F?'heures de travail, toute l’équipe':'vos heures de travail')+'</span></div><div><b>'+n(J)+'</b><span>jours de travail</span></div><div><b>'+n(T)+'</b><span>travaux (séances, demandes abouties, passages terrain)</span></div>'+
      (F?'<div><b>'+(d.taux_horaire!=null?n(V,0)+' €':'à fixer')+'</b><span>valorisation du travail'+(d.taux_horaire!=null?' ('+n(d.taux_horaire)+' €/h)':'')+'</span></div>':'')+
      (d.voit_cout?'<div><b>'+n(C,2)+' $</b><span>coût du travail, marge de l’usine comprise ('+n(d.marge_pct)+' %)</span></div>':'')+'</div>';
    if(F)h+='<form class="tvf" id="tv_regl"><label>Taux horaire (€)<input name="taux" type="number" min="0" step="1" value="'+(d.taux_horaire!=null?d.taux_horaire:'')+'" placeholder="ex. 65"></label><label>Marge de l’usine (%)<input name="marge" type="number" min="0" max="99" step="1" value="'+(d.marge_pct!=null?d.marge_pct:92)+'"></label><label class="chk"><input name="vis" type="checkbox"'+(d.cout_visible?' checked':'')+'> L’équipe voit le coût de son propre travail</label><button class="tvbtn">Enregistrer</button><span class="tvok" id="tv_ok"></span></form><p class="tvnote">Vous seul voyez cette vue complète et la valorisation en euros. Chaque membre de l’équipe voit uniquement ses propres heures, jours et travaux, et le coût marge comprise si l’interrupteur est activé (réglable aussi personne par personne dans « Permissions »).</p>';
    h+='<div class="tvs"><table class="tvt"><tr><th>Qui</th><th class="num">Heures</th><th class="num">Jours</th><th class="num">Séances</th><th class="num">Demandes abouties</th><th class="num">En cours</th><th class="num">Terrain</th><th class="num">Jetons</th>'+(d.voit_cout?'<th class="num">Coût marge comprise</th>':'')+(F?'<th class="num">Coût brut API</th><th class="num">Valorisation</th>':'')+'</tr>'+
      p.map(function(q){return '<tr><td>'+esc(q.nom||q.email)+(q.nom?'<br><span class="tvnote">'+esc(q.email)+'</span>':'')+'</td><td class="num">'+n(q.heures,1)+'</td><td class="num">'+n(q.jours)+'</td><td class="num">'+n(q.seances)+'</td><td class="num">'+n(q.demandes_faites)+'</td><td class="num">'+n(q.demandes_ouvertes)+'</td><td class="num">'+n(q.terrain)+'</td><td class="num">'+n(q.jetons)+'</td>'+(d.voit_cout?'<td class="num">'+(q.cout_marge_usd!=null?n(q.cout_marge_usd,2)+' $':'—')+'</td>':'')+(F?'<td class="num">'+(q.cout_api_usd!=null?n(q.cout_api_usd,2)+' $':'—')+'</td><td class="num">'+(q.valeur_eur!=null?n(q.valeur_eur,0)+' €':'—')+'</td>':'')+'</tr>';}).join("")+'</table></div>';
    h+='<details style="margin-top:16px"><summary style="cursor:pointer;font-weight:700">Détail, séance par séance ('+l.length+')</summary>'+(l.length?'<div class="tvs"><table class="tvt"><tr><th>Date</th><th>Qui</th><th>Travail</th><th class="num">Heures</th><th class="num">Jetons</th>'+(d.voit_cout?'<th class="num">Coût marge comprise</th>':'')+'<th>Mesure</th></tr>'+
      l.map(function(c){return '<tr><td>'+esc(dt(c.quand))+'</td><td>'+esc(String(c.qui||"").split("@")[0])+'</td><td>'+esc(c.nature)+(c.preuve?'<br><span class="tvnote">'+esc(c.preuve)+'</span>':'')+'</td><td class="num">'+n(c.heures,1)+'</td><td class="num">'+n(c.jetons)+'</td>'+(d.voit_cout?'<td class="num">'+(c.cout_marge_usd!=null?n(c.cout_marge_usd,2)+' $':'—')+'</td>':'')+'<td>'+esc(ET[c.etiquette]||c.etiquette)+'</td></tr>';}).join("")+'</table></div>':'<p class="tvnote">Aucune séance inscrite à votre nom pour l’instant. Chaque séance de travail sur la plateforme y est ajoutée à la fin de la séance.</p>')+'</details>';
    box.innerHTML=h;
    var f=$("tv_regl");if(f)f.onsubmit=function(e){e.preventDefault();var ok=$("tv_ok"),t=f.taux.value===""?null:+f.taux.value,m=f.marge.value===""?null:+f.marge.value;
      sb.rpc("acrb_travail_regler",{p_taux:t,p_marge:m,p_cout_visible:f.vis.checked}).then(function(y){ok.className="tvok"+(y.error?" bad":"");ok.textContent=y.error?"Non enregistré : "+y.error.message:"✓ Enregistré";if(!y.error)setTimeout(travail,600);});};});}

function permissions(){var box=$("pv_box");if(!box)return;
  sb.rpc("acrb_perm_liste").then(function(x){if(x.error){box.innerHTML='<p class="tvnote">'+esc(x.error.message)+'</p>';return;}var d=x.data||{},cat=d.catalogue||[],ps=d.personnes||[],F=!!d.fondateur;
    var h='<p class="tvnote">'+(F?'Pour chaque personne et chaque permission : « Par défaut » suit son rôle ; « Accordée » ou « Retirée » s’applique à elle seule, tout de suite. Chaque changement est inscrit au journal.':'Le fondateur règle ces permissions. Ce tableau montre qui peut faire quoi.')+'</p>'+
      '<div class="tvs pv"><table class="tvt"><tr><th>Permission</th>'+ps.map(function(p){return '<th>'+esc(p.nom||p.email)+'<br><span class="def">'+esc((p.roles||[]).join(", "))+'</span></th>';}).join("")+'</tr>'+
      cat.map(function(c){return '<tr><td><b>'+esc(c.libelle)+'</b><br><span class="def">Par défaut : '+esc(c.defaut)+'</span></td>'+ps.map(function(p){var fond=(p.roles||[]).indexOf("fondateur")>=0,v=(p.reglages||{})[c.cle];
        if(fond)return '<td class="on">toujours</td>';
        if(!F)return '<td class="'+(v===true?'on':v===false?'off':'def')+'">'+(v===true?'accordée':v===false?'retirée':'par défaut')+'</td>';
        return '<td><select data-pe="'+esc(p.email)+'" data-pc="'+esc(c.cle)+'"><option value=""'+(v==null?' selected':'')+'>Par défaut</option><option value="1"'+(v===true?' selected':'')+'>Accordée</option><option value="0"'+(v===false?' selected':'')+'>Retirée</option></select></td>';}).join("")+'</tr>';}).join("")+'</table></div><span class="tvok" id="pv_ok"></span>';
    box.innerHTML=h;
    box.querySelectorAll("select[data-pe]").forEach(function(s){s.onchange=function(){var ok=$("pv_ok"),v=s.value===""?null:s.value==="1";s.disabled=true;
      sb.rpc("acrb_perm_regler",{p_email:s.dataset.pe,p_cle:s.dataset.pc,p_valeur:v}).then(function(y){s.disabled=false;ok.className="tvok"+(y.error?" bad":"");ok.textContent=y.error?"Non enregistré : "+y.error.message:"✓ Enregistré à "+new Date().toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"});});};});});}

window.TRAVAIL={init:function(_sb,roles){sb=_sb;
  if(!lie){lie=true;var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);}
  var has=function(l){return roles.some(function(r){return l.indexOf(r)>=0;});};
  var eq=["fondateur","admin","ca","tresorier","benevole_admin","benevole_terrain","mainteneur"];
  if(has(eq)&&$("c_trav")){$("c_trav").hidden=false;travail();}
  if(has(["fondateur","admin","ca","benevole_admin","benevole_terrain"])&&$("c_tj")){$("c_tj").hidden=false;terrain();}
  if(has(["fondateur","admin","ca"])&&$("c_perm")){$("c_perm").hidden=false;permissions();}
}};
})();
