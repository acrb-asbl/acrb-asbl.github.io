/* Enregistrement des réunions, compte rendu et plan d'action (demande de Karim du 26/11/2026, acrb_modifs n° 44).
   Dans chaque réunion ouverte (Conseil › Réunions et PV), une section « 5. Enregistrement et compte rendu » :
   - « Enregistrer la réunion » : le micro de l'appareil, déposé par morceaux de 30 s (rien n'est perdu si l'appareil s'éteint) ;
   - « Déposer le fichier du dictaphone » : le fichier audio du téléphone, après la réunion ;
   puis le serveur de l'association transcrit (gratuit), l'IA rédige la note détaillée et le plan d'action,
   et la note sort en PDF aux couleurs de l'association.
   Rubrique « Plan d'action » (Conseil) : toutes les actions de toutes les réunions, avec leur état, leur responsable et leur échéance.
   Expose window.ENREG = { init(sb, user, roles) }. */
(function(){
var sb,user,ecrit=false,lances=false,cache={},poll=null,REC=null,ACT=[],filtre={etat:"ouvertes",q:""};
var ETATS={en_cours:["Enregistrement en cours","w"],depose:["Déposé : en attente du serveur","w"],transcription:["Transcription en cours","w"],transcrit:["Transcrit : rédaction de la note","w"],redaction:["Rédaction de la note en cours","w"],pret:["Compte rendu prêt","ok"],erreur:["Erreur","bad"]};
var AET={a_faire:"À faire",en_cours:"En cours",fait:"Fait",abandonne:"Abandonné"};
function $(i){return document.getElementById(i);}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function dc(s){if(!s)return "";var p=String(s).slice(0,10).split("-");return p[2]+"/"+p[1]+"/"+p[0];}
function auj(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function duree(s){s=Math.max(0,Math.round(s||0));var h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+" h ":"")+String(m).padStart(h?2:1,"0")+" min "+String(x).padStart(2,"0")+" s";}
function mo(o){return o>=1048576?(o/1048576).toFixed(1).replace(".",",")+" Mo":Math.round(o/1024)+" ko";}
function err(e){return (e&&(e.message||e.error_description||e.error))||String(e);}

/* ---------------- styles ---------------- */
function styles(){if($("ra_css"))return;var st=document.createElement("style");st.id="ra_css";st.textContent=
'.ra_bt{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 8px}.ra_rec{background:#af4057!important;border-color:#af4057!important;color:#fff!important}'+
'.ra_live{display:flex;flex-wrap:wrap;align-items:center;gap:10px;border:1px solid #af4057;background:#fdf3f5;padding:10px 12px;margin:0 0 10px}.ra_dot{width:12px;height:12px;border-radius:50%;background:#af4057;animation:ra_p 1.2s infinite}@keyframes ra_p{50%{opacity:.25}}'+
'.ra_live b{font:800 16px "Libre Franklin",Arial,sans-serif}.ra_live span{font-size:13px;color:#5f6675}'+
'.ra_it{border:1px solid var(--line,#dfe3ea);padding:10px 12px;margin:8px 0;background:#fff}.ra_it .hd{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}'+
'.ra_st{display:inline-block;font:700 12px "Source Sans 3",Arial,sans-serif;padding:2px 8px;border-radius:10px;background:#eef1f5;color:#3b4350}.ra_st.w{background:#fff4d6;color:#7a5200}.ra_st.ok{background:#e3f4e8;color:#1d6b35}.ra_st.bad{background:#fde7ea;color:#9b1c31}'+
'.ra_note h5{font:800 13px "Libre Franklin",Arial,sans-serif;text-transform:uppercase;letter-spacing:.04em;color:#5f6675;margin:12px 0 4px}.ra_note p,.ra_note li{font-size:14.5px;line-height:1.5;margin:3px 0}'+
'.ra_tb{width:100%;border-collapse:collapse;font-size:14px}.ra_tb th,.ra_tb td{border-bottom:1px solid #e6e8ee;padding:6px 6px;text-align:left;vertical-align:top}.ra_tb th{font:700 12px "Source Sans 3",Arial,sans-serif;color:#5f6675;text-transform:uppercase}'+
'.ra_tb td.r{color:#9b1c31;font-weight:700}.ra_tb select,.ra_tb input{font:14px "Source Sans 3",Arial,sans-serif;padding:4px 6px;border:1px solid #c6ccd6;max-width:100%}'+
'.ra_k{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:0 0 12px}.ra_k div{border:1px solid var(--line,#dfe3ea);background:#fff;padding:8px 10px}.ra_k b{display:block;font:800 22px "Libre Franklin",Arial,sans-serif}.ra_k span{font-size:12.5px;color:#5f6675}.ra_k .r b{color:#9b1c31}'+
'.ra_f{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}.ra_f select,.ra_f input{font:14px "Source Sans 3",Arial,sans-serif;padding:7px 9px;border:1px solid #c6ccd6;min-width:0}.ra_f input{flex:1 1 200px}'+
'.ra_new{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr) 150px auto;gap:8px;margin:8px 0}.ra_new input{font:14px "Source Sans 3",Arial,sans-serif;padding:7px 9px;border:1px solid #c6ccd6;min-width:0}'+
'@media(max-width:720px){.ra_new{grid-template-columns:1fr}.ra_tb thead{display:none}.ra_tb tr{display:block;border-bottom:1px solid #e6e8ee;padding:6px 0}.ra_tb td{display:block;border:0;padding:2px 0}}';
document.head.appendChild(st);}

/* ---------------- section dans la réunion ouverte ---------------- */
function ouverte(){var b=document.querySelector("#ru_list .ru .ru_sec");if(!b)return null;var ru=b.closest(".ru");return ru?{id:+ru.dataset.id,el:ru}:null;}
function placer(){var o=ouverte();if(!o)return;if(o.el.querySelector(".ra_sec[data-r='"+o.id+"']"))return;
  var secs=o.el.querySelectorAll(".ru_sec"),der=secs[secs.length-1];if(!der)return;
  var d=document.createElement("div");d.className="ru_sec ra_sec";d.dataset.r=o.id;
  d.innerHTML='<h4><i>5</i>Enregistrement et compte rendu</h4><div class="ru_in" id="ra_in_'+o.id+'"><p class="soon">Chargement…</p></div>';
  der.after(d);if(cache[o.id])dessiner(o.id);charger(o.id);}
function charger(rid){return sb.rpc("acrb_audio_liste",{p_reunion:rid}).then(function(x){if(x.error)throw x.error;cache[rid]=x.data||[];dessiner(rid);relancerPoll();})
  .catch(function(e){var z=$("ra_in_"+rid);if(z)z.innerHTML='<p class="ru_msg bad">Lecture impossible : '+esc(err(e))+'</p>';});}
function relancerPoll(){var o=ouverte(),L=o&&cache[o.id]||[],enCours=L.some(function(a){return ["depose","transcription","transcrit","redaction"].indexOf(a.etat)>=0;});
  clearTimeout(poll);if(enCours&&o)poll=setTimeout(function(){var p=ouverte();if(p)charger(p.id);},20000);}
function dessiner(rid){var z=$("ra_in_"+rid);if(!z)return;var L=cache[rid]||[],h="";
  if(REC&&REC.rid===rid)h+=live();
  else if(ecrit){h+='<div class="ra_bt"><button type="button" class="btn ra_rec" data-ra="rec" data-aide="Enregistre la réunion avec le micro de cet appareil. Posez-le au milieu de la table et laissez l’écran allumé ; l’enregistrement part par morceaux de 30 secondes, rien n’est perdu si l’appareil s’éteint.">● Enregistrer la réunion</button>'+
    '<label class="btn o" style="cursor:pointer;margin:0" data-aide="Après la réunion : choisissez le fichier du dictaphone de votre téléphone (m4a, mp3, wav, ogg ; 50 Mo au plus, environ 1 h 30 en m4a).">Déposer le fichier du dictaphone<input type="file" accept="audio/*,.m4a,.mp3,.wav,.ogg,.webm,.aac,.amr,.3gp" data-ra="fic" hidden></label></div>'+
    '<p class="soon" style="margin:0 0 6px">Au début, annoncez aux participants que la réunion est enregistrée pour en faire le compte rendu. L’enregistrement reste privé : seuls le conseil et le secrétariat y ont accès.</p>';}
  if(!L.length)h+='<p class="soon">Aucun enregistrement pour cette réunion.</p>';
  L.forEach(function(a){var E=ETATS[a.etat]||[a.etat,""];h+='<div class="ra_it"><div class="hd"><div><b>'+(a.source==="direct"?"Enregistrement sur la plateforme":"Fichier du dictaphone")+'</b> <span class="soon" style="margin:0">'+esc(new Date(a.cree_le).toLocaleString("fr-BE",{dateStyle:"short",timeStyle:"short"}))+(a.duree_s?' · '+duree(a.duree_s):'')+(a.octets?' · '+mo(a.octets):'')+'</span></div><span class="ra_st '+E[1]+'">'+esc(E[0])+'</span></div>'+
    (a.message?'<p class="ru_msg bad" style="margin:6px 0 0">'+esc(a.message)+'</p>':'')+
    (a.etat==="erreur"&&ecrit?'<div class="ra_bt" style="margin-top:6px"><button type="button" class="btn o" data-ra="rel" data-id="'+a.id+'" data-q="transcription">Relancer la transcription</button></div>':'')+
    (["depose","transcription"].indexOf(a.etat)>=0?'<p class="soon" style="margin:6px 0 0">Le serveur de l’association transcrit l’enregistrement (environ un tiers de sa durée). Cette page se met à jour seule.</p>':'')+
    (a.etat==="pret"&&a.redaction?note(a,rid):'')+
    (a.transcription?'<details style="margin-top:6px"><summary>Transcription complète</summary><pre style="white-space:pre-wrap;font:13px/1.45 \'Source Sans 3\',Arial,sans-serif;max-height:360px;overflow:auto;margin:6px 0 0">'+esc(a.transcription)+'</pre></details>':'')+
    (a.etat==="pret"&&ecrit?'<div class="ra_bt" style="margin-top:6px"><button type="button" class="btn" data-ra="pdf" data-id="'+a.id+'">Note de réunion en PDF</button><button type="button" class="btn o" data-ra="rel" data-id="'+a.id+'" data-q="redaction" data-aide="Fait rédiger à nouveau la note et le plan d’action à partir de la même transcription. Le plan d’action de cet enregistrement est remplacé.">Rédiger à nouveau</button><a class="btn o" href="#/conseil/plan-action">Suivre le plan d’action</a></div><div data-ra-z="'+a.id+'"></div>':'')+
    '</div>';});
  z.innerHTML=h;}
function note(a,rid){var R=a.redaction||{},h='<div class="ra_note">';
  if(R.resume)h+='<h5>En bref</h5><p>'+esc(R.resume)+'</p>';
  if((R.participants||[]).length)h+='<h5>Participants</h5><p>'+esc(R.participants.join(", "))+'</p>';
  if((R.deroulement||[]).length)h+='<h5>Déroulement</h5>'+R.deroulement.map(function(x){return '<p><b>'+esc(x.titre||"")+'.</b> '+esc(x.texte||"")+'</p>';}).join("");
  if((R.decisions||[]).length)h+='<h5>Décisions et accords</h5><ul>'+R.decisions.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ul>';
  if(R.issue)h+='<h5>Issue de la réunion</h5><p>'+esc(R.issue)+'</p>';
  if(R.prochaine_etape)h+='<h5>Prochaine étape</h5><p>'+esc(R.prochaine_etape)+'</p>';
  var A=(R.actions||[]);if(A.length)h+='<h5>Plan d’action ('+A.length+')</h5><table class="ra_tb"><thead><tr><th>Action</th><th>Responsable</th><th>Échéance</th></tr></thead><tbody>'+A.map(function(x){return '<tr><td><b>'+esc(x.titre)+'</b>'+(x.detail?'<br><span class="soon" style="margin:0">'+esc(x.detail)+'</span>':'')+'</td><td>'+esc(x.responsable||"à désigner")+'</td><td>'+(x.echeance?esc(dc(x.echeance)):'—')+'</td></tr>';}).join("")+'</tbody></table>';
  return h+'<p class="soon" style="margin:8px 0 0">Rédigé automatiquement à partir de l’enregistrement : relisez-le avant de le diffuser. Les noms suivis de « (à vérifier) » ont pu être mal compris.</p></div>';}

/* ---------------- enregistrement direct ---------------- */
function live(){var t=(Date.now()-REC.t0)/1000;return '<div class="ra_live"><span class="ra_dot"></span><b id="ra_t">'+duree(t)+'</b><span id="ra_s">'+REC.n+' morceau'+(REC.n>1?'x':'')+' déposé'+(REC.n>1?'s':'')+(REC.attente?', '+REC.attente+' en cours d’envoi':'')+(REC.wake?' · écran maintenu allumé':' · gardez l’écran allumé')+'</span><button type="button" class="btn" data-ra="stop" style="margin-left:auto">■ Arrêter et faire le compte rendu</button></div>';}
function typeAudio(){var T=["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/ogg;codecs=opus"];for(var i=0;i<T.length;i++){if(window.MediaRecorder&&MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(T[i]))return T[i];}return "";}
function ext(t){return /mp4/.test(t)?"m4a":/ogg/.test(t)?"ogg":"webm";}
function demarrer(rid){if(REC)return;if(!navigator.mediaDevices||!window.MediaRecorder){alerte(rid,"Cet appareil ne permet pas d’enregistrer depuis le navigateur : utilisez le dictaphone du téléphone, puis « Déposer le fichier du dictaphone ».");return;}
  var mime=typeAudio();
  navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:true,autoGainControl:true}}).then(function(flux){
    return sb.rpc("acrb_audio_ouvrir",{p_reunion:rid,p_source:"direct"}).then(function(x){if(x.error){flux.getTracks().forEach(function(t){t.stop();});throw x.error;}
      var mr=new MediaRecorder(flux,mime?{mimeType:mime,audioBitsPerSecond:48000}:{audioBitsPerSecond:48000});
      REC={rid:rid,id:x.data.id,dossier:x.data.dossier,mr:mr,flux:flux,n:0,seq:0,octets:0,attente:0,file:Promise.resolve(),t0:Date.now(),ext:ext(mr.mimeType||mime),fin:false,wake:null};
      mr.ondataavailable=function(e){if(e.data&&e.data.size)envoyer(e.data);};
      mr.onstop=function(){REC.fin=true;REC.file.then(terminer);};
      mr.start(30000);eveil();window.addEventListener("beforeunload",garde);
      REC.tic=setInterval(function(){var t=$("ra_t"),s=$("ra_s");if(t)t.textContent=duree((Date.now()-REC.t0)/1000);if(s&&REC)s.textContent=REC.n+" morceau"+(REC.n>1?"x":"")+" déposé"+(REC.n>1?"s":"")+(REC.attente?", "+REC.attente+" en cours d’envoi":"")+(REC.wake?" · écran maintenu allumé":" · gardez l’écran allumé");},1000);
      charger(rid);});
  }).catch(function(e){alerte(rid,"Le micro n’a pas pu démarrer : "+err(e)+". Autorisez le micro pour ce site, ou utilisez le dictaphone du téléphone.");});}
