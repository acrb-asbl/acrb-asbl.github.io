# Porte de publication de la plateforme ACRB

**Ne plus jamais pousser directement sur `main`.** On pousse sur la branche `travail`.

1. La porte (`.github/workflows/porte.yml`) teste la copie du commit : 15 écrans × iPhone 13 (WebKit) et Pixel 7 (Chromium), sans session, avec clics sur les boutons sans effet. Elle déroule aussi le parcours du trésorier et vérifie qu'il ne reste aucune donnée d'essai dans la base.
2. Si c'est rouge, la publication est refusée et `main` ne bouge pas.
3. Si c'est vert, `main` avance et GitHub Pages publie. Le site en ligne est alors re-testé ; s'il est rouge, `main` revient automatiquement au commit précédent et un ticket est ouvert.
4. Le cliquet : `rouges-connus.json` liste les rouges déjà connus, qui ne bloquent pas. Tout rouge nouveau bloque. Quand un rouge connu est corrigé, on le retire de la liste.
5. Chaque nuit (`nuit.yml`), le robot universel lit et clique les vrais boutons, en lecture seule. La porte repasse sur le site en ligne, et la valeur du jour est mesurée (`acrb_valeur`). Chaque rouge devient un ticket « correction ». Une baisse de valeur sous 50 % de la moyenne des 7 jours désigne la publication du jour pour un retour arrière (ticket « retour-arriere »).

Garde de lecture seule : aucune écriture vers la base ne sort du navigateur pendant les tests. Seules les lectures par fonction sont permises.
