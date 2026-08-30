// État d'une aventure + application d'un chapitre reçu.
import { REGLAGES_DEFAUT } from './config.js';
import { memeIdee } from './util.js';

export function nouvelEtat({
  heros, theme, themeId, longueur = REGLAGES_DEFAUT.longueur, idee = '',
  richesse = REGLAGES_DEFAUT.richesse, inspiration = null, realiste = false,
  // Ces deux listes étaient reçues puis jetées : le premier chapitre d'une
  // histoire repartait donc sans aucune mémoire de ce qui avait déjà servi.
  objetsEvites = [], soucisEvites = [],
}) {
  return {
    id: `av-${Date.now()}`,
    heros,
    theme,
    themeId,
    idee,
    longueur,
    chapitre: 0,
    coeurs: 3,
    etoiles: 0,
    sac: [],
    compagnon: '',
    personnages: [],
    promesses: [],
    lieux: [],
    adversaire: null,
    objetsEvites,
    soucisEvites,
    souci: '',
    richesse,
    realiste,
    inspiration,
    quete: '',
    memoire: '',
    lieu: '',
    titre: '',
    termine: false,
    dernier: null,
    finTitre: '',
    finMessage: '',
    historique: [],   // messages envoyés au modèle
    chapitres: [],    // souvenirs affichés dans le carnet
  };
}

// Une partie enregistrée par une version plus ancienne n'a pas tous les champs :
// on les complète avant de s'en servir, sinon la reprise plante.
export function normaliserEtat(etat) {
  if (!etat || typeof etat !== 'object') return null;
  return {
    ...etat,
    heros: etat.heros || { prenom: 'Héros', avatar: '🦸' },
    longueur: Number(etat.longueur) || REGLAGES_DEFAUT.longueur,
    chapitre: Number(etat.chapitre) || 0,
    coeurs: Number.isFinite(etat.coeurs) ? etat.coeurs : 3,
    etoiles: Number(etat.etoiles) || 0,
    sac: Array.isArray(etat.sac) ? etat.sac : [],
    personnages: Array.isArray(etat.personnages) ? etat.personnages : [],
    promesses: Array.isArray(etat.promesses) ? etat.promesses : [],
    chapitres: Array.isArray(etat.chapitres) ? etat.chapitres : [],
    lieux: Array.isArray(etat.lieux) ? etat.lieux : [],
    objetsEvites: Array.isArray(etat.objetsEvites) ? etat.objetsEvites : [],
    adversaire: etat.adversaire || null,
    realiste: Boolean(etat.realiste),
    historique: Array.isArray(etat.historique) ? etat.historique : [],
    richesse: etat.richesse || REGLAGES_DEFAUT.richesse,
    quete: etat.quete || '',
    memoire: etat.memoire || '',
    compagnon: etat.compagnon || '',
    theme: etat.theme || 'une aventure',
    id: etat.id || `av-${Date.now()}`,
  };
}

const MAX_SAC = 6;
const MAX_GRAINES = 4;



