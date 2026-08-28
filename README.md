# 📖 Le Livre Magique

Un jeu d'histoires **dont l'enfant est le héros**, pensé pour un enfant de 6 ans qui apprend à lire.
Claude écrit l'histoire chapitre par chapitre, l'application la **lit à voix haute** en surlignant les mots,
**illustre** chaque scène, et l'enfant choisit la suite. Avec sac de quête, objets, compagnons et épreuves de dé.

C'est une **PWA 100 % statique** : aucun serveur, aucune compilation, elle s'héberge telle quelle sur **GitHub Pages**
et s'installe sur le téléphone ou la tablette comme une vraie application.

---

## Comment ça marche

| Élément | Choix technique |
|---|---|
| Histoire | API Claude (`/v1/messages`) appelée **directement depuis le navigateur**, en streaming, avec **sorties structurées** (`output_config.format`) : chaque chapitre est un JSON validé (texte, décor, objets, choix, dé, fin). |
| Cohérence | Le modèle tient un carnet de mémoire (3 à 5 faits) réécrit à chaque chapitre, et reçoit l'état du jeu complet (sac, quête, compagnon, cœurs) à chaque tour. L'historique envoyé reste court : c'est rapide et peu coûteux. |
| Lecture à voix haute | `SpeechSynthesis` du navigateur (voix française, gratuite, hors ligne). Phrase en cours surlignée, mot en cours surligné, et **l'enfant peut toucher n'importe quel mot pour l'entendre**. |
| Illustrations | Claude ne génère pas d'images. L'application **dessine elle-même** la scène en SVG (28 décors, jour/soir/nuit) à partir du lieu renvoyé par le modèle, avec les personnages en emojis animés. C'est instantané, joli et ça marche hors ligne. |
| Jeu | Sac de quête (6 objets max), cœurs de courage, étoiles, compagnons, choix qui exigent un objet, épreuves au dé à 6 faces (+1 si un compagnon accompagne le héros). |
| Hors ligne | Un service worker met l'app en cache et un **mode démo** fabrique des histoires sur l'appareil, sans clé API. |

### Sécurité de l'histoire
Le prompt système interdit la violence, la mort, la peur, les séparations tristes : les « méchants » sont maladroits
et deviennent souvent des amis, un échec au dé est drôle et jamais humiliant, et le héros ne peut pas « perdre ».
Le secours automatique côté serveur (`fallbacks`) est activé pour éviter qu'un chapitre reste bloqué.

---

## Installation

### 1. Publier sur GitHub Pages

Le dépôt est déjà prêt : `Réglages → Pages → Source : GitHub Actions`.
À chaque push sur `main`, le workflow `.github/workflows/pages.yml` lance les tests puis publie le site.
L'application sera disponible sur `https://<utilisateur>.github.io/Kid-story/`.

> Tout est en chemins relatifs (`./`), donc le sous-dossier `/Kid-story/` ne pose aucun problème.

### 2. Créer une clé API

1. Aller sur [console.anthropic.com](https://console.anthropic.com/settings/keys) et créer une clé.
2. **Fixer une limite de dépense mensuelle** (Settings → Limits) : c'est la protection principale.
3. Dans l'application : `⚙️ Réglages` → répondre à la petite multiplication (portail parental) → coller la clé → `Tester la clé`.

La clé est enregistrée dans le `localStorage` **de cet appareil uniquement** et n'est envoyée qu'à `api.anthropic.com`.

### 3. Installer sur le téléphone

Ouvrir le site dans Chrome (Android) ou Safari (iOS) → « Ajouter à l'écran d'accueil ».
L'application s'ouvre alors en plein écran, sans barre d'adresse.

---

## À savoir avant de donner la tablette à l'enfant

- **La clé est dans le navigateur.** C'est inévitable pour une application sans serveur : quiconque a l'appareil
  déverrouillé peut lire la clé dans les outils développeur. C'est acceptable pour un usage familial avec une
  limite de dépense ; ce ne le serait pas pour une application publique. Pour une diffusion large, il faudrait
  un petit proxy (Cloudflare Worker, Vercel…) qui garde la clé côté serveur — GitHub Pages ne peut pas le faire.
- **Coût.** Un chapitre = environ 1 500 jetons en entrée et 400 en sortie. Avec Claude Opus 5, une aventure de
  12 chapitres revient à quelques dizaines de centimes. Les réglages permettent de choisir Sonnet 5 ou Haiku 4.5
  (plus rapides et moins chers) si l'on préfère.
- **Voix.** La qualité dépend de l'appareil. iOS et Android ont de très bonnes voix françaises ; sous Linux il faut
  parfois installer une voix (`espeak-ng`, `speech-dispatcher`).
- **Confidentialité.** Le prénom du héros et les choix sont envoyés à l'API Claude pour écrire la suite. Rien
  d'autre ne quitte l'appareil (pas d'analytics, pas de cookies, pas de compte).

---

## Développement

```bash
npm start          # sert le site sur http://localhost:8080
npm test           # tests du client API (flux SSE, erreurs, replis)
npm run icons      # régénère les icônes PNG de la PWA
```

Aucune dépendance à installer : tout est en JavaScript natif (modules ES), sans build.

```
index.html            écrans (accueil, thème, héros, jeu, fin, carnet, réglages)
css/app.css           thème clair et sombre, grosses cibles tactiles
js/api.js             appel Claude en streaming + lecture partielle du JSON
js/prompt.js          consignes de narration et schéma JSON du chapitre
js/scene.js           moteur d'illustration SVG (décors, météo, personnages)
js/tts.js             lecture à voix haute, surlignage, contournements iOS/Chrome
js/state.js           état de l'aventure, sac, mémoire, historique
js/demo.js            générateur d'histoires hors ligne
js/app.js             enchaînement des écrans et boucle de jeu
sw.js                 mise en cache hors ligne
```

### Ajouter un décor

1. Ajouter son nom dans `LIEUX` (`js/config.js`) — la liste est envoyée au modèle comme énumération.
2. Ajouter une recette dans `RECETTES` (`js/scene.js`) : couleurs du sol, éléments de fond, éléments d'avant-plan.

---

## Licence

MIT.
