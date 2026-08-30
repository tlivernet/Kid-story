// Configuration partagée du Livre Magique.

export const APP = {
  nom: 'Le Livre Magique',
  version: '1.18.0',
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
  { id: 'detective', nom: 'Détective', emoji: '🕵️', lieu: 'ville', realiste: true, mots: ['le gâteau disparu', 'le chat du voisin', 'l’indice secret'] },
  { id: 'ferme', nom: 'La ferme', emoji: '🚜', lieu: 'ferme', realiste: true, mots: ['la poule fugueuse', 'le mouton frisé', 'la clé du tracteur'] },
  { id: 'neige', nom: 'Pays de neige', emoji: '⛄', lieu: 'banquise', mots: ['le pingouin timide', 'le traîneau perdu', 'le flocon magique'] },
  { id: 'robots', nom: 'Robots', emoji: '🤖', lieu: 'ville', mots: ['le boulon doré', 'le robot endormi', 'l’aimant géant'] },
  { id: 'animaux', nom: 'Animaux qui parlent', emoji: '🦊', lieu: 'foret', mots: ['la noisette d’or', 'la plume bleue', 'le terrier secret'] },
  { id: 'ecole', nom: 'École magique', emoji: '📚', lieu: 'ecole', mots: ['la craie magique', 'le cartable volant', 'le secret de la récré'] },

  // Thèmes ancrés dans la vraie vie : ni magie, ni animal qui parle.
  { id: 'pompiers', nom: 'Pompiers', emoji: '🚒', lieu: 'ville', realiste: true, mots: ['le chat coincé sur le toit', 'la grange qui fume', 'l’inondation de la cave'] },
  { id: 'police', nom: 'Police', emoji: '🚓', lieu: 'ville', realiste: true, mots: ['le vélo disparu', 'le chien sans collier', 'le sac oublié au parc'] },
  { id: 'veterinaire', nom: 'Vétérinaire', emoji: '🐕‍🦺', lieu: 'village', realiste: true, mots: ['le chiot qui boite', 'la chèvre qui s’est sauvée', 'le hérisson blessé'] },
  { id: 'boulangerie', nom: 'La boulangerie', emoji: '🥖', lieu: 'marche', realiste: true, mots: ['la commande de cent croissants', 'le four en panne', 'le concours de la meilleure baguette'] },
  { id: 'chantier', nom: 'Le chantier', emoji: '🚧', lieu: 'ville', realiste: true, mots: ['la cabane à finir avant la pluie', 'la brouette introuvable', 'le pont du ruisseau'] },
  { id: 'train', nom: 'La gare', emoji: '🚂', lieu: 'ville', realiste: true, mots: ['la valise oubliée', 'le train de 8 h 12', 'le quai numéro trois'] },
  { id: 'foot', nom: 'Match de foot', emoji: '⚽', lieu: 'prairie', realiste: true, mots: ['le ballon crevé', 'la finale du tournoi', 'le gardien malade'] },
  { id: 'camping', nom: 'Camping', emoji: '🏕️', lieu: 'foret', realiste: true, mots: ['la tente envolée', 'le sentier mal balisé', 'la lampe sans piles'] },
  { id: 'peche', nom: 'Au bord de l’eau', emoji: '🎣', lieu: 'lac', realiste: true, mots: ['la barque détachée', 'le poisson record', 'le ponton cassé'] },
  { id: 'marche', nom: 'Jour de marché', emoji: '🧺', lieu: 'marche', realiste: true, mots: ['la caisse qui a disparu', 'les tomates renversées', 'le client pressé'] },
  { id: 'ecole-vraie', nom: 'À l’école', emoji: '🎒', lieu: 'ecole', realiste: true, mots: ['la kermesse à préparer', 'le doudou perdu de la maternelle', 'la sortie au musée'] },
];

// Décors dessinés par js/scene.js — la liste sert aussi d'énumération au modèle.
export const LIEUX = [
  'foret', 'prairie', 'montagne', 'plage', 'ocean', 'riviere', 'lac', 'grotte',
  'chateau', 'village', 'ville', 'maison', 'cabane', 'desert', 'jungle', 'banquise',
  'volcan', 'espace', 'ciel', 'ruines', 'ferme', 'marche', 'bateau', 'ile',
  'souterrain', 'temple', 'ecole', 'foire',
];