export function appliquerChapitre(etat, chapitre) {
  // Ceinture et bretelles : une partie reprise d'une ancienne version peut
  // arriver ici sans certains tableaux.
  if (!Array.isArray(etat.sac)) etat.sac = [];
  if (!Array.isArray(etat.promesses)) etat.promesses = [];
  if (!Array.isArray(etat.personnages)) etat.personnages = [];
  if (!Array.isArray(etat.chapitres)) etat.chapitres = [];
  if (!Array.isArray(etat.lieux)) etat.lieux = [];
  const nouveaux = [];
  // Le souci n'est donné qu'au chapitre 1, et ne bouge plus ensuite.
  if (!etat.souci && chapitre.souci) etat.souci = String(chapitre.souci).trim();

  for (const objet of chapitre.sac_ajouter || []) {
    if (!objet?.nom) continue;
    if (etat.sac.some((o) => o.nom.toLowerCase() === objet.nom.toLowerCase())) continue;
    const propre = { nom: objet.nom, emoji: objet.emoji || '✨', pouvoir: objet.pouvoir || '' };
    etat.sac.push(propre);
    nouveaux.push(propre);
  }
  if (etat.sac.length > MAX_SAC) etat.sac = etat.sac.slice(etat.sac.length - MAX_SAC);

  for (const nom of chapitre.sac_retirer || []) {
    const i = etat.sac.findIndex((o) => o.nom.toLowerCase() === String(nom).toLowerCase());
    if (i >= 0) etat.sac.splice(i, 1);
  }

  // Bible de l'histoire : troupe rencontrée et graines narratives en attente.
  if (Array.isArray(chapitre.personnages) && chapitre.personnages.length) {
    etat.personnages = chapitre.personnages
      .filter((p) => p?.nom)
      .slice(0, 4)
      .map((p) => ({ nom: p.nom, emoji: p.emoji || '🙂', manie: p.manie || '' }));
  }
  if (chapitre.promesse_payee) {
    etat.promesses = etat.promesses.filter((g) => !memeIdee(g, chapitre.promesse_payee));
  }
  if (chapitre.promesse_plantee && !etat.promesses.some((g) => memeIdee(g, chapitre.promesse_plantee))) {
    etat.promesses.push(chapitre.promesse_plantee);
  }
  if (etat.promesses.length > MAX_GRAINES) etat.promesses = etat.promesses.slice(-MAX_GRAINES);

  // Carte des lieux : elle sert à revenir se balader dans un endroit connu.
  const nomLieu = (chapitre.lieu_nom || '').trim();
  if (nomLieu && !etat.lieux.some((l) => l.nom.toLowerCase() === nomLieu.toLowerCase())) {
    etat.lieux.push({ nom: nomLieu, decor: { lieu: chapitre.lieu, moment: chapitre.moment, acteurs: [], objets_decor: chapitre.objets_decor || [] }, chapitre: etat.chapitre + 1 });
    if (etat.lieux.length > 8) etat.lieux.shift();
  }

  // Rencontre costaude annoncée par le modèle : le jeu la met en scène.
  etat.adversaire = chapitre.adversaire_coeurs > 0 && chapitre.adversaire_nom
    ? {
      nom: chapitre.adversaire_nom,
      emoji: chapitre.adversaire_emoji || '👹',
      coeurs: chapitre.adversaire_coeurs,
      coeursMax: chapitre.adversaire_coeurs,
    }
    : null;

  const coeursAvant = etat.coeurs;
  etat.coeurs = Math.max(0, Math.min(3, etat.coeurs + (chapitre.coeurs_delta || 0)));
  etat.etoiles += chapitre.etoiles_delta || 0;
  if (chapitre.quete) etat.quete = chapitre.quete;
  if (chapitre.memoire) etat.memoire = chapitre.memoire;
  if (chapitre.compagnon !== undefined) etat.compagnon = chapitre.compagnon || etat.compagnon;
  if (chapitre.lieu) etat.lieu = chapitre.lieu;
  if (chapitre.titre && !etat.titre) etat.titre = chapitre.titre;

  etat.chapitre += 1;
  etat.dernier = chapitre;
  etat.chapitres.push({
    n: etat.chapitre,
    texte: chapitre.texte || [],
    objets: nouveaux.map((o) => o.nom),
    decor: {
      lieu: chapitre.lieu,
      moment: chapitre.moment,
      acteurs: chapitre.acteurs || [],
      objets_decor: chapitre.objets_decor || [],
    },
  });

  // Une fin doit se mériter : une rencontre costaude remplace les choix sans
  // terminer l'histoire, et un chapitre sans choix arrivé trop tôt est une
  // anomalie, pas un dénouement.
  const assezLoin = etat.chapitre >= Math.max(3, Math.round(etat.longueur * 0.5));
  const fini = assezLoin
    && (Boolean(chapitre.fin_titre) || (!(chapitre.choix || []).length && !etat.adversaire));
  if (fini) {
    etat.termine = true;
    etat.finTitre = chapitre.fin_titre || 'Bravo !';
    etat.finMessage = chapitre.fin_message || 'Quelle belle aventure !';
  }

  return { nouveaux, coeursGagnes: etat.coeurs - coeursAvant, fini };
}

// Le courage baisse quand une épreuve échoue : c'est la seule vraie sanction.
export function perdreCoeur(etat) {
  etat.coeurs = Math.max(0, etat.coeurs - 1);
  return etat.coeurs;
}

// À zéro courage, on ne perd pas l'histoire : un coup de pouce, un objet en
// moins, et on repart. C'est la version « livre dont on est le héros » clémente.
export function secourir(etat) {
  const perdu = etat.sac.length ? etat.sac.splice(Math.floor(Math.random() * etat.sac.length), 1)[0] : null;
  etat.coeurs = 2;
  etat.etoiles = Math.max(0, etat.etoiles - 1);
  return perdu;
}

// On garde un historique court : le modèle a la mémoire + l'état à chaque tour.
export function ajouterEchange(etat, messageUtilisateur, texteChapitre) {
  etat.historique.push({ role: 'user', content: messageUtilisateur });
  etat.historique.push({ role: 'assistant', content: texteChapitre });
  if (etat.historique.length > 8) etat.historique = etat.historique.slice(-8);
}

export function messagesPour(etat, messageUtilisateur) {
  return [...etat.historique, { role: 'user', content: messageUtilisateur }];
}
