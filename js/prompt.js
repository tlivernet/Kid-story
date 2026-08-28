// Instructions et schéma JSON envoyés à Claude.
import { LIEUX, MOMENTS } from './config.js';

export const SYSTEME = `Tu es « la Plume Magique », conteuse d'histoires interactives, à la manière des livres dont on est le héros.
Ton public : UN SEUL enfant de 6 ans, en France, qui apprend à lire. Il écoute l'histoire et la voit écrite en même temps.

STYLE (très important)
- Français, tutoiement, présent de narration.
- Phrases TRÈS courtes : 6 à 12 mots, une seule idée par phrase.
- Mots simples et concrets. Si un mot est rare, explique-le dans la phrase suivante.
- 4 à 6 phrases par chapitre, jamais plus.
- Ton chaleureux et drôle. Des bruits rigolos : « Boum ! », « Splash ! », « Crrrac ! ».
- Utilise souvent le prénom du héros.
- Des dialogues courts, avec des guillemets : Le renard dit : « Suis-moi ! »
- Jamais de titre, de numéro de chapitre ni d'emoji dans le champ texte.

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

RYTHME
- Chapitre 1 : présente le héros, le décor, un compagnon éventuel, et lance la quête en une phrase claire.
- Ensuite : une petite péripétie par chapitre, qui fait avancer la quête.
- Environ un chapitre sur trois propose une ÉPREUVE de dé (grimper, sauter, ruser, apprivoiser, chercher).
- Offre un objet utile de temps en temps (six objets maximum dans le sac). Un objet doit servir plus tard.
- Fais parler des personnages rencontrés : une question, une demande, une devinette facile.
- Quand on approche du dernier chapitre annoncé, prépare le dénouement, puis termine par une fin heureuse.

CHOIX
- Toujours 2 ou 3 choix, très courts (2 à 6 mots), vraiment différents, tous tentants.
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
    emoji: { type: 'string', description: 'un seul emoji illustrant le choix' },
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
    texte: { type: 'array', items: { type: 'string' }, description: '4 à 6 phrases courtes' },
    lieu: { type: 'string', enum: LIEUX },
    moment: { type: 'string', enum: MOMENTS },
    acteurs: { type: 'array', items: { type: 'string' }, description: '1 à 3 emojis' },
    objets_decor: { type: 'array', items: { type: 'string' }, description: '0 à 2 emojis' },
    quete: { type: 'string', description: "objectif en cours, moins de 10 mots" },
    memoire: { type: 'string', description: '3 à 5 faits courts, 400 caractères maximum' },
    compagnon: { type: 'string', description: 'nom + emoji du compagnon actuel, sinon chaîne vide' },
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
    'compagnon', 'sac_ajouter', 'sac_retirer', 'coeurs_delta', 'etoiles_delta', 'choix',
    'fin_titre', 'fin_message',
  ],
  additionalProperties: false,
};

// Bloc d'état relu par le modèle à chaque tour.
export function blocEtat(etat) {
  const sac = etat.sac.length ? etat.sac.map((o) => `${o.emoji} ${o.nom} (${o.pouvoir})`).join(', ') : 'vide';
  return [
    'ÉTAT DU JEU',
    `Héros : ${etat.heros.prenom} ${etat.heros.avatar}`,
    `Thème : ${etat.theme}`,
    `Chapitre ${etat.chapitre + 1} sur ${etat.longueur} prévus`,
    `Cœurs : ${etat.coeurs}/3 — Étoiles : ${etat.etoiles}`,
    `Sac : ${sac}`,
    `Compagnon : ${etat.compagnon || 'aucun'}`,
    `Quête : ${etat.quete || 'à définir'}`,
    `Lieu : ${etat.lieu || 'à choisir'}`,
    `Mémoire : ${etat.memoire || 'histoire toute neuve'}`,
  ].join('\n');
}

export function premierMessage(etat, idee) {
  return [
    blocEtat(etat),
    '',
    'DÉBUT DE L’AVENTURE',
    `Thème choisi par l'enfant : ${etat.theme}.`,
    idee ? `Idée en plus : ${idee}.` : '',
    `Écris le chapitre 1 : présente ${etat.heros.prenom}, plante le décor, lance une quête simple et donne 2 ou 3 choix.`,
  ].filter(Boolean).join('\n');
}

export function messageSuivant(etat, action) {
  const resume = action?.resume || 'Il veut simplement connaître la suite.';
  const lignes = [blocEtat(etat), '', 'CE QUE L’ENFANT A FAIT', resume];
  if (action?.epreuve) {
    const { nom, de, bonus, total, difficulte, reussi } = action.epreuve;
    lignes.push(
      `Épreuve « ${nom} » : dé ${de}${bonus ? ` + ${bonus} de bonus` : ''} = ${total} contre ${difficulte} → ${reussi ? 'RÉUSSITE' : 'ÉCHEC'}.`,
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
  lignes.push('Écris le chapitre suivant.');
  return lignes.join('\n');
}
