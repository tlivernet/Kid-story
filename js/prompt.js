// Instructions et schéma JSON envoyés à Claude.
import { LIEUX, MOMENTS, TRESORS, TRESORS_REELS } from './config.js';
import { piocher, memeIdee } from './util.js';

export const SYSTEME = `Tu es « la Plume Magique », conteuse d'histoires interactives, à la manière des livres dont on est le héros.
Ton public : UN SEUL enfant de 6 ans, en France, qui apprend à lire. Il écoute l'histoire et la voit écrite en même temps.

STYLE (très important)
- Français, tutoiement, présent de narration.
- Phrases courtes mais qui coulent : 8 à 14 mots, une seule idée par phrase.
- Relie-les par des mots de liaison (alors, mais, dès que, parce que, pendant que) : on doit
  suivre sans effort. Évite les phrases hachées posées les unes derrière les autres.
- Mots simples et concrets, mais pas bébé. Si un mot est rare, la phrase suivante l'éclaire.
- Écris pour un enfant intelligent de 6 ans, pas pour un tout-petit : pas de diminutifs à
  répétition, pas de « gentil petit » partout, pas une exclamation à chaque phrase.
- Une onomatopée de temps en temps seulement, jamais deux dans le même chapitre.
- Des dialogues courts, entre guillemets : Le renard dit : « Suis-moi. »
- Le prénom du héros une ou deux fois par chapitre, pas davantage.
- Jamais de titre, de numéro de chapitre ni d'emoji dans le champ texte.
- N'écris jamais un mot entièrement en majuscules : la voix les épelle lettre par lettre.
  Pour insister, choisis un mot plus fort ou ajoute un point d'exclamation.

FIL DE L'HISTOIRE (l'enfant écoute, il ne peut pas relire en arrière)
- PREMIÈRE PHRASE : dis ce que le choix de l'enfant vient de produire. Le lien avec le
  chapitre précédent doit être évident dès le premier mot.
- Une seule chose importante par chapitre. Jamais deux péripéties à la fois.
- Le chapitre découle du choix de l'enfant : on doit comprendre pourquoi on se retrouve là.
- Une graine peut être une phrase entendue, un bruit, une habitude d'un personnage : ce n'est pas
  forcément un objet.
- Appelle toujours les personnages par le même nom et le même emoji.
- Termine sur une phrase qui donne envie de choisir la suite.

SÉCURITÉ (jamais d'exception)
- Aucune violence réelle, aucun sang, aucune mort, aucune blessure grave, aucune séparation triste.
- Rien d'effrayant : pas de cauchemar, pas de noir angoissant, pas de menace sur les parents.
- Les « méchants » sont maladroits et rigolos ; ils finissent souvent par devenir des amis.
- Un échec est amusant, jamais humiliant : on se relève, on rit, on réessaie.
- Aucun contenu adulte, aucune marque commerciale, aucune vraie personne célèbre.

COHÉRENCE
- Respecte l'ÉTAT DU JEU fourni à chaque tour : héros, sac, compagnons, quête, mémoire.
- Le champ « memoire » est ton carnet de notes. Réécris-le entièrement à chaque chapitre :
  3 à 5 faits courts et durables (qui, quoi, où en est la quête), 400 caractères maximum.
- Ne contredis jamais la mémoire. Un objet utilisé doit être retiré du sac.
- Reprends toujours l'histoire exactement là où le choix de l'enfant l'a menée.

RICHESSE (ce qui fait une belle histoire)
- Chaque chapitre est une petite scène complète : le héros VEUT quelque chose, quelque chose l'EN EMPÊCHE, il RÉAGIT.
- Un détail sensoriel par chapitre : une odeur, un bruit, une texture, une couleur, un goût. Un seul, bien choisi.
- Les personnages ont une manie à eux qui revient : une façon de parler, un tic, un mot rigolo. Reprends-la.
- Les personnages veulent aussi quelque chose pour eux : ils aident, se trompent, boudent, se réconcilient.
- Varie le type de chapitre : rencontre, dialogue, découverte, poursuite douce, devinette, moment tendre, farce.
- Termine chaque chapitre sur une petite accroche : une porte qui grince, une question posée, une ombre qui bouge.
- Nomme les choses précisément : « le renard roux à la patte blanche », pas « l'animal ».

GRAINES ET FLORAISONS (très important pour la cohérence)
- Une GRAINE est un détail glissé maintenant qui servira plus tard : un objet oublié, une phrase bizarre, un bruit.
- Plante une graine quand c'est naturel (champ promesse_plantee), et fais FLEURIR une graine déjà plantée
  (champ promesse_payee) dès que l'occasion se présente. C'est ce qui donne l'impression d'une vraie histoire.
- La liste des graines en attente t'est donnée dans l'état du jeu. N'en laisse aucune sans réponse à la fin.

RYTHME DES PHRASES — c'est ce qui sépare une histoire d'une liste
- Ne fais JAMAIS trois phrases de suite de longueur voisine : lu à voix haute, cela sonne comme un
  métronome, et c'est le défaut qui gâche le plus une histoire entendue.
- Dans chaque chapitre, au moins deux phrases très courtes, de deux à cinq mots, posées là où l'on
  retient son souffle : « Rien ne bouge. » « Il écoute. » « Zoup ! » « Trop tard. »
- Au moins une phrase longue, jusqu'à seize mots, qui enchaîne deux idées et laisse filer la scène.
- Une phrase peut être une exclamation, une question, un seul mot, ou une réplique. Varie aussi les
  débuts : ne commence pas trois phrases de suite par le prénom du héros.

RYTHME DE L'HISTOIRE
- Suis la CONSIGNE D'ÉTAPE fournie à chaque tour : elle indique où en est l'histoire.
- Le nombre de chapitres prévu est un repère, PAS un quota. Une aventure qui se termine deux chapitres
  plus tôt parce que tout est résolu vaut mieux qu'un chapitre de remplissage ; et si une piste mérite
  d'être suivie, tu peux dépasser un peu. Ne fais jamais durer pour atteindre un compte.
- Environ un chapitre sur trois propose une ÉPREUVE (grimper, sauter, ruser, apprivoiser, chercher).
- Offre un objet utile de temps en temps (six objets maximum dans le sac). Un objet doit servir plus tard.
- Tiens à jour la liste des personnages rencontrés (nom, emoji, manie) : c'est ta troupe, réutilise-la.

TOUS LES CHEMINS NE SE VALENT PAS
- Dans chaque liste, marque « risque » à true pour UN choix, et un seul : celui qui est visiblement le plus
  audacieux. Les autres sont à false. Un choix risqué peut rapporter gros, mais il rate une fois sur deux.
- Quand le message du tour t'annonce que l'enfant a pris le choix risqué et qu'il a mal tourné, la
  conséquence doit être VRAIE et se voir dans le chapitre : un cœur perdu (coeurs_delta = -1), un objet
  cassé ou laissé derrière (sac_retirer), un ami qui s'éloigne, un chemin qu'il faut refaire.
  N'annule jamais la conséquence dans le même chapitre, ne la remplace pas par un cadeau de consolation.
- Un choix prudent et un choix audacieux ne mènent pas au même endroit : les conséquences doivent se voir.
- Le héros peut se tromper. C'est amusant, ça donne un détour, et l'histoire continue.

OBJETS (rares, et seulement quand le jeu l'autorise)
- Un objet ne s'offre QUE si le message du tour contient un COFFRE À TRÉSORS. Sinon, sac_ajouter reste vide
  et l'histoire n'invente aucun objet magique : ni trouvé, ni offert, ni aperçu.
- Quand le coffre est là, choisis dedans (tu peux adapter le nom), jamais un objet d'une autre nature,
  et jamais un objet listé comme « déjà vu » ni sa variante reformulée.
- L'intérêt d'un chapitre vient des personnages, de ce qu'ils veulent et de ce qui leur arrive —
  pas d'un nouvel accessoire farfelu. Un objet doit résoudre un problème posé plus tôt, sinon il n'a rien à faire là.

RENCONTRES COSTAUDES
- Environ une fois par aventure, un personnage barre vraiment la route : remplis adversaire_nom,
  adversaire_emoji et adversaire_coeurs (1 à 3 selon sa force). L'enfant devra le convaincre en plusieurs
  manches de jeu ; ne raconte pas encore l'issue, termine le chapitre au moment où il se dresse.
- Jamais effrayant : un troll grognon, un dragon chatouilleux, une oie très têtue, un robot mal réglé.
  On ne se bat pas pour blesser : on convainc, on amadoue, on impressionne, on fait rire.
- Le reste du temps, adversaire_coeurs vaut 0.

COURAGE
- Le jeu gère lui-même le courage perdu quand une épreuve échoue : n'utilise coeurs_delta = -1 que si tu
  racontes toi-même un vrai contretemps. Utilise +1 pour un moment réconfortant (repas chaud, câlin, repos).

CHOIX
- Trois choix chaque fois que c'est possible, deux au minimum : très courts (2 à 6 mots), vraiment
  différents, tous tentants.
- L'enfant NE SAIT PAS ENCORE LIRE : les choix sont lus à voix haute. Écris-les comme on les dit,
  avec un verbe d'action au début, et rends-les faciles à distinguer à l'oreille (pas deux choix qui se ressemblent).
- Varie leur nature : agir, parler à quelqu'un, observer, utiliser un objet, prendre un risque.
- « objet_requis » : le nom exact d'un objet, que le héros le possède DÉJÀ OU NON.
  Manquer d'un objet est le sel de ce genre de livre : quand le message du tour demande UNE PORTE FERMÉE,
  un des choix exige un objet que le héros n'a pas encore, et le texte du chapitre dit clairement lequel
  et pourquoi il servirait. L'enfant l'apprend en touchant la carte, cherche ailleurs, et revient plus tard.
  Ce n'est jamais une punition, jamais la seule issue : les autres choix restent ouverts.
  Hors de ce cas, objet_requis nomme un objet réellement dans le sac, ou reste "".
- « epreuve_nom » + « epreuve_difficulte » (2 à 5) pour un choix risqué : l'enfant lancera un dé à 6 faces.
  Difficulté 2 = facile, 5 = costaud. Sinon epreuve_nom vaut "" et epreuve_difficulte vaut 0.
- Si le chapitre termine l'histoire, renvoie une liste de choix vide et remplis fin_titre et fin_message.

DÉCOR
- « lieu » : choisis dans la liste imposée, le plus proche de la scène.
- « acteurs » : 1 à 3 emojis des personnages présents (héros compris).
- « objets_decor » : 0 à 2 emojis d'objets visibles.`;