function eveil(){if(!REC||!navigator.wakeLock)return;navigator.wakeLock.request("screen").then(function(w){if(REC)REC.wake=w;}).catch(function(){});}
document.addEventListener("visibilitychange",function(){if(REC&&!REC.fin&&document.visibilityState==="visible")eveil();});
function garde(e){if(REC&&!REC.fin){e.preventDefault();e.returnValue="";}}
function envoyer(blob){var R=REC;R.attente++;var num=++R.seq;
  R.file=R.file.then(function essai(_,tour){tour=tour||0;var nom=R.dossier+"/part-"+String(num).padStart(5,"0")+"."+R.ext;
    return sb.storage.from("acrb-audio").upload(nom,blob,{upsert:true,contentType:blob.type||"audio/webm"}).then(function(u){if(u.error)throw u.error;
      R.n++;R.attente--;R.octets+=blob.size;return sb.rpc("acrb_audio_depose",{p_id:R.id,p_morceaux:R.n,p_octets:R.octets,p_fini:false});})
    .catch(function(e){if(tour<5)return new Promise(function(ok){setTimeout(ok,3000*(tour+1));}).then(function(){return essai(null,tour+1);});R.attente--;console.warn("morceau perdu",e);});});}
function arreter(){if(!REC||REC.fin)return;try{REC.mr.stop();}catch(e){REC.fin=true;REC.file.then(terminer);}}
function terminer(){var R=REC;if(!R)return;clearInterval(R.tic);R.flux.getTracks().forEach(function(t){t.stop();});try{R.wake&&R.wake.release();}catch(e){}
  window.removeEventListener("beforeunload",garde);
  sb.rpc("acrb_audio_depose",{p_id:R.id,p_morceaux:R.n,p_octets:R.octets,p_fini:true}).then(function(){REC=null;charger(R.rid);}).catch(function(e){REC=null;alerte(R.rid,"Fin d’enregistrement non transmise : "+err(e));charger(R.rid);});}
