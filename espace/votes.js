/* Votes du conseil d'administration — décision à la majorité absolue (statuts, art. 21) ou à l'unanimité, entre plusieurs offres.
   Toute la règle (qui vote, unanimité, verrouillage) est appliquée dans la base ; cette page ne fait qu'afficher et transmettre. */
(function(){
var sb, user, data = null, ouvert = {}, noteOk = {};
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function eur(n){if(n==null||n==="")return "";return Number(n).toLocaleString("fr-BE",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";}
function dt(s){if(!s)return "";var d=new Date(s);return d.toLocaleDateString("fr-BE")+" à "+d.toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"});}
function num(v){v=String(v||"").replace(/\s/g,"").replace(",",".");return v===""||isNaN(+v)?null:+v;}
function $(id){return document.getElementById(id);}
function err(x){return (x&&x.error&&(x.error.message||x.error))||"";}
function etat(t,cls){var e=$("vo_state");e.textContent=t||"";e.className="soon"+(cls?" "+cls:"");}
function lienVote(id){return "https://acrb-asbl.github.io/espace/?vote="+id+"#/conseil/votes";}

function charger(){
  return sb.rpc("acrb_scrutins_liste").then(function(x){
    if(x.error){etat("Chargement impossible : "+err(x),"bad");return;}
    data=x.data;rendre();
    var m=/[?&]vote=(\d+)/.exec(location.search);
    if(m&&!ouvert._vu){ouvert._vu=1;ouvert[m[1]]=1;rendre();var e=$("vo_"+m[1]);if(e)setTimeout(function(){e.scrollIntoView({behavior:"smooth",block:"start"});},200);}
  });
}

function nomDe(s,id){var e=(s.electeurs||[]).filter(function(x){return x.id===id;})[0];return e?e.nom:"?";}
function offreDe(s,id){return (s.offres||[]).filter(function(o){return o.id===id;})[0];}

function adopte(d){return d.mode==="majorite"?"Adoptée à la majorité absolue : "+d.voix+" voix sur "+d.votants+" votants":d.mode==="voix_preponderante"?"Adoptée par la voix prépondérante du président (égalité à "+d.voix+" voix sur "+d.votants+")":"Adoptée à l\u2019unanimité des "+(d.unanimite||d.votants)+" administrateurs votants";}
function bilan(s){
  var n=(s.electeurs||[]).length,b=s.bulletins||[],votes=b.length;
  var maj=s.regle==="majorite",d=s.decision||{};
  if(s.statut==="adopte")return {txt:d.mode==="majorite"?"Adopté à la majorité absolue ("+d.voix+" voix sur "+d.votants+")":d.mode==="voix_preponderante"?"Adopté, voix du président prépondérante ("+d.voix+" sur "+d.votants+")":"Adopté à l'unanimité ("+n+" sur "+n+")",cls:"ok"};
  if(s.statut==="annule")return {txt:"Annulé",cls:"out"};
  if(votes<n)return {txt:votes+" vote"+(votes>1?"s":"")+" sur "+n,cls:"warn"};
  if(maj)return {txt:"Tous ont voté, sans majorité absolue : chacun peut revoir son vote",cls:"out"};
  if(b.some(function(v){return v.secret;}))return {txt:"Tous ont voté, sans unanimité : chacun peut revoir son vote",cls:"out"};
  var tous=b.every(function(v){return v.offre_id===null;});
  if(tous)return {txt:"Aucune offre retenue (rejet unanime)",cls:"out"};
  return {txt:"Pas d'unanimité : chacun peut revoir son vote",cls:"out"};
}

function rendre(){
  var box=$("vo_list");if(!data){box.innerHTML="";return;}
  var moi=data.moi,ss=data.scrutins||[];
  var att=(data.en_attente||[]);
  $("vo_att").innerHTML=att.length?("Votent les administrateurs <b>confirmés</b> dans « Conseil d'administration — validation nominative ». Pas encore confirmés, donc pas encore votants : "+att.map(function(a){return esc(a.nom);}).join(", ")+". Les confirmer ajoute leur voix aux votes ouverts ensuite."):"";
  if(moi==null)etat("Vous consultez les votes, mais votre compte n'est pas relié à un administrateur confirmé : vous ne pouvez pas voter.","warn");
  if(!ss.length){box.innerHTML='<p class="soon">Aucun vote pour l’instant. Ouvrez-en un ci-dessus, puis ajoutez les offres reçues.</p>';return;}
  box.innerHTML=ss.map(function(s){return carte(s,moi);}).join("");
}

function carte(s,moi){
  var bl=bilan(s),open=s.statut==="ouvert",dejaVote=(s.bulletins||[]).length>0;
  var mien=(s.bulletins||[]).filter(function(b){return b.ca_id===moi;})[0];
  var votant=moi!=null&&(s.electeurs||[]).some(function(e){return e.id===moi;});
  var h='<div class="vo" id="vo_'+s.id+'"><div class="vo_h"><div><b>'+esc(s.titre)+'</b><span class="st '+bl.cls+'">'+esc(bl.txt)+'</span></div>'+
    '<span class="soon">Ouvert le '+esc(dt(s.cree_le))+(s.echeance?' · à voter avant le '+esc(new Date(s.echeance).toLocaleDateString("fr-BE")):'')+'</span></div>';
  if(s.objet)h+='<p class="vo_obj">'+esc(s.objet)+'</p>';
  h+='<p class="soon"><b>Règle :</b> '+(s.regle==="majorite"?'majorité absolue des votants (statuts, art. 21), voix du président prépondérante en cas d\u2019égalité':'unanimité des votants')+'.</p>';
  if(s.secret)h+='<p class="soon">Vote secret jusqu\u2019à la clôture : chacun voit qui a voté, pas ce qu\u2019il a choisi. Tout devient nominatif quand le vote est clos (procès-verbal).</p>';
  if(s.statut==="adopte"&&s.decision&&s.effet&&s.effet.type==="fonction"){var d=s.decision,f=s.effet;
    h+='<div class="vo_dec"><b>Décision du conseil : '+esc(f.nom)+' devient '+esc(f.fonction_fr)+'</b> (auparavant '+esc(f.avant||'')+').<br>'+adopte(d)+', le '+esc(dt(d.le))+'.<br><button class="btn o" type="button" data-pv="'+s.id+'">Document de la décision (PDF)</button></div>';}
  else if(s.statut==="adopte"&&s.decision){var d=s.decision;
    h+='<div class="vo_dec"><b>Décision du conseil : commande à '+esc(d.prestataire)+'</b>'+(d.objet?' — '+esc(d.objet):'')+
      (d.montant_tvac!=null?'<br>Montant : '+esc(eur(d.montant_tvac))+' TVAC':'')+(d.montant_htva!=null?' ('+esc(eur(d.montant_htva))+' HTVA)':'')+
      '<br>'+adopte(d)+', le '+esc(dt(d.le))+'.<br><button class="btn o" type="button" data-pv="'+s.id+'">Document de la décision (PDF)</button></div>';}
  // offres
  var offres=s.offres||[];
  h+='<div class="vo_off">';
  if(!offres.length)h+='<p class="soon">Aucune offre encore. Ajoutez au moins deux offres avant de demander le vote.</p>';
  offres.forEach(function(o,i){
    var pour=(s.bulletins||[]).filter(function(b){return b.offre_id===o.id;}).map(function(b){return nomDe(s,b.ca_id);});
    var choisi=mien&&mien.offre_id===o.id;
    h+='<div class="vo_o'+(choisi?' sel':'')+(s.decision&&s.decision.offre_id===o.id?' win':'')+'"><div class="vo_on">Offre '+(i+1)+' · <b>'+esc(o.prestataire)+'</b></div>'+
      (o.objet?'<div>'+esc(o.objet)+'</div>':'')+
      (Math.max(+o.montant_tvac||0,+o.montant_htva||0)>12500?'<div class="vo_ag">Plus de 12 500 € : l\u2019accord de l\u2019assemblée générale aux deux tiers est requis (statuts, art. 15).</div>':'')+
      '<div class="vo_m">'+(o.montant_tvac!=null?esc(eur(o.montant_tvac))+' TVAC':'')+(o.montant_htva!=null?(o.montant_tvac!=null?' · ':'')+esc(eur(o.montant_htva))+' HTVA':'')+(o.montant_tvac==null&&o.montant_htva==null?'<span class="soon">montant non indiqué</span>':'')+'</div>'+
      (typeof o.notes==="string"&&o.notes?'<div class="soon">'+esc(o.notes)+'</div>':'')+
      '<div class="vo_docs">'+(o.fichier?'<button type="button" class="lk" data-doc="'+esc(o.fichier)+'">Voir l’offre (document)</button>':'')+(o.lien?'<a class="lk" target="_blank" rel="noopener" href="'+esc(o.lien)+'">Ouvrir le lien</a>':'')+
      (open&&!dejaVote?'<button type="button" class="lk d" data-retirer="'+o.id+'">Retirer</button>':'')+'</div>'+
      (pour.length?'<div class="vo_pour">Pour : '+pour.map(esc).join(", ")+'</div>':'')+notesHtml(o,moi,votant&&open)+
      (open&&votant&&offres.length?'<button type="button" class="btn'+(choisi?'':' o')+'" data-voter="'+s.id+'" data-offre="'+o.id+'">'+(choisi?'Votre choix ✓':'Choisir cette offre')+'</button>':'')+
      '</div>';
  });
  h+='</div>';
  // votants
  h+='<div class="vo_el"><b>Votants ('+(s.electeurs||[]).length+')</b><ul>'+(s.electeurs||[]).map(function(e){
    var b=(s.bulletins||[]).filter(function(x){return x.ca_id===e.id;})[0];var o=b&&b.offre_id?offreDe(s,b.offre_id):null;
    if(b&&b.secret)return '<li>'+esc(e.nom)+' — <b>a voté</b> <span class="soon">('+esc(dt(b.vote_le))+', choix secret jusqu\u2019à la clôture)</span></li>';
    return '<li>'+esc(e.nom)+' — '+(b?(o?'a choisi <b>'+esc(o.prestataire)+'</b>':'<b>aucune de ces offres</b>')+' <span class="soon">('+esc(dt(b.vote_le))+')</span>'+(b.commentaire?'<br><i>« '+esc(b.commentaire)+' »</i>':''):'<span class="soon">n’a pas encore voté'+(e.acces?'':' — pas encore d’accès à la plateforme')+'</span>')+'</li>';
  }).join("")+'</ul></div>';
  if((s.conflits||[]).length)h+='<div class="vo_el"><b>Conflits d\u2019intérêts déclarés</b> <span class="soon">(charte du conseil, point 6 : ces administrateurs ne votent pas et l\u2019inscription figure au procès-verbal)</span><ul>'+s.conflits.map(function(c){return '<li>'+esc(c.nom)+' — '+esc(c.motif)+' <span class="soon">('+esc(dt(c.le))+')</span></li>';}).join("")+'</ul></div>';
  if(open&&votant)h+='<div class="vo_act"><button type="button" class="btn o" data-conflit="'+s.id+'">Déclarer un conflit d\u2019intérêts</button></div>';
  if(open){
    if(votant&&offres.length)h+='<div class="vo_act"><input id="vo_com_'+s.id+'" placeholder="Commentaire (facultatif)" value="'+esc(mien&&mien.commentaire||"")+'"><button type="button" class="btn o" data-voter="'+s.id+'" data-offre="">Aucune de ces offres</button></div>';
    if(!dejaVote)h+=formOffre(s.id);
    h+='<div class="vo_act"><a class="btn o" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent("Vote du conseil ACRB : « "+s.titre+" ». Merci de voter ici : "+lienVote(s.id))+'">Prévenir les administrateurs (WhatsApp)</a>'+
      '<button type="button" class="btn o d" data-annuler="'+s.id+'">Annuler ce vote</button></div>';
  }
  return h+'</div>';
}

function notesHtml(o,moi,peut){
  var ns=o.notes||[],mienne=ns.filter(function(n){return n.ca_id===moi;})[0];
  var autres=ns.filter(function(n){return n.ca_id!==moi;}).map(function(n){return '<div class="vo_note"><b>'+esc(n.nom)+'</b> : '+esc(n.texte).replace(/\n/g,'<br>')+'</div>';}).join('');
  var h='<div class="vo_notes">'+(ns.length||peut?'<div class="vo_nh">Notes des administrateurs</div>':'')+autres;
  if(peut){var ok=noteOk[o.id];h+='<textarea id="vo_nt_'+o.id+'" rows="4" placeholder="Ma note : remarque, analyse, pour / contre…">'+esc(mienne?mienne.texte:'')+'</textarea><div class="vo_nb"><button type="button" class="btn o" data-note="'+o.id+'">Enregistrer ma note</button><span class="vo_nok" id="vo_nok_'+o.id+'">'+(ok?'✓ Enregistrée à '+esc(ok):(mienne&&mienne.maj_le?'Dernière version enregistrée le '+esc(dt(mienne.maj_le)):''))+'</span></div>';}
  else if(mienne)h+='<div class="vo_note"><b>Ma note</b> : '+esc(mienne.texte).replace(/\n/g,'<br>')+'</div>';
  return h+'</div>';
}

function formOffre(id){
  return '<details class="vo_add"'+(ouvert["f"+id]?' open':'')+'><summary data-f="'+id+'">+ Ajouter une offre reçue</summary><form data-offre-form="'+id+'">'+
    '<input name="p" placeholder="Prestataire (nom de la société)" required>'+
    '<input name="o" placeholder="Objet : ce qui est proposé">'+
    '<input name="t" inputmode="decimal" placeholder="Montant TVAC (€)">'+
    '<input name="h" inputmode="decimal" placeholder="Montant HTVA (€)">'+
    '<input name="l" type="url" placeholder="Lien vers l’offre (facultatif)">'+
    '<label class="soon">Document de l’offre (PDF ou photo) <input name="f" type="file" accept="application/pdf,image/*"></label>'+
    '<input name="n" placeholder="Remarque (délai, conditions…)">'+
    '<button class="btn" type="submit">Ajouter l’offre</button></form></details>';
}

function clic(e){
  var t=e.target.closest("[data-voter],[data-doc],[data-retirer],[data-annuler],[data-pv],[data-f],[data-note],[data-conflit]");if(!t)return;
  if(t.dataset.conflit){var mo=prompt("Déclarer un conflit d\u2019intérêts sur ce vote.\nVous ne voterez pas et ne participerez plus au débat ; votre déclaration et ses raisons figureront au procès-verbal (charte, point 6).\n\nNature du lien :");if(mo===null)return;
    sb.rpc("acrb_conflit_declarer",{p_scrutin:+t.dataset.conflit,p_motif:mo}).then(function(x){if(x.error){etat("Non enregistré : "+err(x),"bad");return;}etat("Conflit d\u2019intérêts enregistré : vous ne votez plus sur ce point.","ok");charger();});return;}
  if(t.dataset.note){var id=t.dataset.note,ta=$("vo_nt_"+id),sp=$("vo_nok_"+id);t.disabled=true;t.textContent="Enregistrement…";if(sp){sp.className="vo_nok";sp.textContent="";}
    sb.rpc("acrb_note_offre",{p_offre:+id,p_texte:ta?ta.value:""}).then(function(x){t.disabled=false;t.textContent="Enregistrer ma note";
      if(x.error){if(sp){sp.className="vo_nok bad";sp.textContent="Non enregistrée : "+err(x);}return;}
      noteOk[id]=new Date().toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"});if(sp)sp.textContent="✓ Enregistrée à "+noteOk[id];charger();});return;}
  if(t.dataset.f){ouvert["f"+t.dataset.f]=!ouvert["f"+t.dataset.f];return;}
  if(t.dataset.voter){var sid=+t.dataset.voter,off=t.dataset.offre?+t.dataset.offre:null,c=$("vo_com_"+sid);
    t.disabled=true;etat("Enregistrement du vote…");
    sb.rpc("acrb_voter",{p_scrutin:sid,p_offre:off,p_commentaire:c?c.value:null}).then(function(x){
      if(x.error){etat("Vote refusé : "+err(x),"bad");t.disabled=false;return;}
      etat(x.data&&x.data.statut==="adopte"?(/^Approuver : /.test(x.data.prestataire)?"Unanimité atteinte : "+x.data.prestataire.replace(/^Approuver : /,"")+" (c\u2019est fait).":"Unanimité atteinte : la commande à "+x.data.prestataire+" est décidée."):"Vote enregistré. Vous pouvez le changer tant que le vote est ouvert.","ok");charger();});return;}
  if(t.dataset.doc){sb.storage.from("acrb-actes").createSignedUrl(t.dataset.doc,900).then(function(r){if(r.error){etat("Document inaccessible : "+r.error.message,"bad");return;}window.open(r.data.signedUrl,"_blank","noopener");});return;}
  if(t.dataset.retirer){if(!confirm("Retirer cette offre du vote ?"))return;sb.rpc("acrb_offre_retirer",{p_offre:+t.dataset.retirer}).then(function(x){if(x.error)etat(err(x),"bad");charger();});return;}
  if(t.dataset.annuler){var m=prompt("Annuler ce vote ? Indiquez le motif :");if(m===null)return;sb.rpc("acrb_scrutin_annuler",{p_scrutin:+t.dataset.annuler,p_motif:m}).then(function(x){if(x.error)etat(err(x),"bad");charger();});return;}
  if(t.dataset.pv){imprimer(+t.dataset.pv,t);}
}

function soumettreOffre(f){
  var sid=+f.dataset.offreForm,g=function(n){return f.elements[n].value.trim();},file=f.elements.f.files[0],b=f.querySelector("button");
  if(!g("p")){etat("Indiquez le prestataire.","bad");return;}
  b.disabled=true;etat("Ajout de l’offre…");
  var up=Promise.resolve(null);
  if(file){if(file.size>15*1024*1024){etat("Fichier trop lourd (15 Mo au plus).","bad");b.disabled=false;return;}
    var ext=(file.name.split(".").pop()||"pdf").toLowerCase().replace(/[^a-z0-9]/g,"");var path="votes/"+sid+"/"+Date.now()+"-"+(g("p").toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,40)||"offre")+"."+ext;
    up=sb.storage.from("acrb-actes").upload(path,file,{contentType:file.type||"application/octet-stream"}).then(function(r){if(r.error)throw r.error;return path;});}
  up.then(function(path){return sb.rpc("acrb_offre_ajouter",{p_scrutin:sid,p_prestataire:g("p"),p_objet:g("o")||null,p_htva:num(g("h")),p_tvac:num(g("t")),p_fichier:path,p_lien:g("l")||null,p_notes:g("n")||null});})
    .then(function(x){b.disabled=false;if(x&&x.error){etat("Offre refusée : "+err(x),"bad");return;}ouvert["f"+sid]=true;etat("Offre ajoutée.","ok");charger();})
    .catch(function(e){b.disabled=false;etat("Envoi du document impossible : "+(e.message||e),"bad");});
}

function imprimer(id,btn){
  var s=(data.scrutins||[]).filter(function(x){return x.id===id;})[0];if(!s||!s.decision)return;var d=s.decision,maj=d.mode&&d.mode!=='unanimite';
  var b=[{h:"Décision du conseil d’administration"},{kv:[["Référence","V"+s.id],["Objet",s.titre+(s.objet?" — "+s.objet:"")],["Vote ouvert le",dt(s.cree_le)],["Vote clos le",dt(d.le)],["Règle",maj?"Majorité absolue des voix, voix du président prépondérante (statuts, art. 21)":"Unanimité (choix du conseil)"]]}];
  if((s.offres||[]).length){b.push({h2:"Offres examinées"});(s.offres||[]).forEach(function(o,i){b.push({li:"Offre "+(i+1)+" : "+o.prestataire+(o.montant_tvac!=null?" — "+eur(o.montant_tvac)+" TVAC":"")+(o.montant_htva!=null?" ("+eur(o.montant_htva)+" HTVA)":"")});});}
  b.push({h2:"Décision"});
  if(s.effet&&s.effet.type==="fonction")b.push({p:"Le conseil d’administration décide, "+(maj?"à la majorité":"à l’unanimité")+", que "+s.effet.nom+" exerce désormais la fonction de "+s.effet.fonction_fr+" (auparavant "+(s.effet.avant||"")+")."});
  else b.push({p:"Le conseil d’administration décide, "+(maj?"à la majorité":"à l’unanimité")+", de passer commande à "+d.prestataire+(d.objet?" ("+d.objet+")":"")+(d.montant_tvac!=null?" pour un montant de "+eur(d.montant_tvac)+" TVAC":"")+"."});
  b.push({p:adopte(d)+(d.mode==='majorite'||d.mode==='voix_preponderante'?" (statuts, art. 21)":"")+"."});
  b.push({table:{titre:"Votants",cols:["Administrateur","Fonction","Vote exprimé le"],w:[3,2,2],rows:(s.electeurs||[]).map(function(e){var x=(s.bulletins||[]).filter(function(y){return y.ca_id===e.id;})[0];return [e.nom,e.fonction||"",x?dt(x.vote_le):""];})}});
  if((s.conflits||[]).length){b.push({h2:"Conflits d’intérêts déclarés"});b.push({pi:"Charte du conseil, point 6 : ces administrateurs se sont abstenus des débats et du vote."});s.conflits.forEach(function(c){b.push({li:c.nom+" : "+c.motif+" ("+dt(c.le)+")"});});}
  if(Math.max(+d.montant_tvac||0,+d.montant_htva||0)>12500)b.push({encadre:"La dépense dépassant 12 500 €, son engagement est soumis à l’accord de l’assemblée générale aux deux tiers des voix exprimées (statuts, art. 15)."});
  b.push({pi:"Chaque vote est enregistré avec l’adresse de connexion du votant et l’heure, dans le journal de preuve de l’association."});
  b.push({f:"Décision V"+s.id+" · vote tenu sur la plateforme de gestion de l’association."});
  var z=btn&&btn.parentNode.querySelector(".vo_pdf");if(!z&&btn){z=document.createElement("div");z.className="vo_pdf";btn.insertAdjacentElement("afterend",z);}
  if(!window.DOCACRB){etat("Le module de documents n’est pas chargé.","bad");return;}
  btn.disabled=true;window.DOCACRB.pdf(b,"Décision du conseil V"+s.id,{reference:"V"+s.id}).then(function(blob){btn.disabled=false;window.DOCACRB.actions(z,blob,"Décision du conseil V"+s.id,{
    enregistrer:function(bl,f){var p="decisions/V"+s.id+"/"+f;return sb.storage.from("acrb-actes").upload(p,bl,{upsert:true,contentType:"application/pdf"}).then(function(u){if(u.error)throw u.error;return "Déposée au registre ("+f+").";});},
    lienPartage:function(){var p="decisions/V"+s.id+"/Decision-du-conseil-V"+s.id+".pdf";return sb.storage.from("acrb-actes").upload(p,blob,{upsert:true,contentType:"application/pdf"}).then(function(u){if(u.error)throw u.error;return sb.storage.from("acrb-actes").createSignedUrl(p,604800);}).then(function(u){if(u.error)throw u.error;return u.data.signedUrl;});}});})
  .catch(function(e){btn.disabled=false;etat("Document impossible : "+(e.message||e),"bad");});
}

window.VOTES={recharger:function(){return sb&&charger();},init:function(_sb,_user){sb=_sb;user=_user;
  if(!window.VOTES._lie){window.VOTES._lie=1;
    $("c_votes").addEventListener("click",clic);
    $("c_votes").addEventListener("submit",function(e){var f=e.target;if(f.id==="vo_new"){e.preventDefault();
        var ti=$("vo_titre").value.trim(),ob=$("vo_objet").value.trim(),ec=$("vo_ech").value||null,b=f.querySelector("button");
        if(!ti){etat("Donnez un titre au vote.","bad");return;}b.disabled=true;
        sb.rpc("acrb_scrutin_creer",{p_titre:ti,p_objet:ob||null,p_echeance:ec,p_regle:$("vo_regle").value}).then(function(x){b.disabled=false;if(x.error){etat("Ouverture refusée : "+err(x),"bad");return;}
          f.reset();ouvert["f"+x.data]=true;etat("Vote ouvert. Ajoutez maintenant les offres reçues.","ok");charger();});}
      else if(f.dataset.offreForm){e.preventDefault();soumettreOffre(f);}});}
    var va=$("vo_annuaire");if(va)va.addEventListener("click",function(){va.disabled=true;
      sb.rpc("acrb_scrutin_annuaire_creer",{p_echeance:null,p_regle:"majorite"}).then(function(x){va.disabled=false;if(x.error){etat("Ouverture refusée : "+err(x),"bad");return;}
        ouvert["f"+x.data]=true;etat("Vote ouvert avec les 4 présentations. Chaque administrateur peut ouvrir les aperçus puis voter ; la présentation adoptée s’affiche seule sur le site.","ok");charger();});});
  charger();}};
})();
