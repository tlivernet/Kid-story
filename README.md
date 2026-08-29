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
| Lecture à voix haute | Deux voix au choix : celle du navigateur (gratuite, hors ligne) ou **Google Cloud Text-to-Speech** (bien plus jolie). Phrase en cours surlignée, mot en cours surligné, et **l'enfant peut toucher n'importe quel mot pour l'entendre**. |
| Enfant qui ne lit pas | **Les choix sont lus à voix haute** l'un après l'autre, la carte correspondante s'allume pendant sa lecture. Chaque choix a un **numéro, une couleur et un gros emoji**. Un appui sélectionne la tuile, la fait relire, puis **une jauge se remplit en trois secondes** avant que l'aventure continue : toucher une autre tuile change d'avis, retoucher la même part tout de suite. Les choix n'apparaissent qu'**après la lecture du chapitre** (bouton ⏭️ pour les afficher tout de suite). |
| Épreuves | Un **dé** qui montre noir sur blanc ce qu'il faut obtenir (les faces gagnantes sont entourées de vert, l'objectif est dit à voix haute), ou quatre **mini-jeux** jouables sans savoir lire : jeu de mémoire, attrape les amis, trouve l'intrus, tape vite. Leur difficulté suit celle que le modèle a fixée pour l'épreuve. Réglable : dé seul, mini-jeux seuls, ou mélange. |
| Écran qui reste allumé | Un verrou d'écran (Wake Lock) est pris pendant l'aventure et repris au retour en avant-plan : la tablette ne s'éteint plus au milieu d'un chapitre. |
| Résumé | Un bouton 📜 rappelle à tout moment où en est l'histoire : chapitre, mission, compagnons, sac, ce qui s'est passé — lu à voix haute, sans appel à l'API. |
| Richesse du récit | Arc en neuf étapes (ouverture → rencontre → complication → coup dur → idée maligne → dénouement), **graines narratives** plantées puis payées, troupe de personnages avec leurs manies, un détail sensoriel par chapitre. |
| Illustrations | Claude ne génère pas d'images. L'application **dessine elle-même** la scène en SVG (28 décors, jour/soir/nuit) à partir du lieu renvoyé par le modèle, avec les personnages en emojis animés. C'est instantané, joli et ça marche hors ligne. |
| Jeu | Sac de quête (6 objets max), **cœurs de courage**, étoiles, compagnons, choix qui exigent un objet, épreuves, **rencontres costaudes** en plusieurs manches, **carte des lieux visités** pour revenir se balader. |
| Hors ligne | Un service worker met l'app en cache et un **mode démo** fabrique des histoires sur l'appareil, sans clé API. |