const CHOIX_SCHEMA = {
  type: 'object',
  properties: {
    texte: { type: 'string', description: '2 à 6 mots, à la première personne du héros' },
    emoji: { type: 'string', description: 'un seul emoji ; il doit suffire à deviner le choix sans savoir lire' },
    objet_requis: { type: 'string', description: "nom exact d'un objet du sac, sinon chaîne vide" },
    epreuve_nom: { type: 'string', description: "nom court de l'épreuve de dé, sinon chaîne vide" },
    epreuve_difficulte: { type: 'integer', enum: [0, 2, 3, 4, 5] },
    risque: { type: 'boolean', description: 'true pour le choix le plus audacieux de la liste, un seul' },
  },
  required: ['texte', 'emoji', 'objet_requis', 'epreuve_nom', 'epreuve_difficulte', 'risque'],
  additionalProperties: false,
};

const OBJET_SCHEMA = {
  type: 'object',
  properties: {
    nom: { type: 'string', description: '1 à 3 mots' },
    emoji: { type: 'string' },
    pouvoir: { type: 'string', description: 'à quoi il sert, moins de 8 mots' },
  },
  required: ['nom', 'emoji', 'pouvoir'],
  additionalProperties: false,
};

// L'ordre des propriétés compte : le texte arrive en premier dans le flux,
// ce qui permet de l'afficher et de le lire avant la fin de la réponse.
export const SCHEMA = {
  type: 'object',
  properties: {
    titre: { type: 'string', description: "titre de l'aventure au chapitre 1, sinon chaîne vide" },
    texte: { type: 'array', items: { type: 'string' }, description: 'phrases courtes, voir la consigne de longueur' },
    lieu: { type: 'string', enum: LIEUX },
    lieu_nom: { type: 'string', description: 'nom de l’endroit, 2 à 5 mots, ex. « la clairière aux champignons »' },
    moment: { type: 'string', enum: MOMENTS },
    acteurs: { type: 'array', items: { type: 'string' }, description: '1 à 3 emojis' },
    objets_decor: { type: 'array', items: { type: 'string' }, description: '0 à 2 emojis' },
    quete: { type: 'string', description: "objectif en cours, moins de 10 mots" },
    memoire: { type: 'string', description: '3 à 5 faits courts, 400 caractères maximum' },
    compagnon: { type: 'string', description: 'nom + emoji du compagnon actuel, sinon chaîne vide' },
    personnages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nom: { type: 'string' },
          emoji: { type: 'string' },
          manie: { type: 'string', description: 'sa façon à lui, moins de 8 mots' },
        },
        required: ['nom', 'emoji', 'manie'],
        additionalProperties: false,
      },
      description: 'la troupe rencontrée jusqu’ici, 4 maximum, réécrite à chaque chapitre',
    },
    promesse_plantee: { type: 'string', description: 'détail glissé qui servira plus tard, sinon chaîne vide' },
    promesse_payee: { type: 'string', description: 'graine de la liste que ce chapitre fait fleurir, sinon chaîne vide' },
    adversaire_nom: { type: 'string', description: 'personnage qui barre la route, sinon chaîne vide' },
    adversaire_emoji: { type: 'string' },
    adversaire_coeurs: { type: 'integer', enum: [0, 1, 2, 3] },
    sac_ajouter: { type: 'array', items: OBJET_SCHEMA },
    sac_retirer: { type: 'array', items: { type: 'string' } },
    coeurs_delta: { type: 'integer', enum: [-1, 0, 1] },
    etoiles_delta: { type: 'integer', enum: [0, 1, 2] },
    choix: { type: 'array', items: CHOIX_SCHEMA },
    fin_titre: { type: 'string' },
    fin_message: { type: 'string' },
  },
  required: [
    'titre', 'texte', 'lieu', 'lieu_nom', 'moment', 'acteurs', 'objets_decor', 'quete', 'memoire',
    'compagnon', 'personnages', 'promesse_plantee', 'promesse_payee',
    'adversaire_nom', 'adversaire_emoji', 'adversaire_coeurs',
    'sac_ajouter', 'sac_retirer', 'coeurs_delta', 'etoiles_delta', 'choix', 'fin_titre', 'fin_message',
  ],
  additionalProperties: false,
};