export const MOMENTS = ['jour', 'soir', 'nuit'];

// Le monde de chaque thème : où l'on peut aller, qui l'on croise, ce qui va de
// travers. Sans cela l'histoire s'échappe — un match de foot finissait par une
// poule à ramener au poulailler. Les lieux servent aussi à restreindre le
// schéma envoyé au modèle : il ne peut littéralement pas en choisir un autre.
export const UNIVERS = {
  pirates: {
    lieux: ['plage', 'ocean', 'bateau', 'ile', 'grotte'],
    gens: 'un capitaine, un mousse, un perroquet, un vieux marin, une rivale à voile rouge',
    soucis: 'une carte déchirée, une voile trouée, une tempête, un coffre trop lourd, un passage qui n’est libre qu’à marée basse',
  },
  dragons: {
    lieux: ['montagne', 'chateau', 'grotte', 'ruines', 'volcan'],
    gens: 'un dragonneau, un vieux dragon fatigué, un gardien de nid, une bergère',
    soucis: 'un œuf qui refroidit, une écaille cassée, une grotte bouchée, un feu qui ne veut pas prendre',
  },
  espace: {
    lieux: ['espace', 'ciel'],
    gens: 'un robot de bord, une astronaute, un extraterrestre timide',
    soucis: 'un réservoir vide, une antenne cassée, un sas coincé, une pluie de météorites',
  },
  dinosaures: {
    lieux: ['jungle', 'foret', 'montagne', 'grotte'],
    gens: 'un bébé tricératops, une maman diplodocus, un ptérodactyle curieux',
    soucis: 'un œuf tombé du nid, un pont de lianes cassé, une vallée inondée, une empreinte à suivre',
  },
  jungle: {
    lieux: ['jungle', 'riviere', 'grotte'],
    gens: 'un singe farceur, un perroquet, une panthère paresseuse, un guide',
    soucis: 'une liane rompue, une rivière trop forte, un fruit hors de portée, un sentier effacé',
  },
  sirenes: {
    lieux: ['ocean', 'plage', 'ile'],
    gens: 'une sirène, un dauphin, un crabe grognon, un banc de poissons',
    soucis: 'un courant contraire, une perle perdue, un corail abîmé, un filet emmêlé',
  },
  chevaliers: {
    lieux: ['chateau', 'village', 'foret', 'ruines'],
    gens: 'un écuyer, une reine, un forgeron, un chevalier rival, un cheval',
    soucis: 'un pont-levis bloqué, une armure trop lourde, un tournoi à gagner, une couronne égarée',
  },
  sorciers: {
    lieux: ['foret', 'chateau', 'cabane', 'ruines'],
    gens: 'un vieux sorcier distrait, une chouette, une apprentie, un chat noir',
    soucis: 'une potion ratée, une baguette perdue, un sort qui s’emballe, un grimoire qui refuse de s’ouvrir',
  },
  detective: {
    lieux: ['ville', 'village', 'maison', 'marche'],
    gens: 'un témoin bavard, une commerçante, un voisin, un chat suspect',
    soucis: 'un objet disparu, une trace bizarre, deux versions qui se contredisent, une porte fermée à clé',
  },
  ferme: {
    lieux: ['ferme', 'prairie', 'village'],
    gens: 'un fermier, une vétérinaire, un voisin, des poules, une chèvre',
    soucis: 'une clôture ouverte, un tracteur en panne, un animal échappé, une récolte à rentrer avant la pluie',
  },
  neige: {
    lieux: ['banquise', 'montagne', 'cabane'],
    gens: 'un pingouin timide, un ours blanc, une exploratrice',
    soucis: 'un traîneau cassé, une tempête de neige, un trou dans la glace, une piste effacée',
  },
  robots: {
    lieux: ['ville', 'maison', 'souterrain'],
    gens: 'un robot rouillé, une inventrice, un drone bavard',
    soucis: 'une pile vide, un boulon manquant, un programme qui bégaie, une porte automatique bloquée',
  },
  animaux: {
    lieux: ['foret', 'prairie', 'riviere'],
    gens: 'un renard malin, un hérisson prudent, une chouette, un écureuil',
    soucis: 'un terrier inondé, une réserve de noisettes vidée, un ami disparu, l’hiver qui approche',
  },
  ecole: {
    lieux: ['ecole', 'chateau'],
    gens: 'un maître farfelu, une camarade, un balai bavard, un tableau qui parle',
    soucis: 'une craie qui écrit toute seule, un cartable envolé, une leçon oubliée, une récré annulée',
  },
  pompiers: {
    lieux: ['ville', 'village', 'maison'],
    gens: 'un capitaine des pompiers, une collègue, un habitant inquiet, un chat sur un toit',
    soucis: 'une fumée suspecte, une échelle trop courte, une cave inondée, une route bloquée',
  },
  police: {
    lieux: ['ville', 'village', 'marche'],
    gens: 'un collègue, une passante, un commerçant, un enfant qui a perdu quelque chose',
    soucis: 'un vélo disparu, un chien sans collier, un sac oublié, un témoin qui hésite',
  },
  veterinaire: {
    lieux: ['village', 'ferme', 'maison'],
    gens: 'une vétérinaire, un propriétaire inquiet, un chiot, une chèvre',
    soucis: 'une patte qui boite, un animal qui se sauve, un remède à trouver, une cage à réparer',
  },
  boulangerie: {
    lieux: ['marche', 'village', 'maison'],
    gens: 'un boulanger, une cliente pressée, un livreur, un apprenti',
    soucis: 'un four en panne, une pâte qui ne lève pas, une commande énorme, une livraison en retard',
  },
  chantier: {
    lieux: ['ville', 'village'],
    gens: 'un chef de chantier, une grutière, un maçon, un voisin curieux',
    soucis: 'une planche manquante, la pluie qui arrive, une brouette introuvable, un mur de travers',
  },
  train: {
    lieux: ['ville', 'village'],
    gens: 'un chef de gare, une voyageuse, un contrôleur, un conducteur',
    soucis: 'une valise oubliée, un quai changé, un train en retard, un aiguillage bloqué',
  },
  foot: {
    lieux: ['prairie', 'village', 'ville'],
    gens: 'des coéquipiers, un gardien, un arbitre, un entraîneur, des supporters',
    soucis: 'un ballon crevé, un maillot perdu, un joueur blessé, la pluie, un but contesté, une finale à jouer',
  },
  camping: {
    lieux: ['foret', 'montagne', 'lac', 'cabane'],
    gens: 'un animateur, d’autres campeurs, une randonneuse',
    soucis: 'une tente envolée, un sentier mal balisé, une lampe sans piles, un orage qui monte',
  },
  peche: {
    lieux: ['lac', 'riviere', 'bateau'],
    gens: 'un pêcheur, un grand-père, une passeuse, un héron',
    soucis: 'une barque détachée, une ligne emmêlée, un ponton cassé, un poisson trop gros',
  },
  marche: {
    lieux: ['marche', 'village'],
    gens: 'des marchands, une cliente, un livreur, un musicien de rue',
    soucis: 'une caisse renversée, une balance faussée, un étal à monter, la pluie',
  },
  'ecole-vraie': {
    lieux: ['ecole', 'ville'],
    gens: 'la maîtresse, des camarades, le gardien, un parent',
    soucis: 'une kermesse à préparer, un doudou perdu, une sortie à organiser, un dessin déchiré',
  },
};

