// Configuration partagée du Livre Magique.

export const APP = {
  nom: 'Le Livre Magique',
  version: '1.1.0',
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
  fournisseurVoix: 'navigateur', // 'navigateur' ou 'google'
  cleGoogle: '',
  voixGoogle: 'fr-FR-Wavenet-C',
};