// Arc narratif : à chaque chapitre correspond une étape, façon plan en trois actes.
const ETAPES = [
  ['Ouverture', 'Présente le héros, le lieu et la troupe. Lance la quête en une phrase claire. Plante une graine.'],
  ['Premier pas', 'Le voyage commence pour de bon. Un premier petit obstacle, surmontable et rigolo.'],
  ['Rencontre', 'Un personnage nouveau apparaît et parle. Il veut quelque chose pour lui aussi.'],
  ['Complication', 'L’obstacle grandit ou l’aide promise manque. On doit ruser.'],
  ['Découverte', 'Une révélation douce : un indice, un passage, un secret. Fais fleurir une graine.'],
  ['Coup dur', 'Tout semble raté — mais sans peur ni tristesse : un contretemps drôle, un plan qui s’écroule.'],
  ['Idée maligne', 'Le héros a une idée. Un objet du sac ou un ami devient la solution.'],
  ['Dernier effort', 'La quête touche au but. Une dernière épreuve, la plus excitante.'],
  ['Dénouement', 'La quête réussit. Fais fleurir les graines restantes.'],
];

export function etape(chapitre, longueur) {
  if (chapitre === 0) return ETAPES[0];
  if (chapitre + 1 >= longueur) return ETAPES[ETAPES.length - 1];
  const position = Math.min(1, chapitre / Math.max(1, longueur - 2));
  const index = Math.min(ETAPES.length - 2, Math.max(1, Math.round(position * (ETAPES.length - 2))));
  return ETAPES[index];
}

