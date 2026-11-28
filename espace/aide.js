/* Aide intégrée ACRB (demande 18) : discrète, commune à tous les écrans.
   - Tout élément porteur de data-aide="…" a une explication en langage simple.
   - Un petit bouton « ? » en bas à droite active le mode aide : chaque élément expliqué est souligné,
     et un toucher montre son explication au lieu d'agir. Un second toucher sur « ? » referme le mode aide.
   - Sur ordinateur, survoler un élément expliqué (0,3 s) montre aussi l'explication.
   - Les champs de saisie montrent leur explication sous le champ dès qu'on y entre. */
(function(){
  if(window.AIDE)return;
  // 28/11 : libellés en néerlandais sur les pages en néerlandais (site de l'association, demande 18)
  var TXS={nl:{t:"Hulp: waarvoor dient elke knop",q:"Hulp verlaten",a:"Hulp",m:"<b>Hulpmodus</b><div>Tik op een onderstreept element om te weten waarvoor het dient. Tik opnieuw op « ? » om verder te gaan.</div>"},fr:{t:"Aide : à quoi sert chaque bouton",q:"Quitter l'aide",a:"Aide",m:"<b>Mode aide</b><div>Touchez n'importe quel élément souligné pour savoir à quoi il sert. Touchez à nouveau « ? » pour reprendre.</div>"},tr:{t:"Yardım: her düğme ne işe yarar",q:"Yardımdan çık",a:"Yardım",m:"<b>Yardım modu</b><div>Ne işe yaradığını görmek için altı çizili bir öğeye dokunun. Devam etmek için « ? » düğmesine yeniden dokunun.</div>"},ar:{t:"مساعدة: وظيفة كل زر",q:"الخروج من المساعدة",a:"مساعدة",m:"<b>وضع المساعدة</b><div>المس أي عنصر مسطّر لمعرفة وظيفته. المس « ? » مرة أخرى للمتابعة.</div>"},ur:{t:"مدد: ہر بٹن کس کام کا ہے",q:"مدد بند کریں",a:"مدد",m:"<b>مدد کا موڈ</b><div>کسی بھی خط کشیدہ چیز کو چھوئیں تاکہ معلوم ہو وہ کس کام کی ہے۔ جاری رکھنے کے لیے « ? » دوبارہ چھوئیں۔</div>"},en:{t:"Help: what each button is for",q:"Leave help",a:"Help",m:"<b>Help mode</b><div>Tap any underlined element to see what it is for. Tap « ? » again to carry on.</div>"}};
  function TX(){return TXS[String(document.documentElement.lang||"fr").slice(0,2).toLowerCase()]||TXS.fr;}  // la langue suit <html lang>, même après un changement sans rechargement;
  var on=false,bulle,btn,st=document.createElement("style");
  st.textContent='.aide-btn{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:60;width:38px;height:38px;border-radius:50%;border:1px solid rgba(0,0,0,.12);background:#fff;color:#1d1a16;font:800 17px/1 "Libre Franklin",Arial,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.12);cursor:pointer}'+
    '.aide-btn[aria-pressed=true]{background:#1d1a16;color:#fff}'+
    '.aide-btn.aide-dock{position:static;width:34px;height:34px;font-size:15px;box-shadow:none;flex:none}'+
    'body.aide-on [data-aide]{outline:2px dashed #c99a3a;outline-offset:2px;cursor:help}'+
    '.aide-bulle{position:fixed;z-index:61;pointer-events:none;max-width:min(320px,calc(100vw - 24px));background:#1d1a16;color:#fff;border-radius:12px;padding:10px 12px;font:500 14px/1.4 "Source Sans 3","Segoe UI",Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25)}'+
    '.aide-bulle b{display:block;font-weight:800;margin-bottom:2px}.aide-bulle[hidden]{display:none}'+
    '.aide-sous{font-size:12.5px;color:#6f6a62;margin:4px 2px 0}';
  document.head.appendChild(st);
  function titre(el){var t=el.getAttribute("aria-label")||el.getAttribute("placeholder")||(el.innerText||el.textContent||"").trim().replace(/\s*\n+\s*/g," · ");return t.length>60?t.slice(0,57)+"…":t;}  /* 28/11 : lignes séparées par « · » (avant : « 112Ambulance ») */
  function montrer(el){var r=el.getBoundingClientRect();bulle.innerHTML="";var b=document.createElement("b");b.textContent=titre(el);var p=document.createElement("div");p.textContent=el.getAttribute("data-aide");if(b.textContent)bulle.appendChild(b);bulle.appendChild(p);bulle.hidden=false;
    var w=bulle.offsetWidth,h=bulle.offsetHeight,x=Math.min(Math.max(12,r.left),innerWidth-w-12),y=r.bottom+8;if(y+h>innerHeight-60)y=Math.max(12,r.top-h-8);bulle.style.left=x+"px";bulle.style.top=y+"px";}
  function cacher(){if(bulle)bulle.hidden=true;}
  function basculer(v){on=v;document.body.classList.toggle("aide-on",on);btn.setAttribute("aria-pressed",on?"true":"false");btn.title=on?TX().q:TX().t;if(!on)cacher();
    try{localStorage.setItem("acrb_aide_vue","1");}catch(e){}}
  function init(){
    if(!document.body)return document.addEventListener("DOMContentLoaded",init);
    bulle=document.createElement("div");bulle.className="aide-bulle";bulle.hidden=true;bulle.setAttribute("role","tooltip");document.body.appendChild(bulle);
    btn=document.createElement("button");btn.className="aide-btn";btn.type="button";btn.textContent="?";btn.setAttribute("aria-pressed","false");btn.setAttribute("aria-label",TX().a);btn.title=TX().t;try{new MutationObserver(function(){btn.setAttribute("aria-label",TX().a);btn.title=on?TX().q:TX().t;}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});}catch(e){}
    btn.onclick=function(e){e.stopPropagation();basculer(!on);if(on){bulle.innerHTML=TX().m;bulle.hidden=false;var r=btn.getBoundingClientRect();bulle.style.left=Math.max(12,Math.min(r.right-bulle.offsetWidth,innerWidth-bulle.offsetWidth-12))+"px";bulle.style.top=(r.top>innerHeight/2?r.top-bulle.offsetHeight-8:r.bottom+8)+"px";}};
    var place=document.getElementById("aide-place");
    if(place){btn.classList.add("aide-dock");place.appendChild(btn);}else document.body.appendChild(btn);
    document.addEventListener("click",function(e){if(!on)return;var el=e.target.closest&&e.target.closest("[data-aide]");if(e.target===btn)return;e.preventDefault();e.stopPropagation();if(el)montrer(el);else cacher();},true);
    var tm;document.addEventListener("mouseover",function(e){var el=e.target.closest&&e.target.closest("[data-aide]");clearTimeout(tm);if(!el||on){return;}tm=setTimeout(function(){montrer(el);},300);});
    document.addEventListener("mouseout",function(e){clearTimeout(tm);if(!on)cacher();});
    document.addEventListener("focusin",function(e){var el=e.target;if(!el.matches||!el.matches("input[data-aide],textarea[data-aide],select[data-aide]"))return;if(el._aideSous&&el._aideSous.parentNode)return;/* Ordre cerveau 1122 (28/11) : dans une rangée (champ + bouton côte à côte), l'explication glissée à côté écrasait le champ et masquait le mot tapé ; elle va donc sous la rangée entière, et ne s'affiche pas dans un bandeau collant (en-tête) où le texte d'exemple du champ suffit. */var ap=el,p=el.parentNode;for(var i=0;i<3&&p&&p!==document.body;i++){var cs=getComputedStyle(p);if(/flex/.test(cs.display)&&!/column/.test(cs.flexDirection)||/grid/.test(cs.display)&&cs.gridTemplateColumns.split(" ").length>1){ap=p;p=p.parentNode;}else break;}for(var a=el;a&&a!==document.body;a=a.parentNode){var po=getComputedStyle(a).position;if(po==="sticky"||po==="fixed")return;}var d=document.createElement("div");d.className="aide-sous";d.textContent=el.getAttribute("data-aide");ap.insertAdjacentElement("afterend",d);el._aideSous=d;});
    /* retrait différé : sinon la page remonte entre l’appui et le relâchement, et le toucher tombe à côté du bouton visé */
    document.addEventListener("focusout",function(e){var n=e.target._aideSous;if(n)setTimeout(function(){if(n.parentNode&&document.activeElement!==e.target){n.remove();e.target._aideSous=null;}},300);});
    window.addEventListener("scroll",function(){if(!on)cacher();},{passive:true});
    /* un « title » devient une explication du petit carré (même apparence partout, aussi au toucher en mode aide) */
    function titres(r){(r.querySelectorAll?r:document).querySelectorAll("[title]:not([data-aide])").forEach(function(e){if(e===btn||/^(IFRAME|HTML|svg)$/i.test(e.tagName))return;var t=(e.getAttribute("title")||"").trim();if(t.length<4)return;e.setAttribute("data-aide",t);e.setAttribute("data-aide-titre","1");e.removeAttribute("title");});}
    /* Demande de Karim (répétée, récidive du 25/11) : TOUT bouton, onglet, lien, liste ou volet a son petit carré.
       Les explications écrites à la main (data-aide) priment ; sinon une explication précise est tirée du libellé et de la rubrique. */
    var SPEC={"se deconnecter":"Ferme votre session sur cet appareil. Il faudra vous reconnecter (bouton Google) pour revenir.",
      "acrb, l'association":"Ouvre le site public de l’association (ce que voient les visiteurs).","shopping brabant":"Ouvre l’annuaire public des commerces du quartier, tel que les clients le voient.",
      "exporter le registre (csv)":"Télécharge le registre des membres en fichier tableur (CSV), à ouvrir dans Excel ou Google Sheets.",
      "facturer en une fois":"Émet d’un coup la facture de cotisation à tous les commerçants de la liste choisie. Réservé au trésorier.",
      "rappeler tous les retardataires":"Prépare un rappel pour chaque cotisation impayée après son échéance. Réservé au trésorier.",
      "enregistrer la connexion":"Enregistre les identifiants du logiciel de facturation relié (Odoo), pour synchroniser les factures.",
      "synchroniser maintenant":"Récupère tout de suite les factures et paiements du logiciel de facturation relié.",
      "ouvrir le mode terrain":"Ouvre l’outil de terrain : valider commerce par commerce les enseignes, rubriques et statuts.",
      "mode terrain":"Ouvre l’outil de terrain : valider commerce par commerce les enseignes, rubriques et statuts.",
      "ouvrir mon espace commercant":"Ouvre votre espace commerçant : votre fiche, vos photos, vos horaires et vos avis.",
      "nouvelle fiche":"Crée une nouvelle fiche dans le guide du quartier (adresse utile, numéro, service).",
      "ouvrir l'acces":"Donne l’accès à cette adresse Google avec le rôle choisi. Il se retire en un clic et reste tracé.",
      "enregistrer les reglages":"Enregistre les réglages de l’association. Chaque modification est tracée.",
      "relier":"Relie le compte postal de l’association pour envoyer de vrais courriers par la poste.",
      "ouvrir le vote":"Ouvre un nouveau vote du conseil avec la règle choisie ; chaque administrateur pourra voter.",
      "ajouter a l'acte en preparation":"Ajoute cette décision à l’acte en cours de préparation (dépôt au greffe, publication au Moniteur)."};
    var VERBES=[[/^enregistrer/,"Enregistre vos changements. Une confirmation s’affiche à côté du bouton."],[/^ajouter/,"Ajoute ce que vous venez de saisir à la liste."],[/^creer|^nouveau|^nouvelle/,"Crée un nouvel élément avec ce que vous avez saisi."],
      [/^rechercher|^chercher/,"Lance la recherche avec le mot tapé."],[/^exporter|^telecharger/,"Télécharge le fichier sur votre appareil."],[/^imprimer/,"Ouvre l’impression du document."],[/^partager/,"Ouvre le partage (WhatsApp, courriel…) de votre téléphone."],
      [/^retirer|^supprimer|^effacer/,"Retire cet élément. L’action est tracée."],[/^valider|^confirmer|^approuver/,"Valide cet élément. L’action est tracée à votre nom."],[/^refuser|^rejeter/,"Refuse cet élément ; vous pourrez en donner la raison."],
      [/^envoyer|^emettre/,"Envoie ou émet le document préparé."],[/^annuler|^fermer/,"Ferme sans rien changer."],[/^modifier|^editer|^corriger/,"Ouvre cet élément pour le modifier."],[/^ouvrir|^voir|^apercu/,"Ouvre le détail."],
      [/^synchroniser|^actualiser|^rafraichir/,"Met à jour les informations tout de suite."],[/^copier/,"Copie dans le presse-papiers, prêt à coller."],[/^suivant/,"Passe à l’étape suivante."],[/^precedent|^retour/,"Revient à l’étape précédente."],
      [/^importer/,"Importe un fichier depuis votre appareil."],[/^voter/,"Enregistre votre voix pour ce vote."],[/^generer|^preparer|^rediger/,"Prépare le document à partir des informations déjà saisies."]];
    function nrm(t){return (t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’]/g,"'").toLowerCase().replace(/\s+\d+$/,"").trim();}
    function rub(e){var c=e.closest(".c,section,.card");var h=c&&c.querySelector("h2,h3");return h?h.textContent.split(" — ")[0].trim():"";}
    function expliquer(e){if(e===btn||e.hasAttribute("data-aide")||e.closest(".aide-bulle"))return;
      var t=(e.innerText||e.getAttribute("aria-label")||"").trim().replace(/\s+/g," "),n=nrm(t),r=rub(e),x="";
      var sk=SPEC[n]?n:Object.keys(SPEC).filter(function(k){return k.length>6&&(n.slice(-k.length)===k||n.replace(/[^a-z0-9 ]/g,"")===k.replace(/[^a-z0-9 ]/g,""));})[0];if(sk)x=SPEC[sk];
      else if(e.tagName==="SUMMARY")x="Déplie ou replie : "+t.replace(/\s*\(?\d+\)?$/,"")+".";
      else if(e.tagName==="SELECT"){var l=e.getAttribute("aria-label")||"";if(!l&&e.labels&&e.labels[0]){var k=e.labels[0].cloneNode(true);k.querySelectorAll("select,option,input").forEach(function(z){z.remove();});l=k.textContent.replace(/\s+/g," ").trim();}if(!l&&e.options&&e.options[0])l="actuellement « "+e.options[e.selectedIndex<0?0:e.selectedIndex].text+" »";x="Choisissez dans la liste"+(l?" : "+l.trim():"")+(r?" (« "+r+" »)":"")+".";}
      else if(e.tagName==="A"&&e.href&&e.host&&e.host!==location.host)x="Ouvre "+e.host.replace(/^www\./,"")+" dans un nouvel onglet.";
      else if(e.tagName==="A"&&e.href)x="Ouvre "+(t?"« "+t.replace(/\s*→$/,"")+" »":"cette page")+(r?", depuis la rubrique « "+r+" »":"")+".";
      else{for(var i=0;i<VERBES.length;i++)if(VERBES[i][0].test(n)){x=VERBES[i][1];break;}
        if(x&&r)x="« "+t+" » ("+r+") : "+x.charAt(0).toLowerCase()+x.slice(1);
        if(!x&&t)x="« "+t+" »"+(r?" dans « "+r+" »":"")+" : agit tout de suite ; le résultat s’affiche à côté.";}
      if(x)e.setAttribute("data-aide",x);}
    var tA;function tout(){clearTimeout(tA);tA=setTimeout(function(){document.querySelectorAll("a[href],button,summary,select,[role=tab]").forEach(expliquer);},150);}
    tout();
    titres(document);try{new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1){if(n.hasAttribute&&n.hasAttribute("title"))titres(n.parentNode||document);titres(n);}});if(m.type==="attributes"&&m.target.hasAttribute&&m.target.hasAttribute("title"))titres(m.target.parentNode||document);});tout();}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["title"]});}catch(e){}
  }
  window.AIDE={basculer:basculer,montrer:montrer};
  init();
})();