export function universDuTheme(themeId) {
  return UNIVERS[themeId] || null;
}

// Avatars proposés au héros, groupés : un enfant qui joue les pompiers ne se
// reconnaît pas dans une fée.
export const GROUPES_AVATARS = [
  {
    titre: '🧒 C’est moi',
    avatars: [
      { emoji: '🧒', nom: 'un enfant' }, { emoji: '👦', nom: 'un garçon' }, { emoji: '👧', nom: 'une fille' },
      { emoji: '🧑', nom: 'quelqu’un' }, { emoji: '👶', nom: 'un tout-petit' },
    ],
  },
  {
    titre: '🌍 Métiers de la vraie vie',
    realiste: true,
    avatars: [
      { emoji: '🧑‍🚒', nom: 'pompier' }, { emoji: '👮', nom: 'policier' }, { emoji: '🧑‍⚕️', nom: 'vétérinaire' },
      { emoji: '🧑‍🍳', nom: 'boulanger' }, { emoji: '🧑‍🌾', nom: 'fermier' }, { emoji: '🧑‍🔧', nom: 'mécanicien' },
      { emoji: '🧑‍🏫', nom: 'maître d’école' }, { emoji: '🕵️', nom: 'détective' }, { emoji: '🧑‍🚀', nom: 'astronaute' },
      { emoji: '🧑‍🎨', nom: 'artiste' }, { emoji: '🚴', nom: 'cycliste' }, { emoji: '🏊', nom: 'nageur' },
      { emoji: '⛑️', nom: 'secouriste' }, { emoji: '🧑‍✈️', nom: 'pilote' },
    ],
  },
  {
    titre: '✨ Héros de légende',
    avatars: [
      { emoji: '🦸', nom: 'super-héros' }, { emoji: '🦸‍♀️', nom: 'super-héroïne' }, { emoji: '🧙', nom: 'magicien' },
      { emoji: '🧙‍♀️', nom: 'magicienne' }, { emoji: '🧚', nom: 'fée' }, { emoji: '🧜‍♀️', nom: 'sirène' },
      { emoji: '🥷', nom: 'ninja' }, { emoji: '🧝', nom: 'elfe' }, { emoji: '🤖', nom: 'robot' },
      { emoji: '🏴‍☠️', nom: 'pirate' },
    ],
  },
  {
    titre: '🐾 Animaux',
    avatars: [
      { emoji: '🐻', nom: 'ours' }, { emoji: '🦊', nom: 'renard' }, { emoji: '🐱', nom: 'chat' },
      { emoji: '🐶', nom: 'chien' }, { emoji: '🐼', nom: 'panda' }, { emoji: '🦉', nom: 'hibou' },
      { emoji: '🐰', nom: 'lapin' }, { emoji: '🦖', nom: 'dinosaure' }, { emoji: '🐧', nom: 'manchot' },
      { emoji: '🐯', nom: 'tigre' },
    ],
  },
];

