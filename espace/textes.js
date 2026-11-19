/* Textes de référence du conseil (statuts, charte du CA) : lecture, adhésion nominative à la charte, suivi des adhésions. */
(function(){
var sb,D=null,lie=false;
function $(i){return document.getElementById(i);}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function d(s){if(!s)return "";var x=new Date(s);return x.toLocaleDateString("fr-BE",{day:"numeric",month:"long",year:"numeric"});}
function md(t){return esc(t).split(/\n\n+/).map(function(p){
  if(/^## /.test(p)){var l=p.split("\n");return '<h4>'+l[0].slice(3)+'</h4>'+(l.length>1?'<p>'+l.slice(1).join(" ")+'</p>':'');}
  if(/^- /.test(p))return '<ul><li>'+p.slice(2)+'</li></ul>';
  return '<p>'+p.replace(/\n/g,"<br>")+'</p>';}).join("").replace(/<\/ul><ul>/g,"");}
var CSS='.tx_doc{border:1px solid var(--line,#dfe3ea);margin:10px 0;background:#fff}.tx_doc>summary{cursor:pointer;padding:12px 14px;font:800 16px "Libre Franklin",Arial,sans-serif;color:var(--navy,#14233c)}'+
'.tx_doc>summary span{display:block;font:400 13.5px "Source Sans 3",sans-serif;color:var(--muted,#5f6675);margin-top:2px}.tx_doc .tx_c{padding:0 14px 14px;font-size:15px;line-height:1.55;max-height:70vh;overflow:auto}'+
'.tx_doc h4{font:800 14.5px "Libre Franklin",Arial,sans-serif;margin:16px 0 4px;color:var(--navy,#14233c)}.tx_doc ul{margin:4px 0 8px 18px;padding:0}'+
'.tx_ad{margin:10px 14px 14px;padding:12px;background:#f7f8fa;border:1px solid var(--line,#dfe3ea);font-size:14.5px}.tx_ad ul{margin:6px 0 10px 18px;padding:0}.tx_ad .ok{color:var(--green,#1f8a4c);font-weight:600}.tx_ad .no{color:var(--muted,#5f6675)}'+
'.tx_ad button{font:700 14px "Libre Franklin",Arial,sans-serif;padding:10px 14px;border:1px solid var(--navy,#14233c);background:var(--navy,#14233c);color:#fff;cursor:pointer}.tx_ok{margin-left:8px;font-weight:600;color:var(--green,#1f8a4c)}.tx_ok.bad{color:var(--brick,#b23a2b)}';
function rendre(){
  var t=D.textes||[],ad=D.adhesions||[],moi=D.moi,ouverts={};document.querySelectorAll("#tx_list details[open]").forEach(function(x){ouverts[x.dataset.code]=1;});
  $("tx_list").innerHTML=t.map(function(x){
    var h='<details class="tx_doc" data-code="'+esc(x.code)+'"'+(ouverts[x.code]||(x.adhesion&&moi&&!ad.some(function(a){return a.code===x.code&&a.ca_id===moi;}))?' open':'')+'><summary>'+esc(x.titre)+'<span>'+(x.date_texte?'Texte du '+esc(d(x.date_texte)):'')+(x.source?' · <a href="'+esc(x.source)+'" target="_blank" rel="noopener">publication officielle (PDF)</a>':'')+'</span></summary><div class="tx_c">'+md(x.contenu)+'</div>';
    if(x.adhesion){
      var mien=ad.filter(function(a){return a.code===x.code&&a.ca_id===moi;})[0];
      h+='<div class="tx_ad"><b>Adhésion des administrateurs</b><ul>'+(D.conseil||[]).map(function(c){var a=ad.filter(function(z){return z.code===x.code&&z.ca_id===c.id;})[0];
        return '<li>'+esc(c.nom)+' — '+(a?'<span class="ok">lu et approuvé le '+esc(d(a.le))+'</span>':'<span class="no">pas encore</span>')+'</li>';}).join("")+'</ul>'+
        (moi?(mien?'<span class="ok">Vous avez adhéré le '+esc(d(mien.le))+'.</span>':'<button type="button" data-adh="'+esc(x.code)+'">Lu et approuvé : j’adhère à la charte</button><span class="tx_ok" id="tx_ok_'+esc(x.code)+'"></span>'):'<span class="no">L’adhésion se fait avec un compte d’administrateur confirmé.</span>')+'</div>';}
    return h+'</details>';}).join("")||'<p class="soon">Aucun texte pour l’instant.</p>';
}
function charger(){sb.rpc("acrb_textes_liste").then(function(x){if(x.error){$("tx_list").innerHTML='<p class="soon">'+esc(x.error.message)+'</p>';return;}D=x.data;rendre();});}
window.TEXTES={init:function(_sb){sb=_sb;
  if(!lie){lie=true;var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
    $("c_textes").addEventListener("click",function(e){var b=e.target.closest("[data-adh]");if(!b)return;var c=b.dataset.adh,ok=$("tx_ok_"+c);b.disabled=true;b.textContent="Enregistrement…";
      sb.rpc("acrb_adherer",{p_code:c}).then(function(x){if(x.error){b.disabled=false;b.textContent="Lu et approuvé : j’adhère à la charte";ok.className="tx_ok bad";ok.textContent="Non enregistré : "+x.error.message;return;}
        (D.adhesions=D.adhesions||[]).push({code:c,ca_id:D.moi,le:x.data});rendre();});});}
  charger();}};
})();