function alerte(rid,t){var z=$("ra_in_"+rid);if(z)z.insertAdjacentHTML("afterbegin",'<p class="ru_msg bad" style="margin:0 0 8px">'+esc(t)+'</p>');}

/* ---------------- fichier du dictaphone ---------------- */
function deposerFichier(rid,f){if(!f)return;if(f.size>52428800){alerte(rid,"Ce fichier fait "+mo(f.size)+" : 50 Mo au plus. Sur iPhone, Dictaphone › Réglages › Qualité audio « Compressée » ; ou coupez-le en deux et déposez les deux parties.");return;}
  var z=$("ra_in_"+rid);if(z)z.insertAdjacentHTML("afterbegin",'<p class="soon" id="ra_up" style="margin:0 0 8px">Envoi de '+esc(f.name)+' ('+mo(f.size)+')…</p>');
  var e=(f.name.split(".").pop()||"m4a").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,5)||"m4a";
  sb.rpc("acrb_audio_ouvrir",{p_reunion:rid,p_source:"fichier"}).then(function(x){if(x.error)throw x.error;var a=x.data;
    return sb.storage.from("acrb-audio").upload(a.dossier+"/fichier."+e,f,{upsert:true,contentType:f.type||"audio/mp4"}).then(function(u){if(u.error)throw u.error;
      return sb.rpc("acrb_audio_depose",{p_id:a.id,p_morceaux:1,p_octets:f.size,p_fini:true});});})
  .then(function(){charger(rid);}).catch(function(er){var u=$("ra_up");if(u)u.remove();alerte(rid,"Envoi impossible : "+err(er));});}