export const AVATARS = GROUPES_AVATARS.flatMap((g) => g.avatars.map((a) => a.emoji));

// L'avatar qui va de soi pour chaque monde : il est proposé d'avance et mis en
// tête, pour que l'enfant n'ait rien à chercher s'il n'en a pas envie.
export const AVATAR_PAR_THEME = {
  pirates: '🏴‍☠️', dragons: '🧙', espace: '🧑‍🚀', dinosaures: '🦸', jungle: '🕵️',
  sirenes: '🧜‍♀️', chevaliers: '🦸', sorciers: '🧙‍♀️', detective: '🕵️', ferme: '🧑‍🌾',
  neige: '⛑️', robots: '🤖', animaux: '🧒', ecole: '🧑‍🏫',
  pompiers: '🧑‍🚒', police: '👮', veterinaire: '🧑‍⚕️', boulangerie: '🧑‍🍳',
  chantier: '🧑‍🔧', train: '🧑‍✈️', foot: '🚴', camping: '🧒', peche: '🧒',
  marche: '🧑‍🍳', 'ecole-vraie': '🧑‍🏫',
};

export function avatarDuTheme(theme) {
  return AVATAR_PAR_THEME[theme?.id] || (theme?.realiste ? '🧒' : '🦸');
}

// Teintes de peau : un enfant doit pouvoir se reconnaître dans son héros.
export const TEINTES = [
  { nom: 'par défaut', modificateur: '' },
  { nom: 'claire', modificateur: '\u{1F3FB}' },
  { nom: 'claire dorée', modificateur: '\u{1F3FC}' },
  { nom: 'dorée', modificateur: '\u{1F3FD}' },
  { nom: 'brune', modificateur: '\u{1F3FE}' },
  { nom: 'foncée', modificateur: '\u{1F3FF}' },
];

// Les emojis « personne » acceptent une teinte ; les animaux et objets non.
const BASES_TEINTABLES = /^(\u{1F9D1}|\u{1F466}|\u{1F467}|\u{1F9D2}|\u{1F476}|\u{1F46E}|\u{1F9B8}|\u{1F9B9}|\u{1F9D9}|\u{1F9DA}|\u{1F9DC}|\u{1F9DD}|\u{1F977}|\u{1F6B4}|\u{1F3CA}|\u{1F575})/u;

