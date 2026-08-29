// Instructions et schéma JSON envoyés à Claude.
import { LIEUX, MOMENTS } from './config.js';

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

FIL DE L'HISTOIRE (l'enfant écoute, il ne peut pas relire en arrière)
- PREMIÈRE PHRASE : dis ce que le choix de l'enfant vient de produire. Le lien avec le
  chapitre précédent doit être évident dès le premier mot.
- Une seule chose importante par chapitre. Jamais deux péripéties à la fois.
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

RYTHME
- Suis la CONSIGNE D'ÉTAPE fournie à chaque tour : elle indique où en est l'histoire.
- Environ un chapitre sur trois propose une ÉPREUVE de dé (grimper, sauter, ruser, apprivoiser, chercher).
- Offre un objet utile de temps en temps (six objets maximum dans le sac). Un objet doit servir plus tard.
- Tiens à jour la liste des personnages rencontrés (nom, emoji, manie) : c'est ta troupe, réutilise-la.

CHOIX
- Toujours 2 ou 3 choix, très courts (2 à 6 mots), vraiment différents, tous tentants.
- L'enfant NE SAIT PAS ENCORE LIRE : les choix sont lus à voix haute. Écris-les comme on les dit,
  avec un verbe d'action au début, et rends-les faciles à distinguer à l'oreille (pas deux choix qui se ressemblent).
- Varie leur nature : agir, parler à quelqu'un, observer, utiliser un objet, prendre un risque.
- « objet_requis » : mets le nom exact d'un objet du sac seulement si le héros le possède déjà, sinon "".
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
  },
  required: ['texte', 'emoji', 'objet_requis', 'epreuve_nom', 'epreuve_difficulte'],
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
    sac_ajouter: { type: 'array', items: OBJET_SCHEMA },
    sac_retirer: { type: 'array', items: { type: 'string' } },
    coeurs_delta: { type: 'integer', enum: [-1, 0, 1] },
    etoiles_delta: { type: 'integer', enum: [0, 1, 2] },
    choix: { type: 'array', items: CHOIX_SCHEMA },
    fin_titre: { type: 'string' },
    fin_message: { type: 'string' },
  },
  required: [
    'titre', 'texte', 'lieu', 'moment', 'acteurs', 'objets_decor', 'quete', 'memoire',
    'compagnon', 'personnages', 'promesse_plantee', 'promesse_payee', 'sac_ajouter', 'sac_retirer',
    'coeurs_delta', 'etoiles_delta', 'choix', 'fin_titre', 'fin_message',
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
    etat.inspiration ? `Retournement prévu (à amener au bon moment) : ${etat.inspiration.twist}` : '',
  ].filter(Boolean).join('\n');
}

function consigneLongueur(etat) {
  return etat.richesse === 'simple'
    ? 'Longueur : 4 à 5 phrases.'
    : 'Longueur : 6 à 8 phrases (l’enfant écoute : offre-lui du détail, du dialogue, un vrai décor).';
}

export function premierMessage(etat, idee) {
  const [nom, consigne] = etape(0, etat.longueur);
  return [
    blocEtat(etat),
    '',
    'DÉBUT DE L’AVENTURE',
    `Thème choisi par l'enfant : ${etat.theme}.`,
    idee ? `Idée en plus : ${idee}.` : '',
    carteInspiration(etat.inspiration),
    `ÉTAPE « ${nom} » — ${consigne}`,
    consigneLongueur(etat),
    'Écris le chapitre 1, puis donne 2 ou 3 choix.',
  ].filter(Boolean).join('\n');
}

export function messageSuivant(etat, action) {
  const resume = action?.resume || 'Il veut simplement connaître la suite.';
  const lignes = [blocEtat(etat), '', 'CE QUE L’ENFANT A FAIT', resume];
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
  if (etat.coeurs <= 1) {
    lignes.push("Le héros est fatigué : offre-lui un moment doux qui lui redonne du courage (coeurs_delta = 1).");
  }
  if (etat.chapitre + 1 >= etat.longueur) {
    lignes.push('C’est le DERNIER chapitre : termine l’aventure par une fin heureuse, choix vide, fin_titre et fin_message remplis.');
  } else if (etat.chapitre + 2 >= etat.longueur) {
    lignes.push('L’aventure se termine bientôt : commence le dénouement.');
  }
  const [nom, consigne] = etape(etat.chapitre, etat.longueur);
  lignes.push('', `ÉTAPE « ${nom} » — ${consigne}`, consigneLongueur(etat), 'Écris le chapitre suivant.');
  return lignes.join('\n');
}
