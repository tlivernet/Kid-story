// Mode démo / hors-ligne : une aventure fabriquée sur l'appareil, sans clé API.
// Même format de chapitre que la Plume Magique, en beaucoup plus simple.
import { THEMES } from './config.js';
import { momentDePorte } from './prompt.js';
import { piocher, rng } from './util.js';

const COMPAGNONS = [
  { nom: 'Nino le renard', emoji: '🦊' },
  { nom: 'Bouli le hibou', emoji: '🦉' },
  { nom: 'Pistache la souris', emoji: '🐭' },
  { nom: 'Rico le crabe', emoji: '🦀' },
];

const OBJETS = [
  { nom: 'Clé dorée', emoji: '🗝️', pouvoir: 'ouvre une porte fermée' },
  { nom: 'Lanterne', emoji: '🏮', pouvoir: 'éclaire les endroits sombres' },
  { nom: 'Corde solide', emoji: '🪢', pouvoir: 'aide à grimper' },
  { nom: 'Gâteau au miel', emoji: '🍯', pouvoir: 'calme les gros grognons' },
  { nom: 'Plume magique', emoji: '🪶', pouvoir: 'fait voler un instant' },
  { nom: 'Carte froissée', emoji: '🗺️', pouvoir: 'montre le chemin' },
];

const ADVERSAIRES = [
  { nom: 'Groumf le troll grognon', emoji: '🧌', coeurs: 2 },
  { nom: 'une oie très têtue', emoji: '🦢', coeurs: 1 },
  { nom: 'un robot mal réglé', emoji: '🤖', coeurs: 2 },
  { nom: 'Barbouille le dragon chatouilleux', emoji: '🐉', coeurs: 3 },
];

const PERIPETIES = [
  {
    lieu: 'foret', nom: 'le chemin de mousse', acteurs: ['🌳', '🐿️'],
    texte: (h) => [`${h} avance sur un chemin de mousse.`, 'Un écureuil saute de branche en branche.', 'Il montre un arbre tout tordu.', 'Dans le tronc, quelque chose brille !'],
    choix: [
      { texte: 'Regarder dans le tronc', emoji: '🔦', epreuve_nom: '', epreuve_difficulte: 0 },
      { texte: 'Grimper à l’arbre', emoji: '🧗', epreuve_nom: 'grimper', epreuve_difficulte: 3 },
      { texte: 'Suivre l’écureuil', emoji: '🐿️', epreuve_nom: '', epreuve_difficulte: 0 },
    ],
  },
  {
    lieu: 'riviere', nom: 'la rivière qui chante', acteurs: ['🌊', '🐸'],
    texte: (h) => ['Une rivière coupe le chemin.', 'L’eau chante en sautant sur les cailloux.', 'Une grenouille rigole sur un rocher.', `« Tu sais sauter, ${h} ? » demande-t-elle.`],
    choix: [
      { texte: 'Sauter de pierre en pierre', emoji: '🪨', epreuve_nom: 'sauter', epreuve_difficulte: 3 },
      { texte: 'Fabriquer un radeau', emoji: '🛶', epreuve_nom: '', epreuve_difficulte: 0 },
      { texte: 'Demander à la grenouille', emoji: '🐸', epreuve_nom: '', epreuve_difficulte: 0 },
    ],
  },
  {
    lieu: 'grotte', nom: 'la grotte du passage secret', acteurs: ['🕯️', '🦇'],
    texte: () => ['Une grotte s’ouvre dans la colline.', 'Il fait sombre, mais pas effrayant.', 'Une chauve-souris dit bonjour, la tête en bas.', 'Elle connaît un passage secret.'],
    choix: [
      { texte: 'Entrer doucement', emoji: '🚶', epreuve_nom: '', epreuve_difficulte: 0 },
      { texte: 'Chanter pour se rassurer', emoji: '🎵', epreuve_nom: '', epreuve_difficulte: 0 },
      { texte: 'Chercher le passage', emoji: '🔎', epreuve_nom: 'chercher', epreuve_difficulte: 4 },
    ],
  },
  {
    lieu: 'village', nom: 'le village qui sent la brioche', acteurs: ['🏠', '👵'],
    texte: (h) => ['Un petit village sent la brioche chaude.', 'Une mamie balaie devant sa porte.', `« Bonjour ${h} ! » dit-elle en souriant.`, 'Elle a perdu son chat gris.'],
    choix: [
      { texte: 'Chercher le chat', emoji: '🐈', epreuve_nom: '', epreuve_difficulte: 0 },
      { texte: 'Appeler très fort', emoji: '📣', epreuve_nom: '', epreuve_difficulte: 0 },
      { texte: 'Suivre les traces', emoji: '🐾', epreuve_nom: 'pister', epreuve_difficulte: 3 },
    ],
  },
  {
    lieu: 'montagne', nom: 'le sentier des chèvres', acteurs: ['⛰️', '🐐'],
    texte: () => ['Le chemin monte, monte, monte.', 'Le vent chatouille les oreilles.', 'Une chèvre bondit sur les rochers.', 'Tout en haut, on voit très loin.'],
    choix: [
      { texte: 'Escalader le rocher', emoji: '🧗', epreuve_nom: 'escalader', epreuve_difficulte: 4 },
      { texte: 'Faire une pause', emoji: '🧺', epreuve_nom: '', epreuve_difficulte: 0 },
      { texte: 'Suivre la chèvre', emoji: '🐐', epreuve_nom: '', epreuve_difficulte: 0 },
    ],
  },
  {
    lieu: 'ruines', nom: 'les vieilles pierres', acteurs: ['🏛️', '🦎'],
    texte: () => ['De vieilles pierres dorment dans l’herbe.', 'Un lézard fait la sieste sur une colonne.', 'Sur le mur, il y a un dessin bizarre.', 'On dirait une devinette !'],
    choix: [
      { texte: 'Résoudre la devinette', emoji: '🧩', epreuve_nom: 'réfléchir', epreuve_difficulte: 3 },
      { texte: 'Pousser la grosse pierre', emoji: '💪', epreuve_nom: 'pousser', epreuve_difficulte: 4 },
      { texte: 'Réveiller le lézard', emoji: '🦎', epreuve_nom: '', epreuve_difficulte: 0 },
    ],
  },
];