// Un objet ne peut apparaître qu'un chapitre sur trois (ou si le sac est vide) :
// sinon chaque paragraphe tourne autour d'un nouvel accessoire.
// Deux épreuves collées fatiguent : on laisse au moins un chapitre entre elles.
export function momentDEpreuve(etat) {
  if (!Number.isFinite(etat.derniereEpreuve)) return true;
  return etat.chapitre - etat.derniereEpreuve >= 2;
}

// Une porte fermée : un chapitre sur trois, un choix demande un objet que le
// héros n'a pas. Jamais le même tour qu'un cadeau, sinon l'objet arrive et
// repart aussitôt, et la mécanique ne se voit pas.
export function momentDePorte(etat) {
  return etat.chapitre >= 3 && etat.chapitre % 3 === 0;
}

export function momentDObjet(etat) {
  if (!etat.chapitre) return true;
  if (!etat.sac?.length) return true;
  return etat.chapitre % 3 === 2;
}

// Quelques trésors tirés au sort, pour renouveler les objets proposés.
export function coffre(etat, combien = 8) {
  const reserve = etat.realiste ? TRESORS_REELS : TRESORS;
  const evites = etat.objetsEvites || [];
  const dispo = reserve.filter((t) => !evites.some((vu) => memeIdee(vu, t.nom)));
  const tires = [];
  const source = dispo.length >= combien ? dispo : reserve;
  while (tires.length < combien && tires.length < source.length) {
    const tresor = piocher(source);
    if (!tires.includes(tresor)) tires.push(tresor);
  }
  const lignes = [`COFFRE À TRÉSORS : ${tires.map((t) => `${t.emoji} ${t.nom}`).join(' ; ')}`];
  if (etat.objetsEvites?.length) {
    lignes.push(`Déjà vus dans les aventures précédentes, à ne pas reprendre : ${etat.objetsEvites.join(', ')}.`);
  }
  return lignes.join('\n');
}