/* ---------------- note en PDF ---------------- */
function pdf(a,rid,hold){var R=a.redaction||{},b=[];
  b.push({h:"Note de réunion"});
  var li=document.querySelector("#ru_list .ru[data-id='"+rid+"'] .ru_h b");b.push({p:(li?li.textContent:"Réunion")+(a.duree_s?" — durée enregistrée : "+duree(a.duree_s):"")});
  if(R.resume){b.push({h2:"En bref"});b.push({p:R.resume});}
  if((R.participants||[]).length){b.push({h2:"Participants"});b.push({p:R.participants.join(", ")});}
  if((R.deroulement||[]).length){b.push({h2:"Déroulement"});R.deroulement.forEach(function(x){b.push({h3:x.titre||""});b.push({p:x.texte||""});});}
  if((R.decisions||[]).length){b.push({h2:"Décisions et accords"});R.decisions.forEach(function(x){b.push({li:x});});}
  if(R.issue){b.push({h2:"Issue de la réunion"});b.push({p:R.issue});}
  if(R.prochaine_etape){b.push({h2:"Prochaine étape"});b.push({p:R.prochaine_etape});}
  if((R.actions||[]).length){b.push({h2:"Plan d’action"});b.push({table:{cols:["N°","Action","Responsable","Échéance"],w:[.5,5,2,1.4],size:9,rows:R.actions.map(function(x,i){return [String(i+1),x.titre+(x.detail?" — "+x.detail:""),x.responsable||"à désigner",x.echeance?dc(x.echeance):"—"];})}});}
  b.push({pi:"Note rédigée à partir de l’enregistrement de la réunion et relue avant diffusion. Elle ne remplace pas le procès-verbal signé d’une réunion du conseil d’administration ou de l’assemblée générale."});
  var num=li?li.textContent.split(" — ")[0].trim():"Réunion "+rid;return DOCACRB.pdf(b,"Note de réunion "+num,{reference:num,date:"Bruxelles, "+dc(auj())}).then(function(blob){hold.innerHTML="";DOCACRB.actions(hold,blob,"Note de reunion "+num+".pdf",{});});}

