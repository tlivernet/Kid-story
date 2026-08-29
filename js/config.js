// Configuration partagée du Livre Magique.

export const APP = {
  nom: 'Le Livre Magique',
  version: '1.7.0',
};

// Modèles proposés dans les réglages (parents).
export const MODELES = [
  { id: 'claude-opus-5', nom: 'Claude Opus 5 — le plus riche', note: 'Histoires les plus inventives.' },
  { id: 'claude-sonnet-5', nom: 'Claude Sonnet 5 — équilibré', note: 'Bon compromis vitesse / prix.' },
  { id: 'claude-haiku-4-5', nom: 'Claude Haiku 4.5 — le plus rapide', note: 'Le moins cher, plus simple.' },
];

// Thèmes de départ. `mots` aide le mode démo hors-ligne.
export const THEMES = [
  { id: 'pirates', nom: 'Pirates', emoji: '🏴‍☠️', lieu: 'plage', mots: ['le trésor du capitaine', 'la carte au trésor', 'le perroquet perdu'] },
  { id: 'dragons', nom: 'Dragons', emoji: '🐉', lieu: 'chateau', mots: ['l’œuf du dragon', 'la clé de la grotte', 'le petit dragon perdu'] },
  { id: 'espace', nom: 'Espace', emoji: '🚀', lieu: 'espace', mots: ['l’étoile filante', 'le robot perdu', 'la planète bleue'] },
  { id: 'dinosaures', nom: 'Dinosaures', emoji: '🦕', lieu: 'jungle', mots: ['l’œuf de dinosaure', 'le bébé tricératops', 'la vallée secrète'] },
  { id: 'jungle', nom: 'Jungle', emoji: '🦁', lieu: 'jungle', mots: ['la fleur qui chante', 'le petit singe farceur', 'la rivière cachée'] },
  { id: 'sirenes', nom: 'Sirènes', emoji: '🧜‍♀️', lieu: 'ocean', mots: ['la perle magique', 'le dauphin rieur', 'le jardin de corail'] },
  { id: 'chevaliers', nom: 'Chevaliers', emoji: '🏰', lieu: 'chateau', mots: ['le bouclier doré', 'la couronne perdue', 'le pont-levis cassé'] },
  { id: 'sorciers', nom: 'Sorciers', emoji: '🧙', lieu: 'foret', mots: ['la baguette perdue', 'le grimoire magique', 'la chouette savante'] },
  { id: 'detective', nom: 'Détective', emoji: '🕵️', lieu: 'ville', mots: ['le gâteau disparu', 'le chat du voisin', 'l’indice secret'] },
  { id: 'ferme', nom: 'La ferme', emoji: '🚜', lieu: 'ferme', mots: ['la poule fugueuse', 'le mouton frisé', 'la clé du tracteur'] },
  { id: 'neige', nom: 'Pays de neige', emoji: '⛄', lieu: 'banquise', mots: ['le pingouin timide', 'le traîneau perdu', 'le flocon magique'] },
  { id: 'robots', nom: 'Robots', emoji: '🤖', lieu: 'ville', mots: ['le boulon doré', 'le robot endormi', 'l’aimant géant'] },
  { id: 'animaux', nom: 'Animaux qui parlent', emoji: '🦊', lieu: 'foret', mots: ['la noisette d’or', 'la plume bleue', 'le terrier secret'] },
  { id: 'ecole', nom: 'École magique', emoji: '📚', lieu: 'ecole', mots: ['la craie magique', 'le cartable volant', 'le secret de la récré'] },
];

// Décors dessinés par js/scene.js — la liste sert aussi d'énumération au modèle.
export const LIEUX = [
  'foret', 'prairie', 'montagne', 'plage', 'ocean', 'riviere', 'lac', 'grotte',
  'chateau', 'village', 'ville', 'maison', 'cabane', 'desert', 'jungle', 'banquise',
  'volcan', 'espace', 'ciel', 'ruines', 'ferme', 'marche', 'bateau', 'ile',
  'souterrain', 'temple', 'ecole', 'foire',
];

export const MOMENTS = ['jour', 'soir', 'nuit'];

// Avatars proposés au héros.
export const AVATARS = ['🦸', '🦸‍♀️', '🧑‍🚀', '🧚', '🧙‍♀️', '🐻', '🦊', '🐱', '🐼', '🦉', '🐰', '🦖'];

