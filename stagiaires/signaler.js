/* « Signaler une erreur » : bouton visible par tous, sur toutes les pages de la plateforme (demande de Karim, 25/11/2026).
   Le signalement part dans acrb_erreurs_site avec l'adresse de la page, la taille de l'écran, le navigateur et les erreurs
   JavaScript récentes. Il est ensuite vérifié automatiquement, corrigé et publié si l'erreur se confirme.
   Aucune bibliothèque : appel REST direct avec la clé publique, et le jeton de session s'il y en a un. */
(function(){
  if(window.SIGNALER)return;
  var SB="https://movoukcjirtjnqjgwndw.supabase.co",CLE="sb_publishable_jVXX4nAfC5F0wzj_FedaAQ_WhzzN_O6",JS=[];
  window.addEventListener("error",function(e){if(JS.length<8)JS.push(String(e.message||"erreur")+(e.filename?" @ "+e.filename.split("/").pop()+":"+e.lineno:""));});
  window.addEventListener("unhandledrejection",function(e){if(JS.length<8)JS.push("promesse : "+String(e.reason&&e.reason.message||e.reason||""));});
  function jeton(){try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(/^sb-.*-auth-token$/.test(k)){var t=JSON.parse(localStorage.getItem(k));if(t&&t.access_token&&(!t.expires_at||t.expires_at*1000>Date.now()))return t;}}}catch(e){}return null;}
  function ecran(){var a=document.querySelector(".nv .r1 a.on"),b=document.querySelector(".nv .r2 a.on");return a?(a.textContent.replace(/\s*\d+$/,"").trim()+(b?" › "+b.textContent.trim():"")):"";}
  var CSS='#sg_btn{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:59;display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:7px 12px;border:1px solid rgba(0,0,0,.15);border-radius:999px;background:#fff;color:#1d1a16;font:700 13px/1.1 "Libre Franklin","Segoe UI",Arial,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.15);cursor:pointer;white-space:nowrap}'+
    '#sg_btn:hover{background:#fff6e5}#sg_btn[hidden],#sg_pan[hidden]{display:none}'+
    '#sg_pan{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:62;width:min(400px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;background:#fff;border:1px solid #ddd;border-top:4px solid #c99a3a;border-radius:10px;padding:14px;box-shadow:0 10px 32px rgba(0,0,0,.25);font:15px/1.4 "Source Sans 3","Segoe UI",Arial,sans-serif;color:#1d1a16;box-sizing:border-box}'+
    '#sg_pan h3{margin:0 0 4px;font:800 17px "Libre Franklin","Segoe UI",Arial,sans-serif}#sg_pan p{margin:0 0 10px;font-size:14px;color:#5f5a52}'+
    '#sg_pan textarea,#sg_pan input{display:block;width:100%;box-sizing:border-box;padding:10px;border:1px solid #c6c1b8;border-radius:6px;font:16px "Source Sans 3","Segoe UI",Arial,sans-serif;margin:0 0 8px;min-height:44px}#sg_pan textarea{min-height:110px;resize:vertical}'+
    '#sg_pan .sg_r{display:flex;gap:8px;flex-wrap:wrap}#sg_pan .sg_r button{min-height:42px;padding:10px 14px;border-radius:6px;border:1px solid #1d1a16;background:#1d1a16;color:#fff;font:700 15px "Libre Franklin","Segoe UI",Arial,sans-serif;cursor:pointer}#sg_pan .sg_r button.o{background:#fff;color:#1d1a16}'+
    '#sg_ok{margin-top:8px;font-size:14.5px;font-weight:600}#sg_ok.ok{color:#1f7a45}#sg_ok.bad{color:#b23a2b}.sg_place{height:60px}@media print{#sg_btn,#sg_pan,.sg_place{display:none}}';
  function $(i){return document.getElementById(i);}
  var TX={fr:["⚠ Signaler une erreur","Vous voyez quelque chose qui ne marche pas ou qui s’affiche mal sur cette page ? Dites-le ici : l’erreur est vérifiée automatiquement puis corrigée."],
    nl:["⚠ Een fout melden","Werkt er iets niet of wordt iets slecht weergegeven op deze pagina? Meld het hier: de fout wordt automatisch nagekeken en verbeterd."],
    en:["⚠ Report an error","Something not working or displayed badly on this page? Tell us here: the error is checked automatically, then fixed."]};
  var PAN={fr:["Signaler une erreur","Dites ce qui ne va pas sur cette page : un bouton qui ne marche pas, un texte faux, quelque chose de coupé ou mal affiché. L’adresse de la page et la taille de votre écran sont jointes automatiquement.","Ex. : le bouton « Envoyer » ne fait rien / le prix affiché est faux / le menu est coupé à droite…","Votre adresse ou téléphone (facultatif)","Envoyer","Fermer","Décrivez l’erreur en quelques mots.","Merci. Signalement n° {n} reçu à {h}. Il est vérifié automatiquement ; si l’erreur se confirme, elle est corrigée et mise en ligne.","Non envoyé : ","Envoi…"],
    nl:["Een fout melden","Zeg wat er misloopt op deze pagina: een knop die niet werkt, een foute tekst, iets dat afgesneden of slecht weergegeven is. Het adres van de pagina en de grootte van uw scherm worden automatisch meegestuurd.","Bv.: de knop « Verzenden » doet niets / de prijs klopt niet / het menu is rechts afgesneden…","Uw e-mailadres of telefoon (niet verplicht)","Verzenden","Sluiten","Beschrijf de fout in een paar woorden.","Dank u. Melding nr. {n} ontvangen om {h}. Ze wordt automatisch nagekeken; als de fout bevestigd wordt, wordt ze verbeterd en online gezet.","Niet verzonden: ","Verzenden…"],
    en:["Report an error","Tell us what is wrong on this page: a button that does not work, wrong text, something cut off or badly displayed. The page address and your screen size are attached automatically.","E.g.: the “Send” button does nothing / the price shown is wrong / the menu is cut off on the right…","Your email or phone (optional)","Send","Close","Describe the error in a few words.","Thank you. Report no. {n} received at {h}. It is checked automatically; if the error is confirmed, it is fixed and put online.","Not sent: ","Sending…"]};
  // 28/11 (demande 18) : les explications d'aide du cadre suivent aussi la langue de la page
  var AID={fr:["Décrivez l’erreur avec vos mots : ce que vous avez fait, ce que vous attendiez, ce qui s’est passé.","Facultatif : laissez une adresse ou un numéro si vous voulez être prévenu de la correction.","Envoie le signalement. Il est vérifié automatiquement sur téléphone et sur ordinateur.","Ferme ce cadre sans rien envoyer."],
    nl:["Beschrijf de fout in uw eigen woorden: wat u deed, wat u verwachtte, wat er gebeurde.","Niet verplicht: laat een adres of nummer achter als u wilt weten wanneer de fout verbeterd is.","Verstuurt de melding. Ze wordt automatisch nagekeken op telefoon en computer.","Sluit dit venster zonder iets te versturen."],
    en:["Describe the error in your own words: what you did, what you expected, what happened.","Optional: leave an e-mail or phone number if you want to hear when it is fixed.","Sends the report. It is checked automatically on phone and computer.","Closes this box without sending anything."]};
  function T(i){return PAN[lg()][i];}
  function traduire(){var q=function(x){return document.querySelector(x);};q("#sg_pan h3").textContent=T(0);q("#sg_pan p").textContent=T(1);$("sg_txt").placeholder=T(2);if($("sg_contact"))$("sg_contact").placeholder=T(3);$("sg_go").textContent=T(4);$("sg_x").textContent=T(5);$("sg_pan").setAttribute("aria-label",T(0));var A=AID[lg()]||AID.fr;$("sg_txt").setAttribute("data-aide",A[0]);if($("sg_contact"))$("sg_contact").setAttribute("data-aide",A[1]);$("sg_go").setAttribute("data-aide",A[2]);$("sg_x").setAttribute("data-aide",A[3]);}
  function lg(){var l=(document.documentElement.lang||"fr").slice(0,2).toLowerCase();return TX[l]?l:"fr";}
  function libeller(){var b=$("sg_btn");if(!b)return;var t=TX[lg()];if(b.textContent!==t[0])b.textContent=t[0];if(b.getAttribute("data-aide")!==t[1])b.setAttribute("data-aide",t[1]);}
  // Ne jamais recouvrir un autre bouton fixe (Demander une modification, aide « ? »…) : on se place au-dessus.
  var tic=0;
  function placer(){var b=$("sg_btn");if(!b||b.hidden)return;b.style.bottom="";
    for(var k=0;k<3;k++){var r=b.getBoundingClientRect(),bouge=false;
      [].forEach.call(document.querySelectorAll("button,a[href]"),function(e){if(e===b||e.closest("#sg_pan")||!e.getClientRects().length)return;var z=e,fx=false;while(z&&z!==document.body){if(getComputedStyle(z).position==="fixed"){fx=true;break;}z=z.parentElement;}if(!fx)return;
        var q=e.getBoundingClientRect();if(q.width<2||q.height<2)return;if(q.left<r.right+6&&q.right>r.left-6&&q.top<r.bottom+6&&q.bottom>r.top-6){b.style.bottom=Math.round(innerHeight-q.top+8)+"px";bouge=true;r=b.getBoundingClientRect();}});
      if(!bouge)break;}}
  function surveiller(){if(tic)return;tic=requestAnimationFrame(function(){tic=0;libeller();placer();});}
  function init(){
    if(!document.body)return document.addEventListener("DOMContentLoaded",init);
    if($("sg_btn"))return;
    var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
    var t=jeton();
    document.body.insertAdjacentHTML("beforeend",'<div class="sg_place" aria-hidden="true"></div>'+
      '<button id="sg_btn" type="button" data-aide="Vous voyez quelque chose qui ne marche pas ou qui s’affiche mal sur cette page ? Dites-le ici : l’erreur est vérifiée automatiquement puis corrigée.">⚠ Signaler une erreur</button>'+
      '<div id="sg_pan" hidden role="dialog" aria-label="Signaler une erreur"><h3>Signaler une erreur</h3>'+
      '<p>Dites ce qui ne va pas sur cette page : un bouton qui ne marche pas, un texte faux, quelque chose de coupé ou mal affiché. L’adresse de la page et la taille de votre écran sont jointes automatiquement.</p>'+
      '<textarea id="sg_txt" data-aide="Décrivez l’erreur avec vos mots : ce que vous avez fait, ce que vous attendiez, ce qui s’est passé." placeholder="Ex. : le bouton « Envoyer » ne fait rien / le prix affiché est faux / le menu est coupé à droite…"></textarea>'+
      (t?'':'<input id="sg_contact" type="text" autocomplete="email" data-aide="Facultatif : laissez une adresse ou un numéro si vous voulez être prévenu de la correction." placeholder="Votre adresse ou téléphone (facultatif)">')+
      '<div class="sg_r"><button type="button" id="sg_go" data-aide="Envoie le signalement. Il est vérifié automatiquement sur téléphone et sur ordinateur.">Envoyer</button><button type="button" class="o" id="sg_x" data-aide="Ferme ce cadre sans rien envoyer.">Fermer</button></div><div id="sg_ok" role="status"></div></div>');
    libeller();placer();addEventListener("resize",surveiller);
    try{new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var t=ms[i].target;if(t.id==="sg_btn"||(t.closest&&t.closest("#sg_pan")))continue;surveiller();return;}}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["hidden","style","class","lang"]});}catch(e){}
    setTimeout(surveiller,1500);
    $("sg_btn").onclick=function(){traduire();$("sg_pan").hidden=false;$("sg_btn").hidden=true;$("sg_ok").textContent="";$("sg_ok").className="";$("sg_txt").focus();};
    $("sg_x").onclick=function(){$("sg_pan").hidden=true;$("sg_btn").hidden=false;placer();};
    $("sg_go").onclick=function(){
      var b=this,txt=$("sg_txt").value.trim(),ok=$("sg_ok");
      if(txt.length<5){ok.className="bad";ok.textContent=T(6);return;}
      b.disabled=true;b.textContent=T(9);ok.className="";ok.textContent="";
      var s=jeton(),h={"apikey":CLE,"Content-Type":"application/json","Authorization":"Bearer "+(s?s.access_token:CLE)};
      var ctx={largeur:innerWidth,hauteur:innerHeight,ratio:window.devicePixelRatio||1,navigateur:navigator.userAgent.slice(0,300),langue:navigator.language,ecran:ecran(),titre:document.title.slice(0,150),erreurs_js:JS.slice()};
      fetch(SB+"/rest/v1/rpc/acrb_erreur_signaler",{method:"POST",headers:h,body:JSON.stringify({p_url:location.href,p_texte:txt,p_contexte:ctx,p_contact:$("sg_contact")?$("sg_contact").value:null})})
        .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
        .then(function(x){b.disabled=false;b.textContent=T(4);
          if(!x.ok){ok.className="bad";ok.textContent=T(8)+((x.j&&x.j.message)||"…");return;}
          ok.className="ok";ok.textContent="✓ "+T(7).replace("{n}",x.j).replace("{h}",new Date().toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"}));
          $("sg_txt").value="";if($("sg_contact"))$("sg_contact").value="";})
        .catch(function(){b.disabled=false;b.textContent=T(4);ok.className="bad";ok.textContent=T(8)+"—";});
    };
  }
  window.SIGNALER={init:init};init();
})();