/* ---------------- plan d'action (toutes réunions) ---------------- */
function chargerActions(){var z=$("pa_box");if(!z)return;return sb.rpc("acrb_actions_liste").then(function(x){if(x.error)throw x.error;ACT=x.data||[];dessinerActions();if(window.ESPNAV&&ESPNAV.rafraichir)ESPNAV.rafraichir();})
  .catch(function(e){z.innerHTML='<p class="ru_msg bad">Lecture impossible : '+esc(err(e))+'</p>';});}
function dessinerActions(){var z=$("pa_box");if(!z)return;var A=ACT,j=auj();
  var ouv=A.filter(function(a){return a.etat==="a_faire"||a.etat==="en_cours";}),ret=ouv.filter(function(a){return a.echeance&&a.echeance<j;}),sem=ouv.filter(function(a){return a.echeance&&a.echeance>=j&&a.echeance<=new Date(Date.now()+7*864e5).toISOString().slice(0,10);}),fa=A.filter(function(a){return a.etat==="fait";});
  var resp=[];A.forEach(function(a){if(a.responsable&&resp.indexOf(a.responsable)<0)resp.push(a.responsable);});resp.sort();
  var h='<div class="ra_k"><div><b>'+ouv.length+'</b><span>actions ouvertes</span></div><div class="'+(ret.length?"r":"")+'"><b>'+ret.length+'</b><span>en retard</span></div><div><b>'+sem.length+'</b><span>à rendre sous 7 jours</span></div><div><b>'+fa.length+'</b><span>faites</span></div></div>';
  h+='<div class="ra_f"><select id="pa_e" aria-label="État" data-aide="Montre les actions dans cet état.">'+[["ouvertes","À faire et en cours"],["retard","En retard"],["fait","Faites"],["toutes","Toutes"]].map(function(o){return '<option value="'+o[0]+'"'+(filtre.etat===o[0]?" selected":"")+'>'+o[1]+'</option>';}).join("")+'</select>'+
    '<select id="pa_r" aria-label="Responsable" data-aide="Montre les actions d’une seule personne."><option value="">Tous les responsables</option>'+resp.map(function(r){return '<option'+(filtre.r===r?" selected":"")+'>'+esc(r)+'</option>';}).join("")+'</select>'+
    '<input id="pa_q" type="search" placeholder="Rechercher une action, une réunion" value="'+esc(filtre.q)+'" aria-label="Rechercher"></div>';
  var L=A.filter(function(a){var o=a.etat==="a_faire"||a.etat==="en_cours";if(filtre.etat==="ouvertes"&&!o)return false;if(filtre.etat==="retard"&&!(o&&a.echeance&&a.echeance<j))return false;if(filtre.etat==="fait"&&a.etat!=="fait")return false;
    if(filtre.r&&a.responsable!==filtre.r)return false;var q=filtre.q.toLowerCase();return !q||(a.titre+" "+(a.detail||"")+" "+(a.reunion_titre||"")+" "+(a.responsable||"")).toLowerCase().indexOf(q)>=0;});
  h+=L.length?'<table class="ra_tb"><thead><tr><th>Action</th><th>Responsable</th><th>Échéance</th><th>État</th><th>Réunion</th></tr></thead><tbody>'+L.map(function(a){var r=(a.etat==="a_faire"||a.etat==="en_cours")&&a.echeance&&a.echeance<j;
    return '<tr data-pa="'+a.id+'"><td><b>'+esc(a.titre)+'</b>'+(a.detail?'<br><span class="soon" style="margin:0">'+esc(a.detail)+'</span>':'')+'</td><td>'+(ecrit?'<input data-pk="responsable" value="'+esc(a.responsable||"")+'" aria-label="Responsable" style="width:150px">':esc(a.responsable||""))+'</td><td'+(r?' class="r"':'')+'>'+(ecrit?'<input type="date" data-pk="echeance" value="'+esc(a.echeance||"")+'" aria-label="Échéance">':esc(dc(a.echeance)))+(r?'<br>en retard':'')+'</td><td>'+(ecrit?'<select data-pk="etat" aria-label="État">'+Object.keys(AET).map(function(k){return '<option value="'+k+'"'+(a.etat===k?' selected':'')+'>'+AET[k]+'</option>';}).join("")+'</select>':esc(AET[a.etat]))+'</td><td>'+esc(a.reunion_titre||"—")+(a.reunion_date?'<br><span class="soon" style="margin:0">'+esc(dc(a.reunion_date))+'</span>':'')+'</td></tr>';}).join("")+'</tbody></table>':'<p class="soon">Aucune action ici. Les actions arrivent seules avec chaque compte rendu de réunion, ou s’ajoutent ci-dessous.</p>';
  if(ecrit)h+='<form class="ra_new" id="pa_new"><input name="titre" placeholder="Nouvelle action (livrable vérifiable)" required><input name="responsable" placeholder="Responsable"><input name="echeance" type="date" aria-label="Échéance"><button class="btn" type="submit">Ajouter</button></form>';
  h+='<p class="ru_msg" id="pa_msg"></p>';z.innerHTML=h;
  $("pa_e").onchange=function(){filtre.etat=this.value;dessinerActions();};$("pa_r").onchange=function(){filtre.r=this.value;dessinerActions();};
  $("pa_q").oninput=function(){filtre.q=this.value;var p=this.selectionStart;dessinerActions();var q=$("pa_q");q.focus();try{q.setSelectionRange(p,p);}catch(e){}};
  var f=$("pa_new");if(f)f.onsubmit=function(e){e.preventDefault();var d={titre:f.titre.value,responsable:f.responsable.value,echeance:f.echeance.value};
    sb.rpc("acrb_action_maj",{p_id:null,p_data:d}).then(function(x){if(x.error)throw x.error;chargerActions();}).catch(function(er){$("pa_msg").textContent="Non enregistré : "+err(er);});};}