// Cartes d'inspiration : tirées au sort au début de chaque aventure pour que
// deux parties sur le même thème ne se ressemblent pas.
export const INSPIRATIONS = {
  debuts: [
    'quelque chose a disparu pendant la nuit, et personne ne sait quoi',
    'une lettre arrive, portée par le vent, avec un seul mot dessus',
    'un bruit régulier vient de sous le plancher depuis trois jours',
    'une porte est apparue là où il n’y en avait jamais eu',
    'tous les animaux du coin marchent dans la même direction',
    'un inconnu minuscule demande de l’aide, debout sur une chaussure',
    'la carte du village a changé toute seule pendant la sieste',
    'une odeur de gâteau vient d’un endroit où personne ne cuisine',
    'le héros se réveille avec un objet dans la main qu’il n’avait pas hier',
    'quelqu’un a laissé des empreintes qui montent au lieu de descendre',
    'une chanson que personne ne connaît sort d’un vieux coffre',
    'les couleurs du ciel se sont inversées ce matin',
  ],
  compagnons: [
    'un vieux corbeau bavard qui se vante beaucoup',
    'une luciole peureuse mais très maligne',
    'un chien qui comprend tout mais ne répond que par des grognements',
    'une souris ingénieure qui bricole avec des brindilles',
    'un poisson dans un bocal porté à bout de bras',
    'un ballon qui parle et qui a peur des épines',
    'une petite tortue pressée, toujours en retard',
    'un chat qui prétend connaître le chemin et se trompe',
    'un hérisson qui répète la fin de chaque phrase',
    'une marionnette de chaussette qui donne des conseils douteux',
    'un escargot messager très fier de sa vitesse',
    'une chauve-souris qui dort à l’envers en plein jour',
    'un épouvantail qui a peur des corbeaux',
    'un caneton qui prend le héros pour sa maman',
    'une pie voleuse qui rend toujours ce qu’elle prend',
    'un vieux robot de jardin qui compte les fleurs',
  ],
  objets: [
    'une boussole qui indique ce qu’on a perdu',
    'un caillou tiède qui devient brûlant près du danger',
    'un sifflet qui appelle un animal différent à chaque fois',
    'un bout de ficelle qui se noue tout seul',
    'une loupe qui montre les choses cachées',
    'un morceau de miroir qui répond aux questions par oui ou non',
    'une clochette qui sonne quand quelqu’un ment',
    'un gant qui attrape ce qui est trop loin',
    'une craie qui dessine des portes utilisables',
    'un dé qui tombe toujours sur le même chiffre',
    'une plume qui montre d’où vient le vent',
    'un bocal qui garde les bruits pour les réécouter',
    'une écharpe qui change de couleur selon le danger',
    'un panier qui pèse toujours le même poids',
    'une graine qui pousse en une nuit',
    'une paire de lunettes qui montre les traces effacées',
  ],
  twists: [
    'le personnage effrayant a surtout très peur du noir',
    'la carte est fausse, mais l’erreur mène ailleurs de mieux',
    'l’objet cherché n’était pas perdu, il s’était caché exprès',
    'celui qui semblait embêtant essayait en fait d’aider',
    'ce que le héros cherche le cherchait aussi',
    'le raccourci est plus long, mais bien plus intéressant',
    'le voleur rendait service sans le dire à personne',
    'la porte s’ouvre en poussant, pas en tirant, depuis toujours',
    'le trésor est une chose sans valeur à laquelle quelqu’un tient beaucoup',
    'le gardien attendait juste qu’on lui pose une question',
    'les deux camps cherchaient la même chose sans le savoir',
    'la solution était dans le sac depuis le premier chapitre',
  ],
  tons: [
    'malicieux et vif', 'mystérieux et doux', 'joyeux et bavard', 'calme et rêveur',
    'aventureux et pressé', 'tendre et rigolo', 'curieux et bricoleur', 'espiègle et taquin',
  ],
};