function debutSelonAction(action, h) {
  const debut = [];
  if (action?.risque === 'coute') {
    debut.push('Aïe ! Le chemin audacieux ne passait pas.', 'Tu perds un cœur, mais tu repars quand même.');
  } else if (action?.risque === 'paye') {
    debut.push('Quel courage ! Ton audace ouvre un raccourci.', 'Tu gagnes une étoile.');
  }
  if (!action?.epreuve) return debut;
  return debut.concat(action.epreuve.reussi
    ? [`Bravo ${h}, tu as réussi !`, 'Ton cœur fait boum de fierté.']
    : ['Oups ! Ça n’a pas marché.', 'Tu te relèves en riant. Ce n’est pas grave.']);
}

// Le sac ne sert que si l'on manque parfois de l'objet : le mode démo pose donc
// lui aussi des portes fermées, au même rythme que la Plume Magique.
function poserLesPortes(choix, etat, r) {
  if (!choix.length) return choix;
  const liste = choix.map((c) => ({ objet_requis: '', risque: false, ...c }));
  const audacieux = liste.reduce((a, b) => ((b.epreuve_difficulte || 0) > (a.epreuve_difficulte || 0) ? b : a));
  audacieux.risque = true;
  const manquant = OBJETS.find((o) => !etat.sac.some((s) => s.nom === o.nom));
  if (momentDePorte(etat) && manquant) {
    const ferme = liste.find((c) => c !== audacieux) || liste[0];
    ferme.objet_requis = manquant.nom;
  } else if (etat.sac.length && r() > 0.5) {
    const ouvert = liste.find((c) => c !== audacieux) || liste[0];
    ouvert.objet_requis = etat.sac[0].nom;
  }
  return liste;
}