export function teinter(avatar, modificateur) {
  if (!modificateur || !BASES_TEINTABLES.test(avatar)) return avatar;
  const sansTeinte = avatar.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '');
  const points = [...sansTeinte];
  // Le modificateur se place juste après la base ; il remplace le sélecteur de
  // présentation emoji, qui deviendrait invalide derrière lui.
  const reste = points.slice(1).filter((c, i) => !(i === 0 && c === '\uFE0F'));
  return [points[0], modificateur, ...reste].join('');
}

export const teintable = (avatar) => BASES_TEINTABLES.test(avatar);

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
  { nom: 'gomme qui efface les traces de pas', emoji: '👣' },
  { nom: 'dent de dragon tiède', emoji: '🦷' },
  { nom: 'bouteille qui garde le vent dedans', emoji: '🍾' },
  { nom: 'chaussure à ressort', emoji: '👟' },
  { nom: 'oreiller qui raconte la fin des rêves', emoji: '🛏️' },
  { nom: 'crochet qui attrape les nuages bas', emoji: '🪝' },
  { nom: 'poêle qui cuit sans feu', emoji: '🍳' },
  { nom: 'bocal de brouillard pliable', emoji: '🌫️' },
  { nom: 'fil qui devient dur comme un bâton', emoji: '🧵' },
  { nom: 'moulin à vent de poche', emoji: '🎡' },
  { nom: 'coquille de noix qui fait barque', emoji: '🥥' },
  { nom: 'trèfle qui pousse là où il faut creuser', emoji: '🍀' },
  { nom: 'clé de sol qui ouvre les boîtes à musique', emoji: '🎼' },
  { nom: 'balance qui pèse le courage', emoji: '⚖️' },
  { nom: 'sablier qui ralentit les grognons', emoji: '⏳' },
  { nom: 'lasso de laine très solide', emoji: '🪢' },
  { nom: 'bonbon qui donne la voix des géants', emoji: '🍬' },
  { nom: 'éventail qui range les feuilles mortes', emoji: '🍂' },
  { nom: 'ancre de poche qui empêche d’être emporté', emoji: '⚓' },
  { nom: 'tampon qui recopie les dessins', emoji: '🖨️' },
  { nom: 'flacon de pluie tiède', emoji: '🌧️' },
  { nom: 'boîte qui garde un secret jusqu’au soir', emoji: '📦' },
  { nom: 'grelot qui prévient quand un ami approche', emoji: '🔕' },
  { nom: 'pince qui décoince tout', emoji: '🦞' },
  { nom: 'cerceau qui roule tout seul jusqu’au but', emoji: '⭕' },
  { nom: 'plume de phénix toujours tiède', emoji: '🔥' },
  { nom: 'lunette d’approche en carton', emoji: '🔭' },
  { nom: 'clochette qui apaise les animaux fâchés', emoji: '🐑' },
  { nom: 'gant qui rend l’eau solide une minute', emoji: '💧' },
  { nom: 'pomme de pin qui indique le nord', emoji: '🌲' },
  { nom: 'ruban qui rallonge quand on tire dessus', emoji: '🎗️' },
  { nom: 'boule de laine qui roule vers les perdus', emoji: '🧶' },
  { nom: 'chapeau qui garde la pluie pour plus tard', emoji: '👒' },
  { nom: 'sifflet qui imite n’importe quel oiseau', emoji: '🕊️' },
  { nom: 'craie qui écrit sur l’eau', emoji: '🖍️' },
  { nom: 'petit pot de colle très forte', emoji: '🫙' },
  { nom: 'miroir qui montre l’autre côté du mur', emoji: '🪟' },
  { nom: 'os qui fait obéir les chiens têtus', emoji: '🦴' },
  { nom: 'toupie qui creuse un petit trou', emoji: '🌀' },
  { nom: 'papier qui devient carte au trésor', emoji: '📜' },
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