// Coffre à trésors : on en tire quelques-uns à chaque tour pour que le modèle
// arrête de proposer toujours la même lanterne et le même sifflet.
export const TRESORS = [
  { nom: 'boussole qui montre ce qu’on a perdu', emoji: '🧭' },
  { nom: 'grelot qui tinte quand un ami approche', emoji: '🔔' },
  { nom: 'plume qui écrit toute seule', emoji: '🪶' },
  { nom: 'coquillage qui répète les secrets', emoji: '🐚' },
  { nom: 'bougie qui ne s’éteint jamais', emoji: '🕯️' },
  { nom: 'miroir de poche qui dit oui ou non', emoji: '🪞' },
  { nom: 'graine qui pousse en une minute', emoji: '🌱' },
  { nom: 'ficelle qui se noue toute seule', emoji: '🪢' },
  { nom: 'caillou tiède qui chauffe près du danger', emoji: '🪨' },
  { nom: 'loupe qui montre les traces effacées', emoji: '🔍' },
  { nom: 'cuillère qui remue toute seule', emoji: '🥄' },
  { nom: 'parapluie qui plane un peu', emoji: '☂️' },
  { nom: 'écharpe qui change de couleur selon l’humeur', emoji: '🧣' },
  { nom: 'clochette qui réveille les endormis', emoji: '🛎️' },
  { nom: 'peigne qui démêle les histoires embrouillées', emoji: '🪮' },
  { nom: 'bocal de lucioles', emoji: '🫙' },
  { nom: 'carte qui se dessine en marchant', emoji: '🗺️' },
  { nom: 'gant qui attrape à distance', emoji: '🧤' },
  { nom: 'petit tambour qui donne du courage', emoji: '🥁' },
  { nom: 'pomme qui ne se termine jamais', emoji: '🍎' },
  { nom: 'chapeau où l’on range trop de choses', emoji: '🎩' },
  { nom: 'lunettes qui voient dans le noir', emoji: '🕶️' },
  { nom: 'clé qui ouvre une porte par jour', emoji: '🗝️' },
  { nom: 'ballon qui suit comme un chien', emoji: '🎈' },
  { nom: 'crayon qui efface les bêtises', emoji: '✏️' },
  { nom: 'savon qui fait des bulles solides', emoji: '🧼' },
  { nom: 'plume de paon qui chatouille les grognons', emoji: '🪶' },
  { nom: 'flûte qui calme les animaux fâchés', emoji: '🪈' },
  { nom: 'bocal de miel qui adoucit les colères', emoji: '🍯' },
  { nom: 'chaussette dépareillée porte-bonheur', emoji: '🧦' },
  { nom: 'toupie qui indique la direction', emoji: '🌀' },
  { nom: 'éponge qui absorbe les flaques entières', emoji: '🧽' },
  { nom: 'ruban qui mesure le courage', emoji: '🎀' },
  { nom: 'petite cloche à vache très bavarde', emoji: '🐄' },
  { nom: 'noisette qui contient une surprise', emoji: '🌰' },
  { nom: 'lampe de poche à lumière bleue', emoji: '🔦' },
  { nom: 'carnet qui se souvient à ta place', emoji: '📓' },
  { nom: 'ciseaux qui coupent les nœuds impossibles', emoji: '✂️' },
  { nom: 'aimant qui attire les objets perdus', emoji: '🧲' },
  { nom: 'brosse qui rend les animaux tout doux', emoji: '🪥' },
  { nom: 'dé porte-bonheur en bois', emoji: '🎲' },
  { nom: 'sifflet que seuls les oiseaux entendent', emoji: '🎵' },
  { nom: 'panier qui garde les choses au chaud', emoji: '🧺' },
  { nom: 'boule de neige qui ne fond pas', emoji: '❄️' },
  { nom: 'lanterne en papier qui vole', emoji: '🏮' },
  { nom: 'pierre plate parfaite pour les ricochets', emoji: '🥏' },
  { nom: 'sac de graines pour amadouer les oiseaux', emoji: '🌾' },
  { nom: 'bracelet qui pique quand on ment', emoji: '📿' },
  { nom: 'petit balai qui nettoie en chantant', emoji: '🧹' },
  { nom: 'bouchon qui bouche n’importe quel trou', emoji: '🧴' },
  { nom: 'cerf-volant qui tire fort', emoji: '🪁' },
  { nom: 'moufle qui réchauffe les gelés', emoji: '🧦' },
  { nom: 'tasse qui se remplit de chocolat', emoji: '☕' },
  { nom: 'ressort qui fait sauter très haut', emoji: '🌀' },
  { nom: 'boîte à musique qui endort les gardiens', emoji: '🎶' },
  { nom: 'échelle de corde pliée en huit', emoji: '🪜' },
  { nom: 'feuille qui sert de barque', emoji: '🍃' },
  { nom: 'pinceau qui peint des portes', emoji: '🖌️' },
  { nom: 'trompette qui fait rire les tristes', emoji: '🎺' },
  { nom: 'fourchette qui trouve la nourriture cachée', emoji: '🍴' },
  { nom: 'bonnet qui rend invisible aux moustiques', emoji: '🧢' },
  { nom: 'pelote de laine qui montre le chemin du retour', emoji: '🧶' },
  { nom: 'os magique qui appelle les chiens', emoji: '🦴' },
  { nom: 'seau qui ne se vide jamais', emoji: '🪣' },
  { nom: 'craie qui dessine des ponts', emoji: '🖍️' },
  { nom: 'coussin qui amortit toutes les chutes', emoji: '🛋️' },
  { nom: 'thermomètre à bêtises', emoji: '🌡️' },
  { nom: 'petit drapeau qui rassemble les amis', emoji: '🚩' },
  { nom: 'boîte d’allumettes qui allume des lucioles', emoji: '🪔' },
  { nom: 'timbre qui envoie un message n’importe où', emoji: '📮' },
  { nom: 'roue de secours pour charrette', emoji: '🛞' },
  { nom: 'grelot de chat très discret', emoji: '🐈' },
  { nom: 'boomerang en bois peint', emoji: '🪃' },
  { nom: 'louche qui goûte à ta place', emoji: '🍲' },
  { nom: 'gomme qui efface la peur', emoji: '🩹' },
  { nom: 'bouton doré qui ouvre les manteaux fermés', emoji: '🔘' },
  { nom: 'ancre miniature qui tient n’importe où', emoji: '⚓' },
  { nom: 'petite fenêtre pliable', emoji: '🪟' },
  { nom: 'clochette d’école qui arrête les disputes', emoji: '🔔' },
  { nom: 'guirlande qui éclaire un tunnel', emoji: '💡' },
];