export function chapitreDemo(etat, action) {
  const r = rng(`${etat.id}-${etat.chapitre}`);
  const theme = THEMES.find((t) => t.id === etat.themeId) || THEMES[0];
  const h = etat.heros.prenom;
  const dernier = etat.chapitre + 1 >= etat.longueur;

  if (etat.chapitre === 0) {
    const compagnon = piocher(COMPAGNONS, r);
    const but = piocher(theme.mots, r);
    return {
      titre: `${h} et ${theme.nom.toLowerCase()}`,
      texte: etat.realiste ? [
        `${h} enfile ses chaussures, prêt pour la journée.`,
        `Aujourd'hui, ${etat.inspiration ? etat.inspiration.debut : 'une drôle de journée commence'}.`,
        `${compagnon.nom} arrive en courant.`,
        `« Vite ! On doit s'occuper de ${but} », dit-il.`,
        'L’aventure commence maintenant.',
      ] : [
        `${h} ouvre un grand livre poussiéreux.`,
        'Zoup ! Le voilà dans une autre histoire.',
        etat.inspiration ? `Ici, ${etat.inspiration.debut}.` : 'Ici, tout reste à découvrir.',
        `${compagnon.nom} arrive en courant.`,
        `« Vite ! On doit retrouver ${but} », dit-il.`,
        'L’aventure commence maintenant.',
      ],
      lieu: theme.lieu,
      lieu_nom: 'le seuil du grand livre',
      moment: 'jour',
      acteurs: [etat.heros.avatar, compagnon.emoji],
      objets_decor: ['📖'],
      quete: `retrouver ${but}`,
      memoire: `${h} cherche ${but} avec ${compagnon.nom}.`,
      compagnon: `${compagnon.nom} ${compagnon.emoji}`,
      adversaire_nom: '', adversaire_emoji: '', adversaire_coeurs: 0,
      sac_ajouter: [piocher(OBJETS, r)],
      sac_retirer: [],
      coeurs_delta: 0,
      etoiles_delta: 1,
      choix: [
        { texte: 'Partir tout de suite', emoji: '👟', objet_requis: '', epreuve_nom: '', epreuve_difficulte: 0, risque: true },
        { texte: 'Préparer un pique-nique', emoji: '🧺', objet_requis: '', epreuve_nom: '', epreuve_difficulte: 0, risque: false },
      ],
      fin_titre: '',
      fin_message: '',
    };
  }

  if (dernier) {
    return {
      titre: '',
      texte: [
        ...debutSelonAction(action, h),
        `Au bout du chemin, ${h} trouve enfin ${(etat.quete || 'son trésor').replace(/^retrouver /, '')}.`,
        'Tout le monde saute de joie.',
        'Le livre se referme tout doucement.',
        `Bravo ${h}, tu es un vrai héros !`,
      ],
      lieu: etat.lieu || theme.lieu,
      lieu_nom: 'le bout du chemin',
      moment: 'soir',
      acteurs: [etat.heros.avatar, '🎉'],
      objets_decor: ['🏆'],
      quete: etat.quete,
      memoire: etat.memoire,
      compagnon: etat.compagnon,
      adversaire_nom: '', adversaire_emoji: '', adversaire_coeurs: 0,
      sac_ajouter: [],
      sac_retirer: [],
      coeurs_delta: 0,
      etoiles_delta: 2,
      choix: [],
      fin_titre: 'Mission réussie !',
      fin_message: `${h} a terminé l’aventure avec ${etat.etoiles + 2} étoiles.`,
    };
  }

  const scene = piocher(PERIPETIES, r);
  // Une rencontre costaude au troisième chapitre, comme dans une vraie partie.
  const adversaire = etat.chapitre === 3 ? piocher(ADVERSAIRES, r) : null;
  const donneObjet = r() > 0.6;
  const objet = piocher(OBJETS.filter((o) => !etat.sac.some((s) => s.nom === o.nom)), r) || null;
  return {
    titre: '',
    texte: adversaire
      ? [...debutSelonAction(action, h), ...scene.texte(h).slice(0, 2), `Soudain, ${adversaire.nom} te barre la route !`]
      : [...debutSelonAction(action, h), ...scene.texte(h)],
    lieu: scene.lieu,
    lieu_nom: scene.nom,
    moment: r() > 0.8 ? 'soir' : 'jour',
    acteurs: [etat.heros.avatar, ...scene.acteurs.slice(0, 1)],
    objets_decor: scene.acteurs.slice(1),
    quete: etat.quete,
    memoire: `${etat.memoire} Puis ${h} est passé par ${scene.lieu}.`.slice(-380),
    compagnon: etat.compagnon,
    adversaire_nom: adversaire?.nom || '',
    adversaire_emoji: adversaire?.emoji || '',
    adversaire_coeurs: adversaire?.coeurs || 0,
    sac_ajouter: donneObjet && objet ? [objet] : [],
    sac_retirer: [],
    coeurs_delta: (action?.epreuve && !action.epreuve.reussi) || action?.risque === 'coute' ? -1 : 0,
    etoiles_delta: action?.epreuve?.reussi || action?.risque === 'paye' ? 1 : 0,
    choix: adversaire ? [] : poserLesPortes(scene.choix, etat, r),
    fin_titre: '',
    fin_message: '',
  };
}