// Coffre du monde réel : des objets ordinaires, utiles, sans magie.
export const TRESORS_REELS = [
  { nom: 'lampe torche à grosse pile', emoji: '🔦' },
  { nom: 'talkie-walkie qui grésille', emoji: '📻' },
  { nom: 'corde d’escalade bien enroulée', emoji: '🧗' },
  { nom: 'trousse de secours complète', emoji: '🩹' },
  { nom: 'sifflet d’arbitre', emoji: '🥇' },
  { nom: 'carnet à spirale et crayon', emoji: '📓' },
  { nom: 'mètre ruban jaune', emoji: '📏' },
  { nom: 'gants de travail trop grands', emoji: '🧤' },
  { nom: 'clé à molette du garage', emoji: '🔧' },
  { nom: 'rouleau de gros scotch', emoji: '🩶' },
  { nom: 'gilet jaune réfléchissant', emoji: '🦺' },
  { nom: 'casque de chantier', emoji: '⛑️' },
  { nom: 'seau et éponge', emoji: '🪣' },
  { nom: 'échelle pliante', emoji: '🪜' },
  { nom: 'sac de graines pour les poules', emoji: '🌾' },
  { nom: 'boussole de randonnée', emoji: '🧭' },
  { nom: 'carte du quartier pliée en huit', emoji: '🗺️' },
  { nom: 'gourde encore pleine', emoji: '🧴' },
  { nom: 'jumelles un peu rayées', emoji: '🔭' },
  { nom: 'appareil photo jetable', emoji: '📷' },
  { nom: 'trousseau de clés étiquetées', emoji: '🔑' },
  { nom: 'panier en osier', emoji: '🧺' },
  { nom: 'tablier de boulanger fariné', emoji: '🥐' },
  { nom: 'thermomètre du four', emoji: '🌡️' },
  { nom: 'laisse de secours', emoji: '🦮' },
  { nom: 'boîte de croquettes', emoji: '🐾' },
  { nom: 'ticket de train composté', emoji: '🎫' },
  { nom: 'parapluie du bureau des objets trouvés', emoji: '☂️' },
  { nom: 'pompe à vélo', emoji: '🚲' },
  { nom: 'rustines et démonte-pneu', emoji: '🛠️' },
  { nom: 'lampe frontale', emoji: '💡' },
  { nom: 'sifflet de secours orange', emoji: '📣' },
  { nom: 'couverture de survie dorée', emoji: '🛏️' },
  { nom: 'petite monnaie dans une bourse', emoji: '💰' },
  { nom: 'balance à plateaux', emoji: '⚖️' },
  { nom: 'cageot de pommes', emoji: '🍏' },
  { nom: 'plan du camping', emoji: '📋' },
  { nom: 'boîte à outils cabossée', emoji: '🧰' },
  { nom: 'chiffon propre plié', emoji: '🧽' },
  { nom: 'brassard de nageur', emoji: '🏊' },
  { nom: 'gilet de sauvetage', emoji: '⛑️' },
  { nom: 'épuisette à long manche', emoji: '🎣' },
];

// Cartes d'inspiration pour les histoires du monde réel.
export const INSPIRATIONS_REELLES = {
  debuts: [
    'un appel arrive juste au moment de goûter',
    'quelqu’un a laissé un mot sans le signer',
    'le matériel a disparu du local pendant la nuit',
    'un inconnu attend devant la porte depuis dix minutes',
    'la météo change et il faut tout revoir',
    'une livraison arrive avec deux jours d’avance',
    'un voisin frappe à la porte, l’air très embêté',
    'la machine la plus utile est tombée en panne ce matin',
    'un animal traverse la rue au mauvais moment',
    'quelqu’un s’est trompé de sac dans le bus',
    'la clé du local reste introuvable',
    'un enfant plus petit s’est perdu dans la foule',
  ],
  compagnons: [
    'un collègue bavard qui connaît tout le monde',
    'une voisine à vélo toujours pressée',
    'un grand-père qui raconte trop d’histoires',
    'un chien de sauvetage très obéissant',
    'une stagiaire qui pose mille questions',
    'un facteur qui sait tout ce qui se passe',
    'une bibliothécaire calme et maligne',
    'un jeune apprenti maladroit mais courageux',
    'une gardienne d’immeuble qui a toutes les clés',
    'un ami d’école qui n’a peur de rien',
    'une commerçante qui donne toujours un bonbon',
    'un pompier volontaire du village',
  ],
  objets: [
    'une lampe torche dont la pile faiblit',
    'un talkie-walkie qui capte mal',
    'un carnet où quelqu’un a noté une adresse',
    'une clé sans étiquette',
    'un plan tracé à la main',
    'un sifflet accroché à un cordon usé',
    'une photo un peu ancienne',
    'un trousseau trouvé par terre',
    'une paire de jumelles empruntée',
    'un ticket avec une heure entourée',
  ],
  twists: [
    'la personne qui râlait voulait juste être utile',
    'l’objet n’avait pas été volé, seulement rangé ailleurs',
    'le raccourci était interdit pour une bonne raison',
    'le problème venait d’une simple erreur de lecture',
    'celui qu’on cherchait cherchait quelqu’un lui aussi',
    'la solution demandait deux personnes, pas une',
    'le plus jeune avait eu la bonne idée dès le début',
    'ce qui semblait grave se réglait avec un coup de fil',
  ],
  tons: ['vif et curieux', 'calme et sérieux', 'chaleureux et rigolo', 'appliqué et fier'],
};