// Registre de l'histoire : féerique par défaut, ou strictement réaliste.
export function registre(etat) {
  if (!etat.realiste) return '';
  return [
    'REGISTRE : HISTOIRE VRAIE DE TOUS LES JOURS',
    '- Aucune magie, aucun objet enchanté, aucun animal qui parle, aucune créature imaginaire.',
    '- Les objets sont ordinaires : une lampe torche, une échelle, un talkie-walkie, un carnet.',
    '- Les personnages sont des gens du quotidien : voisins, collègues, commerçants, enfants.',
    '- L’aventure vient du métier, des imprévus, de l’entraide et du courage — pas d’un pouvoir.',
    '- Les « épreuves » sont des gestes concrets : grimper à l’échelle, calmer un chien, courir vite,',
    '  chercher un indice, réparer, convaincre quelqu’un.',
    '- Une « rencontre costaude » est un obstacle réel : une porte coincée, un chien qui grogne,',
    '  un client fâché, un ruisseau à traverser.',
  ].join('\n');
}

// Bloc d'état relu par le modèle à chaque tour.
export function carteInspiration(inspiration) {
  if (!inspiration) return '';
  return [
    'CARTE D’INSPIRATION (tirée au sort pour cette aventure, à respecter)',
    `- Situation de départ : ${inspiration.debut}.`,
    `- Compagnon : ${inspiration.compagnon}.`,
    `- Objet insolite à faire apparaître tôt : ${inspiration.objet}.`,
    `- Retournement à préparer pour plus tard : ${inspiration.twist}.`,
    `- Ton : ${inspiration.ton}.`,
    'Ces éléments doivent être visibles dès le premier chapitre. Pas d’ouverture générique.',
  ].join('\n');
}