// Familles de voix Google : qualité, réglages acceptés et ordre de coût.
// Les tarifs exacts changent — l'écran renvoie à la page officielle — mais les
// paliers gratuits mensuels sont stables : 4 M de caractères pour les voix
// Standard, 1 M pour les WaveNet.
export const FAMILLES_VOIX = [
  { cle: /neural2/i, nom: 'Neural2', note: 'très naturelle, vitesse réglable', cout: 'tarif intermédiaire', rang: 0, conseillee: true },
  { cle: /wavenet/i, nom: 'WaveNet', note: 'naturelle, vitesse réglable, 1 M de caractères gratuits par mois', cout: 'tarif intermédiaire', rang: 1, conseillee: true },
  { cle: /chirp3?-?hd|chirp/i, nom: 'Chirp 3 HD', note: 'la plus expressive, mais vitesse non réglable', cout: 'plus chère', rang: 2 },
  { cle: /polyglot|news/i, nom: 'Polyglot / News', note: 'naturelle, voix de présentateur', cout: 'tarif intermédiaire', rang: 3 },
  { cle: /studio/i, nom: 'Studio', note: 'qualité studio, réservée aux longs enregistrements', cout: 'nettement la plus chère', rang: 5 },
  { cle: /standard/i, nom: 'Standard', note: 'un peu robotique, 4 M de caractères gratuits par mois', cout: 'la moins chère', rang: 4 },
];

export function familleVoix(nom) {
  return FAMILLES_VOIX.find((f) => f.cle.test(nom))
    || { nom: 'Autre', note: '', cout: 'tarif inconnu', rang: 6 };
}

export const REGLAGES_DEFAUT = {
  cle: '',
  modele: 'claude-opus-5',
  lectureAuto: true,
  vitesse: 0.95,
  voix: '',
  motParMot: true,
  tailleTexte: 1,
  longueur: 12,             // nombre de chapitres visé avant la fin
  richesse: 'riche',        // 'simple' (4-5 phrases) ou 'riche' (6-8 phrases)
  portailParental: true,    // petite question de calcul avant les réglages
  fallback: true,           // secours automatique côté serveur
  confirmerChoix: true,     // l'enfant écoute le choix puis confirme (il ne lit pas encore)
  lireChoix: true,          // les choix sont lus à voix haute automatiquement
  epreuves: 'melange',      // 'de', 'minijeux' ou 'melange'
  douceur: 'normal',        // 'tendre' (aucun cœur perdu), 'normal', 'corse'
  fournisseurVoix: 'navigateur', // 'navigateur' ou 'google'
  cleGoogle: '',
  voixGoogle: 'fr-FR-Neural2-A',
};
