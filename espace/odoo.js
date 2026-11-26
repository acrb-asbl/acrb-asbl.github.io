/* Intégration Odoo (demande de Karim du 26/11/2026, registre n° 47 ; revue ChatGPT du 26/11 intégrée).
   Trésorier et conseil : « Lire Odoo (aperçu) » ne change rien ; « Appliquer » (trésorier seul) écrit exactement le lot vu.
   Profils provisoires : jamais d'accès automatique ; le membre demande, le trésorier ou le conseil vérifie, relie ou fusionne.
   Membre : depuis son espace, il demande à retrouver ses factures (par son adresse e-mail ou par code SMS). */
(function () {
  var URL_SB = "https://movoukcjirtjnqjgwndw.supabase.co", CLE = "sb_publishable_jVXX4nAfC5F0wzj_FedaAQ_WhzzN_O6";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function eur(n) { return (Number(n) || 0).toLocaleString("fr-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"; }
  function dt(s) { if (!s) return ""; var d = new Date(s); return isNaN(d) ? "" : d.toLocaleDateString("fr-BE") + " à " + d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" }); }
  function pl(n, un, plus) { return n + " " + (n > 1 ? (plus || un + "s") : un); }
  var css = document.createElement("style");
  css.textContent = ".od_ap{margin-top:12px;border:1px solid var(--line,#d9dee7);background:#fff;padding:14px 16px}.od_ap h4{margin:0 0 8px;font:800 15px 'Libre Franklin',Arial,sans-serif}"
    + ".od_k{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:8px 0}.od_k div{border:1px solid var(--line,#d9dee7);padding:8px 10px;min-width:0}.od_k b{display:block;font:800 20px 'Libre Franklin',Arial,sans-serif}.od_k span{font-size:13.5px;color:#4a5466}@media(max-width:560px){.od_k{grid-template-columns:repeat(2,minmax(0,1fr))}}"
    + ".od_pb{margin:8px 0 0;padding-left:18px;font-size:14px}.od_pb li{margin:2px 0}.od_row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;border-top:1px solid var(--line,#d9dee7);padding:9px 0}.od_row:first-child{border-top:0}"
    + ".od_row .id{min-width:0;flex:1 1 260px;overflow-wrap:anywhere}.od_row .acts{display:flex;flex-wrap:wrap;gap:6px}.od_row button,.od_ap .docs button{margin:0}"
    + ".od_m{margin-top:16px;border-top:1px solid var(--line,#d9dee7);padding-top:12px}.od_m form{display:flex;flex-wrap:wrap;gap:8px;align-items:stretch;margin-top:8px}.od_m form[hidden]{display:none}.od_m input{flex:1 1 180px;min-width:0;padding:10px 11px;border:1px solid #c6ccd6;font:16px 'Source Sans 3',sans-serif}.od_m .btn{margin-top:0}";
  document.head.appendChild(css);

  // ------------------------------------------------------------------------------------------ trésorier et conseil
  var T = { sb: null, treso: false };
  function boite() {
    var b = document.getElementById("od_ap");
    if (!b) { b = document.createElement("div"); b.id = "od_ap"; b.className = "od_ap"; b.hidden = true; var st = document.getElementById("odoo_state"); st.parentNode.insertBefore(b, st.nextSibling); }
    return b;
  }
  function apercu(d, sync, source) {
    var a = d || {}, k = a.detail || {}, b = boite(); b.hidden = false;
    var probl = (a.problemes || []).slice(0, 12).map(function (p) { return "<li>" + esc((p.ref ? p.ref + " — " : "") + (p.nom ? p.nom + " : " : "") + p.motif) + "</li>"; }).join("");
    b.innerHTML = "<h4>Aperçu de la lecture " + (source === "csv" ? "du fichier Odoo" : "d'Odoo") + " — rien n'est encore enregistré</h4>"
      + '<div class="od_k">'
      + "<div><b>" + (a.documents || 0) + "</b><span>pièces lues (" + (k.avoirs || 0) + " avoirs)</span></div>"
      + "<div><b>" + (k.payees || 0) + "</b><span>payées</span></div>"
      + "<div><b>" + ((k.ouvertes || 0) + (k.en_retard || 0)) + "</b><span>impayées, dont " + (k.en_retard || 0) + " en retard</span></div>"
      + "<div><b>" + eur(a.reste_du) + "</b><span>reste dû sur " + eur(a.total_facture) + " facturés</span></div>"
      + "<div><b>" + (a.relies || 0) + "</b><span>clients reliés à une fiche existante</span></div>"
      + "<div><b>" + (a.a_creer || 0) + "</b><span>profils provisoires à créer, sans accès</span></div>"
      + "</div>"
      + '<p style="margin:6px 0 0;font-size:14.5px">' + (k.deja ? pl(k.deja, "pièce") + " déjà reprise" + (k.deja > 1 ? "s" : "") + " : elle" + (k.deja > 1 ? "s seront mises" : " sera mise") + " à jour, sans doublon. " : "")
      + (a.conflits ? pl(a.conflits, "client") + " avec plusieurs fiches possibles : gardé" + (a.conflits > 1 ? "s" : "") + " à part, à fusionner. " : "")
      + (a.a_verifier ? pl(a.a_verifier, "profil") + " ressemble" + (a.a_verifier > 1 ? "nt" : "") + " à une fiche existante (même GSM ou numéro d'entreprise) : proposé" + (a.a_verifier > 1 ? "s" : "") + " à la fusion, jamais relié" + (a.a_verifier > 1 ? "s" : "") + " seul" + (a.a_verifier > 1 ? "s" : "") + ". " : "")
      + "Aucun profil n'ouvre d'accès ; rien n'entre au registre légal des membres.</p>"
      + (probl ? '<ul class="od_pb">' + probl + "</ul>" : "")
      + '<div class="docs" style="margin-top:10px">' + (T.treso ? '<button class="btn" type="button" id="od_go">Appliquer ces ' + (a.documents || 0) + " pièces</button>" : '<span class="soon" style="margin:0">Seul le trésorier applique l\'aperçu.</span>')
      + '<button class="btn o" type="button" id="od_x">Fermer</button></div><p class="soon" id="od_r" role="status"></p>';
    document.getElementById("od_x").onclick = function () { b.hidden = true; };
    var go = document.getElementById("od_go");
    if (go) go.onclick = function () {
      go.disabled = true; var r = document.getElementById("od_r"); r.textContent = "Enregistrement…";
      T.sb.rpc("acrb_odoo_appliquer", { p_sync: sync }).then(function (x) {
        if (x.error) { r.textContent = "Échec : " + x.error.message; go.disabled = false; return; }
        var d = x.data; go.remove();
        r.innerHTML = esc(pl(d.factures_creees, "facture") + " ajoutée" + (d.factures_creees > 1 ? "s" : "") + ", " + pl(d.factures_mises_a_jour, "mise à jour", "mises à jour") + ", " + pl(d.avoirs, "avoir") + ", " + pl(d.contacts_crees, "profil provisoire", "profils provisoires") + ".")
          + ' <button class="btn o" type="button" id="od_undo" style="margin:0 0 0 6px;padding:6px 10px">Défaire cet import</button>';
        document.getElementById("od_undo").onclick = function () {
          var u = this; u.disabled = true;
          T.sb.rpc("acrb_odoo_defaire", { p_sync: sync }).then(function (y) { r.textContent = y.error ? "Échec : " + y.error.message : "Import défait : " + y.data.factures_retirees + " pièce(s) et " + y.data.contacts_retires + " profil(s) provisoire(s) retirés."; rafraichir(); });
        };
        rafraichir();
      });
    };
    b.scrollIntoView({ block: "nearest" });
  }
  function rafraichir() { try { if (window.loadFac) (window.loadFac.rendre || window.loadFac)(); } catch (e) { } profils(); }
  function lire(btn) {
    var st = document.getElementById("odoo_state"); btn.disabled = true; st.textContent = "Lecture d'Odoo… (jusqu'à une minute)";
    T.sb.functions.invoke("acrb-odoo", { body: {} }).then(function (x) {
      btn.disabled = false; var d = x.data || {};
      if (x.error && !d.erreur) { st.textContent = "Échec : la fonction Odoo ne répond pas (" + (x.error.message || "erreur") + ")."; return; }
      if (d.etat === "non_configure") { st.textContent = "Enregistrez d'abord la connexion Odoo (adresse, identifiant et clé API)."; return; }
      if (d.erreur) { st.textContent = d.erreur; return; }
      st.textContent = "Odoo lu en " + Math.round((d.duree_ms || 0) / 1000) + " s.";
      apercu(d.apercu, d.sync, "api");
    });
  }
  // export CSV d'Odoo (Facturation › Factures › tout sélectionner › Exporter) : colonnes reconnues en français et en anglais
  var COL = { ref: ["numéro", "numero", "number", "name"], nom: ["partenaire", "client", "partner", "customer", "partner_id"], email: ["e-mail", "email", "courriel", "partner_id/email"],
    gsm: ["mobile", "gsm", "téléphone", "telephone", "phone"], bce: ["n° tva", "tva", "vat", "numéro de tva", "bce"], montant: ["total", "montant total", "amount_total", "total signé"],
    residu: ["montant dû", "montant du", "amount due", "amount_residual", "reste dû", "montant dû signé"], date: ["date de facturation", "date de la facture", "invoice date", "invoice_date", "date"],
    echeance: ["date d'échéance", "date d'echeance", "échéance", "due date", "invoice_date_due"], paiement: ["état du paiement", "statut du paiement", "payment status", "payment_state"],
    statut: ["statut", "état", "status", "state"], type: ["type", "move_type"], communication: ["référence de paiement", "communication", "payment_reference"], objet: ["origine", "source", "référence", "invoice_origin", "ref"] };
  function csvLignes(txt, parse) {
    var R = parse(txt); if (R.length < 2) return [];
    var h = R[0].map(function (x) { return String(x).trim().toLowerCase(); }), idx = {};
    Object.keys(COL).forEach(function (k) { for (var i = 0; i < COL[k].length; i++) { var j = h.indexOf(COL[k][i]); if (j >= 0) { idx[k] = j; break; } } });
    function v(r, k) { return idx[k] == null ? "" : String(r[idx[k]] == null ? "" : r[idx[k]]).trim(); }
    function num(s) { s = String(s || "").replace(/[^\d,.\-]/g, ""); if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", "."); else s = s.replace(/,/g, ""); var n = parseFloat(s); return isNaN(n) ? null : Math.abs(n); }
    function dte(s) { var m = String(s || "").match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/); if (m) return m[3] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[1]).slice(-2); m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : null; }
    return R.slice(1).filter(function (r) { return r.join("").trim(); }).map(function (r) {
      var p = v(r, "paiement").toLowerCase(), s = v(r, "statut").toLowerCase(), t = v(r, "type").toLowerCase();
      var etat = /avoir|refund|credit/.test(t) ? "avoir" : /annul|cancel/.test(s) ? "annulee" : /partiel|partial/.test(p) ? "partielle" : /^pay|paid|in_payment|en paiement/.test(p) ? "payee" : "ouverte";
      return { ref: v(r, "ref") || null, nom: v(r, "nom") || null, email: v(r, "email") || null, gsm: v(r, "gsm") || null, bce: v(r, "bce") || null, montant: num(v(r, "montant")), residu: num(v(r, "residu")),
        date: dte(v(r, "date")), echeance: dte(v(r, "echeance")), etat: etat, etat_odoo: p || null, communication: v(r, "communication") || null, objet: v(r, "objet") || null, devise: "EUR" };
    }).filter(function (l) { return l.ref; });
  }

  // profils provisoires et demandes des membres
  function profils() {
    var el = document.getElementById("od_prof"); if (!el || !T.sb) return;
    T.sb.rpc("acrb_profils_odoo").then(function (x) {
      if (x.error) { el.innerHTML = ""; return; }
      var d = x.data || {}, D = d.demandes || [], C = d.contacts || [];
      if (!D.length && !C.length) { el.innerHTML = ""; return; }
      el.innerHTML = '<b style="font:800 14px \'Libre Franklin\',Arial,sans-serif;display:block;margin-top:14px">Profils repris d\'Odoo</b>'
        + '<p style="margin:4px 0 6px;font-size:14.5px">' + pl(C.length, "profil provisoire", "profils provisoires") + " portant " + pl(d.factures_provisoires || 0, "facture") + ". Personne ne les voit tant que le rattachement n'est pas validé ici.</p>"
        + (D.length ? '<div class="calist">' + D.map(function (r) {
          return '<div class="od_row"><div class="id"><b>Demande : ' + esc(r.email) + "</b><br><span class=\"soon\" style=\"margin:0\">veut retrouver le profil « " + esc(r.nom) + " » (" + pl(r.factures, "facture") + ") · vérifié par " + (r.moyen === "sms" ? "code SMS sur le " + esc(r.gsm) : "son adresse e-mail, identique à celle d'Odoo") + " · " + esc(dt(r.cree_le)) + "</span></div>"
            + '<div class="acts"><button class="btn" type="button" data-ok="' + r.id + '">Accepter</button><button class="btn o" type="button" data-no="' + r.id + '">Refuser</button></div></div>';
        }).join("") + "</div>" : "")
        + (C.length ? '<div class="calist">' + C.map(function (c) {
          var pr = (c.proches || []).map(function (p) { return '<button class="btn o" type="button" data-fu="' + c.id + '" data-cible="' + p.id + '">Fusionner avec « ' + esc(p.nom) + " »</button>"; }).join("");
          return '<div class="od_row"><div class="id"><b>' + esc(c.nom) + "</b><br><span class=\"soon\" style=\"margin:0\">" + esc([c.odoo_email, c.tel].filter(Boolean).join(" · ") || "sans coordonnées") + " · " + pl(c.factures, "facture") + ", " + c.ouvertes + " ouverte" + (c.ouvertes > 1 ? "s" : "") + (c.relie_le ? " · relié à " + esc(c.email) : " · en attente du membre") + "</span></div>"
            + (pr ? '<div class="acts">' + pr + "</div>" : "") + "</div>";
        }).join("") + "</div>" : "")
        + '<p class="soon" id="od_pst" role="status"></p>';
      var pst = document.getElementById("od_pst");
      function fin(y) { if (y.error) pst.textContent = "Échec : " + y.error.message; else profils(); rafraichir0(); }
      el.querySelectorAll("[data-ok],[data-no]").forEach(function (b) { b.onclick = function () { b.disabled = true; T.sb.rpc("acrb_profil_odoo_decider", { p_demande: +(b.dataset.ok || b.dataset.no), p_accepter: !!b.dataset.ok }).then(fin); }; });
      el.querySelectorAll("[data-fu]").forEach(function (b) { b.onclick = function () { b.disabled = true; T.sb.rpc("acrb_odoo_fusionner", { p_provisoire: b.dataset.fu, p_cible: b.dataset.cible }).then(fin); }; });
    });
  }
  function rafraichir0() { try { if (window.loadFac) (window.loadFac.rendre || window.loadFac)(); } catch (e) { } }

  window.ODOO = {
    init: function (sb, roles, csvParse) {
      T.sb = sb; T.treso = (roles || []).indexOf("tresorier") >= 0;
      var b = document.getElementById("odoo_sync"); if (!b) return;
      b.textContent = "Lire Odoo (aperçu)"; b.setAttribute("data-aide", "Lit toutes les factures et tous les avoirs d'Odoo et montre ce qui changerait. Rien n'est enregistré avant « Appliquer ».");
      b.onclick = function () { lire(b); };
      if (!document.getElementById("od_csv")) {
        var l = document.createElement("label"); l.className = "btn o"; l.style.cssText = "cursor:pointer;margin:0;padding:9px 14px";
        l.innerHTML = 'Ou un export Odoo (CSV)<input type="file" id="od_csv" accept=".csv,text/csv" hidden>'; b.parentNode.appendChild(l);
        l.setAttribute("data-aide", "Pour un plan Odoo sans accès API : dans Odoo, Facturation › Factures, tout sélectionner, Exporter en CSV, puis choisir le fichier ici. Même aperçu, même contrôle.");
        document.getElementById("od_csv").onchange = function () {
          var f = this.files[0], st = document.getElementById("odoo_state"); if (!f) return; this.value = ""; st.textContent = "Lecture du fichier…";
          f.text().then(function (t) {
            var L = csvLignes(t, csvParse); if (!L.length) { st.textContent = "Aucune facture reconnue : il faut au moins les colonnes Numéro et Total."; return; }
            T.sb.rpc("acrb_odoo_csv_apercu", { p_lignes: L }).then(function (x) { if (x.error) { st.textContent = "Échec : " + x.error.message; return; } st.textContent = "Fichier lu."; apercu(x.data.apercu, x.data.sync, "csv"); });
          });
        };
      }
      var f = document.getElementById("odoo"); if (f && !document.getElementById("od_prof")) { var p = document.createElement("div"); p.id = "od_prof"; f.parentNode.appendChild(p); }
      profils();
    },
    csvLignes: csvLignes
  };

  // ------------------------------------------------------------------------------------------ membre (espace commerçant)
  window.ODOO_MEMBRE = {
    rendre: function (el, sb) {
      if (!el) return;
      el.className = "od_m";
      el.innerHTML = '<b style="font:800 15px \'Libre Franklin\',Arial,sans-serif">Vous avez reçu des factures de l\'association ?</b>'
        + '<p style="margin:4px 0 0">Demandez à retrouver vos factures ici. Le trésorier vérifie votre demande, puis relie votre profil : rien n\'est montré avant.</p>'
        + '<div class="docs" style="margin-top:8px"><button class="btn o" type="button" id="od_mail" style="margin:0">Avec mon adresse de connexion</button></div>'
        + '<form id="od_sms" novalidate><input id="od_gsm" type="tel" inputmode="tel" autocomplete="tel" placeholder="Ou votre GSM : 0470 12 34 56" aria-label="Numéro de GSM"><button class="btn o" type="submit">Recevoir un code par SMS</button></form>'
        + '<form id="od_code" hidden novalidate><input id="od_c" inputmode="numeric" autocomplete="one-time-code" placeholder="Code reçu par SMS" aria-label="Code reçu par SMS"><button class="btn" type="submit">Valider le code</button></form>'
        + '<p class="soon" id="od_mst" role="status"></p>';
      var st = el.querySelector("#od_mst"), gsm = "";
      function demander(g, j) { return sb.rpc("acrb_profil_odoo_demander", { p_gsm: g, p_jeton: j }).then(function (x) { st.textContent = x.error ? "Échec : " + x.error.message : x.data.message; }); }
      el.querySelector("#od_mail").onclick = function () { this.disabled = true; st.textContent = "Envoi de la demande…"; demander(null, null); };
      function norm(v) { var d = String(v || "").replace(/\D/g, ""); if (/^0032/.test(d)) d = d.slice(2); if (/^0[0-9]{8,9}$/.test(d)) d = "32" + d.slice(1); return d.length >= 8 ? "+" + d : ""; }
      function verif(o) { return fetch(URL_SB + "/functions/v1/acrb-verif", { method: "POST", headers: { "Content-Type": "application/json", apikey: CLE, Authorization: "Bearer " + CLE }, body: JSON.stringify(o) }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j || {} }; }); }); }
      el.querySelector("#od_sms").onsubmit = function (e) {
        e.preventDefault(); gsm = norm(el.querySelector("#od_gsm").value);
        if (!gsm) { st.textContent = "Numéro de GSM incomplet."; return; }
        st.textContent = "Envoi du code…";
        verif({ action: "start", gsm: gsm }).then(function (r) {
          if (!r.ok) { st.textContent = "Le code n'a pas pu être envoyé : " + (r.j.erreur || r.j.error || "réessayez dans un instant") + "."; return; }
          el.querySelector("#od_code").hidden = false; el.querySelector("#od_c").focus(); st.textContent = "Code envoyé au " + gsm + ".";
        }).catch(function () { st.textContent = "Le code n'a pas pu être envoyé : réessayez dans un instant."; });
      };
      el.querySelector("#od_code").onsubmit = function (e) {
        e.preventDefault(); var c = el.querySelector("#od_c").value.replace(/\D/g, ""); if (c.length < 4) { st.textContent = "Code incomplet."; return; }
        st.textContent = "Vérification…";
        verif({ action: "check", gsm: gsm, code: c }).then(function (r) {
          if (!r.ok || !r.j.jeton) { st.textContent = "Code incorrect ou expiré."; return; }
          el.querySelector("#od_code").hidden = true; demander(gsm, r.j.jeton);
        }).catch(function () { st.textContent = "Vérification impossible : réessayez."; });
      };
    }
  };
})();
