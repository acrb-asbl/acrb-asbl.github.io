/* Charte documentaire de l'ACRB : tous les documents produits par l'association (PV, convocations, listes de présence,
   procurations, lettres, actes, décisions de vote) sortent avec la même identité : logo de l'association, rouge institutionnel,
   en-tête et pied de page officiels, pagination. Moteur PDF : pdf-lib (vectoriel, texte sélectionnable, A4).
   Expose window.DOCACRB = { AS, pdf(blocs, titre), actions(conteneur, blob, nom, options), propre(texte) }. */
(function(){
var AS={
  nom:"Association des Commerçants des rues de Brabant, Liedts et Gallait",
  abr:"ACRB asbl",
  forme:"association sans but lucratif",
  num:"0468.701.030",
  siege:"Quai des Usines 160, 1000 Bruxelles",
  rpm:"RPM Bruxelles, tribunal de l'entreprise francophone",
  devise:"Ensemble pour mieux réussir",
  courriel:"info@shoppingbrabant.be",
  iban:"BE63 0004 5568 7408",
  banque:"BNP Paribas Fortis",
  logo:"img/acrb-logo.png"
};
/* rouge des documents officiels de l'association (factures, en-têtes) */
var ROUGE=[175/255,64/255,87/255], GRIS=[.38,.38,.42], NOIR=[.08,.08,.1], FILET=[.82,.78,.8];
var logoBytes=null;
function chargerLogo(){if(logoBytes)return Promise.resolve(logoBytes);
  return fetch(AS.logo).then(function(r){if(!r.ok)throw new Error("logo");return r.arrayBuffer();}).then(function(b){logoBytes=b;return b;});}
/* Helvetica (WinAnsi) : on remplace tout caractère qu'elle ne sait pas dessiner, au lieu de laisser le PDF échouer */
var REMPL={" ":" "," ":" "," ":" ","​":"","⁠":"","‑":"-","‐":"-","−":"-","✓":"v","✔":"v","✗":"x","→":"->","←":"<-","≥":">=","≤":"<=","­":"","″":"\"","′":"'","ʼ":"'"};
var WIN=new Set(Array.from("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ").map(function(c){return c.charCodeAt(0);}));
function propre(t){return String(t==null?"":t).replace(/\r/g,"").replace(/« /g,"«\u00a0").replace(/ »/g,"\u00a0»").replace(/ ([:;!?])/g,"\u00a0$1").replace(/./gu,function(c){if(REMPL[c]!=null)return REMPL[c];var k=c.charCodeAt(0);if(c.length>1)return "";if(k===10||(k>=32&&k<=126)||(k>=160&&k<=255)||WIN.has(k))return c;
  var n=c.normalize("NFD").replace(/[̀-ͯ]/g,"");return /^[\x20-\x7e]$/.test(n)?n:"";});}

async function pdf(blocs,titre,opt){opt=opt||{};var L=window.PDFLib,doc=await L.PDFDocument.create();
  doc.setTitle(propre(titre));doc.setAuthor(AS.abr);doc.setCreator("Plateforme de gestion de l'ACRB");doc.setProducer("ACRB");doc.setLanguage("fr-BE");
  var F=await doc.embedFont(L.StandardFonts.Helvetica),B=await doc.embedFont(L.StandardFonts.HelveticaBold),I=await doc.embedFont(L.StandardFonts.HelveticaOblique);
  var img=null;try{img=await doc.embedPng(await chargerLogo());}catch(e){img=null;}
  var W=595.28,H=841.89,M=56,HAUT=118,BAS=74,y,page,num=0;
  var c=function(a){return L.rgb(a[0],a[1],a[2]);};
  function entete(){page=doc.addPage([W,H]);num++;
    if(img){var lw=num===1?112:70,lh=lw*img.height/img.width;page.drawImage(img,{x:M-4,y:H-28-lh,width:lw,height:lh});}
    var x=num===1?M+122:M+80,yy=H-40;
    var nom=num===1?wrap(AS.nom,B,11.5,W-M-x):[AS.nom];
    nom.forEach(function(l){page.drawText(propre(l),{x:x,y:yy,size:num===1?11.5:8.5,font:B,color:c(ROUGE)});yy-=num===1?14:11;});
    if(num===1){page.drawText(propre(AS.abr+" · "+AS.forme),{x:x,y:yy,size:8.5,font:F,color:c(GRIS)});yy-=11;
      page.drawText(propre(AS.devise),{x:x,y:yy,size:8.5,font:I,color:c(ROUGE)});yy-=11;
      page.drawText(propre("N° d'entreprise "+AS.num+" · Siège : "+AS.siege),{x:x,y:yy,size:7.6,font:F,color:c(GRIS)});}
    var ligne=num===1?H-HAUT:H-74;
    page.drawRectangle({x:M,y:ligne,width:W-2*M,height:1.6,color:c(ROUGE)});
    y=ligne-26;}
  function wrap(t,f,s,w){var out=[];propre(t).split("\n").forEach(function(par){var mots=par.split(" "),cur="";mots.forEach(function(m){var essai=cur?cur+" "+m:m;
    if(f.widthOfTextAtSize(essai,s)>w&&cur){out.push(cur);cur=m;while(f.widthOfTextAtSize(cur,s)>w&&cur.length>1){var k=cur.length;while(k>1&&f.widthOfTextAtSize(cur.slice(0,k),s)>w)k--;out.push(cur.slice(0,k));cur=cur.slice(k);}}else cur=essai;});out.push(cur);});return out;}
  function place(h){if(y-h<BAS+10)entete();}
  function txt(t,f,s,o){o=o||{};var x=M+(o.x||0),w=(o.w||(W-2*M-(o.x||0))),lines=wrap(t,f,s,w),lh=s*(o.lh||1.45);
    lines.forEach(function(l){place(lh);var xx=x;if(o.droite)xx=x+w-f.widthOfTextAtSize(l,s);if(o.centre)xx=x+(w-f.widthOfTextAtSize(l,s))/2;
      page.drawText(l,{x:xx,y:y-s,size:s,font:f,color:c(o.couleur||NOIR)});y-=lh;});y-=o.gap==null?6:o.gap;}
  function table(t){var cols=t.cols,ws=t.w||cols.map(function(){return 1;}),tot=ws.reduce(function(a,b){return a+b;},0),larg=W-2*M,cw=ws.map(function(v){return v/tot*larg;}),s=t.size||9,pad=4;
    function rangee(cells,f,fond,coul){var lignes=cells.map(function(v,i){return wrap(v==null?"":String(v),f,s,cw[i]-2*pad);}),h=Math.max.apply(null,lignes.map(function(l){return l.length;}))*s*1.35+2*pad;
      if(y-h<BAS+10){entete();if(f!==B&&!t.sansEntete)rangee(cols,B,[.97,.94,.95],ROUGE);}
      var x=M;if(fond)page.drawRectangle({x:M,y:y-h,width:larg,height:h,color:c(fond)});
      lignes.forEach(function(ls,i){var yy=y-pad-s;ls.forEach(function(l){var xx=x+pad;if(t.droite&&t.droite.indexOf(i)>=0)xx=x+cw[i]-pad-f.widthOfTextAtSize(l,s);page.drawText(l,{x:xx,y:yy,size:s,font:f,color:c(coul||NOIR)});yy-=s*1.35;});x+=cw[i];});
      page.drawLine({start:{x:M,y:y-h},end:{x:M+larg,y:y-h},thickness:.5,color:c(FILET)});y-=h;}
    if(t.titre){txt(t.titre,B,10,{gap:4});}
    if(!t.sansEntete)rangee(cols,B,[.97,.94,.95],ROUGE);(t.rows||[]).forEach(function(r){rangee(r,F);});y-=10;}
  function signatures(sig){y-=18;place(96);var n=sig.length,cw=(W-2*M)/n;sig.forEach(function(sg,i){var x=M+i*cw;
      page.drawText(propre(sg[0]),{x:x,y:y-10,size:9.5,font:B,color:c(NOIR)});if(sg[2])page.drawText(propre(sg[2]),{x:x,y:y-22,size:8,font:I,color:c(GRIS)});
      page.drawLine({start:{x:x,y:y-62},end:{x:x+cw-28,y:y-62},thickness:.5,color:c(GRIS)});if(sg[1])page.drawText(propre(sg[1]),{x:x,y:y-75,size:9.5,font:F,color:c(NOIR)});});y-=92;}
  function encadre(b){var ls=wrap(b.encadre,F,9.5,W-2*M-20),h=ls.length*9.5*1.45+16;place(h);
    page.drawRectangle({x:M,y:y-h,width:W-2*M,height:h,color:L.rgb(.985,.965,.97),borderColor:c(ROUGE),borderWidth:.6});
    var yy=y-8-9.5;ls.forEach(function(l){page.drawText(l,{x:M+10,y:yy,size:9.5,font:F,color:c(NOIR)});yy-=9.5*1.45;});y-=h+10;}
  entete();
  if(opt.reference||opt.date){var r=[opt.reference?"Réf. "+opt.reference:"",opt.date||""].filter(Boolean).join(" · ");txt(r,F,8.5,{droite:true,couleur:GRIS,gap:4});}
  blocs.forEach(function(b){
    if(b.h){y-=4;txt(b.h,B,14,{couleur:ROUGE,gap:10});}
    else if(b.h2){y-=6;place(80);txt(b.h2,B,11,{couleur:ROUGE,gap:5});}
    else if(b.h3){y-=2;place(60);txt(b.h3,B,10.2,{gap:3});}
    else if(b.p!=null){txt(b.p,F,10.2,{gap:7});}
    else if(b.pb!=null){txt(b.pb,B,10.2,{gap:7});}
    else if(b.pi!=null){txt(b.pi,I,9.5,{couleur:GRIS,gap:7});}
    else if(b.li!=null){var mo=/^(\d+)\.\s+([\s\S]*)$/.exec(String(b.li)),puce=mo?mo[1]+".":"•",ind=mo?24:18,ls=wrap(mo?mo[2]:b.li,F,10.2,W-2*M-ind);ls.forEach(function(l,i){place(14.8);if(i===0)page.drawText(puce,{x:M+(mo?2:5),y:y-10.2,size:10.2,font:B,color:c(ROUGE)});page.drawText(l,{x:M+ind,y:y-10.2,size:10.2,font:F,color:c(NOIR)});y-=14.8;});y-=2;}
    else if(b.kv){var kw=Math.min(210,Math.max.apply(null,b.kv.map(function(k){return B.widthOfTextAtSize(propre(k[0]),9.2);}))+14);b.kv.forEach(function(k){var ls=wrap(k[1]==null?"":String(k[1]),F,10,W-2*M-kw);place(14.5);page.drawText(propre(k[0]),{x:M,y:y-10,size:9.2,font:B,color:c(GRIS)});ls.forEach(function(l,i){if(i)place(14.5);page.drawText(l,{x:M+kw,y:y-10,size:10,font:F,color:c(NOIR)});y-=14.5;});});y-=6;}
    else if(b.table){table(b.table);}
    else if(b.encadre){encadre(b);}
    else if(b.r!=null){txt(b.r,F,10.2,{gap:14});}
    else if(b.r2!=null){txt(b.r2,F,10.2,{x:260,gap:22});}
    else if(b.sig){signatures(b.sig);}
    else if(b.saut){entete();}
    else if(b.sp){y-=b.sp;}
  });
  var pied=(blocs.filter(function(b){return b.f;})[0]||{}).f;
  var pages=doc.getPages();pages.forEach(function(pg,i){
    pg.drawLine({start:{x:M,y:BAS-18},end:{x:W-M,y:BAS-18},thickness:.5,color:c(FILET)});
    pg.drawText(propre(AS.abr+" · N° d'entreprise "+AS.num+" · "+AS.siege+" · "+AS.rpm),{x:M,y:BAS-30,size:6.8,font:F,color:c(GRIS)});
    if(pied){var pl=wrap(pied,F,6.8,W-2*M-50);pl.slice(0,2).forEach(function(l,k){pg.drawText(l,{x:M,y:BAS-40-k*8.5,size:6.8,font:F,color:c(GRIS)});});}
    var pn="Page "+(i+1)+" / "+pages.length;pg.drawText(pn,{x:W-M-F.widthOfTextAtSize(pn,7.5),y:BAS-30,size:7.5,font:B,color:c(ROUGE)});});
  return new Blob([await doc.save()],{type:"application/pdf"});}

/* Barre d'actions commune : aperçu, télécharger, imprimer, partager, enregistrer au registre. Chaque bouton confirme ce qu'il a fait, à côté de lui. */
function actions(zone,blob,nom,o){o=o||{};var url=URL.createObjectURL(blob),fichier=nom.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\w.\- ]+/g," ").trim().replace(/\s+/g,"-")+".pdf";
  zone.innerHTML='<div class="dacts"><a class="btn" href="'+url+'" target="_blank" rel="noopener">Aperçu</a><a class="btn" href="'+url+'" download="'+fichier+'">Télécharger le PDF</a><button type="button" class="btn" data-a="imp">Imprimer</button><button type="button" class="btn" data-a="par">Partager</button>'+(o.enregistrer?'<button type="button" class="btn p" data-a="reg">Enregistrer au registre</button>':'')+'<span class="dok" role="status"></span></div>';
  var ok=zone.querySelector(".dok");function dire(t,m){ok.className="dok"+(m?" bad":"");ok.textContent=t;}
  zone.querySelector('[data-a="imp"]').onclick=function(){var f=document.createElement("iframe");f.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0";f.src=url;document.body.appendChild(f);
    f.onload=function(){try{f.contentWindow.focus();f.contentWindow.print();dire("Impression ouverte.");}catch(e){window.open(url,"_blank");dire("Ouvert dans un onglet : utilisez Imprimer.");}setTimeout(function(){f.remove();},60000);};};
  zone.querySelector('[data-a="par"]').onclick=async function(){var file=new File([blob],fichier,{type:"application/pdf"});
    try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:nom,text:nom+" — "+AS.abr});dire("Partagé.");return;}}catch(e){if(e&&e.name==="AbortError"){dire("Partage annulé.");return;}}
    if(o.lienPartage){try{var l=await o.lienPartage();dire("");zone.querySelector(".dacts").insertAdjacentHTML("beforeend",'<a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(nom+" : "+l)+'">WhatsApp</a><a class="btn" href="mailto:?subject='+encodeURIComponent(nom+" — "+AS.abr)+'&body='+encodeURIComponent(nom+"\n\n"+l+"\n\nLien valable 7 jours.")+'">E-mail</a>');dire("Lien de partage prêt (7 jours).");}catch(e){dire("Partage impossible : "+(e.message||e),1);}}
    else{dire("Ce navigateur ne partage pas de fichier : téléchargez-le puis joignez-le.",1);}};
  var rg=zone.querySelector('[data-a="reg"]');if(rg)rg.onclick=async function(){rg.disabled=true;rg.textContent="Enregistrement…";try{var r=await o.enregistrer(blob,fichier);rg.textContent="Enregistré ✓";dire(r||"Déposé au registre de l’association.");}catch(e){rg.disabled=false;rg.textContent="Enregistrer au registre";dire("Non enregistré : "+(e.message||e),1);}};
}
var CSS='.dacts{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0}.dacts .btn{margin:0;padding:9px 13px;font:700 13.5px "Libre Franklin",Arial,sans-serif;border:1px solid #af4057;background:#fff;color:#af4057;text-decoration:none;cursor:pointer}.dacts .btn.p{background:#af4057;color:#fff}.dacts .btn:disabled{opacity:.6}.dok{font-size:13.5px;font-weight:600;color:var(--green,#1f8a4c)}.dok.bad{color:var(--brick,#b23a2b)}';
var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
window.DOCACRB={AS:AS,pdf:pdf,actions:actions,propre:propre,ROUGE:"#af4057"};
})();