### Ce qui donne de la richesse au récit
L'application n'envoie pas seulement « écris la suite ». À chaque tour, le modèle reçoit :
- **l'étape du récit** où l'on se trouve (l'arc est calculé à partir du numéro de chapitre et de la longueur choisie) ;
- **la troupe** : les personnages rencontrés, avec la manie de chacun, à réutiliser ;
- **les graines en attente** : les détails plantés dans les chapitres précédents qui n'ont pas encore servi.
  Le modèle doit en planter de nouvelles et en faire fleurir d'anciennes ; l'application suit les deux et
  reconnaît une graine même si elle est reformulée.

C'est ce qui distingue une suite de saynètes d'une vraie histoire. Le réglage « Richesse du récit » passe de
4-5 phrases simples à 6-8 phrases avec dialogues et détails — un enfant qui écoute (au lieu de lire)
suit sans peine des chapitres plus fournis.

Deux règles de style comptent autant que le reste : la **première phrase de chaque chapitre dit ce que le choix
de l'enfant vient de produire** (on ne peut pas relire en arrière quand on écoute), et le texte enchaîne ses
phrases avec des mots de liaison au lieu de les hacher — c'est plus facile à suivre, et moins bébé.

### Des objets qui ne se répètent pas
Le modèle, laissé libre, propose toujours la même lanterne et le même sifflet. L'application lui envoie donc à
chaque tour **huit trésors tirés au sort** dans une réserve de 80 (une boussole qui montre ce qu'on a perdu, un
caillou tiède qui chauffe près du danger, une pelote qui montre le chemin du retour…) et la liste des objets
**déjà offerts précédemment**, à ne pas reprendre.

Cette mémoire est écrite **dès qu'un objet est offert**, pas à la fin de l'aventure : la plupart des parties
d'un enfant de six ans s'arrêtent en cours de route, et une mémoire alimentée seulement par les aventures
terminées serait restée vide. Il en va de même pour les situations de départ, retenues dès le premier chapitre.
Le bouton « Tout effacer » des réglages remet cette mémoire à zéro.

### Deux parties sur le même thème ne se ressemblent pas
Au démarrage, l'application tire une **carte d'inspiration** : une situation de départ, un compagnon, un objet
insolite, un retournement à préparer et un ton, parmi plus de 13 000 combinaisons. Les débuts déjà utilisés
dans les six dernières aventures sont écartés du tirage. Le retournement est rappelé au modèle à chaque tour
pour qu'il l'amène au bon moment. Sans cela, le même thème produit systématiquement la même ouverture : les
paramètres d'échantillonnage (`temperature`) n'existent plus sur les modèles récents, la variété doit donc
venir du prompt.

### Le courage sert vraiment à quelque chose
Les trois cœurs sont le courage du héros. **Une épreuve ratée coûte un cœur** — c'est la seule vraie sanction,
et elle est calculée par l'application, pas par le modèle, pour que l'enfant voie le lien.
À zéro cœur, **l'histoire ne s'arrête pas** : un ami vient à la rescousse, un objet du sac est perdu, une étoile
s'envole, et l'aventure repart avec deux cœurs. C'est la version clémente du « livre dont on est le héros » :
on perd quelque chose, jamais la partie. Le réglage *Difficulté* propose **Tendre** (aucun cœur perdu),
**Normale** ou **Corsée** (épreuves d'un cran plus dures).

### Rencontres costaudes
Environ une fois par aventure, le modèle fait se dresser un adversaire (`adversaire_coeurs` de 1 à 3) — un troll
grognon, une oie têtue, un dragon chatouilleux, jamais rien d'effrayant. L'application prend alors la main et
met en scène un affrontement en plusieurs manches : à chaque manche l'enfant choisit **Foncer**, **Viser juste**
ou **Lui parler**, ce qui déclenche un dé ou un mini-jeu. Chaque réussite entame le courage de l'adversaire,
chaque échec celui du héros. Le résultat est renvoyé au modèle, qui raconte la suite — on ne blesse personne,
on convainc, on amadoue, on fait rire.

### Se balader
Chaque chapitre nomme son décor (`lieu_nom`). Le bouton 📜 liste les endroits déjà visités : en toucher un
demande un **chapitre de balade** court (2-3 phrases, pas de nouvelle péripétie) pour y retourner, comme quand
on feuillette en arrière dans un livre-jeu.

### Détails qui comptent sur une tablette d'enfant
- **L'écran reste allumé** pendant l'aventure (Wake Lock), y compris après un passage en arrière-plan.
- **Toucher un mot** le fait répéter, puis **l'histoire repart de la phrase en cours** au lieu de s'arrêter là.
- Un **défilement du doigt** n'est plus pris pour un appui sur un mot.
- Si la voix se bloque, un chien de garde révèle les choix — et les énonce quand même si la voix fonctionne.

### Quand le modèle rend un chapitre inutilisable
Un chapitre sans une seule phrase, sans aucun choix, ou qui prétend conclure l'histoire au bout de deux pages
n'est pas appliqué : il est **relancé automatiquement** avec une consigne explicite, et l'incident est tracé.
Une fin n'est acceptée qu'à partir de la moitié de la longueur prévue. Un chapitre coupé par la limite de
jetons (`stop_reason: max_tokens`) est signalé au lieu d'être relu de travers.

Et surtout : une aventure marquée « terminée » **reste ouvrable** depuis l'accueil, avec un bouton
*Continuer quand même* sur l'écran de fin et dans les choix — une fin annoncée par erreur ne peut plus
enterrer définitivement une histoire en cours.

### Quand quelque chose se passe mal
- Une requête qui reste **muette plus de 30 secondes** est abandonnée et l'erreur est affichée, au lieu de
  laisser tourner l'animation d'écriture indéfiniment.
- Toute erreur JavaScript imprévue affiche une carte « Un pépin a interrompu l'histoire » avec
  *Réessayer*, *Continuer en mode démo* et *Accueil* — plus jamais d'écran vide sans explication.
- Les huit derniers incidents sont listés en bas de l'écran des réglages (utile pour rapporter un problème).
- Une partie enregistrée par une version plus ancienne est **complétée automatiquement** au chargement :
  les champs ajoutés depuis (troupe, graines, chapitres) ne peuvent plus faire échouer une reprise.

### Sécurité de l'histoire
Le prompt système interdit la violence, la mort, la peur, les séparations tristes : les « méchants » sont maladroits
et deviennent souvent des amis, un échec au dé est drôle et jamais humiliant, et le héros ne peut pas « perdre ».
Le secours automatique côté serveur (`fallbacks`) est activé pour éviter qu'un chapitre reste bloqué.

---

## Installation

### 1. Publier sur GitHub Pages

`Réglages → Pages → Source : Deploy from a branch`, en choisissant la branche du projet et le dossier `/ (root)`.
GitHub reconstruit le site à chaque push ; l'application est servie sur
`https://<utilisateur>.github.io/Kid-story/`.

> Tout est en chemins relatifs (`./`), donc le sous-dossier `/Kid-story/` ne pose aucun problème.
> Le fichier `.nojekyll` évite que GitHub n'essaie de traiter le site avec Jekyll.

Le workflow `.github/workflows/tests.yml` lance les tests à chaque push — il ne publie rien, la publication
étant assurée par Pages lui-même.

**Après une mise à jour, l'application affiche encore l'ancienne version ?** Le service worker sert d'abord ce
qu'il a en cache. Depuis la version 1.1.0 il interroge le réseau en premier et la nouvelle version s'installe
au rechargement suivant (ou au retour à l'accueil, pour ne pas couper une histoire en cours). En cas de doute :
fermer complètement l'onglet ou l'application installée, puis la rouvrir. Le numéro de version est affiché en
bas de l'écran des réglages.

### 2. Créer une clé API

1. Aller sur [console.anthropic.com](https://console.anthropic.com/settings/keys) et créer une clé.
2. **Fixer une limite de dépense mensuelle** (Settings → Limits) : c'est la protection principale.
3. Dans l'application : `⚙️ Réglages` → répondre à la petite multiplication (portail parental) → coller la clé → `Tester la clé`.

La clé est enregistrée dans le `localStorage` **de cet appareil uniquement** et n'est envoyée qu'à `api.anthropic.com`.

### 3. Une jolie voix (facultatif mais conseillé)

Les voix intégrées aux navigateurs sont souvent robotiques, surtout sur tablette. Deux solutions :

**a) Améliorer la voix du système** (gratuit)
- *Android / Chrome* : Paramètres → Système → Langues et saisie → Synthèse vocale → moteur **Google**, puis
  installer les données de la voix française.
- *iPad / iPhone* : Réglages → Accessibilité → Contenu énoncé → Voix → Français → télécharger une voix
  **« Améliorée »**. Les voix Siri, elles, ne sont pas accessibles aux applications web.
- Puis choisir la voix dans `Réglages → Voix et lecture`.

**b) Utiliser Google Cloud Text-to-Speech** (qualité nettement supérieure)
1. Console Google Cloud → activer l'API **Cloud Text-to-Speech** → créer une **clé API**.
2. **Restreindre la clé** : « Restrictions liées aux applications → Sites Web » avec
   `https://<utilisateur>.github.io/*`, et « Restrictions relatives aux API → Cloud Text-to-Speech ».
   Contrairement à la clé Claude, une clé Google **peut** être limitée à votre site : elle est faite pour ça.
3. Dans l'application : `Réglages → Voix et lecture → Voix Google Cloud`, coller la clé, `Charger les voix`,
   choisir une voix française (les voix `Wavenet`, `Neural2` et `Chirp3-HD` sont les plus naturelles),
   puis `🔊 Essayer la voix`.

> Les familles récentes (`Chirp3-HD`, `Journey`) sont les plus belles mais refusent le SSML, le réglage de
> vitesse et la hauteur : l'application adapte sa requête à la voix choisie, et si une famille inconnue
> rejette ces champs, elle rejoue la demande sans eux et s'en souvient. Le curseur de vitesse reste sans
> effet sur ces voix — l'écran de réglages le signale.

Coût : une aventure de 12 chapitres représente environ 3 000 caractères. Le palier gratuit mensuel de Google
couvre largement un usage familial (1 million de caractères par mois pour les voix WaveNet, 4 millions pour les
voix Standard). Si l'API tombe en panne ou si le quota est épuisé, l'application **repasse toute seule** sur la
voix du navigateur sans interrompre l'histoire.

### 4. Installer sur le téléphone

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
- **Voix.** Voir la section « Une jolie voix » ci-dessus. Le surlignage du mot lu est exact avec la voix du
  navigateur (événements de frontière de mot) et estimé à partir de la durée de l'extrait avec Google.
- **Confidentialité.** Le prénom du héros et les choix sont envoyés à l'API Claude pour écrire la suite. Rien
  d'autre ne quitte l'appareil (pas d'analytics, pas de cookies, pas de compte).

---

## Développement

```bash
npm start              # sert le site sur http://localhost:8080
npm test               # 18 tests : client API, état de l'aventure, arc narratif, épreuves
npm run icons          # régénère les icônes PNG de la PWA

# Tests de bout en bout dans un vrai navigateur :
npm i -D playwright && npx playwright install chromium
npx http-server -p 8123 -c-1 &
npm run test:navigateur   # parcours complet, mini-jeux, combat, carte des lieux
npm run test:api          # pannes du modèle rejouées avec une API simulée
```

Aucune dépendance à installer : tout est en JavaScript natif (modules ES), sans build.

```
index.html            écrans (accueil, thème, héros, jeu, fin, carnet, réglages)
css/app.css           thème clair et sombre, grosses cibles tactiles
js/api.js             appel Claude en streaming + lecture partielle du JSON
js/prompt.js          consignes de narration et schéma JSON du chapitre
js/scene.js           moteur d'illustration SVG (décors, météo, personnages)
js/tts.js             voix du navigateur, surlignage, contournements iOS/Chrome
js/voix.js            narrateur unifié : navigateur ou Google Cloud, avec repli automatique
js/state.js           état de l'aventure, sac, mémoire, historique
js/minijeux.js        épreuves jouables sans savoir lire (mémoire, attrape, intrus)
js/demo.js            générateur d'histoires hors ligne
js/app.js             enchaînement des écrans et boucle de jeu
sw.js                 mise en cache hors ligne
```

### Ajouter un décor

1. Ajouter son nom dans `LIEUX` (`js/config.js`) — la liste est envoyée au modèle comme énumération.
2. Ajouter une recette dans `RECETTES` (`js/scene.js`) : couleurs du sol, éléments de fond, éléments d'avant-plan.

---

## Et les « story skills » ?

Le dépôt [danjdewhurst/story-skills](https://github.com/danjdewhurst/story-skills) (MIT) est un jeu de
*skills* au format Agent Skills pour écrire un roman **avec un agent qui a accès à un système de fichiers** :
une bible d'histoire en markdown, des fiches personnages, des arcs, un suivi de continuité et un CLI de
validation (`story validate`, `story continuity`…).

Ce format ne peut pas être « installé » ici : cette application est une page statique qui fait **un appel à
l'API Messages par chapitre**, sans agent, sans fichiers et avec quelques secondes de budget. En revanche
trois de ses idées ont été portées directement dans le prompt et dans l'état du jeu, et ce sont elles qui font
la différence :

| Idée de story-skills | Ce que fait Le Livre Magique |
|---|---|
| Story bible (`characters/`, `story.md`) | La troupe de personnages avec la manie de chacun, transmise à chaque tour |
| Promises / payoffs, foreshadowing | Les « graines » plantées puis fleuries, suivies côté application |
| Beat sheet, structure en actes | L'arc en neuf étapes calculé sur la longueur choisie |
| Continuity audit (CLI) | Contrôles côté application : sac, cœurs bornés, graines non répétées, doublons d'objets |

## Licence

MIT.
