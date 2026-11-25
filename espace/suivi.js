/* Gestion de l'ACRB : « Écrans manquants » (décision de Karim, 25/11/2026).
   - Signalements (Commerçants) : erreurs signalées par les visiteurs de Shopping Brabant (table acrb_signalements).
   - Inscrits aux nouvelles (Quartier) : inscriptions des deux sites (table acrb_abonnes) ; aucun envoi de courriel ici.
   - Journal des modifications (Association) : table acrb_journal, en lecture seule.
   Les droits sont vérifiés deux fois : ici pour l'affichage, et dans chaque fonction de la base (security definer). */
(function(){
  var sb,roles=[],SG={etat:"nouveau",l:[],c:{}},AB={l:[],c:{},vue:"inscrit",q:""},JR={email:"",type:"",page:0,par:25,d:null};
  function $(i){return document.getElementById(i);}
  function has(l){return l.some(function(r){return roles.indexOf(r)>=0;});}
  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function dt(s){if(!s)return "";var x=new Date(s);if(isNaN(x))return "";var z=function(n){return ("0"+n).slice(-2);};return z(x.getDate())+"/"+z(x.getMonth()+1)+"/"+x.getFullYear()+" "+z(x.getHours())+"h"+z(x.getMinutes());}
  function obj(d){return d&&typeof d==="object"&&!Array.isArray(d)?d:{};}
  function arr(d){return Array.isArray(d)?d:[];}
  function csv(nom,entetes,lignes){var q=function(v){v=v==null?"":String(v);return /[";\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
    var txt="﻿"+[entetes].concat(lignes).map(function(l){return l.map(q).join(";");}).join("\r\n");
    var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([txt],{type:"text/csv;charset=utf-8"}));a.download=nom;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);}
  function aujourdhui(){return new Date().toISOString().slice(0,10);}
  function badge(id,n){if(window.ESPNAV&&ESPNAV.badge)ESPNAV.badge(id,n);}
  /* confirmation visible juste à côté du geste (règle de la porte : pas de bouton muet) */
  function note(row,txt,bad){if(!row)return;var e=document.createElement("div");e.className="soon";e.setAttribute("role","status");e.style.cssText="grid-column:1/-1;margin:0;font-weight:600;color:"+(bad?"var(--brick)":"var(--green)");e.textContent=txt;row.appendChild(e);}
  var CSS='.su_f{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}.su_f button{font:700 13px "Libre Franklin",Arial,sans-serif;padding:8px 11px;border:1px solid #c6ccd6;background:#fff;color:#222;cursor:pointer}.su_f button.on{background:var(--navy);border-color:var(--navy);color:#fff}'+
    '.su_k{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:4px 0 12px}.su_t{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 10px}.su_t select,.su_t input{padding:9px 10px;border:1px solid #c6ccd6;font:15px "Source Sans 3",sans-serif;background:#fff;min-height:42px;min-width:0;max-width:100%}.su_t input{flex:1 1 220px}.su_t .btn{margin-top:0;padding:9px 14px}'+
    '.carow .su_c{display:block;font-size:14.5px;color:#3b4150;margin-top:3px;overflow-wrap:anywhere}.carow .id span{overflow-wrap:anywhere}.carow .acts a{font:700 13px "Libre Franklin",Arial,sans-serif;padding:8px 11px;border:1px solid var(--navy);background:#fff;color:var(--navy);text-decoration:none;line-height:1}'+
    '.su_det summary{cursor:pointer;font-size:13px;color:var(--navy);margin-top:4px}.su_det pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12.5px/1.45 ui-monospace,Menlo,Consolas,monospace;background:#f6f7fa;border:1px solid var(--line);padding:8px;margin:6px 0 0;max-height:300px;overflow:auto}'+
    '.su_pg{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px}.su_pg .btn{margin-top:0;padding:8px 12px}.su_pg .btn:disabled{opacity:.45;cursor:default}'+
    '.carow .edit.su_e{grid-template-columns:1fr auto auto}@media(max-width:700px){.carow .edit.su_e{grid-template-columns:1fr!important}.su_t>*{flex:1 1 100%}}';

  /* ---------- 1. Signalements ---------- */
  var SG_ET={nouveau:["À traiter","warn"],corrige:["Corrigé","ok"],sans_suite:["Sans suite",""]};
  function sgCharger(){sb.rpc("acrb_signalements_liste",{p_etat:null}).then(function(x){var b=$("sg_box");if(!b)return;if(x.error){b.innerHTML='<p class="soon">Liste indisponible : '+esc(x.error.message)+'</p>';return;}
    var d=obj(x.data);SG.l=arr(d.lignes);SG.c=obj(d.compte);sgDessiner();});}
  function sgDessiner(apres){var b=$("sg_box");if(!b)return;var c=SG.c,n=+c.nouveau||0;badge("c_sig",n);
    var F=[["nouveau","À traiter",n,"Les signalements qui attendent une décision."],["corrige","Corrigés",+c.corrige||0,"Les signalements dont la fiche a été corrigée."],["sans_suite","Sans suite",+c.sans_suite||0,"Les signalements classés sans suite, avec leur motif."],["","Tous",+c.total||SG.l.length,"Tous les signalements, traités ou non."]];
    var l=SG.l.filter(function(s){return !SG.etat||s.etat===SG.etat;});
    var h='<div class="su_f" role="group" aria-label="Filtrer par état">'+F.map(function(f){return '<button type="button" data-sgf="'+f[0]+'"'+(SG.etat===f[0]?' class="on" aria-pressed="true"':' aria-pressed="false"')+' data-aide="'+esc(f[3])+'">'+esc(f[1])+' ('+f[2]+')</button>';}).join("")+'</div>';
    if(!SG.l.length)h+='<p class="soon">Aucun signalement pour l’instant. Ils arrivent ici dès qu’un visiteur de Shopping Brabant touche « Signaler une erreur » sur une fiche (horaire faux, commerce fermé, mauvaise adresse…).</p>';
    else if(!l.length)h+='<p class="soon">'+(SG.etat==="nouveau"?"Rien à traiter : tous les signalements ont reçu une réponse. Les autres onglets gardent l’historique.":"Aucun signalement dans cet état.")+'</p>';
    h+='<div class="calist" id="sg_list">'+l.map(function(s){var e=SG_ET[s.etat]||[s.etat,""],ouvert=s.etat==="nouveau";
      return '<div class="carow" data-sg="'+esc(s.id)+'"><div class="id"><b>'+esc(s.enseigne||"Commerce sans nom")+'<span class="st '+e[1]+'">'+esc(e[0])+'</span></b>'+
        '<span>'+esc(s.motif||"")+' · signalé le '+dt(s.cree_le)+(s.ue?' · UE '+esc(s.ue):'')+(s.bce?' · BCE '+esc(s.bce):'')+'</span>'+
        (s.commentaire?'<span class="su_c">« '+esc(s.commentaire)+' »</span>':'')+
        (s.contact?'<span class="su_c">Contact laissé par le visiteur : '+esc(s.contact)+'</span>':'')+
        (!ouvert?'<span class="su_c">'+(s.etat==="corrige"?"Corrigé":"Classé sans suite")+(s.traite_par?' par '+esc(s.traite_par):'')+(s.traite_le?' le '+dt(s.traite_le):'')+(s.motif_traitement?' — motif : '+esc(s.motif_traitement):'')+'</span>':'')+
        '</div><div class="acts">'+
        (s.ue?'<a href="../shopping/#c-'+encodeURIComponent(s.ue)+'" target="_blank" rel="noopener" data-aide="Ouvre la fiche publique de ce commerce sur Shopping Brabant, dans un nouvel onglet, pour voir l’erreur.">Voir la fiche</a>':'')+
        '<button type="button" data-sga="fiche" data-aide="Va à la rubrique « Fiches » avec ce commerce déjà recherché, pour corriger son nom, son adresse ou son numéro.">Corriger la fiche</button>'+
        (ouvert?'<button type="button" class="p" data-sga="corrige" data-aide="À toucher une fois la fiche corrigée : le signalement passe dans « Corrigés », à votre nom et à l’heure.">Corrigé</button><button type="button" class="d" data-sga="sans" data-aide="Le signalement ne demande aucun changement : indiquez pourquoi (ex. la fiche est juste). Le motif est gardé.">Sans suite</button>'
          :'<button type="button" class="d" data-sga="rouvrir" data-aide="Remet ce signalement dans « À traiter » (par exemple si la correction n’était pas la bonne).">Rouvrir</button>')+
        '</div></div>';}).join("")+'</div>';
    b.innerHTML=h;
    b.querySelectorAll("[data-sgf]").forEach(function(k){k.onclick=function(){SG.etat=k.getAttribute("data-sgf");sgDessiner();};});
    b.querySelectorAll("[data-sga]").forEach(function(k){k.onclick=function(){var row=k.closest(".carow"),id=row.getAttribute("data-sg"),s=SG.l.filter(function(z){return String(z.id)===id;})[0]||{},a=k.getAttribute("data-sga");
      if(a==="fiche")return versFiche(s);
      if(a==="sans")return sgMotif(row,id);
      sgTraiter(row,id,a==="corrige"?"corrige":"nouveau",null,k);};});
    if(apres){var r=b.querySelector('[data-sg="'+apres[0]+'"]');if(r)note(r,apres[1],apres[2]);else{var m=document.createElement("p");m.className="soon";m.setAttribute("role","status");m.style.cssText="font-weight:600;color:var(--green)";m.textContent=apres[1];b.insertBefore(m,b.querySelector(".calist"));}}}
  function sgMotif(row,id){if(row.querySelector(".edit"))return;row.insertAdjacentHTML("beforeend",'<form class="edit su_e"><input name="m" required placeholder="Motif, ex. : la fiche est juste, commerce vérifié sur place" data-aide="Pourquoi ce signalement ne demande aucun changement. Il est gardé avec le signalement et au journal."><button type="button" class="d" data-x data-aide="Referme sans rien changer.">Annuler</button><button type="submit" class="p" data-aide="Classe le signalement « Sans suite » avec ce motif, à votre nom.">Classer sans suite</button></form>');
    var f=row.querySelector(".edit");f.m.focus();f.querySelector("[data-x]").onclick=function(){f.remove();};
    f.onsubmit=function(e){e.preventDefault();var m=f.m.value.trim();if(!m){f.m.focus();return;}sgTraiter(row,id,"sans_suite",m,f.querySelector("[type=submit]"));};}
  function sgTraiter(row,id,etat,motif,btn){if(btn)btn.disabled=true;
    sb.rpc("acrb_signalement_traiter",{p_id:id,p_etat:etat,p_motif:motif}).then(function(x){if(x.error){if(btn)btn.disabled=false;note(row,"Non enregistré : "+x.error.message,true);return;}
      var d=obj(x.data);if(d.lignes){SG.l=arr(d.lignes);SG.c=obj(d.compte);}else{SG.l.forEach(function(s){if(String(s.id)===id){s.etat=etat;s.motif_traitement=motif;s.traite_le=etat==="nouveau"?null:new Date().toISOString();}});}
      sgDessiner([id,etat==="corrige"?"✓ Enregistré : marqué « Corrigé ».":etat==="sans_suite"?"✓ Enregistré : classé « Sans suite ».":"✓ Remis dans « À traiter »."]);});}
  function versFiche(s){location.hash="#/commercants/fiches";setTimeout(function(){var q=$("fq"),f=$("fichesq");if(!q||!f)return;q.value=s.enseigne||s.bce||"";if(f.requestSubmit)f.requestSubmit();else f.dispatchEvent(new Event("submit",{cancelable:true}));q.focus();},120);}

  /* ---------- 2. Inscrits aux nouvelles ---------- */
  var SRC={acrb:"Site de l’association",shopping:"Shopping Brabant"},PROF={client:"Client / visiteur",partenaire:"Partenaire",commercant:"Commerçant",riverain:"Riverain",presse:"Presse"};
  function abEtat(a){return a.efface_le?"efface":a.desabonne_le?"desinscrit":"inscrit";}
  function abCharger(q){sb.rpc("acrb_abonnes_liste",{p_q:q||null}).then(function(x){var b=$("ab_list");if(x.error){if(b)b.innerHTML='<p class="soon">Liste indisponible : '+esc(x.error.message)+'</p>';return;}
    var d=obj(x.data);AB.l=arr(d.lignes);AB.c=obj(d.compte);abDessiner();});}
  function abVus(){return AB.l.filter(function(a){return AB.vue==="tous"||abEtat(a)===AB.vue||(AB.vue==="desinscrit"&&abEtat(a)==="efface");});}
  function abDessiner(apres){var k=$("ab_k"),b=$("ab_list");if(!b)return;var c=AB.c;
    k.innerHTML='<div class="kpi"><b>'+(+c.inscrits||0)+'</b><span>inscrits aujourd’hui</span></div><div class="kpi"><b>'+(+c.desinscrits||0)+'</b><span>désinscrits</span></div><div class="kpi"><b>'+(+c.effaces||0)+'</b><span>données effacées</span></div>';
    var l=abVus();
    if(!AB.l.length)b.innerHTML='<p class="soon">'+(AB.q?'Personne ne correspond à « '+esc(AB.q)+' ».':'Aucune inscription pour l’instant. Elles arrivent ici depuis le formulaire « Recevoir les nouvelles » du site de l’association et de Shopping Brabant.')+'</p>';
    else if(!l.length)b.innerHTML='<p class="soon">'+(AB.vue==="inscrit"?"Aucune personne inscrite en ce moment ; choisissez « Tous » pour voir les désinscrits.":"Aucune personne dans cette liste.")+'</p>';
    else b.innerHTML=l.map(function(a){var e=abEtat(a);
      return '<div class="carow" data-ab="'+esc(a.id)+'"><div class="id"><b>'+(e==="efface"?"Données effacées":esc(a.email))+(e==="inscrit"?'<span class="st ok">Inscrit</span>':e==="desinscrit"?'<span class="st">Désinscrit</span>':'<span class="st out">Effacé</span>')+'</b>'+
        '<span>'+[a.nom?esc(a.nom):"",esc(PROF[a.profil]||a.profil||""),a.organisation?esc(a.organisation):"",esc(SRC[a.source]||a.source||"source inconnue"),a.langue?esc(String(a.langue).toUpperCase()):"","inscrit le "+dt(a.cree_le)].filter(Boolean).join(" · ")+'</span>'+
        (e!=="inscrit"?'<span class="su_c">'+(e==="efface"?"Données effacées le "+dt(a.efface_le):"Désinscrit le "+dt(a.desabonne_le))+(a.desabonne_par?' par '+esc(a.desabonne_par):'')+'</span>':'')+
        '</div><div class="acts">'+(e==="inscrit"?'<button type="button" data-aba="des" data-aide="Retire cette personne de la liste des nouvelles. Son inscription reste dans l’historique, datée et à votre nom.">Désinscrire</button>':'')+
        (e!=="efface"?'<button type="button" class="d" data-aba="eff" data-aide="Droit à l’effacement : si la personne le demande, son adresse et son nom sont remplacés par une empreinte. Ce geste ne se défait pas et il est tracé.">Effacer ses données</button>':'')+'</div></div>';}).join("");
    var cpt=$("ab_n");if(cpt)cpt.textContent=l.length+" personne"+(l.length>1?"s":"")+" affichée"+(l.length>1?"s":"")+(AB.q?" pour « "+AB.q+" »":"")+".";
    b.querySelectorAll("[data-aba]").forEach(function(k){k.onclick=function(){var row=k.closest(".carow");abConfirmer(row,row.getAttribute("data-ab"),k.getAttribute("data-aba")==="eff");};});
    if(apres){var r=b.querySelector('[data-ab="'+apres[0]+'"]');if(r)note(r,apres[1]);}}
  function abConfirmer(row,id,eff){var o=row.querySelector(".edit");if(o)o.remove();
    row.insertAdjacentHTML("beforeend",'<div class="edit su_e"><span class="soon" style="margin:0;align-self:center">'+(eff?"Effacer définitivement l’adresse et le nom ? À faire seulement si la personne l’a demandé.":"Désinscrire cette personne des nouvelles ?")+'</span><button type="button" class="d" data-x data-aide="Referme sans rien changer.">Annuler</button><button type="button" class="p" data-ok data-aide="'+(eff?"Efface l’adresse et le nom de cette personne (empreinte gardée pour la preuve).":"Confirme la désinscription, à votre nom et à l’heure.")+'">'+(eff?"Oui, effacer":"Oui, désinscrire")+'</button></div>');
    var f=row.querySelector(".edit");f.querySelector("[data-x]").onclick=function(){f.remove();};
    f.querySelector("[data-ok]").onclick=function(){var btn=this;btn.disabled=true;sb.rpc("acrb_abonne_desinscrire",{p_id:id,p_effacer:!!eff}).then(function(x){if(x.error){btn.disabled=false;note(row,"Non enregistré : "+x.error.message,true);return;}
      var d=obj(x.data);if(d.compte)AB.c=obj(d.compte);if(AB.q){abCharger(AB.q);return;}AB.l=d.lignes?arr(d.lignes):AB.l;if(AB.vue==="inscrit")AB.vue="tous";$("ab_vue").value=AB.vue;abDessiner([id,eff?"✓ Données effacées (tracé au journal).":"✓ Désinscrit (tracé au journal)."]);});};}
  function abExporter(){var l=abVus().filter(function(a){return !a.efface_le;});if(!l.length){$("ab_n").textContent="Rien à exporter dans cette liste.";return;}
    csv("acrb-inscrits-nouvelles-"+aujourdhui()+".csv",["adresse","nom","profil","organisation","langue","source","inscrit_le","etat","desinscrit_le"],
      l.map(function(a){return [a.email,a.nom,PROF[a.profil]||a.profil,a.organisation,a.langue,SRC[a.source]||a.source,dt(a.cree_le),abEtat(a)==="inscrit"?"inscrit":"désinscrit",dt(a.desabonne_le)];}));
    $("ab_n").textContent="✓ Fichier prêt : "+l.length+" ligne"+(l.length>1?"s":"")+" exportée"+(l.length>1?"s":"")+".";}

  /* ---------- 3. Journal des modifications ---------- */
  var TYP={acte_nomination:"Nomination (acte)",quartier_veille:"Veille du Quartier Nord",quartier_publier:"Publication Quartier Nord",rectification_societe:"Rectification d’une fiche",association_bce_auto:"Rattachement automatique à la BCE",
    "demande-adhesion":"Demande d’adhésion",vote_ouvert:"Vote ouvert",avis_commercant:"Avis d’un commerçant",signalement_traite:"Signalement traité",abonne_desinscrit:"Désinscription des nouvelles",abonne_efface:"Effacement de données (RGPD)"};
  function tlib(t){return TYP[t]||String(t||"").replace(/[_-]/g," ").replace(/^./,function(c){return c.toUpperCase();});}
  function resumeSnap(s){if(!s||typeof s!=="object")return String(s==null?"":s);var k=Object.keys(s),out=[];
    for(var i=0;i<k.length&&out.length<4;i++){var v=s[k[i]];if(v==null||v==="")continue;if(typeof v==="object")v=Array.isArray(v)?v.length+" élément"+(v.length>1?"s":""):"…";v=String(v);out.push(k[i].replace(/_/g," ")+" : "+(v.length>60?v.slice(0,57)+"…":v));}
    return out.join(" · ");}
  function jrCharger(){var b=$("jr_list");sb.rpc("acrb_journal_liste",{p_email:JR.email==="-"?"":(JR.email||null),p_type:JR.type||null,p_limite:JR.par,p_decalage:JR.page*JR.par}).then(function(x){if(!b)return;if(x.error){b.innerHTML='<p class="soon">Journal indisponible : '+esc(x.error.message)+'</p>';return;}JR.d=obj(x.data);jrDessiner();});}
  function jrFiltres(){var d=JR.d||{},pe=$("jr_pers"),ty=$("jr_type");
    pe.innerHTML='<option value="">Toutes les personnes</option>'+arr(d.personnes).map(function(p){return '<option value="'+esc(p.email||"-")+'"'+((p.email||"-")===JR.email?" selected":"")+'>'+esc(p.email||"(système, sans personne)")+' ('+(+p.n||0)+')</option>';}).join("");
    ty.innerHTML='<option value="">Tous les types</option>'+arr(d.types).map(function(t){return '<option value="'+esc(t.type)+'"'+(t.type===JR.type?" selected":"")+'>'+esc(tlib(t.type))+' ('+(+t.n||0)+')</option>';}).join("");}
  function jrDessiner(){var d=JR.d||{},b=$("jr_list"),l=arr(d.lignes),tot=+d.total||0,de=JR.page*JR.par;jrFiltres();
    if(!l.length){b.innerHTML='<p class="soon">'+(JR.email||JR.type?"Aucune ligne pour ce filtre. Choisissez « Toutes les personnes » et « Tous les types » pour tout revoir.":"Le journal est vide pour l’instant. Chaque geste important (nomination, vote, rectification, publication, signalement traité, désinscription…) s’y inscrit tout seul.")+'</p>';$("jr_pg").innerHTML="";return;}
    b.innerHTML=l.map(function(j){return '<div class="carow" style="grid-template-columns:1fr"><div class="id"><b>'+esc(tlib(j.type))+'</b><span>'+dt(j.quand)+' · '+(j.email?esc(j.email):"système")+'</span><span class="su_c">'+esc(resumeSnap(j.snapshot))+'</span>'+
      '<details class="su_det"><summary data-aide="Montre tout ce qui a été enregistré pour ce geste, et son empreinte (preuve que la ligne n’a pas été modifiée).">Détail</summary><pre>'+esc(JSON.stringify(j.snapshot,null,2))+'\n\nEmpreinte : '+esc(j.empreinte||"")+'</pre></details></div></div>';}).join("");
    $("jr_pg").innerHTML='<button type="button" class="btn o" id="jr_prev"'+(JR.page?'':' disabled')+' data-aide="Montre les lignes plus récentes.">← Plus récents</button><span class="soon" style="margin:0">Lignes '+(de+1)+' à '+(de+l.length)+' sur '+tot+'</span><button type="button" class="btn o" id="jr_next"'+(de+l.length<tot?'':' disabled')+' data-aide="Montre les lignes plus anciennes.">Plus anciens →</button>';
    $("jr_prev").onclick=function(){if(JR.page){JR.page--;jrCharger();}};$("jr_next").onclick=function(){JR.page++;jrCharger();};}
  function jrExporter(btn){btn.disabled=true;var m=$("jr_msg");sb.rpc("acrb_journal_liste",{p_email:JR.email==="-"?"":(JR.email||null),p_type:JR.type||null,p_limite:5000,p_decalage:0}).then(function(x){btn.disabled=false;
    if(x.error){m.textContent="Export impossible : "+x.error.message;return;}var l=arr(obj(x.data).lignes);if(!l.length){m.textContent="Rien à exporter pour ce filtre.";return;}
    csv("acrb-journal-"+aujourdhui()+".csv",["quand","type","qui","resume","detail","empreinte"],l.map(function(j){return [dt(j.quand),tlib(j.type),j.email||"système",resumeSnap(j.snapshot),JSON.stringify(j.snapshot),j.empreinte];}));
    m.textContent="✓ Fichier prêt : "+l.length+" ligne"+(l.length>1?"s":"")+" exportée"+(l.length>1?"s":"")+".";});}

  window.SUIVI={init:function(client,rs){sb=client;roles=rs||[];
    if(!$("su_css")){var st=document.createElement("style");st.id="su_css";st.textContent=CSS;document.head.appendChild(st);}
    var gestion=has(["fondateur","admin","ca"]);
    if(gestion&&$("c_sig")){$("c_sig").hidden=false;sgCharger();}
    if(gestion&&$("c_abo")){$("c_abo").hidden=false;
      $("ab_box").innerHTML='<div class="su_k" id="ab_k"></div><form class="su_t" id="ab_q"><input type="search" id="ab_qi" placeholder="Rechercher une adresse, un nom, une organisation" data-aide="Tapez une partie de l’adresse e-mail, du nom ou de l’organisation, puis « Rechercher »."><button class="btn" type="submit" data-aide="Cherche parmi toutes les inscriptions, désinscrits compris.">Rechercher</button>'+
        '<select id="ab_vue" data-aide="Choisissez qui afficher : les personnes inscrites aujourd’hui, les désinscrites, ou tout le monde."><option value="inscrit">Inscrits</option><option value="desinscrit">Désinscrits et effacés</option><option value="tous">Tous</option></select>'+
        '<button class="btn o" type="button" id="ab_csv" data-aide="Télécharge la liste affichée dans un fichier ouvrable avec Excel. Les données effacées n’y figurent jamais. Aucun courriel ne part d’ici.">Exporter (CSV)</button></form><div class="soon" id="ab_n" role="status"></div><div class="calist" id="ab_list"><p class="soon">Chargement…</p></div>';
      $("ab_q").onsubmit=function(e){e.preventDefault();AB.q=$("ab_qi").value.trim();abCharger(AB.q);};
      $("ab_vue").onchange=function(){AB.vue=this.value;abDessiner();};$("ab_csv").onclick=abExporter;abCharger(null);}
    if(has(["fondateur","admin","ca","tresorier"])&&$("c_jrn")){$("c_jrn").hidden=false;
      $("jr_box").innerHTML='<div class="su_t"><select id="jr_pers" data-aide="Ne montrer que les gestes d’une personne."><option value="">Toutes les personnes</option></select><select id="jr_type" data-aide="Ne montrer qu’un type de geste (vote, nomination, rectification…)."><option value="">Tous les types</option></select>'+
        '<button class="btn o" type="button" id="jr_csv" data-aide="Télécharge les lignes du filtre choisi (toutes les pages) dans un fichier ouvrable avec Excel.">Exporter (CSV)</button></div><div class="soon" id="jr_msg" role="status"></div><div class="calist" id="jr_list"><p class="soon">Chargement…</p></div><div class="su_pg" id="jr_pg"></div>';
      $("jr_pers").onchange=function(){JR.email=this.value;JR.page=0;jrCharger();};$("jr_type").onchange=function(){JR.type=this.value;JR.page=0;jrCharger();};
      $("jr_csv").onclick=function(){jrExporter(this);};jrCharger();}
  }};
})();
