/* Aide intégrée ACRB (demande 18) : discrète, commune à tous les écrans.
   - Tout élément porteur de data-aide="…" a une explication en langage simple.
   - Un petit bouton « ? » en bas à droite active le mode aide : chaque élément expliqué est souligné,
     et un toucher montre son explication au lieu d'agir. Un second toucher sur « ? » referme le mode aide.
   - Sur ordinateur, survoler un élément expliqué pendant une seconde montre aussi l'explication.
   - Les champs de saisie montrent leur explication sous le champ dès qu'on y entre. */
(function(){
  if(window.AIDE)return;
  var on=false,bulle,btn,st=document.createElement("style");
  st.textContent='.aide-btn{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:60;width:38px;height:38px;border-radius:50%;border:1px solid rgba(0,0,0,.12);background:#fff;color:#1d1a16;font:800 17px/1 "Libre Franklin",Arial,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.12);cursor:pointer}'+
    '.aide-btn[aria-pressed=true]{background:#1d1a16;color:#fff}'+
    '.aide-btn.aide-dock{position:static;width:34px;height:34px;font-size:15px;box-shadow:none;flex:none}'+
    'body.aide-on [data-aide]{outline:2px dashed #c99a3a;outline-offset:2px;cursor:help}'+
    '.aide-bulle{position:fixed;z-index:61;max-width:min(320px,calc(100vw - 24px));background:#1d1a16;color:#fff;border-radius:12px;padding:10px 12px;font:500 14px/1.4 "Source Sans 3","Segoe UI",Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25)}'+
    '.aide-bulle b{display:block;font-weight:800;margin-bottom:2px}.aide-bulle[hidden]{display:none}'+
    '.aide-sous{font-size:12.5px;color:#6f6a62;margin:4px 2px 0}';
  document.head.appendChild(st);
  function titre(el){var t=el.getAttribute("aria-label")||el.getAttribute("placeholder")||(el.textContent||"").trim();return t.length>60?t.slice(0,57)+"…":t;}
  function montrer(el){var r=el.getBoundingClientRect();bulle.innerHTML="";var b=document.createElement("b");b.textContent=titre(el);var p=document.createElement("div");p.textContent=el.getAttribute("data-aide");if(b.textContent)bulle.appendChild(b);bulle.appendChild(p);bulle.hidden=false;
    var w=bulle.offsetWidth,h=bulle.offsetHeight,x=Math.min(Math.max(12,r.left),innerWidth-w-12),y=r.bottom+8;if(y+h>innerHeight-60)y=Math.max(12,r.top-h-8);bulle.style.left=x+"px";bulle.style.top=y+"px";}
  function cacher(){if(bulle)bulle.hidden=true;}
  function basculer(v){on=v;document.body.classList.toggle("aide-on",on);btn.setAttribute("aria-pressed",on?"true":"false");btn.title=on?"Quitter l'aide":"Aide : à quoi sert chaque bouton";if(!on)cacher();
    try{localStorage.setItem("acrb_aide_vue","1");}catch(e){}}
  function init(){
    if(!document.body)return document.addEventListener("DOMContentLoaded",init);
    bulle=document.createElement("div");bulle.className="aide-bulle";bulle.hidden=true;bulle.setAttribute("role","tooltip");document.body.appendChild(bulle);
    btn=document.createElement("button");btn.className="aide-btn";btn.type="button";btn.textContent="?";btn.setAttribute("aria-pressed","false");btn.setAttribute("aria-label","Aide");btn.title="Aide : à quoi sert chaque bouton";
    btn.onclick=function(e){e.stopPropagation();basculer(!on);if(on){bulle.innerHTML="<b>Mode aide</b><div>Touchez n'importe quel élément souligné pour savoir à quoi il sert. Touchez à nouveau « ? » pour reprendre.</div>";bulle.hidden=false;var r=btn.getBoundingClientRect();bulle.style.left=Math.max(12,Math.min(r.right-bulle.offsetWidth,innerWidth-bulle.offsetWidth-12))+"px";bulle.style.top=(r.top>innerHeight/2?r.top-bulle.offsetHeight-8:r.bottom+8)+"px";}};
    var place=document.getElementById("aide-place");
    if(place){btn.classList.add("aide-dock");place.appendChild(btn);}else document.body.appendChild(btn);
    document.addEventListener("click",function(e){if(!on)return;var el=e.target.closest&&e.target.closest("[data-aide]");if(e.target===btn)return;e.preventDefault();e.stopPropagation();if(el)montrer(el);else cacher();},true);
    var tm;document.addEventListener("mouseover",function(e){var el=e.target.closest&&e.target.closest("[data-aide]");clearTimeout(tm);if(!el||on){return;}tm=setTimeout(function(){montrer(el);},1000);});
    document.addEventListener("mouseout",function(e){clearTimeout(tm);if(!on)cacher();});
    document.addEventListener("focusin",function(e){var el=e.target;if(!el.matches||!el.matches("input[data-aide],textarea[data-aide],select[data-aide]"))return;var n=el.nextElementSibling;if(n&&n.classList&&n.classList.contains("aide-sous"))return;var d=document.createElement("div");d.className="aide-sous";d.textContent=el.getAttribute("data-aide");el.insertAdjacentElement("afterend",d);});
    document.addEventListener("focusout",function(e){var n=e.target.nextElementSibling;if(n&&n.classList&&n.classList.contains("aide-sous"))n.remove();});
    window.addEventListener("scroll",function(){if(!on)cacher();},{passive:true});
  }
  window.AIDE={basculer:basculer,montrer:montrer};
  init();
})();