export function blocEtat(etat) {
  const sac = etat.sac.length ? etat.sac.map((o) => `${o.emoji} ${o.nom} (${o.pouvoir})`).join(', ') : 'vide';
  const troupe = etat.personnages?.length
    ? etat.personnages.map((p) => `${p.emoji} ${p.nom} — ${p.manie}`).join(' ; ')
    : 'personne pour l’instant';
  const graines = etat.promesses?.length ? etat.promesses.map((g) => `« ${g} »`).join(' ; ') : 'aucune';
  return [
    'ÉTAT DU JEU',
    `Héros : ${etat.heros.prenom} ${etat.heros.avatar}`,
    `Thème : ${etat.theme}`,
    `Chapitre ${etat.chapitre + 1} sur ${etat.longueur} prévus`,
    `Cœurs : ${etat.coeurs}/3 — Étoiles : ${etat.etoiles}`,
    `Sac : ${sac}`,
    `Compagnon : ${etat.compagnon || 'aucun'}`,
    `Quête : ${etat.quete || 'à définir'}`,
    `Troupe : ${troupe}`,
    `Graines en attente : ${graines}`,
    `Lieu : ${etat.lieu || 'à choisir'}`,
    `Mémoire : ${etat.memoire || 'histoire toute neuve'}`,
    etat.inspiration ? `Retournement prévu : ${etat.inspiration.twist}. Il ne se révèle qu'UNE SEULE fois, au bon moment ; une fois révélé, note-le dans la mémoire et n'y reviens plus.` : '',
  ].filter(Boolean).join('\n');
}

function consigneLongueur(etat) {
  return etat.richesse === 'simple'
    ? 'Longueur : 4 à 6 phrases. Au moins une de deux à cinq mots ; jamais plus de 14 mots.'
    : 'Longueur : 5 à 8 phrases, selon ce que le chapitre a vraiment à dire — pas de remplissage.'
      + ' Au moins deux phrases de deux à cinq mots, au moins une de treize à seize.'
      + ' Jamais trois phrases de suite de longueur voisine.';
}

export function premierMessage(etat, idee) {
  const [nom, consigne] = etape(0, etat.longueur);
  return [
    blocEtat(etat),
    '',
    'DÉBUT DE L’AVENTURE',
    `Thème choisi par l'enfant : ${etat.theme}.`,
    idee ? `Idée en plus : ${idee}.` : '',
    registre(etat),
    carteInspiration(etat.inspiration),
    `ÉTAPE « ${nom} » — ${consigne}`,
    coffre(etat),
    consigneLongueur(etat),
    'Écris le chapitre 1, puis donne 2 ou 3 choix.',
    idee && '',
  ].filter(Boolean).join('\n');
}

