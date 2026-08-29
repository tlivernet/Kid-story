# Maquettes de la refonte

Sources du canvas de design publié pour la refonte de l’interface.

- `Actuel.dc.html` — l’écran de jeu tel qu’il est aujourd’hui, reproduit à partir
  de `css/app.css` et `index.html` (point de comparaison).
- `Reperes.dc.html` — jetons, contrastes mesurés, échelle typographique,
  tailles de contrôles : les valeurs à recopier dans le CSS.
- Direction A « Grand livre » : `Accueil.dc.html`, `Themes.dc.html`,
  `Main.dc.html` (lecture), `Epreuve.dc.html` (jeu de lecture CP).
- Directions alternatives : `DirectionB.dc.html` (« Théâtre de papier »),
  `DirectionC.dc.html` (« Veillée », mode du soir).
- `canvas.json` — disposition des planches et notes du canvas.

Chaque fichier est une maquette statique autonome, au format téléphone
390 × 844 (860 × 1120 pour les repères). Elles ne font pas partie de la PWA :
rien ici n’est chargé par `index.html`.

Les ratios de contraste annoncés dans `Reperes.dc.html` sont calculés (WCAG 2.1)
sur les couleurs exactes des maquettes ; le plus faible est à 5,1 pour un
minimum AA de 4,5.