// Mots courants de CP : servent de leurres crédibles dans les jeux de lecture.
export const MOTS_CP = [
  'ami', 'arbre', 'balle', 'bateau', 'bonbon', 'botte', 'branche', 'bruit', 'cabane', 'cadeau',
  'canard', 'carte', 'chapeau', 'chat', 'chemin', 'cheval', 'chien', 'ciel', 'clé', 'coeur',
  'copain', 'corde', 'couleur', 'cuisine', 'dessin', 'doigt', 'eau', 'école', 'écran', 'étoile',
  'famille', 'fenêtre', 'fleur', 'forêt', 'fromage', 'gâteau', 'grenier', 'histoire', 'jardin', 'jouet',
  'journée', 'lampe', 'lapin', 'lettre', 'livre', 'lune', 'main', 'maison', 'matin', 'mouton',
  'nuage', 'oiseau', 'panier', 'papier', 'parc', 'petit', 'pierre', 'pluie', 'poisson', 'pomme',
  'porte', 'poule', 'route', 'sable', 'salade', 'soleil', 'souris', 'table', 'tapis', 'tortue',
  'train', 'vache', 'vélo', 'vent', 'village', 'voiture',
];

// Couples mot/image pour « lis et fais » : l'enfant lit, puis touche la bonne image.
export const MOTS_IMAGES = [
  { mot: 'chat', emoji: '🐱' }, { mot: 'chien', emoji: '🐶' }, { mot: 'ballon', emoji: '🎈' },
  { mot: 'pomme', emoji: '🍎' }, { mot: 'fleur', emoji: '🌸' }, { mot: 'étoile', emoji: '⭐' },
  { mot: 'maison', emoji: '🏠' }, { mot: 'lune', emoji: '🌙' }, { mot: 'poisson', emoji: '🐟' },
  { mot: 'gâteau', emoji: '🍰' }, { mot: 'arbre', emoji: '🌳' }, { mot: 'livre', emoji: '📖' },
  { mot: 'clé', emoji: '🔑' }, { mot: 'lapin', emoji: '🐰' }, { mot: 'vélo', emoji: '🚲' },
  { mot: 'soleil', emoji: '☀️' }, { mot: 'bateau', emoji: '⛵' }, { mot: 'train', emoji: '🚂' },
  { mot: 'chapeau', emoji: '🎩' }, { mot: 'parapluie', emoji: '☂️' }, { mot: 'souris', emoji: '🐭' },
  { mot: 'tortue', emoji: '🐢' }, { mot: 'voiture', emoji: '🚗' }, { mot: 'oiseau', emoji: '🐦' },
];

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
  lireInterface: true,      // les écrans et les cartes se présentent à voix haute
  direLesPropositions: true, // les jeux de lecture disent les mots proposés
  epreuves: 'melange',      // 'de', 'minijeux' ou 'melange'
  jeuxLecture: true,        // ajoute les épreuves de lecture (niveau CP)
  douceur: 'normal',        // 'tendre' (aucun cœur perdu), 'normal', 'corse'
  fournisseurVoix: 'navigateur', // 'navigateur' ou 'google'
  cleGoogle: '',
  voixGoogle: 'fr-FR-Neural2-A',
};