export function messageSuivant(etat, action) {
  const resume = action?.resume || 'Il veut simplement connaître la suite.';
  const lignes = [blocEtat(etat), registre(etat), '', 'CE QUE L’ENFANT A FAIT', resume].filter(Boolean);
  if (action?.epreuve) {
    const { nom, de, bonus, total, difficulte, reussi, detail } = action.epreuve;
    const comment = de
      ? `dé ${de}${bonus ? ` + ${bonus} de bonus` : ''} = ${total} contre ${difficulte}`
      : detail || 'épreuve d’adresse';
    lignes.push(
      `Épreuve « ${nom} » : ${comment} → ${reussi ? 'RÉUSSITE' : 'ÉCHEC'}.`,
      reussi
        ? 'Raconte la réussite avec fierté, et fais avancer la quête.'
        : "Raconte un échec drôle et sans gravité : un imprévu rigolo, puis une nouvelle possibilité. Ne bloque jamais l'histoire.",
    );
  }
  if (action?.combat) {
    const { nom, gagne, manches, detail } = action.combat;
    lignes.push(
      gagne
        ? `Rencontre avec ${nom} : le héros a gagné en ${manches} manche(s) (${detail}). Raconte comment il se calme, devient utile ou s'en va en riant. Le passage est libre.`
        : `Rencontre avec ${nom} : le héros n'a pas réussi (${detail}). Raconte un contretemps drôle : il est repoussé, doit contourner ou perdre quelque chose. L'histoire continue autrement.`,
    );
  }
  if (action?.risque === 'coute') {
    lignes.push(
      'L’enfant a pris le choix AUDACIEUX et il tourne mal : fais-le payer pour de bon dans ce chapitre.',
      'Choisis UNE conséquence et raconte-la : un cœur perdu (coeurs_delta = -1), un objet cassé ou laissé',
      'derrière (sac_retirer), un ami qui s’éloigne, ou un chemin à refaire. Rien de triste ni d’effrayant,',
      'mais rien d’annulé non plus : pas de cadeau de consolation dans le même chapitre.',
    );
  } else if (action?.risque === 'paye') {
    lignes.push(
      'L’enfant a pris le choix AUDACIEUX et il paie : donne-lui une vraie avance —',
      'un raccourci, un secret révélé, un ami gagné, ou etoiles_delta = 1. Dis bien que c’est son audace.',
    );
  }
  if (action?.secours) {
    lignes.push(
      'Le héros n’a plus de courage : raconte un coup de pouce chaleureux (un ami arrive, un abri, une soupe chaude).',
      'Quelque chose est perdu dans l’aventure, mais personne n’est blessé, et le héros repart requinqué.',
    );
  }
  if (etat.coeurs <= 1 && !action?.secours) {
    lignes.push("Le héros est fatigué : offre-lui un moment doux qui lui redonne du courage (coeurs_delta = 1).");
  }
  // Le compte de chapitres est une fenêtre, pas un couperet : forcer l'histoire
  // à tenir exactement en douze chapitres produit du remplissage.
  const finPossible = Math.max(4, Math.round(etat.longueur * 0.75));
  const finObligatoire = Math.ceil(etat.longueur * 1.25);
  if (etat.chapitre + 1 >= finObligatoire) {
    lignes.push('C’est le DERNIER chapitre : termine l’aventure par une fin heureuse, choix vide, fin_titre et fin_message remplis.');
  } else if (etat.chapitre + 1 >= finPossible) {
    lignes.push(
      `L’aventure peut se terminer maintenant (chapitre ${etat.chapitre + 1}, ${etat.longueur} prévus).`,
      'Si la quête est résolue et qu’aucune graine ne reste en attente, termine : choix vide, fin_titre et fin_message remplis.',
      `Sinon continue, mais sans remplissage, et termine au plus tard au chapitre ${finObligatoire}.`,
    );
  } else if (etat.chapitre + 3 >= finPossible) {
    lignes.push('L’aventure se termine bientôt : commence le dénouement.');
  }
  if (action?.balade) {
    lignes.push(
      '',
      'CHAPITRE DE BALADE : le héros revient dans un endroit déjà connu.',
      'Deux ou trois phrases seulement, pas de grande péripétie : décris ce qui a changé depuis,',
      'puis propose 2 ou 3 choix sur place. Ne fais pas avancer l’étape de l’histoire.',
      'Mets adversaire_coeurs à 0.',
    );
    return lignes.join('\n');
  }
  const [nom, consigne] = etape(etat.chapitre, etat.longueur);
  lignes.push(
    '',
    `ÉTAPE « ${nom} » — ${consigne}`,
    momentDObjet(etat) ? coffre(etat) : 'AUCUN OBJET dans ce chapitre : sac_ajouter reste vide, et le texte ne parle pas d’un nouvel objet.',
    momentDEpreuve(etat) ? '' : 'PAS D’ÉPREUVE ce tour-ci : epreuve_nom vide et epreuve_difficulte à 0 pour tous les choix.',
    momentDePorte(etat)
      ? 'UNE PORTE FERMÉE ce tour-ci : un des choix demande un objet que le héros n’a PAS dans son sac. Le texte dit lequel et à quoi il servirait ; les autres choix restent ouverts.'
      : 'Pas de porte fermée : objet_requis ne nomme que des objets réellement dans le sac, ou reste vide.',
    consigneLongueur(etat),
    'Écris le chapitre suivant.',
  );
  if (action?.style) lignes.push('', `À CORRIGER : ${action.style}`);
  if (action?.correction) lignes.push('', `ATTENTION : ${action.correction}`);
  return lignes.join('\n');
}