function majAction(id,k,v){var d={};d[k]=v;return sb.rpc("acrb_action_maj",{p_id:id,p_data:d}).then(function(x){if(x.error)throw x.error;ACT.forEach(function(a){if(a.id===id)a[k]=v;});var m=$("pa_msg");if(m){m.className="ru_msg ok";m.textContent="Enregistré.";}if(k!=="responsable")dessinerActions();})
  .catch(function(er){var m=$("pa_msg");if(m){m.className="ru_msg bad";m.textContent="Non enregistré : "+err(er);}});}

/* ---------------- événements ---------------- */
document.addEventListener("click",function(e){var t=e.target.closest("[data-ra]");if(!t)return;var o=ouverte();if(!o)return;var k=t.dataset.ra;
  if(k==="rec"){demarrer(o.id);return;}
  if(k==="stop"){t.disabled=true;t.textContent="Envoi des derniers morceaux…";arreter();return;}
  if(k==="rel"){t.disabled=true;sb.rpc("acrb_audio_relancer",{p_id:+t.dataset.id,p_quoi:t.dataset.q}).then(function(x){if(x.error)throw x.error;charger(o.id);}).catch(function(er){t.disabled=false;alerte(o.id,err(er));});return;}
  if(k==="pdf"){var a=(cache[o.id]||[]).filter(function(x){return x.id===+t.dataset.id;})[0],hold=document.querySelector("[data-ra-z='"+t.dataset.id+"']");if(a&&hold){t.disabled=true;pdf(a,o.id,hold).then(function(){t.disabled=false;}).catch(function(er){t.disabled=false;alerte(o.id,"PDF impossible : "+err(er));});}return;}});
document.addEventListener("change",function(e){var t=e.target;if(t.dataset&&t.dataset.ra==="fic"){var o=ouverte();if(o)deposerFichier(o.id,t.files[0]);t.value="";return;}
  if(t.dataset&&t.dataset.pk){var tr=t.closest("[data-pa]");if(tr)majAction(+tr.dataset.pa,t.dataset.pk,t.value);}});

window.ENREG={actions:function(){return ACT;},init:function(_sb,_user,roles){sb=_sb;user=_user;roles=roles||[];ecrit=["admin","ca","benevole_admin","fondateur"].some(function(r){return roles.indexOf(r)>=0;});styles();
  var c=$("c_actions");if(c){c.hidden=false;chargerActions();}
  if(lances)return;lances=true;var L=$("ru_list");if(L)new MutationObserver(function(){placer();}).observe(L,{childList:true,subtree:true});placer();}};
})();
